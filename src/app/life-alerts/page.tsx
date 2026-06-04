"use client";

import { Bell, CalendarDays, ChevronRight, CloudRain, CreditCard, FileClock, Landmark, Snowflake, Sun, Trash2, TrainFront, Umbrella, Wind } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { BackButton } from "@/components/BackButton";
import { tokyoTrainStatusLines, type TrainStatusLine } from "@/data/trainStatus";
import { useHomeRailLines } from "@/hooks/useHomeRailLines";
import { useLanguage } from "@/hooks/useLanguage";
import { useReminders } from "@/hooks/useReminders";
import { useWeatherLocation } from "@/hooks/useWeatherLocation";
import { getCachedBenefitsData, getCachedTrainStatus, getCachedWeatherForecast, warmBenefitsData, warmTrainStatus, warmWeatherForecast } from "@/lib/appPreload";
import { getTokyoDateString } from "@/lib/api/holidays";
import type { BenefitRecord } from "@/lib/benefits/types";
import { diffDays, emptyVisaReminderState, readVisaReminderState, visaReminderEvent, type VisaReminderState } from "@/lib/reminders";
import { mergeOdptLines, odptRefreshIntervalMs, type OdptClientLine } from "@/lib/trainStatus/odptClient";
import { readTrainIncidentRecords, syncTodayTrainIncidentRecords, trainIncidentRecordsChangeEvent, type TrainIncidentRecord } from "@/lib/trainStatus/incidentRecords";
import { getTokyoDateTimeString } from "@/lib/utils/format";
import type { ReminderItem } from "@/types/reminder";
import type { WeatherForecast } from "@/types/weather";

type AlertCategory = "all" | "weather" | "traffic" | "life" | "money" | "visa" | "policy";
type AlertTone = "blue" | "green" | "orange" | "red" | "violet";

type LifeAlert = {
  category: Exclude<AlertCategory, "all">;
  date?: string;
  detail: string;
  href: string;
  icon: LucideIcon;
  id: string;
  meta: string;
  tone: AlertTone;
  title: string;
};

type EmptyAlertSource = {
  links: {
    href: string;
    label: string;
  }[];
  text: string;
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
    trafficOtherDetail: "ODPT 显示这条线路有运行信息，出发前建议确认铁路公司官方信息。",
    visaUnset: "设置在留期限",
    visaUnsetDetail: "设置到期日后，这里会显示签证 / 在留相关提醒。",
    visaExpired: "在留期限已过期",
    visaPrepare: "建议开始准备更新材料",
    visaUrgent: "请更新在留手续",
    visaDetail: (days: number) => `距离到期还有 ${days} 天，建议开始整理申请表、照片、在学/在职证明、收入和住民税资料。`,
    visaUrgentDetail: (days: number) => `距离到期还有 ${days} 天，请尽快确认入管预约和在留更新手续。`,
    paymentSummaryTitle: (count: number) => `本周有 ${count} 笔缴费`,
    paymentSummaryDetail: (count: number) => count >= 3 ? "本周缴费较集中，建议提前确认账户余额。" : "本周有缴费安排，具体项目请在今日安排或待办中心确认。",
  },
  "zh-TW": {
    back: "返回",
    title: "生活提醒中心",
    today: "今日提醒",
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
    trafficOtherDetail: "ODPT 顯示這條路線有運行資訊，出發前建議確認鐵路公司官方資訊。",
    visaUnset: "設定在留期限",
    visaUnsetDetail: "設定到期日後，這裡會顯示簽證 / 在留相關提醒。",
    visaExpired: "在留期限已過期",
    visaPrepare: "建議開始準備更新資料",
    visaUrgent: "請更新在留手續",
    visaDetail: (days: number) => `距離到期還有 ${days} 天，建議開始整理申請表、照片、在學/在職證明、收入和住民稅資料。`,
    visaUrgentDetail: (days: number) => `距離到期還有 ${days} 天，請盡快確認入管預約和在留更新手續。`,
    paymentSummaryTitle: (count: number) => `本週有 ${count} 筆繳費`,
    paymentSummaryDetail: (count: number) => count >= 3 ? "本週繳費較集中，建議提前確認帳戶餘額。" : "本週有繳費安排，具體項目請在今日安排或待辦中心確認。",
  },
  ja: {
    back: "戻る",
    title: "生活リマインダー",
    today: "今日の注意",
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
    trafficOtherDetail: "ODPT に運行情報があります。出発前に鉄道会社の公式情報も確認してください。",
    visaUnset: "在留期限を設定",
    visaUnsetDetail: "期限を設定すると、ビザ / 在留関連の注意を表示します。",
    visaExpired: "在留期限が切れています",
    visaPrepare: "更新書類の準備を始めましょう",
    visaUrgent: "在留更新手続きを確認",
    visaDetail: (days: number) => `期限まであと ${days} 日です。申請書、写真、在学/在職証明、収入・住民税資料を整理し始めましょう。`,
    visaUrgentDetail: (days: number) => `期限まであと ${days} 日です。入管予約と在留更新手続きを早めに確認しましょう。`,
    paymentSummaryTitle: (count: number) => `今週の支払い ${count} 件`,
    paymentSummaryDetail: (count: number) => count >= 3 ? "今週は支払いが集中しています。口座残高を早めに確認しましょう。" : "今週の支払い予定があります。詳細は今日の予定またはリマインダーで確認してください。",
  },
} as const;

