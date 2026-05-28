import { Footprints } from "lucide-react";
import type { WalkRecord } from "@/lib/walk/storage";

function formatRecordDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("zh-CN", { month: "2-digit", day: "2-digit" });
}

export function WalkHistory({ records }: { records: WalkRecord[] }) {
  return (
    <section className="rounded-[26px] border border-emerald-100 bg-white/90 p-4 shadow-[0_12px_30px_rgba(22,101,52,0.08)]">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black text-emerald-700">Recent Walks</p>
          <h2 className="mt-1 text-lg font-black text-[#10231A]">最近散步记录</h2>
        </div>
        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">最多 5 条</span>
      </div>

      {records.length === 0 ? (
        <div className="mt-3 rounded-[22px] border border-dashed border-emerald-200 bg-emerald-50/60 p-4 text-center">
          <Footprints className="mx-auto h-6 w-6 text-emerald-700" />
          <p className="mt-2 text-sm font-black text-[#10231A]">还没有散步记录，今天去一个没去过的地方吧。</p>
        </div>
      ) : (
        <div className="mt-3 grid gap-2">
          {records.slice(0, 5).map((record) => (
            <article className="flex gap-3 rounded-[22px] border border-slate-200 bg-white p-2 shadow-sm" key={record.id}>
              <img alt={`${record.station} 散步记录`} className="h-16 w-16 shrink-0 rounded-[18px] object-cover" src={record.image} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="truncate text-sm font-black text-[#10231A]">{record.station}</h3>
                  <span className="shrink-0 text-[11px] font-black text-[#94A3B8]">{formatRecordDate(record.date)}</span>
                </div>
                <p className="mt-1 truncate text-xs font-black text-emerald-700">{record.moodLabel} · {record.weather}</p>
                <p className="mt-1 line-clamp-2 text-xs font-bold leading-5 text-[#64748B]">{record.note || "没有写备注，也算一次好好出门。"}</p>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
