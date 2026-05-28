import { CollapsiblePanel } from "@/components/CollapsiblePanel";
import type { WalkTag } from "@/lib/walk/spots";

export function WalkTags({
  activeTag,
  onChange,
  tags,
}: {
  activeTag: WalkTag | "全部";
  onChange: (tag: WalkTag | "全部") => void;
  tags: readonly WalkTag[];
}) {
  return (
    <CollapsiblePanel eyebrow="Mood Filter" summary={`当前：${activeTag}`} title="按今天的心情选">
      <div className="mt-3 flex flex-wrap gap-2">
        {(["全部", ...tags] as Array<WalkTag | "全部">).map((tag) => (
          <button
            aria-pressed={activeTag === tag}
            className={`selection-chip shrink-0 rounded-full px-3 py-1.5 text-xs font-black ${activeTag === tag ? "is-selected" : ""}`}
            key={tag}
            onClick={() => onChange(tag)}
            type="button"
          >
            {tag}
          </button>
        ))}
      </div>
    </CollapsiblePanel>
  );
}
