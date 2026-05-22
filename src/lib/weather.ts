import type { Region } from "@/hooks/useUserSettings";
import type { Language } from "@/lib/i18n/translations";
import type { WeatherForecast, WeatherLocation } from "@/types/weather";

const weatherCachePrefix = "japan-life-weather";
const weatherCacheTtl = 60 * 60 * 1000;

type OpenMeteoDaily = {
  time?: string[];
  weather_code?: number[];
  temperature_2m_max?: number[];
  temperature_2m_min?: number[];
  precipitation_probability_max?: number[];
};

type OpenMeteoResponse = {
  latitude?: number;
  longitude?: number;
  timezone?: string;
  daily?: OpenMeteoDaily;
};

export const weatherLocations: Record<Region, WeatherLocation | null> = {
  tokyo: { id: "tokyo", name: { "zh-CN": "东京", "zh-TW": "東京", ja: "東京" }, latitude: 35.6938, longitude: 139.7034 },
  osaka: { id: "osaka", name: { "zh-CN": "大阪", "zh-TW": "大阪", ja: "大阪" }, latitude: 34.6937, longitude: 135.5023 },
  kyoto: { id: "kyoto", name: { "zh-CN": "京都", "zh-TW": "京都", ja: "京都" }, latitude: 35.0116, longitude: 135.7681 },
  fukuoka: { id: "fukuoka", name: { "zh-CN": "福冈", "zh-TW": "福岡", ja: "福岡" }, latitude: 33.5902, longitude: 130.4017 },
  other: null,
};

export const tokyoWeatherAreaOptions: WeatherLocation[] = [
  weatherLocations.tokyo,
  { id: "chiyoda", name: { "zh-CN": "千代田区", "zh-TW": "千代田區", ja: "千代田区" }, latitude: 35.6940, longitude: 139.7536 },
  { id: "chuo", name: { "zh-CN": "中央区", "zh-TW": "中央區", ja: "中央区" }, latitude: 35.6706, longitude: 139.7720 },
  { id: "minato", name: { "zh-CN": "港区", "zh-TW": "港區", ja: "港区" }, latitude: 35.6581, longitude: 139.7516 },
  { id: "shinjuku", name: { "zh-CN": "新宿区", "zh-TW": "新宿區", ja: "新宿区" }, latitude: 35.6938, longitude: 139.7034 },
  { id: "bunkyo", name: { "zh-CN": "文京区", "zh-TW": "文京區", ja: "文京区" }, latitude: 35.7080, longitude: 139.7522 },
  { id: "taito", name: { "zh-CN": "台东区", "zh-TW": "台東區", ja: "台東区" }, latitude: 35.7126, longitude: 139.7800 },
  { id: "sumida", name: { "zh-CN": "墨田区", "zh-TW": "墨田區", ja: "墨田区" }, latitude: 35.7107, longitude: 139.8015 },
  { id: "koto", name: { "zh-CN": "江东区", "zh-TW": "江東區", ja: "江東区" }, latitude: 35.6728, longitude: 139.8174 },
  { id: "shinagawa", name: { "zh-CN": "品川区", "zh-TW": "品川區", ja: "品川区" }, latitude: 35.6092, longitude: 139.7301 },
  { id: "meguro", name: { "zh-CN": "目黑区", "zh-TW": "目黑區", ja: "目黒区" }, latitude: 35.6415, longitude: 139.6982 },
  { id: "ota", name: { "zh-CN": "大田区", "zh-TW": "大田區", ja: "大田区" }, latitude: 35.5613, longitude: 139.7160 },
  { id: "setagaya", name: { "zh-CN": "世田谷区", "zh-TW": "世田谷區", ja: "世田谷区" }, latitude: 35.6466, longitude: 139.6532 },
  { id: "shibuya", name: { "zh-CN": "涩谷区", "zh-TW": "澀谷區", ja: "渋谷区" }, latitude: 35.6618, longitude: 139.7041 },
  { id: "nakano", name: { "zh-CN": "中野区", "zh-TW": "中野區", ja: "中野区" }, latitude: 35.7074, longitude: 139.6638 },
  { id: "suginami", name: { "zh-CN": "杉并区", "zh-TW": "杉並區", ja: "杉並区" }, latitude: 35.6995, longitude: 139.6364 },
  { id: "toshima", name: { "zh-CN": "丰岛区", "zh-TW": "豐島區", ja: "豊島区" }, latitude: 35.7261, longitude: 139.7166 },
  { id: "kita", name: { "zh-CN": "北区", "zh-TW": "北區", ja: "北区" }, latitude: 35.7528, longitude: 139.7336 },
  { id: "arakawa", name: { "zh-CN": "荒川区", "zh-TW": "荒川區", ja: "荒川区" }, latitude: 35.7362, longitude: 139.7834 },
  { id: "itabashi", name: { "zh-CN": "板桥区", "zh-TW": "板橋區", ja: "板橋区" }, latitude: 35.7512, longitude: 139.7093 },
  { id: "nerima", name: { "zh-CN": "练马区", "zh-TW": "練馬區", ja: "練馬区" }, latitude: 35.7356, longitude: 139.6517 },
  { id: "adachi", name: { "zh-CN": "足立区", "zh-TW": "足立區", ja: "足立区" }, latitude: 35.7750, longitude: 139.8044 },
  { id: "katsushika", name: { "zh-CN": "葛饰区", "zh-TW": "葛飾區", ja: "葛飾区" }, latitude: 35.7434, longitude: 139.8472 },
  { id: "edogawa", name: { "zh-CN": "江户川区", "zh-TW": "江戶川區", ja: "江戸川区" }, latitude: 35.7066, longitude: 139.8682 },
].filter(Boolean) as WeatherLocation[];

