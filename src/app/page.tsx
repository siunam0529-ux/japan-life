"use client";

import { ArrowRight, CalendarDays, ChevronRight, CloudRain, CloudSun, Droplets, Leaf, MapPin, MoreHorizontal, Sparkles, TrainFront, WalletCards } from "lucide-react";
import type { ComponentType, CSSProperties } from "react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { DashboardCard } from "@/components/DashboardCard";
import { dashboardTools } from "@/data/tools";
import { useHomeRailLines } from "@/hooks/useHomeRailLines";
import { useHomeTools } from "@/hooks/useHomeTools";
import { tokyoTrainStatusLines, type TrainStatusLine } from "@/data/trainStatus";
import { useLanguage } from "@/hooks/useLanguage";
import { useMounted } from "@/hooks/useMounted";
import { useReminders } from "@/hooks/useReminders";
import { useUserSettings, type UserSettings } from "@/hooks/useUserSettings";
import { fetchExchangeRates, getMockExchangeRates, type ExchangeCurrency, type ExchangeRateItem } from "@/lib/api/exchange";
import { daysUntilTokyo, fetchJapaneseHolidays, getMockNationalHolidays, getNextHoliday, getTokyoDateString } from "@/lib/api/holidays";
import { diffDays, readVisaReminderState, visaReminderEvent } from "@/lib/reminders";
import { formatDate } from "@/lib/utils/format";
import { fetchWeatherForecast, getWeatherDescription, getWeatherLocationFromSettings, getWeatherLocationName } from "@/lib/weather";
import { fetchOdptTrainStatusLines, mergeOdptLines, odptRefreshIntervalMs, type OdptClientLine } from "@/lib/trainStatus/odptClient";
import type { HolidayItem } from "@/data/holidays";
import type { Language } from "@/lib/i18n/translations";
import type { ReminderItem, ReminderType } from "@/types/reminder";
import type { WeatherForecast, WeatherLocation } from "@/types/weather";

