import { foodRecommendations } from "@/lib/food/recommendations";
import type { FoodDirection, FoodMoodTag, FoodPreference, FoodRecommendation, FoodSkipRule, FoodTimeSlot, FoodWeatherMood, FoodWeatherTag } from "@/lib/food/types";

export type FoodContext = {
  timeSlot: FoodTimeSlot;
  timeMessage: string;
  weatherMood: FoodWeatherMood;
  weatherTag: FoodWeatherTag;
  weatherMessage: string;
};

export const foodDirections: FoodDirection[] = ["省钱一点", "热一点", "清爽一点", "吃饱一点", "轻一点", "深夜现实一点"];

const weatherTagByMood: Record<FoodWeatherMood, FoodWeatherTag> = {
  晴天: "晴天",
  下雨: "下雨",
  有点冷: "寒冷",
  有点热: "炎热",
  普通: "阴天",
};

const meatFoodIds = new Set(["gyudon", "oyakodon", "tonkatsu", "yakiniku", "hamburg-steak", "korean-food"]);
const oilyFoodIds = new Set(["tonkatsu", "yakiniku", "ramen", "miso-ramen", "takoyaki"]);
const expensiveFoodIds = new Set(["sushi", "yakiniku", "nabe", "kaisendon", "korean-food"]);
const lightFoodIds = new Set(["soba", "vegetable-salad", "sandwich", "coffee-bread", "donut", "konbini-onigiri"]);

export function getTodayDateKey() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tokyo", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}

export function getFoodContext(now = new Date(), weatherMood: FoodWeatherMood = "普通"): FoodContext {
  const hour = Number(new Intl.DateTimeFormat("en-US", { hour: "numeric", hour12: false, timeZone: "Asia/Tokyo" }).format(now));

  const timeSlot: FoodTimeSlot =
    hour >= 5 && hour <= 10 ? "早上" : hour >= 11 && hour <= 14 ? "中午" : hour >= 15 && hour <= 16 ? "下午" : hour >= 17 && hour <= 21 ? "晚上" : "深夜";
  const timeMessage =
    timeSlot === "早上"
      ? "适合吃点轻的，让一天慢慢开始。"
      : timeSlot === "中午"
        ? "适合吃得稳一点，下午才有力气。"
        : timeSlot === "下午"
          ? "可以吃点轻食或甜的，给自己一点小休息。"
          : timeSlot === "晚上"
            ? "适合吃一点热的或能好好坐下来的东西。"
            : "适合选近一点、热一点、容易买到的食物。";

  const weatherTag = weatherTagByMood[weatherMood];
  const weatherMessage =
    weatherMood === "下雨"
      ? "今天下雨的话，热汤、乌冬或咖喱会比较省心。"
      : weatherMood === "有点热"
        ? "今天有点热，清爽一点会比较舒服。"
        : weatherMood === "有点冷"
          ? "今天有点冷，热乎的饭或汤会更合适。"
          : weatherMood === "晴天"
            ? "晴天适合吃得轻松一点，顺便给自己一点好心情。"
            : "今天感觉普通，就按时间和心情选一个稳妥的。";

  return { timeSlot, timeMessage, weatherMood, weatherTag, weatherMessage };
}

function matchesSkipRule(food: FoodRecommendation, rule: FoodSkipRule) {
  if (rule === "不想吃面") return food.category === "面类" || food.id === "home-noodles";
  if (rule === "不想吃饭") return food.category === "米饭" || food.id === "teishoku" || food.id === "curry-rice";
  if (rule === "不想吃肉") return meatFoodIds.has(food.id);
  if (rule === "不想吃甜") return food.category === "甜点" || food.moodTags.includes("想吃甜的");
  if (rule === "不想吃便利店") return food.category === "便利店";
  if (rule === "不想吃太贵") return expensiveFoodIds.has(food.id);
  return false;
}

export function filterFoods(activeTag: FoodMoodTag | "全部", skippedIds: string[], skipRules: FoodSkipRule[] = []) {
  return foodRecommendations.filter((food) => {
    const matchesTag = activeTag === "全部" ? true : food.moodTags.includes(activeTag);
    const skippedByRule = skipRules.some((rule) => matchesSkipRule(food, rule));
    return matchesTag && !skippedIds.includes(food.id) && !skippedByRule;
  });
}

