import { CalendarDays, X } from "lucide-react";
import { useEffect } from "react";
import type { WalkSpot } from "@/lib/walk/spots";

function formatDateLabel() {
  return new Date().toLocaleDateString("zh-CN", { month: "long", day: "numeric" });
}

export function WalkShareCard({
  onClose,
  spot,
  task,
}: {
  onClose: () => void;
  spot: WalkSpot;
  task: string;
}) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div aria-labelledby="walk-share-card-title" aria-modal="true" className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 px-4 pb-6 pt-16 backdrop-blur-sm" role="dialog">
      <section className="w-full max-w-[390px] rounded-[32px] bg-white p-4 shadow-[0_28px_70px_rgba(0,0,0,0.28)]">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="text-xs font-black text-emerald-700">Share Preview</p>
            <h2 className="text-lg font-black text-[#10231A]" id="walk-share-card-title">分享卡片预览</h2>
          </div>
          <button aria-label="关闭分享卡片" className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600" onClick={onClose} type="button">
            <X className="h-5 w-5" />
          </button>
        </div>

        <article className="relative overflow-hidden rounded-[28px] bg-[#10231A] text-white">
          <img alt={`${spot.station} 分享卡片背景`} className="h-[470px] w-full object-cover" src={spot.image} />
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/20 to-black/86" />
          <div className="absolute inset-0 flex flex-col justify-between p-5">
            <div className="flex items-center justify-between">
              <span className="rounded-full bg-white/90 px-3 py-1.5 text-xs font-black text-emerald-700">Japan Life</span>
              <span className="flex items-center gap-1 rounded-full bg-black/35 px-3 py-1.5 text-xs font-black backdrop-blur-md">
                <CalendarDays className="h-3.5 w-3.5" />
                {formatDateLabel()}
              </span>
            </div>
            <div>
              <p className="text-sm font-black text-emerald-100">今天去散步</p>
              <h3 className="mt-2 text-5xl font-black tracking-tight">{spot.station}</h3>
              <p className="mt-1 text-lg font-semibold text-white/85">{spot.englishName}</p>
              <p className="mt-5 text-sm font-bold leading-6 text-white/90">{spot.reason}</p>
              <div className="mt-4 rounded-[22px] border border-white/20 bg-white/12 p-3 backdrop-blur-md">
                <p className="text-xs font-black text-emerald-100">散步任务</p>
                <p className="mt-1 text-sm font-black leading-6">{task}</p>
              </div>
            </div>
          </div>
        </article>
        <p className="mt-3 text-center text-xs font-bold text-[#64748B]">第一版先显示预览，后续可以接保存图片。</p>
      </section>
    </div>
  );
}
