import { NextResponse } from "next/server";
import { requireDb } from "@/lib/db";
import { getDbUser } from "@/lib/auth";

// PATCH /api/cases/[id]/tenants/[tenantId]/forwarding-address - Update forwarding address status
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; tenantId: string }> }
) {
  try {
    const user = await getDbUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: caseId, tenantId } = await params;
    const db = requireDb();
    const body = await request.json();
    const { forwardingAddress, status, requestMethod } = body;

    // Verify case ownership
    const caseData = await db.case.findUnique({
      where: { id: caseId, userId: user.id },
    });

    if (!caseData) {
      return NextResponse.json({ error: "Case not found" }, { status: 404 });
    }

    // Find tenant
    const tenant = await db.tenant.findUnique({
      where: { id: tenantId, caseId },
    });

    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    // Build update data
    const updateData: any = {};

    if (forwardingAddress !== undefined) {
      updateData.forwardingAddress = forwardingAddress;
      if (forwardingAddress) {
        updateData.forwardingAddressStatus = "PROVIDED";
      }
    }

    if (status) {
      updateData.forwardingAddressStatus = status;
      if (status === "REQUESTED") {
        updateData.forwardingAddressRequestedAt = new Date();
        if (requestMethod) {
          updateData.forwardingAddressRequestMethod = requestMethod;
        }
      }
    }

    // Update tenant
    const updatedTenant = await db.tenant.update({
      where: { id: tenantId },
      data: updateData,
    });

    // Log audit event
    await db.auditEvent.create({
      data: {
        caseId,
        action: "forwarding_address_updated",
        description: status === "REQUESTED"
          ? `Forwarding address requested from ${tenant.name} via ${requestMethod || "unspecified method"}`
          : forwardingAddress
          ? `Forwarding address provided for ${tenant.name}`
          : `Forwarding address status updated for ${tenant.name}: ${status}`,
        userId: user.id,
        metadata: {
          tenantId,
          status: updateData.forwardingAddressStatus,
          requestMethod,
        },
      },
    });

    return NextResponse.json(updatedTenant);
  } catch (error) {
    console.error("Error updating forwarding address:", error);
    return NextResponse.json(
      { error: "Failed to update forwarding address" },
      { status: 500 }
    );
  }
}

// GET /api/cases/[id]/tenants/[tenantId]/forwarding-address/template - Get request template
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; tenantId: string }> }
) {
  try {
    const user = await getDbUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: caseId, tenantId } = await params;
    const { searchParams } = new URL(request.url);
    const format = searchParams.get("format") || "email";

    const db = requireDb();

    // Verify case ownership and get data
    const caseData = await db.case.findUnique({
      where: { id: caseId, userId: user.id },
      include: {
        property: true,
        tenants: {
          where: { id: tenantId },
        },
        ruleSet: true,
      },
    });

    if (!caseData) {
      return NextResponse.json({ error: "Case not found" }, { status: 404 });
    }

    const tenant = caseData.tenants[0];
    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    const landlordName = user.name || "Property Owner";
    const propertyAddress = `${caseData.property.address}${caseData.property.unit ? `, Unit ${caseData.property.unit}` : ""}, ${caseData.property.city}, ${caseData.property.state} ${caseData.property.zipCode}`;
    const returnDeadline = new Date(caseData.dueDate).toLocaleDateString();

    if (format === "email") {
      const emailTemplate = {
        subject: `Request for Forwarding Address - ${caseData.property.address}`,
        body: `Dear ${tenant.name},

This letter is to request your current forwarding address in connection with your former tenancy at:

${propertyAddress}

As your former landlord, I am required to provide you with an itemized statement of any security deposit deductions and/or a refund of your security deposit. Under ${caseData.property.state} law, this must be completed by ${returnDeadline}.

To ensure you receive this important correspondence, please provide your current mailing address by responding to this email or contacting me at your earliest convenience.

If I do not receive a forwarding address, any correspondence will be sent to your last known address on file.

Thank you for your prompt attention to this matter.

Sincerely,
${landlordName}`,
      };

      return NextResponse.json(emailTemplate);
    } else {
      // Printable letter format
      const letterTemplate = {
        content: `${new Date().toLocaleDateString()}

${tenant.name}
[Last Known Address]

RE: Request for Forwarding Address
Property: ${propertyAddress}

Dear ${tenant.name}:

This letter is to formally request your current forwarding address in connection with your former tenancy at the above-referenced property.

As your former landlord, I am required by ${caseData.property.state} law to provide you with:
- An itemized statement of any security deposit deductions
- A refund of your security deposit (if applicable)

This must be completed by ${returnDeadline}.

Please provide your current mailing address by:
- Email: [Your Email]
- Phone: [Your Phone]
- Mail: [Your Address]

If I do not receive a forwarding address by [Date], any correspondence will be sent to your last known address.

Sincerely,


_______________________
${landlordName}

Date sent: _____________
Method: [ ] Hand delivered  [ ] First class mail  [ ] Certified mail
`,
      };

      return NextResponse.json(letterTemplate);
    }
  } catch (error) {
    console.error("Error generating template:", error);
    return NextResponse.json(
      { error: "Failed to generate template" },
      { status: 500 }
    );
  }
}
