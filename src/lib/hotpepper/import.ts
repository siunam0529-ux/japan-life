export const hotpepperEndpoint = "https://webservice.recruit.co.jp/hotpepper/gourmet/v1/";

export type HotpepperPreviewShop = {
  access: string;
  address: string;
  budget: string;
  catch: string;
  close: string;
  exists?: boolean;
  genreName: string;
  hotpepperShopId: string;
  hotpepperUrl: string;
  middleAreaCode?: string;
  middleAreaName?: string;
  name: string;
  open: string;
  photoUrl: string;
  smallAreaCode?: string;
  smallAreaName?: string;
  station: string;
  warnings: string[];
};

export type HotpepperSearchOptions = {
  area?: string;
  count?: number;
  genre?: string;
  keyword?: string;
  largeArea?: string;
  middleArea?: string;
  order?: string;
  smallArea?: string;
  start?: number;
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

export function textValue(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export function numberParam(value: unknown, fallback: number, min: number, max: number) {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(Math.max(Math.round(parsed), min), max);
}

export function normalizeHotpepperShop(value: unknown): HotpepperPreviewShop {
  const shop = asRecord(value);
  const urls = asRecord(shop.urls);
  const genre = asRecord(shop.genre);
  const budget = asRecord(shop.budget);
  const photo = asRecord(shop.photo);
  const pcPhoto = asRecord(photo.pc);
  const mobilePhoto = asRecord(photo.mobile);
  const name = textValue(shop.name);
  const address = textValue(shop.address);
  const hotpepperUrl = textValue(urls.pc);
  const warnings: string[] = [];

  if (!hotpepperUrl) {
    warnings.push("HotPepper URL is missing.");
  } else if (!/^https:\/\/www\.hotpepper\.jp\/strJ/i.test(hotpepperUrl)) {
    warnings.push("URL is not the usual https://www.hotpepper.jp/strJ... format.");
  }

  return {
    access: textValue(shop.access),
    address,
    budget: textValue(budget.name),
    catch: textValue(shop.catch),
    close: textValue(shop.close),
    genreName: textValue(genre.name),
    hotpepperShopId: textValue(shop.id) || `${name}-${address}`.trim(),
    hotpepperUrl,
    name,
    open: textValue(shop.open),
    photoUrl: textValue(pcPhoto.l) || textValue(mobilePhoto.l) || textValue(pcPhoto.m) || textValue(mobilePhoto.s),
    station: textValue(shop.station_name),
    warnings,
  };
}

export function normalizeHotpepperShops(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.map(normalizeHotpepperShop).filter((shop) => shop.name && (shop.hotpepperShopId || shop.hotpepperUrl));
}

export function buildHotpepperSearchUrl(apiKey: string, options: HotpepperSearchOptions) {
  const url = new URL(hotpepperEndpoint);
  const keyword = [options.area, options.keyword].map((item) => item?.trim()).filter(Boolean).join(" ");
  url.searchParams.set("key", apiKey);
  url.searchParams.set("format", "json");
  url.searchParams.set("count", String(numberParam(options.count, 20, 1, 100)));
  url.searchParams.set("start", String(numberParam(options.start, 1, 1, 1000)));
  if (keyword) url.searchParams.set("keyword", keyword);
  if (options.largeArea) url.searchParams.set("large_area", options.largeArea.trim());
  if (options.middleArea) url.searchParams.set("middle_area", options.middleArea.trim());
  if (options.smallArea) url.searchParams.set("small_area", options.smallArea.trim());
  if (options.genre) url.searchParams.set("genre", options.genre.trim());
  if (options.order) url.searchParams.set("order", options.order.trim());
  return url;
}

export function normalizeHotpepperUrl(value: string) {
  try {
    const url = new URL(value.trim());
    if (!/(^|\.)hotpepper\.jp$/i.test(url.hostname)) return "";
    return url.toString();
  } catch {
    return "";
  }
}

export function toFriendlyShopHotpepperDraft(shop: HotpepperPreviewShop) {
  const areaName = shop.smallAreaName || shop.middleAreaName || "";
  const description = [
    shop.catch,
    shop.access ? `Access: ${shop.access}` : "",
    shop.budget ? `Budget: ${shop.budget}` : "",
    shop.open ? `Open: ${shop.open}` : "",
    shop.close ? `Closed: ${shop.close}` : "",
    shop.middleAreaCode ? `MiddleAreaCode: ${shop.middleAreaCode}` : "",
    shop.middleAreaName ? `MiddleAreaName: ${shop.middleAreaName}` : "",
    shop.smallAreaCode ? `SmallAreaCode: ${shop.smallAreaCode}` : "",
    shop.smallAreaName ? `SmallAreaName: ${shop.smallAreaName}` : "",
    "Source: HotPepper API import",
  ].filter(Boolean).join("\n");

  return {
    address: shop.address,
    admin_note: "HotPepper API import",
    affiliate_url: "",
    area: areaName,
    budget: shop.budget,
    category: shop.genreName || "restaurant",
    closed_days: shop.close,
    description,
    description_zh: "",
    hotpepper_shop_id: shop.hotpepperShopId,
    hotpepper_url: shop.hotpepperUrl,
    image_url: shop.photoUrl,
    is_verified: false,
    middle_area_code: shop.middleAreaCode || "",
    middle_area_name: shop.middleAreaName || "",
    name: shop.name,
    open_time: shop.open,
    review_status: "pending",
    small_area_code: shop.smallAreaCode || "",
    small_area_name: shop.smallAreaName || "",
    source_type: "hotpepper",
    station: shop.station || shop.access,
    status: "draft",
    website_url: shop.hotpepperUrl,
  };
}
