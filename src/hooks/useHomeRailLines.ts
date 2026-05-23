"use client";

import { useCallback, useSyncExternalStore } from "react";
import { defaultHomeRailLineIds, maxHomeRailLineCount, tokyoTrainStatusLines, type TrainStatusLineId } from "@/data/trainStatus";

const storageKey = "japan-life:home-rail-lines";
const changeEvent = "japan-life:home-rail-lines-change";
const validRailLineIds = new Set<TrainStatusLineId>(tokyoTrainStatusLines.ja.map((line) => line.id as TrainStatusLineId));
const defaultSelectedRailLineIds: TrainStatusLineId[] = [...defaultHomeRailLineIds];
let cachedRaw = "";
let cachedIds: TrainStatusLineId[] = defaultSelectedRailLineIds;

function normalizeRailLineIds(value: unknown): TrainStatusLineId[] {
  if (!Array.isArray(value)) return defaultSelectedRailLineIds;
  const ids = value.filter((item): item is TrainStatusLineId => typeof item === "string" && validRailLineIds.has(item as TrainStatusLineId));
  const uniqueIds = Array.from(new Set(ids));
  return uniqueIds.length > 0 ? uniqueIds.slice(0, maxHomeRailLineCount) : defaultSelectedRailLineIds;
}

function readRailLineIds() {
  if (typeof window === "undefined") return defaultSelectedRailLineIds;
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) {
      cachedRaw = "";
      cachedIds = defaultSelectedRailLineIds;
      return cachedIds;
    }
    if (raw === cachedRaw) return cachedIds;
    cachedRaw = raw;
    cachedIds = normalizeRailLineIds(JSON.parse(raw));
    return cachedIds;
  } catch {
    cachedRaw = "";
    cachedIds = defaultSelectedRailLineIds;
    return cachedIds;
  }
}

function writeRailLineIds(ids: TrainStatusLineId[]) {
  if (typeof window === "undefined") return;
  const normalized = normalizeRailLineIds(ids);
  const raw = JSON.stringify(normalized);
  window.localStorage.setItem(storageKey, raw);
  cachedRaw = raw;
  cachedIds = normalized;
  window.dispatchEvent(new Event(changeEvent));
}

export function useHomeRailLines() {
  const selectedRailLineIds = useSyncExternalStore(
    (onStoreChange) => {
      window.addEventListener("storage", onStoreChange);
      window.addEventListener(changeEvent, onStoreChange);
      return () => {
        window.removeEventListener("storage", onStoreChange);
        window.removeEventListener(changeEvent, onStoreChange);
      };
    },
    readRailLineIds,
    () => defaultSelectedRailLineIds
  );

  const toggleRailLineId = useCallback((id: TrainStatusLineId) => {
    const current = readRailLineIds();
    const next = current.includes(id)
      ? current.filter((item) => item !== id)
      : [...current, id].slice(0, maxHomeRailLineCount);
    writeRailLineIds(next);
  }, []);

  const saveSelectedRailLineIds = useCallback((ids: TrainStatusLineId[]) => {
    writeRailLineIds(ids);
  }, []);

  const resetRailLineIds = useCallback(() => {
    writeRailLineIds(defaultSelectedRailLineIds);
  }, []);

  return {
    maxCount: maxHomeRailLineCount,
    resetRailLineIds,
    saveSelectedRailLineIds,
    selectedRailLineIds,
    storageKey,
    toggleRailLineId,
  };
}
