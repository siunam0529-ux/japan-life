import { holidayItems, type HolidayItem } from "@/data/holidays";
import { getTokyoDateTimeString } from "@/lib/utils/format";

export type HolidayApiSource = "holidays-jp" | "mock";

export type HolidayApiResult = {
  items: HolidayItem[];
  source: HolidayApiSource;
  updatedAt: string;
  fallback: boolean;
};

type HolidaysJpResponse = Record<string, string>;

const holidaysJpUrl = "https://holidays-jp.github.io/api/v1/date.json";

function dateToUtcDay(dateString: string) {
  const [year, month, day] = dateString.split("-").map(Number);
  return Date.UTC(year, month - 1, day);
}

export function getTokyoDateString(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);

  const year = parts.find((part) => part.type === "year")?.value ?? "2026";
  const month = parts.find((part) => part.type === "month")?.value ?? "01";
  const day = parts.find((part) => part.type === "day")?.value ?? "01";
  return `${year}-${month}-${day}`;
}

export function daysUntilTokyo(dateString: string, todayString = getTokyoDateString()) {
  return Math.ceil((dateToUtcDay(dateString) - dateToUtcDay(todayString)) / 86400000);
}

export function getMockNationalHolidays() {
  return holidayItems
    .filter((holiday) => holiday.type === "national")
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function getNextHoliday(items: HolidayItem[], todayString = getTokyoDateString()) {
  const sorted = [...items].sort((a, b) => a.date.localeCompare(b.date));
  return sorted.find((holiday) => daysUntilTokyo(holiday.date, todayString) >= 0) ?? sorted[0];
}

function transformHolidaysJp(data: HolidaysJpResponse): HolidayItem[] {
  return Object.entries(data)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, title]) => ({
      id: `holiday-${date}`,
      date,
      title,
      titleJa: title,
      type: "national" as const,
      updatedAt: getTokyoDateString(),
    }));
}

export async function fetchJapaneseHolidays(): Promise<HolidayApiResult> {
  try {
    const response = await fetch(holidaysJpUrl, { cache: "force-cache" });
    if (!response.ok) throw new Error(`Holidays JP API failed: ${response.status}`);

    const data = (await response.json()) as HolidaysJpResponse;
    const items = transformHolidaysJp(data);
    if (items.length === 0) throw new Error("Holidays JP API returned empty data");

    return {
      items,
      source: "holidays-jp",
      updatedAt: getTokyoDateTimeString(),
      fallback: false,
    };
  } catch {
    return {
      items: getMockNationalHolidays(),
      source: "mock",
      updatedAt: "2026-05-21 09:00",
      fallback: true,
    };
  }
}
