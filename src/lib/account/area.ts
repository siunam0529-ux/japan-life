export const userSettingsKey = "japan-life:user-settings";

type AccountAreaSettings = {
  areaId?: unknown;
  location?: {
    city?: unknown;
    prefecture?: unknown;
  } | null;
  region?: unknown;
};

const regionLabels: Record<string, string> = {
  tokyo: "东京",
  osaka: "大阪",
  kyoto: "京都",
  fukuoka: "福冈",
};

const tokyoAreaLabels: Record<string, string> = {
  adachi: "东京 足立区",
  arakawa: "东京 荒川区",
  bunkyo: "东京 文京区",
  chiyoda: "东京 千代田区",
  chuo: "东京 中央区",
  edogawa: "东京 江户川区",
  itabashi: "东京 板桥区",
  katsushika: "东京 葛饰区",
  kita: "东京 北区",
  koto: "东京 江东区",
  meguro: "东京 目黑区",
  minato: "东京 港区",
  nakano: "东京 中野区",
  nerima: "东京 练马区",
  ota: "东京 大田区",
  setagaya: "东京 世田谷区",
  shibuya: "东京 涩谷区",
  shinagawa: "东京 品川区",
  shinjuku: "东京 新宿区",
  suginami: "东京 杉并区",
  sumida: "东京 墨田区",
  taito: "东京 台东区",
  toshima: "东京 丰岛区",
};

export function formatJapanAccountArea(area?: string | null) {
  const normalized = (area || "").trim();
  if (!normalized || normalized === "日本" || normalized.toLowerCase() === "other") return "日本";
  if (normalized.startsWith("日本")) return normalized;
  return `日本 ${normalized}`;
}

export function getAccountAreaDisplay(fallbackArea?: string | null) {
  if (typeof window === "undefined") return formatJapanAccountArea(fallbackArea);
  const settings = readAccountAreaSettings();
  const locationArea = getLocationArea(settings);
  if (locationArea) return formatJapanAccountArea(locationArea);

  const areaId = typeof settings?.areaId === "string" ? settings.areaId : "";
  if (areaId && areaId !== "tokyo" && tokyoAreaLabels[areaId]) {
    return formatJapanAccountArea(tokyoAreaLabels[areaId]);
  }

  const region = typeof settings?.region === "string" ? settings.region : "";
  if (region && region !== "other") return formatJapanAccountArea(regionLabels[region] || fallbackArea);
  return formatJapanAccountArea(fallbackArea);
}

function readAccountAreaSettings(): AccountAreaSettings | null {
  try {
    const raw = window.localStorage.getItem(userSettingsKey);
    return raw ? (JSON.parse(raw) as AccountAreaSettings) : null;
  } catch {
    return null;
  }
}

function getLocationArea(settings: AccountAreaSettings | null) {
  const prefecture = typeof settings?.location?.prefecture === "string" ? settings.location.prefecture.trim() : "";
  const city = typeof settings?.location?.city === "string" ? settings.location.city.trim() : "";
  if (!prefecture) return "";
  if (!city || city === prefecture) return prefecture;
  return `${prefecture} ${city}`;
}
