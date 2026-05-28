import { NextResponse } from "next/server";
import { getTokyoStationsFromOdpt } from "@/lib/stations/odptStations";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const forceRefresh = searchParams.get("refresh") === "1";

  try {
    const result = await getTokyoStationsFromOdpt({ forceRefresh });
    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
      },
    });
  } catch {
    return NextResponse.json(
      {
        cached: false,
        fetchedAt: "",
        message: "ODPT 车站数据暂时无法读取。",
        source: "cache",
        stations: [],
      },
      { status: 503 },
    );
  }
}
