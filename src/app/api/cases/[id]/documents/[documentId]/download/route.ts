import { NextResponse } from "next/server";
import { requireDb } from "@/lib/db";
import { getDbUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

// GET /api/cases/[id]/documents/[documentId]/download
// Generates a signed URL for a document and redirects to it
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; documentId: string }> }
) {
  try {
    const user = await getDbUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: caseId, documentId } = await params;
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
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    if (document.case.userId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!document.fileName) {
      return NextResponse.json({ error: "Document has no file associated" }, { status: 400 });
    }

    // Reconstruct the file path in storage
    // Pattern: documents/{userId}/{caseId}/{fileName}
    // This matches how it's saved in generate/route.ts
    const filePath = `documents/${user.id}/${caseId}/${document.fileName}`;

    // Create signed URL using admin client
    const supabase = createAdminClient();
    const { data, error } = await supabase.storage
      .from("case-files")
      .createSignedUrl(filePath, 60); // Valid for 60 seconds

    if (error || !data?.signedUrl) {
      console.error("Error creating signed URL:", error);
      return NextResponse.json(
        { 
          error: "Failed to generate download link",
          details: error?.message || "No signed URL returned",
          debug_path: filePath 
        },
        { status: 500 }
      );
    }

    // Redirect to the signed URL
    return NextResponse.redirect(data.signedUrl);
  } catch (error) {
    console.error("Error in download route:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
