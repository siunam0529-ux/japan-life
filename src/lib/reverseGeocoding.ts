import type { Region, UserResolvedLocation } from "@/hooks/useUserSettings";

type NominatimReverseResponse = {
  address?: {
    city?: string;
    country?: string;
    county?: string;
    municipality?: string;
    province?: string;
    state?: string;
    town?: string;
    village?: string;
  };
};

export type ReverseGeocodedJapanLocation = UserResolvedLocation & {
  region: Region;
  areaId: string | null;
};

const tokyoAreaByCity: Record<string, string> = {
  "千代田区": "chiyoda",
  "中央区": "chuo",
  "港区": "minato",
  "新宿区": "shinjuku",
  "文京区": "bunkyo",
  "台東区": "taito",
  "台东区": "taito",
  "墨田区": "sumida",
  "江東区": "koto",
  "江东区": "koto",
  "品川区": "shinagawa",
  "目黒区": "meguro",
  "目黑区": "meguro",
  "大田区": "ota",
  "世田谷区": "setagaya",
  "渋谷区": "shibuya",
  "涩谷区": "shibuya",
  "中野区": "nakano",
  "杉並区": "suginami",
  "杉并区": "suginami",
  "豊島区": "toshima",
  "丰岛区": "toshima",
  "北区": "kita",
  "荒川区": "arakawa",
  "板橋区": "itabashi",
  "板桥区": "itabashi",
  "練馬区": "nerima",
  "练马区": "nerima",
  "足立区": "adachi",
  "葛飾区": "katsushika",
  "葛饰区": "katsushika",
  "江戸川区": "edogawa",
  "江户川区": "edogawa",
};

export async function reverseGeocodeJapanLocation(latitude: number, longitude: number): Promise<ReverseGeocodedJapanLocation> {
  const params = new URLSearchParams({
    accept_language: "ja,en,zh-CN",
    format: "jsonv2",
    lat: String(latitude),
    lon: String(longitude),
  });

  const response = await fetch(`https://nominatim.openstreetmap.org/reverse?${params.toString()}`, {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Reverse geocoding failed: ${response.status}`);
  }

  const data = (await response.json()) as NominatimReverseResponse;
  const address = data.address ?? {};
  const prefecture = address.state ?? address.province ?? "";
  const city = address.city ?? address.town ?? address.village ?? address.municipality ?? address.county ?? "";
  const region = getRegion(prefecture, latitude, longitude);

  return {
    areaId: getAreaId(region, city),
    city,
    latitude,
    longitude,
    prefecture,
    region,
    updatedAt: new Date().toISOString(),
  };
}

function getRegion(prefecture: string, latitude: number, longitude: number): Region {
  const normalized = normalize(prefecture);
  if (includesAny(normalized, ["東京都", "東京", "tokyo"])) return "tokyo";
  if (includesAny(normalized, ["大阪府", "大阪", "osaka"])) return "osaka";
  if (includesAny(normalized, ["京都府", "京都", "kyoto"])) return "kyoto";
  if (includesAny(normalized, ["福岡県", "福岡", "fukuoka"])) return "fukuoka";

  if (isInside(latitude, longitude, 35.45, 35.95, 139.2, 140.05)) return "tokyo";
  if (isInside(latitude, longitude, 34.45, 34.9, 135.25, 135.75)) return "osaka";
  if (isInside(latitude, longitude, 34.85, 35.15, 135.55, 136.0)) return "kyoto";
  if (isInside(latitude, longitude, 33.4, 33.8, 130.2, 130.6)) return "fukuoka";

  return "other";
}

function getAreaId(region: Region, city: string) {
  if (region !== "tokyo") return null;
  const normalizedCity = normalize(city);
  return Object.entries(tokyoAreaByCity).find(([name]) => normalizedCity.includes(normalize(name)))?.[1] ?? null;
}

function normalize(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, "");
}

function includesAny(value: string, keywords: string[]) {
  return keywords.some((keyword) => value.includes(normalize(keyword)));
}

function isInside(latitude: number, longitude: number, minLat: number, maxLat: number, minLon: number, maxLon: number) {
  return latitude >= minLat && latitude <= maxLat && longitude >= minLon && longitude <= maxLon;
}
