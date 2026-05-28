"use client";

import { useCallback, useSyncExternalStore } from "react";
import { dashboardTools, defaultHomeToolKeys, maxHomeToolCount, type DashboardToolKey } from "@/data/tools";

const storageKey = "japan-life:home-tools";
const changeEvent = "japan-life:home-tools-change";
const validToolKeys = new Set<DashboardToolKey>(dashboardTools.map((tool) => tool.key));
const legacyDefaultHomeToolKeys: DashboardToolKey[] = [
  "salary",
  "rent",
  "exchange",
  "holidays",
  "livingCost",
  "resources",
  "deals",
];
const legacyDefaultHomeToolKeysWithWalk: DashboardToolKey[] = [
  "salary",
  "rent",
  "exchange",
  "holidays",
  "livingCost",
  "resources",
  "walk",
  "deals",
];
const legacyDefaultHomeToolKeysWithChecklist: DashboardToolKey[] = [
  "holidays",
  "livingCost",
  "resources",
  "deals",
  "rent",
  "salary",
  "exchange",
  "procedureNavigator",
  "lifeChecklist",
];
const legacyDefaultHomeToolKeysWithFoodTrainPlay: string[] = [
  "salary",
  "rent",
  "exchange",
  "holidays",
  "livingCost",
  "resources",
  "walk",
  "play",
  "food",
  "trainDeals",
];
const legacyDefaultHomeToolKeysWithPetsFoodTrainPlay: string[] = [
  "salary",
  "rent",
  "exchange",
  "holidays",
  "livingCost",
  "resources",
  "walk",
  "play",
  "pets",
  "food",
  "trainDeals",
];
let cachedRaw = "";
let cachedKeys: DashboardToolKey[] = defaultHomeToolKeys;

function sameToolKeys(left: readonly string[], right: readonly string[]) {
  return left.length === right.length && left.every((key, index) => key === right[index]);
}

function normalizeToolKeys(value: unknown): DashboardToolKey[] {
  if (!Array.isArray(value)) return defaultHomeToolKeys;
  const rawKeys = value.filter((item): item is string => typeof item === "string");
  const keys = rawKeys.filter((item): item is DashboardToolKey => validToolKeys.has(item as DashboardToolKey));
  const uniqueKeys = Array.from(new Set(keys));
  if (sameToolKeys(uniqueKeys, legacyDefaultHomeToolKeys)) return defaultHomeToolKeys;
  if (sameToolKeys(uniqueKeys, legacyDefaultHomeToolKeysWithWalk)) return defaultHomeToolKeys;
  if (sameToolKeys(uniqueKeys, legacyDefaultHomeToolKeysWithChecklist)) return defaultHomeToolKeys;
  if (sameToolKeys(rawKeys, legacyDefaultHomeToolKeysWithFoodTrainPlay)) return defaultHomeToolKeys;
  if (sameToolKeys(rawKeys, legacyDefaultHomeToolKeysWithPetsFoodTrainPlay)) return defaultHomeToolKeys;
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
