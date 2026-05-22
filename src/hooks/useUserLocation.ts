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
const unsupportedMessage = "Geolocation is not supported by this browser.";
const permissionDeniedMessage = "Location permission was denied.";
const unavailableMessage = "Location information is unavailable.";
const timeoutMessage = "Location request timed out.";
const unknownMessage = "Unable to get current location.";

function getGeolocationErrorMessage(error: GeolocationPositionError) {
  switch (error.code) {
    case error.PERMISSION_DENIED:
      return permissionDeniedMessage;
    case error.POSITION_UNAVAILABLE:
      return unavailableMessage;
    case error.TIMEOUT:
      return timeoutMessage;
    default:
      return error.message || unknownMessage;
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
        error: unsupportedMessage,
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
            error: error instanceof Error ? error.message : unknownMessage,
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
  const shouldUpdate = !hasManualRegion || (confirmUpdate ? confirmUpdate(location, existingSettings) : window.confirm("是否更新为当前位置？"));

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
