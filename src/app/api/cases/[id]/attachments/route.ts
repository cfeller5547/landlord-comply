import { NextResponse } from "next/server";
import { requireDb } from "@/lib/db";
import { getDbUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

// GET /api/cases/[id]/attachments - List attachments for a case
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getDbUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const db = requireDb();

    // Verify case ownership
    const caseData = await db.case.findUnique({
      where: { id, userId: user.id },
    });

    if (!caseData) {
      return NextResponse.json({ error: "Case not found" }, { status: 404 });
    }

    const attachments = await db.attachment.findMany({
      where: { caseId: id },
      orderBy: { uploadedAt: "desc" },
    });

    return NextResponse.json(attachments);
  } catch (error) {
    console.error("Error fetching attachments:", error);
    return NextResponse.json(
      { error: "Failed to fetch attachments" },
      { status: 500 }
    );
  }
}

// POST /api/cases/[id]/attachments - Upload an attachment
export async function POST(
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

    // Verify case ownership
    const caseData = await db.case.findUnique({
      where: { id: caseId, userId: user.id },
    });

    if (!caseData) {
      return NextResponse.json({ error: "Case not found" }, { status: 404 });
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const tags = formData.get("tags") as string | null;
    const deductionId = formData.get("deductionId") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/heic",
    ];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Allowed: PDF, JPEG, PNG, WebP, HEIC" },
        { status: 400 }
      );
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 10MB" },
        { status: 400 }
      );
    }

    // Determine file type category - use Prisma enum values
    const fileType = file.type.startsWith("image/") ? "PHOTO" : "OTHER";

    // Generate unique filename
    const ext = file.name.split(".").pop() || "bin";
    const timestamp = Date.now();
    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const fileName = `${timestamp}-${safeName}`;
    const filePath = `attachments/${user.id}/${caseId}/${fileName}`;

    // Upload to Supabase Storage
    const supabase = await createClient();
    const fileBuffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await supabase.storage
      .from("case-files")
      .upload(filePath, fileBuffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return NextResponse.json(
        { 
          error: "Failed to upload file. Make sure the storage bucket exists.",
          details: uploadError.message,
          stack: process.env.NODE_ENV === "development" ? uploadError : undefined
        },
        { status: 500 }
      );
    }

    // Get signed URL for the file
    const { data: urlData } = await supabase.storage
      .from("case-files")
      .createSignedUrl(filePath, 60 * 60 * 24 * 365); // 1 year expiry

    const fileUrl = urlData?.signedUrl || filePath;

    // Parse tags
    const tagArray = tags
      ? tags.split(",").map((t) => t.trim()).filter(Boolean)
      : [];

    // Create attachment record
    const attachment = await db.attachment.create({
      data: {
        caseId,
        name: file.name,
        type: fileType,
        fileUrl,
        fileName,
        fileSize: file.size,
        mimeType: file.type,
        tags: tagArray,
      },
    });

    // Link to deduction if provided
    if (deductionId) {
      const deduction = await db.deduction.findUnique({
        where: { id: deductionId, caseId },
      });

      if (deduction) {
        await db.deduction.update({
          where: { id: deductionId },
          data: {
            attachmentIds: [...deduction.attachmentIds, attachment.id],
          },
        });
      }
    }

    // Log audit event
    await db.auditEvent.create({
      data: {
        caseId,
        action: "attachment_uploaded",
        description: `Uploaded file: ${file.name}`,
        userId: user.id,
        metadata: {
          attachmentId: attachment.id,
          fileName: file.name,
          fileType,
          sizeBytes: file.size,
        },
      },
    });

    return NextResponse.json(attachment, { status: 201 });
  } catch (error) {
    console.error("Error uploading attachment:", error);
    return NextResponse.json(
      { error: "Failed to upload attachment" },
      { status: 500 }
    );
  }
}

// DELETE /api/cases/[id]/attachments - Delete an attachment
export async function DELETE(
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
    const { attachmentId } = await request.json();

    // Verify case ownership
    const caseData = await db.case.findUnique({
      where: { id: caseId, userId: user.id },
    });

    if (!caseData) {
      return NextResponse.json({ error: "Case not found" }, { status: 404 });
    }

    // Find attachment
    const attachment = await db.attachment.findUnique({
      where: { id: attachmentId, caseId },
    });

    if (!attachment) {
      return NextResponse.json(
        { error: "Attachment not found" },
        { status: 404 }
      );
    }

    // Delete from Supabase Storage
    const supabase = await createClient();
    const filePath = attachment.fileUrl.includes("attachments/")
      ? attachment.fileUrl.split("attachments/").pop()
      : null;

    if (filePath) {
      await supabase.storage
        .from("case-files")
        .remove([`attachments/${filePath}`]);
    }

    // Remove from any deductions
    const deductions = await db.deduction.findMany({
      where: {
        caseId,
        attachmentIds: { has: attachmentId },
      },
    });

    for (const deduction of deductions) {
      await db.deduction.update({
        where: { id: deduction.id },
        data: {
          attachmentIds: deduction.attachmentIds.filter(
            (id) => id !== attachmentId
          ),
        },
      });
    }

    // Delete attachment record
    await db.attachment.delete({
      where: { id: attachmentId },
    });

    // Log audit event
    await db.auditEvent.create({
      data: {
        caseId,
        action: "attachment_deleted",
        description: `Deleted file: ${attachment.name}`,
        userId: user.id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting attachment:", error);
    return NextResponse.json(
      { error: "Failed to delete attachment" },
      { status: 500 }
    );
  }
}
