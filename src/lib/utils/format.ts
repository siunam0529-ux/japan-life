import { formatCurrency } from "@/lib/formatCurrency";
import { daysUntilTokyo, getTokyoDateString } from "@/lib/api/holidays";

export { formatCurrency };

export function formatDate(value: string, locale = "ja-JP") {
  const date = new Date(`${value}T00:00:00+09:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(locale, { month: "2-digit", day: "2-digit" }).format(date);
}

export function formatTokyoDateTime(value: string | Date | null | undefined, locale = "ja-JP") {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return typeof value === "string" ? value : "";
  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    hour: "2-digit",
    hour12: false,
    minute: "2-digit",
    month: "2-digit",
    timeZone: "Asia/Tokyo",
    year: "numeric",
  }).format(date);
}

export function getTokyoDateTimeString(now = new Date()) {
  return formatTokyoDateTime(now, "ja-JP");
}

export function daysUntil(dateString: string, now = new Date()) {
  return daysUntilTokyo(dateString, getTokyoDateString(now));
}
