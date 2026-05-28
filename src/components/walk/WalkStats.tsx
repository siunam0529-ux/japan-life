import { Footprints, Heart, SmilePlus, Trophy } from "lucide-react";
import type { WalkRecord, WalkVisitMap } from "@/lib/walk/storage";

function formatLastWalk(records: WalkRecord[]) {
  const latest = records[0];
  if (!latest) return "还没有记录";
  const date = new Date(latest.date);
  const day = Number.isNaN(date.getTime()) ? "" : date.toLocaleDateString("zh-CN", { month: "2-digit", day: "2-digit" });
  return `${latest.station}${day ? ` · ${day}` : ""}`;
}

function getTopMood(records: WalkRecord[]) {
  if (records.length === 0) return "还没有";
  const counts = records.reduce((acc, record) => {
    acc[record.moodLabel] = (acc[record.moodLabel] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  return Object.entries(counts).sort((left, right) => right[1] - left[1])[0]?.[0] ?? "还没有";
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
  const visitedCount = Object.values(visitedMap).filter((item) => item.count > 0).length;
  const stats = [
    { icon: Footprints, label: "已去过", value: `${visitedCount} 个` },
    { icon: Heart, label: "收藏", value: `${favoriteCount} 个` },
    { icon: Trophy, label: "最近一次", value: formatLastWalk(records) },
    { icon: SmilePlus, label: "常用心情", value: getTopMood(records) },
  ];

  return (
    <section className="rounded-[26px] border border-emerald-100 bg-white/90 p-4 shadow-[0_12px_30px_rgba(22,101,52,0.08)]">
      <p className="text-xs font-black text-emerald-700">Walk Stats</p>
      <h2 className="mt-1 text-lg font-black text-[#10231A]">散步成就</h2>
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
