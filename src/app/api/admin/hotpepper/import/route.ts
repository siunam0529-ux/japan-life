import { NextResponse, type NextRequest } from "next/server";
import { normalizeHotpepperUrl, textValue, toFriendlyShopHotpepperDraft, type HotpepperPreviewShop } from "@/lib/hotpepper/import";
import { adminErrorResponse, getMissingColumnName, invalidAdminResponse, missingSupabaseAdminResponse, verifyAdminPassword } from "@/lib/supabaseAdmin";
import { supabaseAdmin } from "@/lib/supabase";

type ExistingShopIdentifier = {
  hotpepper_shop_id?: string;
  hotpepper_url?: string;
};

function getPassword(request: NextRequest) {
  return request.headers.get("x-admin-password") ?? "";
}

async function loadExistingIdentifiers() {
  if (!supabaseAdmin) return { data: [] as ExistingShopIdentifier[], error: null };
  const selected = ["hotpepper_shop_id", "hotpepper_url"];

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const result = await supabaseAdmin.from("friendly_shops").select(selected.join(", "));
    const missingColumn = getMissingColumnName(result.error);
    if (!missingColumn) return { data: (result.data ?? []) as ExistingShopIdentifier[], error: result.error };
    const index = selected.indexOf(missingColumn);
    if (index >= 0) selected.splice(index, 1);
  }

  return { data: [] as ExistingShopIdentifier[], error: null };
}

async function insertWithSchemaRetry(payload: Record<string, unknown>) {
  const nextPayload = { ...payload };
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const result = await supabaseAdmin!.from("friendly_shops").insert(nextPayload).select("*").single();
    const missingColumn = getMissingColumnName(result.error);
    if (!missingColumn) return result;
    delete nextPayload[missingColumn];
  }
  return { data: null, error: new Error("Too many missing columns while saving HotPepper shop.") };
}

function toPreviewShop(value: unknown): HotpepperPreviewShop | null {
  const record = value && typeof value === "object" ? (value as Record<string, unknown>) : null;
  if (!record) return null;
  const hotpepperShopId = textValue(record.hotpepperShopId);
  const hotpepperUrl = normalizeHotpepperUrl(textValue(record.hotpepperUrl));
  const name = textValue(record.name);
  if (!name || (!hotpepperShopId && !hotpepperUrl)) return null;
  return {
    access: textValue(record.access),
    address: textValue(record.address),
    budget: textValue(record.budget),
    catch: textValue(record.catch),
    close: textValue(record.close),
    exists: Boolean(record.exists),
    genreName: textValue(record.genreName),
    hotpepperShopId,
    hotpepperUrl,
    middleAreaCode: textValue(record.middleAreaCode),
    middleAreaName: textValue(record.middleAreaName),
    name,
    open: textValue(record.open),
    photoUrl: textValue(record.photoUrl),
    smallAreaCode: textValue(record.smallAreaCode),
    smallAreaName: textValue(record.smallAreaName),
    station: textValue(record.station),
    warnings: Array.isArray(record.warnings) ? record.warnings.filter((item): item is string => typeof item === "string") : [],
  };
}

export async function POST(request: NextRequest) {
  if (!verifyAdminPassword(getPassword(request))) return invalidAdminResponse();
  if (!supabaseAdmin) return missingSupabaseAdminResponse();

  try {
    const body = (await request.json()) as { publish?: boolean; shops?: unknown[] };
    const selected = Array.isArray(body.shops) ? body.shops.map(toPreviewShop).filter((item): item is HotpepperPreviewShop => Boolean(item)) : [];
    if (selected.length === 0) {
      return NextResponse.json({ error: "No HotPepper shops selected." }, { status: 400 });
    }

    const existingResult = await loadExistingIdentifiers();
    if (existingResult.error) return adminErrorResponse(existingResult.error);
    const existingIds = new Set(existingResult.data.map((item) => item.hotpepper_shop_id?.trim()).filter(Boolean));
    const existingUrls = new Set(existingResult.data.map((item) => item.hotpepper_url?.trim()).filter(Boolean));

    let imported = 0;
    let skipped = 0;
    const items: Array<Record<string, unknown>> = [];

    for (const shop of selected) {
      const duplicate = existingIds.has(shop.hotpepperShopId) || (shop.hotpepperUrl ? existingUrls.has(shop.hotpepperUrl) : false);
      if (duplicate) {
        skipped += 1;
        continue;
      }

      const payload = toFriendlyShopHotpepperDraft(shop, { publish: body.publish === true });
      const result = await insertWithSchemaRetry(payload);
      if (result.error) return adminErrorResponse(result.error);

      imported += 1;
      items.push(result.data as Record<string, unknown>);
      if (shop.hotpepperShopId) existingIds.add(shop.hotpepperShopId);
      if (shop.hotpepperUrl) existingUrls.add(shop.hotpepperUrl);
    }

    return NextResponse.json({
      imported,
      items,
      message: `Imported ${imported} shops. ${skipped} already existed and were skipped.`,
      skipped,
    });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
