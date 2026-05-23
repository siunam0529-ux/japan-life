"use client";

import { Bell, CalendarDays, ChevronRight, CloudRain, CreditCard, FileClock, Snowflake, Sun, Trash2, TrainFront, Umbrella, WalletCards, Wind } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { BackButton } from "@/components/BackButton";
import { tokyoTrainStatusLines } from "@/data/trainStatus";
import { useHomeRailLines } from "@/hooks/useHomeRailLines";
import { useLanguage } from "@/hooks/useLanguage";
import { useReminders } from "@/hooks/useReminders";
import { useUserSettings } from "@/hooks/useUserSettings";
import { getTokyoDateString } from "@/lib/api/holidays";
import { diffDays, readVisaReminderState, visaReminderEvent } from "@/lib/reminders";
import { fetchWeatherForecast, getWeatherLocationFromSettings } from "@/lib/weather";
import type { ReminderItem } from "@/types/reminder";
import type { WeatherForecast } from "@/types/weather";

type AlertCategory = "all" | "weather" | "traffic" | "life" | "money" | "visa" | "policy";
type AlertTone = "blue" | "green" | "orange" | "red" | "violet";

type LifeAlert = {
  category: Exclude<AlertCategory, "all">;
  detail: string;
  href: string;
  icon: LucideIcon;
  id: string;
  meta: string;
  tone: AlertTone;
  title: string;
};

type WeatherAlertSettings = {
  rain: boolean;
  heat: boolean;
  typhoon: boolean;
  snow: boolean;
};

const weatherAlertStorageKey = "japan-life:weather-alert-settings";
const weatherAlertSettingsChangeEvent = "japan-life:weather-alert-settings-change";
const defaultWeatherAlertSettings: WeatherAlertSettings = {
  rain: false,
  heat: false,
  typhoon: false,
  snow: false,
};

