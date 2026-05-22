"use client";

import { AlertTriangle, Bell, CalendarDays, ChevronRight, Clock3, Compass, GitCompare, MapPin, Megaphone, MoreHorizontal, TrainFront, WalletCards } from "lucide-react";
import type { ComponentType } from "react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import { DashboardCard } from "@/components/DashboardCard";
import { SectionHeader } from "@/components/SectionHeader";
import { WeatherCard } from "@/components/WeatherCard";
import { dashboardTools } from "@/data/tools";
import { useHomeRailLines } from "@/hooks/useHomeRailLines";
import { useHomeTools } from "@/hooks/useHomeTools";
import { tokyoTrainStatusLines, type TrainStatusTone } from "@/data/trainStatus";
import { useLanguage } from "@/hooks/useLanguage";
import { useMounted } from "@/hooks/useMounted";
import { useReminders } from "@/hooks/useReminders";
import { useUserSettings } from "@/hooks/useUserSettings";
import { fetchExchangeRates, getMockExchangeRates, type ExchangeCurrency, type ExchangeRateItem } from "@/lib/api/exchange";
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
    mustSee: "今日必看",
    latestNews: "最新日本资讯",
    nextHoliday: "下一个假期",
    partTime: "兼职",
    shops: "推荐店铺",
    takehome: "本月预计到手",
    trainArea: "东京",
    trainStatus: "常用线路状态",
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
    mustSee: "今日必看",
    latestNews: "最新日本資訊",
    nextHoliday: "下一個假期",
    partTime: "兼職",
    shops: "推薦店鋪",
    takehome: "本月預計到手",
    trainArea: "東京",
    trainStatus: "常用路線狀態",
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
    mustSee: "今日必見",
    latestNews: "日本生活情報",
    nextHoliday: "次の祝日",
    partTime: "アルバイト",
    shops: "おすすめ店舗",
    takehome: "今月の手取り目安",
    trainArea: "東京",
    trainStatus: "よく使う路線",
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
const viewAllRemindersLabel = {
  "zh-CN": "查看全部 →",
  "zh-TW": "查看全部 →",
  ja: "すべて見る →",
} as const;
const reminderTypePriority: Record<ReminderType, number> = { garbage: 0, monthlyPayment: 1, holiday: 2, residenceCard: 3, custom: 4 };
const viewAllTrainLinesLabel = {
  "zh-CN": "查看更多线路",
  "zh-TW": "查看更多路線",
  ja: "すべての路線",
} as const;
const manageHomeToolsLabel = {
  "zh-CN": "管理",
  "zh-TW": "管理",
  ja: "管理",
} as const;
const toolIconTones = ["green", "orange", "blue", "pink", "violet", "yellow", "cyan", "amber", "purple", "sky"] as const;
const newsItems = {
  "zh-CN": [
    { title: "电车延误", text: "中央线人身事故影响，预计延误 15 分钟。", tone: "red" },
    { title: "台风提醒", text: "预计明天开始影响东京，注意雨具和通勤时间。", tone: "orange" },
    { title: "补助更新", text: "住民税相关通知陆续寄出，请确认信箱。", tone: "blue" },
    { title: "税金提醒", text: "固定资产税第 1 期缴纳期限临近。", tone: "violet" },
  ],
  "zh-TW": [
    { title: "電車延誤", text: "中央線人身事故影響，預計延誤 15 分鐘。", tone: "red" },
    { title: "颱風提醒", text: "預計明天開始影響東京，注意雨具和通勤時間。", tone: "orange" },
    { title: "補助更新", text: "住民稅相關通知陸續寄出，請確認信箱。", tone: "blue" },
    { title: "稅金提醒", text: "固定資產稅第 1 期繳納期限臨近。", tone: "violet" },
  ],
  ja: [
    { title: "電車遅延", text: "中央線で人身事故の影響。約15分の遅れ見込みです。", tone: "red" },
    { title: "台風注意", text: "明日から東京に影響の可能性。雨具と移動時間を確認しましょう。", tone: "orange" },
    { title: "支援制度", text: "住民税関連のお知らせが順次届きます。郵便受けを確認。", tone: "blue" },
    { title: "税金メモ", text: "固定資産税第1期の納期限が近づいています。", tone: "violet" },
  ],
} as const;

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
  if (type === "garbage") return "bg-orange-50 text-[#F97316]";
  if (type === "monthlyPayment") return "bg-sky-50 text-[#2563EB]";
  if (type === "holiday") return "bg-rose-50 text-[#EF4444]";
  if (type === "residenceCard") return "bg-violet-50 text-violet-700";
  return "bg-emerald-50 text-[#22C55E]";
}

