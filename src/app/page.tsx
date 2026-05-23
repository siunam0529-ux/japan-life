"use client";

import { CalendarDays, ChevronRight, Clock3, FileClock, GitCompare, MapPin, MoreHorizontal, Sparkles, TrainFront, WalletCards } from "lucide-react";
import type { ComponentType, CSSProperties } from "react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { DashboardCard } from "@/components/DashboardCard";
import { RailLineBadge } from "@/components/RailLineBadge";
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
import { fetchWeatherForecast, getWeatherLocationFromSettings } from "@/lib/weather";
import type { HolidayItem } from "@/data/holidays";
import type { ReminderItem, ReminderType } from "@/types/reminder";
import type { WeatherForecast } from "@/types/weather";

type WorkHoursState = {
  hours: Record<string, string>;
  studentLimitEnabled: boolean;
};
type StatusTone = "blue" | "green" | "orange" | "red" | "violet";
type TodayWatchItem = { detail: string; href: string; tone: StatusTone; value: string };
type WeatherAlertSettings = { rain: boolean; heat: boolean; typhoon: boolean; snow: boolean };

const workHoursStorageKey = "japan-life-work-hours";
const workHoursChangeEvent = "japan-life-work-hours-change";
const weatherAlertStorageKey = "japan-life:weather-alert-settings";
const workHourDayKeys = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
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
const viewAllRemindersLabel = {
  "zh-CN": "查看全部 →",
  "zh-TW": "查看全部 →",
  ja: "すべて見る →",
} as const;
const reminderTypePriority: Record<ReminderType, number> = { garbage: 0, monthlyPayment: 1, holiday: 2, residenceCard: 3, custom: 4 };
const todayWatchFallbacks: Record<keyof typeof dashboardLabels, { detail: string; tone: StatusTone; value: string }[]> = {
  "zh-CN": [
    { detail: "出门前确认雨伞", tone: "blue", value: "午后可能降雨" },
    { detail: "回家路上留意替代路线", tone: "orange", value: "中央线可能延误" },
    { detail: "晾衣和通勤注意", tone: "orange", value: "花粉偏高" },
    { detail: "提前确认阳台和雨具", tone: "red", value: "台风接近" },
  ],
  "zh-TW": [
    { detail: "出門前確認雨傘", tone: "blue", value: "午後可能降雨" },
    { detail: "回家路上留意替代路線", tone: "orange", value: "中央線可能延誤" },
    { detail: "曬衣和通勤注意", tone: "orange", value: "花粉偏高" },
    { detail: "提前確認陽台和雨具", tone: "red", value: "颱風接近" },
  ],
  ja: [
    { detail: "外出前に傘を確認", tone: "blue", value: "午後は雨の可能性" },
    { detail: "帰宅時は迂回も確認", tone: "orange", value: "中央線に遅れの可能性" },
    { detail: "洗濯物と通勤に注意", tone: "orange", value: "花粉が多め" },
    { detail: "ベランダと雨具を確認", tone: "red", value: "台風接近" },
  ],
} as const;
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
const toolIconColors = ["#34C759", "#FF9500", "#007AFF", "#FF2D55", "#AF52DE", "#FFCC00", "#00C7BE", "#FF9F0A", "#5856D6", "#5AC8FA"] as const;
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
  visaRemainingDays,
  weatherForecast,
  workHours,
}: {
  holidayName: string | null;
  language: keyof typeof dashboardLabels;
  todayString: string;
  visaRemainingDays: number | null;
  weatherForecast: WeatherForecast | null;
  workHours: { total: number; studentLimitEnabled: boolean };
}): TodayWatchItem[] {
  const items: TodayWatchItem[] = [];

  if (typeof visaRemainingDays === "number" && visaRemainingDays <= 30) {
    items.push({
      detail: visaRemainingDays < 0 ? (language === "ja" ? "期限切れ" : "已过期") : `${visaRemainingDays} days`,
      href: "/tools/visa-reminder",
      tone: "red",
      value: language === "ja" ? "在留期限を確認" : language === "zh-TW" ? "確認在留期限" : "确认在留期限",
    });
  }

  if (workHours.studentLimitEnabled && workHours.total >= 24) {
    const remaining = 28 - workHours.total;
    items.push({
      detail:
        remaining < 0
          ? language === "ja"
            ? `${Math.abs(remaining).toFixed(1)}時間超過`
            : `已超过 ${Math.abs(remaining).toFixed(1)} 小时`
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

  const weatherCareItems = getHomeWeatherCareItems(weatherForecast, language);
  const personalCareItems = getHomePersonalCareItems(language, todayString);
  return fillTodayWatchItems([...items, ...weatherCareItems, ...personalCareItems], language, todayString);
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
      { detail: "出门前看一下钥匙、钱包、交通卡和在留卡，少一点临时慌张。", href: "/me", tone: "violet", value: "出门前小确认" },
      { detail: "今天没有紧急事项时，就按自己的节奏来，先处理最重要的一件。", href: "/life-alerts", tone: "green", value: "今天慢慢来" },
      { detail: "睡前留 5 分钟整理明天要带的东西，明早会轻松很多。", href: "/reminders", tone: "blue", value: "给明天留余地" },
      { detail: "如果今天要跑手续，先确认营业时间和需要的证件。", href: "/tools/procedure-navigator", tone: "orange", value: "手续前确认" },
    ],
    "zh-TW": [
      { detail: "出門前看一下鑰匙、錢包、交通卡和在留卡，少一點臨時慌張。", href: "/me", tone: "violet", value: "出門前小確認" },
      { detail: "今天沒有緊急事項時，就按自己的節奏來，先處理最重要的一件。", href: "/life-alerts", tone: "green", value: "今天慢慢來" },
      { detail: "睡前留 5 分鐘整理明天要帶的東西，明早會輕鬆很多。", href: "/reminders", tone: "blue", value: "給明天留餘地" },
      { detail: "如果今天要跑手續，先確認營業時間和需要的證件。", href: "/tools/procedure-navigator", tone: "orange", value: "手續前確認" },
    ],
    ja: [
      { detail: "出かける前に鍵、財布、交通系IC、在留カードを軽く確認しましょう。", href: "/me", tone: "violet", value: "外出前チェック" },
      { detail: "急ぎの予定がなければ、自分のペースで大事なことを一つずつ進めましょう。", href: "/life-alerts", tone: "green", value: "今日は無理せず" },
      { detail: "寝る前に明日の持ち物を5分だけ整えると、朝が楽になります。", href: "/reminders", tone: "blue", value: "明日の準備" },
      { detail: "手続きに行く日は、営業時間と必要書類を先に確認しておきましょう。", href: "/tools/procedure-navigator", tone: "orange", value: "手続き前確認" },
    ],
  };
  const dayIndex = Math.abs(diffDays("2026-01-01", todayString)) % items[language].length;
  return [...items[language].slice(dayIndex), ...items[language].slice(0, dayIndex)];
}

function getHomeWeatherCareItems(weatherForecast: WeatherForecast | null, language: keyof typeof dashboardLabels): TodayWatchItem[] {
  const today = weatherForecast?.daily[0];
  if (!today) return [];

  const items: TodayWatchItem[] = [];
  const primary = getHomeWeatherCareItem(weatherForecast, language);
  if (primary) items.push(primary);

  const current = weatherForecast.current;
  const airQuality = weatherForecast.airQuality;
  const precipitation = today.precipitationProbability;
  const maxTemperature = today.maxTemperature;
  const minTemperature = today.minTemperature;
  const humidity = current?.relativeHumidity ?? null;
  const windSpeed = current?.windSpeed ?? today.windSpeedMax ?? 0;
  const aqi = airQuality?.usAqi ?? null;

  if (typeof aqi === "number") {
    items.push({
      detail:
        aqi > 100
          ? language === "ja"
            ? "空気が少し気になる日です。長時間の外出は様子を見ながらにしましょう。"
            : language === "zh-TW"
              ? "空氣品質有點需要留意，長時間在戶外可以稍微保守一點。"
              : "空气质量有点需要留意，长时间在户外可以稍微保守一点。"
          : language === "ja"
            ? "空気は比較的落ち着いています。外出や散歩もしやすい状態です。"
            : language === "zh-TW"
              ? "空氣狀況比較穩定，外出或散步會舒服一些。"
              : "空气状况比较稳定，外出或散步会舒服一些。",
      href: "/tools/weather",
      tone: aqi > 100 ? "orange" : "green",
      value: language === "ja" ? `US AQI ${aqi}` : `空气 US AQI ${aqi}`,
    });
  }

  if (typeof humidity === "number") {
    items.push({
      detail:
        humidity >= 70
          ? language === "ja"
            ? "湿度が高めです。部屋の換気や除湿を少し意識すると過ごしやすいです。"
            : language === "zh-TW"
              ? "濕度偏高，房間通風或除濕一下會舒服很多。"
              : "湿度偏高，房间通风或除湿一下会舒服很多。"
          : language === "ja"
            ? "湿度は重すぎません。洗濯や換気のタイミングを見てもよさそうです。"
            : language === "zh-TW"
              ? "濕度不算重，可以看看洗衣服和通風的時機。"
              : "湿度不算重，可以看看洗衣服和通风的时机。",
      href: "/tools/weather",
      tone: humidity >= 70 ? "green" : "blue",
      value: language === "ja" ? `湿度 ${humidity}%` : `湿度 ${humidity}%`,
    });
  }

  items.push({
    detail:
      precipitation >= 40
        ? language === "ja"
          ? "降水確率が少しあります。折りたたみ傘があると安心です。"
          : language === "zh-TW"
            ? "有一點下雨機率，包裡放把折疊傘會安心。"
            : "有一点下雨概率，包里放把折叠伞会安心。"
        : language === "ja"
          ? "雨の心配は比較的少なめです。予定は組みやすそうです。"
          : language === "zh-TW"
            ? "下雨壓力比較小，今天的安排會比較好掌握。"
            : "下雨压力比较小，今天的安排会比较好掌握。",
    href: "/tools/weather",
    tone: precipitation >= 40 ? "blue" : "green",
    value: language === "ja" ? `降水 ${precipitation}%` : `降水 ${precipitation}%`,
  });

  items.push({
    detail:
      windSpeed >= 25
        ? language === "ja"
          ? "風が強めです。自転車、傘、ベランダの物に少し注意しましょう。"
          : language === "zh-TW"
            ? "風比較大，騎車、雨傘和陽台物品都稍微注意一下。"
            : "风比较大，骑车、雨伞和阳台物品都稍微注意一下。"
        : language === "ja"
          ? "風は極端ではありません。外の予定は進めやすそうです。"
          : language === "zh-TW"
            ? "風不算誇張，外出的安排比較好進行。"
            : "风不算夸张，外出的安排比较好进行。",
    href: "/tools/weather",
    tone: windSpeed >= 25 ? "violet" : "blue",
    value: language === "ja" ? `風 ${Math.round(windSpeed)} km/h` : `风 ${Math.round(windSpeed)} km/h`,
  });

  items.push({
    detail:
      language === "ja"
        ? `最高 ${Math.round(maxTemperature)}° / 最低 ${Math.round(minTemperature)}°。服装と帰宅時間を少し調整しましょう。`
        : language === "zh-TW"
          ? `最高 ${Math.round(maxTemperature)}° / 最低 ${Math.round(minTemperature)}°，衣服和回家時間可以稍微配合一下。`
          : `最高 ${Math.round(maxTemperature)}° / 最低 ${Math.round(minTemperature)}°，衣服和回家时间可以稍微配合一下。`,
    href: "/tools/weather",
    tone: maxTemperature >= 30 ? "orange" : minTemperature <= 5 ? "blue" : "green",
    value: language === "ja" ? "今日の気温" : language === "zh-TW" ? "今日溫度" : "今日温度",
  });

  return items;
}

function getHomeWeatherCareItem(weatherForecast: WeatherForecast | null, language: keyof typeof dashboardLabels): TodayWatchItem | null {
  const today = weatherForecast?.daily[0];
  if (!today) return null;

  const current = weatherForecast.current;
  const airQuality = weatherForecast.airQuality;
  const precipitation = today.precipitationProbability;
  const maxTemperature = today.maxTemperature;
  const apparentTemperature = current?.apparentTemperature ?? today.apparentMaxTemperature ?? maxTemperature;
  const humidity = current?.relativeHumidity ?? null;
  const windSpeed = current?.windSpeed ?? today.windSpeedMax ?? 0;
  const aqi = airQuality?.usAqi ?? null;

  if (precipitation >= 50 || (today.precipitationSum ?? 0) > 2) {
    return {
      detail: language === "ja" ? "傘と靴を確認してから出かけると安心です" : language === "zh-TW" ? "出門前帶傘，鞋子也選不怕濕的比較安心" : "出门前带伞，鞋子也选不怕湿的比较安心",
      href: "/tools/weather",
      tone: "blue",
      value: language === "ja" ? "今日は雨に注意" : language === "zh-TW" ? "今天注意下雨" : "今天注意下雨",
    };
  }

  if (maxTemperature >= 30 || apparentTemperature >= 30) {
    return {
      detail: language === "ja" ? "水分補給と日差し対策を少し意識しましょう" : language === "zh-TW" ? "記得補水，長時間外出避開正午會舒服一點" : "记得补水，长时间外出避开正午会舒服一点",
      href: "/tools/weather",
      tone: "orange",
      value: language === "ja" ? "今日は暑さ対策" : language === "zh-TW" ? "今天注意防暑" : "今天注意防暑",
    };
  }

  if (typeof aqi === "number" && aqi > 100) {
    return {
      detail: language === "ja" ? "屋外に長くいる予定ならマスクも検討してください" : language === "zh-TW" ? "如果要長時間在戶外，敏感體質可以準備口罩" : "如果要长时间在户外，敏感体质可以准备口罩",
      href: "/tools/weather",
      tone: "orange",
      value: language === "ja" ? "空気が少し気になる日" : language === "zh-TW" ? "空氣品質要留意" : "空气质量要留意",
    };
  }

  if (windSpeed >= 25) {
    return {
      detail: language === "ja" ? "自転車やベランダの洗濯物に少し注意しましょう" : language === "zh-TW" ? "騎車和陽台衣物稍微留意一下" : "骑车和阳台衣物稍微留意一下",
      href: "/tools/weather",
      tone: "violet",
      value: language === "ja" ? "今日は風が強め" : language === "zh-TW" ? "今天風有點大" : "今天风有点大",
    };
  }

  if (typeof humidity === "number" && humidity >= 75) {
    return {
      detail: language === "ja" ? "洗濯物は乾きにくいかもしれません" : language === "zh-TW" ? "洗衣服可能比較不容易乾，室內除濕會舒服點" : "洗衣服可能比较不容易干，室内除湿会舒服点",
      href: "/tools/weather",
      tone: "green",
      value: language === "ja" ? "湿度が高めです" : language === "zh-TW" ? "今天濕度偏高" : "今天湿度偏高",
    };
  }

  return {
    detail: language === "ja" ? "天気は安定しています。予定を組みやすい日です" : language === "zh-TW" ? "天氣比較穩定，適合正常安排出門和生活節奏" : "天气比较稳定，适合正常安排出门和生活节奏",
    href: "/tools/weather",
    tone: "green",
    value: language === "ja" ? "今日は過ごしやすい日" : language === "zh-TW" ? "今天適合正常安排" : "今天适合正常安排",
  };
}

function getHomeWeatherWatchItems({
  language,
  weatherForecast,
  weatherSettings,
}: {
  language: keyof typeof dashboardLabels;
  weatherForecast: WeatherForecast | null;
  weatherSettings: WeatherAlertSettings;
}): TodayWatchItem[] {
  return [];
  /*
  const today = weatherForecast?.daily[0];
  if (!today) return [];
  const items: TodayWatchItem[] = [];
  const current = weatherForecast?.current;
  const gusts = current?.windGusts ?? today.windGustsMax ?? 0;
  const windSpeed = current?.windSpeed ?? today.windSpeedMax ?? 0;

  if (weatherSettings.typhoon && ([95, 96, 99].includes(today.weatherCode) || gusts >= 45 || windSpeed >= 35)) {
    items.push({
      detail: language === "ja" ? "公式警報と移動時間を確認" : language === "zh-TW" ? "確認官方預警和出行時間" : "确认官方预警和出行时间",
      href: "/tools/weather",
      tone: "red",
      value: language === "ja" ? "強風・雷雨に注意" : language === "zh-TW" ? "注意強風雷雨" : "注意强风雷雨",
    });
  }

  if (weatherSettings.snow && ([71, 73, 75, 77, 85, 86].includes(today.weatherCode) || (today.snowfallSum ?? 0) > 0)) {
    items.push({
      detail: language === "ja" ? "足元と交通状況に注意" : language === "zh-TW" ? "注意路面濕滑和交通狀況" : "注意路面湿滑和交通状况",
      href: "/tools/weather",
      tone: "blue",
      value: language === "ja" ? "雪の可能性" : language === "zh-TW" ? "可能有降雪" : "可能有降雪",
    });
  }

  if (weatherSettings.heat && today.maxTemperature >= 30) {
    items.push({
      detail: language === "ja" ? "水分補給を忘れずに" : language === "zh-TW" ? "注意補水，避免長時間曝曬" : "注意补水，避免长时间暴晒",
      href: "/tools/weather",
      tone: "orange",
      value: language === "ja" ? "高温に注意" : language === "zh-TW" ? "高溫提醒" : "高温提醒",
    });
  }

  if (weatherSettings.rain && today.precipitationProbability >= 50) {
    items.push({
      detail: language === "ja" ? "傘を持って出かけましょう" : language === "zh-TW" ? "出門建議帶傘" : "出门建议带伞",
      href: "/tools/weather",
      tone: "blue",
      value: language === "ja" ? "雨の可能性" : language === "zh-TW" ? "可能下雨" : "可能下雨",
    });
  }

  return items;
  */
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
    amber: "from-amber-200 to-orange-200 text-[#EA580C]",
    blue: "from-blue-200 to-sky-200 text-[#2563EB]",
    cyan: "from-cyan-200 to-teal-200 text-[#0891B2]",
    green: "from-green-200 to-emerald-200 text-[#16A34A]",
    orange: "from-orange-200 to-amber-200 text-[#F97316]",
    pink: "from-pink-200 to-rose-200 text-[#DB2777]",
    purple: "from-purple-200 to-fuchsia-200 text-[#7C3AED]",
    sky: "from-sky-200 to-blue-200 text-[#2563EB]",
    violet: "from-violet-200 to-indigo-200 text-[#7C3AED]",
    yellow: "from-yellow-200 to-orange-200 text-[#D97706]",
  };
  return tones[tone];
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
  const [weatherForecast, setWeatherForecast] = useState<WeatherForecast | null>(null);
  const [weatherSettings, setWeatherSettings] = useState<WeatherAlertSettings>(() => readWeatherAlertSettings());
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
        setWeatherSettings(readWeatherAlertSettings());
      } catch {
        setWorkHours({ total: 0, studentLimitEnabled: false });
        setVisaExpiryDate("");
        setWeatherSettings({ rain: false, heat: false, typhoon: false, snow: false });
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

  return { rateItems, rateSource, rateUpdatedAt, workHours, holidayItems, holidaySource, todayString, visaExpiryDate, weatherForecast, weatherSettings, setWeatherForecast };
}

