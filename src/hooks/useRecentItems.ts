"use client";

import { useCallback, useSyncExternalStore } from "react";

export type RecentItem = {
  href: string;
  title: string;
  type?: string;
  viewedAt: string;
};

const storageKey = "japan-life:recent";
const recentEvent = "japan-life:recent-change";
const emptyRecentItems: RecentItem[] = [];
let cachedRaw = "";
let cachedItems: RecentItem[] = emptyRecentItems;

function normalizeItem(item: unknown): RecentItem | null {
  if (typeof item === "string") {
    return { href: "/search", title: item, type: "记录", viewedAt: new Date().toISOString() };
  }
  if (!item || typeof item !== "object") return null;
  const candidate = item as Partial<RecentItem>;
  if (typeof candidate.href !== "string" || typeof candidate.title !== "string") return null;
  return {
    href: candidate.href,
    title: candidate.title,
    type: typeof candidate.type === "string" ? candidate.type : "页面",
    viewedAt: typeof candidate.viewedAt === "string" ? candidate.viewedAt : new Date().toISOString(),
  };
}

function readRecentItems() {
  if (typeof window === "undefined") return emptyRecentItems;
  try {
    const raw = window.localStorage.getItem(storageKey) ?? "";
    if (!raw) {
      cachedRaw = "";
      cachedItems = emptyRecentItems;
      return cachedItems;
    }
    if (raw === cachedRaw) return cachedItems;
    const parsed = JSON.parse(raw) as unknown[];
    cachedRaw = raw;
    cachedItems = parsed.map(normalizeItem).filter((item): item is RecentItem => Boolean(item));
    return cachedItems;
  } catch {
    return emptyRecentItems;
  }
}

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(recentEvent, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(recentEvent, callback);
  };
}

export function useRecentItems() {
  const items = useSyncExternalStore(subscribe, readRecentItems, () => emptyRecentItems);

  const addRecentItem = useCallback((item: Omit<RecentItem, "viewedAt">) => {
    if (typeof window === "undefined") return;
    const next: RecentItem = { ...item, viewedAt: new Date().toISOString() };
    const deduped = readRecentItems().filter((current) => current.href !== item.href);
    window.localStorage.setItem(storageKey, JSON.stringify([next, ...deduped].slice(0, 20)));
    window.dispatchEvent(new Event(recentEvent));
  }, []);

  return { addRecentItem, items };
}
