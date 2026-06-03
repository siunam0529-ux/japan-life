import { SlidersHorizontal, X } from "lucide-react";
import { CollapsiblePanel } from "@/components/CollapsiblePanel";
import { useLanguage } from "@/hooks/useLanguage";
import { walkFeedbackOptions, type WalkFeedbackId } from "@/lib/walk/feedback";
import { getWalkFeedbackLabel, getWalkFeedbackSummaryText, walkUiText } from "@/components/walk/walkI18n";

export function WalkFeedback({
  feedbackIds,
  onSelect,
}: {
  feedbackIds: WalkFeedbackId[];
  onSelect: (feedbackId: WalkFeedbackId) => void;
}) {
  const { language } = useLanguage();
  const text = walkUiText[language];
  const summary = getWalkFeedbackSummaryText(feedbackIds, language);

  return (
    <section className="rounded-[26px] border border-emerald-100 bg-white/90 p-4 shadow-[0_12px_30px_rgba(22,101,52,0.08)]">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-lime-100 text-emerald-700">
          <SlidersHorizontal className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-black text-emerald-700">Tune Today</p>
          <h2 className="mt-1 text-lg font-black text-[#10231A]">{text.feedbackTitle}</h2>
          <p className="mt-1 text-xs font-bold leading-5 text-[#64748B]">{summary}</p>
        </div>
      </div>
      <CollapsiblePanel className="mt-3 rounded-[22px] bg-emerald-50/50 p-3 shadow-none" contentClassName="mt-2" summary={summary} title={text.feedbackPanelTitle}>
        <div className="flex flex-wrap gap-2">
          {walkFeedbackOptions.map((option) => {
            const selected = feedbackIds.includes(option.id);
            return (
              <button
                aria-pressed={selected}
                className={`flex min-h-9 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-black transition active:scale-[0.98] ${
                  selected ? "bg-emerald-700 text-white" : "border border-emerald-100 bg-emerald-50 text-emerald-800"
                }`}
                key={option.id}
                onClick={() => onSelect(option.id)}
                type="button"
              >
                {selected && <X className="h-3.5 w-3.5" />}
                {getWalkFeedbackLabel(option.id, language)}
              </button>
            );
          })}
        </div>
      </CollapsiblePanel>
    </section>
  );
}
