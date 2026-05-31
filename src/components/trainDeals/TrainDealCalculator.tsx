import { Calculator, MapPinned, Plane, Trees } from "lucide-react";
import { CollapsiblePanel } from "@/components/CollapsiblePanel";
import { useLanguage } from "@/hooks/useLanguage";
import { getTrainDealAdvice } from "@/lib/trainDeals/recommendation";
import type { MainRailType, TrainDealCalculatorState, TrainRideCount } from "@/lib/trainDeals/types";

const rideCounts: TrainRideCount[] = ["1〜2 次", "3〜4 次", "5 次以上"];
const mainRails: MainRailType[] = ["JR", "Metro", "都营", "私铁", "混坐"];

export function TrainDealCalculator({
  state,
  onChange,
}: {
  state: TrainDealCalculatorState;
  onChange: (state: TrainDealCalculatorState) => void;
}) {
  const { language } = useLanguage();
  const text = {
    "zh-CN": {
      title: "简单省钱计算器",
      desc: "只做方向判断，不做精确票价计算。",
      adjust: "调整判断条件",
      rides: "今天坐几次车",
      main: "主要使用",
      multiSpot: "今天去多个景点",
      airport: "今天去机场",
      suburban: "今天去近郊",
    },
    "zh-TW": {
      title: "簡單省錢計算器",
      desc: "只做方向判斷，不做精確票價計算。",
      adjust: "調整判斷條件",
      rides: "今天坐幾次車",
      main: "主要使用",
      multiSpot: "今天去多個景點",
      airport: "今天去機場",
      suburban: "今天去近郊",
    },
    ja: {
      title: "簡易節約チェック",
      desc: "方向性の判断のみで、正確な運賃計算ではありません。",
      adjust: "条件を調整",
      rides: "今日の乗車回数",
      main: "主に使う路線",
      multiSpot: "今日は複数スポットへ行く",
      airport: "今日は空港へ行く",
      suburban: "今日は近郊へ行く",
    },
  }[language];
  const advice = getTrainDealAdvice(state);

  return (
    <section className="rounded-[26px] border border-emerald-100 bg-white/92 p-4 shadow-[0_12px_30px_rgba(22,101,52,0.08)]">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
          <Calculator className="h-5 w-5" />
        </span>
        <div>
          <p className="text-xs font-black text-emerald-700">Check</p>
          <h2 className="mt-1 text-lg font-black text-[#10231A]">{text.title}</h2>
          <p className="mt-1 text-xs font-bold leading-5 text-[#64748B]">{text.desc}</p>
        </div>
      </div>

      <p className="mt-4 rounded-2xl bg-emerald-50 px-3 py-3 text-sm font-bold leading-6 text-emerald-900">{advice}</p>

      <CollapsiblePanel className="mt-3 rounded-[22px] bg-emerald-50/50 p-3 shadow-none" contentClassName="mt-3 grid gap-4" summary={`${state.rideCount} / ${state.mainRail}`} title={text.adjust}>
        <div>
          <p className="text-xs font-black text-[#10231A]">{text.rides}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {rideCounts.map((rideCount) => {
              const active = state.rideCount === rideCount;
              return (
                <button
                  aria-pressed={active}
                  className={`min-h-10 rounded-full px-3 text-xs font-black transition focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 active:scale-[0.98] ${
                    active ? "bg-emerald-700 text-white" : "border border-emerald-100 bg-white text-[#475569]"
                  }`}
                  key={rideCount}
                  onClick={() => onChange({ ...state, rideCount })}
                  type="button"
                >
                  {rideCount}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <p className="text-xs font-black text-[#10231A]">{text.main}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {mainRails.map((mainRail) => {
              const active = state.mainRail === mainRail;
              return (
                <button
                  aria-pressed={active}
                  className={`min-h-10 rounded-full px-3 text-xs font-black transition focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 active:scale-[0.98] ${
                    active ? "bg-emerald-700 text-white" : "border border-emerald-100 bg-white text-[#475569]"
                  }`}
                  key={mainRail}
                  onClick={() => onChange({ ...state, mainRail })}
                  type="button"
                >
                  {mainRail}
                </button>
              );
            })}
          </div>
        </div>

        <label className="flex min-h-12 items-center justify-between gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/60 px-3 py-2">
          <span className="flex items-center gap-2 text-xs font-black text-emerald-900">
            <MapPinned className="h-4 w-4" />
            {text.multiSpot}
          </span>
          <input
            checked={state.multiSpot}
            className="h-5 w-5 accent-emerald-700"
            onChange={(event) => onChange({ ...state, multiSpot: event.target.checked })}
            type="checkbox"
          />
        </label>

        <label className="flex min-h-12 items-center justify-between gap-3 rounded-2xl border border-emerald-100 bg-white px-3 py-2">
          <span className="flex items-center gap-2 text-xs font-black text-emerald-900">
            <Plane className="h-4 w-4" />
            {text.airport}
          </span>
          <input
            checked={state.airport}
            className="h-5 w-5 accent-emerald-700"
            onChange={(event) => onChange({ ...state, airport: event.target.checked })}
            type="checkbox"
          />
        </label>

        <label className="flex min-h-12 items-center justify-between gap-3 rounded-2xl border border-emerald-100 bg-white px-3 py-2">
          <span className="flex items-center gap-2 text-xs font-black text-emerald-900">
            <Trees className="h-4 w-4" />
            {text.suburban}
          </span>
          <input
            checked={state.suburban}
            className="h-5 w-5 accent-emerald-700"
            onChange={(event) => onChange({ ...state, suburban: event.target.checked })}
            type="checkbox"
          />
        </label>
      </CollapsiblePanel>
    </section>
  );
}
