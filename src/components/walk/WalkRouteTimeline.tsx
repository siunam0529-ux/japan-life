import { Route } from "lucide-react";
import type { WalkRouteStep } from "@/lib/walk/spots";

export function WalkRouteTimeline({ steps }: { steps: WalkRouteStep[] }) {
  return (
    <section className="rounded-[26px] border border-emerald-100 bg-white/90 p-4 shadow-[0_12px_30px_rgba(22,101,52,0.08)]">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-600 text-white">
          <Route className="h-5 w-5" />
        </span>
        <div>
          <p className="text-xs font-black text-emerald-700">Light Route</p>
          <h2 className="text-lg font-black text-[#10231A]">散步路线感</h2>
        </div>
      </div>
      <div className="mt-4 grid gap-0">
        {steps.map((step, index) => (
          <div className="grid grid-cols-[24px_1fr] gap-3" key={`${step.stepTitle}-${index}`}>
            <div className="relative flex justify-center">
              <span className="mt-1 h-3 w-3 rounded-full border-2 border-white bg-emerald-600 shadow-[0_0_0_3px_rgba(16,185,129,0.18)]" />
              {index < steps.length - 1 && <span className="absolute top-5 h-[calc(100%-0.25rem)] w-px bg-emerald-100" />}
            </div>
            <div className="pb-4">
              <h3 className="text-sm font-black text-[#10231A]">{step.stepTitle}</h3>
              <p className="mt-1 text-xs font-bold leading-5 text-[#64748B]">{step.stepDescription}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
