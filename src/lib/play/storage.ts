import type { PlayDailyPick, PlayFilterTag, PlayMode, PlaySavedDestination, PlayVisitedRecord } from "@/lib/play/types";

const favoriteKey = "japan-life-play-favorites";
const visitedKey = "japan-life-play-visited";
const dailyPickKey = "japan-life-play-daily-pick";

function safeRead<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch (error) {
    console.warn(`[play] localStorage read failed: ${key}`, error);
    return fallback;
  }
}

function safeWrite<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn(`[play] localStorage write failed: ${key}`, error);
  }
}

export function getPlayDateKey(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "Asia/Tokyo",
    year: "numeric",
  }).format(date);
}

export function readPlayFavoriteIds() {
  return readPlayFavorites().map((item) => item.destinationId);
}

export function readPlayFavorites(): PlaySavedDestination[] {
  const value = safeRead<unknown>(favoriteKey, []);
  if (!Array.isArray(value)) return [];
  return value
    .map((item): PlaySavedDestination | null => {
      if (typeof item === "string") return { date: "", destinationId: item, mode: "半日游", selectedTags: [] };
      if (!item || typeof item !== "object") return null;
      const record = item as Partial<PlaySavedDestination>;
      if (typeof record.destinationId !== "string") return null;
      return {
        date: typeof record.date === "string" ? record.date : "",
        destinationId: record.destinationId,
        mode: isPlayMode(record.mode) ? record.mode : "半日游",
        selectedTags: Array.isArray(record.selectedTags) ? record.selectedTags.filter((tag): tag is PlayFilterTag => typeof tag === "string") : [],
      };
    })
    .filter((item): item is PlaySavedDestination => item !== null);
}

export function writePlayFavorites(items: PlaySavedDestination[]) {
  safeWrite(favoriteKey, dedupeByDestination(items));
}

export function readPlayVisitedMap() {
  return readPlayVisitedRecords().reduce<Record<string, string>>((acc, record) => {
    acc[record.destinationId] = record.date;
    return acc;
  }, {});
}

export function readPlayVisitedRecords(): PlayVisitedRecord[] {
  const value = safeRead<unknown>(visitedKey, {});
  if (Array.isArray(value)) {
    return value
      .map((item): PlayVisitedRecord | null => {
        if (!item || typeof item !== "object") return null;
        const record = item as Partial<PlayVisitedRecord>;
        if (typeof record.destinationId !== "string") return null;
        return {
          date: typeof record.date === "string" ? record.date : "",
          destinationId: record.destinationId,
          mode: isPlayMode(record.mode) ? record.mode : "半日游",
          note: typeof record.note === "string" ? record.note : undefined,
        };
      })
      .filter((item): item is PlayVisitedRecord => item !== null);
  }
  if (!value || typeof value !== "object") return [];
  return Object.entries(value).reduce<PlayVisitedRecord[]>((acc, [destinationId, date]) => {
    if (typeof date === "string") acc.push({ date, destinationId, mode: "半日游" });
    return acc;
  }, []);
}

export function writePlayVisitedRecords(records: PlayVisitedRecord[]) {
  safeWrite(visitedKey, dedupeByDestination(records));
}

export function readPlayDailyPick(dateKey: string): PlayDailyPick | null {
  const value = safeRead<Partial<PlayDailyPick> | null>(dailyPickKey, null);
  if (!value || value.date !== dateKey || typeof value.destinationId !== "string") return null;
  const filters = Array.isArray(value.filters) ? value.filters.filter((item): item is PlayFilterTag => typeof item === "string") : [];
  return { date: dateKey, destinationId: value.destinationId, filters, mode: isPlayMode(value.mode) ? value.mode : "半日游" };
}

export function writePlayDailyPick(pick: PlayDailyPick) {
  safeWrite(dailyPickKey, pick);
}

export function resetPlayStorage() {
  if (typeof window === "undefined") return;
  try {
    [favoriteKey, visitedKey, dailyPickKey].forEach((key) => window.localStorage.removeItem(key));
  } catch (error) {
    console.warn("[play] localStorage reset failed", error);
  }
}

function isPlayMode(value: unknown): value is PlayMode {
  return value === "半日游" || value === "一日游" || value === "傍晚出发" || value === "周末小旅行";
}

function dedupeByDestination<T extends { destinationId: string }>(items: T[]) {
  return Array.from(new Map(items.map((item) => [item.destinationId, item])).values());
}
