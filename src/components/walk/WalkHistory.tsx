import { Footprints } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import type { WalkRecord } from "@/lib/walk/storage";
import type { Language } from "@/lib/i18n/translations";
import { walkUiText } from "@/components/walk/walkI18n";

function formatRecordDate(value: string, language: Language) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const locale = language === "ja" ? "ja-JP" : language === "zh-TW" ? "zh-TW" : "zh-CN";
  return date.toLocaleDateString(locale, { month: "2-digit", day: "2-digit" });
}

export function WalkHistory({ records }: { records: WalkRecord[] }) {
  const { language } = useLanguage();
  const text = walkUiText[language];

  return (
    <section className="rounded-[26px] border border-emerald-100 bg-white/90 p-4 shadow-[0_12px_30px_rgba(22,101,52,0.08)]">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black text-emerald-700">Recent Walks</p>
          <h2 className="mt-1 text-lg font-black text-[#10231A]">{text.recentWalks}</h2>
        </div>
        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">{text.maxFive}</span>
      </div>

      {records.length === 0 ? (
        <div className="mt-3 rounded-[22px] border border-dashed border-emerald-200 bg-emerald-50/60 p-4 text-center">
          <Footprints className="mx-auto h-6 w-6 text-emerald-700" />
          <p className="mt-2 text-sm font-black text-[#10231A]">{text.noRecords}</p>
        </div>
      ) : (
        <div className="mt-3 grid gap-2">
          {records.slice(0, 5).map((record) => (
            <article className="flex gap-3 rounded-[22px] border border-slate-200 bg-white p-2 shadow-sm" key={record.id}>
              <img alt={text.recordAlt(record.station)} className="h-16 w-16 shrink-0 rounded-[18px] object-cover" src={record.image} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="truncate text-sm font-black text-[#10231A]">{record.station}</h3>
                  <span className="shrink-0 text-[11px] font-black text-[#94A3B8]">{formatRecordDate(record.date, language)}</span>
                </div>
                <p className="mt-1 truncate text-xs font-black text-emerald-700">{record.moodLabel} · {record.weather}</p>
                <p className="mt-1 line-clamp-2 text-xs font-bold leading-5 text-[#64748B]">{record.note || text.noNote}</p>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
