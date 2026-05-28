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

const clientCache: {
  fetchedAt: string;
  stations: TokyoStation[];
} = {
  fetchedAt: "",
  stations: [],
};

export function useTokyoStations() {
  const [state, setState] = useState<TokyoStationsState>({
    error: "",
    fetchedAt: clientCache.fetchedAt,
    loading: clientCache.stations.length === 0,
    stations: clientCache.stations,
  });

  useEffect(() => {
    if (clientCache.stations.length > 0) {
      setState({ error: "", fetchedAt: clientCache.fetchedAt, loading: false, stations: clientCache.stations });
      return;
    }

    let cancelled = false;
    fetch("/api/stations/odpt?version=odpt-only-v1")
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error(`stations ${response.status}`))))
      .then((data: TokyoStationApiResponse) => {
        if (cancelled) return;
        clientCache.fetchedAt = data.fetchedAt;
        clientCache.stations = Array.isArray(data.stations) ? normalizeTokyoStationsForApp(data.stations) : [];
        setState({ error: "", fetchedAt: clientCache.fetchedAt, loading: false, stations: clientCache.stations });
      })
      .catch(() => {
        if (!cancelled) {
          setState((current) => ({ ...current, error: "车站数据暂时无法读取。", loading: false }));
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
