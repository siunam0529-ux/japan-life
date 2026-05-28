import { CollapsiblePanel } from "@/components/CollapsiblePanel";
import type { TrainDealTab } from "@/lib/trainDeals/types";

export function TrainDealTabs({
  activeTab,
  tabs,
  onChange,
}: {
  activeTab: TrainDealTab;
  tabs: TrainDealTab[];
  onChange: (tab: TrainDealTab) => void;
}) {
  return (
    <CollapsiblePanel eyebrow="Category" summary={`当前：${activeTab}`} title="优惠票分类">
      <div className="-mx-1 mt-3 flex gap-2 overflow-x-auto px-1 pb-1">
        {tabs.map((tab) => {
          const active = activeTab === tab;
          return (
            <button
              aria-pressed={active}
              className={`min-h-10 shrink-0 rounded-full px-3 text-xs font-black transition focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 active:scale-[0.98] ${
                active ? "bg-emerald-700 text-white shadow-sm" : "border border-emerald-100 bg-white text-[#475569]"
              }`}
              key={tab}
              onClick={() => onChange(tab)}
              type="button"
            >
              {tab}
            </button>
          );
        })}
      </div>
    </CollapsiblePanel>
  );
}
