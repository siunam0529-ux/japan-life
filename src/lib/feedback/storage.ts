import type { UserFeedback, UserFeedbackStatus } from "@/lib/feedback/types";

const feedbackStorageKey = "japan-life:user-feedback";

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

export function readLocalFeedback() {
  return readJson<UserFeedback[]>(feedbackStorageKey, []);
}

export function addLocalFeedback(input: Pick<UserFeedback, "message" | "page" | "pageUrl" | "type" | "userAgent">) {
  const now = new Date().toISOString();
  const item: UserFeedback = {
    ...input,
    createdAt: now,
    id: `feedback-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    status: "open",
    updatedAt: now,
  };
  writeJson(feedbackStorageKey, [item, ...readLocalFeedback()].slice(0, 200));
  return item;
}

export function updateLocalFeedbackStatus(id: string, status: UserFeedbackStatus) {
  const next = readLocalFeedback().map((item) => item.id === id ? { ...item, status, updatedAt: new Date().toISOString() } : item);
  writeJson(feedbackStorageKey, next);
  return next.find((item) => item.id === id) ?? null;
}
