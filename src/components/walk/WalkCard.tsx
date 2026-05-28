import { MapPin, RefreshCw } from "lucide-react";
import type { WalkSpot } from "@/lib/walk/spots";

export function WalkCard({
  onShuffle,
  spot,
  visitCount,
}: {
  onShuffle: () => void;
  spot: WalkSpot;
  visitCount: number;
}) {
  return (
    <article className="relative overflow-hidden rounded-[34px] bg-[#10231A] shadow-[0_24px_55px_rgba(15,23,42,0.22)]">
      <img alt={`${spot.station} 散步推荐`} className="h-[440px] w-full object-cover" src={spot.image} />
      <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/8 to-black/34" />
      <div className="absolute inset-x-0 bottom-0 h-[62%] bg-gradient-to-t from-black/46 via-black/18 to-transparent" />
      <div className="absolute inset-0 flex flex-col justify-between p-5 text-white">
        <div className="flex items-center justify-between">
          <span className="rounded-full bg-emerald-500/90 px-3 py-1.5 text-xs font-black shadow-lg backdrop-blur-md">今日推荐</span>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 rounded-full bg-black/35 px-3 py-1.5 text-xs font-black backdrop-blur-md">
              <MapPin className="h-3.5 w-3.5" />
              {spot.area}
            </span>
          </div>
        </div>

        <div className="rounded-[28px] bg-black/12 p-4 shadow-[0_18px_45px_rgba(0,0,0,0.22)] backdrop-blur-[1px]">
          <p className="text-sm font-black" style={{ color: "#FFFFFF", textShadow: "0 2px 8px rgba(0,0,0,0.82)" }}>{spot.title}</p>
          <h2 className="mt-2 text-5xl font-black tracking-tight" style={{ color: "#FFFFFF", textShadow: "0 3px 14px rgba(0,0,0,0.92)" }}>{spot.station}</h2>
          <p className="mt-1 text-xl font-bold" style={{ color: "#FFFFFF", textShadow: "0 2px 10px rgba(0,0,0,0.86)" }}>{spot.englishName}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {spot.moodTags.slice(0, 4).map((tag) => (
              <span className="rounded-full border border-white/70 bg-white px-3 py-1.5 text-xs font-black text-[#10231A] shadow-sm" key={tag}>
                {tag}
              </span>
            ))}
          </div>
          <p className="mt-5 rounded-2xl bg-black/22 px-3 py-2 text-center text-base font-black leading-7 shadow-inner" style={{ color: "#FFFFFF", textShadow: "0 2px 8px rgba(0,0,0,0.9)" }}>“{spot.subtitle}，适合把今天走慢一点。”</p>
          <div className="mt-4 flex items-center justify-center gap-2">
            <span className={`rounded-full px-3 py-1.5 text-xs font-black ${visitCount > 0 ? "bg-white text-emerald-700" : "bg-white/15 text-white/80"}`}>
              {visitCount > 0 ? `已去过 ${visitCount} 次` : "还没去过"}
            </span>
          </div>
          <button
            aria-label="换一个散步地点"
            className="mt-6 flex h-14 w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-emerald-600 to-lime-500 text-sm font-black text-white shadow-[0_18px_35px_rgba(34,197,94,0.32)] transition active:scale-[0.98]"
            onClick={onShuffle}
            type="button"
          >
            <RefreshCw className="h-4 w-4" />
            换一个地方
          </button>
        </div>
      </div>
    </article>
  );
}
