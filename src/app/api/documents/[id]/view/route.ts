import { NextResponse } from "next/server";
import { requireDb } from "@/lib/db";
import { getDbUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

// GET /api/documents/[id]/view - View a document (redirect to signed URL)
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

    // Fetch document and verify ownership
    const document = await db.document.findUnique({
      where: { id },
      include: {
        case: {
          select: { id: true, userId: true },
        },
      },
    });

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    if (document.case.userId !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Check if document has a file associated
    if (!document.fileName) {
      return NextResponse.json(
        { error: "Document has no file associated" },
        { status: 400 }
      );
    }

    // Reconstruct the file path in storage
    const filePath = `documents/${user.id}/${document.case.id}/${document.fileName}`;

    // Create signed URL using admin client
    const supabase = createAdminClient();
    const { data, error } = await supabase.storage
      .from("case-files")
      .createSignedUrl(filePath, 300); // Valid for 5 minutes for viewing

    if (error || !data?.signedUrl) {
      console.error("Failed to generate signed URL:", error);
      return NextResponse.json(
        {
          error: "Failed to generate view link",
          details: error?.message || "No signed URL returned"
        },
        { status: 500 }
      );
    }

    // Redirect to the signed URL
    return NextResponse.redirect(data.signedUrl);

  } catch (error) {
    console.error("Error viewing document:", error);
    return NextResponse.json(
      { error: "Failed to view document" },
      { status: 500 }
    );
  }
}
