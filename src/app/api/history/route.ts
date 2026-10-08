import { NextRequest, NextResponse } from "next/server";
import { getHistory, deleteHistoryItem, clearHistory } from "../../../lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "30", 10);
    const history = getHistory(limit);
    return NextResponse.json(history);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (id) {
      const numId = parseInt(id, 10);
      deleteHistoryItem(numId);
      return NextResponse.json({ message: "Search item deleted", id: numId });
    } else {
      clearHistory();
      return NextResponse.json({ message: "Search history cleared" });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
