import { CollapsiblePanel } from "@/components/CollapsiblePanel";
import { useLanguage } from "@/hooks/useLanguage";
import type { WalkTag } from "@/lib/walk/spots";
import { walkUiText } from "@/components/walk/walkI18n";

export function WalkTags({
  activeTag,
  onChange,
  tags,
}: {
  activeTag: WalkTag | "全部";
  onChange: (tag: WalkTag | "全部") => void;
  tags: readonly WalkTag[];
}) {
  const { language } = useLanguage();
  const text = walkUiText[language];
  const allTag = "全部" as const;

  return (
    <CollapsiblePanel closeOnSelect eyebrow="Mood Filter" summary={`${text.current}: ${activeTag === allTag ? text.all : activeTag}`} title={text.moodFilterTitle}>
      <div className="mt-3 flex flex-wrap gap-2">
        {([allTag, ...tags] as Array<WalkTag | "全部">).map((tag) => (
          <button
            aria-pressed={activeTag === tag}
            className={`selection-chip shrink-0 rounded-full px-3 py-1.5 text-xs font-black ${activeTag === tag ? "is-selected" : ""}`}
            key={tag}
            onClick={() => onChange(tag)}
            type="button"
          >
            {tag === allTag ? text.all : tag}
          </button>
        ))}
      </div>
    </CollapsiblePanel>
  );
}
