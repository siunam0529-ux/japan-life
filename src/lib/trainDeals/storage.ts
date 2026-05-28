const favoriteKey = "japan-life-train-deals-favorites";
const frequentKey = "japan-life-train-deals-frequent";

function safeReadJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch (error) {
    console.warn("Train deals localStorage read failed", error);
    return fallback;
  }
}

function safeWriteJson<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn("Train deals localStorage write failed", error);
  }
}

export function readTrainDealFavoriteIds() {
  const value = safeReadJson<unknown>(favoriteKey, []);
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

export function writeTrainDealFavoriteIds(ids: string[]) {
  safeWriteJson(favoriteKey, Array.from(new Set(ids)));
}

export function readTrainDealFrequentIds() {
  const value = safeReadJson<unknown>(frequentKey, []);
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

export function writeTrainDealFrequentIds(ids: string[]) {
  safeWriteJson(frequentKey, Array.from(new Set(ids)));
}
