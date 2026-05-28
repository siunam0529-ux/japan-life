"use client";

import { Check, RotateCcw, Save, Settings2 } from "lucide-react";
import { useEffect, useState } from "react";
import { BackButton } from "@/components/BackButton";
import { dashboardTools, defaultHomeToolKeys, type DashboardToolKey } from "@/data/tools";
import { useHomeTools } from "@/hooks/useHomeTools";
import { useLanguage } from "@/hooks/useLanguage";

const copy = {
  "zh-CN": {
    back: "返回",
    count: "已选择",
    description: "选择首页常用工具区显示的功能。最多 9 个，点保存后才会生效。",
    limit: "最多显示 9 个",
    reset: "恢复默认",
    saved: "已保存到首页",
    saveSelection: "保存选择",
    title: "常用工具管理",
  },
  "zh-TW": {
    back: "返回",
    count: "已選擇",
    description: "選擇首頁常用工具區顯示的功能。最多 9 個，點儲存後才會生效。",
    limit: "最多顯示 9 個",
    reset: "恢復預設",
    saved: "已儲存到首頁",
    saveSelection: "儲存選擇",
    title: "常用工具管理",
  },
  ja: {
    back: "戻る",
    count: "選択中",
    description: "ホームに表示するよく使う機能を選べます。最大9個まで、保存すると反映されます。",
    limit: "最大 9 個まで",
    reset: "初期設定に戻す",
    saved: "ホームに保存しました",
    saveSelection: "選択を保存",
    title: "よく使う機能の管理",
  },
} as const;

const toolIconColors = ["#34C759", "#FF9500", "#007AFF", "#FF2D55", "#AF52DE", "#FFCC00", "#00C7BE", "#FF9F0A", "#5856D6", "#5AC8FA"] as const;

export default function HomeToolsPage() {
  const { language } = useLanguage();
  const text = copy[language];
  const { maxCount, saveSelectedToolKeys, selectedToolKeys } = useHomeTools();
  const [draftToolKeys, setDraftToolKeys] = useState<DashboardToolKey[]>(selectedToolKeys);
  const [savedMessage, setSavedMessage] = useState("");
  const hasChanges = selectedToolKeys.join("|") !== draftToolKeys.join("|");

  useEffect(() => {
    setDraftToolKeys(selectedToolKeys);
  }, [selectedToolKeys]);

  const toggleDraftToolKey = (key: DashboardToolKey) => {
    setSavedMessage("");
    setDraftToolKeys((current) => (current.includes(key) ? current.filter((item) => item !== key) : [...current, key].slice(0, maxCount)));
  };

  const resetDraftToolKeys = () => {
    setSavedMessage("");
    setDraftToolKeys([...defaultHomeToolKeys]);
  };

  const saveDraftToolKeys = () => {
    saveSelectedToolKeys(draftToolKeys);
    setSavedMessage(text.saved);
  };

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
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-3xl bg-gradient-to-br from-sky-100 to-blue-100 text-[#2563EB] shadow-sm">
              <Settings2 className="h-6 w-6" />
            </span>
            <h1 className="text-3xl font-black tracking-tight">{text.title}</h1>
          </div>
          <p className="mt-3 text-sm font-bold leading-6 text-[#64748B]">{text.description}</p>
        </section>

        <section className="mt-4 rounded-[26px] border border-white/60 bg-white/75 p-4 shadow-[0_12px_34px_rgba(37,99,235,0.08)] backdrop-blur-xl">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-black text-[#64748B]">
              {text.count} {draftToolKeys.length}/{maxCount} · {text.limit}
            </span>
            <button className="ios-glass-button flex items-center gap-1 px-3 py-2 text-xs font-black text-[#2563EB]" onClick={resetDraftToolKeys} type="button">
              <RotateCcw className="h-3.5 w-3.5" />
              {text.reset}
            </button>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2.5">
            {dashboardTools.map((tool, index) => {
              const selected = draftToolKeys.includes(tool.key);
              const disabled = !selected && draftToolKeys.length >= maxCount;
              const Icon = tool.icon;
              const iconColor = toolIconColors[index % toolIconColors.length];
              return (
                <button
                  className={`home-tool-choice flex min-h-[76px] items-center gap-3 rounded-3xl border px-3 py-3 text-left text-sm font-black transition-all duration-300 ${
                    selected ? "is-selected" : ""
                  } ${disabled ? "is-disabled" : "hover:-translate-y-0.5"}`}
                  disabled={disabled}
                  key={tool.key}
                  onClick={() => toggleDraftToolKey(tool.key)}
                  type="button"
                >
                  <span className="home-tool-choice-icon flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-[16px] border border-[rgba(210,220,235,0.72)] bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(245,248,255,0.82))] shadow-[0_8px_17px_rgba(15,76,129,0.085)]">
                    <Icon className="h-[30px] w-[30px] stroke-[2.35]" style={{ color: iconColor }} />
                  </span>
                  <span className="min-w-0 flex-1 truncate">{tool.title[language]}</span>
                  {selected && (
                    <span className="home-tool-choice-check flex h-6 w-6 shrink-0 items-center justify-center rounded-full">
                      <Check className="h-3.5 w-3.5" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="mt-4 grid gap-2">
            <button className="jl-save-button flex h-12 items-center justify-center gap-2 rounded-2xl text-sm font-black" disabled={!hasChanges || draftToolKeys.length === 0} onClick={saveDraftToolKeys} type="button">
              <Save className="h-4 w-4" />
              {text.saveSelection}
            </button>
            {savedMessage && (
              <p className="flex items-center justify-center gap-1 rounded-2xl bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-700 ring-1 ring-emerald-100">
                <Check className="h-3.5 w-3.5" />
                {savedMessage}
              </p>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
