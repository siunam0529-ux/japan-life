"use client";

import { ArrowLeft, Info, RefreshCw, Sparkles, Utensils } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { NearbyRestaurantList } from "@/components/food/NearbyRestaurantList";
import { StationSearchPicker } from "@/components/stations/StationSearchPicker";
import { useLanguage } from "@/hooks/useLanguage";
import { useTokyoStations } from "@/hooks/useTokyoStations";
import { getHotpepperKeyword } from "@/lib/food/hotpepperKeyword";
import { foodRecommendations } from "@/lib/food/recommendations";
import type { NearbyRestaurant } from "@/lib/food/types";
import { getStationDisplayName, hasStationCoordinate } from "@/lib/stations/stationSearch";
import type { TokyoStation } from "@/lib/stations/types";

const foodCopy = {
  "zh-CN": {
    back: "返回 Japan Life",
    ariaBack: "返回 Japan Life 首页",
    title: "今天吃什么",
    subtitle: "选择车站后，随机从附近 HotPepper 真实店铺里抽一家。不是本地假推荐。",
    randomEyebrow: "Random",
    randomTitle: "随机生成附近吃什么",
    stationHint: (station: string) => `当前按 ${station} 附近搜索。`,
    stationEmpty: "请先搜索或选择一个车站。",
    loading: "正在随机找店...",
    shuffle: "随机找附近吃什么",
    noStation: "请先选择一个车站，再随机找附近真实店铺。除天气外，Japan Life 的位置查询会按车站处理。",
    locationNotice: (station: string, keyword: string) => `已使用 ${station} 附近作为参考，随机关键词：${keyword}。`,
    fetchFailed: "附近店铺暂时取得失败，可以换一个关键词或扩大范围。",
    fetchFailedRetry: "附近店铺暂时取得失败，可以换一个关键词或稍后再试。",
    randomKeyword: "随机",
    noteTitle: "说明",
    note: "店铺来自 HotPepper。营业时间、预算、照片和空位情况可能变化，出发前请打开 HotPepper 详情再确认。",
  },
  "zh-TW": {
    back: "返回 Japan Life",
    ariaBack: "返回 Japan Life 首頁",
    title: "今天吃什麼",
    subtitle: "選擇車站後，從附近 HotPepper 真實店鋪中隨機抽一家，不是本地假推薦。",
    randomEyebrow: "Random",
    randomTitle: "隨機產生附近吃什麼",
    stationHint: (station: string) => `目前按 ${station} 附近搜尋。`,
    stationEmpty: "請先搜尋或選擇一個車站。",
    loading: "正在隨機找店...",
    shuffle: "隨機找附近吃什麼",
    noStation: "請先選擇一個車站，再隨機找附近真實店鋪。除天氣外，Japan Life 的位置查詢會按車站處理。",
    locationNotice: (station: string, keyword: string) => `已使用 ${station} 附近作為參考，隨機關鍵字：${keyword}。`,
    fetchFailed: "附近店鋪暫時取得失敗，可以換一個關鍵字或擴大範圍。",
    fetchFailedRetry: "附近店鋪暫時取得失敗，可以換一個關鍵字或稍後再試。",
    randomKeyword: "隨機",
    noteTitle: "說明",
    note: "店鋪來自 HotPepper。營業時間、預算、照片和空位情況可能變化，出發前請打開 HotPepper 詳情再確認。",
  },
  ja: {
    back: "Japan Life に戻る",
    ariaBack: "Japan Life ホームに戻る",
    title: "今日なに食べる",
    subtitle: "駅を選ぶと、周辺の HotPepper 掲載店からランダムに1件選びます。ローカルの仮データではありません。",
    randomEyebrow: "Random",
    randomTitle: "近くのお店をランダムで探す",
    stationHint: (station: string) => `現在は ${station} 周辺で検索します。`,
    stationEmpty: "まず駅を検索または選択してください。",
    loading: "お店を探しています...",
    shuffle: "近くのお店をランダム検索",
    noStation: "先に駅を選択してください。天気以外の位置検索は駅を基準に扱います。",
    locationNotice: (station: string, keyword: string) => `${station} 周辺を基準にしています。ランダムキーワード：${keyword}。`,
    fetchFailed: "周辺のお店を取得できませんでした。キーワードを変えるか範囲を広げてください。",
    fetchFailedRetry: "周辺のお店を取得できませんでした。キーワードを変えるか、後でもう一度お試しください。",
    randomKeyword: "ランダム",
    noteTitle: "注意",
    note: "店舗情報は HotPepper 由来です。営業時間、予算、写真、空席状況は変わることがあります。出発前に HotPepper の詳細を確認してください。",
  },
} as const;

