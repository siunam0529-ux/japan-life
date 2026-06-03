"use client";

import { useEffect, useState } from "react";
import { getCachedStationsData, warmStationsData } from "@/lib/appPreload";
import type { Language } from "@/lib/i18n/translations";
import { normalizeTokyoStationsForApp } from "@/lib/stations/stationSearch";
import type { TokyoStation, TokyoStationApiResponse } from "@/lib/stations/types";

type TokyoStationsState = {
  error: string;
  fetchedAt: string;
  loading: boolean;
  stations: TokyoStation[];
};

const stationsApiVersion = "odpt-hotpepper-v5";
const stationsApiVersionStorageKey = "japan-life:stations-api-version";
const stationErrorCopy: Record<Language, string> = {
  "zh-CN": "东京都车站数据暂时无法读取。",
  "zh-TW": "東京都車站資料暫時無法讀取。",
  ja: "東京都の駅データを一時的に読み込めません。",
};

const clientCache: {
  fetchedAt: string;
  stations: TokyoStation[];
  version: string;
} = {
  fetchedAt: "",
  stations: [],
  version: "",
};

export function useTokyoStations(language: Language = "zh-CN") {
  const hasFreshClientCache = clientCache.version === stationsApiVersion && clientCache.stations.length > 0;
  const [state, setState] = useState<TokyoStationsState>({
    error: "",
    fetchedAt: hasFreshClientCache ? clientCache.fetchedAt : "",
    loading: !hasFreshClientCache,
    stations: hasFreshClientCache ? clientCache.stations : [],
  });

  useEffect(() => {
    if (clientCache.version === stationsApiVersion && clientCache.stations.length > 0) {
      setState({ error: "", fetchedAt: clientCache.fetchedAt, loading: false, stations: clientCache.stations });
      return;
    }

    let cancelled = false;
    const shouldForceRefresh = readStationsApiVersion() !== stationsApiVersion;
    const cached = getCachedStationsData(stationsApiVersion);
    if (cached?.stations?.length) {
      clientCache.fetchedAt = cached.fetchedAt;
      clientCache.stations = normalizeTokyoStationsForApp(cached.stations);
      clientCache.version = stationsApiVersion;
      setState({ error: "", fetchedAt: clientCache.fetchedAt, loading: false, stations: clientCache.stations });
    }
    warmStationsData(stationsApiVersion, shouldForceRefresh)
      .then((data: TokyoStationApiResponse) => {
        if (cancelled) return;
        clientCache.fetchedAt = data.fetchedAt;
        clientCache.stations = Array.isArray(data.stations) ? normalizeTokyoStationsForApp(data.stations) : [];
        clientCache.version = stationsApiVersion;
        writeStationsApiVersion(stationsApiVersion);
        setState({ error: "", fetchedAt: clientCache.fetchedAt, loading: false, stations: clientCache.stations });
      })
      .catch(() => {
        if (!cancelled) {
          setState((current) => ({ ...current, error: stationErrorCopy[language], loading: false }));
        }
      });

    return () => {
      cancelled = true;
    };
  }, [language]);

  return state;
}

function readStationsApiVersion() {
  try {
    return window.localStorage.getItem(stationsApiVersionStorageKey) ?? "";
  } catch {
    return "";
  }
}

function writeStationsApiVersion(version: string) {
  try {
    window.localStorage.setItem(stationsApiVersionStorageKey, version);
  } catch {
    // Ignore storage failures; the station API still works without the local marker.
  }
}
