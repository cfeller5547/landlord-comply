import { NextResponse } from "next/server";
import { requireDb } from "@/lib/db";
import { getDbUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { logger } from "@/lib/logger";

// GET /api/cases/[id]/documents/[documentId]/download
// Generates a signed URL for a document and redirects to it
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; documentId: string }> }
) {
  try {
    const user = await getDbUser();
    if (!user) {
      logger.warn("Download attempt unauthorized", { url: request.url });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: caseId, documentId } = await params;
    logger.info("Document download requested", { userId: user.id, caseId, documentId });

    const db = requireDb();

    // Fetch document to verify ownership and get file details
    const document = await db.document.findUnique({
      where: { id: documentId },
      include: {
        case: {
          select: { userId: true },
        },
      },
    });

    if (!document) {
      logger.warn("Document not found for download", { documentId, caseId });
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    if (document.case.userId !== user.id) {
      logger.warn("Download forbidden - user mismatch", { 
        requesterId: user.id, 
        ownerId: document.case.userId,
        documentId 
      });
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!document.fileName) {
      logger.error("Document has no fileName", { documentId });
      return NextResponse.json({ error: "Document has no file associated" }, { status: 400 });
    }

    // Reconstruct the file path in storage
    const filePath = `documents/${user.id}/${caseId}/${document.fileName}`;
    logger.debug("Generating signed URL for path", { filePath });

    // Create signed URL using admin client
    const supabase = createAdminClient();
    const { data, error } = await supabase.storage
      .from("case-files")
      .createSignedUrl(filePath, 60); // Valid for 60 seconds

    if (error || !data?.signedUrl) {
      logger.error("Supabase createSignedUrl failed", { 
        error: error?.message, 
        filePath,
        documentId 
      });
      return NextResponse.json(
        { 
          error: "Failed to generate download link",
          details: error?.message || "No signed URL returned",
          debug_path: filePath 
        },
        { status: 500 }
      );
    }

    logger.info("Signed URL generated successfully", { documentId, filePath });

    // Redirect to the signed URL
    return NextResponse.redirect(data.signedUrl);
  } catch (error) {
    logger.error("Unhandled error in download route", { 
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
