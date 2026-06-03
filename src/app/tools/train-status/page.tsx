"use client";

import { Check, ChevronRight, Clock3, MapPin, RotateCcw, Save, Search, TrainFront } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { BackButton } from "@/components/BackButton";
import { CollapsiblePanel } from "@/components/CollapsiblePanel";
import { RailLineBadge } from "@/components/RailLineBadge";
import { tokyoTrainStatusLines, type TrainStatusLine, type TrainStatusTone } from "@/data/trainStatus";
import { useHomeRailLines } from "@/hooks/useHomeRailLines";
import { useLanguage } from "@/hooks/useLanguage";
import { getCachedTrainStatus, warmTrainStatus } from "@/lib/appPreload";
import { mergeOdptLines, odptRefreshIntervalMs, type OdptClientLine } from "@/lib/trainStatus/odptClient";
import { syncTodayTrainIncidentRecords } from "@/lib/trainStatus/incidentRecords";
import { groupTrainStatusLines } from "@/lib/trainStatus/lineGroups";

const copy = {
  "zh-CN": {
    apiNoteFallback: "ODPT 暂时不可用，运行状态会显示为暂不可用，请出发前确认铁路公司官方信息。",
    apiNoteLive: "已接入 ODPT 运行信息，每 1 分钟自动检查一次。ODPT 未提供实时状态的线路会明确标记，出发前仍建议确认铁路公司官方信息。",
    apiNoteLoading: "正在读取 ODPT 运行信息；如果暂时失败，会显示为暂不可用。",
    back: "返回",
    detailNote: "实时数据接入后，将显示影响区间、原因和恢复预估。",
    empty: "没有找到相关线路",
    manageDescription: "选择首页上方小卡片显示的常用线路，最多 2 条。所有线路状态可在本页确认。",
    manageTitle: "首页常用线路",
    placeholder: "搜索线路、站名或延误",
    region: "东京",
    reset: "恢复默认",
    saved: "已保存到首页",
    saveSelection: "保存选择",
    selectedStatusEmpty: "还没有选择首页常用线路。",
    selectedStatusTitle: "首页常用线路现况",
    subtitle: "查询 ODPT 支持的东京及周边 JR、地下铁和私铁线路状态。",
    title: "东京交通",
    updated: "暂不可用",
    updatedByOdpt: "ODPT 检查",
  },
  "zh-TW": {
    apiNoteFallback: "ODPT 暫時不可用，運行狀態會顯示為暫不可用，出發前請確認鐵路公司官方資訊。",
    apiNoteLive: "已接入 ODPT 運行資訊，每 1 分鐘自動檢查一次。ODPT 未提供即時狀態的線路會明確標記，出發前仍建議確認鐵路公司官方資訊。",
    apiNoteLoading: "正在讀取 ODPT 運行資訊；如果暫時失敗，會顯示為暫不可用。",
    back: "返回",
    detailNote: "即時資料接入後，將顯示影響區間、原因和恢復預估。",
    empty: "沒有找到相關線路",
    manageDescription: "選擇首頁上方小卡片顯示的常用線路，最多 2 條。所有線路狀態可在本頁確認。",
    manageTitle: "首頁常用線路",
    placeholder: "搜尋線路、車站或延誤",
    region: "東京",
    reset: "恢復預設",
    saved: "已儲存到首頁",
    saveSelection: "儲存選擇",
    selectedStatusEmpty: "還沒有選擇首頁常用線路。",
    selectedStatusTitle: "首頁常用線路現況",
    subtitle: "查詢 ODPT 支援的東京及周邊 JR、地下鐵和私鐵線路狀態。",
    title: "東京交通",
    updated: "暫不可用",
    updatedByOdpt: "ODPT 檢查",
  },
  ja: {
    apiNoteFallback: "ODPT が一時的に利用できないため、運行状況は利用不可として表示されます。出発前に鉄道会社の公式情報を確認してください。",
    apiNoteLive: "ODPT の運行情報に接続済みです。1 分ごとに自動確認します。ODPT がリアルタイム情報を提供していない路線は明確に表示します。",
    apiNoteLoading: "ODPT の運行情報を読み込み中です。取得できない場合は利用不可として表示します。",
    back: "戻る",
    detailNote: "リアルタイムデータ接続後、影響区間、原因、復旧見込みを表示します。",
    empty: "該当する路線がありません",
    manageDescription: "ホーム上部の小カードに表示する常用路線を選びます。最大 2 路線です。全路線の状況はこのページで確認できます。",
    manageTitle: "ホームの常用路線",
    placeholder: "路線、駅名、遅延で検索",
    region: "東京",
    reset: "初期設定に戻す",
    saved: "ホームに保存しました",
    saveSelection: "選択を保存",
    selectedStatusEmpty: "ホーム表示用の路線がまだ選択されていません。",
    selectedStatusTitle: "ホーム常用路線の状況",
    subtitle: "ODPT が対応する東京周辺の JR、地下鉄、私鉄の運行状況を確認できます。",
    title: "東京交通",
    updated: "利用不可",
    updatedByOdpt: "ODPT 確認",
  },
} as const;