const copy = {
  "zh-CN": {
    back: "返回",
    title: "生活提醒中心",
    today: "今日提醒",
    other: "其他提醒",
    empty: "这个分类暂时没有提醒",
    updated: "更新",
    tomorrow: "明天",
    todayLabel: "今天",
    tabs: { all: "全部", weather: "天气", traffic: "交通", life: "生活", money: "钱", visa: "签证", policy: "行政福利政策" },
    weatherStable: "天气提醒",
    weatherStableDetail: "今天没有明显天气风险，适合正常安排出行。",
    rain: "下午可能下雨",
    rainDetail: "出门记得带伞，通勤和步行注意路面湿滑。",
    heat: "高温提醒",
    heatDetail: "最高气温偏高，注意补水，避免长时间暴晒。",
    wind: "强风雷雨提醒",
    windDetail: "风雨可能影响通勤，建议提前确认路线。",
    snow: "降雪提醒",
    snowDetail: "可能有降雪或路面湿滑，出门前确认交通。",
    trafficNormal: "常用线路正常",
    trafficNormalDetail: "当前常用线路没有明显延误。",
    visaUnset: "设置在留期限",
    visaUnsetDetail: "设置到期日后，这里会显示签证 / 在留相关提醒。",
    visaExpired: "在留期限已过期",
    visaUrgent: "确认在留期限",
    visaDetail: (days: number) => `距离到期还有 ${days} 天，请提前准备更新手续。`,
    paymentSummaryTitle: (count: number) => `本周有 ${count} 笔缴费`,
    paymentSummaryDetail: (count: number) => count >= 3 ? "本周缴费较集中，建议提前确认账户余额。" : "本周有缴费安排，具体项目请在今日安排或待办中心确认。",
    workHourTitle: "留学生 28 小时注意",
    workHourDetail: (hours: number, remaining: number) => remaining < 0 ? `本周已记录 ${hours.toFixed(1)} 小时，超过 ${Math.abs(remaining).toFixed(1)} 小时。` : `本周已记录 ${hours.toFixed(1)} 小时，还剩 ${remaining.toFixed(1)} 小时。`,
  },
  "zh-TW": {
    back: "返回",
    title: "生活提醒中心",
    today: "今日提醒",
    other: "其他提醒",
    empty: "這個分類暫時沒有提醒",
    updated: "更新",
    tomorrow: "明天",
    todayLabel: "今天",
    tabs: { all: "全部", weather: "天氣", traffic: "交通", life: "生活", money: "錢", visa: "簽證", policy: "行政福利政策" },
    weatherStable: "天氣提醒",
    weatherStableDetail: "今天沒有明顯天氣風險，適合正常安排出行。",
    rain: "下午可能下雨",
    rainDetail: "出門記得帶傘，通勤和步行注意路面濕滑。",
    heat: "高溫提醒",
    heatDetail: "最高氣溫偏高，注意補水，避免長時間曝曬。",
    wind: "強風雷雨提醒",
    windDetail: "風雨可能影響通勤，建議提前確認路線。",
    snow: "降雪提醒",
    snowDetail: "可能有降雪或路面濕滑，出門前確認交通。",
    trafficNormal: "常用路線正常",
    trafficNormalDetail: "目前常用路線沒有明顯延誤。",
    visaUnset: "設定在留期限",
    visaUnsetDetail: "設定到期日後，這裡會顯示簽證 / 在留相關提醒。",
    visaExpired: "在留期限已過期",
    visaUrgent: "確認在留期限",
    visaDetail: (days: number) => `距離到期還有 ${days} 天，請提前準備更新手續。`,
    paymentSummaryTitle: (count: number) => `本週有 ${count} 筆繳費`,
    paymentSummaryDetail: (count: number) => count >= 3 ? "本週繳費較集中，建議提前確認帳戶餘額。" : "本週有繳費安排，具體項目請在今日安排或待辦中心確認。",
    workHourTitle: "留學生 28 小時注意",
    workHourDetail: (hours: number, remaining: number) => remaining < 0 ? `本週已記錄 ${hours.toFixed(1)} 小時，超過 ${Math.abs(remaining).toFixed(1)} 小時。` : `本週已記錄 ${hours.toFixed(1)} 小時，還剩 ${remaining.toFixed(1)} 小時。`,
  },
  ja: {
    back: "戻る",
    title: "生活リマインダー",
    today: "今日の注意",
    other: "その他",
    empty: "このカテゴリの通知はありません",
    updated: "更新",
    tomorrow: "明日",
    todayLabel: "今日",
    tabs: { all: "すべて", weather: "天気", traffic: "交通", life: "生活", money: "お金", visa: "ビザ", policy: "行政・支援制度" },
    weatherStable: "天気リマインダー",
    weatherStableDetail: "大きな天気リスクはありません。通常通り予定を組みやすい日です。",
    rain: "雨の可能性",
    rainDetail: "傘を持ち歩き、通勤や徒歩移動は足元に注意してください。",
    heat: "高温注意",
    heatDetail: "最高気温が高めです。水分補給と直射日光に注意してください。",
    wind: "強風・雷雨注意",
    windDetail: "通勤に影響する可能性があります。ルートを早めに確認しましょう。",
    snow: "雪の可能性",
    snowDetail: "雪や路面凍結に注意。外出前に交通状況を確認してください。",
    trafficNormal: "よく使う路線は平常",
    trafficNormalDetail: "現在、よく使う路線に大きな遅延はありません。",
    visaUnset: "在留期限を設定",
    visaUnsetDetail: "期限を設定すると、ビザ / 在留関連の注意を表示します。",
    visaExpired: "在留期限が切れています",
    visaUrgent: "在留期限を確認",
    visaDetail: (days: number) => `期限まであと ${days} 日です。早めに更新手続きを確認しましょう。`,
    paymentSummaryTitle: (count: number) => `今週の支払い ${count} 件`,
    paymentSummaryDetail: (count: number) => count >= 3 ? "今週は支払いが集中しています。口座残高を早めに確認しましょう。" : "今週の支払い予定があります。詳細は今日の予定またはリマインダーで確認してください。",
    workHourTitle: "留学生 28時間に注意",
    workHourDetail: (hours: number, remaining: number) => remaining < 0 ? `今週 ${hours.toFixed(1)} 時間記録済み。${Math.abs(remaining).toFixed(1)} 時間超過しています。` : `今週 ${hours.toFixed(1)} 時間記録済み。残り ${remaining.toFixed(1)} 時間です。`,
  },
} as const;

