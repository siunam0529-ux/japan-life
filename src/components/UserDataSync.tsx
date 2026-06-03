"use client";

import { useEffect, useRef } from "react";
import { exportJapanLifeData, hasJapanLifeLocalData, importJapanLifeData, isJapanLifeStorageKey } from "@/lib/localDataBackup";
import { supabase } from "@/lib/supabase";
import type { JapanLifeUserData } from "@/types/userData";

const syncedUserKey = "japan-life:cloud-synced-user";
const syncStatusKey = "japan-life:cloud-sync-status";

const syncEvents = [
  "japan-life:user-settings-change",
  "japan-life:language-change",
  "japan-life:home-tools-change",
  "japan-life:home-rail-lines-change",
  "japan-life:me-profile-change",
  "japan-life:life-checklist-change",
  "japan-life:procedure-navigator-change",
  "japan-life:favorites-change",
  "japan-life-calendar-notes-change",
  "japan-life-garbage-schedule-change",
  "japan-life-monthly-reminders-change",
  "japan-life-reminder-statuses-change",
  "japan-life:visa-reminder-change",
];

export function UserDataSync() {
  const timerRef = useRef<number | null>(null);
  const applyingRemoteRef = useRef(false);

  useEffect(() => {
    if (!supabase) return;

    let activeUserId = "";
    let activeAccessToken = "";
    let restoreInFlightKey = "";
    let restoredSessionKey = "";
    let syncInFlight = false;

    const saveToCloud = async (mode: "auto" | "manual" = "auto") => {
      if (!activeUserId || !activeAccessToken || applyingRemoteRef.current || syncInFlight) return;
      syncInFlight = true;
      const payload = exportJapanLifeData();
      try {
        const response = await fetchWithTimeout("/api/user-app-data", {
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
          if (response.status === 401) {
            activeAccessToken = "";
          }
          return;
        }
        window.localStorage.setItem(syncedUserKey, activeUserId);
        setSyncStatus("synced", mode === "manual" ? "已将本机设置同步到账号" : "已同步到账号");
      } catch {
        setSyncStatus("error", "同步超时，稍后会自动重试");
      } finally {
        syncInFlight = false;
      }
    };

    const scheduleSave = () => {
      if (!activeUserId || applyingRemoteRef.current) return;
      if (timerRef.current) window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(saveToCloud, 900);
    };

    const originalSetItem = Storage.prototype.setItem;
    const originalRemoveItem = Storage.prototype.removeItem;
    const originalClear = Storage.prototype.clear;

    Storage.prototype.setItem = function setItem(key: string, value: string) {
      const storageKey = String(key);
      const shouldTrack = isLocalStorage(this) && isJapanLifeStorageKey(storageKey);
      const previous = shouldTrack ? window.localStorage.getItem(storageKey) : null;
      originalSetItem.call(this, storageKey, String(value));
      if (shouldTrack && previous !== String(value)) scheduleSave();
    };

    Storage.prototype.removeItem = function removeItem(key: string) {
      const storageKey = String(key);
      const shouldTrack = isLocalStorage(this) && isJapanLifeStorageKey(storageKey);
      const hadValue = shouldTrack && window.localStorage.getItem(storageKey) !== null;
      originalRemoveItem.call(this, storageKey);
      if (hadValue) scheduleSave();
    };

    Storage.prototype.clear = function clear() {
      const hadSyncedData = isLocalStorage(this) && hasJapanLifeLocalData();
      originalClear.call(this);
      if (hadSyncedData) scheduleSave();
    };

    const saveBeforeUnload = () => {
      void saveToCloud();
    };

    const handleStorageChange = (event: StorageEvent) => {
      if (event.storageArea === window.localStorage && event.key && isJapanLifeStorageKey(event.key)) {
        scheduleSave();
      }
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
      const sessionKey = `${userId}:${accessToken}`;
      if (restoreInFlightKey === sessionKey || restoredSessionKey === sessionKey) return;
      restoreInFlightKey = sessionKey;
      activeUserId = userId;
      activeAccessToken = accessToken;

      try {
        const hasLocalData = hasJapanLifeLocalData();
        const syncedBefore = window.localStorage.getItem(syncedUserKey) === userId;

        const response = await fetchWithTimeout("/api/user-app-data", {
          headers: { authorization: `Bearer ${accessToken}` },
        }).catch(() => null);
        if (!response) {
          setSyncStatus("error", "同步读取超时，稍后会自动重试");
          if (hasLocalData) scheduleSave();
          return;
        }
        const result = (await response.json().catch(() => null)) as { data?: unknown; error?: string; hint?: string } | null;

        if (!response.ok) {
          setSyncStatus("error", result?.error || `SYNC_READ_FAILED_${response.status}`, result?.hint);
          if (response.status === 401) {
            activeAccessToken = "";
            return;
          }
          if (hasLocalData) scheduleSave();
          return;
        }

        const remoteData = result?.data;
        const hasRemoteData = isJapanLifeCloudData(remoteData);

        if (!hasRemoteData) {
          if (hasLocalData) await saveToCloud("manual");
          restoredSessionKey = sessionKey;
          return;
        }

        if (!hasLocalData || syncedBefore) {
          applyRemoteData(remoteData, userId);
          restoredSessionKey = sessionKey;
          return;
        }

        const merged = mergeJapanLifeData(remoteData, exportJapanLifeData());
        applyRemoteData(merged, userId);
        await saveToCloud("manual");
        restoredSessionKey = sessionKey;
      } finally {
        if (restoreInFlightKey === sessionKey) restoreInFlightKey = "";
      }
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
    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("beforeunload", saveBeforeUnload);

    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
      Storage.prototype.setItem = originalSetItem;
      Storage.prototype.removeItem = originalRemoveItem;
      Storage.prototype.clear = originalClear;
      listener.subscription.unsubscribe();
      syncEvents.forEach((eventName) => window.removeEventListener(eventName, scheduleSave));
      window.removeEventListener("storage", handleStorageChange);
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
  const keys = new Set([...Object.keys(remote ?? {}), ...Object.keys(local ?? {})]);
  keys.forEach((key) => {
    mergeJsonStorageValue(merged, remote, local, key);
  });
  return merged;
}

function mergeJsonStorageValue(storage: Record<string, string>, remote: Record<string, string> | undefined, local: Record<string, string> | undefined, key: string) {
  const remoteArray = parseJsonArray(remote?.[key]);
  const localArray = parseJsonArray(local?.[key]);
  if (remoteArray || localArray) {
    storage[key] = JSON.stringify(dedupeByJson([...(remoteArray ?? []), ...(localArray ?? [])]));
    return;
  }

  const remoteObject = parseJsonObject(remote?.[key]);
  const localObject = parseJsonObject(local?.[key]);
  if (remoteObject || localObject) {
    storage[key] = JSON.stringify({ ...(remoteObject ?? {}), ...(localObject ?? {}) });
  }
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

function parseJsonObject(raw?: string) {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed as Record<string, unknown> : null;
  } catch {
    return null;
  }
}

function isLocalStorage(storage: Storage) {
  try {
    return storage === window.localStorage;
  } catch {
    return false;
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

function fetchWithTimeout(input: RequestInfo | URL, init?: RequestInit, timeoutMs = 2500) {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);
  return fetch(input, { ...init, signal: controller.signal }).finally(() => window.clearTimeout(timer));
}
