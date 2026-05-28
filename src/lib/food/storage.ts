import type { FoodDailyPick, FoodHistoryItem, FoodPreference, FoodSkipRule, FoodWeatherMood } from "@/lib/food/types";

const foodFavoriteKey = "japan-life:food:favorites";
const foodDailyPickKey = "japan-life-food-daily-pick";
const foodRecentEatenKey = "japan-life:food:recent-eaten";
const foodPreferencesKey = "japan-life:food:preferences";
const legacyFoodSkippedByDateKey = "japan-life:food:skipped-by-date";

export const foodPreferences: FoodPreference[] = ["喜欢热的", "喜欢清爽", "喜欢省钱", "喜欢吃饱", "喜欢甜的", "不想油腻", "不想太贵", "不想走远"];
export const foodSkipRules: FoodSkipRule[] = ["不想吃面", "不想吃饭", "不想吃肉", "不想吃甜", "不想吃便利店", "不想吃太贵"];

const foodWeatherMoods: FoodWeatherMood[] = ["晴天", "下雨", "有点冷", "有点热", "普通"];

function skippedKeyForDate(dateKey: string) {
  return `japan-life-food-skipped-${dateKey}`;
}

function skippedRulesKeyForDate(dateKey: string) {
  return `japan-life-food-skip-rules-${dateKey}`;
}

function safeParse<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch (error) {
    console.warn(`[food] localStorage read failed: ${key}`, error);
    return fallback;
  }
}

function safeWrite(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn(`[food] localStorage write failed: ${key}`, error);
  }
}

function safeRemove(key: string) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(key);
  } catch (error) {
    console.warn(`[food] localStorage remove failed: ${key}`, error);
  }
}

function readStringArray(key: string) {
  const parsed = safeParse<unknown>(key, []);
  return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
}

function writeStringArray(key: string, value: string[]) {
  safeWrite(key, Array.from(new Set(value)));
}

function readLegacySkippedIds(dateKey: string) {
  const parsed = safeParse<unknown>(legacyFoodSkippedByDateKey, {});
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return [];
  const ids = (parsed as Record<string, unknown>)[dateKey];
  return Array.isArray(ids) ? ids.filter((item): item is string => typeof item === "string") : [];
}

export function readFoodFavoriteIds() {
  return readStringArray(foodFavoriteKey);
}

export function writeFoodFavoriteIds(ids: string[]) {
  writeStringArray(foodFavoriteKey, ids);
}

export function readFoodPreferences() {
  return readStringArray(foodPreferencesKey).filter((item): item is FoodPreference => foodPreferences.includes(item as FoodPreference));
}

export function writeFoodPreferences(preferences: FoodPreference[]) {
  writeStringArray(foodPreferencesKey, preferences);
}

export function readFoodSkippedIds(dateKey: string) {
  const ids = readStringArray(skippedKeyForDate(dateKey));
  return ids.length > 0 ? ids : readLegacySkippedIds(dateKey);
}

export function addFoodSkippedId(dateKey: string, id: string) {
  const nextIds = [id, ...readFoodSkippedIds(dateKey).filter((item) => item !== id)];
  writeStringArray(skippedKeyForDate(dateKey), nextIds);
  return nextIds;
}

export function readFoodSkipRules(dateKey: string) {
  return readStringArray(skippedRulesKeyForDate(dateKey)).filter((item): item is FoodSkipRule => foodSkipRules.includes(item as FoodSkipRule));
}

export function writeFoodSkipRules(dateKey: string, rules: FoodSkipRule[]) {
  writeStringArray(skippedRulesKeyForDate(dateKey), rules);
}

export function readFoodDailyPick(dateKey: string): FoodDailyPick | null {
  const parsed = safeParse<unknown>(foodDailyPickKey, null);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
  const pick = parsed as Partial<FoodDailyPick>;
  if (pick.date !== dateKey || typeof pick.foodId !== "string") return null;
  if (pick.activeTag !== "全部" && typeof pick.activeTag !== "string") return null;
  if (!foodWeatherMoods.includes(pick.weatherMood as FoodWeatherMood)) return null;
  return {
    activeTag: pick.activeTag ?? "全部",
    date: pick.date,
    direction: pick.direction ?? null,
    foodId: pick.foodId,
    weatherMood: pick.weatherMood as FoodWeatherMood,
  };
}

export function writeFoodDailyPick(pick: FoodDailyPick) {
  safeWrite(foodDailyPickKey, pick);
}

export function readFoodRecentEaten() {
  const parsed = safeParse<unknown>(foodRecentEatenKey, []);
  if (!Array.isArray(parsed)) return [];
  return parsed.filter((item): item is FoodHistoryItem => {
    if (!item || typeof item !== "object") return false;
    const entry = item as Partial<FoodHistoryItem>;
    return typeof entry.foodId === "string" && typeof entry.name === "string" && typeof entry.date === "string" && typeof entry.timeLabel === "string" && typeof entry.weatherMood === "string";
  });
}

export function addFoodRecentEaten(entry: FoodHistoryItem) {
  const nextItems = [entry, ...readFoodRecentEaten().filter((item) => !(item.foodId === entry.foodId && item.date === entry.date))].slice(0, 5);
  safeWrite(foodRecentEatenKey, nextItems);
  return nextItems;
}

export function resetFoodToday(dateKey: string) {
  safeRemove(foodDailyPickKey);
  safeRemove(skippedKeyForDate(dateKey));
  safeRemove(skippedRulesKeyForDate(dateKey));
}