const workHoursStorageKey = "japan-life-work-hours";
const workHoursChangeEvent = "japan-life-work-hours-change";
const workHourDayKeys = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

export default function LifeAlertsPage() {
  const { language } = useLanguage();
  const text = copy[language];
  const { selectedRailLineIds } = useHomeRailLines();
  const { activeReminders } = useReminders();
  const { settings } = useUserSettings();
  const [activeTab, setActiveTab] = useState<AlertCategory>("all");
  const [forecast, setForecast] = useState<WeatherForecast | null>(null);
  const [weatherAlertSettings, setWeatherAlertSettings] = useState<WeatherAlertSettings>(defaultWeatherAlertSettings);
  const [visaExpiryDate, setVisaExpiryDate] = useState("");
  const [workHours, setWorkHours] = useState({ total: 0, studentLimitEnabled: false });
  const today = getTokyoDateString();
  const weatherLocation = useMemo(() => getWeatherLocationFromSettings(settings), [settings]);

  useEffect(() => {
    let cancelled = false;
    if (!weatherLocation) {
      setForecast(null);
      return;
    }
    fetchWeatherForecast(weatherLocation)
      .then((result) => {
        if (!cancelled) setForecast(result);
      })
      .catch(() => {
        if (!cancelled) setForecast(null);
      });
    return () => {
      cancelled = true;
    };
  }, [weatherLocation]);

  useEffect(() => {
    const read = () => setWeatherAlertSettings(readWeatherAlertSettings());
    read();
    window.addEventListener("storage", read);
    window.addEventListener(weatherAlertSettingsChangeEvent, read);
    return () => {
      window.removeEventListener("storage", read);
      window.removeEventListener(weatherAlertSettingsChangeEvent, read);
    };
  }, []);

  useEffect(() => {
    const read = () => setVisaExpiryDate(readVisaReminderState().expiryDate);
    read();
    window.addEventListener(visaReminderEvent, read);
    window.addEventListener("storage", read);
    return () => {
      window.removeEventListener(visaReminderEvent, read);
      window.removeEventListener("storage", read);
    };
  }, []);

  useEffect(() => {
    const read = () => {
      try {
        setWorkHours(readWorkHours(window.localStorage.getItem(workHoursStorageKey)));
      } catch {
        setWorkHours({ total: 0, studentLimitEnabled: false });
      }
    };
    read();
    window.addEventListener("storage", read);
    window.addEventListener(workHoursChangeEvent, read);
    return () => {
      window.removeEventListener("storage", read);
      window.removeEventListener(workHoursChangeEvent, read);
    };
  }, []);

  const alerts = useMemo(() => {
    return [
      ...buildWeatherAlerts(forecast, weatherAlertSettings, text),
      ...buildTrafficAlerts(selectedRailLineIds, language, text),
      ...buildReminderAlerts(activeReminders, today, text),
      ...buildPaymentSummaryAlerts(activeReminders, today, text),
      ...buildWorkHourAlerts(workHours, text),
      ...buildVisaAlerts(visaExpiryDate, today, text),
    ];
  }, [activeReminders, forecast, language, selectedRailLineIds, text, today, visaExpiryDate, weatherAlertSettings, workHours]);

  const visibleAlerts = activeTab === "all" ? alerts : alerts.filter((item) => item.category === activeTab);
  const todayAlerts = visibleAlerts.filter((item) => item.meta === text.todayLabel || item.meta.includes(text.updated));
  const otherAlerts = visibleAlerts.filter((item) => !todayAlerts.includes(item));
  const tabs: AlertCategory[] = ["all", "weather", "traffic", "life", "money", "visa", "policy"];

  return (
    <main className="min-h-screen bg-[#F5F5F7] text-[#0F172A]">
      <div className="mx-auto min-h-screen max-w-[430px] bg-[#F5F5F7] px-4 pb-8 pt-5">
        <header className="mb-4 flex items-center justify-between">
          <BackButton label={text.back} />
          <h1 className="text-base font-black">{text.title}</h1>
          <span className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm">
            <Bell className="h-4 w-4" />
          </span>
        </header>

        <nav className="sticky top-0 z-10 mb-4 grid grid-cols-4 gap-1.5 rounded-[22px] border border-slate-200 bg-white/95 p-1.5 shadow-sm">
          {tabs.map((tab) => (
            <button
              className={`min-w-0 rounded-full border px-2 py-2 text-xs font-black transition ${activeTab === tab ? "border-[#2563EB] bg-[#2563EB] text-white shadow-sm" : "border-transparent bg-white text-slate-600"}`}
              key={tab}
              onClick={() => setActiveTab(tab)}
              type="button"
            >
              <span className="block truncate">{text.tabs[tab]}</span>
            </button>
          ))}
        </nav>

        <AlertSection emptyText={text.empty} items={todayAlerts} title={`${text.today}（${todayAlerts.length}）`} />
        <AlertSection emptyText={text.empty} items={otherAlerts} title={`${text.other}（${otherAlerts.length}）`} />
      </div>
    </main>
  );
}