function readWeatherAlertSettings(): WeatherAlertSettings {
  if (typeof window === "undefined") return { rain: false, heat: false, typhoon: false, snow: false };
  try {
    const raw = window.localStorage.getItem(weatherAlertStorageKey);
    if (!raw) return { rain: false, heat: false, typhoon: false, snow: false };
    const parsed = JSON.parse(raw) as Partial<WeatherAlertSettings>;
    return {
      rain: typeof parsed.rain === "boolean" ? parsed.rain : false,
      heat: typeof parsed.heat === "boolean" ? parsed.heat : false,
      typhoon: typeof parsed.typhoon === "boolean" ? parsed.typhoon : false,
      snow: typeof parsed.snow === "boolean" ? parsed.snow : false,
    };
  } catch {
    return { rain: false, heat: false, typhoon: false, snow: false };
  }
}

export default function HomePage() {
  const { language, t } = useLanguage();
  const labels = dashboardLabels[language];
  const { selectedRailLineIds } = useHomeRailLines();
  const { selectedToolKeys } = useHomeTools();
  const { loaded, settings } = useUserSettings();
  const { activeReminders, todayReminders } = useReminders();
  const { rateItems, rateSource, rateUpdatedAt, workHours, holidayItems, holidaySource, todayString, visaExpiryDate, weatherForecast, weatherSettings, setWeatherForecast } = useDashboardLocalData();

  const onboardingDone = Boolean(settings?.onboardingCompleted);
  const preferredCurrency = (settings?.defaultCurrency ?? settings?.currency ?? "CNY") as ExchangeCurrency;
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
  const visaCountdownLabel = getVisaCountdownLabel(visaRemainingDays);
  const selectedHomeTools = selectedToolKeys
    .map((key) => dashboardTools.find((tool) => tool.key === key))
    .filter((tool): tool is (typeof dashboardTools)[number] => Boolean(tool));
  const selectedRailLines = selectedRailLineIds
    .map((id) => tokyoTrainStatusLines[language].find((line) => line.id === id))
    .filter((line): line is (typeof tokyoTrainStatusLines)[typeof language][number] => Boolean(line));
  const weatherLocation = useMemo(() => getWeatherLocationFromSettings(settings), [settings]);
  const todayWatchItems = getTodayWatchItems({ holidayName: todayHoliday?.title ?? null, language, todayString, visaRemainingDays, weatherForecast, workHours });

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
    <main className="home-dashboard min-h-screen bg-[#F5F5F7] text-[#0F172A]">
      <div className="japan-life-shell mx-auto min-h-screen max-w-[430px] bg-[#F5F5F7] px-4 pb-4 pt-4 shadow-2xl shadow-blue-200/30">
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
        <section className="grid grid-cols-3 gap-2.5">
          <StatusCard href="/tools/holidays" icon={CalendarDays} title={labels.nextHoliday} value={nextHoliday.title} detail={`${formatDate(nextHoliday.date)} / ${nextHolidayDays} days${holidaySource === "mock" ? ` / ${labels.backup}` : ""}`} tone="green" />
          <StatusCard href="#train-status" icon={TrainFront} title={labels.trainStatus} value={language === "ja" ? "中央線 遅延" : "中央线 延误"} detail={language === "ja" ? "約15分" : "约 15 分钟"} tone="orange" />
          <StatusCard href="/tools/exchange" icon={WalletCards} title={labels.todayRate} value={preferredRate ? `JPY/${preferredRate.code} ${formatRateValue(preferredRate)}` : "JPY/CNY --"} detail={rateSource === "frankfurter" ? rateUpdatedAt : labels.backup} tone="blue" />
        </section>
        <TodayWatchCard items={todayWatchItems} title={labels.todayWatch} />

        <SectionHeader title={labels.tools} action={manageHomeToolsLabel[language]} href="/home-tools" />
        <section className="ios-home-tools rounded-[30px] border border-black/5 bg-white/90 p-5 shadow-[0_4px_20px_rgba(0,0,0,0.04)] backdrop-blur-xl">
          <div className="grid grid-cols-5 gap-x-4 gap-y-5">
          {selectedHomeTools.map((tool, index) => {
            return (
              <CompactToolCard
                key={tool.key}
                href={tool.href}
                icon={tool.icon}
                iconColor={toolIconColors[index % toolIconColors.length]}
                title={tool.title[language]}
                toneClass={getToolIconTone(index)}
                iconSlot={tool.key === "visaReminder" && visaCountdownLabel ? <VisaCountdownIcon daysLabel={visaCountdownLabel} compact /> : undefined}
              />
            );
          })}
          <CompactToolCard href="/search" icon={MoreHorizontal} iconColor={toolIconColors[9]} title={language === "ja" ? "もっと" : language === "zh-TW" ? "更多工具" : "更多工具"} toneClass={getToolIconTone(9)} />
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
                    <RailLineBadge line={line} size="md" />
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

      </div>
    </main>
  );
}