export function getWeatherLocation(region: Region | undefined | null, areaId?: string | null) {
  if (!region) return null;
  if (region === "tokyo" && areaId) {
    const tokyoArea = tokyoWeatherAreaOptions.find((item) => item.id === areaId);
    if (tokyoArea) return tokyoArea;
  }
  return weatherLocations[region] ?? null;
}

export function getWeatherLocationName(location: WeatherLocation, language: Language) {
  return location.name[language];
}

export async function fetchWeatherForecast(location: WeatherLocation): Promise<WeatherForecast> {
  const cached = readWeatherCache(location.id);
  if (cached) return cached;

  const params = new URLSearchParams({
    latitude: String(location.latitude),
    longitude: String(location.longitude),
    daily: "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max",
    timezone: "Asia/Tokyo",
  });
  const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params.toString()}`);
  if (!response.ok) throw new Error(`Open-Meteo HTTP ${response.status}`);
  const data = normalizeWeatherResponse(await response.json());
  writeWeatherCache(location.id, data);
  return data;
}

export function getWeatherDescription(code: number, language: Language) {
  if (code === 0) return { "zh-CN": "晴", "zh-TW": "晴", ja: "晴れ" }[language];
  if ([1, 2, 3].includes(code)) return { "zh-CN": "多云", "zh-TW": "多雲", ja: "くもり" }[language];
  if ([45, 48].includes(code)) return { "zh-CN": "有雾", "zh-TW": "有霧", ja: "霧" }[language];
  if ([51, 53, 55, 56, 57].includes(code)) return { "zh-CN": "毛毛雨", "zh-TW": "毛毛雨", ja: "霧雨" }[language];
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return { "zh-CN": "有雨", "zh-TW": "有雨", ja: "雨" }[language];
  if ([71, 73, 75, 77, 85, 86].includes(code)) return { "zh-CN": "有雪", "zh-TW": "有雪", ja: "雪" }[language];
  if ([95, 96, 99].includes(code)) return { "zh-CN": "雷雨", "zh-TW": "雷雨", ja: "雷雨" }[language];
  return { "zh-CN": "天气变化", "zh-TW": "天氣變化", ja: "天気変化" }[language];
}

function normalizeWeatherResponse(data: OpenMeteoResponse): WeatherForecast {
  const daily = data.daily ?? {};
  const times = daily.time ?? [];
  return {
    latitude: Number(data.latitude ?? 0),
    longitude: Number(data.longitude ?? 0),
    timezone: data.timezone ?? "Asia/Tokyo",
    fetchedAt: new Date().toISOString(),
    daily: times.map((date, index) => ({
      date,
      maxTemperature: Number(daily.temperature_2m_max?.[index] ?? 0),
      minTemperature: Number(daily.temperature_2m_min?.[index] ?? 0),
      precipitationProbability: Number(daily.precipitation_probability_max?.[index] ?? 0),
      weatherCode: Number(daily.weather_code?.[index] ?? 0),
    })),
  };
}

function readWeatherCache(locationId: string) {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(`${weatherCachePrefix}:${locationId}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as WeatherForecast;
    if (!parsed.fetchedAt || Date.now() - new Date(parsed.fetchedAt).getTime() > weatherCacheTtl) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeWeatherCache(locationId: string, forecast: WeatherForecast) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(`${weatherCachePrefix}:${locationId}`, JSON.stringify(forecast));
}
