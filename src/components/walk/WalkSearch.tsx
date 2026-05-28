import { Search } from "lucide-react";

export function WalkSearch({ onChange, value }: { onChange: (value: string) => void; value: string }) {
  return (
    <section className="rounded-[26px] border border-emerald-100 bg-white/90 p-4 shadow-[0_12px_30px_rgba(22,101,52,0.08)]">
      <label className="flex h-11 items-center gap-2 rounded-2xl border border-emerald-100 bg-emerald-50/40 px-3">
        <span className="sr-only">搜索散步地点</span>
        <Search className="h-4 w-4 text-emerald-700" />
        <input
          className="min-w-0 flex-1 bg-transparent text-sm font-bold text-[#10231A] outline-none placeholder:text-slate-400"
          onChange={(event) => onChange(event.target.value)}
          placeholder="搜索车站、地区、标签，比如中野 / 安静 / 下雨天"
          value={value}
        />
      </label>
    </section>
  );
}