function buildWeatherAlerts(forecast: WeatherForecast | null, settings: WeatherAlertSettings, text: (typeof copy)[keyof typeof copy]): LifeAlert[] {
  const today = forecast?.daily[0];
  if (!today) {
    return [{ category: "weather", detail: text.weatherStableDetail, href: "/tools/weather", icon: Umbrella, id: "weather-loading", meta: text.todayLabel, tone: "blue", title: text.weatherStable }];
  }

  const alerts: LifeAlert[] = [{ category: "weather", detail: text.weatherStableDetail, href: "/tools/weather", icon: Umbrella, id: "weather-stable", meta: text.todayLabel, tone: "green", title: text.weatherStable }];
  const current = forecast.current;
  const gusts = current?.windGusts ?? today.windGustsMax ?? 0;
  const windSpeed = current?.windSpeed ?? today.windSpeedMax ?? 0;
  if (settings.rain && (today.precipitationProbability >= 50 || (today.precipitationSum ?? 0) > 2)) {
    alerts.push({ category: "weather", detail: text.rainDetail, href: "/tools/weather", icon: CloudRain, id: "weather-rain", meta: text.todayLabel, tone: "blue", title: text.rain });
  }
  if (settings.heat && today.maxTemperature >= 30) {
    alerts.push({ category: "weather", detail: text.heatDetail, href: "/tools/weather", icon: Sun, id: "weather-heat", meta: text.todayLabel, tone: "orange", title: text.heat });
  }
  if (settings.typhoon && ([95, 96, 99].includes(today.weatherCode) || gusts >= 45 || windSpeed >= 35)) {
    alerts.push({ category: "weather", detail: text.windDetail, href: "/tools/weather", icon: Wind, id: "weather-wind", meta: text.todayLabel, tone: "red", title: text.wind });
  }
  if (settings.snow && ([71, 73, 75, 77, 85, 86].includes(today.weatherCode) || (today.snowfallSum ?? 0) > 0)) {
    alerts.push({ category: "weather", detail: text.snowDetail, href: "/tools/weather", icon: Snowflake, id: "weather-snow", meta: text.todayLabel, tone: "blue", title: text.snow });
  }
  return alerts;
}

