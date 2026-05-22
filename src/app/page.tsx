"use client";

import { CalendarDays, ChevronRight, Compass, GitCompare } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import { DashboardCard } from "@/components/DashboardCard";
import { PlaceCard } from "@/components/PlaceCard";
import { SectionHeader } from "@/components/SectionHeader";
import { ToolCard } from "@/components/ToolCard";
import { WeatherCard } from "@/components/WeatherCard";
import { placeItems } from "@/data/places";
import { dashboardTools } from "@/data/tools";
import { useLanguage } from "@/hooks/useLanguage";
import { useMounted } from "@/hooks/useMounted";
import { useReminders } from "@/hooks/useReminders";
import { useUserSettings } from "@/hooks/useUserSettings";
import { fetchExchangeRates, getMockExchangeRates, type ExchangeRateItem } from "@/lib/api/exchange";
import { daysUntilTokyo, fetchJapaneseHolidays, getMockNationalHolidays, getNextHoliday, getTokyoDateString } from "@/lib/api/holidays";
import { diffDays, readVisaReminderState, visaReminderEvent } from "@/lib/reminders";
import { formatDate } from "@/lib/utils/format";
import type { HolidayItem } from "@/data/holidays";
import type { ReminderItem, ReminderType } from "@/types/reminder";

type WorkHoursState = {
  hours: Record<string, string>;
  studentLimitEnabled: boolean;
};

const workHoursStorageKey = "japan-life-work-hours";
const workHourDayKeys = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
const stableTodayString = "2026-05-21";
const dashboardLabels = {
  "zh-CN": {
    add: "添加",
    allTools: "全部工具",
    backup: "备用",
    employee: "正社员",
    nextHoliday: "下一个假期",
    partTime: "兼职",
    shops: "推荐店铺",
    takehome: "本月预计到手",
    upcomingPlans: "之后提醒",
    todayPlans: "今日安排",
    todayRate: "今日汇率",
    upcomingPayments: "即将缴费",
    tools: "常用工具",
    workHours: "本周工时",
  },
  "zh-TW": {
    add: "新增",
    allTools: "全部工具",
    backup: "備用",
    employee: "正社員",
    nextHoliday: "下一個假期",
    partTime: "兼職",
    shops: "推薦店鋪",
    takehome: "本月預計到手",
    upcomingPlans: "之後提醒",
    todayPlans: "今日安排",
    todayRate: "今日匯率",
    upcomingPayments: "即將繳費",
    tools: "常用工具",
    workHours: "本週工時",
  },
  ja: {
    add: "追加",
    allTools: "すべて",
    backup: "予備",
    employee: "正社員",
    nextHoliday: "次の祝日",
    partTime: "アルバイト",
    shops: "おすすめ店舗",
    takehome: "今月の手取り目安",
    upcomingPlans: "今後の通知",
    todayPlans: "今日の予定",
    todayRate: "今日の為替",
    upcomingPayments: "近日の支払い",
    tools: "よく使う機能",
    workHours: "今週の勤務時間",
  },
} as const;
const todayPlanEmpty = {
  "zh-CN": "今天还没有安排",
  "zh-TW": "今天還沒有安排",
  ja: "今日の予定はありません",
} as const;
const upcomingPlanEmpty = {
  "zh-CN": "之后还没有提醒",
  "zh-TW": "之後還沒有提醒",
  ja: "今後の通知はありません",
} as const;
const homeTools = dashboardTools.filter((tool) => tool.key !== "workHours" && tool.key !== "areaCompare").slice(0, 8);
const viewAllRemindersLabel = {
  "zh-CN": "查看全部 →",
  "zh-TW": "查看全部 →",
  ja: "すべて見る →",
} as const;
const reminderTypePriority: Record<ReminderType, number> = { garbage: 0, monthlyPayment: 1, holiday: 2, residenceCard: 3, custom: 4 };

