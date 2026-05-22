"use client";

import { useCallback, useSyncExternalStore } from "react";

export type SubmissionType = "contact" | "claim";

export type LocalSubmission = {
  id: string;
  type: SubmissionType;
  createdAt: string;
  payload: Record<string, string | string[] | number | boolean | null>;
};

const storageKey = "japan-life:submissions";
const submissionEvent = "japan-life:submissions-change";
const emptySubmissions: LocalSubmission[] = [];
let cachedRaw = "";
let cachedSubmissions: LocalSubmission[] = emptySubmissions;

function readSubmissions() {
  if (typeof window === "undefined") return emptySubmissions;
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) {
      cachedRaw = "";
      cachedSubmissions = emptySubmissions;
      return cachedSubmissions;
    }
    if (raw === cachedRaw) return cachedSubmissions;
    const parsed = JSON.parse(raw);
    cachedRaw = raw;
    cachedSubmissions = Array.isArray(parsed)
      ? parsed.filter((item): item is LocalSubmission => typeof item?.id === "string" && typeof item.type === "string" && typeof item.createdAt === "string")
      : emptySubmissions;
    return cachedSubmissions;
  } catch {
    return emptySubmissions;
  }
}

export function useLocalSubmissions() {
  const submissions = useSyncExternalStore(
    (onStoreChange) => {
      window.addEventListener("storage", onStoreChange);
      window.addEventListener(submissionEvent, onStoreChange);

      return () => {
        window.removeEventListener("storage", onStoreChange);
        window.removeEventListener(submissionEvent, onStoreChange);
      };
    },
    readSubmissions,
    () => emptySubmissions,
  );

  const addSubmission = useCallback((type: SubmissionType, payload: LocalSubmission["payload"]) => {
    const next: LocalSubmission = {
      id: `${type}-${Date.now()}`,
      type,
      createdAt: new Date().toISOString(),
      payload,
    };
    if (typeof window !== "undefined") {
      window.localStorage.setItem(storageKey, JSON.stringify([next, ...readSubmissions()].slice(0, 50)));
      window.dispatchEvent(new Event(submissionEvent));
    }
    return next;
  }, []);

  return { addSubmission, submissions };
}
