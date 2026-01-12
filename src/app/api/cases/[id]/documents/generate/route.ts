import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { requireDb } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { NoticeLetterPDF } from "@/lib/pdf/notice-letter";
import { ItemizedStatementPDF } from "@/lib/pdf/itemized-statement";
import { createClient } from "@/lib/supabase/server";
import { DocumentType as PrismaDocumentType } from "@prisma/client";

type DocumentType = "notice_letter" | "itemized_statement";

const documentTypeMap: Record<DocumentType, PrismaDocumentType> = {
  notice_letter: "NOTICE_LETTER",
  itemized_statement: "ITEMIZED_STATEMENT",
};

// POST /api/cases/[id]/documents/generate - Generate a PDF document
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: caseId } = await params;
    const db = requireDb();
    const body = await request.json();
    const { type } = body as { type: DocumentType };

    if (!type || !["notice_letter", "itemized_statement"].includes(type)) {
      return NextResponse.json(
        { error: "Invalid document type" },
        { status: 400 }
      );
    }

    // Fetch case with all related data
    const caseData = await db.case.findUnique({
      where: { id: caseId, userId: user.id },
      include: {
        property: {
          include: {
            jurisdiction: true,
          },
        },
        tenants: {
          where: { isPrimary: true },
          take: 1,
        },
        deductions: true,
        ruleSet: {
          include: {
            citations: true,
          },
        },
      },
    });

    if (!caseData) {
      return NextResponse.json({ error: "Case not found" }, { status: 404 });
    }

    const tenant = caseData.tenants[0];
    if (!tenant) {
      return NextResponse.json(
        { error: "No tenant found for this case" },
        { status: 400 }
      );
    }

    const rules = caseData.ruleSet;
    const jurisdictionName = caseData.property.jurisdiction.city
      ? `${caseData.property.jurisdiction.city}, ${caseData.property.jurisdiction.state}`
      : caseData.property.jurisdiction.state;

    let pdfBuffer: Buffer;
    let fileName: string;

    if (type === "notice_letter") {
      const totalDeductions = caseData.deductions.reduce(
        (sum, d) => sum + Number(d.amount),
        0
      );
      const depositAmount = Number(caseData.depositAmount);
      const depositInterest = Number(caseData.depositInterest || 0);
      const refundAmount = depositAmount + depositInterest - totalDeductions;

      const element = NoticeLetterPDF({
        landlordName: user.user_metadata?.name || user.email?.split("@")[0] || "Property Owner",
        landlordAddress: "", // TODO: Get from user profile
        landlordCity: "",
        landlordState: "",
        landlordZip: "",
        tenantName: tenant.name,
        forwardingAddress: tenant.forwardingAddress || undefined,
        propertyAddress: caseData.property.address,
        propertyCity: caseData.property.city,
        propertyState: caseData.property.state,
        propertyZip: caseData.property.zipCode,
        moveOutDate: caseData.moveOutDate,
        noticeDate: new Date(),
        dueDate: caseData.dueDate,
        depositAmount,
        depositInterest,
        deductions: caseData.deductions.map((d) => ({
          description: d.description,
          category: d.category,
          amount: Number(d.amount),
          notes: d.notes || undefined,
        })),
        refundAmount,
        returnDeadlineDays: rules.returnDeadlineDays,
        jurisdictionName,
        citations: rules.citations.map((c) => c.code),
      });

      pdfBuffer = await renderToBuffer(element);
      fileName = `notice-letter-${caseId.slice(0, 8)}-${Date.now()}.pdf`;
    } else {
      const element = ItemizedStatementPDF({
        caseId,
        statementDate: new Date(),
        tenantName: tenant.name,
        propertyAddress: caseData.property.address,
        propertyCity: caseData.property.city,
        propertyState: caseData.property.state,
        propertyZip: caseData.property.zipCode,
        leaseStartDate: caseData.leaseStartDate,
        leaseEndDate: caseData.leaseEndDate,
        moveOutDate: caseData.moveOutDate,
        depositAmount: Number(caseData.depositAmount),
        depositInterest: Number(caseData.depositInterest || 0),
        deductions: caseData.deductions.map((d) => ({
          id: d.id,
          description: d.description,
          category: d.category,
          amount: Number(d.amount),
          notes: d.notes || undefined,
        })),
        jurisdictionName,
        returnDeadlineDays: rules.returnDeadlineDays,
        itemizationRequirements: rules.itemizationRequirements || undefined,
        citations: rules.citations.map((c) => ({
          code: c.code,
          title: c.title || c.code,
          url: c.url || undefined,
        })),
      });

      pdfBuffer = await renderToBuffer(element);
      fileName = `itemized-statement-${caseId.slice(0, 8)}-${Date.now()}.pdf`;
    }

    // Upload to Supabase Storage
    const supabase = await createClient();
    const filePath = `documents/${user.id}/${caseId}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("case-files")
      .upload(filePath, pdfBuffer, {
        contentType: "application/pdf",
        upsert: false,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      // Continue anyway - we can still return the PDF even if storage fails
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("case-files")
      .getPublicUrl(filePath);

    // Find existing document to get version
    const prismaDocType = documentTypeMap[type];
    const existingDoc = await db.document.findFirst({
      where: { caseId, type: prismaDocType },
      orderBy: { version: "desc" },
    });

    const newVersion = (existingDoc?.version || 0) + 1;

    // Create document record
    const document = await db.document.create({
      data: {
        caseId,
        type: prismaDocType,
        version: newVersion,
        fileUrl: urlData?.publicUrl || filePath,
        fileName,
        generatedAt: new Date(),
        generatedBy: user.id,
      },
    });

    // Log audit event
    await db.auditEvent.create({
      data: {
        caseId,
        action: "document_generated",
        description: `Generated ${type.replace("_", " ")} (v${newVersion})`,
        userId: user.id,
        metadata: { documentId: document.id, type, version: newVersion },
      },
    });

    // Update checklist if applicable
    const checklistLabel =
      type === "notice_letter"
        ? "Generate notice letter"
        : "Generate itemized statement";

    await db.checklistItem.updateMany({
      where: {
        caseId,
        label: { contains: checklistLabel, mode: "insensitive" },
      },
      data: { completed: true, completedAt: new Date() },
    });

    // Return PDF as download - convert Buffer to Uint8Array for Response compatibility
    return new Response(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "X-Document-Id": document.id,
        "X-Document-Version": newVersion.toString(),
      },
    });
  } catch (error) {
    console.error("Error generating document:", error);
    return NextResponse.json(
      { error: "Failed to generate document" },
      { status: 500 }
    );
  }
}
