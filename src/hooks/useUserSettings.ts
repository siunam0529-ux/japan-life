"use client";

import { useCallback, useSyncExternalStore } from "react";
import { Language } from "@/lib/i18n/translations";

export type Region = "tokyo" | "osaka" | "kyoto" | "fukuoka" | "other";
export type LifeStatus = "student" | "work" | "family" | "permanent" | "highlySkilled" | "japanese" | "other";
export type Currency = "CNY" | "HKD" | "TWD" | "USD" | "JPY";
export type UserSettingsSource = "manual" | "geolocation";

export type UserResolvedLocation = {
  prefecture: string;
  city: string;
  latitude: number;
  longitude: number;
  updatedAt: string;
};

export type UserSettings = {
  region: Region;
  areaId: string | null;
  regionSource: UserSettingsSource | null;
  location: UserResolvedLocation | null;
  locationSource: UserSettingsSource | null;
  status: LifeStatus;
  language: Language;
  currency: Currency;
  defaultCurrency: Currency;
  worksPartTime: boolean;
  isWorking: boolean;
  rentsHome: boolean;
  isRenting: boolean;
  onboardingCompleted: boolean;
  updatedAt: string;
};

const STORAGE_KEY = "japan-life:user-settings";
const SETTINGS_EVENT = "japan-life:user-settings-change";
const FALLBACK_UPDATED_AT = "2026-05-20T09:30:00+09:00";
let cachedSettingsRaw = "";
let cachedSettings: UserSettings | null = null;

export const defaultUserSettings: UserSettings = {
  region: "tokyo",
  areaId: null,
  regionSource: null,
  location: null,
  locationSource: null,
  status: "student",
  language: "zh-CN",
  currency: "CNY",
  defaultCurrency: "CNY",
  worksPartTime: true,
  isWorking: true,
  rentsHome: true,
  isRenting: true,
  onboardingCompleted: false,
  updatedAt: FALLBACK_UPDATED_AT,
};

function readSettings(): UserSettings | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      cachedSettingsRaw = "";
      cachedSettings = null;
      return cachedSettings;
    }
    if (raw === cachedSettingsRaw) return cachedSettings;
    const parsed = JSON.parse(raw) as Partial<UserSettings>;

    const parsedCurrency = parsed.defaultCurrency ?? parsed.currency;
    if (!parsed.region || !parsed.status || !parsed.language || !parsedCurrency) {
      cachedSettingsRaw = raw;
      cachedSettings = null;
      return cachedSettings;
    }
    const isWorking = parsed.isWorking ?? parsed.worksPartTime ?? defaultUserSettings.isWorking;
    const isRenting = parsed.isRenting ?? parsed.rentsHome ?? defaultUserSettings.isRenting;

    cachedSettingsRaw = raw;
    cachedSettings = {
      ...defaultUserSettings,
      ...parsed,
      areaId: typeof parsed.areaId === "string" ? parsed.areaId : null,
      regionSource: parsed.regionSource === "manual" || parsed.regionSource === "geolocation" ? parsed.regionSource : null,
      location: isUserResolvedLocation(parsed.location) ? parsed.location : null,
      locationSource: parsed.locationSource === "manual" || parsed.locationSource === "geolocation" ? parsed.locationSource : null,
      currency: parsedCurrency,
      defaultCurrency: parsedCurrency,
      worksPartTime: Boolean(isWorking),
      isWorking: Boolean(isWorking),
      rentsHome: Boolean(isRenting),
      isRenting: Boolean(isRenting),
      onboardingCompleted: Boolean(parsed.onboardingCompleted ?? true),
      updatedAt: parsed.updatedAt ?? FALLBACK_UPDATED_AT,
    };
    return cachedSettings;
  } catch {
    return null;
  }
}

export function useUserSettings() {
  const settings = useSyncExternalStore(
    (onStoreChange) => {
      window.addEventListener("storage", onStoreChange);
      window.addEventListener(SETTINGS_EVENT, onStoreChange);

      return () => {
        window.removeEventListener("storage", onStoreChange);
        window.removeEventListener(SETTINGS_EVENT, onStoreChange);
      };
    },
    readSettings,
    () => null,
  );

  const saveSettings = useCallback((nextSettings: Omit<UserSettings, "updatedAt">) => {
    const defaultCurrency = nextSettings.defaultCurrency ?? nextSettings.currency;
    const isWorking = nextSettings.isWorking ?? nextSettings.worksPartTime;
    const isRenting = nextSettings.isRenting ?? nextSettings.rentsHome;
    const payload: UserSettings = {
      ...nextSettings,
      currency: defaultCurrency,
      defaultCurrency,
      worksPartTime: Boolean(isWorking),
      isWorking: Boolean(isWorking),
      rentsHome: Boolean(isRenting),
      isRenting: Boolean(isRenting),
      regionSource: nextSettings.regionSource ?? "manual",
      location: nextSettings.location ?? null,
      locationSource: nextSettings.locationSource ?? null,
      onboardingCompleted: nextSettings.onboardingCompleted ?? true,
      updatedAt: new Date().toISOString(),
    };
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    window.localStorage.setItem("japan-life:language", payload.language);
    window.dispatchEvent(new Event(SETTINGS_EVENT));
    window.dispatchEvent(new Event("japan-life:language-change"));
  }, []);

  const clearSettings = useCallback(() => {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new Event(SETTINGS_EVENT));
  }, []);

  return {
    clearSettings,
    loaded: true,
    saveSettings,
    settings,
  };
}

function isUserResolvedLocation(value: unknown): value is UserResolvedLocation {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.prefecture === "string" &&
    typeof record.city === "string" &&
    typeof record.latitude === "number" &&
    typeof record.longitude === "number" &&
    typeof record.updatedAt === "string"
  );
}