type WorkHoursState = {
  hours: Record<string, string>;
  studentLimitEnabled: boolean;
};
type StatusTone = "blue" | "green" | "orange" | "red" | "violet";
type TodayWatchItem = { detail: string; href: string; tone: StatusTone; value: string };
type OptionalHomeToolText = {
  hint?: Partial<Record<Language, string>>;
  subtitle?: Partial<Record<Language, string>>;
};
const workHoursStorageKey = "japan-life-work-hours";
const workHoursChangeEvent = "japan-life-work-hours-change";
const workHourDayKeys = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
const mustSeeTileBackgrounds: Record<"topLeft" | "topRight" | "bottomLeft" | "bottomRight", CSSProperties> = {
  topLeft: {
    backgroundImage: "url('/images/sakura-tokyo-bg.png')",
    backgroundPosition: "12% 18%",
    backgroundRepeat: "no-repeat",
    backgroundSize: "230%",
  },
  topRight: {
    backgroundImage: "url('/images/sakura-tokyo-bg.png')",
    backgroundPosition: "88% 18%",
    backgroundRepeat: "no-repeat",
    backgroundSize: "230%",
  },
  bottomLeft: {
    backgroundImage: "url('/images/sakura-tokyo-bg.png')",
    backgroundPosition: "18% 78%",
    backgroundRepeat: "no-repeat",
    backgroundSize: "230%",
  },
  bottomRight: {
    backgroundImage: "url('/images/sakura-tokyo-bg.png')",
    backgroundPosition: "82% 78%",
    backgroundRepeat: "no-repeat",
    backgroundSize: "230%",
  },
};
const homePageBackgroundStyle: CSSProperties = {
  background: "linear-gradient(180deg, #eaf6ff 0%, #f7fbff 45%, #ffffff 100%)",
};
const mustSeeTileFrameStyle: CSSProperties = { border: "1px solid rgba(255, 255, 255, 0.72)" };
const mustSeeTileOverlayStyle: CSSProperties = {
  background: "linear-gradient(135deg, rgba(255,255,255,0.68) 0%, rgba(219,234,254,0.36) 55%, rgba(255,255,255,0.22) 100%)",
};
const stableTodayString = "2026-05-21";
const dashboardLabels = {
  "zh-CN": {
    add: "添加",
    allTools: "更多工具",
    backup: "备用",
    employee: "正社员",
    mustSee: "今日必看",
    nextHoliday: "下一个假期",
    partTime: "兼职",
    shops: "推荐店铺",
    takehome: "本月预计到手",
    trainArea: "东京",
    trainSelected: "首页常用线路",
    trainStatus: "常用线路状态",
    upcomingPlans: "之后提醒",
    todayPlans: "今日安排",
    todayRate: "今日汇率",
    todayWatch: "今天注意什么",
    upcomingPayments: "即将缴费",
    tools: "常用工具",
    workHours: "本周工时",
  },
  "zh-TW": {
    add: "新增",
    allTools: "更多工具",
    backup: "備用",
    employee: "正社員",
    mustSee: "今日必看",
    nextHoliday: "下一個假期",
    partTime: "兼職",
    shops: "推薦店鋪",
    takehome: "本月預計到手",
    trainArea: "東京",
    trainSelected: "首頁常用路線",
    trainStatus: "常用路線狀態",
    upcomingPlans: "之後提醒",
    todayPlans: "今日安排",
    todayRate: "今日匯率",
    todayWatch: "今天注意什麼",
    upcomingPayments: "即將繳費",
    tools: "常用工具",
    workHours: "本週工時",
  },
  ja: {
    add: "追加",
    allTools: "もっと見る",
    backup: "予備",
    employee: "正社員",
    mustSee: "今日の確認",
    nextHoliday: "次の祝日",
    partTime: "アルバイト",
    shops: "おすすめ店舗",
    takehome: "今月の手取り目安",
    trainArea: "東京",
    trainSelected: "ホーム表示路線",
    trainStatus: "よく使う路線",
    upcomingPlans: "今後の通知",
    todayPlans: "今日の予定",
    todayRate: "今日の為替",
    todayWatch: "今日の注意",
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
const todayPlanHelper = {
  "zh-CN": "\u53ef\u4ee5\u6dfb\u52a0\u4e0a\u8bfe\u3001\u6253\u5de5\u3001\u7f34\u8d39\u6216\u5783\u573e\u65e5\u63d0\u9192",
  "zh-TW": "\u53ef\u4ee5\u65b0\u589e\u4e0a\u8ab2\u3001\u6253\u5de5\u3001\u7e73\u8cbb\u6216\u5783\u573e\u65e5\u63d0\u9192",
  ja: "\u6388\u696d\u3001\u30d0\u30a4\u30c8\u3001\u652f\u6255\u3044\u3001\u3054\u307f\u306e\u65e5\u3092\u8ffd\u52a0\u3067\u304d\u307e\u3059",
} as const;
const upcomingPlanHelper = {
  "zh-CN": "\u7b7e\u8bc1\u3001\u623f\u79df\u3001\u7f34\u8d39\u90fd\u53ef\u4ee5\u653e\u8fd9\u91cc",
  "zh-TW": "\u7c3d\u8b49\u3001\u623f\u79df\u3001\u7e73\u8cbb\u90fd\u53ef\u4ee5\u653e\u9019\u88e1",
  ja: "\u30d3\u30b6\u3001\u5bb6\u8cc3\u3001\u652f\u6255\u3044\u306e\u63d0\u9192\u3092\u7f6e\u3051\u307e\u3059",
} as const;
const todayPlanActionLabel = {
  "zh-CN": "去日历 →",
  "zh-TW": "去日曆 →",
  ja: "カレンダーへ →",
} as const;
const reminderActionLabel = {
  "zh-CN": "看提醒 →",
  "zh-TW": "看提醒 →",
  ja: "通知を見る →",
} as const;
const reminderTypePriority: Record<ReminderType, number> = { garbage: 0, monthlyPayment: 1, holiday: 2, residenceCard: 3, custom: 4 };
const todayWatchFallbacks: Record<keyof typeof dashboardLabels, { detail: string; tone: StatusTone; value: string }[]> = {
  "zh-CN": [
    { detail: "出门前确认雨伞", tone: "blue", value: "午后可能降雨" },
    { detail: "出门前看一眼常用线路", tone: "blue", value: "确认电车状态" },
    { detail: "把今天最重要的一件事先处理掉", tone: "green", value: "生活节奏确认" },
    { detail: "如果要跑手续，先确认营业时间和证件", tone: "violet", value: "手续前确认" },
  ],
  "zh-TW": [
    { detail: "出門前確認雨傘", tone: "blue", value: "午後可能降雨" },
    { detail: "出門前看一眼常用路線", tone: "blue", value: "確認電車狀態" },
    { detail: "把今天最重要的一件事先處理掉", tone: "green", value: "生活節奏確認" },
    { detail: "如果要跑手續，先確認營業時間和證件", tone: "violet", value: "手續前確認" },
  ],
  ja: [
    { detail: "外出前に傘を確認", tone: "blue", value: "午後は雨の可能性" },
    { detail: "出発前によく使う路線を確認", tone: "blue", value: "電車状況を確認" },
    { detail: "今日いちばん大事なことを先に片づけましょう", tone: "green", value: "生活リズム確認" },
    { detail: "手続きに行く前に営業時間と持ち物を確認", tone: "violet", value: "手続き前確認" },
  ],
} as const;
const manageHomeToolsLabel = {
  "zh-CN": "管理",
  "zh-TW": "管理",
  ja: "管理",
} as const;
const toolIconColors = ["#34C759", "#FF9500", "#007AFF", "#FF2D55", "#AF52DE", "#FFCC00", "#00C7BE", "#FF9F0A", "#5856D6", "#5AC8FA"] as const;

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

function getHomeReminderGroupKey(reminder: ReminderItem) {
  if (reminder.type === "garbage") {
    const parts = reminder.id.split("-");
    const type = parts[4] ?? reminder.title;
    return `garbage:${type}`;
  }
  if (reminder.type === "monthlyPayment") {
    return `monthly:${reminder.id.replace(/^monthly-\d{4}-\d{2}-\d{2}-/, "")}`;
  }
  if (reminder.type === "custom" || reminder.type === "residenceCard") {
    return `${reminder.type}:${reminder.id.replace(/^custom-\d{4}-\d{2}-\d{2}-/, "").replace(/^residenceCard-\d{4}-\d{2}-\d{2}-/, "")}`;
  }
  return `${reminder.type}:${reminder.title}`;
}

function dedupeHomeReminders(reminders: ReminderItem[], today: string) {
  const sorted = sortHomeReminders(reminders, today);
  const seen = new Set<string>();
  return sorted.filter((reminder) => {
    const key = getHomeReminderGroupKey(reminder);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
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

function getTodayWatchItems({
  holidayName,
  language,
  todayString,
  trainStatusLines,
  visaRemainingDays,
  weatherForecast,
  workHours,
}: {
  holidayName: string | null;
  language: keyof typeof dashboardLabels;
  todayString: string;
  trainStatusLines: TrainStatusLine[];
  visaRemainingDays: number | null;
  weatherForecast: WeatherForecast | null;
  workHours: { total: number; studentLimitEnabled: boolean };
}): TodayWatchItem[] {
  const items: TodayWatchItem[] = [];

  if (typeof visaRemainingDays === "number" && visaRemainingDays <= 120) {
    const prepareStage = visaRemainingDays > 90;
    items.push({
      detail: visaRemainingDays < 0 ? (language === "ja" ? "期限切れ" : "已过期") : `${visaRemainingDays} days`,
      href: "/tools/visa-reminder",
      tone: visaRemainingDays <= 30 ? "red" : "orange",
      value: prepareStage
        ? language === "ja"
          ? "更新書類の準備"
          : language === "zh-TW"
            ? "準備在留更新資料"
            : "准备在留更新材料"
        : language === "ja"
          ? "在留更新手続きを確認"
          : language === "zh-TW"
            ? "提醒更新在留"
            : "提醒更新在留",
    });
  }

  if (workHours.studentLimitEnabled && workHours.total >= 24) {
    const remaining = 28 - workHours.total;
    items.push({
      detail:
        remaining < 0
          ? language === "ja"
            ? `${Math.abs(remaining).toFixed(1)}時間超過`
            : `已超出 ${Math.abs(remaining).toFixed(1)} 小时`
          : language === "ja"
            ? `残り ${remaining.toFixed(1)} 時間`
            : `本周还剩 ${remaining.toFixed(1)} 小时`,
      href: "/tools/work-hours",
      tone: remaining < 0 ? "red" : "orange",
      value: language === "ja" ? "28時間ルールに注意" : language === "zh-TW" ? "留學生 28 小時注意" : "留学生 28 小时注意",
    });
  }

  if (holidayName) {
    items.push({
      detail: language === "ja" ? "窓口や配送時間に注意" : language === "zh-TW" ? "注意窗口和配送時間" : "注意窗口和配送时间",
      href: "/tools/holidays",
      tone: "violet",
      value: language === "ja" ? `今日は${holidayName}` : language === "zh-TW" ? `今天是${holidayName}` : `今天是${holidayName}`,
    });
  }

  const trainCareItems = getHomeTrainCareItems(trainStatusLines, language);
  const personalCareItems = getHomePersonalCareItems(language, todayString);
  const primaryItems = [...items, ...trainCareItems];
  const weatherCareItems = primaryItems.length === 0 ? getHomeWeatherCareItems(weatherForecast, language) : [];
  return fillTodayWatchItems([...primaryItems, ...weatherCareItems, ...personalCareItems], language, todayString);
}

function getHomeTrainCareItems(lines: TrainStatusLine[], language: keyof typeof dashboardLabels): TodayWatchItem[] {
  const issueLines = lines.filter((line) => line.tone === "red" || line.tone === "orange").slice(0, 2);
  if (issueLines.length === 0) return [];

  const detail = issueLines.map((line) => `${line.name}: ${line.status}`).join(" / ");
  return [
    {
      detail,
      href: "/tools/train-status",
      tone: issueLines.some((line) => line.tone === "red") ? "red" : "orange",
      value: language === "ja" ? "電車状況を確認" : language === "zh-TW" ? "確認電車狀態" : "确认电车状态",
    },
  ];
}

function fillTodayWatchItems(items: TodayWatchItem[], language: keyof typeof dashboardLabels, todayString: string) {
  const result: TodayWatchItem[] = [];
  const seen = new Set<string>();

  const push = (item: TodayWatchItem) => {
    const key = `${item.href}:${item.value}`;
    if (seen.has(key) || result.length >= 4) return;
    seen.add(key);
    result.push(item);
  };

  items.forEach(push);

  if (result.length < 4) {
    const dayIndex = Math.abs(diffDays("2026-01-01", todayString)) % todayWatchFallbacks[language].length;
    const rotatedFallbacks = [...todayWatchFallbacks[language].slice(dayIndex), ...todayWatchFallbacks[language].slice(0, dayIndex)];
    rotatedFallbacks.forEach((item) => push({ ...item, href: "/life-alerts" }));
  }

  return result.slice(0, 4);
}

function getHomePersonalCareItems(language: keyof typeof dashboardLabels, todayString: string): TodayWatchItem[] {
  const items: Record<keyof typeof dashboardLabels, TodayWatchItem[]> = {
    "zh-CN": [
      { detail: "出门前看一下钥匙、钱包、交通卡和在留卡。", href: "/me", tone: "violet", value: "温馨提示" },
      { detail: "先处理今天最重要的一件事。", href: "/life-alerts", tone: "green", value: "今天慢慢来" },
      { detail: "睡前留 5 分钟整理明天要带的东西。", href: "/reminders", tone: "blue", value: "明天会轻松点" },
      { detail: "跑手续前先确认营业时间和需要的证件。", href: "/tools/procedure-navigator", tone: "orange", value: "出门前确认" },
    ],
    "zh-TW": [
      { detail: "出門前看一下鑰匙、錢包、交通卡和在留卡。", href: "/me", tone: "violet", value: "溫馨提示" },
      { detail: "先處理今天最重要的一件事。", href: "/life-alerts", tone: "green", value: "今天慢慢來" },
      { detail: "睡前留 5 分鐘整理明天要帶的東西。", href: "/reminders", tone: "blue", value: "明天會輕鬆點" },
      { detail: "跑手續前先確認營業時間和需要的證件。", href: "/tools/procedure-navigator", tone: "orange", value: "出門前確認" },
    ],
    ja: [
      { detail: "出かける前に鍵、財布、交通系IC、在留カードを確認。", href: "/me", tone: "violet", value: "ちょっと確認" },
      { detail: "今日いちばん大事なことを先に片づけましょう。", href: "/life-alerts", tone: "green", value: "今日は落ち着いて" },
      { detail: "寝る前に明日の持ち物を5分だけ整理。", href: "/reminders", tone: "blue", value: "明日を楽に" },
      { detail: "手続き前に営業時間と必要書類を確認。", href: "/tools/procedure-navigator", tone: "orange", value: "出発前確認" },
    ],
  };
  const dayIndex = Math.abs(diffDays("2026-01-01", todayString)) % items[language].length;
  return [...items[language].slice(dayIndex), ...items[language].slice(0, dayIndex)];
}

function getHomeWeatherCareItems(weatherForecast: WeatherForecast | null, language: keyof typeof dashboardLabels): TodayWatchItem[] {
  const today = weatherForecast?.daily[0];
  if (!today) return [];

  const items: TodayWatchItem[] = [];
  const current = weatherForecast.current;
  const airQuality = weatherForecast.airQuality;
  const precipitation = today.precipitationProbability;
  const humidity = current?.relativeHumidity ?? null;
  const windSpeed = current?.windSpeed ?? today.windSpeedMax ?? 0;
  const aqi = airQuality?.usAqi ?? null;

  if (precipitation >= 40) {
    items.push({ detail: language === "ja" ? "折りたたみ傘があると安心です。" : "包里放把折叠伞会安心一点。", href: "/tools/weather", tone: "blue", value: language === "ja" ? `降水 ${precipitation}%` : `降水 ${precipitation}%` });
  }
  if (typeof humidity === "number" && humidity >= 75) {
    items.push({ detail: language === "ja" ? "湿度が高めです。換気や除湿を少し意識。" : "湿度偏高，通风或除湿会舒服一些。", href: "/tools/weather", tone: "green", value: language === "ja" ? `湿度 ${humidity}%` : `湿度 ${humidity}%` });
  }
  if (typeof aqi === "number" && aqi > 100) {
    items.push({ detail: language === "ja" ? "空気が少し気になる日です。" : "空气质量有点需要留意。", href: "/tools/weather", tone: "orange", value: `US AQI ${aqi}` });
  }
  if (windSpeed >= 25) {
    items.push({ detail: language === "ja" ? "風が強めです。" : "风有点大，骑车和雨伞注意一下。", href: "/tools/weather", tone: "violet", value: language === "ja" ? `風 ${Math.round(windSpeed)} km/h` : `风 ${Math.round(windSpeed)} km/h` });
  }
  return items;
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

function getHomeReminderClassName(type: ReminderType) {
  if (type === "garbage") return "bg-orange-50 text-[#F97316]";
  if (type === "monthlyPayment") return "bg-sky-50 text-[#2563EB]";
  if (type === "holiday") return "bg-rose-50 text-[#EF4444]";
  if (type === "residenceCard") return "bg-violet-50 text-violet-700";
  return "bg-emerald-50 text-[#22C55E]";
}

function getStatusTone(tone: "blue" | "green" | "orange" | "red" | "violet") {
  const tones = {
    blue: "text-[#2563EB]",
    green: "text-[#22C55E]",
    orange: "text-[#F97316]",
    red: "text-[#EF4444]",
    violet: "text-violet-600",
  };
  return tones[tone];
}

function getPreferredRate(items: ExchangeRateItem[], preferredCurrency: string) {
  const currency = preferredCurrency === "JPY" ? "CNY" : preferredCurrency;
  return items.find((rate) => rate.code === currency) ?? items.find((rate) => rate.code === "CNY") ?? items.find((rate) => rate.code !== "JPY");
}

function getHomePreferredCurrency(settings: UserSettings | null | undefined): ExchangeCurrency {
  if (settings?.status === "japanese") return "USD";
  const currency = (settings?.defaultCurrency ?? settings?.currency ?? "CNY") as ExchangeCurrency;
  return currency === "JPY" ? "CNY" : currency;
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
  const [weatherForecast, setWeatherForecast] = useState<WeatherForecast | null>(null);
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
    window.addEventListener(workHoursChangeEvent, read);
    window.addEventListener(visaReminderEvent, read);
    window.addEventListener("focus", read);
    return () => {
      window.removeEventListener("storage", read);
      window.removeEventListener(workHoursChangeEvent, read);
      window.removeEventListener(visaReminderEvent, read);
      window.removeEventListener("focus", read);
    };
  }, [mounted]);

  return { rateItems, rateSource, rateUpdatedAt, workHours, holidayItems, holidaySource, todayString, visaExpiryDate, weatherForecast, setWeatherForecast };
}

export default function HomePage() {
  const { language, t } = useLanguage();
  const labels = dashboardLabels[language];
  const { selectedRailLineIds } = useHomeRailLines();
  const { selectedToolKeys } = useHomeTools();
  const { loaded, settings } = useUserSettings();
  const { activeReminders, todayReminders } = useReminders();
  const { rateItems, rateSource, rateUpdatedAt, workHours, holidayItems, holidaySource, todayString, visaExpiryDate, weatherForecast, setWeatherForecast } = useDashboardLocalData();
  const [odptLines, setOdptLines] = useState<OdptClientLine[]>([]);

  const onboardingDone = Boolean(settings?.onboardingCompleted);
  const preferredCurrency = getHomePreferredCurrency(settings);
  const preferredRate = useMemo(() => getPreferredRate(rateItems, preferredCurrency), [preferredCurrency, rateItems]);

  const nextHoliday = useMemo(() => {
    return getNextHoliday(holidayItems, todayString);
  }, [holidayItems, todayString]);
  const todayHoliday = useMemo(() => {
    return holidayItems.find((item) => item.date === todayString) ?? null;
  }, [holidayItems, todayString]);
  const nextHolidayDays = nextHoliday ? daysUntilTokyo(nextHoliday.date, todayString) : 0;
  const upcomingReminders = activeReminders.filter((reminder) => reminder.date > todayString);
  const dedupedTodayReminders = dedupeHomeReminders(todayReminders, todayString);
  const todayReminderKeys = new Set(dedupedTodayReminders.map(getHomeReminderGroupKey));
  const dedupedUpcomingReminders = dedupeHomeReminders(upcomingReminders, todayString).filter((reminder) => !todayReminderKeys.has(getHomeReminderGroupKey(reminder)));
  const todayPlanItems = dedupedTodayReminders.slice(0, 2).map((reminder) => toHomeReminderItem(reminder, todayString));
  const upcomingPlanItems = dedupedUpcomingReminders.slice(0, 2).map((reminder) => toHomeReminderItem(reminder, todayString));
  const visaRemainingDays = visaExpiryDate ? diffDays(todayString, visaExpiryDate) : null;
  const selectedHomeTools = selectedToolKeys
    .map((key) => dashboardTools.find((tool) => tool.key === key))
    .filter((tool): tool is (typeof dashboardTools)[number] => Boolean(tool));
  const trainStatusLines = useMemo(() => mergeOdptLines(tokyoTrainStatusLines[language], odptLines, language), [language, odptLines]);
  const selectedRailLines = selectedRailLineIds
    .map((id) => trainStatusLines.find((line) => line.id === id))
    .filter((line): line is TrainStatusLine => Boolean(line));
  const homeRailLines = selectedRailLines.slice(0, 2);
  const featuredRailLines = homeRailLines.length > 0 ? homeRailLines : trainStatusLines.slice(0, 2);
  const featuredRailTone = featuredRailLines.some((line) => line.tone === "red") ? "red" : featuredRailLines.some((line) => line.tone === "orange") ? "orange" : "green";
  const weatherLocation = useMemo(() => getWeatherLocationFromSettings(settings), [settings]);
  const todayWatchItems = getTodayWatchItems({ holidayName: todayHoliday?.title ?? null, language, todayString, trainStatusLines: featuredRailLines, visaRemainingDays, weatherForecast, workHours });

  useEffect(() => {
    let cancelled = false;

    async function loadOdptStatus() {
      const result = await fetchOdptTrainStatusLines();
      if (!cancelled) setOdptLines(result.lines);
    }

    loadOdptStatus();
    const timer = window.setInterval(loadOdptStatus, odptRefreshIntervalMs);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    if (!weatherLocation) {
      setWeatherForecast(null);
      return;
    }
    fetchWeatherForecast(weatherLocation)
      .then((result) => {
        if (!cancelled) setWeatherForecast(result);
      })
      .catch(() => {
        if (!cancelled) setWeatherForecast(null);
      });
    return () => {
      cancelled = true;
    };
  }, [setWeatherForecast, weatherLocation]);

  return (
    <main className="home-dashboard min-h-screen text-[#0F172A]" style={homePageBackgroundStyle}>
      <div className="japan-life-shell mx-auto min-h-screen max-w-[430px] px-4 pb-28 pt-0 shadow-2xl shadow-blue-200/25">
        <AppHeader />

        <div className="mb-[9px] flex items-center justify-between">
          <h2 className="text-[19px] font-[850] leading-6 tracking-normal text-[#061A3A]">{labels.tools}</h2>
          <Link className="flex items-center gap-1 rounded-full bg-white/65 px-2.5 py-1 text-[13px] font-extrabold text-[#1F6FFF] shadow-sm backdrop-blur-xl transition hover:bg-white" href="/home-tools">
            {manageHomeToolsLabel[language]}
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <section className="ios-home-tools rounded-[26px] border border-white/80 bg-white/80 px-4 pb-[14px] pt-4 shadow-[0_14px_32px_rgba(15,76,129,0.09)] backdrop-blur-2xl max-[379px]:px-3.5 max-[379px]:pb-[13px] max-[379px]:pt-3.5">
          <div className="grid grid-cols-5 gap-x-2 gap-y-[13px] max-[379px]:gap-x-1.5 max-[379px]:gap-y-3">
            {selectedHomeTools.map((tool, index) => {
              const toolText = tool as typeof tool & OptionalHomeToolText;
              const hint = toolText.hint?.[language];
              const subtitle = toolText.subtitle?.[language];
              return (
                <CompactToolCard
                  hint={hint}
                  key={tool.key}
                  href={tool.href}
                  icon={tool.icon}
                  iconColor={toolIconColors[index % toolIconColors.length]}
                  subtitle={subtitle}
                  title={tool.title[language]}
                />
              );
            })}
            <CompactToolCard href="/search" icon={MoreHorizontal} iconColor={toolIconColors[9]} title={language === "ja" ? "もっと見る" : "更多工具"} />
          </div>
        </section>

        {loaded && !onboardingDone && (
          <Link href="/onboarding" className="mt-3 block rounded-[18px] border border-emerald-100 bg-emerald-50 p-3 text-emerald-900 shadow-[0_8px_22px_rgba(32,38,34,0.05)]">
            <p className="text-sm font-black">{t.home.settingsCardTitle}</p>
            <p className="mt-1 text-xs font-bold leading-5">{t.home.settingsCardText}</p>
          </Link>
        )}

        <section className="mt-3.5 grid grid-cols-2 gap-2.5 max-[379px]:gap-2">
            <MiniWeatherTile backgroundStyle={mustSeeTileBackgrounds.topLeft} cornerClass="rounded-[20px]" forecast={weatherForecast} language={language} location={weatherLocation} />
            <StatusCard backgroundStyle={mustSeeTileBackgrounds.topRight} cornerClass="rounded-[20px]" href="/tools/exchange" icon={WalletCards} title={labels.todayRate} value={preferredRate ? `JPY/${preferredRate.code} ${formatRateValue(preferredRate)}` : `JPY/${preferredCurrency} --`} detail={rateSource === "frankfurter" ? rateUpdatedAt : labels.backup} tone="blue" />
            <RailStatusCard backgroundStyle={mustSeeTileBackgrounds.bottomLeft} cornerClass="rounded-[20px]" href="/tools/train-status" lines={featuredRailLines} title={labels.trainStatus} tone={featuredRailTone} />
            <StatusCard backgroundStyle={mustSeeTileBackgrounds.bottomRight} cornerClass="rounded-[20px]" href="/tools/holidays" icon={CalendarDays} title={labels.nextHoliday} value={nextHoliday.title} detail={`${formatDate(nextHoliday.date)} / ${nextHolidayDays} days${holidaySource === "mock" ? ` / ${labels.backup}` : ""}`} tone="green" />
        </section>
        <TodayWatchCard items={todayWatchItems} title={labels.todayWatch} />

        <section className="mt-3.5">
          <DashboardCard className="rounded-[26px] border-[rgba(225,232,242,0.9)] bg-white/85 p-[18px] shadow-[0_14px_32px_rgba(15,76,129,0.08)]">
              <div className="grid min-w-0 grid-cols-[1fr_auto_1fr] gap-3.5">
                  <div className="flex min-w-0 flex-col">
                    <span className="mb-2 flex h-[34px] w-[34px] items-center justify-center rounded-full bg-blue-100/65 text-[#2563EB]">
                      <CalendarDays className="h-[17px] w-[17px]" />
                    </span>
                    <p className="text-[13px] font-extrabold leading-[17px] text-[#64748B]">{labels.todayPlans}</p>
                    {todayPlanItems.length > 0 ? (
                      <div className="mt-1 grid gap-1">
                        {todayPlanItems.map((item) => (
                          <Link className={`block truncate rounded-xl px-2 py-1 text-[12px] font-extrabold ${item.className}`} href={item.href} key={item.key}>{item.text}</Link>
                        ))}
                      </div>
                    ) : (
                      <div className="mt-1 min-w-0">
                        <p className="truncate text-[13px] font-extrabold leading-[18px] text-[#263B59]">{todayPlanEmpty[language]}</p>
                        <p className="mt-1 line-clamp-2 text-[10.5px] font-semibold leading-[15px] text-[#7C8DA6]">{todayPlanHelper[language]}</p>
                      </div>
                    )}
                    <Link className="mt-3 inline-flex min-h-8 items-center text-[12px] font-extrabold text-[#1F6FFF]" href="/tools/holidays">
                      {todayPlanActionLabel[language]}
                    </Link>
                  </div>
                  <span className="h-full w-px bg-slate-400/25" />
                  <div className="flex min-w-0 flex-col">
                    <span className="mb-2 flex h-[34px] w-[34px] items-center justify-center rounded-full bg-blue-100/65 text-[#2563EB]">
                      <Sparkles className="h-[17px] w-[17px]" />
                    </span>
                    <p className="text-[13px] font-extrabold leading-[17px] text-[#64748B]">{labels.upcomingPlans}</p>
                    {upcomingPlanItems.length > 0 ? (
                      <div className="mt-1 grid gap-1">
                        {upcomingPlanItems.map((item) => (
                          <Link className={`block truncate rounded-xl px-2 py-1 text-[12px] font-extrabold ${item.className}`} href={item.href} key={item.key}>{item.text}</Link>
                        ))}
                      </div>
                    ) : (
                      <div className="mt-1 min-w-0">
                        <p className="truncate text-[13px] font-extrabold leading-[18px] text-[#263B59]">{upcomingPlanEmpty[language]}</p>
                        <p className="mt-1 line-clamp-2 text-[10.5px] font-semibold leading-[15px] text-[#7C8DA6]">{upcomingPlanHelper[language]}</p>
                      </div>
                    )}
                    <Link className="mt-3 inline-flex min-h-8 items-center text-[12px] font-extrabold text-[#1F6FFF]" href="/reminders">
                      {reminderActionLabel[language]}
                    </Link>
                  </div>
              </div>
            </DashboardCard>
        </section>

      </div>
    </main>
  );
}

function CompactToolCard({
  href,
  hint,
  icon: Icon,
  iconColor,
  iconSlot,
  title,
  subtitle,
}: {
  href: string;
  hint?: string;
  icon: ComponentType<{ className?: string; style?: CSSProperties }>;
  iconColor: string;
  iconSlot?: React.ReactNode;
  subtitle?: string;
  title: string;
}) {
  return (
    <Link href={href} className="ios-home-icon flex min-w-0 flex-col items-center justify-start gap-1.5 text-center transition-all duration-150 active:scale-95">
      {iconSlot ?? (
        <span className="ios-home-icon-tile flex h-[52px] w-[52px] items-center justify-center rounded-[16px] border border-[rgba(210,220,235,0.72)] bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(245,248,255,0.82))] shadow-[0_8px_17px_rgba(15,76,129,0.085)]">
          <Icon className="h-[30px] w-[30px] stroke-[2.35]" style={{ color: iconColor }} />
        </span>
      )}
      <span className="line-clamp-2 max-h-7 min-h-7 max-w-[58px] overflow-hidden text-center text-[11.5px] font-bold leading-[14px] tracking-[-0.1px] text-[#253A58] max-[379px]:text-[11px] max-[379px]:leading-[13px]">{title}</span>
      {subtitle && hint ? <span className="mt-0.5 line-clamp-2 text-[8.5px] font-bold leading-[11px] text-slate-500">{subtitle}</span> : null}
      {hint ? <span className="mt-1 line-clamp-2 rounded-full bg-emerald-50 px-1.5 py-0.5 text-[8.5px] font-black leading-[11px] text-emerald-700">{hint}</span> : null}
      {subtitle && !hint ? <span className="sr-only">{subtitle}</span> : null}
    </Link>
  );
}

function MiniWeatherTile({
  backgroundStyle,
  cornerClass,
  forecast,
  language,
  location,
}: {
  backgroundStyle: CSSProperties;
  cornerClass: string;
  forecast: WeatherForecast | null;
  language: keyof typeof dashboardLabels;
  location: WeatherLocation | null;
}) {
  const text = {
    "zh-CN": { noRegion: "设置地区", open: "打开天气" },
    "zh-TW": { noRegion: "設定地區", open: "打開天氣" },
    ja: { noRegion: "地域設定", open: "天気を見る" },
  }[language];
  const miniText = {
    "zh-CN": { air: "\u7a7a\u6c14\u826f", dateLabel: "5\u670827\u65e5", humidity: "\u6e7f\u5ea6", lunar: "\u519c\u5386 \u56db\u6708\u5341\u4e00", precipitation: "\u964d\u6c34", title: "\u4eca\u65e5\u5929\u6c14" },
    "zh-TW": { air: "\u7a7a\u6c23\u826f", dateLabel: "5\u670827\u65e5", humidity: "\u6fd5\u5ea6", lunar: "\u8fb2\u66c6 \u56db\u6708\u5341\u4e00", precipitation: "\u964d\u6c34", title: "\u4eca\u65e5\u5929\u6c23" },
    ja: { air: "\u7a7a\u6c17\u826f", dateLabel: "5\u670827\u65e5", humidity: "\u6e7f\u5ea6", lunar: "\u65e7\u66a6 \u56db\u6708\u5341\u4e00", precipitation: "\u964d\u6c34", title: "\u4eca\u65e5\u306e\u5929\u6c17" },
  }[language];

  if (!location) {
    return (
      <Link href="/onboarding" className={`ios-status-card relative block h-[150px] min-h-[150px] min-w-0 overflow-hidden bg-blue-50/70 p-3 shadow-[0_12px_26px_rgba(37,99,235,0.12)] transition duration-300 hover:-translate-y-0.5 max-[379px]:h-[144px] max-[379px]:min-h-[144px] max-[379px]:p-2.5 ${cornerClass}`} style={{ ...backgroundStyle, ...mustSeeTileFrameStyle }}>
        <span className="absolute inset-0 z-0 pointer-events-none" style={mustSeeTileOverlayStyle} />
        <div className="relative z-10 flex h-full min-w-0 flex-col justify-between">
          <div className="flex items-center justify-between gap-2">
            <p className="truncate text-[12px] font-extrabold leading-4 text-[#061A3A]">{miniText.title}</p>
            <span className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full bg-white/70 shadow-[0_6px_14px_rgba(15,76,129,0.10)] backdrop-blur-md">
              <MapPin className="h-4 w-4 text-[#2563EB]" />
            </span>
          </div>
          <div className="min-w-0">
            <p className="line-clamp-2 text-[20px] font-extrabold leading-[25px] text-[#061A3A]">{text.noRegion}</p>
            <p className="mt-1 truncate text-[11px] font-bold text-[#263B59]">{text.open}</p>
          </div>
        </div>
      </Link>
    );
  }

  const today = forecast?.daily[0];
  const current = forecast?.current;
  const hasWeather = Boolean(today) || typeof current?.weatherCode === "number";
  const weatherCode = today?.weatherCode ?? current?.weatherCode ?? 0;
  const precipitation = today?.precipitationProbability ?? 0;
  const temperature = hasWeather ? String(Math.round(today?.maxTemperature ?? current?.temperature ?? 0)) : "--";
  const humidity = Math.round(current?.relativeHumidity ?? 45);
  const weatherText = hasWeather ? getWeatherDescription(weatherCode, language) : "--";
  const isRainy = precipitation >= 60 || [51, 53, 55, 61, 63, 65, 80, 81, 82].includes(weatherCode);

  return (
    <Link href="/tools/weather" className={`ios-status-card relative block h-[150px] min-h-[150px] min-w-0 overflow-hidden bg-blue-50/70 p-3 shadow-[0_12px_26px_rgba(37,99,235,0.12)] transition duration-300 hover:-translate-y-0.5 max-[379px]:h-[144px] max-[379px]:min-h-[144px] max-[379px]:p-2.5 ${cornerClass}`} style={{ ...backgroundStyle, ...mustSeeTileFrameStyle }}>
      <span className="absolute inset-0 z-0 pointer-events-none" style={mustSeeTileOverlayStyle} />
      <div className="relative z-10 flex h-full min-w-0 flex-col justify-between gap-1">
        <div className="flex min-w-0 items-start justify-between gap-2">
          <p className="flex min-w-0 items-center gap-1 text-[12px] font-extrabold leading-4 text-[#061A3A]">
            <span className="truncate">{getWeatherLocationName(location, language)}</span>
            <MapPin className="h-3 w-3 shrink-0 text-[#2563EB]" />
          </p>
          <div className="shrink-0 text-right">
            <p className="whitespace-nowrap text-[11px] font-bold leading-[14px] text-[#1F2D45]">{miniText.dateLabel}</p>
            <p className="mt-0.5 whitespace-nowrap text-[8.5px] font-semibold leading-3 text-[#40546F]">{miniText.lunar}</p>
          </div>
        </div>

        <div className="flex min-w-0 items-center justify-between gap-2">
          <p className="text-[34px] font-[850] leading-9 tracking-[-1px] text-[#061A3A] drop-shadow-[0_1px_0_rgba(255,255,255,0.85)]">
            {temperature}
            <span className="align-top text-[18px]">°</span>
          </p>
          <span className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full bg-white/75 shadow-sm backdrop-blur-md">
            {isRainy ? <CloudRain className="h-[18px] w-[18px] text-[#2563EB]" /> : <CloudSun className="h-[18px] w-[18px] text-[#F59E0B]" />}
          </span>
        </div>

        <p className="min-w-0 truncate text-[12px] font-bold leading-[15px] text-[#263B59]">{weatherText} · {miniText.humidity} {humidity}%</p>

        <div className="grid min-w-0 grid-cols-2 gap-1.5">
          <span className="inline-flex h-6 min-w-0 items-center justify-center gap-1 rounded-full bg-white/70 px-[9px] text-[11px] font-extrabold leading-none text-[#1F6FFF] shadow-sm backdrop-blur-md">
            <Droplets className="h-3 w-3 shrink-0" />
            <span className="whitespace-nowrap">{miniText.precipitation} {precipitation}%</span>
          </span>
          <span className="inline-flex h-6 min-w-0 items-center justify-center gap-1 rounded-full bg-white/70 px-[9px] text-[11px] font-extrabold leading-none text-[#11A65C] shadow-sm backdrop-blur-md">
            <Leaf className="h-3 w-3 shrink-0" />
            <span className="whitespace-nowrap">{miniText.air}</span>
          </span>
        </div>
      </div>
    </Link>
  );
}

function StatusCard({
  backgroundStyle,
  cornerClass,
  detail,
  href,
  icon: Icon,
  title,
  tone,
  value,
}: {
  backgroundStyle: CSSProperties;
  cornerClass: string;
  detail: string;
  href: string;
  icon: typeof CalendarDays;
  title: string;
  tone: StatusTone;
  value: string;
}) {
  return (
    <Link href={href} className={`ios-status-card relative h-[150px] min-h-[150px] overflow-hidden bg-blue-50/70 p-3 shadow-[0_12px_26px_rgba(37,99,235,0.12)] transition duration-300 hover:-translate-y-0.5 max-[379px]:h-[144px] max-[379px]:min-h-[144px] max-[379px]:p-2.5 ${cornerClass}`} style={{ ...backgroundStyle, ...mustSeeTileFrameStyle }}>
      <span className="absolute inset-0 z-0 pointer-events-none" style={mustSeeTileOverlayStyle} />
      <div className="relative z-10 flex h-full min-w-0 flex-col justify-between gap-2">
        <div className="flex items-center justify-between gap-1">
          <span className={`flex h-[34px] w-[34px] items-center justify-center rounded-full bg-white/75 shadow-sm backdrop-blur-md ${getStatusTone(tone)}`}>
            <Icon className="h-[18px] w-[18px]" />
          </span>
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/70 text-[#334155] shadow-[0_6px_14px_rgba(15,76,129,0.10)] backdrop-blur-md">
            <ChevronRight className="h-3.5 w-3.5" />
          </span>
        </div>
        <div className="min-w-0">
          <p className="truncate text-[12px] font-extrabold leading-4 text-[#263B59]">{title}</p>
          <h3 className={`mt-1 line-clamp-2 font-[850] tracking-[-0.3px] text-[#061A3A] drop-shadow-[0_1px_0_rgba(255,255,255,0.85)] ${tone === "green" ? "text-[21px] leading-[25px]" : "text-[19px] leading-[23px]"}`}>{value}</h3>
        </div>
        {detail ? (
          <p className="line-clamp-1 h-6 rounded-full bg-white/70 px-2.5 text-[10.5px] font-extrabold leading-6 text-[#263B59] shadow-sm backdrop-blur-md">{detail}</p>
        ) : null}
      </div>
    </Link>
  );
}

function RailStatusCard({
  backgroundStyle,
  cornerClass,
  href,
  lines,
  title,
  tone,
}: {
  backgroundStyle: CSSProperties;
  cornerClass: string;
  href: string;
  lines: TrainStatusLine[];
  title: string;
  tone: StatusTone;
}) {
  return (
    <Link href={href} className={`ios-status-card relative h-[150px] min-h-[150px] overflow-hidden bg-blue-50/70 p-3 shadow-[0_12px_26px_rgba(37,99,235,0.12)] transition duration-300 hover:-translate-y-0.5 max-[379px]:h-[144px] max-[379px]:min-h-[144px] max-[379px]:p-2.5 ${cornerClass}`} style={{ ...backgroundStyle, ...mustSeeTileFrameStyle }}>
      <span className="absolute inset-0 z-0 pointer-events-none" style={mustSeeTileOverlayStyle} />
      <div className="relative z-10 flex h-full min-w-0 flex-col justify-between gap-1.5">
        <div className="flex items-center justify-between gap-1">
          <span className={`flex h-[34px] w-[34px] items-center justify-center rounded-full bg-white/75 shadow-sm backdrop-blur-md ${getStatusTone(tone)}`}>
            <TrainFront className="h-[18px] w-[18px]" />
          </span>
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/70 text-[#334155] shadow-[0_6px_14px_rgba(15,76,129,0.10)] backdrop-blur-md">
            <ChevronRight className="h-3.5 w-3.5" />
          </span>
        </div>
        <p className="truncate text-[12px] font-extrabold leading-4 text-[#061A3A] drop-shadow-[0_1px_0_rgba(255,255,255,0.85)]">{title}</p>
        <div className="grid min-w-0 gap-1.5">
          {lines.map((line) => (
            <div className="flex h-7 min-w-0 items-center justify-between gap-1.5 rounded-full border border-white/55 bg-white/75 px-2.5 shadow-sm backdrop-blur-md" key={line.id}>
              <p className="truncate text-[11.5px] font-extrabold leading-4 text-[#061A3A]">{line.name}</p>
              <span className="flex shrink-0 items-center gap-0.5">
                <span className={`whitespace-nowrap text-[11px] font-[850] leading-4 ${line.tone === "green" ? "text-[#16A34A]" : line.tone === "red" ? "text-red-700" : "text-orange-700"}`}>
                  {line.status}
                </span>
                <ChevronRight className="h-3 w-3 text-[#94A3B8]" />
              </span>
            </div>
          ))}
        </div>
      </div>
    </Link>
  );
}

function TodayWatchCard({ items, title }: { items: TodayWatchItem[]; title: string }) {
  return (
    <section
      className="relative mt-3.5 overflow-hidden rounded-[26px] border border-white/80 bg-[linear-gradient(180deg,rgba(239,248,255,0.88),rgba(255,255,255,0.76))] p-4 shadow-[0_14px_32px_rgba(15,76,129,0.09)] backdrop-blur-xl"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex h-[34px] w-[34px] items-center justify-center rounded-full bg-white/75 text-[#AF52DE] shadow-sm backdrop-blur-sm">
            <Sparkles className="h-[17px] w-[17px]" />
          </span>
          <div>
            <p className="text-[15px] font-[850] leading-5 text-[#061A3A] drop-shadow-[0_1px_0_rgba(255,255,255,0.85)]">{title}</p>
          </div>
        </div>
        <Link href="/life-alerts" className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full bg-white/70 text-[#334155] shadow-sm backdrop-blur-sm" aria-label={title}>
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2.5">
        {items.slice(0, 4).map((item) => (
          <Link className={`min-h-[58px] min-w-0 rounded-[16px] border border-white/65 px-[11px] py-2.5 shadow-[0_8px_18px_rgba(15,76,129,0.06)] backdrop-blur-md transition duration-200 active:scale-[0.98] ${getTodayWatchRowClass(item.tone)}`} href={item.href} key={`${item.href}-${item.value}`}>
            <div className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-current" />
              <p className="min-w-0 truncate text-[12px] font-[850] leading-4 text-[#061A3A]">{item.value}</p>
            </div>
            <p className="mt-1 line-clamp-2 text-[10.5px] font-semibold leading-[15px] text-[#40546F]">{item.detail}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}

function getTodayWatchRowClass(tone: StatusTone) {
  if (tone === "red") return "bg-white/75 text-[#EF4444]";
  if (tone === "orange") return "bg-white/75 text-[#F97316]";
  if (tone === "green") return "bg-white/75 text-[#16A34A]";
  if (tone === "violet") return "bg-white/75 text-[#7C3AED]";
  return "bg-white/75 text-[#2563EB]";
}
