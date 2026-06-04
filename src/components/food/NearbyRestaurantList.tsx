import { ExternalLink, MapPin, Search, Store } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import type { NearbyRestaurant } from "@/lib/food/types";

const nearbyCopy = {
  "zh-CN": {
    nearby: "推荐结果",
    title: "可以考虑这几家",
    loading: "正在挑选餐厅……",
    retry: "再试一次",
    empty: "这个区域暂时没有合适的餐厅，可以换个区域再试。",
    shuffle: "换一组",
    expand: "再筛一次",
    reference: (keyword: string, range: number) => (range > 0 ? `参考口味：${keyword} / 范围：${range}m` : `参考口味：${keyword}`),
    sourceNote: "出发前建议打开详情确认营业时间和预约情况。",
    photoAlt: (name: string) => `${name} 店铺照片`,
    address: "地址：",
    budget: "预算：",
    access: "车站 / 交通：",
    open: "营业时间：",
    accessFallback: "交通信息请以店铺页面为准",
    openFallback: "请以店铺页面为准",
    openNote: "营业时间可能会变动，请以店铺页面为准。",
    detail: "店铺详情",
    map: "打开地图",
  },
  "zh-TW": {
    nearby: "推薦結果",
    title: "可以考慮這幾家",
    loading: "正在挑選餐廳……",
    retry: "再試一次",
    empty: "這個區域暫時沒有合適的餐廳，可以換個區域再試。",
    shuffle: "換一組",
    expand: "再篩一次",
    reference: (keyword: string, range: number) => (range > 0 ? `參考口味：${keyword} / 範圍：${range}m` : `參考口味：${keyword}`),
    sourceNote: "出發前建議打開詳情確認營業時間和預約情況。",
    photoAlt: (name: string) => `${name} 店鋪照片`,
    address: "地址：",
    budget: "預算：",
    access: "車站 / 交通：",
    open: "營業時間：",
    accessFallback: "交通資訊請以店鋪頁面為準",
    openFallback: "請以店鋪頁面為準",
    openNote: "營業時間可能會變動，請以店鋪頁面為準。",
    detail: "店鋪詳情",
    map: "打開地圖",
  },
  ja: {
    nearby: "おすすめ",
    title: "候補はこちら",
    loading: "お店を選んでいます……",
    retry: "もう一度試す",
    empty: "このエリアでは条件に合う飲食店が見つかりませんでした。別のエリアを試してください。",
    shuffle: "別の候補",
    expand: "もう一度探す",
    reference: (keyword: string, range: number) => (range > 0 ? `参考：${keyword} / 範囲：${range}m` : `参考：${keyword}`),
    sourceNote: "出発前に詳細ページで営業時間や予約状況を確認してください。",
    photoAlt: (name: string) => `${name} の店舗写真`,
    address: "住所：",
    budget: "予算：",
    access: "駅 / アクセス：",
    open: "営業時間：",
    accessFallback: "アクセス情報は店舗ページを確認してください",
    openFallback: "店舗ページを確認してください",
    openNote: "営業時間は変わる場合があります。店舗ページを確認してください。",
    detail: "店舗詳細",
    map: "地図を開く",
  },
} as const;

