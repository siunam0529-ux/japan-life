"use client";

import { useEffect, useRef } from "react";
import { exportJapanLifeData, hasJapanLifeLocalData, importJapanLifeData } from "@/lib/localDataBackup";
import { supabase } from "@/lib/supabase";
import type { JapanLifeUserData } from "@/types/userData";

const syncedUserKey = "japan-life:cloud-synced-user";
const syncStatusKey = "japan-life:cloud-sync-status";

const syncEvents = [
  "japan-life:user-settings-change",
  "japan-life:language-change",
  "japan-life:home-tools-change",
  "japan-life:home-rail-lines-change",
  "japan-life:life-checklist-change",
  "japan-life:procedure-navigator-change",
  "japan-life:favorites-change",
  "japan-life:recent-change",
  "japan-life-calendar-notes-change",
  "japan-life-garbage-schedule-change",
  "japan-life-monthly-reminders-change",
  "japan-life-reminder-statuses-change",
  "japan-life:visa-reminder-change",
  "japan-life-work-hours-change",
];

export function UserDataSync() {
  const timerRef = useRef<number | null>(null);
  const applyingRemoteRef = useRef(false);

  useEffect(() => {
    if (!supabase) return;

    let activeUserId = "";
    let activeAccessToken = "";

    const saveToCloud = async (mode: "auto" | "manual" = "auto") => {
      if (!activeUserId || !activeAccessToken || applyingRemoteRef.current) return;
      const payload = exportJapanLifeData();
      const response = await fetch("/api/user-app-data", {
        body: JSON.stringify({ data: payload }),
        headers: {
          authorization: `Bearer ${activeAccessToken}`,
          "content-type": "application/json",
        },
        method: "PUT",
      });
      const result = (await response.json().catch(() => null)) as { error?: string; hint?: string } | null;
      if (!response.ok) {
        setSyncStatus("error", result?.error || `SYNC_FAILED_${response.status}`, result?.hint);
        return;
      }
      window.localStorage.setItem(syncedUserKey, activeUserId);
      setSyncStatus("synced", mode === "manual" ? "已将本机设置同步到账号" : "已同步到账号");
    };

    const scheduleSave = () => {
      if (!activeUserId || applyingRemoteRef.current) return;
      if (timerRef.current) window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(saveToCloud, 900);
    };

    const saveBeforeUnload = () => {
      void saveToCloud();
    };

    const applyRemoteData = (data: JapanLifeUserData, userId: string) => {
      applyingRemoteRef.current = true;
      try {
        importJapanLifeData(data);
        window.localStorage.setItem(syncedUserKey, userId);
        setSyncStatus("synced", "已从账号恢复设置");
      } finally {
        window.setTimeout(() => {
          applyingRemoteRef.current = false;
        }, 0);
      }
    };

    const restoreOrUpload = async (accessToken: string, userId: string) => {
      activeUserId = userId;
      activeAccessToken = accessToken;

      const hasLocalData = hasJapanLifeLocalData();
      const syncedBefore = window.localStorage.getItem(syncedUserKey) === userId;

      const response = await fetch("/api/user-app-data", {
        headers: { authorization: `Bearer ${accessToken}` },
      });
      const result = (await response.json().catch(() => null)) as { data?: unknown; error?: string; hint?: string } | null;

      if (!response.ok) {
        setSyncStatus("error", result?.error || `SYNC_READ_FAILED_${response.status}`, result?.hint);
        if (hasLocalData) scheduleSave();
        return;
      }

      const remoteData = result?.data;
      const hasRemoteData = isJapanLifeCloudData(remoteData);

      if (!hasRemoteData) {
        if (hasLocalData) await saveToCloud("manual");
        return;
      }

      if (!hasLocalData || syncedBefore) {
        applyRemoteData(remoteData, userId);
        return;
      }

      const merged = mergeJapanLifeData(remoteData, exportJapanLifeData());
      applyRemoteData(merged, userId);
      await saveToCloud("manual");
    };

    supabase.auth.getSession().then(({ data }) => {
      const session = data.session;
      if (session?.user && session.access_token) {
        restoreOrUpload(session.access_token, session.user.id);
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user || !session.access_token) {
        activeUserId = "";
        activeAccessToken = "";
        return;
      }
      restoreOrUpload(session.access_token, session.user.id);
    });

    syncEvents.forEach((eventName) => window.addEventListener(eventName, scheduleSave));
    window.addEventListener("beforeunload", saveBeforeUnload);

    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
      listener.subscription.unsubscribe();
      syncEvents.forEach((eventName) => window.removeEventListener(eventName, scheduleSave));
      window.removeEventListener("beforeunload", saveBeforeUnload);
    };
  }, []);

  return null;
}

function isJapanLifeCloudData(value: unknown): value is JapanLifeUserData {
  return Boolean(value && typeof value === "object" && (value as { app?: unknown }).app === "Japan Life");
}

function mergeJapanLifeData(remote: JapanLifeUserData, local: JapanLifeUserData): JapanLifeUserData {
  return {
    ...remote,
    calendar: {
      ...remote.calendar,
      ...local.calendar,
      monthlyReminders: mergeJsonArrays(remote.calendar.monthlyReminders, local.calendar.monthlyReminders),
      notes: mergeJsonArrays(remote.calendar.notes, local.calendar.notes),
    },
    exportedAt: new Date().toISOString(),
    localStorage: mergeLocalStorage(remote.localStorage, local.localStorage),
    reminders: {
      statuses: {
        ...remote.reminders.statuses,
        ...local.reminders.statuses,
      },
    },
    settings: {
      ...remote.settings,
      ...local.settings,
    },
    userProfile: {
      ...remote.userProfile,
      ...local.userProfile,
    },
  };
}

function mergeLocalStorage(remote?: Record<string, string>, local?: Record<string, string>) {
  const merged = { ...(remote ?? {}), ...(local ?? {}) };
  mergeJsonStorageArray(merged, remote, local, "japan-life:favorites");
  mergeJsonStorageArray(merged, remote, local, "japan-life:recent");
  mergeJsonStorageArray(merged, remote, local, "japan-life-calendar-notes");
  mergeJsonStorageArray(merged, remote, local, "japan-life-monthly-reminders");
  return merged;
}

function mergeJsonStorageArray(storage: Record<string, string>, remote: Record<string, string> | undefined, local: Record<string, string> | undefined, key: string) {
  const merged = [...(parseJsonArray(remote?.[key]) ?? []), ...(parseJsonArray(local?.[key]) ?? [])];
  if (merged.length > 0) storage[key] = JSON.stringify(dedupeByJson(merged));
}

function mergeJsonArrays(remote: unknown[], local: unknown[]) {
  return dedupeByJson([...remote, ...local]);
}

function dedupeByJson(values: unknown[]) {
  const seen = new Set<string>();
  return values.filter((value) => {
    const key = JSON.stringify(value);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function parseJsonArray(raw?: string) {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function setSyncStatus(status: "synced" | "error", message: string, hint?: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(syncStatusKey, JSON.stringify({
    hint,
    message,
    status,
    updatedAt: new Date().toISOString(),
  }));
  window.dispatchEvent(new Event("japan-life:cloud-sync-status-change"));
}