function getStatusTone(tone: "blue" | "green" | "orange" | "red" | "violet") {
  const tones = {
    blue: "from-blue-50 to-sky-50 text-[#2563EB]",
    green: "from-green-50 to-emerald-50 text-[#22C55E]",
    orange: "from-orange-50 to-amber-50 text-[#F97316]",
    red: "from-red-50 to-rose-50 text-[#EF4444]",
    violet: "from-violet-50 to-indigo-50 text-violet-600",
  };
  return tones[tone];
}

function getTrainStatusBadgeClass(tone: TrainStatusTone) {
  if (tone === "green") return "bg-emerald-50 text-[#16A34A] ring-1 ring-emerald-100";
  if (tone === "red") return "bg-red-50 text-[#EF4444] ring-1 ring-red-100";
  return "bg-orange-50 text-[#F97316] ring-1 ring-orange-100";
}

function getToolIconTone(index: number) {
  const tone = toolIconTones[index % toolIconTones.length];
  const tones: Record<(typeof toolIconTones)[number], string> = {
    amber: "from-amber-100 to-orange-100 text-[#F97316]",
    blue: "from-blue-100 to-sky-100 text-[#2563EB]",
    cyan: "from-cyan-100 to-teal-100 text-cyan-600",
    green: "from-green-100 to-emerald-100 text-[#22C55E]",
    orange: "from-orange-100 to-amber-100 text-[#F97316]",
    pink: "from-pink-100 to-rose-100 text-[#F472B6]",
    purple: "from-purple-100 to-fuchsia-100 text-[#8B5CF6]",
    sky: "from-sky-100 to-blue-100 text-[#2563EB]",
    violet: "from-violet-100 to-indigo-100 text-[#8B5CF6]",
    yellow: "from-yellow-100 to-orange-100 text-amber-500",
  };
  return tones[tone];
}

function getNewsIconClass(tone: string) {
  if (tone === "red") return "bg-red-50 text-[#EF4444]";
  if (tone === "orange") return "bg-orange-50 text-[#F97316]";
  if (tone === "violet") return "bg-violet-50 text-violet-600";
  return "bg-blue-50 text-[#2563EB]";
}

function getPreferredRate(items: ExchangeRateItem[], preferredCurrency: string) {
  const currency = preferredCurrency === "JPY" ? "CNY" : preferredCurrency;
  return items.find((rate) => rate.code === currency) ?? items.find((rate) => rate.code === "CNY") ?? items.find((rate) => rate.code !== "JPY");
}