export default function TrainStatusPage() {
  const { language } = useLanguage();
  const text = copy[language];
  const { maxCount, saveSelectedRailLineIds, selectedRailLineIds } = useHomeRailLines();
  const [odptLines, setOdptLines] = useState<OdptClientLine[]>([]);
  const [odptSource, setOdptSource] = useState<"fallback" | "loading" | "odpt">("loading");
  const [query, setQuery] = useState("");
  const [draftRailLineIds, setDraftRailLineIds] = useState(selectedRailLineIds);
  const [savedMessage, setSavedMessage] = useState("");
  const lines = useMemo(() => mergeOdptLines(tokyoTrainStatusLines[language], odptLines, language), [language, odptLines]);
  const hasChanges = selectedRailLineIds.join("|") !== draftRailLineIds.join("|");
  const apiNote = odptSource === "odpt" ? text.apiNoteLive : odptSource === "loading" ? text.apiNoteLoading : text.apiNoteFallback;
  const filteredLines = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return lines;
    return lines.filter((line) => `${line.code} ${line.name} ${line.status}`.toLowerCase().includes(keyword));
  }, [lines, query]);
  const selectedHomeLines = useMemo(
    () => selectedRailLineIds.map((id) => lines.find((line) => line.id === id)).filter((line): line is TrainStatusLine => Boolean(line)),
    [lines, selectedRailLineIds],
  );
  const groupedManageLines = useMemo(() => groupTrainStatusLines(lines), [lines]);
  const groupedFilteredLines = useMemo(() => groupTrainStatusLines(filteredLines), [filteredLines]);

  useEffect(() => {
    let cancelled = false;
    const cached = getCachedTrainStatus();
    if (cached) {
      setOdptLines(cached.lines);
      setOdptSource(cached.source);
    }

    async function loadOdptStatus() {
      const result = await warmTrainStatus();
      if (result.source === "odpt") syncTodayTrainIncidentRecords(result.lines);
      if (cancelled) return;
      setOdptLines(result.lines);
      setOdptSource(result.source);
    }

    loadOdptStatus();
    const timer = window.setInterval(loadOdptStatus, odptRefreshIntervalMs);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

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
            {apiNote}
          </div>
        </section>

        <SelectedHomeRailStatusCard emptyText={text.selectedStatusEmpty} language={language} lines={selectedHomeLines} title={text.selectedStatusTitle} updatedLabel={text.updatedByOdpt} />

        <label className="mt-4 flex h-12 items-center gap-2 rounded-3xl border border-white/60 bg-white/75 px-4 shadow-sm backdrop-blur-xl">
          <Search className="h-4 w-4 shrink-0 text-[#64748B]" />
          <input className="w-full bg-transparent text-sm font-bold text-[#0F172A] outline-none placeholder:text-[#94A3B8]" onChange={(event) => setQuery(event.target.value)} placeholder={text.placeholder} value={query} />
        </label>

        <CollapsiblePanel className="mt-4 border-white/60 bg-white/75 backdrop-blur-xl" summary={`${draftRailLineIds.length}/${maxCount}`} title={text.manageTitle}>
          <div className="flex items-start justify-between gap-3">
            <p className="min-w-0 text-xs font-bold leading-5 text-[#64748B]">{text.manageDescription}</p>
            <button className="selection-chip shrink-0 rounded-full px-3 py-1.5 text-[11px] font-black" onClick={resetDraftRailLineIds} type="button">
              <RotateCcw className="mr-1 inline h-3.5 w-3.5" />
              {text.reset}
            </button>
          </div>
          <div className="mt-3 max-h-[320px] overflow-y-auto pr-1">
            <div className="grid gap-4">
              {groupedManageLines.map((group) => (
                <details className="group/rail" key={group.id} open={group.lines.some((line) => draftRailLineIds.includes(line.id))}>
                  <summary className="mb-2 flex cursor-pointer list-none items-center justify-between px-1 text-[12px] font-black text-slate-500 [&::-webkit-details-marker]:hidden">
                    <span>{group.label}</span>
                    <ChevronRight className="h-4 w-4 transition group-open/rail:rotate-90" />
                  </summary>
                  <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-100">
                    {group.lines.map((line, index) => {
                      const selected = draftRailLineIds.includes(line.id);
                      const disabled = !selected && draftRailLineIds.length >= maxCount;
                      return (
                        <button
                          className={`flex min-h-14 w-full items-center justify-between gap-3 px-4 text-left transition active:scale-[0.99] ${selected ? "bg-blue-50 text-[#1F6FFF]" : "text-slate-950"} ${disabled ? "opacity-45" : ""} ${index > 0 ? "border-t border-slate-100" : ""}`}
                          disabled={disabled}
                          key={line.id}
                          onClick={() => toggleDraftRailLineId(line.id)}
                          type="button"
                        >
                          <span className="flex min-w-0 items-center gap-3">
                            <RailLineBadge line={line} size="sm" />
                            <span className="min-w-0 break-words text-sm font-black">{line.name}</span>
                          </span>
                          {selected ? <Check className="h-4 w-4 shrink-0" /> : <ChevronRight className="h-5 w-5 shrink-0 text-slate-300" />}
                        </button>
                      );
                    })}
                  </div>
                </details>
              ))}
            </div>
          </div>
          <div className="mt-4 grid gap-2">
            <button className="jl-save-button flex h-12 items-center justify-center gap-2 rounded-2xl text-sm font-black" disabled={!hasChanges} onClick={saveDraftRailLineIds} type="button">
              <Save className="h-4 w-4" />
              {text.saveSelection}
            </button>
            {savedMessage ? (
              <p className="flex items-center justify-center gap-1 rounded-2xl bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-700 ring-1 ring-emerald-100">
                <Check className="h-3.5 w-3.5" />
                {savedMessage}
              </p>
            ) : null}
          </div>
        </CollapsiblePanel>

        <section className="mt-4 grid gap-3">
          {filteredLines.length === 0 ? (
            <div className="rounded-[28px] border border-white/60 bg-white/75 p-8 text-center text-sm font-black text-[#64748B] shadow-sm backdrop-blur-xl">{text.empty}</div>
          ) : (
            groupedFilteredLines.map((group) => (
              <details className="group/status" key={group.id} open={Boolean(query.trim()) || group.lines.some((line) => line.tone !== "green")}>
                <summary className="mb-2 flex cursor-pointer list-none items-center justify-between px-2 text-[12px] font-black text-slate-500 [&::-webkit-details-marker]:hidden">
                  <span>{group.label}</span>
                  <ChevronRight className="h-4 w-4 transition group-open/status:rotate-90" />
                </summary>
                <div className="overflow-hidden rounded-[26px] border border-white/60 bg-white/80 shadow-[0_10px_32px_rgba(37,99,235,0.08)] backdrop-blur-xl">
                  {group.lines.map((line, index) => (
                    <article className={`p-4 ${index > 0 ? "border-t border-slate-100" : ""}`} key={line.id}>
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <RailLineBadge line={line} size="md" />
                          <div className="min-w-0">
                            <h2 className="break-words text-base font-black">{line.name}</h2>
                            <p className="mt-1 flex items-center gap-1 text-xs font-bold text-[#64748B]">
                              <Clock3 className="h-3.5 w-3.5" />
                              {getTrainStatusTimeText(line, line.source === "odpt" ? text.updatedByOdpt : text.updated, language)}
                            </p>
                          </div>
                        </div>
                        <span className={`shrink-0 rounded-full px-3 py-1.5 text-[11px] font-black ${getTrainStatusBadgeClass(line)}`}>{line.status}</span>
                      </div>
                      <div className="mt-3 rounded-2xl border border-blue-100 bg-blue-50/85 px-3 py-2 text-xs font-bold leading-5 text-[#64748B] shadow-sm">{line.detail ?? text.detailNote}</div>
                    </article>
                  ))}
                </div>
              </details>
            ))
          )}
        </section>
      </div>
    </main>
  );
}

