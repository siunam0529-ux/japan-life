import { NextResponse, type NextRequest } from "next/server";
import { buildHotpepperSearchUrl, normalizeHotpepperShops, numberParam } from "@/lib/hotpepper/import";
import { adminErrorResponse, getMissingColumnName, invalidAdminResponse, verifyAdminPassword } from "@/lib/supabaseAdmin";
import { supabaseAdmin } from "@/lib/supabase";

type ExistingShopIdentifier = {
  hotpepper_shop_id?: string;
  hotpepper_url?: string;
};

function getPassword(request: NextRequest) {
  return request.headers.get("x-admin-password") ?? "";
}

async function listExistingHotpepperShops() {
  if (!supabaseAdmin) return { data: [] as ExistingShopIdentifier[], error: null };
  const columns = ["hotpepper_shop_id", "hotpepper_url", "source_type"];
  const selected = [...columns];

  for (let attempt = 0; attempt < columns.length; attempt += 1) {
    const result = await supabaseAdmin.from("friendly_shops").select(selected.join(", "));
    const missingColumn = getMissingColumnName(result.error);
    if (!missingColumn) {
      const data = (result.data ?? []) as ExistingShopIdentifier[];
      return { data, error: result.error };
    }
    const index = selected.indexOf(missingColumn);
    if (index >= 0) selected.splice(index, 1);
  }

  return { data: [] as ExistingShopIdentifier[], error: null };
}

export async function GET(request: NextRequest) {
  if (!verifyAdminPassword(getPassword(request))) return invalidAdminResponse();

  const apiKey = process.env.HOTPEPPER_API_KEY?.trim();
  if (!apiKey) {
    return NextResponse.json({ error: "HOTPEPPER_API_KEY is missing.", items: [] }, { status: 500 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const url = buildHotpepperSearchUrl(apiKey, {
      area: searchParams.get("area") ?? "",
      count: numberParam(searchParams.get("count"), 20, 1, 100),
      genre: searchParams.get("genre") ?? "",
      keyword: searchParams.get("keyword") ?? "",
      largeArea: searchParams.get("large_area") ?? "",
      middleArea: searchParams.get("middle_area") ?? "",
      order: searchParams.get("order") ?? "",
      smallArea: searchParams.get("small_area") ?? "",
      start: numberParam(searchParams.get("start"), 1, 1, 1000),
    });

    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) {
      return NextResponse.json({ error: `HotPepper API request failed (${response.status}).`, items: [] }, { status: 502 });
    }

    const payload = (await response.json()) as {
      results?: {
        results_available?: number | string;
        shop?: unknown;
        error?: unknown;
      };
    };

    if (payload.results?.error) {
      return NextResponse.json({ error: "HotPepper API returned an error.", items: [] }, { status: 502 });
    }

    const normalized = normalizeHotpepperShops(payload.results?.shop);
    const existingResult = await listExistingHotpepperShops();
    if (existingResult.error) return adminErrorResponse(existingResult.error);

    const existingIds = new Set(existingResult.data.map((item) => item.hotpepper_shop_id?.trim()).filter(Boolean));
    const existingUrls = new Set(existingResult.data.map((item) => item.hotpepper_url?.trim()).filter(Boolean));
    const items = normalized.map((item) => ({
      ...item,
      exists: existingIds.has(item.hotpepperShopId) || (item.hotpepperUrl ? existingUrls.has(item.hotpepperUrl) : false),
    }));

    return NextResponse.json({
      items,
      total: numberParam(payload.results?.results_available, items.length, 0, 999999),
    });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
