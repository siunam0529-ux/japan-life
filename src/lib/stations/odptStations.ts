import { tokyoRailLineConfigs } from "@/data/trainStatus";
import { getTokyoWardByCoordinate } from "@/lib/stations/tokyoWards";
import type { TokyoStation } from "@/lib/stations/types";
import { getTokyoDateTimeString } from "@/lib/utils/format";

const odptStationEndpoint = "https://api.odpt.org/api/v4/odpt:Station";
const stationCacheTtlMs = 24 * 60 * 60 * 1000;
const configuredRailways = new Set(tokyoRailLineConfigs.flatMap((line) => line.railways));

type LocalizedOdptText = Partial<Record<"en" | "ja" | "ja-Hrkt" | "ko" | "zh-Hans" | "zh-Hant", string>>;

type OdptStation = {
  "dc:title"?: string;
  "geo:lat"?: number;
  "geo:long"?: number;
  "odpt:operator"?: string;
  "odpt:railway"?: string;
  "odpt:stationCode"?: string;
  "odpt:stationTitle"?: LocalizedOdptText;
  "owl:sameAs"?: string;
};

type StationCache = {
  fetchedAt: string;
  stations: TokyoStation[];
  timestamp: number;
};

let memoryCache: StationCache | null = null;

export async function getTokyoStationsFromOdpt({ forceRefresh = false }: { forceRefresh?: boolean } = {}) {
  const now = Date.now();
  if (!forceRefresh && memoryCache && now - memoryCache.timestamp < stationCacheTtlMs) {
    return {
      cached: true,
      fetchedAt: memoryCache.fetchedAt,
      source: "cache" as const,
      stations: memoryCache.stations,
    };
  }

  const apiKey = getOdptApiKey();
  if (!apiKey) {
    throw new Error("ODPT_API_KEY is not configured.");
  }

  const url = new URL(odptStationEndpoint);
  url.searchParams.set("acl:consumerKey", apiKey);

  const response = await fetch(url, {
    headers: { accept: "application/json" },
    next: { revalidate: stationCacheTtlMs / 1000 },
  });
  if (!response.ok) throw new Error("ODPT station request failed.");

  const payload = (await response.json()) as unknown;
  if (!Array.isArray(payload)) throw new Error("ODPT station response shape is invalid.");

  const stations = normalizeTokyoStations(payload.filter(isOdptStation));
  const fetchedAt = getTokyoDateTimeString();
  memoryCache = {
    fetchedAt,
    stations,
    timestamp: now,
  };

  return {
    cached: false,
    fetchedAt,
    source: "odpt" as const,
    stations,
  };
}

function getOdptApiKey() {
  return (
    process.env.ODPT_API_KEY?.trim() ||
    process.env.ODPT_CONSUMER_KEY?.trim() ||
    process.env.ODPT_CONSUMERKEY?.trim() ||
    ""
  );
}

function isOdptStation(value: unknown): value is OdptStation {
  return Boolean(value && typeof value === "object");
}

function normalizeTokyoStations(records: OdptStation[]) {
  const grouped: TokyoStation[] = [];

  records.forEach((record) => {
    const latitude = record["geo:lat"];
    const longitude = record["geo:long"];
    const nameJa = stationNameFromRecord(record);
    const railway = textValue(record["odpt:railway"]);
    if (!nameJa || !configuredRailways.has(railway)) return;

    const hasCoordinate = typeof latitude === "number" && typeof longitude === "number";
    const stationLatitude = hasCoordinate ? latitude : null;
    const stationLongitude = hasCoordinate ? longitude : null;

    const title = record["odpt:stationTitle"] ?? {};
    const current = findMergeTarget(grouped, record, nameJa, stationLatitude, stationLongitude);
    const lineName = railwayToDisplayName(railway);
    const operator = textValue(record["odpt:operator"]);
    const stationCode = textValue(record["odpt:stationCode"]);

    if (current) {
      current.lines = appendUnique(current.lines, lineName);
      current.operators = appendUnique(current.operators, operator);
      current.stationCodes = appendUnique(current.stationCodes, stationCode);
      return;
    }

    grouped.push({
      id: textValue(record["owl:sameAs"]) || `${stationKey(nameJa)}:${railway || grouped.length}`,
      latitude: stationLatitude,
      lines: lineName ? [lineName] : [],
      longitude: stationLongitude,
      name: nameJa,
      nameEn: title.en || "",
      nameJa,
      nameKana: title["ja-Hrkt"] || "",
      nameZhCN: title["zh-Hans"] || nameJa,
      nameZhTW: title["zh-Hant"] || nameJa,
      operators: operator ? [operator] : [],
      source: "odpt",
      stationCodes: stationCode ? [stationCode] : [],
      ward: stationLatitude !== null && stationLongitude !== null ? getTokyoWardByCoordinate(stationLatitude, stationLongitude) : null,
    });
  });

  return grouped.sort((left, right) => {
    const wardCompare = (left.ward ?? "").localeCompare(right.ward ?? "", "ja");
    if (wardCompare !== 0) return wardCompare;
    return left.nameJa.localeCompare(right.nameJa, "ja");
  });
}

function findMergeTarget(grouped: TokyoStation[], record: OdptStation, nameJa: string, latitude: number | null, longitude: number | null) {
  const sameAs = textValue(record["owl:sameAs"]);
  const sameId = sameAs ? grouped.find((station) => station.id === sameAs) : null;
  if (sameId) return sameId;

  if (typeof latitude !== "number" || typeof longitude !== "number") return null;

  return (
    grouped.find((station) => {
      if (stationKey(station.nameJa) !== stationKey(nameJa)) return false;
      if (typeof station.latitude !== "number" || typeof station.longitude !== "number") return false;
      return getDistanceKm(latitude, longitude, station.latitude, station.longitude) < 0.8;
    }) ?? null
  );
}

function stationNameFromRecord(record: OdptStation) {
  const title = record["odpt:stationTitle"] ?? {};
  return title.ja || textValue(record["dc:title"]);
}

function stationKey(nameJa: string) {
  return normalizeStationName(nameJa);
}

function normalizeStationName(name: string) {
  return name.trim().replace(/駅$/u, "");
}

function railwayToDisplayName(railway: string) {
  const config = tokyoRailLineConfigs.find((line) => line.railways.includes(railway));
  return config?.name.ja ?? railway.replace(/^odpt\.Railway:/, "").replace(/\./g, " ");
}

function textValue(value: unknown) {
  return typeof value === "string" ? value : "";
}

function appendUnique(items: string[], value: string) {
  if (!value || items.includes(value)) return items;
  return [...items, value];
}

function getDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const earthRadius = 6371;
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}
