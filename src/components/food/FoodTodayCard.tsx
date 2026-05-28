import { CheckCircle2, Heart, Utensils, X } from "lucide-react";
import type { FoodRecommendation } from "@/lib/food/types";

export function FoodTodayCard({
  food,
  isFavorite,
  onAte,
  onSkip,
  onToggleFavorite,
}: {
  food: FoodRecommendation;
  isFavorite: boolean;
  onAte: (id: string) => void;
  onSkip: (id: string) => void;
  onToggleFavorite: (id: string) => void;
}) {
  return (
    <section className="overflow-hidden rounded-[30px] border border-emerald-100 bg-white/95 shadow-[0_18px_45px_rgba(22,101,52,0.12)]">
      <div className="relative h-44 bg-emerald-100">
        <img alt={`${food.name} 推荐图`} className="h-full w-full object-cover" src={food.image} />
        <div className="absolute inset-0 bg-gradient-to-b from-black/5 via-black/10 to-black/55" />
        <span className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-white/92 px-3 py-1.5 text-xs font-black text-emerald-700 shadow-sm">
          <Utensils className="h-3.5 w-3.5" />
          今日推荐
        </span>
        <div className="absolute bottom-4 left-4 right-4 text-white">
          <p className="text-xs font-black opacity-90">{food.japaneseName}</p>
          <h2 className="mt-1 text-3xl font-black tracking-tight">{food.name}</h2>
        </div>
      </div>
      <div className="p-4">
        <div className="flex flex-wrap gap-1.5 text-[11px] font-black">
          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-700">{food.priceRange}</span>
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[#475569]">{food.category}</span>
          {food.moodTags.slice(0, 3).map((tag) => (
            <span className="rounded-full bg-lime-50 px-2.5 py-1 text-lime-700" key={tag}>
              {tag}
            </span>
          ))}
        </div>
        <p className="mt-3 text-sm font-bold leading-6 text-[#475569]">{food.reason}</p>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-lime-100 px-4 text-xs font-black text-lime-800 shadow-sm transition active:scale-[0.98]" onClick={() => onAte(food.id)} type="button">
            <CheckCircle2 className="h-4 w-4" />
            今天吃了这个
          </button>
          <button
            className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl px-4 text-xs font-black shadow-sm transition active:scale-[0.98] ${
              isFavorite ? "bg-rose-50 text-rose-700" : "border border-emerald-100 bg-white text-emerald-800"
            }`}
            onClick={() => onToggleFavorite(food.id)}
            type="button"
          >
            <Heart className={`h-4 w-4 ${isFavorite ? "fill-rose-500" : ""}`} />
            {isFavorite ? "已收藏" : "收藏"}
          </button>
          <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-amber-100 bg-amber-50 px-4 text-xs font-black text-amber-800 transition active:scale-[0.98]" onClick={() => onSkip(food.id)} type="button">
            <X className="h-4 w-4" />
            今天不想吃
          </button>
        </div>
      </div>
    </section>
  );
}
