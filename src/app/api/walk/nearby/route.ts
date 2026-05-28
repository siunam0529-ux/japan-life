import { NextResponse } from "next/server";
import type { NearbyPlace, NearbyPlaceType } from "@/lib/walk/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const overpassEndpoints = ["https://overpass-api.de/api/interpreter", "https://overpass.osm.ch/api/interpreter"];
const hotpepperEndpoint = "https://webservice.recruit.co.jp/hotpepper/gourmet/v1/";
const defaultRadius = 900;
const nearbyPlaceTypes: NearbyPlaceType[] = ["咖啡店", "书店", "旧书店", "神社", "公园", "商店街", "拉面店", "便利店", "河边", "猫咖", "小巷", "甜品店"];
const hotpepperTypes: Array<NearbyPlaceType | "全部"> = ["全部", "咖啡店", "拉面店", "猫咖", "甜品店"];
const hotpepperKeywords: Record<NearbyPlaceType | "全部", string> = {
  便利店: "コンビニ",
  公园: "",
  咖啡店: "カフェ",
  旧书店: "",
  河边: "",
  猫咖: "猫カフェ",
  商店街: "カフェ ラーメン スイーツ",
  甜品店: "スイーツ",
  拉面店: "ラーメン",
  书店: "",
  神社: "",
  小巷: "",
  全部: "",
};

type OverpassElement = {
  center?: {
    lat?: number;
    lon?: number;
  };
  id?: number | string;
  lat?: number;
  lon?: number;
  tags?: Record<string, string>;
  type?: string;
};

type OverpassResponse = {
  elements?: OverpassElement[];
};

type NormalizedNearbyPlace = NearbyPlace & {
  distanceMeters: number;
};

type HotpepperShop = {
  access?: string;
  address?: string;
  budget?: { name?: string };
  genre?: { name?: string };
  id?: string;
  lat?: number;
  lng?: number;
  name?: string;
  open?: string;
  urls?: { pc?: string };
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = parseCoordinate(searchParams.get("lat"), -90, 90);
  const lng = parseCoordinate(searchParams.get("lng"), -180, 180);

  if (lat === null || lng === null) {
    return jsonNoStore({ message: "缺少有效位置，暂时无法取得真实附近地点。", places: [] }, 400);
  }

  const radius = parseRadius(searchParams.get("radius"));
  const requestedType = parseNearbyPlaceType(searchParams.get("type"));
  const shouldUseHotpepper = hotpepperTypes.includes(requestedType);

  if (shouldUseHotpepper) {
    try {
      const places = await fetchHotpepperNearbyPlaces({ lat, lng, type: requestedType });
      if (places.length > 0) {
        return jsonNoStore({
          fetchedAt: new Date().toISOString(),
          places,
          source: "hotpepper",
        });
      }
      if (requestedType !== "全部") {
        return jsonNoStore({
          fetchedAt: new Date().toISOString(),
          message: "HotPepper 附近店铺暂时没有结果，可以换个类型或打开地图 APP 搜索。",
          places: [],
          source: "hotpepper",
        });
      }
    } catch {
      if (requestedType !== "全部") {
        return jsonNoStore({ message: "HotPepper 店铺暂时取得失败，请先用地图 APP 搜索。", places: [] }, 502);
      }
    }
  }

  try {
    const query = buildOverpassQuery({ lat, lng, radius, type: requestedType });
    const payload = await fetchOverpassWithFallback(query);
    const places = normalizeNearbyPlaces(payload.elements ?? [], { lat, lng, requestedType }).slice(0, 5);

    if (places.length === 0) {
      return jsonNoStore({
        fetchedAt: new Date().toISOString(),
        message: "附近暂时没有取得真实地点，可以直接打开地图 APP 搜索。",
        places: [],
        source: shouldUseHotpepper ? "hotpepper" : "openstreetmap",
      });
    }

    return jsonNoStore({
      fetchedAt: new Date().toISOString(),
      places: places.map((place) => {
        const { distanceMeters, ...nearbyPlace } = place;
        void distanceMeters;
        return nearbyPlace;
      }),
      source: "openstreetmap",
    });
  } catch {
    return jsonNoStore({ message: "附近真实地点暂时取得失败，请先用地图 APP 搜索。", places: [] }, 502);
  }
}

function jsonNoStore(body: unknown, status = 200) {
  return NextResponse.json(body, {
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      Pragma: "no-cache",
    },
    status,
  });
}

function parseCoordinate(value: string | null, min: number, max: number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < min || parsed > max) return null;
  return parsed;
}

function parseRadius(value: string | null) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return defaultRadius;
  return Math.min(Math.max(Math.round(parsed), 300), 1600);
}

