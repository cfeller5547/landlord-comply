import { NextResponse } from "next/server";
import { requireDb } from "@/lib/db";
import { getDbUser } from "@/lib/auth";

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
        case: true,
      },
    });

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    if (document.case.userId !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // For now, redirect to the public URL if stored publicly, or signed URL
    // Since we're using public buckets for beta, just redirect to fileUrl
    return NextResponse.redirect(document.fileUrl || "");

  } catch (error) {
    console.error("Error viewing document:", error);
    return NextResponse.json(
      { error: "Failed to view document" },
      { status: 500 }
    );
  }
}