function getTrainStatusBadgeClass(line: { status: string; tone: TrainStatusTone }) {
  if (/未提供|対象外|對象外/.test(line.status)) return "bg-slate-50 text-slate-500 ring-1 ring-slate-200";
  if (line.tone === "green") return "bg-emerald-50 text-[#16A34A] ring-1 ring-emerald-100";
  if (line.tone === "red") return "bg-red-50 text-[#EF4444] ring-1 ring-red-100";
  return "bg-orange-50 text-[#F97316] ring-1 ring-orange-100";
}

function getTrainStatusTimeText(line: TrainStatusLine, updatedLabel: string, language: keyof typeof copy) {
  if (line.tone !== "green" && line.incidentStartedAt) {
    if (language === "ja") return `開始 ${line.incidentStartedAt}`;
    if (language === "zh-TW") return `開始 ${line.incidentStartedAt}`;
    return `开始 ${line.incidentStartedAt}`;
  }
  return `${updatedLabel}${line.updatedAt ? ` ${line.updatedAt}` : ""}`;
}

function SelectedHomeRailStatusCard({
  emptyText,
  language,
  lines,
  title,
  updatedLabel,
}: {
  emptyText: string;
  language: keyof typeof copy;
  lines: TrainStatusLine[];
  title: string;
  updatedLabel: string;
}) {
  return (
    <section className="mt-4 rounded-[26px] border border-white/70 bg-white/82 p-4 shadow-[0_12px_30px_rgba(37,99,235,0.08)] backdrop-blur-xl">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-black text-[#2563EB]">Home Rail</p>
          <h2 className="mt-1 text-base font-black text-[#0F172A]">{title}</h2>
        </div>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-[#2563EB] ring-1 ring-blue-100">
          <TrainFront className="h-4.5 w-4.5" />
        </span>
      </div>
      {lines.length === 0 ? (
        <p className="mt-3 rounded-2xl bg-blue-50/80 px-3 py-2 text-xs font-bold leading-5 text-[#64748B]">{emptyText}</p>
      ) : (
        <div className="mt-3 grid gap-2">
          {lines.map((line) => (
            <article className="rounded-[20px] border border-blue-100 bg-white/88 p-3 shadow-sm" key={line.id}>
              <div className="flex min-w-0 items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                  <RailLineBadge line={line} size="sm" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black text-[#0F172A]">{line.name}</p>
                    <p className="mt-0.5 truncate text-[11px] font-bold text-[#64748B]">
                      {getTrainStatusTimeText(line, updatedLabel, language)}
                    </p>
                  </div>
                </div>
                <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-black ${getTrainStatusBadgeClass(line)}`}>{line.status}</span>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
