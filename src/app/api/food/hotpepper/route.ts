import { NextResponse } from "next/server";
import type { NearbyRestaurant } from "@/lib/food/types";

const hotpepperEndpoint = "https://webservice.recruit.co.jp/hotpepper/gourmet/v1/";

type HotpepperSearchPlan = {
  keyword?: string;
  lat?: number;
  lng?: number;
  range?: number;
};

function parseOptionalCoordinate(value: string | null) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseRange(value: string | null) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 3;
  return Math.min(Math.max(Math.round(parsed), 1), 5);
}

function textValue(value: unknown) {
  return typeof value === "string" ? value : "";
}

function normalizeRestaurants(value: unknown): NearbyRestaurant[] {
  if (!Array.isArray(value)) return [];
  return value.slice(0, 10).map((shop) => {
    const record = shop && typeof shop === "object" ? (shop as Record<string, unknown>) : {};
    const urls = record.urls && typeof record.urls === "object" ? (record.urls as Record<string, unknown>) : {};
    const genre = record.genre && typeof record.genre === "object" ? (record.genre as Record<string, unknown>) : {};
    const budget = record.budget && typeof record.budget === "object" ? (record.budget as Record<string, unknown>) : {};
    const photo = record.photo && typeof record.photo === "object" ? (record.photo as Record<string, unknown>) : {};
    const mobilePhoto = photo.mobile && typeof photo.mobile === "object" ? (photo.mobile as Record<string, unknown>) : {};
    const pcPhoto = photo.pc && typeof photo.pc === "object" ? (photo.pc as Record<string, unknown>) : {};
    const name = textValue(record.name);
    const address = textValue(record.address);

    return {
      access: textValue(record.access),
      address,
      budget: textValue(budget.name) || "预算信息请以店铺页面为准",
      genre: textValue(genre.name) || "餐厅",
      hotpepperUrl: textValue(urls.pc),
      id: textValue(record.id) || `${name}-${address}`,
      mapQuery: `${name} ${address}`.trim(),
      name,
      open: textValue(record.open) || "营业时间请以店铺页面为准",
      photoUrl: textValue(mobilePhoto.l) || textValue(pcPhoto.l) || textValue(mobilePhoto.s) || textValue(pcPhoto.m),
    };
  });
}

function parseKeywords(searchParams: URLSearchParams) {
  const values = [searchParams.get("keywords"), searchParams.get("keyword")]
    .flatMap((value) => (value ?? "").split(","))
    .map((value) => value.trim())
    .filter(Boolean);
  return Array.from(new Set(values));
}

function buildHotpepperUrl(apiKey: string, plan: HotpepperSearchPlan) {
  const apiUrl = new URL(hotpepperEndpoint);
  apiUrl.searchParams.set("key", apiKey);
  if (plan.keyword) apiUrl.searchParams.set("keyword", plan.keyword);
  if (typeof plan.lat === "number" && typeof plan.lng === "number") {
    apiUrl.searchParams.set("lat", String(plan.lat));
    apiUrl.searchParams.set("lng", String(plan.lng));
    apiUrl.searchParams.set("range", String(plan.range ?? 3));
  }
  apiUrl.searchParams.set("count", "50");
  apiUrl.searchParams.set("format", "json");
  return apiUrl;
}

async function fetchRestaurants(apiKey: string, plan: HotpepperSearchPlan) {
  const response = await fetch(buildHotpepperUrl(apiKey, plan), { next: { revalidate: 0 } });
  if (!response.ok) return { restaurants: [] as NearbyRestaurant[], status: response.status };

  const data = (await response.json()) as { results?: { error?: unknown; shop?: unknown } };
  if (data.results?.error) return { restaurants: [] as NearbyRestaurant[], status: 502 };
  return { restaurants: normalizeRestaurants(data.results?.shop), status: 200 };
}

export async function GET(request: Request) {
  const apiKey = process.env.HOTPEPPER_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ message: "还没有设置 HOTPEPPER_API_KEY。", restaurants: [] }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const keywords = parseKeywords(searchParams);
  const stationName = searchParams.get("station")?.trim() ?? "";
  if (keywords.length === 0 && !stationName) {
    return NextResponse.json({ message: "缺少食物关键词或车站名。", restaurants: [] }, { status: 400 });
  }

  const lat = parseOptionalCoordinate(searchParams.get("lat"));
  const lng = parseOptionalCoordinate(searchParams.get("lng"));
  const range = parseRange(searchParams.get("range"));
  const plans: HotpepperSearchPlan[] = [];

  if (lat !== null && lng !== null) {
    keywords.forEach((keyword) => plans.push({ keyword, lat, lng, range }));
    keywords.forEach((keyword) => {
      const stationKeyword = [stationName, keyword].filter(Boolean).join(" ");
      if (stationKeyword) plans.push({ keyword: stationKeyword });
    });
    plans.push({ lat, lng, range: Math.min(range + 1, 5) });
    plans.push({ lat, lng, range: 5 });
  } else {
    keywords.forEach((keyword) => {
      const stationKeyword = [stationName, keyword].filter(Boolean).join(" ");
      if (stationKeyword) plans.push({ keyword: stationKeyword });
    });
    if (stationName) plans.push({ keyword: stationName });
    keywords.forEach((keyword) => plans.push({ keyword }));
  }

  try {
    let lastStatus = 200;
    const restaurantsById = new Map<string, NearbyRestaurant>();
    for (const plan of plans) {
      const result = await fetchRestaurants(apiKey, plan);
      lastStatus = result.status;
      result.restaurants.forEach((restaurant) => {
        if (!restaurantsById.has(restaurant.id)) restaurantsById.set(restaurant.id, restaurant);
      });
      if (restaurantsById.size >= 10) {
        return NextResponse.json({ restaurants: Array.from(restaurantsById.values()).slice(0, 10) });
      }
    }

    if (restaurantsById.size > 0) {
      return NextResponse.json({ restaurants: Array.from(restaurantsById.values()).slice(0, 10) });
    }

    return NextResponse.json(
      {
        message: lastStatus === 200 ? "" : "HotPepper 店铺暂时取得失败，请稍后再试。",
        restaurants: [],
      },
      { status: lastStatus === 200 ? 200 : lastStatus },
    );
  } catch {
    return NextResponse.json({ message: "HotPepper 店铺暂时取得失败，请稍后再试。", restaurants: [] }, { status: 500 });
  }
}
