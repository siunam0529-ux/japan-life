import { RefreshCw, Sparkles } from "lucide-react";

export function WalkTaskBox({ onChangeTask, task }: { onChangeTask: () => void; task: string }) {
  return (
    <section className="rounded-[26px] border border-emerald-100 bg-emerald-50 p-4 shadow-[0_12px_30px_rgba(22,101,52,0.08)]">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white">
          <Sparkles className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-black text-emerald-700">Today Mission</p>
          <h2 className="mt-1 text-lg font-black text-[#10231A]">今日任务</h2>
          <p className="mt-2 text-sm font-bold leading-6 text-[#475569]">{task}</p>
        </div>
      </div>
      <button aria-label="换一个散步任务" className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-white text-sm font-black text-emerald-700 shadow-sm transition active:scale-[0.98]" onClick={onChangeTask} type="button">
        <RefreshCw className="h-4 w-4" />
        换一个任务
      </button>
    </section>
  );
}
