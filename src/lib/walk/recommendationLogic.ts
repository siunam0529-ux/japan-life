import { getWalkSpotPool, walkSpots, type WalkSpot, type WalkTag } from "@/lib/walk/spots";
import type { WalkWeatherSnapshot } from "@/lib/walk/weatherRecommendation";
import type { WalkFeedbackId } from "@/lib/walk/feedback";

export type WalkTimeSlot = "morning" | "afternoon" | "evening" | "lateNight";
export type WalkWeatherMode = "sunny" | "rainy" | "cold" | "hot" | "mild";

export type WalkContext = {
  timeLabel: string;
  timeMessage: string;
  timeSlot: WalkTimeSlot;
  weatherLabel: string;
  weatherMessage: string;
  weatherMode: WalkWeatherMode;
};

const timeSlotRules: Record<WalkTimeSlot, { keywords: string[]; message: string; label: string }> = {
  morning: {
    keywords: ["公园", "河", "咖啡", "绿", "池塘", "湖", "上午"],
    label: "早上",
    message: "现在是早上，适合去公园、河边或者咖啡街区慢慢醒来。",
  },
  afternoon: {
    keywords: ["小店", "书店", "商店街", "杂货", "甜点", "下午"],
    label: "下午",
    message: "现在是下午，适合慢慢逛小店、书店和商店街。",
  },
  evening: {
    keywords: ["夜", "灯", "酒场", "热闹", "傍晚", "晚上"],
    label: "晚上",
    message: "现在是晚上，适合去夜景、居酒屋街和热闹但安全的地方。",
  },
  lateNight: {
    keywords: ["安静", "便利店", "住宅街", "深夜", "1小时"],
    label: "深夜",
    message: "现在比较晚，适合近一点、安静一点的街区，不推荐跑太远。",
  },
};

const weatherRules: Record<WalkWeatherMode, { keywords: string[]; message: string; label: string }> = {
  sunny: {
    keywords: ["晴天", "公园", "河", "神社", "街区", "微风"],
    label: "晴天",
    message: "今天是晴天，适合公园、河边、神社和街区散步。",
  },
  rainy: {
    keywords: ["下雨天", "商店街", "咖啡", "书店", "室内", "地下"],
    label: "下雨",
    message: "今天有雨，推荐商店街、咖啡店、书店和室内感强的地方。",
  },
  cold: {
    keywords: ["咖啡", "书店", "热", "拉面", "喫茶", "凉爽"],
    label: "有点冷",
    message: "今天有点冷，推荐找一家咖啡店、书店或热汤店附近休息。",
  },
  hot: {
    keywords: ["绿", "公园", "树影", "室内", "商场", "阴凉"],
    label: "有点热",
    message: "今天有点热，适合商场、绿荫、公园阴凉处和室内区域。",
  },
  mild: {
    keywords: ["微风", "凉爽", "阴天", "安静", "小店"],
    label: "舒服",
    message: "今天体感还不错，适合轻松散步，不用把行程安排得太满。",
  },
};

export function getWalkTimeSlot(date = new Date()): WalkTimeSlot {
  const hour = date.getHours();
  if (hour < 11) return "morning";
  if (hour < 18) return "afternoon";
  if (hour < 23) return "evening";
  return "lateNight";
}

export function getMockWalkWeather(date = new Date()): WalkWeatherMode {
  const month = date.getMonth() + 1;
  if (month <= 2 || month === 12) return "cold";
  if (month >= 7 && month <= 8) return "hot";
  const modes: WalkWeatherMode[] = ["sunny", "mild", "rainy", "mild", "sunny"];
  return modes[date.getDay() % modes.length];
}

export function getWalkContext(date = new Date()): WalkContext {
  const timeSlot = getWalkTimeSlot(date);
  const weatherMode = getMockWalkWeather(date);
  return {
    timeLabel: timeSlotRules[timeSlot].label,
    timeMessage: timeSlotRules[timeSlot].message,
    timeSlot,
    weatherLabel: weatherRules[weatherMode].label,
    weatherMessage: weatherRules[weatherMode].message,
    weatherMode,
  };
}

function spotText(spot: WalkSpot) {
  return `${spot.station} ${spot.area} ${spot.title} ${spot.subtitle} ${spot.reason} ${spot.walkTask} ${spot.bestTime} ${spot.duration} ${spot.budget} ${spot.difficulty} ${spot.stepsEstimate} ${spot.moodTags.join(" ")} ${spot.weatherTags.join(" ")} ${spot.suitableFor.join(" ")}`;
}

function isRainFriendlySpot(spot: WalkSpot) {
  const text = spotText(spot);
  return ["下雨", "下雨天", "室内", "地下", "咖啡", "喫茶", "书店", "商店街", "商场"].some((keyword) => text.includes(keyword));
}

function pickRandomSpot(candidates: WalkSpot[]) {
  return candidates[Math.floor(Math.random() * candidates.length)] ?? walkSpots[0];
}

export function recommendWalkSpot({
  activeTag = "全部",
  context,
  currentId,
  poolOverride,
  skippedSpotIds = [],
  weatherSnapshot,
}: {
  activeTag?: WalkTag | "全部";
  context: WalkContext;
  currentId?: string;
  feedbackIds?: WalkFeedbackId[];
  poolOverride?: WalkSpot[];
  skippedSpotIds?: string[];
  weatherSnapshot?: WalkWeatherSnapshot;
}) {
  const skippedSet = new Set(skippedSpotIds);
  const pool = (poolOverride ?? getWalkSpotPool(activeTag)).filter((spot) => !skippedSet.has(spot.id));
  const baseCandidates = pool.length > 0 ? pool : poolOverride ?? getWalkSpotPool(activeTag);
  const candidates = baseCandidates.length > 1 && currentId ? baseCandidates.filter((spot) => spot.id !== currentId) : baseCandidates;
  const randomSpot = pickRandomSpot(candidates);
  const isRainy = weatherSnapshot?.isRainy || context.weatherMode === "rainy";

  if (isRainy && !isRainFriendlySpot(randomSpot)) {
    const rainyCandidates = candidates.filter(isRainFriendlySpot);
    if (rainyCandidates.length > 0) return pickRandomSpot(rainyCandidates);
  }

  return randomSpot;
}

export function buildWalkAiSuggestion({ activeTag, context, spot }: { activeTag: WalkTag | "全部"; context: WalkContext; spot: WalkSpot }) {
  const tagText = activeTag === "全部" ? "今天不用想太多" : `你今天想要「${activeTag}」一点`;
  if (context.weatherMode === "cold") return `今天有点冷，适合去${spot.station}找一家咖啡店或书店慢慢逛。`;
  if (context.weatherMode === "hot") return `今天有点热，${tagText}的话，去${spot.station}找绿荫和室内小店会舒服些。`;
  if (context.weatherMode === "rainy") return `今天有雨，适合去${spot.station}这种可以边躲雨边逛小店的地方。`;
  if (context.timeSlot === "lateNight") return `现在比较晚，建议在${spot.station}短距离散步，买杯热饮就早点回去。`;
  return `${context.timeLabel}适合去${spot.station}，按「${spot.moodTags[0]}」的节奏慢慢走，不用安排太满。`;
}
