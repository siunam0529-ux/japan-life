import { ExternalLink, MapPin, Search, Store } from "lucide-react";
import type { NearbyRestaurant } from "@/lib/food/types";

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
  if (loading) {
    return (
      <section className="mt-4 rounded-[26px] border border-emerald-100 bg-white/92 p-4 shadow-[0_12px_30px_rgba(22,101,52,0.08)]">
        <p className="text-xs font-black text-emerald-700">Nearby</p>
        <h2 className="mt-1 text-lg font-black text-[#10231A]">附近店铺</h2>
        <p className="mt-3 rounded-2xl bg-emerald-50 px-3 py-3 text-sm font-bold leading-6 text-emerald-800">正在寻找附近店铺……</p>
      </section>
    );
  }

  if (errorMessage) {
    return (
      <section className="mt-4 rounded-[26px] border border-amber-100 bg-white/92 p-4 shadow-[0_12px_30px_rgba(22,101,52,0.08)]">
        <p className="text-xs font-black text-amber-700">Nearby</p>
        <h2 className="mt-1 text-lg font-black text-[#10231A]">附近店铺</h2>
        <p className="mt-3 rounded-2xl bg-amber-50 px-3 py-3 text-sm font-bold leading-6 text-amber-900">{errorMessage}</p>
        <button className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl bg-emerald-700 px-4 text-xs font-black text-white transition active:scale-[0.98]" onClick={onRetry} type="button">
          <Search className="h-4 w-4" />
          再试一次
        </button>
      </section>
    );
  }

  if (restaurants.length === 0) {
    return (
      <section className="mt-4 rounded-[26px] border border-emerald-100 bg-white/92 p-4 shadow-[0_12px_30px_rgba(22,101,52,0.08)]">
        <p className="text-xs font-black text-emerald-700">Nearby</p>
        <h2 className="mt-1 text-lg font-black text-[#10231A]">附近店铺</h2>
        <p className="mt-3 rounded-2xl bg-emerald-50 px-3 py-3 text-sm font-bold leading-6 text-emerald-800">附近没有找到合适的店，换一个推荐或扩大范围试试吧。</p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button className="min-h-11 rounded-2xl bg-emerald-700 px-3 text-xs font-black text-white transition active:scale-[0.98]" onClick={onShuffleFood} type="button">
            换一个食物
          </button>
          <button className="min-h-11 rounded-2xl border border-emerald-100 bg-white px-3 text-xs font-black text-emerald-800 transition active:scale-[0.98]" onClick={onExpandRange} type="button">
            扩大范围
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
          <p className="text-xs font-black text-emerald-700">Nearby</p>
          <h2 className="mt-1 text-lg font-black text-[#10231A]">附近店铺</h2>
          <p className="mt-1 text-xs font-bold leading-5 text-[#64748B]">
            参考关键词：{keyword} / 范围：{range}
          </p>
          <p className="mt-1 text-xs font-bold leading-5 text-[#64748B]">以下是 HotPepper 返回的真实店铺信息，出发前请再打开详情确认。</p>
        </div>
      </div>
      <div className="mt-3 grid gap-3">
        {restaurants.map((restaurant) => (
          <article className="overflow-hidden rounded-[22px] border border-emerald-100 bg-white shadow-sm" key={restaurant.id}>
            {restaurant.photoUrl ? (
              <div className="h-32 w-full bg-emerald-50">
                <img alt={`${restaurant.name} 店铺照片`} className="h-full w-full object-cover" loading="lazy" src={restaurant.photoUrl} />
              </div>
            ) : null}
            <div className="p-3">
            <h3 className="text-base font-black leading-6 text-[#10231A]">{restaurant.name}</h3>
            <p className="mt-1 text-xs font-black text-emerald-700">{restaurant.genre}</p>
            <div className="mt-3 grid gap-2 rounded-2xl bg-emerald-50/70 p-3 text-xs font-bold leading-5 text-[#475569]">
              <p>
                <span className="font-black text-[#10231A]">地址：</span>
                {restaurant.address}
              </p>
              <p>
                <span className="font-black text-[#10231A]">预算：</span>
                {restaurant.budget}
              </p>
              <p>
                <span className="font-black text-[#10231A]">距离 / 区域：</span>
                {restaurant.access || "距离信息请以店铺页面为准"}
              </p>
              <p>
                <span className="font-black text-[#10231A]">营业时间参考：</span>
                {restaurant.open || "请以店铺页面为准"}
              </p>
              <p className="text-emerald-800">营业时间仅供参考，请以店铺官方信息为准。</p>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <a className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-emerald-700 px-3 text-xs font-black text-white transition active:scale-[0.98]" href={restaurant.hotpepperUrl} rel="noopener noreferrer" target="_blank">
                <ExternalLink className="h-4 w-4" />
                HotPepper
              </a>
              <a className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-emerald-100 bg-white px-3 text-xs font-black text-emerald-800 transition active:scale-[0.98]" href={buildRestaurantMapUrl(restaurant)} rel="noopener noreferrer" target="_blank">
                <MapPin className="h-4 w-4" />
                打开地图
              </a>
            </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
