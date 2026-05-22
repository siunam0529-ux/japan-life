import { formatCurrency } from "@/lib/formatCurrency";
import { daysUntilTokyo, getTokyoDateString } from "@/lib/api/holidays";

export { formatCurrency };

export function formatDate(value: string, locale = "ja-JP") {
  const date = new Date(`${value}T00:00:00+09:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(locale, { month: "2-digit", day: "2-digit" }).format(date);
}

export function daysUntil(dateString: string, now = new Date()) {
  return daysUntilTokyo(dateString, getTokyoDateString(now));
}
