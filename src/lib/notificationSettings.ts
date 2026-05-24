import type { NotificationCategory, NotificationSettings, ReminderTiming } from "@/types/notificationSettings";

export const notificationSettingsStorageKey = "japan-life-notification-settings";

const categories: NotificationCategory[] = [
  "garbage",
  "monthlyPayment",
  "holiday",
  "residenceCard",
  "weather",
  "rail",
  "workHours",
  "salaryTax",
  "rent",
  "calendarNote",
  "deals",
  "shopClaim",
];

const defaultNotificationSettings: NotificationSettings = {
  enabled: false,
  categories: {
    garbage: true,
    monthlyPayment: false,
    holiday: false,
    residenceCard: false,
    weather: true,
    rail: true,
    workHours: false,
    salaryTax: false,
    rent: false,
    calendarNote: false,
    deals: false,
    shopClaim: false,
  },
  timings: {
    garbage: { enabled: true, daysBefore: 1, time: "21:00" },
    monthlyPayment: { enabled: false, daysBefore: 3, time: "09:00" },
    holiday: { enabled: false, daysBefore: 1, time: "09:00" },
    residenceCard: { enabled: false, daysBefore: 30, time: "09:00" },
    weather: { enabled: true, daysBefore: 0, endTime: "21:00", startTime: "09:00", time: "09:00" },
    rail: { enabled: true, daysBefore: 0, endTime: "21:00", startTime: "09:00", time: "09:00" },
    workHours: { enabled: false, daysBefore: 0, time: "20:00" },
    salaryTax: { enabled: false, daysBefore: 0, time: "09:00" },
    rent: { enabled: false, daysBefore: 0, time: "09:00" },
    calendarNote: { enabled: false, daysBefore: 1, time: "09:00" },
    deals: { enabled: false, daysBefore: 0, time: "10:00" },
    shopClaim: { enabled: false, daysBefore: 0, time: "10:00" },
  },
};

export function getDefaultNotificationSettings(): NotificationSettings {
  return structuredCloneSafe(defaultNotificationSettings);
}

export function getNotificationSettings(): NotificationSettings {
  if (typeof window === "undefined") return getDefaultNotificationSettings();

  try {
    const raw = window.localStorage.getItem(notificationSettingsStorageKey);
    if (!raw) return getDefaultNotificationSettings();
    return normalizeNotificationSettings(JSON.parse(raw));
  } catch {
    return getDefaultNotificationSettings();
  }
}

export function saveNotificationSettings(settings: NotificationSettings) {
  const normalized = normalizeNotificationSettings(settings);
  if (typeof window !== "undefined") {
    window.localStorage.setItem(notificationSettingsStorageKey, JSON.stringify(normalized));
  }
  return normalized;
}

export function resetNotificationSettings() {
  const defaults = getDefaultNotificationSettings();
  if (typeof window !== "undefined") {
    window.localStorage.setItem(notificationSettingsStorageKey, JSON.stringify(defaults));
  }
  return defaults;
}

function normalizeNotificationSettings(value: unknown): NotificationSettings {
  const input = isRecord(value) ? value : {};
  const defaults = getDefaultNotificationSettings();
  const inputCategories = isRecord(input.categories) ? input.categories : {};
  const inputTimings = isRecord(input.timings) ? input.timings : {};
  const legacyTimes = isRecord(input.times) ? input.times : {};

  const next: NotificationSettings = {
    enabled: typeof input.enabled === "boolean" ? input.enabled : defaults.enabled,
    categories: { ...defaults.categories },
    timings: { ...defaults.timings },
  };

  categories.forEach((category) => {
    const categoryEnabled = inputCategories[category];
    next.categories[category] = typeof categoryEnabled === "boolean" ? categoryEnabled : defaults.categories[category];
    next.timings[category] = normalizeTiming(inputTimings[category], legacyTimes[category], defaults.timings[category]);
  });

  return next;
}

function normalizeTiming(value: unknown, legacyValue: unknown, fallback: ReminderTiming): ReminderTiming {
  const input = isRecord(value) ? value : {};
  const legacy = isRecord(legacyValue) ? legacyValue : {};
  const legacyTime = typeof legacyValue === "string" ? legacyValue : legacy.time;
  const daysBefore = input.daysBefore ?? legacy.daysBefore;
  const time = input.time ?? legacyTime;
  const enabled = input.enabled ?? legacy.enabled;

  return {
    enabled: typeof enabled === "boolean" ? enabled : fallback.enabled,
    daysBefore: normalizeDays(daysBefore, fallback.daysBefore),
    endTime: normalizeOptionalTime(input.endTime ?? legacy.endTime, fallback.endTime),
    startTime: normalizeOptionalTime(input.startTime ?? legacy.startTime, fallback.startTime),
    time: normalizeTime(time, fallback.time),
  };
}

function normalizeDays(value: unknown, fallback: number) {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  return Math.max(0, Math.floor(value));
}

function normalizeTime(value: unknown, fallback: string) {
  if (typeof value !== "string") return fallback;
  return /^\d{2}:\d{2}$/.test(value) ? value : fallback;
}

function normalizeOptionalTime(value: unknown, fallback: string | undefined) {
  if (typeof value !== "string") return fallback;
  return /^\d{2}:\d{2}$/.test(value) ? value : fallback;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function structuredCloneSafe<T>(value: T): T {
  if (typeof structuredClone === "function") return structuredClone(value);
  return JSON.parse(JSON.stringify(value)) as T;
}
