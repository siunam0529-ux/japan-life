"use client";

import { Check, ChevronRight } from "lucide-react";
import { CollapsiblePanel } from "@/components/CollapsiblePanel";
import { allStationLineFilter } from "@/lib/stations/stationSearch";
import { groupStationLineNames } from "@/lib/trainStatus/lineGroups";
import type { Language } from "@/lib/i18n/translations";
import type { ReactNode } from "react";

const linePickerCopy: Record<Language, { title: string }> = {
  "zh-CN": {
    title: "线路筛选",
  },
  "zh-TW": {
    title: "路線篩選",
  },
  ja: {
    title: "路線で絞り込み",
  },
};

export function StationLineGroupPicker({
  allLabel = allStationLineFilter,
  allValue = allStationLineFilter,
  language = "zh-CN",
  lineOptions,
  onSelectLine,
  renderSelectedLineContent,
  selectedLine,
}: {
  allLabel?: string;
  allValue?: string;
  language?: Language;
  lineOptions: string[];
  onSelectLine: (line: string) => void;
  renderSelectedLineContent?: (line: string) => ReactNode;
  selectedLine: string;
}) {
  const groups = groupStationLineNames(lineOptions);
  const text = linePickerCopy[language];
  const summary = selectedLine === allValue ? allLabel : selectedLine;

  if (lineOptions.length === 0) return null;

  return (
    <CollapsiblePanel closeOnSelect={!renderSelectedLineContent} className="mt-2 rounded-2xl border-slate-200 bg-slate-50/80 p-3 shadow-none" contentClassName="mt-3" summary={summary} title={text.title}>
      <div className="max-h-[360px] overflow-y-auto pr-1">
        <button
          className={`mb-3 flex min-h-12 w-full items-center justify-between rounded-2xl px-4 text-left text-sm font-black ${
            selectedLine === allValue ? "bg-blue-700 text-white" : "bg-white text-slate-950"
          }`}
          onClick={() => onSelectLine(allValue)}
          type="button"
        >
          <span>{allLabel}</span>
          {selectedLine === allValue ? <Check className="h-4 w-4" /> : <ChevronRight className="h-5 w-5 text-slate-300" />}
        </button>
        <div className="grid gap-4">
          {groups.map((group) => (
            <details className="group/line" key={group.id} open={group.lines.includes(selectedLine)}>
              <summary className="mb-2 flex cursor-pointer list-none items-center justify-between px-1 text-[12px] font-black text-slate-500 [&::-webkit-details-marker]:hidden">
                <span>{group.label}</span>
                <ChevronRight className="h-4 w-4 transition group-open/line:rotate-90" />
              </summary>
              <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-100">
                {group.lines.map((line, index) => {
                  const active = selectedLine === line;
                  return (
                    <div className={index > 0 ? "border-t border-slate-100" : ""} key={line}>
                      <button
                        className={`flex min-h-12 w-full items-center justify-between gap-3 px-4 text-left text-sm font-black ${
                          active ? "bg-blue-50 text-blue-800" : "text-slate-950"
                        }`}
                        onClick={() => onSelectLine(line)}
                        type="button"
                      >
                        <span className="min-w-0 flex-1 break-words">{line}</span>
                        {active ? <Check className="h-4 w-4 shrink-0 text-blue-700" /> : <ChevronRight className="h-5 w-5 shrink-0 text-slate-300" />}
                      </button>
                      {active && renderSelectedLineContent ? (
                        <div className="border-t border-blue-100 bg-blue-50/40 px-2 py-2">
                          {renderSelectedLineContent(line)}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </details>
          ))}
        </div>
      </div>
    </CollapsiblePanel>
  );
}
