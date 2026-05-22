"use client";

import { useCallback, useSyncExternalStore } from "react";
import { dashboardTools, defaultHomeToolKeys, maxHomeToolCount, type DashboardToolKey } from "@/data/tools";

const storageKey = "japan-life:home-tools";
const changeEvent = "japan-life:home-tools-change";
const validToolKeys = new Set<DashboardToolKey>(dashboardTools.map((tool) => tool.key));
let cachedRaw = "";
let cachedKeys: DashboardToolKey[] = defaultHomeToolKeys;

function normalizeToolKeys(value: unknown): DashboardToolKey[] {
  if (!Array.isArray(value)) return defaultHomeToolKeys;
  const keys = value.filter((item): item is DashboardToolKey => typeof item === "string" && validToolKeys.has(item as DashboardToolKey));
  const uniqueKeys = Array.from(new Set(keys));
  return uniqueKeys.length > 0 ? uniqueKeys.slice(0, maxHomeToolCount) : defaultHomeToolKeys;
}

function readHomeToolKeys() {
  if (typeof window === "undefined") return defaultHomeToolKeys;

  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) {
      cachedRaw = "";
      cachedKeys = defaultHomeToolKeys;
      return cachedKeys;
    }
    if (raw === cachedRaw) return cachedKeys;
    cachedRaw = raw;
    cachedKeys = normalizeToolKeys(JSON.parse(raw));
    return cachedKeys;
  } catch {
    cachedRaw = "";
    cachedKeys = defaultHomeToolKeys;
    return cachedKeys;
  }
}

function writeHomeToolKeys(keys: DashboardToolKey[]) {
  if (typeof window === "undefined") return;
  const normalized = normalizeToolKeys(keys);
  window.localStorage.setItem(storageKey, JSON.stringify(normalized));
  cachedRaw = JSON.stringify(normalized);
  cachedKeys = normalized;
  window.dispatchEvent(new Event(changeEvent));
}

export function useHomeTools() {
  const selectedToolKeys = useSyncExternalStore(
    (onStoreChange) => {
      window.addEventListener("storage", onStoreChange);
      window.addEventListener(changeEvent, onStoreChange);
      return () => {
        window.removeEventListener("storage", onStoreChange);
        window.removeEventListener(changeEvent, onStoreChange);
      };
    },
    readHomeToolKeys,
    () => defaultHomeToolKeys
  );

  const saveSelectedToolKeys = useCallback((keys: DashboardToolKey[]) => {
    writeHomeToolKeys(keys);
  }, []);

  const toggleToolKey = useCallback((key: DashboardToolKey) => {
    const current = readHomeToolKeys();
    const next = current.includes(key)
      ? current.filter((item) => item !== key)
      : [...current, key].slice(0, maxHomeToolCount);
    writeHomeToolKeys(next);
  }, []);

  const resetHomeTools = useCallback(() => {
    writeHomeToolKeys(defaultHomeToolKeys);
  }, []);

  return {
    maxCount: maxHomeToolCount,
    resetHomeTools,
    saveSelectedToolKeys,
    selectedToolKeys,
    storageKey,
    toggleToolKey,
  };
}