function formatRateValue(rate: ExchangeRateItem | undefined) {
  if (!rate) return "--";
  if (rate.value < 0.01) return rate.value.toFixed(4);
  if (rate.value < 1) return rate.value.toFixed(3);
  return rate.value.toFixed(2);
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
  const { selectedRailLineIds } = useHomeRailLines();
  const { selectedToolKeys } = useHomeTools();
  const { loaded, settings } = useUserSettings();
  const { activeReminders, todayReminders } = useReminders();
  const { rateItems, rateSource, rateUpdatedAt, workHours, holidayItems, holidaySource, todayString, visaExpiryDate } = useDashboardLocalData();

  const onboardingDone = Boolean(settings?.onboardingCompleted);
  const preferredCurrency = (settings?.defaultCurrency ?? settings?.currency ?? "CNY") as ExchangeCurrency;
  const preferredRate = useMemo(() => getPreferredRate(rateItems, preferredCurrency), [preferredCurrency, rateItems]);

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
  const selectedHomeTools = selectedToolKeys
    .map((key) => dashboardTools.find((tool) => tool.key === key))
    .filter((tool): tool is (typeof dashboardTools)[number] => Boolean(tool));
  const selectedRailLines = selectedRailLineIds
    .map((id) => tokyoTrainStatusLines[language].find((line) => line.id === id))
    .filter((line): line is (typeof tokyoTrainStatusLines)[typeof language][number] => Boolean(line));

  return (
    <main className="min-h-screen bg-[#F6FAFF] text-[#0F172A]">
      <div className="japan-life-shell mx-auto min-h-screen max-w-[430px] px-4 pb-4 pt-4 shadow-2xl shadow-blue-200/30">
        <AppHeader />

        {loaded && !onboardingDone && (
          <Link href="/onboarding" className="mt-4 block rounded-[18px] border border-emerald-100 bg-emerald-50 p-4 text-emerald-900 shadow-[0_8px_22px_rgba(32,38,34,0.05)]">
            <p className="text-sm font-black">{t.home.settingsCardTitle}</p>
            <p className="mt-1 text-xs font-bold leading-5">{t.home.settingsCardText}</p>
          </Link>
        )}

        <section className="mt-4">
          <WeatherCard />
        </section>

        <SectionHeader title={labels.mustSee} />
        <section className="grid grid-cols-4 gap-2.5">
          <StatusCard href="/tools/holidays" icon={CalendarDays} title={labels.nextHoliday} value={nextHoliday.title} detail={`${formatDate(nextHoliday.date)} / ${nextHolidayDays} days${holidaySource === "mock" ? ` / ${labels.backup}` : ""}`} tone="green" />
          <StatusCard href="#train-status" icon={TrainFront} title={labels.trainStatus} value={language === "ja" ? "中央線 遅延" : "中央线 延误"} detail={language === "ja" ? "約15分" : "约 15 分钟"} tone="orange" />
          <StatusCard href="/tools/exchange" icon={WalletCards} title={labels.todayRate} value={preferredRate ? `JPY/${preferredRate.code} ${formatRateValue(preferredRate)}` : "JPY/CNY --"} detail={rateSource === "frankfurter" ? rateUpdatedAt : labels.backup} tone="blue" />
          <StatusCard href="/tools/work-hours" icon={Clock3} title={labels.workHours} value={`${workHours.total.toFixed(1)}h`} detail={workHours.studentLimitEnabled ? `${studentRemaining >= 0 ? "+" : ""}${studentRemaining.toFixed(1)} h / 28h` : t.home.remaining} tone={workHours.studentLimitEnabled && studentRemaining < 0 ? "red" : "violet"} />
        </section>

        <SectionHeader title={labels.tools} action={manageHomeToolsLabel[language]} href="/home-tools" />
        <section className="rounded-[28px] border border-white/60 bg-white/70 p-4 shadow-[0_18px_45px_rgba(37,99,235,0.08)] backdrop-blur-xl">
          <div className="grid grid-cols-5 gap-x-3 gap-y-4">
          {selectedHomeTools.map((tool, index) => {
            return (
              <CompactToolCard
                key={tool.key}
                href={tool.href}
                icon={tool.icon}
                title={tool.title[language]}
                toneClass={getToolIconTone(index)}
                iconSlot={tool.key === "visaReminder" && visaCountdownLabel ? <VisaCountdownIcon daysLabel={visaCountdownLabel} compact /> : undefined}
              />
            );
          })}
          <CompactToolCard href="/search" icon={MoreHorizontal} title={language === "ja" ? "もっと" : language === "zh-TW" ? "更多工具" : "更多工具"} toneClass={getToolIconTone(9)} />
          </div>
        </section>

        <section className="mt-3">
          <DashboardCard className="border-white/70 bg-white/75 p-3">
              <div className="flex items-start gap-2">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-[#2563EB]">
                  <CalendarDays className="h-4 w-4" />
                </span>
                <div className="grid min-w-0 flex-1 grid-cols-2 gap-2">
                  <div className="min-w-0">
                    <p className="text-[11px] font-black text-[#64748B]">{labels.todayPlans}</p>
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
                  <div className="min-w-0 border-l border-blue-100 pl-2">
                    <p className="text-[11px] font-black text-[#64748B]">{labels.upcomingPlans}</p>
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
              <Link className="mt-2 flex items-center justify-end text-[11px] font-black text-[#2563EB]" href="/reminders">
                {viewAllRemindersLabel[language]}
              </Link>
            </DashboardCard>
        </section>

        <section className="mt-5" id="train-status">
          <DashboardCard className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-100 to-blue-100 text-[#2563EB] shadow-sm">
                  <TrainFront className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <h2 className="truncate text-base font-black tracking-tight text-[#0F172A]">{labels.trainStatus}</h2>
                  <p className="mt-0.5 text-[11px] font-bold text-[#64748B]">Tokyo rail status</p>
                </div>
              </div>
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-white/75 px-3 py-1.5 text-[11px] font-black text-[#2563EB] shadow-sm ring-1 ring-white/80">
                <MapPin className="h-3.5 w-3.5" />
                {labels.trainArea}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {selectedRailLines.map((line) => (
                <Link className="min-w-0 rounded-[22px] bg-white/68 p-3 shadow-sm ring-1 ring-white/70 transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/85" href="/tools/train-status" key={line.id}>
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[11px] font-black text-white shadow-sm" style={{ backgroundColor: line.color }}>
                      {line.code}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-black text-[#0F172A]">{line.name}</p>
                      <span className={`mt-1 inline-flex max-w-full rounded-full px-2 py-0.5 text-[10px] font-black ${getTrainStatusBadgeClass(line.tone)}`}>
                        {line.status}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            <Link className="flex items-center justify-center gap-1 rounded-2xl border border-blue-100 bg-blue-50/85 px-4 py-2.5 text-xs font-black text-[#2563EB] shadow-sm transition-all duration-300 hover:bg-blue-50" href="/tools/train-status">
              {viewAllTrainLinesLabel[language]}
              <ChevronRight className="h-4 w-4" />
            </Link>
          </DashboardCard>
        </section>

        <SectionHeader title={labels.latestNews} action={t.common.more} href="/resources" />
        <section className="grid gap-3">
          {newsItems[language].map((item) => (
            <Link href="/resources" className="flex items-center gap-3 rounded-3xl border border-white/60 bg-white/70 p-3 shadow-[0_16px_38px_rgba(37,99,235,0.08)] backdrop-blur-xl transition hover:-translate-y-0.5" key={item.title}>
              <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${getNewsIconClass(item.tone)}`}>
                {item.tone === "red" ? <AlertTriangle className="h-5 w-5" /> : item.tone === "orange" ? <Bell className="h-5 w-5" /> : <Megaphone className="h-5 w-5" />}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-black text-[#0F172A]">{item.title}</p>
                <p className="mt-0.5 line-clamp-1 text-xs font-bold text-[#64748B]">{item.text}</p>
              </div>
            </Link>
          ))}
        </section>

        <section className="mt-6 grid gap-6">
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

function VisaCountdownIcon({ compact: forceCompact = false, daysLabel }: { compact?: boolean; daysLabel: string }) {
  const compact = daysLabel.length >= 3;
  return (
    <span className={`${forceCompact ? "h-11 w-11" : "mb-3 h-11 w-11"} flex flex-col items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-blue-500 text-white shadow-[0_12px_25px_rgba(37,99,235,0.22)] ring-1 ring-white/70`}>
      <span className={`${compact || forceCompact ? "text-[12px]" : "text-[17px]"} font-black leading-none`}>{daysLabel}</span>
      <span className="mt-0.5 text-[6px] font-black uppercase leading-none text-white/75">days</span>
    </span>
  );
}

function CompactToolCard({
  href,
  icon: Icon,
  iconSlot,
  title,
  toneClass,
}: {
  href: string;
  icon: ComponentType<{ className?: string }>;
  iconSlot?: React.ReactNode;
  title: string;
  toneClass: string;
}) {
  return (
    <Link href={href} className="flex min-w-0 flex-col items-center text-center">
      {iconSlot ?? (
        <span className={`flex h-11 w-11 items-center justify-center rounded-[18px] bg-gradient-to-br ${toneClass} shadow-[0_10px_24px_rgba(37,99,235,0.10)] ring-1 ring-white/80`}>
          <Icon className="h-5 w-5" />
        </span>
      )}
      <span className="mt-1.5 line-clamp-2 min-h-7 text-[10px] font-black leading-[14px] text-[#0F172A]">{title}</span>
    </Link>
  );
}

function StatusCard({
  detail,
  href,
  icon: Icon,
  title,
  tone,
  value,
}: {
  detail: string;
  href: string;
  icon: typeof CalendarDays;
  title: string;
  tone: "blue" | "green" | "orange" | "red" | "violet";
  value: string;
}) {
  return (
    <Link href={href} className={`min-h-[106px] rounded-[22px] border border-white/60 bg-gradient-to-br ${getStatusTone(tone)} p-3 shadow-[0_12px_28px_rgba(37,99,235,0.08)] transition duration-300 hover:-translate-y-0.5`}>
      <div className="flex items-center justify-between gap-1">
        <span className="flex h-8 w-8 items-center justify-center rounded-2xl bg-white/75 shadow-sm">
          <Icon className="h-4 w-4" />
        </span>
        <ChevronRight className="h-3.5 w-3.5 opacity-55" />
      </div>
      <p className="mt-2 truncate text-[10px] font-black text-[#64748B]">{title}</p>
      <h3 className="mt-1 line-clamp-2 min-h-8 text-[13px] font-black leading-4 text-[#0F172A]">{value}</h3>
      <p className="mt-1 line-clamp-1 text-[9px] font-bold text-[#64748B]">{detail}</p>
    </Link>
  );
}
