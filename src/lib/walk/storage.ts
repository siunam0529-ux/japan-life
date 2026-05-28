import type { DailyWalkPick, SkippedSpotIdsByDate, WalkCompletion, WalkFeedbackByDate, WalkMoodId, WalkRecord, WalkSpot, WalkVisitMap } from "@/lib/walk/types";
export type { DailyWalkPick, SkippedSpotIdsByDate, WalkCompletion, WalkFeedbackByDate, WalkFeedbackId, WalkHistoryItem, WalkMoodId, WalkRecord, WalkVisitMap } from "@/lib/walk/types";

export const walkMoodOptions: Array<{ emoji: string; id: WalkMoodId; label: string }> = [
  { emoji: "😊", id: "happy", label: "开心" },
  { emoji: "🌿", id: "relaxed", label: "放松" },
  { emoji: "🙂", id: "normal", label: "普通" },
  { emoji: "😮‍💨", id: "tired", label: "有点累" },
  { emoji: "☁️", id: "empty", label: "想放空" },
];

export const walkFavoriteStorageKey = "japan-life:walk-favorites";
export const walkRecordStorageKey = "japan-life:walk-records";
export const walkVisitedStorageKey = "japan-life:walk-visited";
export const walkCompletionStorageKey = "japan-life:walk-completion";
export const dailyPickStorageKey = "japan-life:walk-daily-pick";
export const skippedStorageKey = "japan-life:walk-skipped-by-date";
export const walkFeedbackStorageKey = "japan-life:walk-feedback";

export const walkStorageKeys = [
  walkFavoriteStorageKey,
  walkRecordStorageKey,
  walkVisitedStorageKey,
  walkCompletionStorageKey,
  dailyPickStorageKey,
  skippedStorageKey,
  walkFeedbackStorageKey,
];

export function getTokyoDateKey(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "Asia/Tokyo",
    year: "numeric",
  }).format(date);
}

function warnStorageRead(key: string, error: unknown) {
  console.warn(`[walk] localStorage read failed: ${key}`, error);
}

export function readWalkJsonObject(key: string) {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : {};
    return typeof parsed === "object" && parsed !== null && !Array.isArray(parsed) ? parsed : {};
  } catch (error) {
    warnStorageRead(key, error);
    return {};
  }
}

export function readWalkJsonArray(key: string) {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    warnStorageRead(key, error);
    return [];
  }
}

export function writeWalkStorage(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn(`[walk] localStorage write failed: ${key}`, error);
  }
}

export function resetWalkLocalStorage() {
  if (typeof window === "undefined") return;
  walkStorageKeys.forEach((key) => {
    window.localStorage.removeItem(key);
  });
}

export function readWalkFavoriteIds() {
  return readWalkJsonArray(walkFavoriteStorageKey).filter((id): id is string => typeof id === "string");
}

export function writeWalkFavoriteIds(ids: string[]) {
  writeWalkStorage(walkFavoriteStorageKey, Array.from(new Set(ids)));
}

export function readWalkRecords() {
  return readWalkJsonArray(walkRecordStorageKey)
    .filter((record): record is WalkRecord => typeof record === "object" && record !== null && typeof record.id === "string")
    .slice(0, 20);
}

export function writeWalkRecords(records: WalkRecord[]) {
  writeWalkStorage(walkRecordStorageKey, records.slice(0, 20));
}

export function readWalkCompletion(): WalkCompletion | null {
  const parsed = readWalkJsonObject(walkCompletionStorageKey) as Partial<WalkCompletion>;
  if (!parsed.date || !parsed.spotId || !parsed.station || !parsed.completedAt) return null;
  return {
    completedAt: String(parsed.completedAt),
    date: String(parsed.date),
    moodLabel: typeof parsed.moodLabel === "string" ? parsed.moodLabel : "🌿 放松",
    note: typeof parsed.note === "string" ? parsed.note : "完成了今天的散步。",
    spotId: String(parsed.spotId),
    station: String(parsed.station),
  };
}

