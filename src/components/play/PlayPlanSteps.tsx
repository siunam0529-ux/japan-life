import { Route } from "lucide-react";
import type { PlayPlanStep } from "@/lib/play/types";

export function PlayPlanSteps({ steps }: { steps: PlayPlanStep[] }) {
  return (
    <section className="rounded-[26px] border border-emerald-100 bg-white/92 p-4 shadow-[0_12px_30px_rgba(22,101,52,0.08)]">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
          <Route className="h-5 w-5" />
        </span>
        <div>
          <p className="text-xs font-black text-emerald-700">Plan</p>
          <h2 className="mt-1 text-lg font-black text-[#10231A]">推荐路线</h2>
        </div>
      </div>
      <ol className="mt-3 grid gap-2">
        {steps.map((step, index) => (
          <li className="rounded-2xl bg-emerald-50 px-3 py-3" key={`${step.title}-${index}`}>
            <p className="text-xs font-black text-emerald-700">
              {step.timeLabel} · {step.estimatedDuration}
            </p>
            <h3 className="mt-1 text-sm font-black text-[#10231A]">{step.title}</h3>
            <p className="mt-1 text-xs font-bold leading-5 text-[#64748B]">{step.description}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