function parseNearbyPlaceType(value: string | null): NearbyPlaceType | "全部" {
  if (value === "全部" || !value) return "全部";
  return nearbyPlaceTypes.includes(value as NearbyPlaceType) ? (value as NearbyPlaceType) : "全部";
}

function buildOverpassQuery({ lat, lng, radius, type }: { lat: number; lng: number; radius: number; type: NearbyPlaceType | "全部" }) {
  const clauses = type === "全部" ? getAllClauses({ lat, lng, radius }) : getClausesByType(type, { lat, lng, radius });

  return `
[out:json][timeout:8];
(
${clauses.join("\n")}
);
out center tags 80;
`;
}

function area(prefix: "node" | "relation" | "way", radius: number, lat: number, lng: number) {
  return `${prefix}(around:${radius},${lat},${lng})`;
}

function byAllGeometry(selector: string, { lat, lng, radius }: { lat: number; lng: number; radius: number }) {
  return (["node", "way", "relation"] as const).map((prefix) => `  ${area(prefix, radius, lat, lng)}${selector};`);
}

function byNode(selector: string, { lat, lng, radius }: { lat: number; lng: number; radius: number }) {
  return [`  ${area("node", radius, lat, lng)}${selector};`];
}

function byWayAndRelation(selector: string, { lat, lng, radius }: { lat: number; lng: number; radius: number }) {
  return (["way", "relation"] as const).map((prefix) => `  ${area(prefix, radius, lat, lng)}${selector};`);
}

function getAllClauses(location: { lat: number; lng: number; radius: number }) {
  return [
    ...byNode('["shop"="books"]["name"]', location),
    ...byNode('["amenity"="place_of_worship"]["religion"="shinto"]["name"]', location),
    ...byNode('["historic"="shrine"]["name"]', location),
    ...byNode('["leisure"="park"]["name"]', location),
    ...byNode('["shop"="convenience"]["name"]', location),
  ];
}

function getClausesByType(type: NearbyPlaceType, location: { lat: number; lng: number; radius: number }) {
  switch (type) {
    case "咖啡店":
      return byAllGeometry('["amenity"="cafe"]["name"]', location);
    case "书店":
      return byAllGeometry('["shop"="books"]["name"]', location);
    case "旧书店":
      return [
        ...byAllGeometry('["shop"="books"]["second_hand"="yes"]["name"]', location),
        ...byAllGeometry('["shop"="books"]["name"~"古本|古書|中古|BOOKOFF|Bookoff|ブックオフ"]', location),
      ];
    case "神社":
      return [
        ...byAllGeometry('["amenity"="place_of_worship"]["religion"="shinto"]["name"]', location),
        ...byAllGeometry('["historic"="shrine"]["name"]', location),
      ];
    case "公园":
      return [
        ...byAllGeometry('["leisure"="park"]["name"]', location),
        ...byAllGeometry('["leisure"="garden"]["name"]', location),
      ];
    case "商店街":
      return byAllGeometry('["shop"]["name"]', location);
    case "拉面店":
      return [
        ...byAllGeometry('["amenity"="restaurant"]["cuisine"~"ramen|noodle|japanese",i]["name"]', location),
        ...byAllGeometry('["amenity"="fast_food"]["cuisine"~"ramen|noodle|japanese",i]["name"]', location),
        ...byAllGeometry('["amenity"="restaurant"]["name"~"ラーメン|らーめん|拉麺|Ramen|ramen"]["name"]', location),
      ];
    case "便利店":
      return byAllGeometry('["shop"="convenience"]["name"]', location);
    case "河边":
      return byWayAndRelation('["waterway"="river"]["name"]', location);
    case "猫咖":
      return byAllGeometry('["amenity"="cafe"]["name"~"猫|ねこ|ネコ|cat|Cat|neko|Neko"]', location);
    case "小巷":
      return byWayAndRelation('["highway"~"pedestrian|living_street|footway|path"]["name"]', location);
    case "甜品店":
      return [
        ...byAllGeometry('["shop"~"bakery|confectionery|pastry"]["name"]', location),
        ...byAllGeometry('["amenity"="cafe"]["cuisine"~"dessert|cake|coffee_shop",i]["name"]', location),
      ];
  }
}

