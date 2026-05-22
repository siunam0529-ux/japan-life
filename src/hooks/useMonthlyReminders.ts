"use client";

import { useCallback, useEffect, useState } from "react";
import { monthlyReminderCategories } from "@/lib/monthlyReminders";
import type { MonthlyReminder, MonthlyReminderCategory, MonthlyReminderInput } from "@/types/monthlyReminder";

const storageKey = "japan-life-monthly-reminders";
const remindersEvent = "japan-life-monthly-reminders-change";

function isCategory(value: unknown): value is MonthlyReminderCategory {
  return monthlyReminderCategories.includes(value as MonthlyReminderCategory);
}

function sanitizeReminder(value: unknown): MonthlyReminder | null {
  if (!value || typeof value !== "object") return null;
  const item = value as Partial<MonthlyReminder>;
  if (typeof item.id !== "string" || typeof item.title !== "string" || !item.title.trim()) return null;
  const day = item.day;
  if (!Number.isInteger(day) || typeof day !== "number" || day < 1 || day > 31) return null;
  return {
    id: item.id,
    title: item.title.trim(),
    day,
    category: isCategory(item.category) ? item.category : "other",
    amount: typeof item.amount === "number" && Number.isFinite(item.amount) && item.amount > 0 ? item.amount : undefined,
    note: typeof item.note === "string" && item.note.trim() ? item.note.trim() : undefined,
    enabled: typeof item.enabled === "boolean" ? item.enabled : true,
    createdAt: typeof item.createdAt === "string" ? item.createdAt : new Date(0).toISOString(),
    updatedAt: typeof item.updatedAt === "string" ? item.updatedAt : new Date(0).toISOString(),
  };
}

function readReminders(): MonthlyReminder[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.map(sanitizeReminder).filter((item): item is MonthlyReminder => Boolean(item)).sort((a, b) => a.day - b.day)
      : [];
  } catch {
    return [];
  }
}

function createReminderId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return `monthly-${crypto.randomUUID()}`;
  return `monthly-${Date.now()}`;
}

export function useMonthlyReminders() {
  const [reminders, setReminders] = useState<MonthlyReminder[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const read = () => {
      setReminders(readReminders());
      setLoaded(true);
    };
    read();
    window.addEventListener("storage", read);
    window.addEventListener(remindersEvent, read);
    return () => {
      window.removeEventListener("storage", read);
      window.removeEventListener(remindersEvent, read);
    };
  }, []);

  const saveReminders = useCallback((next: MonthlyReminder[]) => {
    const sorted = [...next].sort((a, b) => a.day - b.day);
    setReminders(sorted);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(storageKey, JSON.stringify(sorted));
      window.dispatchEvent(new Event(remindersEvent));
    }
  }, []);

  const saveReminder = useCallback(
    (input: MonthlyReminderInput) => {
      const now = new Date().toISOString();
      const reminder: MonthlyReminder = {
        ...input,
        id: input.id ?? createReminderId(),
        title: input.title.trim(),
        amount: typeof input.amount === "number" && input.amount > 0 ? input.amount : undefined,
        note: input.note?.trim() || undefined,
        createdAt: input.createdAt ?? now,
        updatedAt: now,
      };
      saveReminders([reminder, ...reminders.filter((item) => item.id !== reminder.id)]);
      return reminder;
    },
    [reminders, saveReminders],
  );

  const deleteReminder = useCallback((id: string) => saveReminders(reminders.filter((item) => item.id !== id)), [reminders, saveReminders]);
  const toggleReminder = useCallback((id: string) => saveReminders(reminders.map((item) => (item.id === id ? { ...item, enabled: !item.enabled, updatedAt: new Date().toISOString() } : item))), [reminders, saveReminders]);

  return { deleteReminder, loaded, reminders, saveReminder, toggleReminder };
}
