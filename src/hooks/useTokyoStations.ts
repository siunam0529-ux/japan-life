"use client";

import { useEffect, useState } from "react";
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

const clientCache: {
  fetchedAt: string;
  stations: TokyoStation[];
  version: string;
} = {
  fetchedAt: "",
  stations: [],
  version: "",
};

export function useTokyoStations() {
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
    const requestUrl = `/api/stations/odpt/?version=${stationsApiVersion}${shouldForceRefresh ? "&refresh=1" : ""}`;
    fetch(requestUrl)
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error(`stations ${response.status}`))))
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
          setState((current) => ({ ...current, error: "东京都车站数据暂时无法读取。", loading: false }));
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

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
