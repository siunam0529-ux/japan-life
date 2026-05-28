import { CheckCircle2, Heart, MapPin, RefreshCw } from "lucide-react";
import type { PlayDestination } from "@/lib/play/types";

function buildMapUrl(destination: PlayDestination) {
  return `https://www.google.com/maps/search/?api=1&query=${destination.latitude},${destination.longitude}`;
}

export function PlayDestinationCard({
  destination,
  isFavorite,
  isVisited,
  onShuffle,
  onToggleFavorite,
  onToggleVisited,
}: {
  destination: PlayDestination;
  isFavorite: boolean;
  isVisited: boolean;
  onShuffle: () => void;
  onToggleFavorite: (id: string) => void;
  onToggleVisited: (id: string) => void;
}) {
  return (
    <section className="overflow-hidden rounded-[30px] border border-emerald-100 bg-white/95 shadow-[0_18px_45px_rgba(22,101,52,0.12)]">
      <div className="relative h-48 bg-emerald-100">
        <img alt={`${destination.name} 游玩推荐图`} className="h-full w-full object-cover" src={destination.image} />
        <div className="absolute inset-0 bg-gradient-to-b from-black/5 via-black/15 to-black/60" />
        <span className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-white/92 px-3 py-1.5 text-xs font-black text-emerald-700 shadow-sm">
          今日随机游玩推荐
        </span>
        <div className="absolute bottom-4 left-4 right-4 text-white">
          <p className="text-xs font-black opacity-90">{destination.japaneseName} / {destination.englishName}</p>
          <h2 className="mt-1 text-3xl font-black tracking-tight">{destination.name}</h2>
          <p className="mt-1 text-sm font-bold leading-5 opacity-95">{destination.title}</p>
        </div>
      </div>
      <div className="p-4">
        <p className="text-sm font-bold leading-6 text-[#475569]">{destination.reason}</p>
        <div className="mt-3 flex flex-wrap gap-1.5 text-[11px] font-black">
          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-700">{destination.duration}</span>
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[#475569]">{destination.budget}</span>
          <span className="rounded-full bg-lime-50 px-2.5 py-1 text-lime-700">{destination.difficulty}</span>
          {destination.tags.slice(0, 5).map((tag) => (
            <span className="rounded-full bg-white px-2.5 py-1 text-[#64748B] ring-1 ring-emerald-100" key={tag}>
              {tag}
            </span>
          ))}
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-emerald-700 px-4 text-xs font-black text-white shadow-sm transition active:scale-[0.98]" onClick={onShuffle} type="button">
            <RefreshCw className="h-4 w-4" />
            换一个目的地
          </button>
          <a className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-emerald-100 bg-white px-4 text-xs font-black text-emerald-800 shadow-sm transition active:scale-[0.98]" href={buildMapUrl(destination)} rel="noopener noreferrer" target="_blank">
            <MapPin className="h-4 w-4" />
            打开地图
          </a>
          <button
            aria-pressed={isFavorite}
            className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl px-4 text-xs font-black shadow-sm transition active:scale-[0.98] ${
              isFavorite ? "bg-rose-50 text-rose-700" : "border border-emerald-100 bg-white text-emerald-800"
            }`}
            onClick={() => onToggleFavorite(destination.id)}
            type="button"
          >
            <Heart className={`h-4 w-4 ${isFavorite ? "fill-current" : ""}`} />
            {isFavorite ? "已收藏" : "收藏"}
          </button>
          <button
            aria-pressed={isVisited}
            className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl px-4 text-xs font-black shadow-sm transition active:scale-[0.98] ${
              isVisited ? "bg-lime-100 text-lime-800" : "border border-lime-100 bg-lime-50 text-lime-800"
            }`}
            onClick={() => onToggleVisited(destination.id)}
            type="button"
          >
            <CheckCircle2 className="h-4 w-4" />
            {isVisited ? "去过了" : "去过"}
          </button>
        </div>
      </div>
    </section>
  );
}
