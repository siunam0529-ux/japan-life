export type StationLanguage = "ja" | "zh-CN" | "zh-TW";

export type TokyoStation = {
  id: string;
  name: string;
  nameJa: string;
  nameKana: string;
  nameZhCN: string;
  nameZhTW: string;
  nameEn: string;
  latitude: number;
  longitude: number;
  lines: string[];
  operators: string[];
  stationCodes: string[];
  ward: string | null;
  source: "odpt";
};

export type TokyoStationApiResponse = {
  cached: boolean;
  fetchedAt: string;
  source: "cache" | "odpt";
  stations: TokyoStation[];
};
