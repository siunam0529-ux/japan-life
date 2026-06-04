"use client";

import { ArrowLeft, Info, RefreshCw, Sparkles, Utensils } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { NearbyRestaurantList } from "@/components/food/NearbyRestaurantList";
import { useLanguage } from "@/hooks/useLanguage";
import { getHotpepperKeyword } from "@/lib/food/hotpepperKeyword";
import { foodRecommendations } from "@/lib/food/recommendations";
import type { NearbyRestaurant } from "@/lib/food/types";

type HotpepperArea = {
  code: string;
  name: string;
};

type FriendlyShopRecord = {
  address?: string;
  area?: string;
  budget?: string;
  category?: string;
  description?: string;
  description_zh?: string;
  hotpepper_url?: string;
  hotpepper_shop_id?: string;
  id?: string;
  image_url?: string;
  map_url?: string;
  middle_area_code?: string;
  middle_area_name?: string;
  name?: string;
  open_time?: string;
  small_area_code?: string;
  small_area_name?: string;
  source_type?: string;
  station?: string;
  website_url?: string;
};

const foodCopy = {
  "zh-CN": {
    back: "返回 Japan Life",
    ariaBack: "返回 Japan Life 首页",
    title: "今天吃什么",
    subtitle: "选好想去的区域，我们会从 Japan Life 收录的餐厅里帮你挑几家，适合临时不知道吃什么的时候用。",
    heroEyebrow: "餐厅推荐",
    badge: "吃饭",
    randomEyebrow: "区域选择",
    randomTitle: "先选一个想吃饭的地方",
    middleArea: "主要区域",
    smallArea: "具体区域",
    smallAreaAll: "不限具体区域",
    areaLoading: "正在读取区域...",
    areaEmpty: "请先选择地区。",
    areaHint: (area: string) => `当前区域：${area}`,
    loading: "正在挑选餐厅...",
    shuffle: "帮我挑一家",
    noArea: "请先选择一个区域，再开始推荐餐厅。",
    locationNotice: (area: string, keyword: string) => `已按 ${area} 为你挑选。参考口味：${keyword}。`,
    fetchFailed: "餐厅信息暂时读取失败，可以稍后再试。",
    fetchFailedRetry: "店铺数据暂时读取失败，请稍后再试。",
    noMatch: "这个区域暂时没有可推荐的餐厅，可以换个区域再试。",
    randomKeyword: "随机",
    noteTitle: "小提醒",
    note: "餐厅信息可能会变动，出发前建议打开详情确认营业时间、预算和预约情况。",
  },
  "zh-TW": {
    back: "返回 Japan Life",
    ariaBack: "返回 Japan Life 首頁",
    title: "今天吃什麼",
    subtitle: "選好想去的區域，我們會從 Japan Life 收錄的餐廳裡幫你挑幾家，適合臨時不知道吃什麼的時候用。",
    heroEyebrow: "餐廳推薦",
    badge: "吃飯",
    randomEyebrow: "區域選擇",
    randomTitle: "先選一個想吃飯的地方",
    middleArea: "主要區域",
    smallArea: "具體區域",
    smallAreaAll: "不限具體區域",
    areaLoading: "正在讀取區域...",
    areaEmpty: "請先選擇地區。",
    areaHint: (area: string) => `目前區域：${area}`,
    loading: "正在挑選餐廳...",
    shuffle: "幫我挑一家",
    noArea: "請先選擇一個區域，再開始推薦餐廳。",
    locationNotice: (area: string, keyword: string) => `已按 ${area} 為你挑選。參考口味：${keyword}。`,
    fetchFailed: "餐廳資訊暫時讀取失敗，可以稍後再試。",
    fetchFailedRetry: "店鋪資料暫時讀取失敗，請稍後再試。",
    noMatch: "這個區域暫時沒有可推薦的餐廳，可以換個區域再試。",
    randomKeyword: "隨機",
    noteTitle: "小提醒",
    note: "餐廳資訊可能會變動，出發前建議打開詳情確認營業時間、預算和預約情況。",
  },
  ja: {
    back: "Japan Life に戻る",
    ariaBack: "Japan Life ホームに戻る",
    title: "今日は何を食べる？",
    subtitle: "行きたいエリアを選ぶと、Japan Life に掲載されている飲食店から候補を選びます。迷った時のちょっとしたお店探しにどうぞ。",
    heroEyebrow: "お店選び",
    badge: "食事",
    randomEyebrow: "エリア選択",
    randomTitle: "食事をしたいエリアを選択",
    middleArea: "メインエリア",
    smallArea: "詳細エリア",
    smallAreaAll: "詳細エリアを指定しない",
    areaLoading: "エリアを読み込み中...",
    areaEmpty: "先にエリアを選択してください。",
    areaHint: (area: string) => `選択中のエリア：${area}`,
    loading: "お店を選んでいます...",
    shuffle: "お店を選ぶ",
    noArea: "先にエリアを選んでから、お店を探してください。",
    locationNotice: (area: string, keyword: string) => `${area} で候補を選びました。参考キーワード：${keyword}。`,
    fetchFailed: "飲食店情報を取得できませんでした。時間をおいて再度お試しください。",
    fetchFailedRetry: "店舗データを取得できませんでした。時間をおいて再度お試しください。",
    noMatch: "このエリアではおすすめできる飲食店がまだ見つかりません。別のエリアを試してください。",
    randomKeyword: "ランダム",
    noteTitle: "ご利用前に",
    note: "営業時間、予算、予約状況は変わることがあります。出発前に詳細ページで確認してください。",
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

function textValue(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeSearchText(value: string) {
  return value.toLowerCase().replace(/\s+/g, "");
}

function extractDescriptionValue(description: string, label: string) {
  const line = description.split(/\r?\n/).find((item) => item.toLowerCase().startsWith(`${label.toLowerCase()}:`));
  return line ? line.replace(new RegExp(`^${label}:`, "i"), "").trim() : "";
}

function isRestaurantShop(shop: FriendlyShopRecord) {
  const text = normalizeSearchText([shop.category, shop.description, shop.hotpepper_url, shop.source_type].map(textValue).join(" "));
  return Boolean(shop.hotpepper_url) || /restaurant|food|gourmet|餐|飯|食|居酒屋|焼肉|焼鳥|和食|洋食|中華|ラーメン|カフェ|バー|グルメ/.test(text);
}

function shopMatchesArea(shop: FriendlyShopRecord, middleCode: string, middleName: string, smallCode: string, smallName: string) {
  const shopMiddleCode = textValue(shop.middle_area_code);
  const shopSmallCode = textValue(shop.small_area_code);
  if (smallCode && shopSmallCode) return shopSmallCode === smallCode;
  if (!smallCode && middleCode && shopMiddleCode) return shopMiddleCode === middleCode;

  const selectedNames = [smallName, middleName].map((item) => item.trim()).filter(Boolean);
  if (selectedNames.length === 0) return true;
  const sourceText = normalizeSearchText([shop.address, shop.area, shop.station, shop.category, shop.name, shop.description, shop.middle_area_name, shop.small_area_name].map(textValue).join(" "));
  return selectedNames.some((name) => sourceText.includes(normalizeSearchText(name)));
}

function shopMatchesKeywords(shop: FriendlyShopRecord, keywords: string[]) {
  if (keywords.length === 0) return true;
  const sourceText = normalizeSearchText([shop.name, shop.category, shop.description, shop.description_zh, shop.address, shop.station].map(textValue).join(" "));
  return keywords.some((keyword) => sourceText.includes(normalizeSearchText(keyword)));
}

function toNearbyRestaurant(shop: FriendlyShopRecord): NearbyRestaurant {
  const description = textValue(shop.description);
  const access = textValue(shop.station) || extractDescriptionValue(description, "Access");
  const budget = textValue(shop.budget) || extractDescriptionValue(description, "Budget") || "预算信息请以店铺页面为准";
  const open = textValue(shop.open_time) || extractDescriptionValue(description, "Open");
  const url = textValue(shop.hotpepper_url) || textValue(shop.website_url) || textValue(shop.map_url);

  return {
    access,
    address: textValue(shop.address) || textValue(shop.area) || "地址请以店铺页面为准",
    budget,
    genre: textValue(shop.category) || "餐厅",
    hotpepperUrl: url,
    id: textValue(shop.id) || textValue(shop.hotpepper_shop_id) || `${textValue(shop.name)}-${textValue(shop.address)}`,
    mapQuery: [shop.name, shop.address].map(textValue).filter(Boolean).join(" "),
    name: textValue(shop.name) || "未命名店铺",
    open,
    photoUrl: textValue(shop.image_url),
  };
}

export default function FoodPage() {
  const { language } = useLanguage();
  const text = foodCopy[language];
  const [areaError, setAreaError] = useState("");
  const [areaLoading, setAreaLoading] = useState(false);
  const [middleAreas, setMiddleAreas] = useState<HotpepperArea[]>([]);
  const [smallAreas, setSmallAreas] = useState<HotpepperArea[]>([]);
  const [middleArea, setMiddleArea] = useState("");
  const [smallArea, setSmallArea] = useState("");
  const [restaurantError, setRestaurantError] = useState("");
  const [restaurantKeyword, setRestaurantKeyword] = useState("");
  const [restaurantLocationNotice, setRestaurantLocationNotice] = useState("");
  const [restaurantResults, setRestaurantResults] = useState<NearbyRestaurant[] | null>(null);
  const [restaurantsLoading, setRestaurantsLoading] = useState(false);
  const [recentRandomKeywords, setRecentRandomKeywords] = useState<string[]>([]);

  const selectedMiddleArea = useMemo(() => middleAreas.find((area) => area.code === middleArea) ?? null, [middleArea, middleAreas]);
  const selectedSmallArea = useMemo(() => smallAreas.find((area) => area.code === smallArea) ?? null, [smallArea, smallAreas]);
  const selectedAreaLabel = [selectedMiddleArea?.name, selectedSmallArea?.name].filter(Boolean).join(" / ");

  const fetchAreaOptions = useCallback(async (url: string) => {
    const response = await fetch(url);
    const data = (await response.json().catch(() => ({}))) as { areas?: HotpepperArea[]; error?: string };
    if (!response.ok) throw new Error(data.error || `HotPepper area API error ${response.status}`);
    return data.areas ?? [];
  }, []);

  const loadMiddleAreas = useCallback(async () => {
    setAreaLoading(true);
    setAreaError("");
    try {
      const data = await fetchAreaOptions("/api/hotpepper/areas");
      setMiddleAreas(data);
      setMiddleArea((current) => current || data[0]?.code || "");
    } catch (error) {
      setAreaError(error instanceof Error ? error.message : String(error));
      setMiddleAreas([]);
      setSmallAreas([]);
    } finally {
      setAreaLoading(false);
    }
  }, [fetchAreaOptions]);

  const loadSmallAreas = useCallback(async (nextMiddleArea: string) => {
    setAreaLoading(true);
    setAreaError("");
    try {
      const data = await fetchAreaOptions(`/api/hotpepper/areas?middle_area=${encodeURIComponent(nextMiddleArea)}`);
      setSmallAreas(data);
      setSmallArea((current) => (data.some((area) => area.code === current) ? current : ""));
    } catch (error) {
      setAreaError(error instanceof Error ? error.message : String(error));
      setSmallAreas([]);
      setSmallArea("");
    } finally {
      setAreaLoading(false);
    }
  }, [fetchAreaOptions]);

  useEffect(() => {
    void loadMiddleAreas();
  }, [loadMiddleAreas]);

  useEffect(() => {
    if (!middleArea) {
      setSmallAreas([]);
      setSmallArea("");
      return;
    }
    void loadSmallAreas(middleArea);
  }, [loadSmallAreas, middleArea]);

  const searchPublishedRestaurants = async (keepKeyword = false) => {
    const currentKeywords = restaurantKeyword.split(" / ").map((item) => item.trim()).filter(Boolean);
    const keywords = keepKeyword && currentKeywords.length > 0 ? currentKeywords : pickRandomFoods(10, [...currentKeywords, ...recentRandomKeywords]);
    const keywordLabel = keywords.join(" / ");

    if (!selectedMiddleArea) {
      setRestaurantKeyword(keywordLabel);
      setRestaurantError(text.noArea);
      setRestaurantLocationNotice("");
      setRestaurantResults([]);
      return;
    }

    const startedAt = Date.now();
    if (!keepKeyword) {
      setRecentRandomKeywords((previousKeywords) => [...keywords, ...previousKeywords].slice(0, 40));
    }
    setRestaurantKeyword(keywordLabel);
    setRestaurantError("");
    setRestaurantLocationNotice("");
    setRestaurantResults(null);
    setRestaurantsLoading(true);

    try {
      setRestaurantLocationNotice(text.locationNotice(selectedAreaLabel, keywordLabel));
      const response = await fetch(`/api/friendly-shops?nonce=${Date.now()}`);
      const data = (await response.json()) as { items?: unknown[]; message?: string };

      if (!response.ok) {
        setRestaurantError(data.message || text.fetchFailed);
        setRestaurantResults([]);
        return;
      }

      const shops = (data.items ?? []).filter((item): item is FriendlyShopRecord => Boolean(item) && typeof item === "object");
      const areaMatched = shops.filter((shop) => isRestaurantShop(shop) && shopMatchesArea(shop, selectedMiddleArea.code, selectedMiddleArea.name, selectedSmallArea?.code ?? "", selectedSmallArea?.name ?? ""));
      const keywordMatched = areaMatched.filter((shop) => shopMatchesKeywords(shop, keywords));
      const finalShops = keywordMatched.length > 0 ? keywordMatched : areaMatched;
      const restaurants = shuffleRestaurants(finalShops.map(toNearbyRestaurant)).slice(0, 10);
      setRestaurantError(restaurants.length === 0 ? text.noMatch : "");
      setRestaurantResults(restaurants);
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

  const handleMiddleAreaChange = (value: string) => {
    setMiddleArea(value);
    setRestaurantError("");
    setRestaurantLocationNotice("");
    setRestaurantResults(null);
  };

  const handleSmallAreaChange = (value: string) => {
    setSmallArea(value);
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
            {text.badge}
            <Utensils className="h-3.5 w-3.5" />
          </span>
        </header>

        <section className="mt-5 rounded-[34px] border border-blue-100 bg-white/92 p-5 shadow-[0_18px_45px_rgba(37,99,235,0.10)]">
          <div className="flex items-start gap-3">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-3xl bg-blue-600 p-3 text-white shadow-sm">
              <Utensils className="h-7 w-7" />
            </span>
            <div>
              <p className="text-xs font-black text-blue-700">{text.heroEyebrow}</p>
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
                {selectedAreaLabel ? text.areaHint(selectedAreaLabel) : text.areaEmpty}
              </p>
              <div className="mt-3 grid gap-2">
                <label className="grid gap-1 text-xs font-black text-slate-500">
                  {text.middleArea}
                  <select className="h-11 rounded-2xl border border-blue-100 bg-white px-3 text-sm font-bold outline-none focus:border-blue-500" disabled={areaLoading || middleAreas.length === 0} onChange={(event) => handleMiddleAreaChange(event.target.value)} value={middleArea}>
                    {middleAreas.length === 0 ? <option value="">{areaLoading ? text.areaLoading : text.areaEmpty}</option> : null}
                    {middleAreas.map((option) => (
                      <option key={option.code} value={option.code}>{option.name}</option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-1 text-xs font-black text-slate-500">
                  {text.smallArea}
                  <select className="h-11 rounded-2xl border border-blue-100 bg-white px-3 text-sm font-bold outline-none focus:border-blue-500" disabled={areaLoading || !middleArea} onChange={(event) => handleSmallAreaChange(event.target.value)} value={smallArea}>
                    <option value="">{smallAreas.length === 0 ? text.smallAreaAll : text.smallAreaAll}</option>
                    {smallAreas.map((option) => (
                      <option key={option.code} value={option.code}>{option.name}</option>
                    ))}
                  </select>
                </label>
              </div>
              {areaError ? <p className="mt-3 rounded-2xl bg-amber-50 px-3 py-3 text-xs font-bold leading-5 text-amber-900">{areaError}</p> : null}
              <button
                className="mt-3 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 text-sm font-black text-white shadow-sm transition focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 active:scale-[0.98] disabled:opacity-60"
                disabled={!selectedMiddleArea || restaurantsLoading || areaLoading}
                onClick={() => searchPublishedRestaurants(false)}
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
              onExpandRange={() => searchPublishedRestaurants(true)}
              onRetry={() => searchPublishedRestaurants(true)}
              onShuffleFood={() => searchPublishedRestaurants(false)}
              range={0}
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
