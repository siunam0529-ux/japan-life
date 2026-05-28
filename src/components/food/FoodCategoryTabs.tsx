import { CollapsiblePanel } from "@/components/CollapsiblePanel";
import type { FoodMoodTag } from "@/lib/food/types";

export function FoodCategoryTabs({
  activeTag,
  categories,
  onChange,
}: {
  activeTag: FoodMoodTag | "全部";
  categories: Array<FoodMoodTag | "全部">;
  onChange: (tag: FoodMoodTag | "全部") => void;
}) {
  return (
    <CollapsiblePanel eyebrow="Mood" summary={`当前：${activeTag}`} title="心情 / 场景筛选">
      <div className="-mx-1 mt-3 flex gap-2 overflow-x-auto px-1 pb-1">
        {categories.map((tag) => {
          const active = activeTag === tag;
          return (
            <button
              aria-pressed={active}
              className={`min-h-10 shrink-0 rounded-full px-3 text-xs font-black transition focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 active:scale-[0.98] ${
                active ? "bg-emerald-700 text-white shadow-sm" : "border border-emerald-100 bg-white text-[#475569]"
              }`}
              key={tag}
              onClick={() => onChange(tag)}
              type="button"
            >
              {tag}
            </button>
          );
        })}
      </div>
    </CollapsiblePanel>
  );
}
