import type { CalendarNote } from "@/hooks/useCalendarNotes";
import { garbageTypeConfig, getGarbageForDate, type GarbageScheduleRule } from "@/lib/calendar/garbageSchedule";
import { formatReminderAmount, getMonthlyRemindersForDate, monthlyReminderCategoryLabels } from "@/lib/monthlyReminders";
import type { MonthlyReminder } from "@/types/monthlyReminder";
import type { ReminderItem, ReminderStatusStore } from "@/types/reminder";

export const reminderStatusStorageKey = "japan-life-reminder-statuses";

type Language = "zh-CN" | "zh-TW" | "ja";

type BuildReminderOptions = {
  fromDate: string;
  days?: number;
  garbageRules: GarbageScheduleRule[];
  monthlyReminders: MonthlyReminder[];
  notes: CalendarNote[];
  statuses: ReminderStatusStore;
  language: Language;
};

export type VisaReminderState = {
  expiryDate: string;
  dismissed: number[];
};

export function readReminderStatuses(): ReminderStatusStore {
  if (typeof window === "undefined") return {};
  try {
    const parsed = JSON.parse(window.localStorage.getItem(reminderStatusStorageKey) ?? "{}");
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    return Object.entries(parsed).reduce<ReminderStatusStore>((acc, [id, value]) => {
      if (!value || typeof value !== "object") return acc;
      const item = value as { status?: unknown; updatedAt?: unknown };
      if ((item.status === "done" || item.status === "dismissed") && typeof item.updatedAt === "string") {
        acc[id] = { status: item.status, updatedAt: item.updatedAt };
      }
      return acc;
    }, {});
  } catch {
    return {};
  }
}

export function saveReminderStatuses(statuses: ReminderStatusStore) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(reminderStatusStorageKey, JSON.stringify(statuses));
  window.dispatchEvent(new Event("japan-life-reminder-statuses-change"));
}

export const visaReminderStorageKey = "japan-life:visa-reminder";
export const visaReminderEvent = "japan-life:visa-reminder-change";
export const visaReminderDays = [90, 60, 30, 10] as const;
export const emptyVisaReminderState: VisaReminderState = { expiryDate: "", dismissed: [] };

export function readVisaReminderState(): VisaReminderState {
  if (typeof window === "undefined") return emptyVisaReminderState;
  try {
    const parsed = JSON.parse(window.localStorage.getItem(visaReminderStorageKey) ?? "{}") as Partial<VisaReminderState>;
    return {
      expiryDate: typeof parsed.expiryDate === "string" ? parsed.expiryDate : "",
      dismissed: Array.isArray(parsed.dismissed) ? parsed.dismissed.filter((day) => visaReminderDays.includes(day as (typeof visaReminderDays)[number])) : [],
    };
  } catch {
    return emptyVisaReminderState;
  }
}

export function buildReminders({
  days = 30,
  fromDate,
  garbageRules,
  language,
  monthlyReminders,
  notes,
  statuses,
}: BuildReminderOptions): ReminderItem[] {
  const items: ReminderItem[] = [];
  const noteMap = notes.reduce<Record<string, CalendarNote[]>>((acc, note) => {
    acc[note.date] = [...(acc[note.date] ?? []), note];
    return acc;
  }, {});

  for (let index = 0; index <= days; index += 1) {
    const date = addDays(fromDate, index);
    const dateObject = new Date(`${date}T00:00:00+09:00`);
    const dayLabel = index === 0 ? dayWords.today[language] : index === 1 ? dayWords.tomorrow[language] : "";

    getGarbageForDate(dateObject, garbageRules).forEach((garbage, garbageIndex) => {
      garbage.garbageTypes.forEach((type, typeIndex) => {
        const label = garbageTypeConfig[type][language];
        items.push(applyStatus({
          id: `garbage-${date}-${type}-${garbage.ruleId}-${garbageIndex}-${typeIndex}`,
          title: dayLabel ? `${dayLabel}${isJa(language) ? "" : "是"}${label}${isJa(language) ? "の日" : "日"}` : `${label}${isJa(language) ? "の日" : "日"}`,
          description: garbage.note,
          date,
          time: garbage.reminderTime,
          type: "garbage",
          status: "active",
          source: "auto",
          priority: index <= 1 ? "high" : "normal",
          targetUrl: "/tools/holidays",
        }, statuses));
      });
    });

    getMonthlyRemindersForDate(dateObject, monthlyReminders).forEach((reminder) => {
      const label = reminder.title || monthlyReminderCategoryLabels[reminder.category][language];
      const amount = formatReminderAmount(reminder.amount);
      items.push(applyStatus({
        id: `monthly-${date}-${reminder.id}`,
        title: `${label}${isJa(language) ? "の支払い日" : "缴费日"}`,
        description: [amount ? `${label} ${amount}` : "", reminder.note].filter(Boolean).join(" / ") || undefined,
        date,
        type: "monthlyPayment",
        status: "active",
        source: "auto",
        priority: index <= 3 ? "high" : "normal",
        targetUrl: "/tools/holidays",
      }, statuses));
    });

    (noteMap[date] ?? []).forEach((note) => {
      items.push(applyStatus({
        id: `custom-${date}-${note.id}`,
        title: note.title,
        description: note.note,
        date,
        time: note.time,
        type: note.type === "visa" ? "residenceCard" : "custom",
        status: "active",
        source: "user",
        priority: note.type === "visa" ? "high" : "normal",
        targetUrl: "/tools/holidays",
        createdAt: note.createdAt,
        updatedAt: note.updatedAt,
      }, statuses));
    });
  }

  return items.sort((a, b) => `${a.date} ${a.time ?? ""}`.localeCompare(`${b.date} ${b.time ?? ""}`));
}

export function addDays(date: string, days: number) {
  const next = new Date(`${date}T00:00:00+09:00`);
  next.setDate(next.getDate() + days);
  return toDateString(next);
}

export function toDateString(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function diffDays(fromDate: string, toDate: string) {
  const from = new Date(`${fromDate}T00:00:00+09:00`).getTime();
  const to = new Date(`${toDate}T00:00:00+09:00`).getTime();
  return Math.round((to - from) / 86400000);
}

function applyStatus(item: ReminderItem, statuses: ReminderStatusStore): ReminderItem {
  const saved = statuses[item.id];
  return saved ? { ...item, status: saved.status, updatedAt: saved.updatedAt } : item;
}

function isJa(language: Language) {
  return language === "ja";
}

const dayWords = {
  today: { "zh-CN": "今天", "zh-TW": "今天", ja: "今日" },
  tomorrow: { "zh-CN": "明天", "zh-TW": "明天", ja: "明日" },
} as const;
