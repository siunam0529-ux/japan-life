"use client";

import { Check, ChevronRight, Clock3, MapPin, RotateCcw, Save, Search, TrainFront } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { BackButton } from "@/components/BackButton";
import { RailLineBadge } from "@/components/RailLineBadge";
import { tokyoTrainStatusLines, trainStatusApiPlaceholder, type TrainStatusTone } from "@/data/trainStatus";
import { useLanguage } from "@/hooks/useLanguage";
import { useHomeRailLines } from "@/hooks/useHomeRailLines";

const copy = {
  "zh-CN": {
    apiNote: "API 接入预留：之后可在这里连接东京电车运行信息 API。",
    back: "返回",
    empty: "没有找到相关线路",
    placeholder: "搜索线路、站名或延误",
    manageTitle: "首页显示路线",
    manageDescription: "选择首页常用线路状态显示的路线，最多 6 条。",
    reset: "恢复默认",
    region: "东京",
    saved: "已保存到首页",
    saveSelection: "保存选择",
    subtitle: "查询山手线、中央线、东京 Metro 等常用线路状态。",
    title: "东京电车交通",
    updated: "示例数据",
  },
  "zh-TW": {
    apiNote: "API 接入預留：之後可在這裡連接東京電車運行資訊 API。",
    back: "返回",
    empty: "沒有找到相關路線",
    placeholder: "搜尋路線、車站或延誤",
    manageTitle: "首頁顯示路線",
    manageDescription: "選擇首頁常用路線狀態顯示的路線，最多 6 條。",
    reset: "恢復預設",
    region: "東京",
    saved: "已儲存到首頁",
    saveSelection: "儲存選擇",
    subtitle: "查詢山手線、中央線、東京 Metro 等常用路線狀態。",
    title: "東京電車交通",
    updated: "示例資料",
  },
  ja: {
    apiNote: "API連携用の予約枠です。今後ここに東京の運行情報APIを接続できます。",
    back: "戻る",
    empty: "該当する路線がありません",
    placeholder: "路線、駅名、遅延で検索",
    manageTitle: "ホームに表示する路線",
    manageDescription: "ホームの路線ステータスに表示する路線を選べます。最大6路線です。",
    reset: "初期設定に戻す",
    region: "東京",
    saved: "ホームに保存しました",
    saveSelection: "選択を保存",
    subtitle: "山手線、中央線、東京メトロなどの運行状況を確認できます。",
    title: "東京の電車運行情報",
    updated: "サンプルデータ",
  },
} as const;

