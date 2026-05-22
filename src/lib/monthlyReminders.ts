import type { MonthlyReminder, MonthlyReminderCategory } from "@/types/monthlyReminder";

export const monthlyReminderCategories: MonthlyReminderCategory[] = ["rent", "phone", "card", "insurance", "utility", "other"];

export const monthlyReminderCategoryLabels: Record<MonthlyReminderCategory, { "zh-CN": string; "zh-TW": string; ja: string }> = {
  rent: { "zh-CN": "房租", "zh-TW": "房租", ja: "家賃" },
  phone: { "zh-CN": "手机费", "zh-TW": "手機費", ja: "スマホ代" },
  card: { "zh-CN": "信用卡", "zh-TW": "信用卡", ja: "カード" },
  insurance: { "zh-CN": "保险", "zh-TW": "保險", ja: "保険" },
  utility: { "zh-CN": "水电煤", "zh-TW": "水電瓦斯", ja: "光熱費" },
  other: { "zh-CN": "其他", "zh-TW": "其他", ja: "その他" },
};

function partsInTokyo(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  return { year: Number(get("year")), month: Number(get("month")), day: Number(get("day")) };
}

export function getLastDayOfTokyoMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}

export function getMonthlyReminderDayForMonth(reminder: MonthlyReminder, year: number, month: number) {
  return Math.min(reminder.day, getLastDayOfTokyoMonth(year, month));
}

export function getMonthlyRemindersForDate(date: Date, reminders: MonthlyReminder[]) {
  const parts = partsInTokyo(date);
  return reminders.filter((reminder) => reminder.enabled && getMonthlyReminderDayForMonth(reminder, parts.year, parts.month) === parts.day);
}

export function formatReminderAmount(amount?: number) {
  if (typeof amount !== "number" || !Number.isFinite(amount) || amount <= 0) return "";
  return `¥${Math.round(amount).toLocaleString("ja-JP")}`;
}
