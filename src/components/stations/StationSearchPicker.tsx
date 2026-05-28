"use client";

import { MapPin, Search, TrainFront } from "lucide-react";
import { useMemo, useState } from "react";
import { CollapsiblePanel } from "@/components/CollapsiblePanel";
import {
  allStationLineFilter,
  filterStationsByLine,
  getNearestStations,
  getPopularStations,
  getStationDisplayName,
  getStationLineOptions,
  getStationSubtitle,
  searchTokyoStations,
} from "@/lib/stations/stationSearch";
import type { TokyoStation } from "@/lib/stations/types";

export function StationSearchPicker({
  appLocation,
  error,
  loading,
  onSelect,
  selectedStation,
  stations,
}: {
  appLocation: { lat: number; lng: number } | null;
  error: string;
  loading: boolean;
  onSelect: (station: TokyoStation) => void;
  selectedStation: TokyoStation | null;
  stations: TokyoStation[];
}) {
  const [query, setQuery] = useState("");
  const [selectedLine, setSelectedLine] = useState(allStationLineFilter);
  const lineOptions = useMemo(() => getStationLineOptions(stations), [stations]);
  const lineFilteredStations = useMemo(() => filterStationsByLine(stations, selectedLine), [selectedLine, stations]);
  const searchResults = useMemo(() => searchTokyoStations(lineFilteredStations, query), [lineFilteredStations, query]);
  const nearbyStations = useMemo(() => getNearestStations(lineFilteredStations, appLocation), [appLocation, lineFilteredStations]);
  const popularStations = useMemo(() => getPopularStations(lineFilteredStations), [lineFilteredStations]);
  const visibleStations = query.trim() ? searchResults : nearbyStations.length > 0 ? nearbyStations : popularStations;
  const sectionLabel = query.trim() ? "搜索结果" : selectedLine !== allStationLineFilter ? `${selectedLine} 的车站` : nearbyStations.length > 0 ? "App 地区附近车站" : "常用车站";

  return (
    <section className="mt-3 rounded-2xl border border-emerald-100 bg-emerald-50/60 p-3">
      <div className="flex items-center gap-2">
        <TrainFront className="h-4 w-4 text-emerald-700" />
        <p className="text-xs font-black text-emerald-800">按线路 / 车站找店</p>
      </div>
      {lineOptions.length > 0 ? (
        <CollapsiblePanel className="mt-2 rounded-2xl bg-white/70 p-3 shadow-none" contentClassName="mt-2" summary={selectedLine} title="线路筛选">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {[allStationLineFilter, ...lineOptions].map((line) => (
              <button
                className={`shrink-0 rounded-full border px-3 py-1.5 text-[11px] font-black ${
                  selectedLine === line ? "border-emerald-700 bg-emerald-700 text-white" : "border-emerald-100 bg-white text-emerald-900"
                }`}
                key={line}
                onClick={() => setSelectedLine(line)}
                type="button"
              >
                {line}
              </button>
            ))}
          </div>
        </CollapsiblePanel>
      ) : null}
      <label className="mt-2 flex min-h-11 items-center gap-2 rounded-2xl border border-emerald-100 bg-white px-3">
        <Search className="h-4 w-4 shrink-0 text-emerald-700" />
        <input
          className="min-w-0 flex-1 bg-transparent text-sm font-bold text-[#10231A] outline-none"
          onChange={(event) => setQuery(event.target.value)}
          placeholder="搜索车站名，比如 池袋 / 上板橋"
          value={query}
        />
      </label>
      {selectedStation ? (
        <p className="mt-2 rounded-2xl bg-white px-3 py-2 text-xs font-black text-emerald-800">当前车站：{getStationDisplayName(selectedStation)}</p>
      ) : null}
      {loading ? <p className="mt-2 text-xs font-bold text-[#64748B]">正在读取 ODPT 车站数据...</p> : null}
      {error ? <p className="mt-2 text-xs font-bold text-amber-800">{error}</p> : null}
      {!loading && visibleStations.length > 0 ? (
        <>
          <p className="mt-3 text-[11px] font-black text-[#64748B]">{sectionLabel}</p>
          <div className="mt-2 grid gap-2">
            {visibleStations.map((station) => {
              const active = selectedStation?.id === station.id;
              return (
                <button
                  className={`flex min-h-[58px] items-center gap-3 rounded-2xl border p-3 text-left transition active:scale-[0.99] ${
                    active ? "border-emerald-600 bg-emerald-700 text-white" : "border-emerald-100 bg-white text-[#10231A]"
                  }`}
                  key={station.id}
                  onClick={() => onSelect(station)}
                  type="button"
                >
                  <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${active ? "bg-white/20" : "bg-emerald-50 text-emerald-700"}`}>
                    <MapPin className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-black">{getStationDisplayName(station)}</span>
                    <span className={`mt-0.5 block line-clamp-2 text-xs font-bold ${active ? "text-white/80" : "text-[#64748B]"}`}>{getStationSubtitle(station)}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </>
      ) : !loading ? (
        <p className="mt-3 rounded-2xl border border-amber-100 bg-white p-3 text-xs font-bold leading-5 text-amber-800">这条线路下暂时没有可用车站，换条线路或直接搜索车站名试试。</p>
      ) : null}
    </section>
  );
}
