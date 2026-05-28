import { Heart, X } from "lucide-react";
import type { FoodRecommendation } from "@/lib/food/types";

export function FoodRecommendationCard({
  food,
  isFavorite,
  onSelect,
  onSkip,
  onToggleFavorite,
}: {
  food: FoodRecommendation;
  isFavorite: boolean;
  onSelect: (id: string) => void;
  onSkip: (id: string) => void;
  onToggleFavorite: (id: string) => void;
}) {
  return (
    <article className="rounded-[26px] border border-emerald-100 bg-white/92 p-4 shadow-[0_12px_30px_rgba(22,101,52,0.08)]">
      <div className="flex gap-3">
        <button className="relative h-20 w-20 shrink-0 overflow-hidden rounded-[22px] bg-emerald-100" onClick={() => onSelect(food.id)} type="button">
          <img alt={`${food.name} 图片`} className="h-full w-full object-cover" src={food.image} />
        </button>
        <div className="min-w-0 flex-1">
          <button className="block min-h-10 rounded-lg text-left text-lg font-black leading-6 text-[#10231A] focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2" onClick={() => onSelect(food.id)} type="button">
            {food.name}
          </button>
          <p className="mt-0.5 text-xs font-black text-emerald-700">{food.japaneseName}</p>
          <p className="mt-2 text-xs font-bold leading-5 text-[#64748B]">
            {food.category} / {food.priceRange}
          </p>
        </div>
      </div>
      <div className="mt-3 grid gap-2 rounded-[20px] bg-emerald-50/70 p-3 text-xs font-bold leading-5 text-[#475569]">
        <p>
          <span className="font-black text-[#10231A]">简短说明：</span>
          {food.description}
        </p>
        <p>
          <span className="font-black text-[#10231A]">适合：</span>
          {food.bestFor.join(" / ")}
        </p>
        <p>
          <span className="font-black text-[#10231A]">不太适合：</span>
          {food.avoidWhen.join(" / ")}
        </p>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5 text-[11px] font-black">
        {food.moodTags.slice(0, 5).map((tag) => (
          <span className="rounded-full bg-white px-2.5 py-1 text-emerald-700 ring-1 ring-emerald-100" key={tag}>
            {tag}
          </span>
        ))}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl px-4 text-xs font-black shadow-sm transition focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 active:scale-[0.98] ${
            isFavorite ? "bg-rose-50 text-rose-700" : "border border-emerald-100 bg-white text-emerald-800"
          }`}
          onClick={() => onToggleFavorite(food.id)}
          type="button"
        >
          <Heart className={`h-4 w-4 ${isFavorite ? "fill-rose-500" : ""}`} />
          {isFavorite ? "取消收藏" : "收藏"}
        </button>
        <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-amber-100 bg-amber-50 px-4 text-xs font-black text-amber-800 transition focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 active:scale-[0.98]" onClick={() => onSkip(food.id)} type="button">
          <X className="h-4 w-4" />
          不想吃
        </button>
      </div>
    </article>
  );
}