function readWeatherAlertSettings(): WeatherAlertSettings {
  if (typeof window === "undefined") return defaultWeatherAlertSettings;
  try {
    const raw = window.localStorage.getItem(weatherAlertStorageKey);
    if (!raw) return defaultWeatherAlertSettings;
    const parsed = JSON.parse(raw) as Partial<WeatherAlertSettings>;
    return {
      rain: typeof parsed.rain === "boolean" ? parsed.rain : false,
      heat: typeof parsed.heat === "boolean" ? parsed.heat : false,
      typhoon: typeof parsed.typhoon === "boolean" ? parsed.typhoon : false,
      snow: typeof parsed.snow === "boolean" ? parsed.snow : false,
    };
  } catch {
    return defaultWeatherAlertSettings;
  }
}

function buildTrafficAlerts(selectedRailLineIds: string[], language: keyof typeof copy, text: (typeof copy)[keyof typeof copy]): LifeAlert[] {
  const selected = selectedRailLineIds
    .map((id) => tokyoTrainStatusLines[language].find((line) => line.id === id))
    .filter((line): line is NonNullable<typeof line> => Boolean(line));
  const delayed = selected.filter((line) => line.tone !== "green");
  if (delayed.length === 0) {
    return [{ category: "traffic", detail: text.trafficNormalDetail, href: "/tools/train-status", icon: TrainFront, id: "traffic-normal", meta: `09:10 ${text.updated}`, tone: "green", title: text.trafficNormal }];
  }
  return delayed.map((line) => ({
    category: "traffic",
    detail: `${line.name} ${line.status}`,
    href: "/tools/train-status",
    icon: TrainFront,
    id: `traffic-${line.id}`,
    meta: `09:10 ${text.updated}`,
    tone: line.tone === "red" ? "red" : "orange",
    title: line.name,
  }));
}

function buildReminderAlerts(reminders: ReminderItem[], today: string, text: (typeof copy)[keyof typeof copy]): LifeAlert[] {
  return reminders
    .filter((reminder) => {
      const diff = diffDays(today, reminder.date);
      return reminder.type !== "monthlyPayment" && diff >= 0 && diff <= 7;
    })
    .slice(0, 12)
    .map((reminder) => {
      const diff = diffDays(today, reminder.date);
      const category = reminder.type === "monthlyPayment" ? "money" : "life";
      return {
        category,
        detail: reminder.description || formatReminderDetail(reminder, diff, text),
        href: reminder.targetUrl ?? "/reminders",
        icon: getReminderAlertIcon(reminder),
        id: `reminder-${reminder.id}`,
        meta: diff === 0 ? text.todayLabel : diff === 1 ? text.tomorrow : reminder.date.slice(5),
        tone: getReminderAlertTone(reminder),
        title: reminder.title,
      };
    });
}

function buildPaymentSummaryAlerts(reminders: ReminderItem[], today: string, text: (typeof copy)[keyof typeof copy]): LifeAlert[] {
  const payments = reminders.filter((reminder) => {
    const diff = diffDays(today, reminder.date);
    return reminder.type === "monthlyPayment" && diff >= 0 && diff <= 7;
  });
  if (payments.length === 0) return [];
  const dueToday = payments.some((reminder) => reminder.date === today);
  return [{
    category: "money",
    detail: text.paymentSummaryDetail(payments.length),
    href: "/reminders",
    icon: CreditCard,
    id: "payment-summary-week",
    meta: dueToday ? text.todayLabel : payments[0]?.date.slice(5) ?? text.todayLabel,
    tone: payments.length >= 3 || dueToday ? "orange" : "blue",
    title: text.paymentSummaryTitle(payments.length),
  }];
}

function buildWorkHourAlerts(workHours: { total: number; studentLimitEnabled: boolean }, text: (typeof copy)[keyof typeof copy]): LifeAlert[] {
  if (!workHours.studentLimitEnabled || workHours.total < 24) return [];
  const remaining = 28 - workHours.total;
  return [{
    category: "money",
    detail: text.workHourDetail(workHours.total, remaining),
    href: "/tools/work-hours",
    icon: WalletCards,
    id: "work-hours-limit",
    meta: text.todayLabel,
    tone: remaining < 0 ? "red" : "orange",
    title: text.workHourTitle,
  }];
}

