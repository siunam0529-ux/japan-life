"use client";

import { ArrowLeft, CalendarCheck2, CloudSun, Heart, Info, RefreshCw, RotateCcw, SlidersHorizontal, Sparkles, Utensils, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CollapsiblePanel } from "@/components/CollapsiblePanel";
import { FoodCategoryTabs } from "@/components/food/FoodCategoryTabs";
import { FoodRecommendationCard } from "@/components/food/FoodRecommendationCard";
import { FoodTodayCard } from "@/components/food/FoodTodayCard";
import { NearbyRestaurantList } from "@/components/food/NearbyRestaurantList";
import { StationSearchPicker } from "@/components/stations/StationSearchPicker";
import { useLanguage } from "@/hooks/useLanguage";
import { useTokyoStations } from "@/hooks/useTokyoStations";
import { useUserSettings } from "@/hooks/useUserSettings";
import { generateFoodReasonItems } from "@/lib/food/generateFoodReason";
import { getHotpepperKeyword } from "@/lib/food/hotpepperKeyword";
import { foodCategories, foodRecommendations } from "@/lib/food/recommendations";
import { foodDirections, getFoodContext, getRecommendedFoods, getTodayDateKey, pickFood, type FoodContext } from "@/lib/food/recommendationLogic";
import {
  addFoodRecentEaten,
  addFoodSkippedId,
  foodPreferences as preferenceOptions,
  foodSkipRules as skipRuleOptions,
  readFoodDailyPick,
  readFoodFavoriteIds,
  readFoodPreferences,
  readFoodRecentEaten,
  readFoodSkippedIds,
  readFoodSkipRules,
  resetFoodToday,
  writeFoodDailyPick,
  writeFoodFavoriteIds,
  writeFoodPreferences,
  writeFoodSkipRules,
} from "@/lib/food/storage";
import type { FoodDailyPick, FoodDirection, FoodHistoryItem, FoodMoodTag, FoodPreference, FoodSkipRule, FoodWeatherMood, NearbyRestaurant } from "@/lib/food/types";
import { getStationDisplayName } from "@/lib/stations/stationSearch";
import type { TokyoStation } from "@/lib/stations/types";
import { getWeatherLocationFromSettings, getWeatherLocationName } from "@/lib/weather";

const weatherMoodOptions: FoodWeatherMood[] = ["晴天", "下雨", "有点冷", "有点热", "普通"];
const defaultTokyoLocation = { label: "东京中心附近", lat: 35.6762, lng: 139.6503 };

const initialFoodContext: FoodContext = {
  timeSlot: "中午",
  timeMessage: "适合吃得稳一点，下午才有力气。",
  weatherMood: "普通",
  weatherTag: "阴天",
  weatherMessage: "今天感觉普通，就按时间和心情选一个稳妥的。",
};

function saveDailyPick(pick: Omit<FoodDailyPick, "date">, dateKey: string) {
  writeFoodDailyPick({ ...pick, date: dateKey });
}

