import { getTokyoDateKey, readWalkFeedbackByDate, writeWalkFeedbackByDate } from "@/lib/walk/storage";
import type { WalkSpot } from "@/lib/walk/spots";
import type { WalkFeedbackId } from "@/lib/walk/types";
export type { WalkFeedback, WalkFeedbackByDate, WalkFeedbackId } from "@/lib/walk/types";

export const walkFeedbackOptions: Array<{ id: WalkFeedbackId; label: string }> = [
  { id: "tooFar", label: "太远" },
  { id: "tooCrowded", label: "人太多" },
  { id: "notOutdoor", label: "不想室外" },
  { id: "noSpend", label: "不想花钱" },
  { id: "tooTired", label: "今天太累" },
];

export function readTodayWalkFeedback(date = getTokyoDateKey()) {
  return readWalkFeedbackByDate()[date] ?? [];
}

export function addTodayWalkFeedback(feedbackId: WalkFeedbackId, date = getTokyoDateKey()) {
  const feedbackByDate = readWalkFeedbackByDate();
  const next = Array.from(new Set([...(feedbackByDate[date] ?? []), feedbackId]));
  feedbackByDate[date] = next;
  writeWalkFeedbackByDate(feedbackByDate);
  return next;
}

function spotText(spot: WalkSpot) {
  return `${spot.station} ${spot.area} ${spot.title} ${spot.subtitle} ${spot.reason} ${spot.walkTask} ${spot.bestTime} ${spot.duration} ${spot.budget} ${spot.difficulty} ${spot.stepsEstimate} ${spot.moodTags.join(" ")} ${spot.weatherTags.join(" ")} ${spot.suitableFor.join(" ")}`;
}

function parseBudgetMin(spot: WalkSpot) {
  const match = spot.budget.match(/¥([\d,]+)/);
  return match ? Number(match[1].replace(/,/g, "")) : 9999;
}

export function scoreWalkSpotFeedback(spot: WalkSpot, feedbackIds: WalkFeedbackId[]) {
  if (feedbackIds.length === 0) return 0;
  const text = spotText(spot);
  let score = 0;
  if (feedbackIds.includes("notOutdoor")) {
    ["咖啡", "书店", "商店街", "室内", "喫茶"].forEach((keyword) => {
      if (text.includes(keyword)) score += 5;
    });
    ["公园", "河边"].forEach((keyword) => {
      if (text.includes(keyword)) score -= 2;
    });
  }
  if (feedbackIds.includes("noSpend")) {
    score += parseBudgetMin(spot) <= 500 || spot.suitableFor.includes("低预算") ? 7 : -4;
    if (spot.budget.includes("3,000") || spot.budget.includes("3,500")) score -= 3;
  }
  if (feedbackIds.includes("tooTired")) {
    if (spot.difficulty === "轻松") score += 8;
    if (spot.difficulty === "稍微累") score -= 6;
    if (spot.stepsEstimate === "3000步以内") score += 4;
    if (spot.duration.includes("1-2小时") || spot.duration.includes("1小时")) score += 5;
    if (spot.moodTags.includes("安静")) score += 2;
  }
  if (feedbackIds.includes("tooFar")) {
    if (spot.difficulty === "轻松" || spot.stepsEstimate === "3000步以内") score += 5;
    if (spot.duration.includes("2-3小时") || spot.difficulty === "稍微累") score -= 4;
  }
  if (feedbackIds.includes("tooCrowded")) {
    if (spot.moodTags.includes("安静") || spot.moodTags.includes("小众")) score += 4;
    ["新宿", "渋谷", "浅草"].forEach((keyword) => {
      if (spot.station.includes(keyword)) score -= 4;
    });
  }
  return score;
}

export function getWalkFeedbackSummary(feedbackIds: WalkFeedbackId[]) {
  if (feedbackIds.length === 0) return "还没有反馈，会按天气和心情推荐。";
  return `今天会避开：${feedbackIds.map((id) => walkFeedbackOptions.find((item) => item.id === id)?.label ?? id).join("、")}`;
}
