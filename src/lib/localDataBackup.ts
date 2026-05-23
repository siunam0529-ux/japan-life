import type { JapanLifeUserData } from "@/types/userData";

const schemaVersion = 1;

const keys = {
  arrivalChecklist: "japan-life:arrival-checklist",
  favorites: "japan-life:favorites",
  calendarNotes: "japan-life-calendar-notes",
  garbageSchedule: "japan-life-garbage-schedule",
  homeRailLines: "japan-life:home-rail-lines",
  homeTools: "japan-life:home-tools",
  language: "japan-life:language",
  monthlyReminders: "japan-life-monthly-reminders",
  notificationSettings: "japan-life-notification-settings",
  recent: "japan-life:recent",
  reminderStatuses: "japan-life-reminder-statuses",
  salaryResult: "japan-life:salary-result",
  userAvatar: "japan-life:user-avatar",
  userSettings: "japan-life:user-settings",
  visaReminder: "japan-life:visa-reminder",
  workHours: "japan-life-work-hours",
} as const;

const knownRegions = ["tokyo", "osaka", "kyoto", "fukuoka", "other"];

export function getJapanLifeStorageKeys() {
  return Object.values(keys);
}

export function exportJapanLifeData(): JapanLifeUserData {
  const userSettings = readObject(keys.userSettings);
  const language = readString(keys.language) || readRecordValue(userSettings, "language") || "zh-CN";

  return {
    app: "Japan Life",
    schemaVersion,
    exportedAt: new Date().toISOString(),
    localStorage: exportJapanLifeLocalStorage(),
    userProfile: {
      areaId: readRecordValue(userSettings, "areaId") ?? readRecordValue(userSettings, "region") ?? null,
      language,
    },
    settings: {
      notificationSettings: readObject(keys.notificationSettings),
      calendarDisplaySettings: {},
    },
    calendar: {
      notes: readArray(keys.calendarNotes),
      monthlyReminders: readArray(keys.monthlyReminders),
      garbageSchedule: readObject(keys.garbageSchedule),
    },
    reminders: {
      statuses: readObject(keys.reminderStatuses),
    },
  };
}

export function importJapanLifeData(input: unknown) {
  const data = validateUserData(input);

  if (data.localStorage) {
    Object.entries(data.localStorage).forEach(([key, value]) => {
      if ((getJapanLifeStorageKeys() as string[]).includes(key) && typeof value === "string") {
        window.localStorage.setItem(key, value);
      }
    });
    dispatchDataEvents();
    return;
  }

  writeJson(keys.language, data.userProfile.language || "zh-CN");
  writeJson(keys.userSettings, {
    region: isKnownRegion(data.userProfile.areaId) ? data.userProfile.areaId : "tokyo",
    areaId: data.userProfile.areaId,
    language: data.userProfile.language || "zh-CN",
  }, true);
  writeJson(keys.notificationSettings, data.settings.notificationSettings);
  writeJson(keys.calendarNotes, data.calendar.notes);
  writeJson(keys.monthlyReminders, data.calendar.monthlyReminders);
  writeJson(keys.garbageSchedule, data.calendar.garbageSchedule ?? { rules: [] });
  writeJson(keys.reminderStatuses, data.reminders.statuses);
  dispatchDataEvents();
}

export function exportJapanLifeLocalStorage() {
  const data: Record<string, string> = {};
  if (typeof window === "undefined") return data;
  getJapanLifeStorageKeys().forEach((key) => {
    const value = window.localStorage.getItem(key);
    if (value !== null) data[key] = value;
  });
  return data;
}

export function hasJapanLifeLocalData() {
  if (typeof window === "undefined") return false;
  return getJapanLifeStorageKeys().some((key) => {
    const value = window.localStorage.getItem(key);
    return value !== null && value !== "" && value !== "[]" && value !== "{}";
  });
}

export function clearJapanLifeData() {
  if (typeof window === "undefined") return;
  getJapanLifeStorageKeys().forEach((key) => window.localStorage.removeItem(key));
  dispatchDataEvents();
}

function validateUserData(value: unknown): JapanLifeUserData {
  if (!isRecord(value)) throw new Error("Invalid JSON format.");
  if (value.app !== "Japan Life") throw new Error("This file is not a Japan Life export.");
  if (value.schemaVersion !== schemaVersion) throw new Error("Unsupported schemaVersion.");
  if (!isRecord(value.userProfile) || !isRecord(value.settings) || !isRecord(value.calendar) || !isRecord(value.reminders)) {
    throw new Error("Missing required data sections.");
  }

  return {
    app: "Japan Life",
    schemaVersion,
    exportedAt: typeof value.exportedAt === "string" ? value.exportedAt : undefined,
    userProfile: {
      areaId: typeof value.userProfile.areaId === "string" ? value.userProfile.areaId : null,
      language: typeof value.userProfile.language === "string" ? value.userProfile.language : "zh-CN",
    },
    localStorage: isRecord(value.localStorage)
      ? Object.entries(value.localStorage).reduce<Record<string, string>>((acc, [key, item]) => {
          if (typeof item === "string") acc[key] = item;
          return acc;
        }, {})
      : undefined,
    settings: {
      notificationSettings: value.settings.notificationSettings ?? {},
      calendarDisplaySettings: value.settings.calendarDisplaySettings ?? {},
    },
    calendar: {
      notes: Array.isArray(value.calendar.notes) ? value.calendar.notes : [],
      monthlyReminders: Array.isArray(value.calendar.monthlyReminders) ? value.calendar.monthlyReminders : [],
      garbageSchedule: value.calendar.garbageSchedule ?? { rules: [] },
    },
    reminders: {
      statuses: isRecord(value.reminders.statuses) ? value.reminders.statuses : {},
    },
  };
}

function readString(key: string) {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(key) ?? "";
}

function readArray(key: string): unknown[] {
  const parsed = readJson(key);
  return Array.isArray(parsed) ? parsed : [];
}

function readObject(key: string): Record<string, unknown> {
  const parsed = readJson(key);
  return isRecord(parsed) ? parsed : {};
}

function readJson(key: string): unknown {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown, mergeWithExisting = false) {
  if (typeof window === "undefined") return;
  if (key === keys.language && typeof value === "string") {
    window.localStorage.setItem(key, value);
    return;
  }
  const payload = mergeWithExisting && isRecord(value) ? { ...readObject(key), ...value } : value;
  window.localStorage.setItem(key, JSON.stringify(payload));
}

function readRecordValue(record: Record<string, unknown>, key: string) {
  const value = record[key];
  return typeof value === "string" ? value : null;
}

function dispatchDataEvents() {
  if (typeof window === "undefined") return;
  [
    "japan-life:user-settings-change",
    "japan-life:language-change",
    "japan-life:home-tools-change",
    "japan-life:home-rail-lines-change",
    "japan-life:favorites-change",
    "japan-life:recent-change",
    "japan-life-calendar-notes-change",
    "japan-life-garbage-schedule-change",
    "japan-life-monthly-reminders-change",
    "japan-life-reminder-statuses-change",
    "japan-life:visa-reminder-change",
    "japan-life-work-hours-change",
  ].forEach((eventName) => window.dispatchEvent(new Event(eventName)));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isKnownRegion(value: unknown): value is string {
  return typeof value === "string" && knownRegions.includes(value);
}
