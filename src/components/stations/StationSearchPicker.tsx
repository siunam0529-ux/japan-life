"use client";

import { Check, ChevronRight, Search, TrainFront } from "lucide-react";
import { useMemo, useState } from "react";
import { StationLineGroupPicker } from "@/components/stations/StationLineGroupPicker";
import { useLanguage } from "@/hooks/useLanguage";
import {
  allStationLineFilter,
  filterStationsByLine,
  getStationDisplayName,
  getStationLineOptions,
  getStationSubtitle,
  searchTokyoStations,
} from "@/lib/stations/stationSearch";
import type { TokyoStation } from "@/lib/stations/types";
import type { Language } from "@/lib/i18n/translations";

const stationSearchCopy: Record<
  Language,
  {
    allLines: string;
    currentStation: (station: string) => string;
    empty: string;
    loading: string;
    placeholder: string;
    searchResults: string;
    selectedLineStations: (line: string) => string;
    title: string;
  }
> = {
  "zh-CN": {
    allLines: "全部线路",
    currentStation: (station) => `当前车站：${station}`,
    empty: "这条线路下暂时没有可用车站，换条线路或直接搜索车站名试试。",
    loading: "正在读取 ODPT 东京都车站数据...",
    placeholder: "搜索车站名，比如 池袋 / 上板橋",
    searchResults: "搜索结果",
    selectedLineStations: (line) => `${line} 的车站`,
    title: "按线路 / 车站找店",
  },
  "zh-TW": {
    allLines: "全部路線",
    currentStation: (station) => `目前車站：${station}`,
    empty: "這條路線下暫時沒有可用車站，換條路線或直接搜尋車站名試試。",
    loading: "正在讀取 ODPT 東京都車站資料...",
    placeholder: "搜尋車站名，例如 池袋 / 上板橋",
    searchResults: "搜尋結果",
    selectedLineStations: (line) => `${line} 的車站`,
    title: "按路線 / 車站找店",
  },
  ja: {
    allLines: "すべての路線",
    currentStation: (station) => `現在の駅：${station}`,
    empty: "この路線では表示できる駅がまだありません。別の路線を選ぶか、駅名で検索してください。",
    loading: "ODPT の東京都駅データを読み込み中...",
    placeholder: "駅名で検索 例：池袋 / 上板橋",
    searchResults: "検索結果",
    selectedLineStations: (line) => `${line} の駅`,
    title: "路線 / 駅から探す",
  },
};

export function StationSearchPicker({
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
  const { language } = useLanguage();
  const text = stationSearchCopy[language];
  const [query, setQuery] = useState("");
  const [selectedLine, setSelectedLine] = useState(allStationLineFilter);
  const lineOptions = useMemo(() => getStationLineOptions(stations), [stations]);
  const lineFilteredStations = useMemo(() => filterStationsByLine(stations, selectedLine), [selectedLine, stations]);
  const searchResults = useMemo(() => searchTokyoStations(lineFilteredStations, query), [lineFilteredStations, query]);
  const hasQuery = Boolean(query.trim());
  const showSearchResults = hasQuery;

  const renderStationList = (visibleStations: TokyoStation[]) => (
    <div className="max-h-[260px] overflow-y-auto rounded-2xl bg-white shadow-sm ring-1 ring-blue-100">
      {visibleStations.map((station, index) => {
        const active = selectedStation?.id === station.id;
        return (
          <button
            className={`flex min-h-12 w-full items-center justify-between gap-3 px-4 text-left text-sm font-black transition active:bg-blue-100 ${
              active ? "bg-blue-50 text-blue-800" : "text-slate-950"
            } ${index > 0 ? "border-t border-slate-100" : ""}`}
            key={`${station.id}-${station.nameJa}-${index}`}
            onClick={() => {
              onSelect(station);
              setQuery("");
            }}
            type="button"
          >
            <span className="min-w-0 flex-1">
              <span className="block truncate">{getStationDisplayName(station)}</span>
              <span className="mt-0.5 block truncate text-xs font-bold text-slate-500">{getStationSubtitle(station)}</span>
            </span>
            {active ? <Check className="h-4 w-4 shrink-0 text-blue-700" /> : <ChevronRight className="h-5 w-5 shrink-0 text-slate-300" />}
          </button>
        );
      })}
    </div>
  );

  return (
    <section className="mt-3 rounded-2xl border border-blue-100 bg-blue-50/60 p-3">
      <div className="flex items-center gap-2">
        <TrainFront className="h-4 w-4 text-blue-700" />
        <p className="text-xs font-black text-blue-800">{text.title}</p>
      </div>
      <label className="mt-2 flex min-h-11 items-center gap-2 rounded-2xl border border-blue-100 bg-white px-3">
        <Search className="h-4 w-4 shrink-0 text-blue-700" />
        <input
          className="min-w-0 flex-1 bg-transparent text-sm font-bold text-[#10231A] outline-none"
          onChange={(event) => {
            setQuery(event.target.value);
          }}
          placeholder={text.placeholder}
          value={query}
        />
      </label>
      {lineOptions.length > 0 ? (
        <StationLineGroupPicker
          allLabel={text.allLines}
          language={language}
          lineOptions={lineOptions}
          renderSelectedLineContent={() => renderStationList(lineFilteredStations)}
          selectedLine={selectedLine}
          onSelectLine={(line) => {
            setSelectedLine(line);
            setQuery("");
          }}
        />
      ) : null}
      {selectedStation ? (
        <p className="mt-2 rounded-2xl bg-white px-3 py-2 text-xs font-black text-blue-800">{text.currentStation(getStationDisplayName(selectedStation))}</p>
      ) : null}
      {loading ? <p className="mt-2 text-xs font-bold text-[#64748B]">{text.loading}</p> : null}
      {error ? <p className="mt-2 text-xs font-bold text-amber-800">{error}</p> : null}
      {!loading && showSearchResults && searchResults.length > 0 ? (
        <>
          <p className="mt-3 text-[11px] font-black text-[#64748B]">{text.searchResults}</p>
          <div className="mx-3 mt-2">{renderStationList(searchResults)}</div>
        </>
      ) : !loading && showSearchResults ? (
        <p className="mt-3 rounded-2xl border border-amber-100 bg-white p-3 text-xs font-bold leading-5 text-amber-800">{text.empty}</p>
      ) : null}
    </section>
  );
}