function sparklinePoints(values: number[]) {
  if (values.length === 0) return "";
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  return values
    .map((value, index) => {
      const x = values.length === 1 ? 63 : (index / (values.length - 1)) * 62 + 1;
      const y = 24 - ((value - min) / range) * 20;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}

function readWorkHours(raw: string | null) {
  if (!raw) return { total: 0, studentLimitEnabled: false };
  const parsed = JSON.parse(raw) as Partial<WorkHoursState> | Record<string, string>;
  const hasNewShape = "hours" in parsed && typeof parsed.hours === "object" && parsed.hours !== null;
  const hours = (hasNewShape ? parsed.hours : parsed) as Record<string, string>;
  const total = workHourDayKeys.reduce((sum, key) => {
    const value = Number(hours[key] ?? 0);
    return sum + (Number.isFinite(value) ? value : 0);
  }, 0);
  return {
    total,
    studentLimitEnabled: "studentLimitEnabled" in parsed ? Boolean(parsed.studentLimitEnabled) : false,
  };
}

function sortHomeReminders(reminders: ReminderItem[], today: string) {
  return [...reminders].sort((a, b) => {
    const priorityDiff = reminderTypePriority[a.type] - reminderTypePriority[b.type];
    if (priorityDiff !== 0) return priorityDiff;
    const dayDiff = diffDays(today, a.date) - diffDays(today, b.date);
    if (dayDiff !== 0) return dayDiff;
    return (a.time ?? "").localeCompare(b.time ?? "");
  });
}

function toHomeReminderItem(reminder: ReminderItem, today: string) {
  return {
    key: reminder.id,
    className: getHomeReminderClassName(reminder.type),
    href: reminder.targetUrl ?? "/tools/holidays",
    text: shortenHomeReminderText(reminder, today),
  };
}

function shortenHomeReminderText(reminder: ReminderItem, today: string) {
  const diff = diffDays(today, reminder.date);
  if (reminder.type === "monthlyPayment") {
    if (diff === 0) return reminder.title;
    return `${reminder.title.replace(/缴费日|繳費日|支払い日/g, "")}${formatDaysLater(diff)}`;
  }
  if (reminder.type === "residenceCard" && diff > 0) {
    return `${reminder.title} · ${formatDaysLater(diff)}`;
  }
  if (reminder.type === "holiday" && diff > 1) {
    return `${reminder.title} · ${formatDaysLater(diff)}`;
  }
  return reminder.title;
}

function formatDaysLater(diff: number) {
  if (diff <= 0) return "";
  return `${diff}天后`;
}

function getVisaCountdownLabel(days: number | null) {
  if (typeof days !== "number") return null;
  if (days < 0) return "!";
  if (days > 90) return "90+";
  return String(days);
}

function getHomeReminderClassName(type: ReminderType) {
  if (type === "garbage") return "bg-amber-50 text-amber-800";
  if (type === "monthlyPayment") return "bg-sky-50 text-sky-800";
  if (type === "holiday") return "bg-rose-50 text-rose-700";
  if (type === "residenceCard") return "bg-violet-50 text-violet-700";
  return "bg-emerald-50 text-emerald-800";
}

function useDashboardLocalData() {
  const mounted = useMounted();
  const [workHours, setWorkHours] = useState({ total: 0, studentLimitEnabled: false });
  const [visaExpiryDate, setVisaExpiryDate] = useState("");
  const [rateItems, setRateItems] = useState<ExchangeRateItem[]>(() => getMockExchangeRates().items);
  const [rateSource, setRateSource] = useState<"frankfurter" | "mock">("mock");
  const [rateUpdatedAt, setRateUpdatedAt] = useState("2026-05-21");
  const [holidayItems, setHolidayItems] = useState<HolidayItem[]>(() => getMockNationalHolidays());
  const [holidaySource, setHolidaySource] = useState<"holidays-jp" | "mock">("mock");
  const todayString = mounted ? getTokyoDateString() : stableTodayString;

  useEffect(() => {
    if (!mounted) return;

    const read = () => {
      try {
        setWorkHours(readWorkHours(window.localStorage.getItem(workHoursStorageKey)));
        setVisaExpiryDate(readVisaReminderState().expiryDate);
      } catch {
        setWorkHours({ total: 0, studentLimitEnabled: false });
        setVisaExpiryDate("");
      }
    };

    read();
    fetchExchangeRates().then((result) => {
      setRateItems(result.items);
      setRateSource(result.source);
      setRateUpdatedAt(result.updatedAt);
    });
    fetchJapaneseHolidays().then((result) => {
      setHolidayItems(result.items);
      setHolidaySource(result.source);
    });
    window.addEventListener("storage", read);
    window.addEventListener(visaReminderEvent, read);
    window.addEventListener("focus", read);
    return () => {
      window.removeEventListener("storage", read);
      window.removeEventListener(visaReminderEvent, read);
      window.removeEventListener("focus", read);
    };
  }, [mounted]);

  return { rateItems, rateSource, rateUpdatedAt, workHours, holidayItems, holidaySource, todayString, visaExpiryDate };
}

export default function HomePage() {
  const { language, t } = useLanguage();
  const labels = dashboardLabels[language];
  const { loaded, settings } = useUserSettings();
  const { activeReminders, todayReminders } = useReminders();
  const { rateItems, rateSource, rateUpdatedAt, workHours, holidayItems, holidaySource, todayString, visaExpiryDate } = useDashboardLocalData();

  const onboardingDone = Boolean(settings?.onboardingCompleted);
  const preferredCurrency = settings?.defaultCurrency ?? settings?.currency ?? "CNY";
  const preferredRates = useMemo(() => {
    const order = preferredCurrency === "TWD" ? ["TWD", "USD", "CNY", "HKD", "JPY"] : [preferredCurrency, "USD", "CNY", "HKD", "TWD", "JPY"];
    return [...rateItems].sort((a, b) => order.indexOf(a.code) - order.indexOf(b.code));
  }, [preferredCurrency, rateItems]);

  const nextHoliday = useMemo(() => {
    return getNextHoliday(holidayItems, todayString);
  }, [holidayItems, todayString]);
  const nextHolidayDays = nextHoliday ? daysUntilTokyo(nextHoliday.date, todayString) : 0;
  const upcomingReminders = activeReminders.filter((reminder) => reminder.date > todayString);
  const todayPlanItems = sortHomeReminders(todayReminders, todayString).slice(0, 2).map((reminder) => toHomeReminderItem(reminder, todayString));
  const upcomingPlanItems = sortHomeReminders(upcomingReminders, todayString).slice(0, 2).map((reminder) => toHomeReminderItem(reminder, todayString));
  const visaRemainingDays = visaExpiryDate ? diffDays(todayString, visaExpiryDate) : null;
  const visaCountdownLabel = getVisaCountdownLabel(visaRemainingDays);
  const studentRemaining = 28 - workHours.total;

  return (
    <main className="min-h-screen bg-[#f5f0e7] text-stone-950">
      <div className="mx-auto min-h-screen max-w-[430px] bg-[#fbf8f2] px-4 pb-4 pt-4 shadow-2xl shadow-stone-300/40">
        <AppHeader />

        {loaded && !onboardingDone && (
          <Link href="/onboarding" className="mt-4 block rounded-[18px] border border-emerald-100 bg-emerald-50 p-4 text-emerald-900 shadow-[0_8px_22px_rgba(32,38,34,0.05)]">
            <p className="text-sm font-black">{t.home.settingsCardTitle}</p>
            <p className="mt-1 text-xs font-bold leading-5">{t.home.settingsCardText}</p>
          </Link>
        )}

        <section className="mt-4 grid grid-cols-1 gap-2.5 min-[390px]:grid-cols-[1.08fr_0.92fr]">
          <DashboardCard className="row-span-3">
            <div className="mb-1.5 flex items-center justify-between">
              <h2 className="text-[13px] font-black leading-tight">{labels.todayRate}</h2>
              <span className="text-[10px] font-bold text-stone-400">{rateSource === "frankfurter" ? rateUpdatedAt : labels.backup}</span>
            </div>
            <div className="divide-y divide-stone-100">
              {preferredRates.filter((rate) => rate.code !== "JPY").slice(0, 4).map((rate) => (
                <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 py-2.5" key={rate.pair}>
                  <div>
                    <p className="text-[11px] font-bold text-stone-500">{rate.pair}</p>
                    <p className="text-[20px] font-black leading-tight">{rate.value.toFixed(rate.value < 0.01 ? 4 : 3)}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={`text-[10px] font-black ${rate.changePercent >= 0 ? "text-emerald-700" : "text-red-500"}`}>
                      {rate.changePercent >= 0 ? "▲" : "▼"} {Math.abs(rate.changePercent).toFixed(2)}%
                    </span>
                    <svg className={`h-7 w-14 min-[390px]:w-16 ${rate.changePercent >= 0 ? "text-emerald-700" : "text-red-500"}`} viewBox="0 0 64 28" aria-hidden="true">
                      <polyline fill="none" stroke="currentColor" strokeWidth="2.5" points={sparklinePoints(rate.trend)} />
                    </svg>
                  </div>
                </div>
              ))}
            </div>
          </DashboardCard>

          <WeatherCard />

          <Link href="/tools/work-hours">
            <DashboardCard className="h-full">
              <p className="text-[11px] font-black leading-tight text-stone-500">{labels.workHours}</p>
              <p className="mt-2 text-[22px] font-black leading-tight">
                {workHours.total.toFixed(1)} <span className="text-lg text-stone-500">h</span>
              </p>
              <div className="mt-2 h-2 rounded-full bg-emerald-100">
                <div className={`h-full rounded-full ${workHours.studentLimitEnabled && studentRemaining < 0 ? "bg-red-500" : "bg-emerald-700"}`} style={{ width: `${Math.min((workHours.total / (workHours.studentLimitEnabled ? 28 : 40)) * 100, 100)}%` }} />
              </div>
              <p className={`mt-1.5 text-[10px] font-bold ${workHours.studentLimitEnabled && studentRemaining < 0 ? "text-red-600" : "text-stone-500"}`}>
                {workHours.studentLimitEnabled ? `${studentRemaining >= 0 ? "+" : ""}${studentRemaining.toFixed(1)} h / 28h` : t.home.remaining}
              </p>
            </DashboardCard>
          </Link>

          <Link href="/tools/holidays">
            <DashboardCard>
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-800">
                  <CalendarDays className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-black leading-tight text-stone-500">{labels.nextHoliday}</p>
                  <h2 className="truncate text-[14px] font-black">{nextHoliday.title} / {nextHoliday.titleJa}</h2>
                  <p className="text-[10px] font-bold text-stone-500">{formatDate(nextHoliday.date)} / {nextHolidayDays} days{holidaySource === "mock" ? ` / ${labels.backup}` : ""}</p>
                </div>
              </div>
            </DashboardCard>
          </Link>
        </section>

        <section className="mt-3">
          <DashboardCard className="border border-emerald-100 bg-white">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-800">
                  <CalendarDays className="h-4 w-4" />
                </span>
                <div className="grid min-w-0 flex-1 grid-cols-2 gap-2">
                  <div className="min-w-0">
                    <p className="text-[11px] font-black text-stone-400">{labels.todayPlans}</p>
                    {todayPlanItems.length > 0 ? (
                      <div className="mt-1 grid gap-1">
                        {todayPlanItems.map((item) => (
                          <Link className={`block truncate rounded-xl px-2 py-1 text-[11px] font-black ${item.className}`} href={item.href} key={item.key}>{item.text}</Link>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-1 truncate text-[11px] font-black text-stone-600">{todayPlanEmpty[language]}</p>
                    )}
                  </div>
                  <div className="min-w-0 border-l border-stone-100 pl-2">
                    <p className="text-[11px] font-black text-stone-400">{labels.upcomingPlans}</p>
                    {upcomingPlanItems.length > 0 ? (
                      <div className="mt-1 grid gap-1">
                        {upcomingPlanItems.map((item) => (
                          <Link className={`block truncate rounded-xl px-2 py-1 text-[11px] font-black ${item.className}`} href={item.href} key={item.key}>{item.text}</Link>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-1 truncate text-[11px] font-black text-stone-600">{upcomingPlanEmpty[language]}</p>
                    )}
                  </div>
                </div>
              </div>
              <Link className="mt-3 flex items-center justify-end text-[11px] font-black text-emerald-800" href="/reminders">
                {viewAllRemindersLabel[language]}
              </Link>
            </DashboardCard>
        </section>

        <SectionHeader title={labels.tools} action={labels.allTools} href="/search" />
        <section className="grid grid-cols-2 gap-2.5 min-[360px]:grid-cols-3">
          <ToolCard href="/tools/area-compare" icon={GitCompare} title={t.home.toolsList.areaCompare.title} subtitle={t.home.toolsList.areaCompare.sub} />
          {homeTools.map((tool) => {
            const copy = t.home.toolsList[tool.key];
            return (
              <ToolCard
                key={tool.key}
                href={tool.href}
                icon={tool.icon}
                title={copy.title}
                subtitle={copy.sub}
                iconSlot={tool.key === "visaReminder" && visaCountdownLabel ? <VisaCountdownIcon daysLabel={visaCountdownLabel} /> : undefined}
              />
            );
          })}
        </section>

        <section className="mt-6 grid gap-6">
          <div>
            <SectionHeader title={labels.shops} action={t.common.more} href="/places" />
            <PlaceCard place={placeItems[0]} />
          </div>
          <div>
            <SectionHeader title={t.home.arrivalTitle} action={t.home.arrivalAction} href="/arrival" />
            <Link href="/arrival">
              <DashboardCard>
                <div className="flex items-center gap-3">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-800">
                    <Compass className="h-6 w-6" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-black">{t.home.arrivalTitle}</h3>
                    <p className="mt-1 text-xs font-bold leading-5 text-stone-500">{t.home.arrivalText}</p>
                  </div>
                  <ChevronRight className="h-5 w-5 shrink-0 text-stone-400" />
                </div>
              </DashboardCard>
            </Link>
          </div>
        </section>

        <BottomNav />
      </div>
    </main>
  );
}

function VisaCountdownIcon({ daysLabel }: { daysLabel: string }) {
  const compact = daysLabel.length >= 3;
  return (
    <span className="mb-2 flex h-10 w-10 flex-col items-center justify-center rounded-2xl bg-gradient-to-br from-violet-700 to-emerald-700 text-white shadow-[0_8px_18px_rgba(91,33,182,0.22)] ring-1 ring-white/70">
      <span className={`${compact ? "text-[13px]" : "text-[17px]"} font-black leading-none`}>{daysLabel}</span>
      <span className="mt-0.5 text-[7px] font-black uppercase leading-none text-white/75">days</span>
    </span>
  );
}
