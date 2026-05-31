"use client";

import { AlertTriangle, CalendarDays, CheckCircle2, Clock3, GraduationCap, TimerReset } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BackButton } from "@/components/BackButton";
import { useLanguage } from "@/hooks/useLanguage";

const storageKey = "japan-life-work-hours";
const workHoursChangeEvent = "japan-life-work-hours-change";
const studentLimit = 28;
const days = [
  { key: "mon", label: { "zh-CN": "周一", "zh-TW": "週一", ja: "月曜日" }, jp: "月" },
  { key: "tue", label: { "zh-CN": "周二", "zh-TW": "週二", ja: "火曜日" }, jp: "火" },
  { key: "wed", label: { "zh-CN": "周三", "zh-TW": "週三", ja: "水曜日" }, jp: "水" },
  { key: "thu", label: { "zh-CN": "周四", "zh-TW": "週四", ja: "木曜日" }, jp: "木" },
  { key: "fri", label: { "zh-CN": "周五", "zh-TW": "週五", ja: "金曜日" }, jp: "金" },
  { key: "sat", label: { "zh-CN": "周六", "zh-TW": "週六", ja: "土曜日" }, jp: "土" },
  { key: "sun", label: { "zh-CN": "周日", "zh-TW": "週日", ja: "日曜日" }, jp: "日" },
];

const workHoursCopy = {
  "zh-CN": {
    title: "打工时间记录",
    subtitle: "小输入框记录每天工时，留学生可打开 28 小时提醒。",
    total: "本周总工时",
    remaining: (value: string) => `距离 28 小时还剩 ${value} h`,
    over: (value: string) => `已超过 28 小时 ${value} h`,
    studentLimit: "留学生 28 小时限制",
    studentHint: "打开后首页显示剩余时间",
    saved: "已保存",
    risk: "超过 28 小时，请调整排班。",
    caution: "接近 28 小时，注意本周排班。",
    safe: "目前安全。",
    normal: "普通工时记录模式，未开启留学生限制。",
    save: "保存",
    clear: "清空",
  },
  "zh-TW": {
    title: "打工時間記錄",
    subtitle: "用小輸入框記錄每天工時，留學生可開啟 28 小時提醒。",
    total: "本週總工時",
    remaining: (value: string) => `距離 28 小時還剩 ${value} h`,
    over: (value: string) => `已超過 28 小時 ${value} h`,
    studentLimit: "留學生 28 小時限制",
    studentHint: "開啟後首頁會顯示剩餘時間",
    saved: "已儲存",
    risk: "超過 28 小時，請調整排班。",
    caution: "接近 28 小時，注意本週排班。",
    safe: "目前安全。",
    normal: "一般工時記錄模式，未開啟留學生限制。",
    save: "儲存",
    clear: "清空",
  },
  ja: {
    title: "勤務時間記録",
    subtitle: "毎日の勤務時間を入力できます。留学生は28時間リマインドをオンにできます。",
    total: "今週の合計勤務時間",
    remaining: (value: string) => `28時間まで残り ${value} h`,
    over: (value: string) => `28時間を ${value} h 超えています`,
    studentLimit: "留学生 28時間制限",
    studentHint: "オンにするとホームに残り時間を表示します",
    saved: "保存しました",
    risk: "28時間を超えています。シフトを調整してください。",
    caution: "28時間に近づいています。今週のシフトに注意してください。",
    safe: "現在は範囲内です。",
    normal: "通常の勤務時間記録モードです。留学生制限はオフです。",
    save: "保存",
    clear: "クリア",
  },
} as const;

type Hours = Record<string, string>;
type SavedWorkHours = { hours: Hours; studentLimitEnabled: boolean };
const emptyHours = days.reduce<Hours>((acc, day) => ({ ...acc, [day.key]: "" }), {});
const toNumber = (value: string) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

function serializeWorkHours(value: SavedWorkHours) {
  return JSON.stringify(value);
}

