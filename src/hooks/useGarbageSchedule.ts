"use client";

import { useCallback, useEffect, useState } from "react";
import { emptyGarbageScheduleState, garbageTypes, type GarbageFrequency, type GarbageScheduleRule, type GarbageScheduleState } from "@/lib/calendar/garbageSchedule";

const storageKey = "japan-life-garbage-schedule";
const scheduleEvent = "japan-life-garbage-schedule-change";
const frequencies: GarbageFrequency[] = ["weekly", "biweekly", "monthlyDate", "monthlyWeekday"];

function isValidWeekOfMonth(value: unknown): value is GarbageScheduleRule["weekOfMonth"] {
  return value === 1 || value === 2 || value === 3 || value === 4 || value === 5 || value === "last";
}

function sanitizeRule(value: unknown): GarbageScheduleRule | null {
  if (!value || typeof value !== "object") return null;
  const rule = value as Partial<GarbageScheduleRule>;
  if (typeof rule.id !== "string" || !frequencies.includes(rule.frequency as GarbageFrequency)) return null;
  const selectedTypes = Array.isArray(rule.garbageTypes) ? rule.garbageTypes.filter((type) => garbageTypes.includes(type)) : [];
  return {
    id: rule.id,
    enabled: typeof rule.enabled === "boolean" ? rule.enabled : true,
    garbageTypes: selectedTypes,
    frequency: rule.frequency as GarbageFrequency,
    weekdays: Array.isArray(rule.weekdays) ? rule.weekdays.filter((day) => Number.isInteger(day) && day >= 0 && day <= 6) : undefined,
    startDate: typeof rule.startDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(rule.startDate) ? rule.startDate : undefined,
    monthDays: Array.isArray(rule.monthDays) ? rule.monthDays.filter((day) => Number.isInteger(day) && day >= 1 && day <= 31) : undefined,
    weekOfMonth: isValidWeekOfMonth(rule.weekOfMonth) ? rule.weekOfMonth : undefined,
    weekday: typeof rule.weekday === "number" && rule.weekday >= 0 && rule.weekday <= 6 ? rule.weekday : undefined,
    reminderTime: typeof rule.reminderTime === "string" && /^\d{2}:\d{2}$/.test(rule.reminderTime) ? rule.reminderTime : "07:30",
    note: typeof rule.note === "string" && rule.note.trim() ? rule.note.trim() : undefined,
    createdAt: typeof rule.createdAt === "string" ? rule.createdAt : new Date(0).toISOString(),
    updatedAt: typeof rule.updatedAt === "string" ? rule.updatedAt : new Date(0).toISOString(),
  };
}

function readSchedule(): GarbageScheduleState {
  if (typeof window === "undefined") return emptyGarbageScheduleState;
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return emptyGarbageScheduleState;
    const parsed = JSON.parse(raw) as Partial<GarbageScheduleState>;
    if (!parsed || !Array.isArray(parsed.rules)) return emptyGarbageScheduleState;
    return { rules: parsed.rules.map(sanitizeRule).filter((rule): rule is GarbageScheduleRule => Boolean(rule)) };
  } catch {
    return emptyGarbageScheduleState;
  }
}

function createRuleId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return `garbage-${crypto.randomUUID()}`;
  return `garbage-${Date.now()}`;
}

export function useGarbageSchedule() {
  const [state, setState] = useState<GarbageScheduleState>(emptyGarbageScheduleState);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const read = () => {
      setState(readSchedule());
      setLoaded(true);
    };
    read();
    window.addEventListener("storage", read);
    window.addEventListener(scheduleEvent, read);
    return () => {
      window.removeEventListener("storage", read);
      window.removeEventListener(scheduleEvent, read);
    };
  }, []);

  const saveState = useCallback((nextState: GarbageScheduleState) => {
    setState(nextState);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(storageKey, JSON.stringify(nextState));
      window.dispatchEvent(new Event(scheduleEvent));
    }
  }, []);

  const saveRule = useCallback(
    (input: Omit<GarbageScheduleRule, "id" | "createdAt" | "updatedAt"> & { id?: string; createdAt?: string }) => {
      const now = new Date().toISOString();
      const rule: GarbageScheduleRule = {
        ...input,
        id: input.id ?? createRuleId(),
        createdAt: input.createdAt ?? now,
        updatedAt: now,
      };
      saveState({ rules: [rule, ...state.rules.filter((item) => item.id !== rule.id)] });
      return rule;
    },
    [saveState, state.rules],
  );

  const deleteRule = useCallback((id: string) => saveState({ rules: state.rules.filter((rule) => rule.id !== id) }), [saveState, state.rules]);
  const clearRules = useCallback(() => saveState(emptyGarbageScheduleState), [saveState]);
  const toggleRule = useCallback((id: string) => saveState({ rules: state.rules.map((rule) => (rule.id === id ? { ...rule, enabled: !rule.enabled, updatedAt: new Date().toISOString() } : rule)) }), [saveState, state.rules]);

  return { clearRules, deleteRule, loaded, rules: state.rules, saveRule, toggleRule };
}
