import { CollapsiblePanel } from "@/components/CollapsiblePanel";
import type { PlayFilterTag } from "@/lib/play/types";

export function PlayFilterTabs({
  activeFilters,
  groups,
  onToggle,
}: {
  activeFilters: PlayFilterTag[];
  groups: Array<{ title: string; options: PlayFilterTag[] }>;
  onToggle: (tag: PlayFilterTag) => void;
}) {
  return (
    <CollapsiblePanel eyebrow="Filter" summary={activeFilters.length > 0 ? `已选：${activeFilters.slice(0, 3).join(" / ")}${activeFilters.length > 3 ? "…" : ""}` : "还没有选择条件"} title="游玩条件选择">
      <div className="mt-3 grid gap-3">
        {groups.map((group) => (
          <div key={group.title}>
            <p className="mb-2 text-xs font-black text-[#475569]">{group.title}</p>
            <div className="flex flex-wrap gap-2">
              {group.options.map((option) => {
                const active = activeFilters.includes(option);
                return (
                  <button
                    aria-pressed={active}
                    className={`min-h-10 rounded-full px-3 text-xs font-black transition focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 active:scale-[0.98] ${
                      active ? "bg-emerald-700 text-white shadow-sm" : "border border-emerald-100 bg-white text-[#475569]"
                    }`}
                    key={option}
                    onClick={() => onToggle(option)}
                    type="button"
                  >
                    {option}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </CollapsiblePanel>
  );
}
