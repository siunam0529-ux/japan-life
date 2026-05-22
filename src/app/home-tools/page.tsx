"use client";

import { Check, RotateCcw, Settings2 } from "lucide-react";
import { BackButton } from "@/components/BackButton";
import { dashboardTools } from "@/data/tools";
import { useHomeTools } from "@/hooks/useHomeTools";
import { useLanguage } from "@/hooks/useLanguage";

const copy = {
  "zh-CN": {
    back: "返回",
    count: "已选择",
    description: "选择首页常用工具区显示的功能。最多 9 个，刷新后也会保留。",
    limit: "最多显示 9 个",
    reset: "恢复默认",
    title: "常用工具管理",
  },
  "zh-TW": {
    back: "返回",
    count: "已選擇",
    description: "選擇首頁常用工具區顯示的功能。最多 9 個，重新整理後也會保留。",
    limit: "最多顯示 9 個",
    reset: "恢復預設",
    title: "常用工具管理",
  },
  ja: {
    back: "戻る",
    count: "選択中",
    description: "ホームのよく使う機能に表示する項目を選べます。最大 9 個まで、更新後も保存されます。",
    limit: "最大 9 個まで",
    reset: "初期設定に戻す",
    title: "よく使う機能の管理",
  },
} as const;

export default function HomeToolsPage() {
  const { language } = useLanguage();
  const text = copy[language];
  const { maxCount, resetHomeTools, selectedToolKeys, toggleToolKey } = useHomeTools();

  return (
    <main className="min-h-screen bg-[#F6FAFF] text-[#0F172A]">
      <div className="mx-auto min-h-screen max-w-[430px] bg-[radial-gradient(circle_at_top,#DFF1FF_0%,#F6FAFF_42%,#FFFFFF_100%)] px-4 pb-10 pt-5">
        <header className="flex items-center justify-between gap-3">
          <BackButton label={text.back} />
          <span className="rounded-full bg-white/75 px-4 py-2 text-xs font-black text-[#2563EB] shadow-sm backdrop-blur-xl">
            Japan Life
          </span>
        </header>

        <section className="mt-5 rounded-[30px] border border-white/60 bg-white/75 p-5 shadow-[0_18px_45px_rgba(37,99,235,0.10)] backdrop-blur-xl">
          <span className="flex h-12 w-12 items-center justify-center rounded-3xl bg-gradient-to-br from-sky-100 to-blue-100 text-[#2563EB] shadow-sm">
            <Settings2 className="h-6 w-6" />
          </span>
          <h1 className="mt-4 text-3xl font-black tracking-tight">{text.title}</h1>
          <p className="mt-2 text-sm font-bold leading-6 text-[#64748B]">{text.description}</p>
        </section>

        <section className="mt-4 rounded-[26px] border border-white/60 bg-white/75 p-4 shadow-[0_12px_34px_rgba(37,99,235,0.08)] backdrop-blur-xl">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-black text-[#64748B]">
              {text.count} {selectedToolKeys.length}/{maxCount} · {text.limit}
            </span>
            <button className="ios-glass-button flex items-center gap-1 px-3 py-2 text-xs font-black text-[#2563EB]" onClick={resetHomeTools} type="button">
              <RotateCcw className="h-3.5 w-3.5" />
              {text.reset}
            </button>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2.5">
            {dashboardTools.map((tool) => {
              const selected = selectedToolKeys.includes(tool.key);
              const disabled = !selected && selectedToolKeys.length >= maxCount;
              const Icon = tool.icon;
              return (
                <button
                  className={`flex min-h-[58px] items-center gap-2.5 rounded-3xl border px-3 py-3 text-left text-sm font-black transition-all duration-300 ${
                    selected
                      ? "border-blue-100 bg-blue-50/90 text-[#2563EB] shadow-sm"
                      : "border-white/70 bg-white/70 text-[#0F172A] shadow-sm"
                  } ${disabled ? "opacity-45" : "hover:-translate-y-0.5 hover:bg-white"}`}
                  disabled={disabled}
                  key={tool.key}
                  onClick={() => toggleToolKey(tool.key)}
                  type="button"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-white/80 shadow-sm">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1 truncate">{tool.title[language]}</span>
                  {selected && <Check className="h-4 w-4 shrink-0" />}
                </button>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}
