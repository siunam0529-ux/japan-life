export type GarbageType =
  | "burnable"
  | "recyclable"
  | "plastic"
  | "nonBurnable"
  | "oversized"
  | "hazardous"
  | "paper"
  | "bottleCanPet";

export type GarbageFrequency = "weekly" | "biweekly" | "monthlyDate" | "monthlyWeekday";

export type GarbageScheduleRule = {
  id: string;
  enabled: boolean;
  garbageTypes: GarbageType[];
  frequency: GarbageFrequency;
  weekdays?: number[];
  startDate?: string;
  monthDays?: number[];
  weekOfMonth?: 1 | 2 | 3 | 4 | 5 | "last";
  weekday?: number;
  reminderTime: string;
  note?: string;
  createdAt: string;
  updatedAt: string;
};

export type GarbageScheduleState = {
  rules: GarbageScheduleRule[];
};

export type MatchedGarbageItem = {
  ruleId: string;
  garbageTypes: GarbageType[];
  reminderTime: string;
  note?: string;
};

export const emptyGarbageScheduleState: GarbageScheduleState = { rules: [] };

export const garbageTypes: GarbageType[] = ["burnable", "recyclable", "plastic", "nonBurnable", "oversized", "hazardous", "paper", "bottleCanPet"];

export const garbageTypeConfig: Record<GarbageType, { icon: string; "zh-CN": string; "zh-TW": string; ja: string }> = {
  burnable: { "zh-CN": "可燃垃圾", "zh-TW": "可燃垃圾", ja: "燃えるごみ", icon: "🔥" },
  recyclable: { "zh-CN": "资源垃圾", "zh-TW": "資源垃圾", ja: "資源ごみ", icon: "♻️" },
  plastic: { "zh-CN": "塑料垃圾", "zh-TW": "塑膠垃圾", ja: "プラスチックごみ", icon: "🧴" },
  nonBurnable: { "zh-CN": "不可燃垃圾", "zh-TW": "不可燃垃圾", ja: "燃えないごみ", icon: "🍃" },
  oversized: { "zh-CN": "大件垃圾", "zh-TW": "大型垃圾", ja: "粗大ごみ", icon: "🛋️" },
  hazardous: { "zh-CN": "有害垃圾", "zh-TW": "有害垃圾", ja: "有害ごみ", icon: "🔋" },
  paper: { "zh-CN": "纸类", "zh-TW": "紙類", ja: "古紙", icon: "📄" },
  bottleCanPet: { "zh-CN": "瓶/罐/PET", "zh-TW": "瓶/罐/PET", ja: "びん・缶・ペットボトル", icon: "🥫" },
};

function tokyoParts(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
  }).formatToParts(date);
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  const weekdayMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return {
    year: Number(get("year")),
    month: Number(get("month")),
    day: Number(get("day")),
    weekday: weekdayMap[get("weekday")] ?? date.getDay(),
  };
}

function tokyoDateMs(year: number, month: number, day: number) {
  return new Date(`${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}T00:00:00+09:00`).getTime();
}

function dateStringToTokyoMs(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const parsed = new Date(`${value}T00:00:00+09:00`).getTime();
  return Number.isFinite(parsed) ? parsed : null;
}

function startOfTokyoWeekMs(date: Date) {
  const parts = tokyoParts(date);
  return tokyoDateMs(parts.year, parts.month, parts.day) - parts.weekday * 86400000;
}

function isMonthlyWeekday(date: Date, rule: GarbageScheduleRule) {
  const parts = tokyoParts(date);
  if (typeof rule.weekday !== "number" || parts.weekday !== rule.weekday || !rule.weekOfMonth) return false;
  const currentMs = tokyoDateMs(parts.year, parts.month, parts.day);

  if (rule.weekOfMonth === "last") {
    const nextWeekMs = currentMs + 7 * 86400000;
    const next = tokyoParts(new Date(nextWeekMs));
    return next.month !== parts.month;
  }

  const firstWeekdayMs = Array.from({ length: 7 }, (_, index) => tokyoDateMs(parts.year, parts.month, index + 1)).find((ms) => tokyoParts(new Date(ms)).weekday === rule.weekday);
  if (!firstWeekdayMs) return false;
  const occurrence = Math.floor((currentMs - firstWeekdayMs) / (7 * 86400000)) + 1;
  return occurrence === rule.weekOfMonth;
}

export function getGarbageForDate(date: Date, rules: GarbageScheduleRule[]): MatchedGarbageItem[] {
  const parts = tokyoParts(date);
  const currentWeekStart = startOfTokyoWeekMs(date);

  return rules
    .filter((rule) => {
      if (!rule.enabled || rule.garbageTypes.length === 0) return false;
      if (rule.frequency === "weekly") return Boolean(rule.weekdays?.includes(parts.weekday));
      if (rule.frequency === "biweekly") {
        if (!rule.weekdays?.includes(parts.weekday) || !rule.startDate) return false;
        const startMs = dateStringToTokyoMs(rule.startDate);
        if (startMs === null) return false;
        const startWeek = startOfTokyoWeekMs(new Date(startMs));
        const diffWeeks = Math.floor((currentWeekStart - startWeek) / (7 * 86400000));
        return diffWeeks >= 0 && diffWeeks % 2 === 0;
      }
      if (rule.frequency === "monthlyDate") return Boolean(rule.monthDays?.includes(parts.day));
      return isMonthlyWeekday(date, rule);
    })
    .map((rule) => ({ ruleId: rule.id, garbageTypes: rule.garbageTypes, reminderTime: rule.reminderTime, note: rule.note }));
}