function pickRandomFoods(count = 10, currentKeywords: string[] = []) {
  const used = new Set(currentKeywords);
  const pool = foodRecommendations.filter((food) => !used.has(getHotpepperKeyword(food)));
  const candidates = pool.length > 0 ? [...pool] : [...foodRecommendations];
  const result: string[] = [];
  while (result.length < count && candidates.length > 0) {
    const index = Math.floor(Math.random() * candidates.length);
    const [food] = candidates.splice(index, 1);
    const keyword = getHotpepperKeyword(food);
    if (!result.includes(keyword)) result.push(keyword);
  }
  return result;
}

function shuffleRestaurants(restaurants: NearbyRestaurant[]) {
  const shuffled = [...restaurants];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  return shuffled;
}

export default function FoodPage() {
  const { language } = useLanguage();
  const text = foodCopy[language];
  const { error: stationError, loading: stationsLoading, stations } = useTokyoStations();
  const [restaurantError, setRestaurantError] = useState("");
  const [restaurantKeyword, setRestaurantKeyword] = useState("");
  const [restaurantLocationNotice, setRestaurantLocationNotice] = useState("");
  const [restaurantRange, setRestaurantRange] = useState(3);
  const [restaurantResults, setRestaurantResults] = useState<NearbyRestaurant[] | null>(null);
  const [restaurantsLoading, setRestaurantsLoading] = useState(false);
  const [recentRandomKeywords, setRecentRandomKeywords] = useState<string[]>([]);
  const [selectedStation, setSelectedStation] = useState<TokyoStation | null>(null);

  const getStationSearchLocation = () => {
    if (!selectedStation) return null;
    return {
      label: getStationDisplayName(selectedStation),
      lat: hasStationCoordinate(selectedStation) ? selectedStation.latitude : null,
      lng: hasStationCoordinate(selectedStation) ? selectedStation.longitude : null,
    };
  };

  const searchNearbyRestaurants = async (range = restaurantRange, keepKeyword = false) => {
    const location = getStationSearchLocation();
    const currentKeywords = restaurantKeyword.split(" / ").map((item) => item.trim()).filter(Boolean);
    const keywords = keepKeyword && currentKeywords.length > 0 ? currentKeywords : pickRandomFoods(10, [...currentKeywords, ...recentRandomKeywords]);
    const keywordLabel = keywords.join(" / ");

    if (!location) {
      setRestaurantKeyword(keywordLabel);
      setRestaurantRange(range);
      setRestaurantError(text.noStation);
      setRestaurantLocationNotice("");
      setRestaurantResults([]);
      return;
    }

    const startedAt = Date.now();
    if (!keepKeyword) {
      setRecentRandomKeywords((previousKeywords) => [...keywords, ...previousKeywords].slice(0, 40));
    }
    setRestaurantKeyword(keywordLabel);
    setRestaurantRange(range);
    setRestaurantError("");
    setRestaurantLocationNotice("");
    setRestaurantResults(null);
    setRestaurantsLoading(true);

    try {
      setRestaurantLocationNotice(text.locationNotice(location.label, keywordLabel));
      const params = new URLSearchParams({
        keyword: keywords[0] ?? "",
        keywords: keywords.join(","),
        nonce: String(Date.now()),
        range: String(range),
        station: location.label,
      });
      if (location.lat !== null && location.lng !== null) {
        params.set("lat", String(location.lat));
        params.set("lng", String(location.lng));
      }
      const response = await fetch(`/api/food/hotpepper?${params.toString()}`);
      const data = (await response.json()) as { message?: string; restaurants?: NearbyRestaurant[] };

      if (!response.ok) {
        setRestaurantError(data.message || text.fetchFailed);
        setRestaurantResults([]);
        return;
      }

      const restaurants = Array.isArray(data.restaurants) ? data.restaurants : [];
      setRestaurantResults(shuffleRestaurants(restaurants).slice(0, 10));
    } catch {
      setRestaurantError(text.fetchFailedRetry);
      setRestaurantResults([]);
    } finally {
      const elapsed = Date.now() - startedAt;
      if (elapsed < 450) {
        await new Promise((resolve) => window.setTimeout(resolve, 450 - elapsed));
      }
      setRestaurantsLoading(false);
    }
  };

  const selectStation = (station: TokyoStation) => {
    setSelectedStation(station);
    setRestaurantError("");
    setRestaurantLocationNotice("");
    setRestaurantResults(null);
  };

  return (
    <main className="jl-tool-theme min-h-screen text-[#10231A]">
      <div className="jl-tool-shell mx-auto min-h-screen max-w-[430px] px-4 pb-32 pt-5">
        <header className="flex items-center justify-between gap-3">
          <Link aria-label={text.ariaBack} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-blue-100 bg-white/90 px-4 text-sm font-black text-blue-800 shadow-sm transition active:scale-[0.98]" href="/">
            <ArrowLeft className="h-4 w-4" />
            {text.back}
          </Link>
          <span className="inline-flex items-center gap-1 rounded-full bg-white/85 px-4 py-2 text-xs font-black text-blue-700 shadow-sm backdrop-blur-xl">
            Food
            <Utensils className="h-3.5 w-3.5" />
          </span>
        </header>

        <section className="mt-5 rounded-[34px] border border-blue-100 bg-white/92 p-5 shadow-[0_18px_45px_rgba(37,99,235,0.10)]">
          <div className="flex items-start gap-3">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-3xl bg-blue-600 p-3 text-white shadow-sm">
              <Utensils className="h-7 w-7" />
            </span>
            <div>
              <p className="text-xs font-black text-blue-700">HotPepper Nearby</p>
              <h1 className="mt-1 text-3xl font-black tracking-tight">{text.title}</h1>
              <p className="mt-2 text-sm font-bold leading-6 text-[#64748B]">{text.subtitle}</p>
            </div>
          </div>
        </section>

        <section className="mt-4 rounded-[26px] border border-blue-100 bg-white/92 p-4 shadow-[0_12px_30px_rgba(37,99,235,0.08)]">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
              <Sparkles className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-black text-blue-700">{text.randomEyebrow}</p>
              <h2 className="mt-1 text-lg font-black text-[#10231A]">{text.randomTitle}</h2>
              <p className="mt-1 text-xs font-bold leading-5 text-[#64748B]">
                {selectedStation ? text.stationHint(getStationDisplayName(selectedStation)) : text.stationEmpty}
              </p>
              <StationSearchPicker appLocation={null} error={stationError} loading={stationsLoading} onSelect={selectStation} selectedStation={selectedStation} stations={stations} />
              <button
                className="mt-3 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 text-sm font-black text-white shadow-sm transition focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 active:scale-[0.98] disabled:opacity-60"
                disabled={!selectedStation || restaurantsLoading}
                onClick={() => searchNearbyRestaurants(3)}
                type="button"
              >
                <RefreshCw className={`h-4 w-4 ${restaurantsLoading ? "animate-spin" : ""}`} />
                {restaurantsLoading ? text.loading : text.shuffle}
              </button>
            </div>
          </div>
        </section>

        {restaurantResults !== null || restaurantError || restaurantsLoading ? (
          <>
            {restaurantLocationNotice ? <p className="mt-3 rounded-2xl bg-blue-50 px-3 py-3 text-xs font-bold leading-5 text-blue-900">{restaurantLocationNotice}</p> : null}
            <NearbyRestaurantList
              errorMessage={restaurantError}
              keyword={restaurantKeyword || text.randomKeyword}
              loading={restaurantsLoading}
              onExpandRange={() => searchNearbyRestaurants(Math.min(restaurantRange + 1, 5), true)}
              onRetry={() => searchNearbyRestaurants(restaurantRange, true)}
              onShuffleFood={() => searchNearbyRestaurants(restaurantRange)}
              range={restaurantRange}
              restaurants={restaurantResults ?? []}
            />
          </>
        ) : null}

        <section className="mt-4 rounded-[26px] border border-blue-100 bg-white/90 p-4 shadow-[0_12px_30px_rgba(37,99,235,0.08)]">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
              <Info className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs font-black text-blue-700">{text.noteTitle}</p>
              <p className="mt-1 text-xs font-bold leading-5 text-[#64748B]">{text.note}</p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
