import { tokyoRailLineConfigs } from "@/data/trainStatus";
import { getTokyoWardByCoordinate } from "@/lib/stations/tokyoWards";
import type { TokyoStation } from "@/lib/stations/types";
import { getTokyoDateTimeString } from "@/lib/utils/format";

const odptStationEndpoint = "https://api.odpt.org/api/v4/odpt:Station";
const stationCacheTtlMs = 24 * 60 * 60 * 1000;

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
  const grouped = new Map<string, TokyoStation>();

  records.forEach((record) => {
    const latitude = record["geo:lat"];
    const longitude = record["geo:long"];
    const nameJa = stationNameFromRecord(record);
    if (!nameJa || typeof latitude !== "number" || typeof longitude !== "number") return;

    const ward = getTokyoWardByCoordinate(latitude, longitude);
    if (!ward) return;

    const title = record["odpt:stationTitle"] ?? {};
    const key = stationKey(nameJa);
    const current = grouped.get(key);
    const lineName = railwayToDisplayName(textValue(record["odpt:railway"]));
    const operator = textValue(record["odpt:operator"]);
    const stationCode = textValue(record["odpt:stationCode"]);

    if (current) {
      current.lines = appendUnique(current.lines, lineName);
      current.operators = appendUnique(current.operators, operator);
      current.stationCodes = appendUnique(current.stationCodes, stationCode);
      return;
    }

    grouped.set(key, {
      id: textValue(record["owl:sameAs"]) || key,
      latitude,
      lines: lineName ? [lineName] : [],
      longitude,
      name: nameJa,
      nameEn: title.en || "",
      nameJa,
      nameKana: title["ja-Hrkt"] || "",
      nameZhCN: title["zh-Hans"] || nameJa,
      nameZhTW: title["zh-Hant"] || nameJa,
      operators: operator ? [operator] : [],
      source: "odpt",
      stationCodes: stationCode ? [stationCode] : [],
      ward,
    });
  });

  records.forEach((record) => {
    const latitude = record["geo:lat"];
    const longitude = record["geo:long"];
    if (typeof latitude === "number" && typeof longitude === "number") return;

    const nameJa = stationNameFromRecord(record);
    if (!nameJa) return;

    const existing = grouped.get(stationKey(nameJa));
    if (!existing) return;

    existing.lines = appendUnique(existing.lines, railwayToDisplayName(textValue(record["odpt:railway"])));
    existing.operators = appendUnique(existing.operators, textValue(record["odpt:operator"]));
    existing.stationCodes = appendUnique(existing.stationCodes, textValue(record["odpt:stationCode"]));
  });

  return [...grouped.values()].sort((left, right) => {
    const wardCompare = (left.ward ?? "").localeCompare(right.ward ?? "", "ja");
    if (wardCompare !== 0) return wardCompare;
    return left.nameJa.localeCompare(right.nameJa, "ja");
  });
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