export function writeWalkCompletion(completion: WalkCompletion) {
  writeWalkStorage(walkCompletionStorageKey, completion);
}

export function readWalkVisitedMap(): WalkVisitMap {
  const parsed = readWalkJsonObject(walkVisitedStorageKey);
  return Object.entries(parsed).reduce((acc, [spotId, value]) => {
    if (typeof value === "object" && value !== null && "count" in value) {
      const count = Number((value as { count?: unknown }).count);
      acc[spotId] = {
        count: Number.isFinite(count) ? count : 0,
        lastVisitedAt: typeof (value as { lastVisitedAt?: unknown }).lastVisitedAt === "string" ? String((value as { lastVisitedAt?: unknown }).lastVisitedAt) : "",
      };
    }
    return acc;
  }, {} as WalkVisitMap);
}

export function writeWalkVisitedMap(map: WalkVisitMap) {
  writeWalkStorage(walkVisitedStorageKey, map);
}

export function markWalkSpotVisited(spotId: string) {
  const current = readWalkVisitedMap();
  const previous = current[spotId]?.count ?? 0;
  const next = {
    ...current,
    [spotId]: {
      count: previous + 1,
      lastVisitedAt: new Date().toISOString(),
    },
  };
  writeWalkVisitedMap(next);
  return next;
}

export function createWalkRecord({
  mood,
  note,
  spot,
  weather,
}: {
  mood: WalkMoodId;
  note: string;
  spot: WalkSpot;
  weather: string;
}) {
  const moodOption = walkMoodOptions.find((item) => item.id === mood) ?? walkMoodOptions[2];
  return {
    id: `${spot.id}-${Date.now()}`,
    spotId: spot.id,
    station: spot.station,
    date: new Date().toISOString(),
    weather,
    mood,
    moodLabel: `${moodOption.emoji} ${moodOption.label}`,
    note,
    image: spot.image,
    tags: spot.moodTags,
  } satisfies WalkRecord;
}

export function readDailyWalkPick(): DailyWalkPick | null {
  const parsed = readWalkJsonObject(dailyPickStorageKey) as Partial<DailyWalkPick>;
  if (!parsed.date || !parsed.spotId || !parsed.task) return null;
  return {
    date: String(parsed.date),
    selectedTag: parsed.selectedTag ?? "全部",
    spotId: String(parsed.spotId),
    task: String(parsed.task),
  } as DailyWalkPick;
}

export function writeDailyWalkPick(pick: DailyWalkPick) {
  writeWalkStorage(dailyPickStorageKey, pick);
}

export function readSkippedSpotIdsByDate(): SkippedSpotIdsByDate {
  const parsed = readWalkJsonObject(skippedStorageKey);
  return Object.entries(parsed).reduce((acc, [date, ids]) => {
    acc[date] = Array.isArray(ids) ? ids.filter((id): id is string => typeof id === "string") : [];
    return acc;
  }, {} as SkippedSpotIdsByDate);
}

export function writeSkippedSpotIdsByDate(value: SkippedSpotIdsByDate) {
  writeWalkStorage(skippedStorageKey, value);
}

export function readWalkFeedbackByDate(): WalkFeedbackByDate {
  const parsed = readWalkJsonObject(walkFeedbackStorageKey);
  return Object.entries(parsed).reduce((acc, [date, value]) => {
    acc[date] = Array.isArray(value) ? value.filter((item): item is WalkFeedbackByDate[string][number] => ["tooFar", "tooCrowded", "notOutdoor", "noSpend", "tooTired"].includes(item)) : [];
    return acc;
  }, {} as WalkFeedbackByDate);
}

export function writeWalkFeedbackByDate(value: WalkFeedbackByDate) {
  writeWalkStorage(walkFeedbackStorageKey, value);
}
