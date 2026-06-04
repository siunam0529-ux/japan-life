import { NextResponse } from "next/server";
import { listPublished } from "@/lib/supabaseAdmin";

type RecommendedAppRecord = Record<string, unknown> & {
  id: string | number;
  status?: string;
};

export async function GET() {
  try {
    const { data, error } = await listPublished("recommended_apps");
    if (error) return NextResponse.json({ error: error.message, items: [] }, { status: 500 });
    const remoteItems = ((data ?? []) as RecommendedAppRecord[]).filter((item) => item.status === "published");
    return NextResponse.json({ items: remoteItems });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error), items: [] }, { status: 500 });
  }
}