function buildRestaurantMapUrl(restaurant: NearbyRestaurant) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(restaurant.mapQuery || `${restaurant.name} ${restaurant.address}`)}`;
}

export function NearbyRestaurantList({
  errorMessage,
  keyword,
  loading,
  onExpandRange,
  onRetry,
  onShuffleFood,
  range,
  restaurants,
}: {
  errorMessage: string;
  keyword: string;
  loading: boolean;
  onExpandRange: () => void;
  onRetry: () => void;
  onShuffleFood: () => void;
  range: number;
  restaurants: NearbyRestaurant[];
}) {
  const { language } = useLanguage();
  const text = nearbyCopy[language];

  if (loading) {
    return (
      <section className="mt-4 rounded-[26px] border border-emerald-100 bg-white/92 p-4 shadow-[0_12px_30px_rgba(22,101,52,0.08)]">
        <p className="text-xs font-black text-emerald-700">{text.nearby}</p>
        <h2 className="mt-1 text-lg font-black text-[#10231A]">{text.title}</h2>
        <p className="mt-3 rounded-2xl bg-emerald-50 px-3 py-3 text-sm font-bold leading-6 text-emerald-800">{text.loading}</p>
      </section>
    );
  }

  if (errorMessage) {
    return (
      <section className="mt-4 rounded-[26px] border border-amber-100 bg-white/92 p-4 shadow-[0_12px_30px_rgba(22,101,52,0.08)]">
        <p className="text-xs font-black text-amber-700">{text.nearby}</p>
        <h2 className="mt-1 text-lg font-black text-[#10231A]">{text.title}</h2>
        <p className="mt-3 rounded-2xl bg-amber-50 px-3 py-3 text-sm font-bold leading-6 text-amber-900">{errorMessage}</p>
        <button className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl bg-emerald-700 px-4 text-xs font-black text-white transition active:scale-[0.98]" onClick={onRetry} type="button">
          <Search className="h-4 w-4" />
          {text.retry}
        </button>
      </section>
    );
  }

  if (restaurants.length === 0) {
    return (
      <section className="mt-4 rounded-[26px] border border-emerald-100 bg-white/92 p-4 shadow-[0_12px_30px_rgba(22,101,52,0.08)]">
        <p className="text-xs font-black text-emerald-700">{text.nearby}</p>
        <h2 className="mt-1 text-lg font-black text-[#10231A]">{text.title}</h2>
        <p className="mt-3 rounded-2xl bg-emerald-50 px-3 py-3 text-sm font-bold leading-6 text-emerald-800">{text.empty}</p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button className="min-h-11 rounded-2xl bg-emerald-700 px-3 text-xs font-black text-white transition active:scale-[0.98]" onClick={onShuffleFood} type="button">
            {text.shuffle}
          </button>
          <button className="min-h-11 rounded-2xl border border-emerald-100 bg-white px-3 text-xs font-black text-emerald-800 transition active:scale-[0.98]" onClick={onExpandRange} type="button">
            {text.expand}
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="mt-4 rounded-[26px] border border-emerald-100 bg-white/92 p-4 shadow-[0_12px_30px_rgba(22,101,52,0.08)]">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
          <Store className="h-5 w-5" />
        </span>
        <div>
          <p className="text-xs font-black text-emerald-700">{text.nearby}</p>
          <h2 className="mt-1 text-lg font-black text-[#10231A]">{text.title}</h2>
          <p className="mt-1 text-xs font-bold leading-5 text-[#64748B]">{text.reference(keyword, range)}</p>
          <p className="mt-1 text-xs font-bold leading-5 text-[#64748B]">{text.sourceNote}</p>
        </div>
      </div>
      <div className="mt-3 grid gap-3">
        {restaurants.map((restaurant) => (
          <article className="overflow-hidden rounded-[22px] border border-emerald-100 bg-white shadow-sm" key={restaurant.id}>
            {restaurant.photoUrl ? (
              <div className="h-32 w-full bg-emerald-50">
                <img alt={text.photoAlt(restaurant.name)} className="h-full w-full object-cover" loading="lazy" src={restaurant.photoUrl} />
              </div>
            ) : null}
            <div className="p-3">
              <h3 className="text-base font-black leading-6 text-[#10231A]">{restaurant.name}</h3>
              <p className="mt-1 text-xs font-black text-emerald-700">{restaurant.genre}</p>
              <div className="mt-3 grid gap-2 rounded-2xl bg-emerald-50/70 p-3 text-xs font-bold leading-5 text-[#475569]">
                <p><span className="font-black text-[#10231A]">{text.address}</span>{restaurant.address}</p>
                <p><span className="font-black text-[#10231A]">{text.budget}</span>{restaurant.budget}</p>
                <p><span className="font-black text-[#10231A]">{text.access}</span>{restaurant.access || text.accessFallback}</p>
                <p><span className="font-black text-[#10231A]">{text.open}</span>{restaurant.open || text.openFallback}</p>
                <p className="text-emerald-800">{text.openNote}</p>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {restaurant.hotpepperUrl ? (
                  <>
                    <a className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-emerald-700 px-3 text-xs font-black text-white transition active:scale-[0.98]" href={restaurant.hotpepperUrl} rel="noopener noreferrer" target="_blank">
                      <ExternalLink className="h-4 w-4" />
                      {restaurant.hotpepperUrl.includes("hotpepper.jp") ? "HotPepper" : text.detail}
                    </a>
                    <a className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-emerald-100 bg-white px-3 text-xs font-black text-emerald-800 transition active:scale-[0.98]" href={buildRestaurantMapUrl(restaurant)} rel="noopener noreferrer" target="_blank">
                      <MapPin className="h-4 w-4" />
                      {text.map}
                    </a>
                  </>
                ) : (
                  <a className="col-span-2 inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-emerald-700 px-3 text-xs font-black text-white transition active:scale-[0.98]" href={buildRestaurantMapUrl(restaurant)} rel="noopener noreferrer" target="_blank">
                    <MapPin className="h-4 w-4" />
                    {text.map}
                  </a>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
