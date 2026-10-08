import { NextRequest, NextResponse } from "next/server";
import { updateFavorite, deleteFavorite, getFavoriteById } from "../../../../lib/db";

// PUT /api/favorites/[id] - Update favorite item (CRUD: Update)
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const numId = parseInt(id, 10);
    if (isNaN(numId)) {
      return NextResponse.json({ error: "Invalid ID parameter" }, { status: 400 });
    }

    const body = await req.json();
    const success = updateFavorite(numId, body);
    if (!success) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    const updated = getFavoriteById(numId);
    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/favorites/[id] - Delete favorite item (CRUD: Delete)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const numId = parseInt(id, 10);
    if (isNaN(numId)) {
      return NextResponse.json({ error: "Invalid ID parameter" }, { status: 400 });
    }

    const success = deleteFavorite(numId);
    if (!success) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Favorite deleted successfully", id: numId });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
