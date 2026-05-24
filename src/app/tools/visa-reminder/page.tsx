"use client";

import { Bell, FileClock, RotateCcw, X } from "lucide-react";
import { useMemo, useState, useSyncExternalStore } from "react";
import { BackButton } from "@/components/BackButton";
import { useLanguage } from "@/hooks/useLanguage";
import { useMounted } from "@/hooks/useMounted";
import { getTokyoDateString } from "@/lib/api/holidays";
import { emptyVisaReminderState, readVisaReminderState, visaReminderEvent, visaReminderStorageKey, visaReminderDays, type VisaReminderState } from "@/lib/reminders";

let cachedReminderRaw = "";
let cachedReminderState: VisaReminderState = emptyVisaReminderState;

const copy = {
  "zh-CN": {
    title: "在留提醒",
    subtitle: "输入自己的在留期限，系统会在 90 日、60 日、30 日、10 日前提醒。",
    expiry: "在留到期时间",
    save: "保存提醒",
    reset: "重置",
    closed: "已关闭",
    noDate: "还没有设置在留期限",
    expired: "在留期限已过，请尽快确认入管手续。",
    left: "距离在留到期还有",
    days: "天",
    quiet: "当前没有需要提醒的节点。",
    close: "关闭本次提醒",
    reference: "提醒只保存在本地，签证和在留手续请以入管官方信息为准。",
  },
  "zh-TW": {
    title: "在留提醒",
    subtitle: "輸入自己的在留期限，系統會在 90 日、60 日、30 日、10 日前提醒。",
    expiry: "在留到期時間",
    save: "儲存提醒",
    reset: "重置",
    closed: "已關閉",
    noDate: "尚未設定在留期限",
    expired: "在留期限已過，請盡快確認入管手續。",
    left: "距離在留到期還有",
    days: "天",
    quiet: "目前沒有需要提醒的節點。",
    close: "關閉本次提醒",
    reference: "提醒只會保存在本機，簽證和在留手續請以入管官方資訊為準。",
  },
  ja: {
    title: "在留期限リマインダー",
    subtitle: "在留期限を入力すると、90日・60日・30日・10日前に確認できます。",
    expiry: "在留期限",
    save: "保存する",
    reset: "リセット",
    closed: "閉じました",
    noDate: "在留期限がまだ設定されていません",
    expired: "在留期限を過ぎています。入管手続きを確認してください。",
    left: "在留期限まであと",
    days: "日",
    quiet: "今は通知対象のタイミングではありません。",
    close: "この通知を閉じる",
    reference: "通知は端末内に保存されます。ビザ・在留手続きは必ず入管の公式情報をご確認ください。",
  },
} as const;
function daysUntil(expiryDate: string, today: string) {
  const end = new Date(`${expiryDate}T00:00:00+09:00`).getTime();
  const start = new Date(`${today}T00:00:00+09:00`).getTime();
  if (!Number.isFinite(end) || !Number.isFinite(start)) return null;
  return Math.ceil((end - start) / 86400000);
}

function readReminderState(): VisaReminderState {
  if (typeof window === "undefined") return emptyVisaReminderState;
  try {
    const raw = window.localStorage.getItem(visaReminderStorageKey);
    if (!raw) {
      cachedReminderRaw = "";
      cachedReminderState = emptyVisaReminderState;
      return cachedReminderState;
    }
    if (raw === cachedReminderRaw) return cachedReminderState;
    cachedReminderRaw = raw;
    cachedReminderState = readVisaReminderState();
    return cachedReminderState;
  } catch {
    return emptyVisaReminderState;
  }
}

