import { NextRequest, NextResponse } from "next/server";
import { getFavorites, getHistory } from "../../../lib/db";

// exports sqlite data to json csv or markdown
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const format = (searchParams.get("format") || "json").toLowerCase();
    const type = (searchParams.get("type") || "all").toLowerCase();

    const favorites = getFavorites();
    const history = getHistory(100);

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");

    if (format === "csv") {
      let csvContent = "";
      if (type === "favorites" || type === "all") {
        csvContent += "# FAVORITES\nid,name,country,latitude,longitude,tag,notes,created_at\n";
        favorites.forEach((f) => {
          csvContent += `"${f.id}","${f.name}","${f.country}",${f.lat},${f.lon},"${f.tag}","${f.notes}","${f.created_at}"\n`;
        });
      }
      if (type === "all") csvContent += "\n";
      if (type === "history" || type === "all") {
        csvContent += "# SEARCH HISTORY\nid,query,location,country,latitude,longitude,temp_c,condition,searched_at\n";
        history.forEach((h) => {
          csvContent += `"${h.id}","${h.query}","${h.location_name}","${h.country}",${h.lat},${h.lon},${h.temp_c},"${h.condition_text}","${h.searched_at}"\n`;
        });
      }

      return new NextResponse(csvContent, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="weather-data-export-${timestamp}.csv"`,
        },
      });
    }

    if (format === "markdown" || format === "md") {
      let mdContent = `# Weather Intelligence Platform Data Export\n`;
      mdContent += `*Exported on: ${new Date().toUTCString()}*\n\n`;

      if (type === "favorites" || type === "all") {
        mdContent += `## Saved Favorites (${favorites.length})\n\n`;
        mdContent += `| ID | Location | Country | Coordinates | Tag | Notes |\n`;
        mdContent += `|---|---|---|---|---|---|\n`;
        favorites.forEach((f) => {
          mdContent += `| ${f.id} | ${f.name} | ${f.country} | ${f.lat.toFixed(2)}, ${f.lon.toFixed(2)} | ${f.tag} | ${f.notes} |\n`;
        });
        mdContent += `\n`;
      }

      if (type === "history" || type === "all") {
        mdContent += `## Search History (${history.length})\n\n`;
        mdContent += `| ID | Query | Resolved Location | Temp (°C) | Condition | Timestamp |\n`;
        mdContent += `|---|---|---|---|---|---|\n`;
        history.forEach((h) => {
          mdContent += `| ${h.id} | ${h.query} | ${h.location_name}, ${h.country} | ${h.temp_c}°C | ${h.condition_text} | ${h.searched_at} |\n`;
        });
      }

      return new NextResponse(mdContent, {
        headers: {
          "Content-Type": "text/markdown; charset=utf-8",
          "Content-Disposition": `attachment; filename="weather-data-export-${timestamp}.md"`,
        },
      });
    }

    // Default JSON export
    const exportData = {
      meta: {
        exportedAt: new Date().toISOString(),
        totalFavorites: favorites.length,
        totalHistoryRecords: history.length,
        system: "PM Accelerator Weather Platform",
      },
      favorites: type === "history" ? [] : favorites,
      history: type === "favorites" ? [] : history,
    };

    return new NextResponse(JSON.stringify(exportData, null, 2), {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="weather-data-export-${timestamp}.json"`,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