function scorePreference(food: FoodRecommendation, preference: FoodPreference, context: FoodContext) {
  if (preference === "喜欢热的") return food.moodTags.includes("想吃热的") ? 4 : 0;
  if (preference === "喜欢清爽") return food.moodTags.includes("想吃清爽的") ? 4 : 0;
  if (preference === "喜欢省钱") return food.moodTags.includes("省钱") || food.id === "gyudon" || food.id === "teishoku" || food.id === "curry-rice" ? 4 : 0;
  if (preference === "喜欢吃饱") return food.moodTags.includes("吃饱一点") ? 4 : 0;
  if (preference === "喜欢甜的") return context.timeSlot === "下午" && food.moodTags.includes("想吃甜的") ? 5 : food.moodTags.includes("想吃甜的") ? 3 : 0;
  if (preference === "不想油腻") return oilyFoodIds.has(food.id) ? -6 : lightFoodIds.has(food.id) ? 2 : 0;
  if (preference === "不想太贵") return expensiveFoodIds.has(food.id) ? -6 : food.moodTags.includes("省钱") ? 3 : 0;
  if (preference === "不想走远") return food.moodTags.includes("不想走远") || food.category === "便利店" || food.category === "家里" ? 4 : 0;
  return 0;
}

function scoreDirection(food: FoodRecommendation, direction: FoodDirection | null | undefined) {
  if (!direction) return 0;
  if (direction === "省钱一点") return food.moodTags.includes("省钱") || food.id === "gyudon" || food.id === "curry-rice" ? 6 : 0;
  if (direction === "热一点") return food.moodTags.includes("想吃热的") ? 6 : 0;
  if (direction === "清爽一点") return food.moodTags.includes("想吃清爽的") ? 6 : 0;
  if (direction === "吃饱一点") return food.moodTags.includes("吃饱一点") ? 6 : 0;
  if (direction === "轻一点") return lightFoodIds.has(food.id) || food.category === "轻食" ? 6 : 0;
  if (direction === "深夜现实一点") return food.moodTags.includes("深夜") || food.moodTags.includes("不想走远") ? 6 : 0;
  return 0;
}

function scoreFood(food: FoodRecommendation, context: FoodContext, activeTag: FoodMoodTag | "全部", preferences: FoodPreference[], direction?: FoodDirection | null) {
  let score = 0;
  if (food.bestTime.includes(context.timeSlot)) score += 4;
  if (food.weatherTags.includes(context.weatherTag)) score += 3;
  if (activeTag !== "全部" && food.moodTags.includes(activeTag)) score += 5;
  if (context.timeSlot === "深夜" && food.moodTags.includes("不想走远")) score += 2;
  if (context.weatherMood === "下雨" && food.moodTags.includes("下雨天")) score += 2;
  if (context.weatherMood === "有点热" && food.moodTags.includes("想吃清爽的")) score += 2;
  if (context.weatherMood === "有点冷" && food.moodTags.includes("想吃热的")) score += 2;
  if (context.weatherMood === "晴天" && (food.id === "sushi" || food.id === "teishoku" || food.id === "sandwich" || food.id === "coffee-bread" || food.moodTags.includes("想吃甜的"))) score += 3;
  if (context.weatherMood === "下雨" && (food.id === "ramen" || food.id === "udon" || food.id === "nabe" || food.id === "oden" || food.id === "curry-rice")) score += 3;
  if (context.weatherMood === "有点冷" && (food.id === "miso-ramen" || food.id === "nabe" || food.id === "oden" || food.id === "curry-rice" || food.moodTags.includes("想吃热的"))) score += 3;
  if (context.weatherMood === "有点热" && (food.id === "cold-noodles" || food.id === "soba" || food.id === "sushi" || food.id === "vegetable-salad" || food.moodTags.includes("想吃清爽的"))) score += 3;
  preferences.forEach((preference) => {
    score += scorePreference(food, preference, context);
  });
  score += scoreDirection(food, direction);
  return score;
}

export function getRecommendedFoods(options: {
  activeTag: FoodMoodTag | "全部";
  context: FoodContext;
  direction?: FoodDirection | null;
  preferences?: FoodPreference[];
  skippedIds: string[];
  skipRules?: FoodSkipRule[];
}) {
  const preferences = options.preferences ?? [];
  return filterFoods(options.activeTag, options.skippedIds, options.skipRules ?? []).sort((left, right) => {
    const scoreDiff = scoreFood(right, options.context, options.activeTag, preferences, options.direction) - scoreFood(left, options.context, options.activeTag, preferences, options.direction);
    if (scoreDiff !== 0) return scoreDiff;
    return left.name.localeCompare(right.name);
  });
}

export function pickFood(options: {
  activeTag: FoodMoodTag | "全部";
  context: FoodContext;
  currentId?: string;
  direction?: FoodDirection | null;
  preferences?: FoodPreference[];
  skippedIds: string[];
  skipRules?: FoodSkipRule[];
}) {
  const candidates = getRecommendedFoods(options);
  if (candidates.length === 0) return null;
  const pool = options.currentId && candidates.length > 1 ? candidates.filter((food) => food.id !== options.currentId) : candidates;
  const index = Math.floor(Math.random() * pool.length);
  return pool[index] ?? candidates[0];
}
