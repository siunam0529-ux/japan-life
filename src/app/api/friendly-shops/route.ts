import { NextResponse } from "next/server";
import { isHotpepperOnlyShopRecord } from "@/lib/hotpepperRules";
import { adminErrorResponse, listPublished } from "@/lib/supabaseAdmin";

export async function GET() {
  try {
    const { data, error } = await listPublished("friendly_shops");
    if (error) return adminErrorResponse(error);
    const items = (data ?? []).filter((item) => {
      const sourceType = typeof item.source_type === "string" ? item.source_type : "japan_life";
      if (sourceType === "hotpepper") {
        const reviewStatus = typeof item.review_status === "string" ? item.review_status : "";
        return reviewStatus === "approved" || item.is_verified === true;
      }
      return !isHotpepperOnlyShopRecord(item);
    });
    return NextResponse.json({ items });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