export default function FoodPage() {
  const { language } = useLanguage();
  const { settings } = useUserSettings();
  const { error: stationError, loading: stationsLoading, stations } = useTokyoStations();
  const [activeTag, setActiveTag] = useState<FoodMoodTag | "全部">("全部");
  const [weatherMood, setWeatherMood] = useState<FoodWeatherMood>("普通");
  const [context, setContext] = useState<FoodContext>(initialFoodContext);
  const [dateKey, setDateKey] = useState("2026-01-01");
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [skippedIds, setSkippedIds] = useState<string[]>([]);
  const [skipRules, setSkipRules] = useState<FoodSkipRule[]>([]);
  const [preferences, setPreferences] = useState<FoodPreference[]>([]);
  const [direction, setDirection] = useState<FoodDirection | null>(null);
  const [recentEaten, setRecentEaten] = useState<FoodHistoryItem[]>([]);
  const [restaurantError, setRestaurantError] = useState("");
  const [restaurantKeyword, setRestaurantKeyword] = useState("");
  const [restaurantLocationNotice, setRestaurantLocationNotice] = useState("");
  const [restaurantRange, setRestaurantRange] = useState(3);
  const [restaurantResults, setRestaurantResults] = useState<NearbyRestaurant[] | null>(null);
  const [restaurantsLoading, setRestaurantsLoading] = useState(false);
  const [selectedFoodId, setSelectedFoodId] = useState(foodRecommendations[0]?.id ?? "");
  const [restaurantSearchMode, setRestaurantSearchMode] = useState<"area" | "station">("area");
  const [selectedStation, setSelectedStation] = useState<TokyoStation | null>(null);

  useEffect(() => {
    const nextDateKey = getTodayDateKey();
    const savedPick = readFoodDailyPick(nextDateKey);
    const nextWeatherMood = savedPick?.weatherMood ?? "普通";
    const nextContext = getFoodContext(new Date(), nextWeatherMood);
    const favorites = readFoodFavoriteIds();
    const nextPreferences = readFoodPreferences();
    const skipped = readFoodSkippedIds(nextDateKey);
    const nextSkipRules = readFoodSkipRules(nextDateKey);
    const nextActiveTag = savedPick?.activeTag ?? "全部";
    const nextDirection = savedPick?.direction ?? null;
    const savedFood =
      savedPick && !skipped.includes(savedPick.foodId) ? getRecommendedFoods({ activeTag: nextActiveTag, context: nextContext, direction: nextDirection, preferences: nextPreferences, skippedIds: skipped, skipRules: nextSkipRules }).find((food) => food.id === savedPick.foodId) : null;
    const picked = savedFood ?? pickFood({ activeTag: nextActiveTag, context: nextContext, direction: nextDirection, preferences: nextPreferences, skippedIds: skipped, skipRules: nextSkipRules });

    setActiveTag(nextActiveTag);
    setWeatherMood(nextWeatherMood);
    setContext(nextContext);
    setDateKey(nextDateKey);
    setFavoriteIds(favorites);
    setPreferences(nextPreferences);
    setSkippedIds(skipped);
    setSkipRules(nextSkipRules);
    setDirection(nextDirection);
    setRecentEaten(readFoodRecentEaten());
    setSelectedFoodId(picked?.id ?? foodRecommendations[0]?.id ?? "");

    if (picked) {
      saveDailyPick({ activeTag: nextActiveTag, direction: nextDirection, foodId: picked.id, weatherMood: nextWeatherMood }, nextDateKey);
    }
  }, []);

  const recommendedFoods = useMemo(
    () => getRecommendedFoods({ activeTag, context, direction, preferences, skippedIds, skipRules }),
    [activeTag, context, direction, preferences, skippedIds, skipRules]
  );
  const selectedFood = recommendedFoods.find((food) => food.id === selectedFoodId) ?? recommendedFoods[0] ?? null;
  const favoriteFoods = useMemo(() => foodRecommendations.filter((food) => favoriteIds.includes(food.id)), [favoriteIds]);
  const reasonItems = selectedFood ? generateFoodReasonItems({ activeTag, context, direction, food: selectedFood, preferences, skipRules }) : [];
  const selectedFoodKeyword = selectedFood ? getHotpepperKeyword(selectedFood) : "";

  const appSelectedLocation = useMemo(() => {
    const location = getWeatherLocationFromSettings(settings);
    if (!location) return null;
    return {
      label: getWeatherLocationName(location, language),
      lat: location.latitude,
      lng: location.longitude,
    };
  }, [language, settings]);

  const getFoodSearchLocationFallback = () => appSelectedLocation ?? defaultTokyoLocation;

  const getUserLocation = () =>
    new Promise<{ fallback: boolean; label: string; lat: number; lng: number; source: "app" | "browser" | "station" }>((resolve) => {
      if (restaurantSearchMode === "station" && selectedStation) {
        resolve({ fallback: false, label: getStationDisplayName(selectedStation), lat: selectedStation.latitude, lng: selectedStation.longitude, source: "station" });
        return;
      }

      if (!navigator.geolocation) {
        resolve({ ...getFoodSearchLocationFallback(), fallback: true, source: "app" });
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => resolve({ fallback: false, label: "当前位置", lat: position.coords.latitude, lng: position.coords.longitude, source: "browser" }),
        () => resolve({ ...getFoodSearchLocationFallback(), fallback: true, source: "app" }),
        { enableHighAccuracy: false, maximumAge: 300000, timeout: 6000 }
      );
    });

  const searchNearbyRestaurants = async (range = restaurantRange) => {
    if (!selectedFood) return;
    const keyword = getHotpepperKeyword(selectedFood);
    const startedAt = Date.now();
    setRestaurantKeyword(keyword);
    setRestaurantRange(range);
    setRestaurantError("");
    setRestaurantLocationNotice("");
    setRestaurantResults(null);
    setRestaurantsLoading(true);

    try {
      const location = await getUserLocation();
      if (location.fallback) {
        setRestaurantLocationNotice(`无法取得当前位置，已使用${location.label}作为参考。`);
      } else if (location.source === "station") {
        setRestaurantLocationNotice(`已使用${location.label}附近作为参考。`);
      } else if (restaurantSearchMode === "area") {
        setRestaurantLocationNotice(`已使用${location.label}附近作为参考。`);
      }
      const params = new URLSearchParams({
        keyword,
        lat: String(location.lat),
        lng: String(location.lng),
        range: String(range),
      });
      const response = await fetch(`/api/food/hotpepper?${params.toString()}`);
      const data = (await response.json()) as { message?: string; restaurants?: NearbyRestaurant[] };

      if (!response.ok) {
        setRestaurantError(data.message || "附近店铺暂时取得失败，可以先用地图 APP 搜索这个关键词。");
        setRestaurantResults([]);
        return;
      }

      setRestaurantResults(Array.isArray(data.restaurants) ? data.restaurants : []);
    } catch {
      setRestaurantError("附近店铺暂时取得失败，可以先用地图 APP 搜索这个关键词。");
      setRestaurantResults([]);
    } finally {
      const elapsed = Date.now() - startedAt;
      if (elapsed < 450) {
        await new Promise((resolve) => window.setTimeout(resolve, 450 - elapsed));
      }
      setRestaurantsLoading(false);
    }
  };

  const setSelectedAndSave = (foodId: string, nextActiveTag = activeTag, nextWeatherMood = weatherMood, nextDirection = direction) => {
    setSelectedFoodId(foodId);
    setRestaurantError("");
    setRestaurantLocationNotice("");
    setRestaurantResults(null);
    saveDailyPick({ activeTag: nextActiveTag, direction: nextDirection, foodId, weatherMood: nextWeatherMood }, dateKey);
  };

  const selectStation = (station: TokyoStation) => {
    setSelectedStation(station);
    setRestaurantSearchMode("station");
    setRestaurantError("");
    setRestaurantLocationNotice("");
    setRestaurantResults(null);
  };

  const changeRestaurantSearchMode = (mode: "area" | "station") => {
    setRestaurantSearchMode(mode);
    setRestaurantError("");
    setRestaurantLocationNotice("");
    setRestaurantResults(null);
  };

  const selectFood = (id: string) => {
    setSelectedAndSave(id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const shuffleFood = () => {
    const picked = pickFood({ activeTag, context, currentId: selectedFood?.id, direction, preferences, skippedIds, skipRules });
    if (picked) setSelectedAndSave(picked.id);
  };

  const changeDirection = () => {
    const currentIndex = direction ? foodDirections.indexOf(direction) : -1;
    const nextDirection = foodDirections[(currentIndex + 1) % foodDirections.length];
    const picked = pickFood({ activeTag, context, currentId: selectedFood?.id, direction: nextDirection, preferences, skippedIds, skipRules });
    setDirection(nextDirection);
    if (picked) setSelectedAndSave(picked.id, activeTag, weatherMood, nextDirection);
  };

  const changeTag = (tag: FoodMoodTag | "全部") => {
    const nextFoods = getRecommendedFoods({ activeTag: tag, context, direction, preferences, skippedIds, skipRules });
    setActiveTag(tag);
    if (nextFoods[0]) setSelectedAndSave(nextFoods[0].id, tag);
    else setSelectedFoodId("");
  };

  const changeWeatherMood = (mood: FoodWeatherMood) => {
    const nextContext = getFoodContext(new Date(), mood);
    const nextFoods = getRecommendedFoods({ activeTag, context: nextContext, direction, preferences, skippedIds, skipRules });
    setWeatherMood(mood);
    setContext(nextContext);
    if (nextFoods[0]) setSelectedAndSave(nextFoods[0].id, activeTag, mood);
    else setSelectedFoodId("");
  };

  const togglePreference = (preference: FoodPreference) => {
    const nextPreferences = preferences.includes(preference) ? preferences.filter((item) => item !== preference) : [preference, ...preferences.filter((item) => item !== preference)];
    const nextFoods = getRecommendedFoods({ activeTag, context, direction, preferences: nextPreferences, skippedIds, skipRules });
    setPreferences(nextPreferences);
    writeFoodPreferences(nextPreferences);
    if (nextFoods[0]) setSelectedAndSave(nextFoods[0].id);
    else setSelectedFoodId("");
  };

  const toggleSkipRule = (rule: FoodSkipRule) => {
    const nextRules = skipRules.includes(rule) ? skipRules.filter((item) => item !== rule) : [rule, ...skipRules.filter((item) => item !== rule)];
    const nextFoods = getRecommendedFoods({ activeTag, context, direction, preferences, skippedIds, skipRules: nextRules });
    setSkipRules(nextRules);
    writeFoodSkipRules(dateKey, nextRules);
    if (nextFoods[0]) setSelectedAndSave(nextFoods[0].id);
    else setSelectedFoodId("");
  };

  const toggleFavorite = (id: string) => {
    const nextIds = favoriteIds.includes(id) ? favoriteIds.filter((item) => item !== id) : [id, ...favoriteIds.filter((item) => item !== id)];
    setFavoriteIds(nextIds);
    writeFoodFavoriteIds(nextIds);
  };

  const skipFood = (id: string) => {
    const nextSkippedIds = addFoodSkippedId(dateKey, id);
    const picked = pickFood({ activeTag, context, currentId: id, direction, preferences, skippedIds: nextSkippedIds, skipRules });
    setSkippedIds(nextSkippedIds);
    if (picked) setSelectedAndSave(picked.id);
    else setSelectedFoodId("");
  };

  const markAte = (id: string) => {
    const food = foodRecommendations.find((item) => item.id === id);
    if (!food) return;
    const nextItems = addFoodRecentEaten({
      date: dateKey,
      foodId: food.id,
      name: food.name,
      timeLabel: context.timeSlot,
      weatherMood,
    });
    setRecentEaten(nextItems);
  };

  const resetToday = () => {
    resetFoodToday(dateKey);
    const nextSkippedIds: string[] = [];
    const nextSkipRules: FoodSkipRule[] = [];
    const picked = pickFood({ activeTag, context, direction: null, preferences, skippedIds: nextSkippedIds, skipRules: nextSkipRules });
    setSkippedIds(nextSkippedIds);
    setSkipRules(nextSkipRules);
    setDirection(null);
    if (picked) setSelectedAndSave(picked.id, activeTag, weatherMood, null);
    else setSelectedFoodId("");
  };

  return (
    <main className="min-h-screen bg-[#F4F8F0] text-[#10231A]">
      <div className="mx-auto min-h-screen max-w-[430px] bg-[radial-gradient(circle_at_top,#F3FBEA_0%,#F7FAF3_38%,#FFFFFF_100%)] px-4 pb-32 pt-5">
        <header className="flex items-center justify-between gap-3">
          <Link aria-label="返回 Japan Life 首页" className="inline-flex min-h-11 items-center gap-2 rounded-full border border-emerald-100 bg-white/90 px-4 text-sm font-black text-emerald-800 shadow-sm transition active:scale-[0.98]" href="/">
            <ArrowLeft className="h-4 w-4" />
            返回 Japan Life
          </Link>
          <span className="inline-flex items-center gap-1 rounded-full bg-white/85 px-4 py-2 text-xs font-black text-emerald-700 shadow-sm backdrop-blur-xl">
            Food
            <Utensils className="h-3.5 w-3.5" />
          </span>
        </header>

        <section className="mt-5 rounded-[34px] border border-emerald-100 bg-white/92 p-5 shadow-[0_18px_45px_rgba(22,101,52,0.10)]">
          <div className="flex items-start gap-3">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-3xl bg-emerald-600 p-3 text-white shadow-sm">
              <Utensils className="h-7 w-7" />
            </span>
            <div>
              <p className="text-xs font-black text-emerald-700">Japan Life Tool</p>
              <h1 className="mt-1 text-3xl font-black tracking-tight">今天吃什么</h1>
              <p className="mt-2 text-sm font-bold leading-6 text-[#64748B]">先帮你决定今天吃什么；决定后可以用 HotPepper 查附近真实店铺。</p>
            </div>
          </div>
        </section>

        <section className="mt-4 rounded-[26px] border border-emerald-100 bg-white/92 p-4 shadow-[0_12px_30px_rgba(22,101,52,0.08)]">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
              <Sparkles className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs font-black text-emerald-700">Time</p>
              <h2 className="mt-1 text-lg font-black text-[#10231A]">当前时间建议</h2>
              <p className="mt-1 text-sm font-bold leading-6 text-[#475569]">
                现在是{context.timeSlot}，{context.timeMessage}
              </p>
            </div>
          </div>
        </section>

        {selectedFood ? (
          <section className="mt-4">
            <FoodTodayCard
              food={selectedFood}
              isFavorite={favoriteIds.includes(selectedFood.id)}
              onAte={markAte}
              onSkip={skipFood}
              onToggleFavorite={toggleFavorite}
            />
          </section>
        ) : (
          <section className="mt-4 rounded-[26px] border border-emerald-100 bg-white/92 p-4 text-sm font-black leading-6 text-emerald-800 shadow-[0_12px_30px_rgba(22,101,52,0.08)]">
            今天还没想到合适的，换个心情试试吧。
          </section>
        )}

        <section className="mt-4 rounded-[26px] border border-emerald-100 bg-white/92 p-4 shadow-[0_12px_30px_rgba(22,101,52,0.08)]">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
              <Utensils className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-black text-emerald-700">HotPepper 店铺查询</p>
              <h2 className="mt-1 text-lg font-black text-[#10231A]">决定后找附近店</h2>
              <p className="mt-1 text-xs font-bold leading-5 text-[#64748B]">
                当前会搜：{selectedFoodKeyword || "食物关键词"}。点击后显示照片、地址、预算、营业时间参考和详情链接。
              </p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button
                  className={`min-h-10 rounded-2xl px-3 text-xs font-black transition active:scale-[0.98] ${restaurantSearchMode === "area" ? "bg-emerald-700 text-white" : "border border-emerald-100 bg-white text-emerald-800"}`}
                  onClick={() => changeRestaurantSearchMode("area")}
                  type="button"
                >
                  按地区
                </button>
                <button
                  className={`min-h-10 rounded-2xl px-3 text-xs font-black transition active:scale-[0.98] ${restaurantSearchMode === "station" ? "bg-emerald-700 text-white" : "border border-emerald-100 bg-white text-emerald-800"}`}
                  onClick={() => changeRestaurantSearchMode("station")}
                  type="button"
                >
                  按车站
                </button>
              </div>
              <p className="mt-2 text-xs font-bold leading-5 text-[#64748B]">
                {restaurantSearchMode === "station"
                  ? selectedStation
                    ? `当前按 ${getStationDisplayName(selectedStation)} 附近搜索。`
                    : "搜索或选择一个车站后，会按车站附近找店。"
                  : "会优先使用当前位置；失败时使用 App 里选择的地区。"}
              </p>
              {restaurantSearchMode === "station" ? <StationSearchPicker appLocation={appSelectedLocation} error={stationError} loading={stationsLoading} onSelect={selectStation} selectedStation={selectedStation} stations={stations} /> : null}
              <button
                className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl bg-emerald-700 px-4 text-xs font-black text-white shadow-sm transition focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 active:scale-[0.98] disabled:opacity-60"
                disabled={!selectedFood || restaurantsLoading}
                onClick={() => searchNearbyRestaurants(3)}
                type="button"
              >
                <Utensils className="h-4 w-4" />
                {restaurantsLoading ? "正在查找..." : "查附近真实店铺"}
              </button>
            </div>
          </div>
        </section>

        {restaurantResults !== null || restaurantError || restaurantsLoading ? (
          <>
            {restaurantLocationNotice ? <p className="mt-3 rounded-2xl bg-amber-50 px-3 py-3 text-xs font-bold leading-5 text-amber-900">{restaurantLocationNotice}</p> : null}
            <NearbyRestaurantList
              errorMessage={restaurantError}
              keyword={restaurantKeyword || selectedFoodKeyword}
              loading={restaurantsLoading}
              onExpandRange={() => searchNearbyRestaurants(Math.min(restaurantRange + 1, 5))}
              onRetry={() => searchNearbyRestaurants(restaurantRange)}
              onShuffleFood={shuffleFood}
              range={restaurantRange}
              restaurants={restaurantResults ?? []}
            />
          </>
        ) : null}

        <CollapsiblePanel
          className="mt-4"
          eyebrow="Weather Mood"
          summary={`当前：${weatherMood}`}
          title={
            <span className="flex min-w-0 items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                <CloudSun className="h-5 w-5" />
              </span>
              <span className="min-w-0">
                今天感觉
              </span>
            </span>
          }
        >
          <p className="text-xs font-bold leading-5 text-[#64748B]">{context.weatherMessage}</p>
          <div className="-mx-1 mt-3 flex gap-2 overflow-x-auto px-1 pb-1">
            {weatherMoodOptions.map((mood) => {
              const active = weatherMood === mood;
              return (
                <button
                  aria-pressed={active}
                  className={`min-h-10 shrink-0 rounded-full px-3 text-xs font-black transition focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 active:scale-[0.98] ${
                    active ? "bg-emerald-700 text-white shadow-sm" : "border border-emerald-100 bg-white text-[#475569]"
                  }`}
                  key={mood}
                  onClick={() => changeWeatherMood(mood)}
                  type="button"
                >
                  {mood}
                </button>
              );
            })}
          </div>
        </CollapsiblePanel>

        <section className="mt-4">
          <FoodCategoryTabs activeTag={activeTag} categories={foodCategories} onChange={changeTag} />
        </section>

        <CollapsiblePanel
          className="mt-4"
          eyebrow="Taste"
          summary={preferences.length > 0 ? `已选：${preferences.slice(0, 2).join(" / ")}${preferences.length > 2 ? ` 等${preferences.length}项` : ""}` : "还没有选择偏好"}
          title={
            <span className="flex min-w-0 items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                <SlidersHorizontal className="h-5 w-5" />
              </span>
              <span className="min-w-0">
                我的口味偏好
              </span>
            </span>
          }
        >
          <p className="text-xs font-bold leading-5 text-[#64748B]">会保存在本机，下次打开还会记得。</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {preferenceOptions.map((preference) => {
              const active = preferences.includes(preference);
              return (
                <button
                  aria-pressed={active}
                  className={`min-h-10 rounded-full px-3 text-xs font-black transition focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 active:scale-[0.98] ${
                    active ? "bg-emerald-700 text-white shadow-sm" : "border border-emerald-100 bg-white text-[#475569]"
                  }`}
                  key={preference}
                  onClick={() => togglePreference(preference)}
                  type="button"
                >
                  {preference}
                </button>
              );
            })}
          </div>
          <div className="mt-4 rounded-2xl bg-amber-50 p-3">
            <p className="flex items-center gap-2 text-xs font-black text-amber-800">
              <X className="h-4 w-4" />
              今天不想吃的类型
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {skipRuleOptions.map((rule) => {
                const active = skipRules.includes(rule);
                return (
                  <button
                    aria-pressed={active}
                    className={`min-h-10 rounded-full px-3 text-xs font-black transition focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 active:scale-[0.98] ${
                      active ? "bg-amber-600 text-white shadow-sm" : "border border-amber-100 bg-white text-amber-800"
                    }`}
                    key={rule}
                    onClick={() => toggleSkipRule(rule)}
                    type="button"
                  >
                    {rule}
                  </button>
                );
              })}
            </div>
          </div>
        </CollapsiblePanel>

        {selectedFood ? (
          <section className="mt-4 rounded-[26px] border border-emerald-100 bg-white/92 p-4 shadow-[0_12px_30px_rgba(22,101,52,0.08)]">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-lime-100 text-lime-700">
                <Sparkles className="h-5 w-5" />
              </span>
              <div>
                <p className="text-xs font-black text-emerald-700">Reason</p>
                <h2 className="mt-1 text-lg font-black text-[#10231A]">为什么推荐这个？</h2>
              </div>
            </div>
            <ul className="mt-3 grid gap-2">
              {reasonItems.map((reason) => (
                <li className="rounded-2xl bg-emerald-50 px-3 py-2 text-xs font-bold leading-5 text-emerald-900" key={reason}>
                  {reason}
                </li>
              ))}
            </ul>
            {direction ? <p className="mt-3 text-xs font-black text-emerald-700">当前方向：{direction}</p> : null}
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-emerald-700 px-4 text-xs font-black text-white shadow-sm transition focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 active:scale-[0.98]"
                onClick={shuffleFood}
                type="button"
              >
                <RefreshCw className="h-4 w-4" />
                换一个
              </button>
              <button
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-emerald-50 px-4 text-xs font-black text-emerald-800 shadow-sm ring-1 ring-emerald-100 transition focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 active:scale-[0.98]"
                onClick={changeDirection}
                type="button"
              >
                <RefreshCw className="h-4 w-4" />
                换一种方向
              </button>
            </div>
          </section>
        ) : null}

        <section className="mt-4">
          {recommendedFoods.length === 0 ? (
            <div className="rounded-[26px] border border-emerald-100 bg-white/92 p-4 text-sm font-black leading-6 text-emerald-800 shadow-[0_12px_30px_rgba(22,101,52,0.08)]">
              今天还没想到合适的，换个心情试试吧。
            </div>
          ) : (
            <div className="grid gap-3">
              <div className="flex items-end justify-between gap-3 px-1">
                <div>
                  <p className="text-xs font-black text-emerald-700">Food List</p>
                  <h2 className="text-lg font-black text-[#10231A]">食物推荐列表</h2>
                </div>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-[#64748B] shadow-sm">{recommendedFoods.length} 个</span>
              </div>
              {recommendedFoods.map((food) => (
                <FoodRecommendationCard
                  food={food}
                  isFavorite={favoriteIds.includes(food.id)}
                  key={food.id}
                  onSelect={selectFood}
                  onSkip={skipFood}
                  onToggleFavorite={toggleFavorite}
                />
              ))}
            </div>
          )}
        </section>

        <section className="mt-4 rounded-[26px] border border-emerald-100 bg-white/90 p-4 shadow-[0_12px_30px_rgba(22,101,52,0.08)]">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
              <Heart className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs font-black text-emerald-700">Favorites</p>
              <h2 className="text-lg font-black text-[#10231A]">收藏的食物</h2>
            </div>
          </div>
          {favoriteFoods.length === 0 ? (
            <p className="mt-3 rounded-2xl bg-emerald-50 px-3 py-3 text-sm font-bold leading-6 text-emerald-800">还没有收藏。常吃的东西可以先收藏起来。</p>
          ) : (
            <div className="mt-3 grid gap-2">
              {favoriteFoods.map((food) => (
                <button
                  className="flex min-h-12 items-center justify-between gap-3 rounded-2xl border border-emerald-100 bg-white px-3 py-2 text-left shadow-sm transition focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 active:scale-[0.98]"
                  key={food.id}
                  onClick={() => selectFood(food.id)}
                  type="button"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-black text-[#10231A]">{food.name}</span>
                    <span className="mt-0.5 block truncate text-xs font-bold text-[#64748B]">{food.japaneseName}</span>
                  </span>
                  <span className="shrink-0 text-xs font-black text-emerald-700">查看</span>
                </button>
              ))}
            </div>
          )}
        </section>

        <section className="mt-4 rounded-[26px] border border-emerald-100 bg-white/90 p-4 shadow-[0_12px_30px_rgba(22,101,52,0.08)]">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
              <CalendarCheck2 className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs font-black text-emerald-700">Recent</p>
              <h2 className="text-lg font-black text-[#10231A]">最近吃过</h2>
            </div>
          </div>
          {recentEaten.length === 0 ? (
            <p className="mt-3 rounded-2xl bg-emerald-50 px-3 py-3 text-sm font-bold leading-6 text-emerald-800">还没有记录，今天吃点什么吧。</p>
          ) : (
            <div className="mt-3 grid gap-2">
              {recentEaten.map((item) => (
                <div className="rounded-2xl border border-emerald-100 bg-white px-3 py-3 shadow-sm" key={`${item.foodId}-${item.date}`}>
                  <p className="text-sm font-black text-[#10231A]">{item.name}</p>
                  <p className="mt-1 text-xs font-bold text-[#64748B]">
                    {item.date} / {item.timeLabel} / {item.weatherMood}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="mt-4 rounded-[26px] border border-emerald-100 bg-white/90 p-4 shadow-[0_12px_30px_rgba(22,101,52,0.08)]">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
              <Info className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs font-black text-emerald-700">Local</p>
              <p className="mt-1 text-xs font-bold leading-5 text-[#64748B]">收藏、偏好、最近吃过和当天不想吃记录会保存在本机浏览器中，清除浏览器数据后可能会消失。</p>
            </div>
          </div>
        </section>

        <section className="mt-4 rounded-[26px] border border-emerald-100 bg-white/90 p-4 shadow-[0_12px_30px_rgba(22,101,52,0.08)]">
          <button
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl border border-emerald-100 bg-white px-4 text-xs font-black text-emerald-800 transition focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 active:scale-[0.98]"
            onClick={resetToday}
            type="button"
          >
            <RotateCcw className="h-4 w-4" />
            重置今天的推荐
          </button>
        </section>
      </div>
    </main>
  );
}