const lifeAlertsBackFrom = "?from=%2Flife-alerts";

export default function LifeAlertsPage() {
  const { language } = useLanguage();
  const text = copy[language];
  const { selectedRailLineIds } = useHomeRailLines();
  const { activeReminders } = useReminders();
  const weatherLocationState = useWeatherLocation(true);
  const [activeTab, setActiveTab] = useState<AlertCategory>("all");
  const [forecast, setForecast] = useState<WeatherForecast | null>(null);
  const [weatherAlertSettings, setWeatherAlertSettings] = useState<WeatherAlertSettings>(defaultWeatherAlertSettings);
  const [visaReminder, setVisaReminder] = useState<VisaReminderState>(emptyVisaReminderState);
  const [odptLines, setOdptLines] = useState<OdptClientLine[]>([]);
  const [trainIncidentRecords, setTrainIncidentRecords] = useState<TrainIncidentRecord[]>([]);
  const [benefitAlerts, setBenefitAlerts] = useState<BenefitRecord[]>([]);
  const today = getTokyoDateString();
  const weatherLocation = weatherLocationState.location;
  const trainStatusLines = useMemo(() => mergeOdptLines(tokyoTrainStatusLines[language], odptLines, language), [language, odptLines]);

  useEffect(() => {
    let cancelled = false;
    if (!weatherLocation) {
      setForecast(null);
      return;
    }
    const cached = getCachedWeatherForecast(weatherLocation);
    if (cached) setForecast(cached);
    warmWeatherForecast(weatherLocation)
      .then((result) => {
        if (!cancelled && result) setForecast(result);
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
    const read = () => setVisaReminder(readVisaReminderState());
    read();
    window.addEventListener(visaReminderEvent, read);
    window.addEventListener("storage", read);
    return () => {
      window.removeEventListener(visaReminderEvent, read);
      window.removeEventListener("storage", read);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const cached = getCachedTrainStatus();
    if (cached) setOdptLines(cached.lines);

    async function loadOdptStatus() {
      const result = await warmTrainStatus();
      if (result.source === "odpt") syncTodayTrainIncidentRecords(result.lines);
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
    const read = () => setTrainIncidentRecords(readTrainIncidentRecords());
    read();
    window.addEventListener("storage", read);
    window.addEventListener(trainIncidentRecordsChangeEvent, read);
    return () => {
      window.removeEventListener("storage", read);
      window.removeEventListener(trainIncidentRecordsChangeEvent, read);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const cached = getCachedBenefitsData();
    if (cached) setBenefitAlerts(cached.items ?? []);
    warmBenefitsData()
      .then((data) => {
        if (!cancelled) {
          setBenefitAlerts(Array.isArray(data.items) ? data.items : []);
        }
      })
      .catch(() => {
        if (!cancelled) setBenefitAlerts([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const alerts = useMemo(() => {
    return [
      ...buildWeatherAlerts(forecast, weatherAlertSettings, text),
      ...buildTrafficAlerts(selectedRailLineIds, trainStatusLines, trainIncidentRecords, today, language, text),
      ...buildReminderAlerts(activeReminders, today, text),
      ...buildPaymentSummaryAlerts(activeReminders, today, text),
      ...buildVisaAlerts(visaReminder, today, text),
      ...buildBenefitPolicyAlerts(benefitAlerts, today, text),
    ];
  }, [activeReminders, benefitAlerts, forecast, language, selectedRailLineIds, text, today, trainIncidentRecords, trainStatusLines, visaReminder, weatherAlertSettings]);

  const isTodayAlert = (item: LifeAlert) => item.meta === text.todayLabel || item.meta.includes(text.todayLabel) || item.meta.includes(text.updated);
  const scopedAlerts = (activeTab === "all" ? alerts : alerts.filter((item) => item.category === activeTab)).filter((item) => {
    if (activeTab === "policy") return isPolicyInsideRecentSevenDayWindow(item, today);
    return isAlertInsideSevenDayWindow(item, today);
  });
  const todayAlerts = scopedAlerts.filter(isTodayAlert);
  const next7DayAlerts = scopedAlerts.filter((item) => !isTodayAlert(item));
  const tabs: AlertCategory[] = ["all", "weather", "traffic", "life", "money", "visa", "policy"];
  const todaySectionTitle = activeTab === "policy" ? (language === "ja" ? "\u4eca\u65e5\u306e\u60c5\u5831" : language === "zh-TW" ? "\u4eca\u65e5\u8cc7\u8a0a" : "\u4eca\u65e5\u8d44\u8baf") : text.today;
  const next7DaysTitle = activeTab === "policy" ? (language === "ja" ? "\u76f4\u8fd17\u65e5\u306e\u60c5\u5831" : language === "zh-TW" ? "\u8fd17\u5929\u8cc7\u8a0a" : "\u8fd17\u5929\u8d44\u8baf") : language === "ja" ? "\u4eca\u5f8c7\u65e5\u9593" : "\u8fd17\u5929\u63d0\u9192";
  const emptySource = getEmptyAlertSource(activeTab, language);
  const showNext7EmptyAction = todayAlerts.length > 0;

  return (
    <main className="jl-tool-theme min-h-screen text-[#0F172A]">
      <div className="jl-tool-shell mx-auto min-h-screen max-w-[430px] px-4 pb-8 pt-5">
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

        <AlertSection emptySource={emptySource} emptyText={text.empty} items={todayAlerts} title={`${todaySectionTitle}（${todayAlerts.length}）`} />
        <AlertSection emptySource={emptySource} emptyText={text.empty} items={next7DayAlerts} showEmptyAction={showNext7EmptyAction} title={`${next7DaysTitle}（${next7DayAlerts.length}）`} />
      </div>
    </main>
  );
}

function buildWeatherAlerts(forecast: WeatherForecast | null, settings: WeatherAlertSettings, text: (typeof copy)[keyof typeof copy]): LifeAlert[] {
  const today = forecast?.daily[0];
  if (!today) {
    return [{ category: "weather", date: getTokyoDateString(), detail: text.weatherStableDetail, href: "/tools/weather", icon: Umbrella, id: "weather-loading", meta: text.todayLabel, tone: "blue", title: text.weatherStable }];
  }

  const alertDate = getTokyoDateString();
  const alerts: LifeAlert[] = [{ category: "weather", date: alertDate, detail: text.weatherStableDetail, href: "/tools/weather", icon: Umbrella, id: "weather-stable", meta: text.todayLabel, tone: "green", title: text.weatherStable }];
  const current = forecast.current;
  const gusts = current?.windGusts ?? today.windGustsMax ?? 0;
  const windSpeed = current?.windSpeed ?? today.windSpeedMax ?? 0;
  if (settings.rain && (today.precipitationProbability >= 50 || (today.precipitationSum ?? 0) > 2)) {
    alerts.push({ category: "weather", date: alertDate, detail: text.rainDetail, href: "/tools/weather", icon: CloudRain, id: "weather-rain", meta: text.todayLabel, tone: "blue", title: text.rain });
  }
  if (settings.heat && today.maxTemperature >= 30) {
    alerts.push({ category: "weather", date: alertDate, detail: text.heatDetail, href: "/tools/weather", icon: Sun, id: "weather-heat", meta: text.todayLabel, tone: "orange", title: text.heat });
  }
  if (settings.typhoon && ([95, 96, 99].includes(today.weatherCode) || gusts >= 45 || windSpeed >= 35)) {
    alerts.push({ category: "weather", date: alertDate, detail: text.windDetail, href: "/tools/weather", icon: Wind, id: "weather-wind", meta: text.todayLabel, tone: "red", title: text.wind });
  }
  if (settings.snow && ([71, 73, 75, 77, 85, 86].includes(today.weatherCode) || (today.snowfallSum ?? 0) > 0)) {
    alerts.push({ category: "weather", date: alertDate, detail: text.snowDetail, href: "/tools/weather", icon: Snowflake, id: "weather-snow", meta: text.todayLabel, tone: "blue", title: text.snow });
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

function buildTrafficAlerts(
  selectedRailLineIds: string[],
  trainStatusLines: TrainStatusLine[],
  trainIncidentRecords: TrainIncidentRecord[],
  today: string,
  language: keyof typeof copy,
  text: (typeof copy)[keyof typeof copy],
): LifeAlert[] {
  const selectedIdSet = new Set(selectedRailLineIds);
  const updatedAt = trainStatusLines.find((line) => line.source === "odpt" && line.updatedAt)?.updatedAt ?? getTokyoDateTimeString();
  const selected = selectedRailLineIds
    .map((id) => trainStatusLines.find((line) => line.id === id))
    .filter((line): line is NonNullable<typeof line> => Boolean(line));
  const delayed = [
    ...selected.filter((line) => line.tone !== "green" && !isRailStatusUnavailable(line)),
    ...trainStatusLines.filter((line) => !selectedIdSet.has(line.id) && line.tone !== "green" && !isRailStatusUnavailable(line)).slice(0, 6),
  ];
  const todayIncidentRecords = trainIncidentRecords.filter((record) => record.date === today);
  if (delayed.length === 0) {
    if (todayIncidentRecords.length > 0) {
      return todayIncidentRecords.map((record) => toTrainIncidentAlert(record, trainStatusLines, language));
    }
    return [{ category: "traffic", date: today, detail: text.trafficNormalDetail, href: "/tools/train-status", icon: TrainFront, id: "traffic-normal", meta: `${updatedAt} ${text.updated}`, tone: "green", title: text.trafficNormal }];
  }
  const activeAlerts: LifeAlert[] = delayed.map((line) => ({
    category: "traffic",
    date: today,
    detail: selectedIdSet.has(line.id) ? `${line.name} ${line.status}` : text.trafficOtherDetail,
    href: "/tools/train-status",
    icon: TrainFront,
    id: `traffic-${line.id}`,
    meta: line.incidentStartedAt ? `${text.todayLabel} / ${getTrainIncidentStartedText(line.incidentStartedAt, language)}` : `${line.updatedAt ?? updatedAt} ${text.updated}`,
    tone: line.tone === "red" ? "red" : "orange",
    title: line.name,
  }));
  return activeAlerts.concat(todayIncidentRecords.filter((record) => !delayed.some((line) => line.id === record.lineId)).map((record) => toTrainIncidentAlert(record, trainStatusLines, language)));
}

function toTrainIncidentAlert(record: TrainIncidentRecord, trainStatusLines: TrainStatusLine[], language: keyof typeof copy): LifeAlert {
  const line = trainStatusLines.find((item) => item.id === record.lineId);
  return {
    category: "traffic",
    date: record.date,
    detail: `${record.detailByLanguage[language] || record.statusByLanguage[language]}${record.endedAt ? ` / ${getTrainIncidentEndedText(record.endedAt, language)}` : ""}`,
    href: "/tools/train-status",
    icon: TrainFront,
    id: `traffic-record-${record.id}`,
    meta: `${copy[language].todayLabel} / ${getTrainIncidentStartedText(record.startedAt, language)}`,
    tone: record.endedAt ? "blue" : record.tone === "red" ? "red" : "orange",
    title: line?.name ?? record.lineId,
  };
}

function getTrainIncidentStartedText(value: string, language: keyof typeof copy) {
  if (language === "ja") return `開始 ${value}`;
  if (language === "zh-TW") return `開始 ${value}`;
  return `开始 ${value}`;
}

function getTrainIncidentEndedText(value: string, language: keyof typeof copy) {
  if (language === "ja") return `終了 ${value}`;
  if (language === "zh-TW") return `已結束 ${value}`;
  return `已结束 ${value}`;
}

function isRailStatusUnavailable(line: TrainStatusLine) {
  return /未提供|対象外/.test(line.status);
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
        date: reminder.date,
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
    date: payments[0]?.date ?? today,
    detail: text.paymentSummaryDetail(payments.length),
    href: "/reminders",
    icon: CreditCard,
    id: "payment-summary-week",
    meta: dueToday ? text.todayLabel : payments[0]?.date.slice(5) ?? text.todayLabel,
    tone: payments.length >= 3 || dueToday ? "orange" : "blue",
    title: text.paymentSummaryTitle(payments.length),
  }];
}

function buildVisaAlerts(visaReminder: VisaReminderState, today: string, text: (typeof copy)[keyof typeof copy]): LifeAlert[] {
  const { expiryDate, selectedDays } = visaReminder;
  if (!expiryDate) {
    return [{ category: "visa", date: today, detail: text.visaUnsetDetail, href: `/onboarding${lifeAlertsBackFrom}`, icon: FileClock, id: "visa-unset", meta: text.todayLabel, tone: "blue", title: text.visaUnset }];
  }
  const days = diffDays(today, expiryDate);
  if (days < 0) {
    return [{ category: "visa", date: today, detail: text.visaUnsetDetail, href: `/onboarding${lifeAlertsBackFrom}`, icon: FileClock, id: "visa-expired", meta: text.todayLabel, tone: "red", title: text.visaExpired }];
  }
  const activeThreshold = selectedDays.filter((day) => days <= day).sort((a, b) => a - b)[0];
  if (activeThreshold) {
    const isPrepareStage = activeThreshold === 120 && days > 90;
    return [{
      category: "visa",
      date: today,
      detail: isPrepareStage ? text.visaDetail(days) : text.visaUrgentDetail(days),
      href: `/onboarding${lifeAlertsBackFrom}`,
      icon: FileClock,
      id: `visa-urgent-${activeThreshold}`,
      meta: text.todayLabel,
      tone: days <= 30 ? "red" : "orange",
      title: isPrepareStage ? text.visaPrepare : text.visaUrgent,
    }];
  }
  return [];
}

function buildBenefitPolicyAlerts(items: BenefitRecord[], today: string, text: (typeof copy)[keyof typeof copy]): LifeAlert[] {
  return items
    .toSorted((a, b) => getBenefitAlertDate(b).localeCompare(getBenefitAlertDate(a)))
    .slice(0, 7)
    .map((item) => {
      const date = getBenefitAlertDate(item);
      return {
        category: "policy" as const,
        date,
        detail: `${item.source_name || text.tabs.policy} / ${item.translated_summary || item.summary || ""}`.trim(),
        href: item.apply_url || item.source_url || "/benefits",
        icon: Landmark,
        id: `policy-${item.id}`,
        meta: date === today ? text.todayLabel : date.slice(5),
        tone: "violet" as const,
        title: item.translated_title || item.title,
      };
    })
    .filter((item) => Boolean(item.title));
}

function getBenefitAlertDate(item: BenefitRecord) {
  const value = item.updated_at || item.created_at;
  return Number.isFinite(Date.parse(value)) ? value.slice(0, 10) : getTokyoDateString();
}

function isAlertInsideSevenDayWindow(item: LifeAlert, today: string) {
  if (!item.date) return true;
  const distance = diffDays(today, item.date);
  return distance >= 0 && distance <= 7;
}

function isPolicyInsideRecentSevenDayWindow(item: LifeAlert, today: string) {
  if (!item.date) return true;
  const distance = diffDays(today, item.date);
  return distance >= -7 && distance <= 0;
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

function getEmptyAlertSource(category: AlertCategory, language: keyof typeof copy): EmptyAlertSource {
  const isJa = language === "ja";
  const sourceMap: Record<AlertCategory, EmptyAlertSource> = {
    all: {
      links: [
        { href: "/tools/holidays", label: isJa ? "カレンダー" : "日历" },
        { href: "/tools/weather", label: isJa ? "天気" : "天气" },
        { href: "/tools/train-status", label: isJa ? "交通" : "交通" },
        { href: `/onboarding${lifeAlertsBackFrom}`, label: isJa ? "在留期限" : "在留期限" },
        { href: "/me/settings/notifications", label: isJa ? "通知設定" : "通知设置" },
      ],
      text: isJa ? "通知や生活リマインダーの設定を確認できます。" : "可以去设置里确认提醒来源和开关。",
    },
    weather: {
      links: [{ href: "/tools/weather", label: isJa ? "天気設定" : "设置天气提醒" }],
      text: isJa ? "天気ページで雨・高温・雪などの通知条件を設定できます。" : "天气提醒来源于天气页，可设置下雨、高温、强风和降雪提醒。",
    },
    traffic: {
      links: [{ href: "/tools/train-status", label: isJa ? "路線を設定" : "设置常用线路" }],
      text: isJa ? "よく使う路線を選ぶと、運行情報がここに表示されます。" : "交通提醒来源于 ODPT 电车状态，可先设置常用线路。",
    },
    life: {
      links: [
        { href: "/tools/holidays", label: isJa ? "カレンダー" : "日历" },
        { href: "/reminders", label: isJa ? "リマインダー" : "待办中心" },
      ],
      text: isJa ? "ごみ・予定・生活メモを追加するとここに表示されます。" : "生活提醒来源于日历、垃圾日和自定义提醒，可去添加。",
    },
    money: {
      links: [
        { href: "/tools/holidays", label: isJa ? "支払い予定" : "缴费日历" },
      ],
      text: isJa ? "家賃・光熱費などの支払い予定を追加できます。" : "缴费提醒来源于日历里的每月提醒。",
    },
    visa: {
      links: [{ href: `/onboarding${lifeAlertsBackFrom}`, label: isJa ? "在留期限を設定" : "设置在留期限" }],
      text: isJa ? "在留期限を設定すると、更新タイミングを表示します。" : "签证提醒来源于在留期限设置，设置后会显示更新提醒。",
    },
    policy: {
      links: [{ href: "/benefits", label: isJa ? "制度を見る" : "查看福利政策" }],
      text: isJa ? "行政・支援制度の情報を確認できます。" : "行政福利政策来源于福利政策页，有内容时会显示在这里。",
    },
  };
  return sourceMap[category];
}

function AlertSection({ emptySource, emptyText, items, showEmptyAction = true, title }: { emptySource: EmptyAlertSource; emptyText: string; items: LifeAlert[]; showEmptyAction?: boolean; title: string }) {
  return (
    <section className="mt-4">
      <h2 className="mb-2 px-1 text-sm font-black text-slate-800">{title}</h2>
      {items.length === 0 ? (
        <div className="rounded-[22px] border border-slate-200 bg-white p-4 text-sm font-bold text-slate-500 shadow-sm">
          <p>{emptyText}</p>
          <p className="mt-2 text-xs leading-5 text-slate-500">{emptySource.text}</p>
          {showEmptyAction ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {emptySource.links.map((link) => (
                <Link className="inline-flex min-h-10 items-center justify-center rounded-2xl bg-[#2563EB] px-4 text-xs font-black text-white" href={link.href} key={`${link.href}-${link.label}`}>
                  {link.label}
                </Link>
              ))}
            </div>
          ) : null}
        </div>
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
