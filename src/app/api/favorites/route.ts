import { NextRequest, NextResponse } from "next/server";
import { getFavorites, createFavorite } from "../../../lib/db";

// get saved locations
export async function GET() {
  try {
    const list = getFavorites();
    return NextResponse.json(list);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// add location to favorites
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, country, notes, tag } = body;
    const rawLat = body.lat !== undefined ? body.lat : body.latitude;
    const rawLon = body.lon !== undefined ? body.lon : body.longitude;

    if (!name || rawLat === undefined || rawLon === undefined) {
      return NextResponse.json(
        { error: "Missing required fields: name, lat/latitude, and lon/longitude." },
        { status: 400 }
      );
    }

    const created = createFavorite({
      name,
      country: country || "",
      lat: Number(rawLat),
      lon: Number(rawLon),
      notes: notes || "",
      tag: tag || "Favorite",
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
