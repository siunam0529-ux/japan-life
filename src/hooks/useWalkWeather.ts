import { useEffect, useState } from "react";
import { fetchWeatherForecast, getWeatherLocationFromSettings, getWeatherLocationName } from "@/lib/weather";
import { createWalkWeatherFallbackSnapshot, createWalkWeatherSnapshotFromForecast, defaultTokyoWalkWeatherLocation, type WalkWeatherSnapshot } from "@/lib/walk/weatherRecommendation";
import type { Language } from "@/lib/i18n/translations";
import type { UserSettings } from "@/hooks/useUserSettings";
import type { WeatherLocation } from "@/types/weather";

type WalkWeatherState = {
  error: string | null;
  loading: boolean;
  snapshot: WalkWeatherSnapshot;
};

function getBrowserLocation(): Promise<WeatherLocation | null> {
  if (typeof window === "undefined" || !("geolocation" in navigator)) return Promise.resolve(null);
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          id: `walk-geo:${position.coords.latitude.toFixed(3)},${position.coords.longitude.toFixed(3)}`,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          name: {
            "zh-CN": "当前位置",
            "zh-TW": "目前位置",
            ja: "現在地",
          },
        });
      },
      () => resolve(null),
      { enableHighAccuracy: false, maximumAge: 30 * 60 * 1000, timeout: 3000 },
    );
  });
}

function resolveLocationName(location: WeatherLocation, language: Language) {
  return getWeatherLocationName(location, language) || "东京";
}

export function useWalkWeather({ language, settings }: { language: Language; settings?: UserSettings | null }) {
  const [state, setState] = useState<WalkWeatherState>({
    error: null,
    loading: true,
    snapshot: createWalkWeatherFallbackSnapshot(),
  });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setState((current) => ({ ...current, loading: true }));
      try {
        const settingsLocation = getWeatherLocationFromSettings(settings);
        const browserLocation = settingsLocation ? null : await getBrowserLocation();
        const location = settingsLocation ?? browserLocation ?? defaultTokyoWalkWeatherLocation;
        const forecast = await fetchWeatherForecast(location);
        if (cancelled) return;
        setState({
          error: null,
          loading: false,
          snapshot: createWalkWeatherSnapshotFromForecast(forecast, resolveLocationName(location, language)),
        });
      } catch {
        if (cancelled) return;
        setState({
          error: "天气暂时取得失败，先随机推荐一个适合散步的地方。",
          loading: false,
          snapshot: createWalkWeatherFallbackSnapshot(),
        });
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [language, settings]);

  return state;
}

