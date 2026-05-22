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

  const activeReminders = reminders.filter((item) => item.status === "active");
  const todayReminders = activeReminders.filter((item) => item.date === today);
  const weekEnd = addDays(today, 7);
  const weekReminders = activeReminders.filter((item) => item.date >= today && item.date <= weekEnd);
  const completedReminders = reminders.filter((item) => item.status !== "active");

  return {
    activeReminders,
    completedReminders,
    dismissReminder: (id: string) => setReminderStatus(id, "dismissed"),
    doneReminder: (id: string) => setReminderStatus(id, "done"),
    reminderStatusStorageKey,
    reminders,
    restoreReminder,
    statuses,
    today,
    todayCount: todayReminders.length,
    todayReminders,
    weekCount: weekReminders.length,
    weekReminders,
    diffFromToday: (date: string) => diffDays(today, date),
  };
}
