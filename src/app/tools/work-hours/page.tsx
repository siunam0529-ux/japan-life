"use client";

import { AlertTriangle, CalendarDays, CheckCircle2, Clock3, GraduationCap, TimerReset } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { BackButton } from "@/components/BackButton";

const storageKey = "japan-life-work-hours";
const workHoursChangeEvent = "japan-life-work-hours-change";
const studentLimit = 28;
const days = [
  { key: "mon", label: "周一", jp: "月" },
  { key: "tue", label: "周二", jp: "火" },
  { key: "wed", label: "周三", jp: "水" },
  { key: "thu", label: "周四", jp: "木" },
  { key: "fri", label: "周五", jp: "金" },
  { key: "sat", label: "周六", jp: "土" },
  { key: "sun", label: "周日", jp: "日" },
];

type Hours = Record<string, string>;
type SavedWorkHours = { hours: Hours; studentLimitEnabled: boolean };
const emptyHours = days.reduce<Hours>((acc, day) => ({ ...acc, [day.key]: "" }), {});
const toNumber = (value: string) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

function parseSaved(raw: string | null): SavedWorkHours {
  if (!raw) return { hours: emptyHours, studentLimitEnabled: false };
  const parsed = JSON.parse(raw) as Partial<SavedWorkHours> | Hours;
  if ("hours" in parsed && parsed.hours && typeof parsed.hours === "object") return { hours: { ...emptyHours, ...(parsed.hours as Hours) }, studentLimitEnabled: Boolean(parsed.studentLimitEnabled) };
  return { hours: { ...emptyHours, ...(parsed as Hours) }, studentLimitEnabled: false };
}

export default function WorkHoursPage() {
  const [hours, setHours] = useState<Hours>(emptyHours);
  const [studentLimitEnabled, setStudentLimitEnabled] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const readSavedWorkHours = () => {
      try {
        const saved = parseSaved(window.localStorage.getItem(storageKey));
        setHours(saved.hours);
        setStudentLimitEnabled(saved.studentLimitEnabled);
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
    window.localStorage.setItem(storageKey, JSON.stringify({ hours, studentLimitEnabled }));
    window.dispatchEvent(new Event(workHoursChangeEvent));
  }, [hours, hydrated, studentLimitEnabled]);

  const total = useMemo(() => days.reduce((sum, day) => sum + toNumber(hours[day.key]), 0), [hours]);
  const remaining = studentLimit - total;
  const progress = studentLimitEnabled ? Math.min((total / studentLimit) * 100, 100) : Math.min((total / 40) * 100, 100);
  const risk = studentLimitEnabled && total > studentLimit;
  const caution = studentLimitEnabled && total >= 24 && total <= studentLimit;

  return (
    <main className="min-h-screen bg-[#f5f0e7] text-stone-950">
      <div className="mx-auto min-h-screen max-w-[430px] bg-[#fbf8f2] px-4 py-5 shadow-2xl shadow-stone-300/40">
        <div className="mb-4 flex items-center justify-between">
          <BackButton />
          <span className="rounded-full bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-800">Japan Life</span>
        </div>

        <section className="rounded-[24px] bg-emerald-800 p-5 text-white shadow-[0_16px_35px_rgba(20,108,92,0.22)]">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/85 text-[#2563EB] shadow-sm">
              <Clock3 className="h-5 w-5" />
            </span>
            <h1 className="text-2xl font-black">打工时间记录</h1>
          </div>
          <p className="mt-2 text-xs font-bold leading-5 text-emerald-50">小输入框记录每天工时，留学生可打开 28 小时提醒。</p>
        </section>

        <section className="mt-4 grid gap-4">
          <div className="rounded-[20px] border border-stone-200 bg-white p-3 shadow-sm">
            <div className="mb-3 flex items-center justify-between rounded-xl bg-stone-50 p-3">
              <div className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-emerald-800" />
                <div>
                  <p className="text-sm font-black">留学生 28 小时限制</p>
                  <p className="text-xs font-bold text-stone-500">打开后首页显示剩余时间</p>
                </div>
              </div>
              <button aria-pressed={studentLimitEnabled} className={`relative h-7 w-12 rounded-full ${studentLimitEnabled ? "bg-emerald-700" : "bg-stone-300"}`} onClick={() => setStudentLimitEnabled((value) => !value)} type="button">
                <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition ${studentLimitEnabled ? "left-6" : "left-1"}`} />
              </button>
            </div>

            <div className="grid gap-2">
              {days.map((day) => (
                <label className="grid grid-cols-[1fr_96px] items-center gap-2 rounded-xl bg-stone-50 px-3 py-2" key={day.key}>
                  <span>
                    <span className="block text-sm font-black">{day.label}</span>
                    <span className="text-xs font-bold text-stone-500">{day.jp}</span>
                  </span>
                  <span className="flex h-9 items-center rounded-xl border border-stone-200 bg-white px-2.5">
                    <input className="min-w-0 flex-1 bg-transparent text-right text-sm font-black outline-none" inputMode="decimal" min="0" onChange={(event) => setHours((current) => ({ ...current, [day.key]: event.target.value }))} placeholder="0" step="0.5" type="number" value={hours[day.key]} />
                    <span className="ml-1 text-xs font-black text-stone-500">h</span>
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="grid gap-3">
            <div className="rounded-[22px] border border-stone-200 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-black text-stone-500">本周总工时</p>
                  <p className="mt-1 text-4xl font-black text-emerald-800">{total.toFixed(1)} h</p>
                  {studentLimitEnabled && <p className={`mt-1 text-xs font-black ${remaining >= 0 ? "text-emerald-700" : "text-red-600"}`}>{remaining >= 0 ? `距离 28 小时还剩 ${remaining.toFixed(1)} h` : `已超过 28 小时 ${Math.abs(remaining).toFixed(1)} h`}</p>}
                </div>
                <CalendarDays className="h-8 w-8 text-emerald-800" />
              </div>
              <div className="mt-4 h-3 overflow-hidden rounded-full bg-emerald-100">
                <div className={`h-full rounded-full ${risk ? "bg-red-500" : caution ? "bg-amber-500" : "bg-emerald-700"}`} style={{ width: `${progress}%` }} />
              </div>
            </div>

            <div className={`rounded-[18px] border p-3 text-sm font-bold ${risk ? "border-red-100 bg-red-50 text-red-700" : caution ? "border-amber-100 bg-amber-50 text-amber-800" : "border-emerald-100 bg-emerald-50 text-emerald-800"}`}>
              <div className="flex items-start gap-2">
                {risk || caution ? <AlertTriangle className="mt-0.5 h-4 w-4" /> : <CheckCircle2 className="mt-0.5 h-4 w-4" />}
                {studentLimitEnabled ? (risk ? "超过 28 小时，请调整排班。" : caution ? "接近 28 小时，注意本周排班。" : "目前安全。") : "普通工时记录模式，未开启留学生限制。"}
              </div>
            </div>

            <button className="inline-flex w-fit items-center gap-2 rounded-xl bg-stone-100 px-3 py-2 text-xs font-black text-stone-600" onClick={() => { setHours(emptyHours); setStudentLimitEnabled(false); }} type="button">
              <TimerReset className="h-4 w-4" />
              清空
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}