export default function VisaReminderPage() {
  const { language } = useLanguage();
  const mounted = useMounted();
  const text = copy[language];
  const savedState = useSyncExternalStore(
    (onStoreChange) => {
      window.addEventListener("storage", onStoreChange);
      window.addEventListener(visaReminderEvent, onStoreChange);

      return () => {
        window.removeEventListener("storage", onStoreChange);
        window.removeEventListener(visaReminderEvent, onStoreChange);
      };
    },
    readReminderState,
    () => emptyVisaReminderState,
  );
  const [draftExpiryDate, setDraftExpiryDate] = useState("");
  const expiryDate = draftExpiryDate || savedState.expiryDate;
  const dismissed = savedState.dismissed;
  const today = mounted ? getTokyoDateString() : "2026-05-21";

  const remainingDays = useMemo(() => (expiryDate ? daysUntil(expiryDate, today) : null), [expiryDate, today]);
  const activeReminder = typeof remainingDays === "number" ? visaReminderDays.find((day) => remainingDays <= day && remainingDays >= 0 && !dismissed.includes(day)) : undefined;

  const persist = (next: VisaReminderState) => {
    setDraftExpiryDate(next.expiryDate);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(visaReminderStorageKey, JSON.stringify(next));
      window.dispatchEvent(new Event(visaReminderEvent));
    }
  };

  const save = () => {
    persist({ expiryDate, dismissed: [] });
  };

  const closeReminder = (day: number) => {
    persist({ expiryDate, dismissed: Array.from(new Set([...dismissed, day])) });
  };

  const reset = () => {
    persist({ expiryDate: "", dismissed: [] });
  };

  return (
    <main className="min-h-screen bg-[#f5f0e7] text-stone-950">
      <div className="mx-auto min-h-screen max-w-[430px] bg-[#fbf8f2] px-4 py-5 shadow-2xl shadow-stone-300/40">
        <div className="mb-4 flex items-center justify-between">
          <BackButton variant="icon" />
          <span className="rounded-full bg-emerald-50 px-4 py-2 text-xs font-black text-emerald-800">Japan Life</span>
        </div>

        <section className="jl-info-card rounded-[28px] p-5">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/85 text-[#2563EB] shadow-sm">
              <FileClock className="h-5 w-5" />
            </span>
            <h1 className="text-2xl font-black text-[#0F172A]">{text.title}</h1>
          </div>
          <p className="mt-2 text-sm font-semibold leading-6 text-[#64748B]">{text.subtitle}</p>
        </section>

        <section className="mt-4 rounded-[22px] border border-stone-200 bg-white p-4 shadow-[0_10px_24px_rgba(32,38,34,0.07)]">
          <label className="text-xs font-black text-stone-500">{text.expiry}</label>
          <input
            className="mt-2 h-11 w-full rounded-2xl border border-stone-200 bg-stone-50 px-3 text-sm font-black outline-none focus:border-emerald-700"
            onChange={(event) => setDraftExpiryDate(event.target.value)}
            type="date"
            value={expiryDate}
          />
          <div className="mt-3 grid grid-cols-[1fr_auto] gap-2">
            <button className="rounded-2xl bg-emerald-800 px-4 py-3 text-sm font-black text-white" onClick={save} type="button">
              {text.save}
            </button>
            <button className="rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm font-black text-stone-700" onClick={reset} type="button">
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>
        </section>

        <section className="mt-4 rounded-[22px] border border-stone-200 bg-white p-4 shadow-[0_10px_24px_rgba(32,38,34,0.07)]">
          {!expiryDate && <p className="text-sm font-black text-stone-600">{text.noDate}</p>}
          {typeof remainingDays === "number" && remainingDays < 0 && <p className="rounded-2xl bg-red-50 p-3 text-sm font-black text-red-700">{text.expired}</p>}
          {typeof remainingDays === "number" && remainingDays >= 0 && (
            <>
              <p className="text-sm font-black text-stone-500">{text.left}</p>
              <p className="mt-1 text-4xl font-black text-emerald-800">{remainingDays}<span className="ml-1 text-base text-stone-500">{text.days}</span></p>
              <div className="mt-4 grid gap-2">
                {visaReminderDays.map((day) => {
                  const reached = remainingDays <= day;
                  const isClosed = dismissed.includes(day);
                  return (
                    <div className={`flex items-center justify-between rounded-2xl p-3 ${reached && !isClosed ? "bg-amber-50 text-amber-800" : "bg-stone-50 text-stone-500"}`} key={day}>
                      <div className="flex items-center gap-2">
                        <span className={`flex h-8 w-8 flex-col items-center justify-center rounded-xl ${reached && !isClosed ? "bg-white text-amber-800" : "bg-white text-stone-500"}`}>
                          <span className="text-[13px] font-black leading-none">{day}</span>
                          <span className="text-[6px] font-black uppercase leading-none opacity-70">days</span>
                        </span>
                        <span className="text-sm font-black">{day} {text.days}</span>
                      </div>
                      {reached && !isClosed ? (
                        <button className="flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-black" onClick={() => closeReminder(day)} type="button">
                          <X className="h-3.5 w-3.5" /> {text.close}
                        </button>
                      ) : (
                        <span className="text-xs font-black">{isClosed ? text.closed : "-"}</span>
                      )}
                    </div>
                  );
                })}
              </div>
              {!activeReminder && <p className="mt-3 text-xs font-bold text-stone-500">{text.quiet}</p>}
            </>
          )}
        </section>

        <p className="mt-4 rounded-2xl bg-emerald-50 p-3 text-xs font-bold leading-5 text-emerald-900">{text.reference}</p>
      </div>
    </main>
  );
}
