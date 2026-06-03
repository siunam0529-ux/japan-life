"use client";

import { useCallback, useEffect, useState } from "react";
import { defaultUserSettings, type UserSettings } from "@/hooks/useUserSettings";
import { reverseGeocodeJapanLocation, type ReverseGeocodedJapanLocation } from "@/lib/reverseGeocoding";

export type UserLocation = {
  latitude: number | null;
  longitude: number | null;
  loading: boolean;
  error: string | null;
  resolvedLocation: ReverseGeocodedJapanLocation | null;
};

export type UseUserLocationOptions = {
  autoRequest?: boolean;
  autoUpdateSettings?: boolean;
  confirmUpdate?: (location: ReverseGeocodedJapanLocation, currentSettings: UserSettings | null) => boolean;
  settings?: UserSettings | null;
};

const userSettingsStorageKey = "japan-life:user-settings";
const userSettingsChangeEvent = "japan-life:user-settings-change";

const locationCopy = {
  "zh-CN": {
    unsupported: "当前浏览器不支持定位。",
    permissionDenied: "定位权限已被拒绝。",
    unavailable: "暂时无法取得定位信息。",
    timeout: "定位请求超时。",
    unknown: "无法取得当前位置。",
    confirmUpdate: "是否更新为当前位置？",
  },
  "zh-TW": {
    unsupported: "目前瀏覽器不支援定位。",
    permissionDenied: "定位權限已被拒絕。",
    unavailable: "暫時無法取得定位資訊。",
    timeout: "定位請求逾時。",
    unknown: "無法取得目前位置。",
    confirmUpdate: "是否更新為目前位置？",
  },
  ja: {
    unsupported: "このブラウザでは位置情報を利用できません。",
    permissionDenied: "位置情報の権限が拒否されました。",
    unavailable: "位置情報を取得できません。",
    timeout: "位置情報の取得がタイムアウトしました。",
    unknown: "現在地を取得できません。",
    confirmUpdate: "現在地に更新しますか？",
  },
} as const;

function readLanguage() {
  if (typeof window === "undefined") return "zh-CN";
  const value = window.localStorage.getItem("japan-life:language");
  return value === "zh-TW" || value === "ja" ? value : "zh-CN";
}

function getCopy() {
  return locationCopy[readLanguage()];
}

function getGeolocationErrorMessage(error: GeolocationPositionError) {
  const text = getCopy();
  switch (error.code) {
    case error.PERMISSION_DENIED:
      return text.permissionDenied;
    case error.POSITION_UNAVAILABLE:
      return text.unavailable;
    case error.TIMEOUT:
      return text.timeout;
    default:
      return error.message || text.unknown;
  }
}

export function useUserLocation(options: UseUserLocationOptions = {}) {
  const { autoRequest = true, autoUpdateSettings = false, confirmUpdate, settings = null } = options;
  const [location, setLocation] = useState<UserLocation>({
    error: null,
    latitude: null,
    longitude: null,
    loading: autoRequest,
    resolvedLocation: null,
  });

  const requestLocation = useCallback(() => {
    if (typeof window === "undefined" || !("geolocation" in navigator)) {
      setLocation({
        error: getCopy().unsupported,
        latitude: null,
        longitude: null,
        loading: false,
        resolvedLocation: null,
      });
      return;
    }

    let active = true;
    setLocation((current) => ({ ...current, error: null, loading: true }));

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        if (!active) return;
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;

        setLocation({
          error: null,
          latitude,
          longitude,
          loading: false,
          resolvedLocation: null,
        });

        if (!autoUpdateSettings) return;

        try {
          const resolvedLocation = await reverseGeocodeJapanLocation(latitude, longitude);
          if (!active) return;

          maybeSaveLocationSettings(resolvedLocation, settings, confirmUpdate);
          setLocation({
            error: null,
            latitude,
            longitude,
            loading: false,
            resolvedLocation,
          });
        } catch (error) {
          if (!active) return;

          setLocation({
            error: error instanceof Error ? error.message : getCopy().unknown,
            latitude,
            longitude,
            loading: false,
            resolvedLocation: null,
          });
        }
      },
      (error) => {
        if (!active) return;

        setLocation({
          error: getGeolocationErrorMessage(error),
          latitude: null,
          longitude: null,
          loading: false,
          resolvedLocation: null,
        });
      },
      {
        enableHighAccuracy: false,
        maximumAge: 5 * 60 * 1000,
        timeout: 10 * 1000,
      }
    );

    return () => {
      active = false;
    };
  }, [autoUpdateSettings, confirmUpdate, settings]);

  useEffect(() => {
    if (!autoRequest) return undefined;
    return requestLocation();
  }, [autoRequest, requestLocation]);

  return {
    ...location,
    requestLocation,
  };
}

function maybeSaveLocationSettings(
  location: ReverseGeocodedJapanLocation,
  currentSettings: UserSettings | null,
  confirmUpdate?: (location: ReverseGeocodedJapanLocation, currentSettings: UserSettings | null) => boolean
) {
  if (typeof window === "undefined") return;

  const existingSettings = currentSettings ?? readStoredSettings();
  const hasManualRegion = existingSettings?.regionSource === "manual" || Boolean(existingSettings?.areaId);
  const shouldUpdate = !hasManualRegion || (confirmUpdate ? confirmUpdate(location, existingSettings) : window.confirm(getCopy().confirmUpdate));

  if (!shouldUpdate) return;

  const nextSettings: UserSettings = {
    ...defaultUserSettings,
    ...existingSettings,
    areaId: location.areaId,
    location: {
      city: location.city,
      latitude: location.latitude,
      longitude: location.longitude,
      prefecture: location.prefecture,
      updatedAt: location.updatedAt,
    },
    locationSource: "geolocation",
    region: location.region,
    regionSource: "geolocation",
    updatedAt: new Date().toISOString(),
  };

  window.localStorage.setItem(userSettingsStorageKey, JSON.stringify(nextSettings));
  window.dispatchEvent(new Event(userSettingsChangeEvent));
}

function readStoredSettings(): UserSettings | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(userSettingsStorageKey);
    if (!raw) return null;
    return JSON.parse(raw) as UserSettings;
  } catch {
    return null;
  }
}