function VisaCountdownIcon({ compact: forceCompact = false, daysLabel }: { compact?: boolean; daysLabel: string }) {
  return (
    <span
      className={`${forceCompact ? "h-14 w-14" : "mb-3 h-14 w-14"} ios-home-icon-tile relative flex items-center justify-center rounded-[18px] border border-black/5 bg-[#F2F2F7] text-[#007AFF] shadow-sm`}
    >
      <FileClock className="h-6 w-6 text-[#007AFF]" />
      <span
        className="absolute right-0.5 top-0.5 z-10 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[9px] font-black leading-none text-white shadow-sm"
        style={{ background: "#F97316" }}
      >
        {daysLabel}
      </span>
    </span>
  );
}

function CompactToolCard({
  href,
  icon: Icon,
  iconColor,
  iconSlot,
  title,
  toneClass,
}: {
  href: string;
  icon: ComponentType<{ className?: string; style?: CSSProperties }>;
  iconColor: string;
  iconSlot?: React.ReactNode;
  title: string;
  toneClass: string;
}) {
  return (
    <Link href={href} className="ios-home-icon flex min-w-0 flex-col items-center text-center transition-all duration-150 active:scale-95">
      {iconSlot ?? (
        <span className="ios-home-icon-tile flex h-14 w-14 items-center justify-center rounded-[18px] border border-black/5 bg-[#F2F2F7] shadow-sm">
          <Icon className="h-6 w-6" style={{ color: iconColor }} />
        </span>
      )}
      <span className="mt-2 line-clamp-2 min-h-8 text-[12px] font-medium leading-4 text-slate-700">{title}</span>
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
  tone: StatusTone;
  value: string;
}) {
  return (
    <Link href={href} className={`ios-status-card min-h-[106px] rounded-[22px] border border-white/60 bg-gradient-to-br ${getStatusTone(tone)} p-3 shadow-[0_12px_28px_rgba(37,99,235,0.08)] transition duration-300 hover:-translate-y-0.5`}>
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

function TodayWatchCard({ items, title }: { items: TodayWatchItem[]; title: string }) {
  const primary = items[0];
  return (
    <Link
      href="/life-alerts"
      className="mt-2.5 block rounded-[26px] border border-white/70 bg-white p-4 shadow-[0_14px_34px_rgba(37,99,235,0.08)] transition duration-300 hover:-translate-y-0.5"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#F2F2F7] text-[#AF52DE] shadow-sm">
            <Sparkles className="h-5 w-5" />
          </span>
          <div>
            <p className="text-xs font-black text-[#64748B]">{title}</p>
            <h3 className="mt-0.5 text-base font-black text-[#0F172A]">{primary?.value ?? title}</h3>
          </div>
        </div>
        <ChevronRight className="h-4 w-4 shrink-0 text-[#94A3B8]" />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        {items.slice(0, 4).map((item) => (
          <div className={`min-h-[74px] rounded-2xl border px-3 py-2.5 ${getTodayWatchRowClass(item.tone)}`} key={`${item.href}-${item.value}`}>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 shrink-0 rounded-full bg-current" />
              <p className="min-w-0 truncate text-xs font-black text-[#0F172A]">{item.value}</p>
            </div>
            <p className="mt-1.5 line-clamp-2 text-[11px] font-bold leading-4 text-[#64748B]">{item.detail}</p>
          </div>
        ))}
      </div>
    </Link>
  );
}

function getTodayWatchRowClass(tone: StatusTone) {
  if (tone === "red") return "border-red-100 bg-red-50 text-[#EF4444]";
  if (tone === "orange") return "border-orange-100 bg-orange-50 text-[#F97316]";
  if (tone === "green") return "border-emerald-100 bg-emerald-50 text-[#16A34A]";
  if (tone === "violet") return "border-violet-100 bg-violet-50 text-[#7C3AED]";
  return "border-blue-100 bg-blue-50 text-[#2563EB]";
}
