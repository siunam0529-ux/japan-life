import { NextResponse } from "next/server";
import type { NearbyRestaurant } from "@/lib/food/types";

const hotpepperEndpoint = "https://webservice.recruit.co.jp/hotpepper/gourmet/v1/";
const defaultTokyoLocation = { lat: 35.6762, lng: 139.6503 };

function parseCoordinate(value: string | null, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
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
  return value.slice(0, 5).map((shop) => {
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
      budget: textValue(budget.name) || "预算信息需确认",
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

export async function GET(request: Request) {
  const apiKey = process.env.HOTPEPPER_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ message: "店铺搜索还没有设置 API key。", restaurants: [] }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const keyword = searchParams.get("keyword")?.trim();
  if (!keyword) {
    return NextResponse.json({ message: "缺少食物关键词。", restaurants: [] }, { status: 400 });
  }

  const lat = parseCoordinate(searchParams.get("lat"), defaultTokyoLocation.lat);
  const lng = parseCoordinate(searchParams.get("lng"), defaultTokyoLocation.lng);
  const range = parseRange(searchParams.get("range"));
  const apiUrl = new URL(hotpepperEndpoint);
  apiUrl.searchParams.set("key", apiKey);
  apiUrl.searchParams.set("keyword", keyword);
  apiUrl.searchParams.set("lat", String(lat));
  apiUrl.searchParams.set("lng", String(lng));
  apiUrl.searchParams.set("range", String(range));
  apiUrl.searchParams.set("count", "5");
  apiUrl.searchParams.set("format", "json");

  try {
    const response = await fetch(apiUrl, { next: { revalidate: 0 } });
    if (!response.ok) {
      return NextResponse.json({ message: "附近店铺暂时取得失败，可以先用地图 APP 搜索这个关键词。", restaurants: [] }, { status: response.status });
    }

    const data = (await response.json()) as { results?: { error?: unknown; shop?: unknown } };
    if (data.results?.error) {
      return NextResponse.json({ message: "附近店铺暂时取得失败，可以先用地图 APP 搜索这个关键词。", restaurants: [] }, { status: 502 });
    }

    return NextResponse.json({ restaurants: normalizeRestaurants(data.results?.shop) });
  } catch {
    return NextResponse.json({ message: "附近店铺暂时取得失败，可以先用地图 APP 搜索这个关键词。", restaurants: [] }, { status: 500 });
  }
}