function buildVisaAlerts(expiryDate: string, today: string, text: (typeof copy)[keyof typeof copy]): LifeAlert[] {
  if (!expiryDate) {
    return [{ category: "visa", detail: text.visaUnsetDetail, href: "/tools/visa-reminder", icon: FileClock, id: "visa-unset", meta: text.todayLabel, tone: "blue", title: text.visaUnset }];
  }
  const days = diffDays(today, expiryDate);
  if (days < 0) {
    return [{ category: "visa", detail: text.visaUnsetDetail, href: "/tools/visa-reminder", icon: FileClock, id: "visa-expired", meta: text.todayLabel, tone: "red", title: text.visaExpired }];
  }
  if (days <= 90) {
    return [{ category: "visa", detail: text.visaDetail(days), href: "/tools/visa-reminder", icon: FileClock, id: "visa-urgent", meta: text.todayLabel, tone: days <= 30 ? "red" : "orange", title: text.visaUrgent }];
  }
  return [];
}

function readWorkHours(raw: string | null) {
  if (!raw) return { total: 0, studentLimitEnabled: false };
  const parsed = JSON.parse(raw) as Partial<{ hours: Record<string, string>; studentLimitEnabled: boolean }> | Record<string, string>;
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

function formatReminderDetail(reminder: ReminderItem, diff: number, text: (typeof copy)[keyof typeof copy]) {
  const day = diff === 0 ? text.todayLabel : diff === 1 ? text.tomorrow : `${diff} days`;
  return reminder.time ? `${day} ${reminder.time}` : day;
}

function getReminderAlertIcon(reminder: ReminderItem) {
  if (reminder.type === "garbage") return Trash2;
  if (reminder.type === "monthlyPayment") return CreditCard;
  if (reminder.type === "holiday") return CalendarDays;
  if (reminder.type === "residenceCard") return FileClock;
  return Bell;
}

function getReminderAlertTone(reminder: ReminderItem): AlertTone {
  if (reminder.type === "garbage") return "green";
  if (reminder.type === "monthlyPayment") return "blue";
  if (reminder.type === "holiday") return "violet";
  if (reminder.type === "residenceCard") return "red";
  return "orange";
}

function AlertSection({ emptyText, items, title }: { emptyText: string; items: LifeAlert[]; title: string }) {
  return (
    <section className="mt-4">
      <h2 className="mb-2 px-1 text-sm font-black text-slate-800">{title}</h2>
      {items.length === 0 ? (
        <div className="rounded-[22px] border border-slate-200 bg-white p-4 text-sm font-bold text-slate-500 shadow-sm">{emptyText}</div>
      ) : (
        <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_12px_32px_rgba(37,99,235,0.08)]">
          {items.map((item, index) => (
            <AlertRow item={item} key={item.id} last={index === items.length - 1} />
          ))}
        </div>
      )}
    </section>
  );
}

function AlertRow({ item, last }: { item: LifeAlert; last: boolean }) {
  const Icon = item.icon;
  return (
    <Link className={`flex items-start gap-3 bg-white p-4 transition active:bg-blue-50/60 ${last ? "" : "border-b border-slate-100"}`} href={item.href}>
      <span className={`mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${getToneClass(item.tone)}`}>
        <Icon className="h-5 w-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-start justify-between gap-3">
          <span className="text-sm font-black leading-5 text-slate-900">{item.title}</span>
          <span className="shrink-0 text-[11px] font-bold text-slate-400">{item.meta}</span>
        </span>
        <span className="mt-1 block text-xs font-bold leading-5 text-slate-500">{item.detail}</span>
      </span>
      <ChevronRight className="mt-3 h-4 w-4 shrink-0 text-slate-300" />
    </Link>
  );
}

function getToneClass(tone: AlertTone) {
  if (tone === "red") return "bg-red-50 text-red-500";
  if (tone === "orange") return "bg-orange-50 text-orange-500";
  if (tone === "green") return "bg-emerald-50 text-emerald-600";
  if (tone === "violet") return "bg-violet-50 text-violet-600";
  return "bg-blue-50 text-[#2563EB]";
}
