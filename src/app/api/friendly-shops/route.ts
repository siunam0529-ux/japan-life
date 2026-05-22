import { NextResponse } from "next/server";
import { adminErrorResponse, listPublished } from "@/lib/supabaseAdmin";

export async function GET() {
  try {
    const { data, error } = await listPublished("friendly_shops");
    if (error) return adminErrorResponse(error);
    return NextResponse.json({ items: data ?? [] });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