function parseSaved(raw: string | null): SavedWorkHours {
  if (!raw) return { hours: emptyHours, studentLimitEnabled: false };
  const parsed = JSON.parse(raw) as Partial<SavedWorkHours> | Hours;
  if ("hours" in parsed && parsed.hours && typeof parsed.hours === "object") return { hours: { ...emptyHours, ...(parsed.hours as Hours) }, studentLimitEnabled: Boolean(parsed.studentLimitEnabled) };
  return { hours: { ...emptyHours, ...(parsed as Hours) }, studentLimitEnabled: false };
}

export default function WorkHoursPage() {
  const { language } = useLanguage();
  const text = workHoursCopy[language];
  const [hours, setHours] = useState<Hours>(emptyHours);
  const [studentLimitEnabled, setStudentLimitEnabled] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [savedNotice, setSavedNotice] = useState("");
  const snapshotRef = useRef("");

  useEffect(() => {
    const readSavedWorkHours = () => {
      try {
        const raw = window.localStorage.getItem(storageKey);
        const saved = parseSaved(raw);
        const snapshot = serializeWorkHours(saved);
        if (snapshotRef.current !== snapshot) {
          snapshotRef.current = snapshot;
          setHours(saved.hours);
          setStudentLimitEnabled(saved.studentLimitEnabled);
        }
      } finally {
        setHydrated(true);
      }
    };

    readSavedWorkHours();
    window.addEventListener("storage", readSavedWorkHours);
    window.addEventListener(workHoursChangeEvent, readSavedWorkHours);
    return () => {
      window.removeEventListener("storage", readSavedWorkHours);
      window.removeEventListener(workHoursChangeEvent, readSavedWorkHours);
    };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const snapshot = serializeWorkHours({ hours, studentLimitEnabled });
    if (snapshotRef.current === snapshot) return;
    snapshotRef.current = snapshot;
    window.localStorage.setItem(storageKey, snapshot);
    window.dispatchEvent(new Event(workHoursChangeEvent));
  }, [hours, hydrated, studentLimitEnabled]);

  const total = useMemo(() => days.reduce((sum, day) => sum + toNumber(hours[day.key]), 0), [hours]);
  const remaining = studentLimit - total;
  const progress = studentLimitEnabled ? Math.min((total / studentLimit) * 100, 100) : Math.min((total / 40) * 100, 100);
  const risk = studentLimitEnabled && total > studentLimit;
  const caution = studentLimitEnabled && total >= 24 && total <= studentLimit;
  const setDayHours = useCallback((key: string, value: string) => {
    const next = value.replace(/[^\d.]/g, "").replace(/(\..*)\./g, "$1");
    setHours((current) => ({ ...current, [key]: next }));
  }, []);
  const saveWorkHours = useCallback(() => {
    const snapshot = serializeWorkHours({ hours, studentLimitEnabled });
    snapshotRef.current = snapshot;
    window.localStorage.setItem(storageKey, snapshot);
    window.dispatchEvent(new Event(workHoursChangeEvent));
    setSavedNotice(text.saved);
    window.setTimeout(() => setSavedNotice(""), 1600);
  }, [hours, studentLimitEnabled, text.saved]);

  return (
    <main className="jl-tool-theme min-h-screen text-stone-950">
      <div className="jl-tool-shell mx-auto min-h-screen max-w-[430px] px-4 py-5">
        <div className="mb-4 flex items-center justify-between">
          <BackButton />
          <span className="rounded-full bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-800">Japan Life</span>
        </div>

        <section className="jl-info-card rounded-[24px] p-5">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/85 text-[#2563EB] shadow-sm">
              <Clock3 className="h-5 w-5" />
            </span>
            <h1 className="text-2xl font-black text-[#0F172A]">{text.title}</h1>
          </div>
          <p className="mt-2 text-xs font-bold leading-5 text-[#64748B]">{text.subtitle}</p>
        </section>

        <section className="mt-4 grid gap-4">
          <div className="rounded-[22px] border border-stone-200 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-black text-stone-500">{text.total}</p>
                <p className="mt-1 text-4xl font-black text-emerald-800">{total.toFixed(1)} h</p>
                {studentLimitEnabled && <p className={`mt-1 text-xs font-black ${remaining >= 0 ? "text-emerald-700" : "text-red-600"}`}>{remaining >= 0 ? text.remaining(remaining.toFixed(1)) : text.over(Math.abs(remaining).toFixed(1))}</p>}
              </div>
              <CalendarDays className="h-8 w-8 text-emerald-800" />
            </div>
            <div className="mt-4 h-3 overflow-hidden rounded-full bg-emerald-100">
              <div className={`h-full rounded-full ${risk ? "bg-red-500" : caution ? "bg-amber-500" : "bg-emerald-700"}`} style={{ width: `${progress}%` }} />
            </div>
          </div>

          <div className="rounded-[20px] border border-stone-200 bg-white p-3 shadow-sm">
            <div className="mb-3 flex items-center justify-between rounded-xl bg-stone-50 p-3">
              <div className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-emerald-800" />
                <div>
                  <p className="text-sm font-black">{text.studentLimit}</p>
                  <p className="text-xs font-bold text-stone-500">{text.studentHint}</p>
                </div>
              </div>
              <button aria-pressed={studentLimitEnabled} className={`relative h-7 w-12 rounded-full ${studentLimitEnabled ? "bg-emerald-700" : "bg-stone-300"}`} onClick={() => setStudentLimitEnabled((value) => !value)} type="button">
                <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition ${studentLimitEnabled ? "left-6" : "left-1"}`} />
              </button>
            </div>

            <div className="grid gap-2">
              {days.map((day) => (
                <label className="grid grid-cols-[1fr_92px] items-center gap-3 rounded-2xl border border-slate-200 bg-[#F8FAFC] px-3 py-3 shadow-sm" key={day.key}>
                  <span>
                    <span className="block text-sm font-black">{day.label[language]}</span>
                    <span className="text-xs font-bold text-stone-500">{day.jp}</span>
                  </span>
                  <span className="work-hour-field flex h-10 items-center rounded-2xl border border-slate-200 bg-white px-3 shadow-sm">
                    <input className="work-hour-input min-w-0 flex-1 bg-transparent text-right text-sm font-black text-[#0F172A] outline-none" inputMode="decimal" min="0" onChange={(event) => setDayHours(day.key, event.target.value)} placeholder="0" step="0.5" type="number" value={hours[day.key]} />
                    <span className="ml-1 text-xs font-black text-[#64748B]">h</span>
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="grid gap-3">
            <div className={`rounded-[18px] border p-3 text-sm font-bold ${risk ? "border-red-100 bg-red-50 text-red-700" : caution ? "border-amber-100 bg-amber-50 text-amber-800" : "border-emerald-100 bg-emerald-50 text-emerald-800"}`}>
              <div className="flex items-start gap-2">
                {risk || caution ? <AlertTriangle className="mt-0.5 h-4 w-4" /> : <CheckCircle2 className="mt-0.5 h-4 w-4" />}
                {studentLimitEnabled ? (risk ? text.risk : caution ? text.caution : text.safe) : text.normal}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button className="jl-save-button flex h-11 items-center justify-center gap-2 rounded-2xl text-sm font-black" onClick={saveWorkHours} type="button">
                <CheckCircle2 className="h-4 w-4" />
                {text.save}
              </button>
              <button className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 text-sm font-black text-slate-700 shadow-sm" onClick={() => { setHours(emptyHours); setStudentLimitEnabled(false); }} type="button">
                <TimerReset className="h-4 w-4" />
                {text.clear}
              </button>
            </div>
            {savedNotice && <p className="rounded-2xl border border-blue-100 bg-blue-50 px-3 py-2 text-center text-xs font-black text-[#1D4ED8]">{savedNotice}</p>}
          </div>
        </section>
      </div>
    </main>
  );
}
