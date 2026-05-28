import { Sparkles } from "lucide-react";
import type { WalkContext } from "@/lib/walk/recommendationLogic";
import type { WalkSpot, WalkTag } from "@/lib/walk/spots";

export function WalkSuggestion({
  activeTag,
  context,
  suggestion,
  spot,
}: {
  activeTag: WalkTag | "全部";
  context: WalkContext;
  suggestion: string;
  spot: WalkSpot;
}) {
  const tagText = activeTag === "全部" ? "不用想太多" : `你今天选了「${activeTag}」`;

  return (
    <section className="rounded-[26px] border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-lime-50 p-4 shadow-[0_12px_30px_rgba(22,101,52,0.08)]">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-[0_10px_22px_rgba(22,163,74,0.25)]">
          <Sparkles className="h-5 w-5" />
        </span>
        <div>
          <p className="text-xs font-black text-emerald-700">AI 小建议</p>
          <p className="mt-2 text-sm font-bold leading-6 text-[#334155]">{suggestion}</p>
          <p className="mt-2 text-xs font-bold leading-5 text-[#64748B]">
            {context.timeLabel} · {context.weatherLabel} · {tagText} · {spot.moodTags.slice(0, 2).join(" / ")}
          </p>
        </div>
      </div>
    </section>
  );
}
