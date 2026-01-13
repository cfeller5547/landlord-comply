import { NextResponse } from "next/server";
import { requireDb } from "@/lib/db";
import { getDbUser } from "@/lib/auth";
import { createClient } from "@supabase/supabase-js";
import archiver from "archiver";

// Create Supabase client for file downloads (lazy initialization)
function getSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// Extract storage path from a Supabase public URL
function extractStoragePath(fileUrl: string): string | null {
  try {
    // URLs look like: https://xxx.supabase.co/storage/v1/object/public/case-files/documents/...
    const match = fileUrl.match(/\/case-files\/(.+)$/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

// GET /api/cases/[id]/proof-packet - Download proof packet ZIP
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getDbUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: caseId } = await params;
    const db = requireDb();

    // Fetch complete case data
    const caseData = await db.case.findUnique({
      where: { id: caseId, userId: user.id },
      include: {
        property: {
          include: {
            jurisdiction: true,
          },
        },
        tenants: true,
        deductions: true,
        documents: true,
        attachments: true,
        ruleSet: {
          include: {
            citations: true,
            penalties: true,
          },
        },
        auditEvents: {
          orderBy: { timestamp: "asc" },
        },
        checklistItems: {
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    if (!caseData) {
      return NextResponse.json({ error: "Case not found" }, { status: 404 });
    }

    // Check if required documents exist
    const hasNoticeLetter = caseData.documents.some(
      (d) => d.type === "NOTICE_LETTER"
    );
    const hasItemized = caseData.documents.some(
      (d) => d.type === "ITEMIZED_STATEMENT"
    );

    if (!hasNoticeLetter || !hasItemized) {
      return NextResponse.json(
        {
          error: "Cannot generate proof packet - missing required documents",
          missing: {
            noticeLetter: !hasNoticeLetter,
            itemizedStatement: !hasItemized,
          },
        },
        { status: 400 }
      );
    }

    // Create ZIP archive
    const archive = archiver("zip", { zlib: { level: 9 } });
    const chunks: Buffer[] = [];

    archive.on("data", (chunk) => chunks.push(chunk));
    archive.on("error", (err) => {
      throw err;
    });

    // 1. Add Case Summary
    const caseSummary = generateCaseSummary(caseData);
    archive.append(caseSummary, { name: "00_CASE_SUMMARY.txt" });

    // 2. Add Legal Citations
    const citations = generateCitationsDocument(caseData);
    archive.append(citations, { name: "01_LEGAL_CITATIONS.txt" });

    // 3. Add Audit Log
    const auditLog = generateAuditLog(caseData);
    archive.append(auditLog, { name: "02_AUDIT_LOG.txt" });

    // 4. Add Documents (PDFs)
    for (const doc of caseData.documents) {
      if (doc.fileUrl) {
        const storagePath = extractStoragePath(doc.fileUrl);
        if (storagePath) {
          try {
            const { data, error } = await getSupabaseClient().storage
              .from("case-files")
              .download(storagePath);

            if (!error && data) {
              const buffer = Buffer.from(await data.arrayBuffer());
              const filename =
                doc.type === "NOTICE_LETTER"
                  ? `03_Notice_Letter_v${doc.version}.pdf`
                  : `04_Itemized_Statement_v${doc.version}.pdf`;
              archive.append(buffer, { name: filename });
            }
          } catch (err) {
            console.error(`Failed to download document ${doc.id}:`, err);
          }
        }
      }
    }

    // 5. Add Attachments (evidence)
    if (caseData.attachments.length > 0) {
      for (let i = 0; i < caseData.attachments.length; i++) {
        const att = caseData.attachments[i];
        if (att.fileUrl) {
          const storagePath = extractStoragePath(att.fileUrl);
          if (storagePath) {
            try {
              const { data, error } = await getSupabaseClient().storage
                .from("case-files")
                .download(storagePath);

              if (!error && data) {
                const buffer = Buffer.from(await data.arrayBuffer());
                const safeType = att.type.toLowerCase().replace(/_/g, "-");
                archive.append(buffer, {
                  name: `evidence/${String(i + 1).padStart(2, "0")}_${safeType}_${att.name}`,
                });
              }
            } catch (err) {
              console.error(`Failed to download attachment ${att.id}:`, err);
            }
          }
        }
      }
    }

    // 6. Add Deductions Summary
    const deductionsSummary = generateDeductionsSummary(caseData);
    archive.append(deductionsSummary, { name: "05_DEDUCTIONS_SUMMARY.txt" });

    // Finalize archive
    await archive.finalize();

    // Wait for all chunks
    await new Promise<void>((resolve) => archive.on("end", resolve));

    const zipBuffer = Buffer.concat(chunks);

    // Generate filename
    const propertyAddress = caseData.property.address
      .replace(/[^a-zA-Z0-9]/g, "_")
      .substring(0, 30);
    const date = new Date().toISOString().split("T")[0];
    const filename = `ProofPacket_${propertyAddress}_${date}.zip`;

    // Log audit event
    await db.auditEvent.create({
      data: {
        caseId,
        action: "proof_packet_exported",
        description: "Proof packet ZIP exported",
        userId: user.id,
        metadata: {
          documentCount: caseData.documents.length,
          attachmentCount: caseData.attachments.length,
        },
      },
    });

    return new NextResponse(zipBuffer, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": String(zipBuffer.length),
      },
    });
  } catch (error) {
    console.error("Error generating proof packet:", error);
    return NextResponse.json(
      { error: "Failed to generate proof packet" },
      { status: 500 }
    );
  }
}

// Helper: Generate case summary text
function generateCaseSummary(caseData: any): string {
  const totalDeductions = caseData.deductions.reduce(
    (sum: number, d: any) => sum + Number(d.amount),
    0
  );
  const refundAmount =
    Number(caseData.depositAmount) +
    Number(caseData.depositInterest || 0) -
    totalDeductions;

  const tenantNames = caseData.tenants.map((t: any) => t.name).join(", ");
  const primaryTenant = caseData.tenants.find((t: any) => t.isPrimary);

  return `
================================================================================
                         SECURITY DEPOSIT PROOF PACKET
================================================================================

Generated: ${new Date().toLocaleString()}
Case ID: ${caseData.id}

--------------------------------------------------------------------------------
PROPERTY INFORMATION
--------------------------------------------------------------------------------
Address: ${caseData.property.address}${caseData.property.unit ? `, Unit ${caseData.property.unit}` : ""}
City: ${caseData.property.city}, ${caseData.property.state} ${caseData.property.zipCode}
Jurisdiction: ${caseData.property.jurisdiction?.city || caseData.property.jurisdiction?.state || "Unknown"}

--------------------------------------------------------------------------------
TENANT INFORMATION
--------------------------------------------------------------------------------
Tenant(s): ${tenantNames}
Primary Contact: ${primaryTenant?.name || "N/A"}
Email: ${primaryTenant?.email || "N/A"}
Phone: ${primaryTenant?.phone || "N/A"}
Forwarding Address: ${primaryTenant?.forwardingAddress || "Not provided"}

--------------------------------------------------------------------------------
LEASE & DEPOSIT DETAILS
--------------------------------------------------------------------------------
Lease Start Date: ${new Date(caseData.leaseStartDate).toLocaleDateString()}
Lease End Date: ${new Date(caseData.leaseEndDate).toLocaleDateString()}
Move-Out Date: ${new Date(caseData.moveOutDate).toLocaleDateString()}
Return Deadline: ${new Date(caseData.dueDate).toLocaleDateString()}

Security Deposit: $${Number(caseData.depositAmount).toFixed(2)}
Interest Accrued: $${Number(caseData.depositInterest || 0).toFixed(2)}
Total Deductions: $${totalDeductions.toFixed(2)}
${refundAmount >= 0 ? "Refund Due" : "Amount Owed"}: $${Math.abs(refundAmount).toFixed(2)}

--------------------------------------------------------------------------------
DELIVERY INFORMATION
--------------------------------------------------------------------------------
Status: ${caseData.status}
${caseData.sentDate ? `Sent Date: ${new Date(caseData.sentDate).toLocaleDateString()}` : "Not yet sent"}
${caseData.deliveryMethod ? `Delivery Method: ${caseData.deliveryMethod.replace("_", " ")}` : ""}
${caseData.trackingNumber ? `Tracking Number: ${caseData.trackingNumber}` : ""}
${caseData.deliveryAddress ? `Delivery Address: ${caseData.deliveryAddress}` : ""}

--------------------------------------------------------------------------------
CASE STATUS
--------------------------------------------------------------------------------
Current Status: ${caseData.status}
${caseData.closedAt ? `Closed: ${new Date(caseData.closedAt).toLocaleDateString()}` : ""}
${caseData.closedReason ? `Reason: ${caseData.closedReason}` : ""}

================================================================================
This proof packet was generated by LandlordComply.
For questions, contact: support@landlordcomply.com
================================================================================
`.trim();
}

// Helper: Generate citations document
function generateCitationsDocument(caseData: any): string {
  const citations = caseData.ruleSet?.citations || [];
  const penalties = caseData.ruleSet?.penalties || [];

  let doc = `
================================================================================
                         LEGAL CITATIONS & REFERENCES
================================================================================

Jurisdiction: ${caseData.property.jurisdiction?.city || ""} ${caseData.property.jurisdiction?.state || ""}
Rule Set Version: ${caseData.ruleSet?.version || "Unknown"}
Effective Date: ${caseData.ruleSet?.effectiveDate ? new Date(caseData.ruleSet.effectiveDate).toLocaleDateString() : "Unknown"}
Last Verified: ${caseData.ruleSet?.verifiedAt ? new Date(caseData.ruleSet.verifiedAt).toLocaleDateString() : "Unknown"}

--------------------------------------------------------------------------------
APPLICABLE RULES
--------------------------------------------------------------------------------
Return Deadline: ${caseData.ruleSet?.returnDeadlineDays || "N/A"} days
${caseData.ruleSet?.returnDeadlineDescription || ""}

Interest Required: ${caseData.ruleSet?.interestRequired ? "Yes" : "No"}
${caseData.ruleSet?.interestRate ? `Interest Rate: ${caseData.ruleSet.interestRate}%` : ""}

Itemization Required: ${caseData.ruleSet?.itemizationRequired ? "Yes" : "No"}
${caseData.ruleSet?.itemizationRequirements || ""}

Allowed Delivery Methods:
${(caseData.ruleSet?.allowedDeliveryMethods || []).map((m: string) => `  - ${m.replace("_", " ")}`).join("\n")}

--------------------------------------------------------------------------------
STATUTORY CITATIONS
--------------------------------------------------------------------------------
`;

  for (const citation of citations) {
    doc += `
${citation.code}
${citation.title || ""}
${citation.url ? `Source: ${citation.url}` : ""}
${citation.excerpt ? `\nRelevant excerpt:\n"${citation.excerpt}"` : ""}
---
`;
  }

  if (penalties.length > 0) {
    doc += `
--------------------------------------------------------------------------------
PENALTY PROVISIONS
--------------------------------------------------------------------------------
`;
    for (const penalty of penalties) {
      doc += `
Condition: ${penalty.condition}
Penalty: ${penalty.penalty}
${penalty.description || ""}
---
`;
    }
  }

  doc += `
================================================================================
DISCLAIMER: This document is for informational purposes only and does not
constitute legal advice. Consult an attorney for specific legal questions.
================================================================================
`;

  return doc.trim();
}

// Helper: Generate audit log
function generateAuditLog(caseData: any): string {
  let log = `
================================================================================
                              AUDIT LOG
================================================================================

Case ID: ${caseData.id}
Generated: ${new Date().toLocaleString()}

This log records all significant actions taken on this case.

--------------------------------------------------------------------------------
EVENT HISTORY
--------------------------------------------------------------------------------
`;

  for (const event of caseData.auditEvents || []) {
    const eventTime = new Date(event.timestamp).toLocaleString();
    log += `
[${eventTime}] ${event.action.toUpperCase()}
${event.description}
`;
  }

  if (!caseData.auditEvents?.length) {
    log += "\nNo audit events recorded.\n";
  }

  log += `
--------------------------------------------------------------------------------
CHECKLIST STATUS
--------------------------------------------------------------------------------
`;

  for (const item of caseData.checklistItems || []) {
    const status = item.completed ? "[X]" : "[ ]";
    const completedAt = item.completedAt
      ? ` (completed ${new Date(item.completedAt).toLocaleDateString()})`
      : "";
    log += `${status} ${item.label}${completedAt}\n`;
  }

  log += `
================================================================================
End of Audit Log
================================================================================
`;

  return log.trim();
}

// Helper: Generate deductions summary
function generateDeductionsSummary(caseData: any): string {
  const totalDeductions = caseData.deductions.reduce(
    (sum: number, d: any) => sum + Number(d.amount),
    0
  );

  let doc = `
================================================================================
                         ITEMIZED DEDUCTIONS SUMMARY
================================================================================

Case ID: ${caseData.id}
Property: ${caseData.property.address}${caseData.property.unit ? `, Unit ${caseData.property.unit}` : ""}

--------------------------------------------------------------------------------
DEDUCTIONS
--------------------------------------------------------------------------------
`;

  if (caseData.deductions.length === 0) {
    doc += "\nNo deductions claimed. Full deposit being returned.\n";
  } else {
    for (let i = 0; i < caseData.deductions.length; i++) {
      const d = caseData.deductions[i];
      doc += `
${i + 1}. ${d.description}
   Category: ${d.category}
   Amount: $${Number(d.amount).toFixed(2)}
   ${d.damageType ? `Damage Type: ${d.damageType.replace("_", " ")}` : ""}
   ${d.itemAge ? `Item Age: ${d.itemAge} months` : ""}
   ${d.riskLevel ? `Risk Assessment: ${d.riskLevel}` : ""}
   ${d.hasEvidence ? "Evidence: Attached" : "Evidence: None attached"}
   ${d.aiGenerated ? "(Description improved with AI assistance)" : ""}
`;
    }
  }

  doc += `
--------------------------------------------------------------------------------
SUMMARY
--------------------------------------------------------------------------------
Security Deposit:     $${Number(caseData.depositAmount).toFixed(2)}
Interest:             $${Number(caseData.depositInterest || 0).toFixed(2)}
                      ──────────────
Subtotal:             $${(Number(caseData.depositAmount) + Number(caseData.depositInterest || 0)).toFixed(2)}
Less Deductions:     -$${totalDeductions.toFixed(2)}
                      ══════════════
${Number(caseData.depositAmount) + Number(caseData.depositInterest || 0) - totalDeductions >= 0 ? "REFUND DUE" : "AMOUNT OWED"}:           $${Math.abs(Number(caseData.depositAmount) + Number(caseData.depositInterest || 0) - totalDeductions).toFixed(2)}

================================================================================
`;

  return doc.trim();
}
