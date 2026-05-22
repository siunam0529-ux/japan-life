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
  千代田区: "chiyoda",
  中央区: "chuo",
  港区: "minato",
  新宿区: "shinjuku",
  文京区: "bunkyo",
  台東区: "taito",
  墨田区: "sumida",
  江東区: "koto",
  品川区: "shinagawa",
  目黒区: "meguro",
  大田区: "ota",
  世田谷区: "setagaya",
  渋谷区: "shibuya",
  中野区: "nakano",
  杉並区: "suginami",
  豊島区: "toshima",
  北区: "kita",
  荒川区: "arakawa",
  板橋区: "itabashi",
  練馬区: "nerima",
  足立区: "adachi",
  葛飾区: "katsushika",
  江戸川区: "edogawa",
};

export async function reverseGeocodeJapanLocation(latitude: number, longitude: number): Promise<ReverseGeocodedJapanLocation> {
  const params = new URLSearchParams({
    accept_language: "ja",
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

  return {
    areaId: getAreaId(prefecture, city),
    city,
    latitude,
    longitude,
    prefecture,
    region: getRegion(prefecture),
    updatedAt: new Date().toISOString(),
  };
}

function getRegion(prefecture: string): Region {
  if (prefecture.includes("東京都")) return "tokyo";
  if (prefecture.includes("大阪府")) return "osaka";
  if (prefecture.includes("京都府")) return "kyoto";
  if (prefecture.includes("福岡県")) return "fukuoka";
  return "other";
}

function getAreaId(prefecture: string, city: string) {
  if (!prefecture.includes("東京都")) return null;
  return tokyoAreaByCity[city] ?? null;
}
