import { CheckCircle2, PencilLine } from "lucide-react";
import { useState } from "react";
import { CollapsiblePanel } from "@/components/CollapsiblePanel";
import type { WalkSpot } from "@/lib/walk/spots";
import { walkMoodOptions, type WalkMoodId } from "@/lib/walk/storage";

export function WalkRecordForm({
  onSave,
  spot,
  weatherLabel,
}: {
  onSave: (input: { mood: WalkMoodId; note: string }) => void;
  spot: WalkSpot;
  weatherLabel: string;
}) {
  const [mood, setMood] = useState<WalkMoodId>("relaxed");
  const [note, setNote] = useState("");
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    onSave({ mood, note: note.trim() });
    setSaved(true);
    setNote("");
    window.setTimeout(() => setSaved(false), 1800);
  };

  return (
    <section className="rounded-[26px] border border-emerald-100 bg-white/90 p-4 shadow-[0_12px_30px_rgba(22,101,52,0.08)]">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white">
          <PencilLine className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-black text-emerald-700">Walk Log</p>
          <h2 className="mt-1 text-lg font-black text-[#10231A]">记录这次散步</h2>
          <p className="mt-1 text-xs font-bold leading-5 text-[#64748B]">
            {spot.station} · {weatherLabel}
          </p>
        </div>
      </div>

      <CollapsiblePanel className="mt-4 rounded-[22px] bg-emerald-50/40 p-3 shadow-none" contentClassName="mt-2" summary={getMoodText(mood)} title="今天的心情">
        <div className="mt-2 flex flex-wrap gap-2">
          {walkMoodOptions.map((option) => (
            <button
              aria-pressed={mood === option.id}
              className={`selection-chip shrink-0 rounded-full px-3 py-1.5 text-xs font-black ${mood === option.id ? "is-selected" : ""}`}
              key={option.id}
              onClick={() => setMood(option.id)}
              type="button"
            >
              {option.emoji} {option.label}
            </button>
          ))}
        </div>
      </CollapsiblePanel>

      <label className="mt-4 block">
        <span className="text-xs font-black text-[#64748B]">简短备注</span>
        <textarea
          className="mt-2 min-h-24 w-full rounded-[22px] border border-emerald-100 bg-emerald-50/40 px-3 py-3 text-sm font-bold leading-6 text-[#10231A] outline-none focus:border-emerald-500"
          onChange={(event) => setNote(event.target.value)}
          placeholder="例如：今天只想慢慢走，看到一家很舒服的小店。"
          value={note}
        />
      </label>

      <button className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-emerald-700 text-sm font-black text-white shadow-[0_14px_28px_rgba(22,101,52,0.22)] transition active:scale-[0.98]" onClick={handleSave} type="button">
        <CheckCircle2 className="h-4 w-4" />
        记录这次散步
      </button>
      {saved && <p className="mt-2 rounded-2xl bg-emerald-50 px-3 py-2 text-center text-xs font-black text-emerald-700">已保存到最近散步记录</p>}
    </section>
  );
}

function getMoodText(mood: WalkMoodId) {
  const option = walkMoodOptions.find((item) => item.id === mood);
  return option ? `${option.emoji} ${option.label}` : "";
}