export default function TrainStatusPage() {
  const { language } = useLanguage();
  const text = copy[language];
  const { maxCount, saveSelectedRailLineIds, selectedRailLineIds } = useHomeRailLines();
  const [query, setQuery] = useState("");
  const [draftRailLineIds, setDraftRailLineIds] = useState(selectedRailLineIds);
  const [savedMessage, setSavedMessage] = useState("");
  const lines = tokyoTrainStatusLines[language];
  const hasChanges = selectedRailLineIds.join("|") !== draftRailLineIds.join("|");
  const filteredLines = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return lines;
    return lines.filter((line) => `${line.code} ${line.name} ${line.status}`.toLowerCase().includes(keyword));
  }, [lines, query]);

  useEffect(() => {
    setDraftRailLineIds(selectedRailLineIds);
  }, [selectedRailLineIds]);

  const toggleDraftRailLineId = (id: (typeof lines)[number]["id"]) => {
    setSavedMessage("");
    setDraftRailLineIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id].slice(0, maxCount)));
  };

  const resetDraftRailLineIds = () => {
    setSavedMessage("");
    setDraftRailLineIds(lines.slice(0, maxCount).map((line) => line.id));
  };

  const saveDraftRailLineIds = () => {
    saveSelectedRailLineIds(draftRailLineIds);
    setSavedMessage(text.saved);
  };

  return (
    <main className="min-h-screen bg-[#F6FAFF] text-[#0F172A]">
      <div className="mx-auto min-h-screen max-w-[430px] bg-[radial-gradient(circle_at_top,#DFF1FF_0%,#F6FAFF_42%,#FFFFFF_100%)] px-4 pb-24 pt-5">
        <header className="mb-4 flex items-center justify-between">
          <BackButton label={text.back} />
          <span className="inline-flex items-center gap-1 rounded-full bg-white/70 px-3 py-2 text-xs font-black text-[#2563EB] shadow-sm ring-1 ring-white/60 backdrop-blur-xl">
            <MapPin className="h-3.5 w-3.5" />
            {text.region}
          </span>
        </header>

        <section className="jl-info-card rounded-[28px] p-5">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/85 text-[#2563EB] shadow-sm">
              <TrainFront className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-black text-[#2563EB]">Tokyo Rail</p>
              <h1 className="mt-1 text-2xl font-black tracking-tight">{text.title}</h1>
              <p className="mt-2 text-sm font-bold leading-6 text-[#64748B]">{text.subtitle}</p>
            </div>
          </div>
          <div className="mt-4 rounded-3xl bg-sky-50/75 p-3 text-xs font-bold leading-5 text-[#2563EB] ring-1 ring-white/70">
            {text.apiNote}
            <span className="mt-1 block text-[11px] text-[#64748B]">{trainStatusApiPlaceholder.note}</span>
          </div>
        </section>

        <label className="mt-4 flex h-12 items-center gap-2 rounded-3xl border border-white/60 bg-white/75 px-4 shadow-sm backdrop-blur-xl">
          <Search className="h-4 w-4 shrink-0 text-[#64748B]" />
          <input className="w-full bg-transparent text-sm font-bold text-[#0F172A] outline-none placeholder:text-[#94A3B8]" placeholder={text.placeholder} value={query} onChange={(event) => setQuery(event.target.value)} />
        </label>

        <section className="mt-4 rounded-[26px] border border-white/60 bg-white/75 p-4 shadow-[0_10px_32px_rgba(37,99,235,0.08)] backdrop-blur-xl">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-base font-black">{text.manageTitle}</h2>
              <p className="mt-1 text-xs font-bold leading-5 text-[#64748B]">{text.manageDescription}</p>
            </div>
            <button className="selection-chip shrink-0 rounded-full px-3 py-1.5 text-[11px] font-black" onClick={resetDraftRailLineIds} type="button">
              <RotateCcw className="mr-1 inline h-3.5 w-3.5" />
              {text.reset}
            </button>
          </div>
          <p className="mt-3 rounded-2xl bg-blue-50/85 px-3 py-2 text-xs font-black text-[#2563EB]">
            {draftRailLineIds.length}/{maxCount}
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {lines.map((line) => {
              const selected = draftRailLineIds.includes(line.id);
              const disabled = !selected && draftRailLineIds.length >= maxCount;
              return (
                <button
                  className={`rail-line-chip flex min-w-0 items-center gap-2 rounded-2xl px-3 py-2 text-left text-xs font-black ${selected ? "is-selected" : ""} ${disabled ? "is-disabled" : ""}`}
                  disabled={disabled}
                  key={line.id}
                  onClick={() => toggleDraftRailLineId(line.id)}
                  type="button"
                >
                  <RailLineBadge line={line} size="sm" />
                  <span className="min-w-0 truncate">{line.name}</span>
                </button>
              );
            })}
          </div>
          <div className="mt-4 grid gap-2">
            <button className="jl-save-button flex h-12 items-center justify-center gap-2 rounded-2xl text-sm font-black" disabled={!hasChanges} onClick={saveDraftRailLineIds} type="button">
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

        <section className="mt-4 grid gap-3">
          {filteredLines.length === 0 ? (
            <div className="rounded-[28px] border border-white/60 bg-white/75 p-8 text-center text-sm font-black text-[#64748B] shadow-sm backdrop-blur-xl">{text.empty}</div>
          ) : (
            filteredLines.map((line) => (
              <article className="rounded-[26px] border border-white/60 bg-white/75 p-4 shadow-[0_10px_32px_rgba(37,99,235,0.08)] backdrop-blur-xl" key={line.id}>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <RailLineBadge line={line} size="lg" />
                    <div className="min-w-0">
                      <h2 className="truncate text-base font-black">{line.name}</h2>
                      <p className="mt-1 flex items-center gap-1 text-xs font-bold text-[#64748B]">
                        <Clock3 className="h-3.5 w-3.5" />
                        {text.updated}
                      </p>
                    </div>
                  </div>
                  <span className={`shrink-0 rounded-full px-3 py-1.5 text-[11px] font-black ${getTrainStatusBadgeClass(line.tone)}`}>{line.status}</span>
                </div>
                <div className="mt-3 flex items-center justify-between rounded-2xl border border-blue-100 bg-blue-50/85 px-3 py-2 text-xs font-bold text-[#64748B] shadow-sm">
                  <span>API placeholder</span>
                  <ChevronRight className="h-4 w-4" />
                </div>
              </article>
            ))
          )}
        </section>
      </div>
    </main>
  );
}

function getTrainStatusBadgeClass(tone: TrainStatusTone) {
  if (tone === "green") return "bg-emerald-50 text-[#16A34A] ring-1 ring-emerald-100";
  if (tone === "red") return "bg-red-50 text-[#EF4444] ring-1 ring-red-100";
  return "bg-orange-50 text-[#F97316] ring-1 ring-orange-100";
}
