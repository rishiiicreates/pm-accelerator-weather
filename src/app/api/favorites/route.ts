import { NextRequest, NextResponse } from "next/server";
import { getFavorites, createFavorite } from "../../../lib/db";

// GET /api/favorites - Read all saved locations
export async function GET() {
  try {
    const list = getFavorites();
    return NextResponse.json(list);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/favorites - Create a new favorite location (CRUD: Create)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, country, lat, lon, notes, tag } = body;

    if (!name || lat === undefined || lon === undefined) {
      return NextResponse.json(
        { error: "Missing required fields: name, lat, and lon." },
        { status: 400 }
      );
    }

    const created = createFavorite({
      name,
      country: country || "",
      lat: Number(lat),
      lon: Number(lon),
      notes: notes || "",
      tag: tag || "Favorite",
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
