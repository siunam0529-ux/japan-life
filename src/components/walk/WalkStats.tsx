import { Footprints, Heart, SmilePlus, Trophy } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import type { WalkRecord, WalkVisitMap } from "@/lib/walk/storage";
import type { Language } from "@/lib/i18n/translations";
import { walkUiText } from "@/components/walk/walkI18n";

function formatLastWalk(records: WalkRecord[], language: Language) {
  const text = walkUiText[language];
  const latest = records[0];
  if (!latest) return text.noStats;
  const date = new Date(latest.date);
  const locale = language === "ja" ? "ja-JP" : language === "zh-TW" ? "zh-TW" : "zh-CN";
  const day = Number.isNaN(date.getTime()) ? "" : date.toLocaleDateString(locale, { month: "2-digit", day: "2-digit" });
  return `${latest.station}${day ? ` / ${day}` : ""}`;
}

function getTopMood(records: WalkRecord[], language: Language) {
  if (records.length === 0) return walkUiText[language].noMood;
  const counts = records.reduce((acc, record) => {
    acc[record.moodLabel] = (acc[record.moodLabel] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  return Object.entries(counts).sort((left, right) => right[1] - left[1])[0]?.[0] ?? walkUiText[language].noMood;
}

export function WalkStats({
  favoriteCount,
  records,
  visitedMap,
}: {
  favoriteCount: number;
  records: WalkRecord[];
  visitedMap: WalkVisitMap;
}) {
  const { language } = useLanguage();
  const text = walkUiText[language];
  const visitedCount = Object.values(visitedMap).filter((item) => item.count > 0).length;
  const stats = [
    { icon: Footprints, label: text.visitedStat, value: `${visitedCount} ${text.itemUnit}` },
    { icon: Heart, label: text.favoritesStat, value: `${favoriteCount} ${text.itemUnit}` },
    { icon: Trophy, label: text.latestStat, value: formatLastWalk(records, language) },
    { icon: SmilePlus, label: text.moodStat, value: getTopMood(records, language) },
  ];

  return (
    <section className="rounded-[26px] border border-emerald-100 bg-white/90 p-4 shadow-[0_12px_30px_rgba(22,101,52,0.08)]">
      <p className="text-xs font-black text-emerald-700">Walk Stats</p>
      <h2 className="mt-1 text-lg font-black text-[#10231A]">{text.walkStats}</h2>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {stats.map((item) => {
          const Icon = item.icon;
          return (
            <div className="min-h-[92px] rounded-[22px] border border-slate-200 bg-white p-3 shadow-sm" key={item.label}>
              <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                <Icon className="h-4 w-4" />
              </span>
              <p className="mt-2 text-[11px] font-black text-[#64748B]">{item.label}</p>
              <p className="mt-1 line-clamp-2 text-sm font-black leading-5 text-[#10231A]">{item.value}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
