"use client";

import { ArrowLeft, Info, RefreshCw, Sparkles, Utensils } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
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
    subtitle: "先按 HotPepper 官方地区选择，再从 Japan Life 已上架店铺里随机抽。不是本地假推荐，也不是直接外部抓一批店。",
    randomEyebrow: "Random",
    randomTitle: "随机抽一家已上架餐厅",
    middleArea: "中エリア",
    smallArea: "小エリア",
    smallAreaAll: "全部小エリア",
    areaLoading: "正在读取地区...",
    areaEmpty: "请先选择地区。",
    areaHint: (area: string) => `当前按 ${area} 筛选 App 已上架店铺。`,
    loading: "正在随机抽店...",
    shuffle: "随机抽今天吃什么",
    noArea: "请先选择 HotPepper 官方地区，再从 App 已上架店铺里随机抽。",
    locationNotice: (area: string, keyword: string) => `已使用 ${area} 作为地区条件，随机关键词：${keyword}。结果只来自 Japan Life 已上架店铺。`,
    fetchFailed: "已上架店铺暂时读取失败，可以稍后再试。",
    fetchFailedRetry: "店铺数据暂时读取失败，请稍后再试。",
    noMatch: "这个地区暂时没有匹配到已上架餐厅。可以换一个小エリア，或去后台先导入并审核店铺。",
    randomKeyword: "随机",
    noteTitle: "说明",
    note: "地区选项来自 HotPepper 官方 area master API；随机结果只从 Japan Life 已发布/已审核店铺中抽取。营业时间、预算和预约信息请以店铺详情页为准。",
  },
  "zh-TW": {
    back: "返回 Japan Life",
    ariaBack: "返回 Japan Life 首頁",
    title: "今天吃什麼",
    subtitle: "先按 HotPepper 官方地區選擇，再從 Japan Life 已上架店鋪裡隨機抽。不是本地假推薦，也不是直接外部抓一批店。",
    randomEyebrow: "Random",
    randomTitle: "隨機抽一家已上架餐廳",
    middleArea: "中エリア",
    smallArea: "小エリア",
    smallAreaAll: "全部小エリア",
    areaLoading: "正在讀取地區...",
    areaEmpty: "請先選擇地區。",
    areaHint: (area: string) => `目前按 ${area} 篩選 App 已上架店鋪。`,
    loading: "正在隨機抽店...",
    shuffle: "隨機抽今天吃什麼",
    noArea: "請先選擇 HotPepper 官方地區，再從 App 已上架店鋪裡隨機抽。",
    locationNotice: (area: string, keyword: string) => `已使用 ${area} 作為地區條件，隨機關鍵字：${keyword}。結果只來自 Japan Life 已上架店鋪。`,
    fetchFailed: "已上架店鋪暫時讀取失敗，可以稍後再試。",
    fetchFailedRetry: "店鋪資料暫時讀取失敗，請稍後再試。",
    noMatch: "這個地區暫時沒有匹配到已上架餐廳。可以換一個小エリア，或去後台先導入並審核店鋪。",
    randomKeyword: "隨機",
    noteTitle: "說明",
    note: "地區選項來自 HotPepper 官方 area master API；隨機結果只從 Japan Life 已發布/已審核店鋪中抽取。營業時間、預算和預約資訊請以店鋪詳情頁為準。",
  },
  ja: {
    back: "Japan Life に戻る",
    ariaBack: "Japan Life ホームに戻る",
    title: "今日は何を食べる？",
    subtitle: "HotPepper 公式エリアを選び、Japan Life に掲載済みのお店だけからランダムに抽選します。ローカルの仮データではありません。",
    randomEyebrow: "Random",
    randomTitle: "掲載済みの飲食店から抽選",
    middleArea: "中エリア",
    smallArea: "小エリア",
    smallAreaAll: "全部小エリア",
    areaLoading: "エリアを読み込み中...",
    areaEmpty: "先にエリアを選択してください。",
    areaHint: (area: string) => `現在は ${area} で掲載済み店舗を絞り込みます。`,
    loading: "お店を抽選中...",
    shuffle: "今日食べるお店を抽選",
    noArea: "HotPepper 公式エリアを選んでから、掲載済み店舗を抽選してください。",
    locationNotice: (area: string, keyword: string) => `${area} を条件にしています。ランダムキーワード：${keyword}。結果は Japan Life 掲載済み店舗のみです。`,
    fetchFailed: "掲載済み店舗を取得できませんでした。時間をおいて再度お試しください。",
    fetchFailedRetry: "店舗データを取得できませんでした。時間をおいて再度お試しください。",
    noMatch: "このエリアでは掲載済みの飲食店がまだ見つかりません。小エリアを変えるか、管理画面で店舗を導入・承認してください。",
    randomKeyword: "ランダム",
    noteTitle: "注意",
    note: "エリアは HotPepper 公式 area master API から取得します。抽選結果は Japan Life で公開・承認済みの店舗だけです。営業時間、予算、予約情報は店舗詳細ページで確認してください。",
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

  useEffect(() => {
    void loadMiddleAreas();
  }, []);

  useEffect(() => {
    if (!middleArea) {
      setSmallAreas([]);
      setSmallArea("");
      return;
    }
    void loadSmallAreas(middleArea);
  }, [middleArea]);

  const selectedMiddleArea = useMemo(() => middleAreas.find((area) => area.code === middleArea) ?? null, [middleArea, middleAreas]);
  const selectedSmallArea = useMemo(() => smallAreas.find((area) => area.code === smallArea) ?? null, [smallArea, smallAreas]);
  const selectedAreaLabel = [selectedMiddleArea?.name, selectedSmallArea?.name].filter(Boolean).join(" / ");

  async function fetchAreaOptions(url: string) {
    const response = await fetch(url);
    const data = (await response.json().catch(() => ({}))) as { areas?: HotpepperArea[]; error?: string };
    if (!response.ok) throw new Error(data.error || `HotPepper area API error ${response.status}`);
    return data.areas ?? [];
  }

  async function loadMiddleAreas() {
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
  }

  async function loadSmallAreas(nextMiddleArea: string) {
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
  }

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
              <p className="text-xs font-black text-blue-700">Published Restaurants</p>
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