async function fetchOverpassWithFallback(query: string) {
  let lastError: unknown;

  for (const endpoint of overpassEndpoints) {
    try {
      return await fetchOverpass(endpoint, query);
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Overpass request failed.");
}

async function fetchOverpass(endpoint: string, query: string): Promise<OverpassResponse> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 4500);
  const apiUrl = new URL(endpoint);
  apiUrl.searchParams.set("data", query);

  try {
    const response = await fetch(apiUrl, {
      cache: "no-store",
      headers: {
        accept: "*/*",
        "user-agent": "Japan-Life/1.0 OpenStreetMap nearby lookup",
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error("Overpass returned an error.");
    }

    const payload = (await response.json()) as unknown;
    if (!payload || typeof payload !== "object") {
      throw new Error("Overpass response shape is invalid.");
    }

    return payload as OverpassResponse;
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchHotpepperNearbyPlaces({ lat, lng, type }: { lat: number; lng: number; type: NearbyPlaceType | "全部" }) {
  const apiKey = process.env.HOTPEPPER_API_KEY?.trim();
  if (!apiKey) throw new Error("HOTPEPPER_API_KEY is not configured.");

  const keyword = hotpepperKeywords[type].trim();

  const apiUrl = new URL(hotpepperEndpoint);
  apiUrl.searchParams.set("key", apiKey);
  if (keyword) apiUrl.searchParams.set("keyword", keyword);
  apiUrl.searchParams.set("lat", String(lat));
  apiUrl.searchParams.set("lng", String(lng));
  apiUrl.searchParams.set("range", "3");
  apiUrl.searchParams.set("count", "5");
  apiUrl.searchParams.set("format", "json");

  const response = await fetch(apiUrl, {
    cache: "no-store",
    headers: { accept: "application/json" },
  });
  if (!response.ok) throw new Error("HotPepper request failed.");

  const payload = (await response.json()) as { results?: { error?: unknown; shop?: unknown } };
  if (payload.results?.error || !Array.isArray(payload.results?.shop)) return [];

  return normalizeHotpepperPlaces(payload.results.shop as HotpepperShop[], { lat, lng, type });
}

function normalizeHotpepperPlaces(shops: HotpepperShop[], { lat, lng, type }: { lat: number; lng: number; type: NearbyPlaceType | "全部" }): NearbyPlace[] {
  const places: NearbyPlace[] = [];

  shops.forEach((shop) => {
    const shopLat = typeof shop.lat === "number" ? shop.lat : Number(shop.lat);
    const shopLng = typeof shop.lng === "number" ? shop.lng : Number(shop.lng);
    const name = textValue(shop.name);
    const address = textValue(shop.address);
    const genre = textValue(shop.genre?.name) || "餐饮店";
    const budget = textValue(shop.budget?.name) || "预算需确认";
    const distanceMeters = Number.isFinite(shopLat) && Number.isFinite(shopLng) ? calculateDistanceMeters(lat, lng, shopLat, shopLng) : 999999;
    const placeType = type === "全部" ? inferHotpepperType({ genre, name }) : type;

    if (!name) return;

    places.push({
      address,
      bestFor: [placeType, "HotPepper店铺", genre].filter(Boolean).slice(0, 3),
      budget,
      description: [address ? `地址：${address}` : "", genre ? `类型：${genre}` : "", textValue(shop.open) ? `营业时间参考：${trimText(textValue(shop.open), 42)}` : ""].filter(Boolean).join(" · ") || "HotPepper 上取得的真实店铺资料。",
      detailUrl: textValue(shop.urls?.pc),
      distance: distanceMeters === 999999 ? "距离未取得" : formatDistance(distanceMeters),
      id: textValue(shop.id) || `${name}-${address}`,
      latitude: Number.isFinite(shopLat) ? shopLat : lat,
      longitude: Number.isFinite(shopLng) ? shopLng : lng,
      mapQuery: `${name} ${address}`.trim(),
      name,
      note: "店铺来自 HotPepper。营业时间、价格、空位和是否仍在营业请以店铺官方信息为准。",
      source: "hotpepper",
      type: placeType,
    });
  });

  return places
    .sort((left, right) => {
      const leftDistance = parseDistanceForSort(left.distance);
      const rightDistance = parseDistanceForSort(right.distance);
      return leftDistance - rightDistance;
    })
    .slice(0, 5);
}

function inferHotpepperType({ genre, name }: { genre: string; name: string }): NearbyPlaceType {
  const text = `${genre} ${name}`;
  if (/ラーメン|らーめん|麺/.test(text)) return "拉面店";
  if (/カフェ|喫茶|珈琲|コーヒー/.test(text)) return "咖啡店";
  if (/スイーツ|ケーキ|チョコ|デザート|菓子/.test(text)) return "甜品店";
  return "商店街";
}

function parseDistanceForSort(distance: string) {
  if (distance.endsWith("km")) return Number(distance.replace("km", "")) * 1000;
  if (distance.endsWith("m")) return Number(distance.replace("m", ""));
  return 999999;
}

function normalizeNearbyPlaces(elements: OverpassElement[], { lat, lng, requestedType }: { lat: number; lng: number; requestedType: NearbyPlaceType | "全部" }) {
  const seen = new Set<string>();
  const places: NormalizedNearbyPlace[] = [];

  for (const element of elements) {
    const tags = element.tags ?? {};
    const name = pickName(tags);
    const placeLat = element.lat ?? element.center?.lat;
    const placeLng = element.lon ?? element.center?.lon;

    if (!name || typeof placeLat !== "number" || typeof placeLng !== "number" || !Number.isFinite(placeLat) || !Number.isFinite(placeLng)) continue;

    const type = requestedType === "全部" ? inferNearbyType(tags) : requestedType;
    const distanceMeters = calculateDistanceMeters(lat, lng, placeLat, placeLng);
    const id = `${element.type ?? "osm"}-${element.id ?? `${name}-${placeLat}-${placeLng}`}`;
    const dedupeKey = `${name}-${Math.round(placeLat * 10000)}-${Math.round(placeLng * 10000)}`;

    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);

    places.push({
      bestFor: buildBestFor(type, tags),
      budget: "价格未取得",
      description: buildDescription(type, tags),
      distance: formatDistance(distanceMeters),
      distanceMeters,
      id,
      latitude: placeLat,
      longitude: placeLng,
      name,
      note: "地点来自 OpenStreetMap。营业时间、价格和是否仍在营业请以地图或店铺官方信息为准。",
      source: "openstreetmap",
      type,
    });
  }

  return places.sort((a, b) => a.distanceMeters - b.distanceMeters);
}

function pickName(tags: Record<string, string>) {
  return tags["name:zh"] || tags["name:ja"] || tags.name || tags["name:en"] || "";
}

function textValue(value: unknown) {
  return typeof value === "string" ? value : "";
}

function inferNearbyType(tags: Record<string, string>): NearbyPlaceType {
  const name = pickName(tags);
  const shop = tags.shop ?? "";
  const amenity = tags.amenity ?? "";
  const cuisine = tags.cuisine ?? "";

  if (shop === "convenience") return "便利店";
  if (shop === "books") return /古本|古書|中古|BOOKOFF|Bookoff|ブックオフ/.test(name) || tags.second_hand === "yes" ? "旧书店" : "书店";
  if (/bakery|confectionery|pastry/.test(shop)) return "甜品店";
  if (amenity === "cafe") return /猫|ねこ|ネコ|cat|Cat|neko|Neko/.test(name) ? "猫咖" : "咖啡店";
  if ((amenity === "restaurant" || amenity === "fast_food") && /ramen|noodle|japanese/i.test(cuisine + name)) return "拉面店";
  if (amenity === "place_of_worship" || tags.historic === "shrine") return "神社";
  if (tags.leisure === "park" || tags.leisure === "garden") return "公园";
  if (tags.waterway === "river") return "河边";
  if (tags.highway) return "小巷";
  if (shop) return "商店街";
  return "商店街";
}

function buildDescription(type: NearbyPlaceType, tags: Record<string, string>) {
  const address = buildAddress(tags);
  const details = [
    address ? `地址：${address}` : "",
    tags.cuisine ? `类型：${tags.cuisine}` : "",
    tags.opening_hours ? `营业时间参考：${trimText(tags.opening_hours, 42)}` : "",
  ].filter(Boolean);

  if (details.length > 0) return details.join(" · ");
  return `OpenStreetMap 上取得的真实${type}资料。`;
}

function buildAddress(tags: Record<string, string>) {
  if (tags["addr:full"]) return tags["addr:full"];
  const parts = [tags["addr:province"], tags["addr:city"], tags["addr:ward"], tags["addr:suburb"], tags["addr:street"], tags["addr:housenumber"]].filter(Boolean);
  return parts.join("");
}

function buildBestFor(type: NearbyPlaceType, tags: Record<string, string>) {
  const tagsFromData = [type, "真实地点"];
  if (tags.opening_hours) tagsFromData.push("时间需确认");
  if (tags.cuisine) tagsFromData.push(tags.cuisine);
  return tagsFromData.slice(0, 3);
}

function trimText(value: string, maxLength: number) {
  return value.length > maxLength ? `${value.slice(0, maxLength)}...` : value;
}

function calculateDistanceMeters(fromLat: number, fromLng: number, toLat: number, toLng: number) {
  const earthRadius = 6371000;
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const dLat = toRadians(toLat - fromLat);
  const dLng = toRadians(toLng - fromLng);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRadians(fromLat)) * Math.cos(toRadians(toLat)) * Math.sin(dLng / 2) ** 2;
  return Math.round(earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

function formatDistance(distanceMeters: number) {
  if (distanceMeters < 1000) return `${Math.max(10, Math.round(distanceMeters / 10) * 10)}m`;
  return `${(distanceMeters / 1000).toFixed(1)}km`;
}
