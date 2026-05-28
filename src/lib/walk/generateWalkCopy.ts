import type { WalkContext } from "@/lib/walk/recommendationLogic";
import type { WalkTag, WalkSpot } from "@/lib/walk/spots";
import type { WalkWeatherSnapshot } from "@/lib/walk/weatherRecommendation";
import type { WalkFeedbackId } from "@/lib/walk/feedback";

export type WalkCopyInput = {
  activeTag: WalkTag | "全部";
  feedbackIds: WalkFeedbackId[];
  isFavorite: boolean;
  visitCount: number;
  spot: WalkSpot;
  weather: WalkWeatherSnapshot;
  context: WalkContext;
};

function hasText(spot: WalkSpot, keyword: string) {
  return `${spot.title} ${spot.subtitle} ${spot.reason} ${spot.walkTask} ${spot.bestTime} ${spot.duration} ${spot.budget} ${spot.moodTags.join(" ")} ${spot.weatherTags.join(" ")}`.includes(keyword);
}

function buildWeatherLead(input: WalkCopyInput) {
  if (input.weather.isRainy) return `下雨天不太适合跑远，${input.spot.station}这种能躲进咖啡店或小店的地方会比较舒服。`;
  if (input.weather.isCold) return `今天有点冷，适合去${input.spot.station}找一家书店或咖啡店慢慢逛。`;
  if (input.weather.isHot) return `今天有点热，去${input.spot.station}找树影、河边或能坐下来的小店会轻松一点。`;
  if (input.weather.mode === "sunny") return `今天天气不错，${input.spot.station}适合走慢一点，看看街角和小店。`;
  return "";
}

function buildMoodLead(input: WalkCopyInput) {
  if (input.activeTag !== "全部") return `你今天选了「${input.activeTag}」，${input.spot.station}的节奏比较合适。`;
  if (input.spot.moodTags.includes("一个人")) return `${input.spot.station}适合一个人慢慢走，不用安排太满。`;
  if (input.spot.moodTags.includes("昭和感")) return `今天适合去${input.spot.station}看看旧招牌和有生活感的小店。`;
  return "";
}

function buildHistoryLead(input: WalkCopyInput) {
  if (input.visitCount === 0) return `你最近还没去过${input.spot.station}，今天可以轻松走一走。`;
  if (input.isFavorite) return `${input.spot.station}已经在你的收藏里，今天适合再去走一小段。`;
  return "";
}

export function generateWalkRecommendationCopy(input: WalkCopyInput) {
  return buildWeatherLead(input) || buildMoodLead(input) || buildHistoryLead(input) || `${input.context.timeLabel}适合去${input.spot.station}，慢慢走一段就好。`;
}

export function generateWalkReasonList(input: WalkCopyInput) {
  const reasons: string[] = [];
  if (input.activeTag !== "全部") reasons.push(`符合你今天选的「${input.activeTag}」心情`);
  if (input.weather.isRainy && (hasText(input.spot, "咖啡") || hasText(input.spot, "书店") || hasText(input.spot, "商店街"))) reasons.push("今天的天气适合咖啡店、书店或商店街");
  if (input.weather.isCold && (hasText(input.spot, "书店") || hasText(input.spot, "咖啡") || hasText(input.spot, "拉面"))) reasons.push("天气偏凉，可以边走边找室内休息点");
  if (input.weather.isHot && (hasText(input.spot, "树影") || hasText(input.spot, "河") || hasText(input.spot, "室内"))) reasons.push("天气偏热，路线里有阴凉或能坐下的地方");
  if (input.weather.mode === "sunny" && (hasText(input.spot, "公园") || hasText(input.spot, "河") || hasText(input.spot, "神社"))) reasons.push("晴天适合公园、河边或神社附近慢慢走");
  if (input.visitCount === 0) reasons.push(`你最近还没记录去过${input.spot.station}`);
  if (input.isFavorite) reasons.push("这是你收藏过的散步地点");
  if (input.feedbackIds.includes("notOutdoor")) reasons.push("已尽量避开纯室外路线");
  if (input.feedbackIds.includes("noSpend")) reasons.push("优先考虑花费不高的散步方式");
  if (input.feedbackIds.includes("tooTired")) reasons.push("今天适合短一点、轻一点的路线");
  if (input.spot.moodTags.includes("安静")) reasons.push("适合一个人安静地慢慢走");
  if (input.spot.duration.includes("1-2小时") || input.spot.duration.includes("1小时")) reasons.push("距离感不会太累");

  return Array.from(new Set(reasons)).slice(0, 3);
}

