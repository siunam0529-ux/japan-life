import { CheckCircle2, Sparkles } from "lucide-react";

export function WalkReasonList({ reasons }: { reasons: string[] }) {
  const visibleReasons = reasons.length > 0 ? reasons : ["今天适合轻松走一走", "路线不会太复杂", "适合当作生活里的小换气"];

  return (
    <section className="rounded-[26px] border border-emerald-100 bg-white/90 p-4 shadow-[0_12px_30px_rgba(22,101,52,0.08)]">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
          <Sparkles className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-black text-emerald-700">Reason</p>
          <h2 className="mt-1 text-lg font-black text-[#10231A]">为什么推荐这里？</h2>
          <div className="mt-3 grid gap-2">
            {visibleReasons.map((reason) => (
              <div className="flex items-start gap-2 rounded-2xl border border-emerald-100 bg-emerald-50/55 px-3 py-2" key={reason}>
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
                <p className="text-sm font-bold leading-5 text-[#475569]">{reason}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

