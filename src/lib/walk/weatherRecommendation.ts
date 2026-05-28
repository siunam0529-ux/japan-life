import { getWalkContext, type WalkContext, type WalkWeatherMode } from "@/lib/walk/recommendationLogic";
import type { WalkSpot } from "@/lib/walk/spots";
import type { WeatherCurrent, WeatherForecast, WeatherLocation } from "@/types/weather";

export type WalkWeatherSnapshot = {
  description: string;
  isCold: boolean;
  isHot: boolean;
  isRainy: boolean;
  locationName: string;
  mode: WalkWeatherMode;
  recommendation: string;
  source: "fallback" | "open-meteo";
  temperature: number | null;
  weatherCode: number | null;
};

export const defaultTokyoWalkWeatherLocation: WeatherLocation = {
  id: "walk-tokyo",
  latitude: 35.6762,
  longitude: 139.6503,
  name: {
    "zh-CN": "东京",
    "zh-TW": "東京",
    ja: "東京",
  },
};

const rainyCodes = new Set([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99]);
const snowyCodes = new Set([71, 73, 75, 77, 85, 86]);
const clearCodes = new Set([0, 1]);

export function getWalkWeatherDescription(code: number | null) {
  if (code === null) return "天气变化";
  if (code === 0) return "晴天";
  if ([1, 2].includes(code)) return "少云";
  if (code === 3) return "多云";
  if ([45, 48].includes(code)) return "有雾";
  if ([51, 53, 55, 56, 57].includes(code)) return "小雨";
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return "有雨";
  if (snowyCodes.has(code)) return "有雪";
  if ([95, 96, 99].includes(code)) return "雷雨";
  return "天气变化";
}

function buildSnapshotMode({ isCold, isHot, isRainy, weatherCode }: { isCold: boolean; isHot: boolean; isRainy: boolean; weatherCode: number | null }): WalkWeatherMode {
  if (isRainy) return "rainy";
  if (isHot) return "hot";
  if (isCold) return "cold";
  if (weatherCode !== null && clearCodes.has(weatherCode)) return "sunny";
  return "mild";
}

export function buildWalkWeatherRecommendation(snapshot: Pick<WalkWeatherSnapshot, "isCold" | "isHot" | "isRainy" | "mode">, spot?: Pick<WalkSpot, "station">) {
  const target = spot ? `推荐去${spot.station}` : "推荐找一个适合散步的地方";
  if (snapshot.isRainy) return `今天可能会下雨，${target}，优先选咖啡店、书店或商店街附近。`;
  if (snapshot.isHot) return `今天有点热，${target}，适合绿荫、河边或可以进室内休息的路线。`;
  if (snapshot.isCold) return `今天有点凉，${target}，适合逛书店、咖啡店和有热食的小街区。`;
  if (snapshot.mode === "sunny") return `今天天气不错，${target}，公园、河边、神社和小巷会更舒服。`;
  return `今天体感还不错，${target}，慢慢走一段就好。`;
}

export function createWalkWeatherSnapshot({
  current,
  locationName,
  source,
}: {
  current: WeatherCurrent | null;
  locationName: string;
  source: "fallback" | "open-meteo";
}): WalkWeatherSnapshot {
  const temperature = current?.temperature ?? null;
  const weatherCode = current?.weatherCode ?? null;
  const isRainy = Boolean(
    (weatherCode !== null && (rainyCodes.has(weatherCode) || snowyCodes.has(weatherCode))) ||
      (current?.precipitation ?? 0) > 0 ||
      (current?.rain ?? 0) > 0 ||
      (current?.showers ?? 0) > 0 ||
      (current?.snowfall ?? 0) > 0,
  );
  const isHot = typeof temperature === "number" && temperature >= 28;
  const isCold = typeof temperature === "number" && temperature <= 10;
  const mode = buildSnapshotMode({ isCold, isHot, isRainy, weatherCode });
  const baseSnapshot = {
    description: getWalkWeatherDescription(weatherCode),
    isCold,
    isHot,
    isRainy,
    locationName,
    mode,
    source,
    temperature,
    weatherCode,
  };
  return {
    ...baseSnapshot,
    recommendation: buildWalkWeatherRecommendation(baseSnapshot),
  };
}

export function createWalkWeatherSnapshotFromForecast(forecast: WeatherForecast, locationName: string) {
  return createWalkWeatherSnapshot({
    current: forecast.current,
    locationName,
    source: "open-meteo",
  });
}

export function createWalkWeatherFallbackSnapshot() {
  return {
    description: "天气暂时取得失败",
    isCold: false,
    isHot: false,
    isRainy: false,
    locationName: "东京",
    mode: "mild",
    recommendation: "天气暂时取得失败，先随机推荐一个适合散步的地方。",
    source: "fallback",
    temperature: null,
    weatherCode: null,
  } satisfies WalkWeatherSnapshot;
}

export function applyWalkWeatherToContext(snapshot: WalkWeatherSnapshot, baseContext: WalkContext = getWalkContext()): WalkContext {
  return {
    ...baseContext,
    weatherLabel: snapshot.description,
    weatherMessage: snapshot.recommendation,
    weatherMode: snapshot.mode,
  };
}

