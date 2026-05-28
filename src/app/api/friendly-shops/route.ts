import { NextResponse } from "next/server";
import { isHotpepperOnlyShopRecord } from "@/lib/hotpepperRules";
import { adminErrorResponse, listPublished } from "@/lib/supabaseAdmin";

export async function GET() {
  try {
    const { data, error } = await listPublished("friendly_shops");
    if (error) return adminErrorResponse(error);
    const items = (data ?? []).filter((item) => !isHotpepperOnlyShopRecord(item));
    return NextResponse.json({ items });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
