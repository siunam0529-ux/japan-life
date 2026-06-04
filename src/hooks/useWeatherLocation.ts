"use client";

import { useCallback, useEffect, useState } from "react";
import { reverseGeocodeJapanLocation } from "@/lib/reverseGeocoding";
import type { WeatherLocation } from "@/types/weather";

type WeatherLocationState = {
  error: string | null;
  loading: boolean;
  location: WeatherLocation | null;
  permissionDenied: boolean;
};

const locationName = {
  "zh-CN": "当前位置",
  "zh-TW": "目前位置",
  ja: "現在地",
} as const;

export function useWeatherLocation(autoRequest = true) {
  const [state, setState] = useState<WeatherLocationState>({
    error: null,
    loading: autoRequest,
    location: null,
    permissionDenied: false,
  });

  const requestLocation = useCallback(() => {
    if (typeof window === "undefined" || !("geolocation" in navigator)) {
      setState({
        error: "geolocation unsupported",
        loading: false,
        location: null,
        permissionDenied: false,
      });
      return undefined;
    }

    let active = true;
    setState((current) => ({ ...current, error: null, loading: true, permissionDenied: false }));

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        if (!active) return;
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;
        const fallbackLocation: WeatherLocation = {
          id: `geo:${latitude.toFixed(3)},${longitude.toFixed(3)}`,
          latitude,
          longitude,
          name: locationName,
        };

        setState({
          error: null,
          loading: false,
          location: fallbackLocation,
          permissionDenied: false,
        });

        try {
          const resolved = await reverseGeocodeJapanLocation(latitude, longitude);
          if (!active) return;
          const resolvedName = [resolved.prefecture, resolved.city].filter(Boolean).join(" ") || locationName["zh-CN"];
          setState({
            error: null,
            loading: false,
            location: {
              ...fallbackLocation,
              name: {
                "zh-CN": resolvedName,
                "zh-TW": resolvedName,
                ja: resolvedName,
              },
            },
            permissionDenied: false,
          });
        } catch {
          // Weather still works with coordinates even if reverse geocoding is unavailable.
        }
      },
      (error) => {
        if (!active) return;
        setState({
          error: error.message || "geolocation failed",
          loading: false,
          location: null,
          permissionDenied: error.code === error.PERMISSION_DENIED,
        });
      },
      {
        enableHighAccuracy: false,
        maximumAge: 5 * 60 * 1000,
        timeout: 10 * 1000,
      },
    );

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!autoRequest) return undefined;
    return requestLocation();
  }, [autoRequest, requestLocation]);

  return {
    ...state,
    requestLocation,
  };
}
