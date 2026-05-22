"use client";

import { useEffect, useRef } from "react";
import { exportJapanLifeData, hasJapanLifeLocalData, importJapanLifeData } from "@/lib/localDataBackup";
import { supabase } from "@/lib/supabase";

const syncedUserKey = "japan-life:cloud-synced-user";
const syncStatusKey = "japan-life:cloud-sync-status";
const syncEvents = [
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
  "japan-life:submissions-change",
];

export function UserDataSync() {
  const timerRef = useRef<number | null>(null);
  const applyingRemoteRef = useRef(false);

  useEffect(() => {
    if (!supabase) return;

    let activeUserId = "";
    let activeAccessToken = "";

    const saveToCloud = async () => {
      if (!activeUserId || !activeAccessToken || applyingRemoteRef.current) return;
      const payload = exportJapanLifeData();
      const response = await fetch("/api/user-app-data", {
        method: "PUT",
        headers: {
          authorization: `Bearer ${activeAccessToken}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({ data: payload }),
      });
      const result = await response.json().catch(() => null) as { error?: string; hint?: string } | null;
      if (!response.ok) {
        setSyncStatus("error", result?.error || `SYNC_FAILED_${response.status}`, result?.hint);
        return;
      }
      window.localStorage.setItem(syncedUserKey, activeUserId);
      setSyncStatus("synced", "SYNCED");
    };

    const scheduleSave = () => {
      if (!activeUserId || applyingRemoteRef.current) return;
      if (timerRef.current) window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(saveToCloud, 900);
    };

    const restoreOrUpload = async (accessToken: string, userId: string) => {
      activeUserId = userId;
      activeAccessToken = accessToken;
      const hasLocalData = hasJapanLifeLocalData();
      const syncedBefore = window.localStorage.getItem(syncedUserKey) === userId;

      const response = await fetch("/api/user-app-data", {
        headers: { authorization: `Bearer ${accessToken}` },
      });
      const result = await response.json().catch(() => null) as { data?: unknown; error?: string; hint?: string } | null;

      if (!response.ok) {
        setSyncStatus("error", result?.error || `SYNC_READ_FAILED_${response.status}`, result?.hint);
        if (hasLocalData) scheduleSave();
        return;
      }

      if (result?.data && (!hasLocalData || syncedBefore)) {
        applyingRemoteRef.current = true;
        try {
          importJapanLifeData(result.data);
          window.localStorage.setItem(syncedUserKey, userId);
          setSyncStatus("synced", "RESTORED");
        } finally {
          window.setTimeout(() => {
            applyingRemoteRef.current = false;
          }, 0);
        }
        return;
      }

      scheduleSave();
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
    window.addEventListener("beforeunload", saveToCloud);

    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
      listener.subscription.unsubscribe();
      syncEvents.forEach((eventName) => window.removeEventListener(eventName, scheduleSave));
      window.removeEventListener("beforeunload", saveToCloud);
    };
  }, []);

  return null;
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
