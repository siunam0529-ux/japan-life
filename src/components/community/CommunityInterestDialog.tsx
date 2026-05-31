"use client";

import { useMemo, useState } from "react";
import {
  communityInterestDialogCopy,
  communityMaxInterests,
  getCommunityInterestOptions,
} from "@/lib/community/preferences";
import type { CommunityViewLocale } from "@/lib/community/types";

export function CommunityInterestDialog({
  initialInterests,
  locale,
  onClose,
  onSave,
  onSkip,
}: {
  initialInterests: string[];
  locale: CommunityViewLocale;
  onClose?: () => void;
  onSave: (interests: string[]) => void;
  onSkip?: () => void;
}) {
  const copy = communityInterestDialogCopy[locale];
  const options = useMemo(() => getCommunityInterestOptions(locale), [locale]);
  const [selected, setSelected] = useState<string[]>(initialInterests.slice(0, communityMaxInterests));

  function toggleInterest(interest: string) {
    setSelected((current) => {
      if (current.includes(interest)) return current.filter((item) => item !== interest);
      if (current.length >= communityMaxInterests) return current;
      return [...current, interest];
    });
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-[rgba(15,23,42,0.28)] px-4 pb-5 pt-10 backdrop-blur-sm">
      <section className="w-full max-w-[430px] rounded-[28px] bg-white/94 p-5 shadow-[0_20px_50px_rgba(15,76,129,0.18)] backdrop-blur-[18px]">
        <h2 className="text-[22px] font-[850] leading-7 text-[#061a3a]">{copy.title}</h2>
        <p className="mt-2 text-[13px] font-bold leading-5 text-[#40546f]">{copy.subtitle}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {options.map((interest) => {
            const active = selected.includes(interest);
            return (
              <button
                className={`h-[34px] rounded-full px-3.5 text-[13px] font-extrabold ${active ? "bg-[linear-gradient(135deg,#2563eb,#38bdf8)] text-white shadow-[0_8px_18px_rgba(37,99,235,0.18)]" : "bg-[rgba(239,248,255,0.9)] text-[#40546f] ring-1 ring-blue-100"}`}
                key={interest}
                onClick={() => toggleInterest(interest)}
                type="button"
              >
                {interest}
              </button>
            );
          })}
        </div>
        <p className="mt-3 text-[11px] font-bold text-slate-400">{selected.length}/{communityMaxInterests}</p>
        <div className="mt-4 grid grid-cols-[0.8fr_1fr] gap-2">
          <button className="h-[46px] rounded-full bg-slate-50 text-sm font-black text-slate-500 ring-1 ring-slate-200" onClick={onSkip ?? onClose} type="button">
            {copy.skip}
          </button>
          <button
            className="h-[46px] rounded-full bg-[linear-gradient(135deg,#2563eb,#38bdf8)] text-sm font-[850] text-white disabled:bg-slate-300 disabled:bg-none"
            disabled={selected.length < 1}
            onClick={() => onSave(selected)}
            type="button"
          >
            {copy.save}
          </button>
        </div>
      </section>
    </div>
  );
}
