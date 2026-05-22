import { NextResponse } from "next/server";
import { listPublished } from "@/lib/supabaseAdmin";
import type { RecommendedAppRecord } from "@/lib/recommendedAppRecords";

export async function GET() {
  try {
    const { data, error } = await listPublished("recommended_apps");
    if (error) return NextResponse.json({ items: [], warning: error.message });
    const remoteItems = ((data ?? []) as RecommendedAppRecord[]).filter((item) => item.status === "published");
    return NextResponse.json({ items: remoteItems });
  } catch (error) {
    return NextResponse.json({ items: [], warning: error instanceof Error ? error.message : String(error) });
  }
}
