"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useCalendarNotes } from "@/hooks/useCalendarNotes";
import { useGarbageSchedule } from "@/hooks/useGarbageSchedule";
import { useLanguage } from "@/hooks/useLanguage";
import { useMonthlyReminders } from "@/hooks/useMonthlyReminders";
import { getTokyoDateString } from "@/lib/api/holidays";
import { addDays, buildReminders, diffDays, readReminderStatuses, reminderStatusStorageKey, saveReminderStatuses } from "@/lib/reminders";
import type { ReminderItem, ReminderStatusStore } from "@/types/reminder";

export function useReminders() {
  const { language } = useLanguage();
  const { rules: garbageRules } = useGarbageSchedule();
  const { reminders: monthlyReminders } = useMonthlyReminders();
  const { notes } = useCalendarNotes();
  const [statuses, setStatuses] = useState<ReminderStatusStore>({});
  const [today, setToday] = useState("2026-05-21");

  useEffect(() => {
    const read = () => setStatuses(readReminderStatuses());
    setToday(getTokyoDateString());
    read();
    window.addEventListener("storage", read);
    window.addEventListener("japan-life-reminder-statuses-change", read);
    return () => {
      window.removeEventListener("storage", read);
      window.removeEventListener("japan-life-reminder-statuses-change", read);
    };
  }, []);

  const reminders = useMemo(
    () =>
      buildReminders({
        fromDate: today,
        garbageRules,
        monthlyReminders,
        notes,
        statuses,
        language,
      }),
    [garbageRules, language, monthlyReminders, notes, statuses, today],
  );

  const setReminderStatus = useCallback(
    (id: string, status: "done" | "dismissed") => {
      const next = { ...statuses, [id]: { status, updatedAt: new Date().toISOString() } };
      setStatuses(next);
      saveReminderStatuses(next);
    },
    [statuses],
  );

  const restoreReminder = useCallback(
    (id: string) => {
      const next = { ...statuses };
      delete next[id];
      setStatuses(next);
      saveReminderStatuses(next);
    },
    [statuses],
  );

  const activeReminders = useMemo(() => reminders.filter((item) => item.status === "active"), [reminders]);
  const todayReminders = useMemo(() => activeReminders.filter((item) => item.date === today), [activeReminders, today]);
  const weekEnd = useMemo(() => addDays(today, 7), [today]);
  const weekReminders = useMemo(() => activeReminders.filter((item) => item.date >= today && item.date <= weekEnd), [activeReminders, today, weekEnd]);
  const completedReminders = useMemo(() => reminders.filter((item) => item.status !== "active"), [reminders]);
  const dismissReminder = useCallback((id: string) => setReminderStatus(id, "dismissed"), [setReminderStatus]);
  const doneReminder = useCallback((id: string) => setReminderStatus(id, "done"), [setReminderStatus]);
  const diffFromToday = useCallback((date: string) => diffDays(today, date), [today]);

  return {
    activeReminders,
    completedReminders,
    dismissReminder,
    doneReminder,
    reminderStatusStorageKey,
    reminders,
    restoreReminder,
    statuses,
    today,
    todayCount: todayReminders.length,
    todayReminders,
    weekCount: weekReminders.length,
    weekReminders,
    diffFromToday,
  };
}
