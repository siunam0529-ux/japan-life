import type { TokyoStation } from "@/lib/stations/types";

export const allStationLineFilter = "全部线路";
export const minStationsPerVisibleLine = 3;

export const popularTokyoStationNames = ["新宿", "池袋", "渋谷", "東京", "上野", "品川", "秋葉原", "銀座", "中野", "北千住", "板橋", "高円寺"];

export const stationLineAliases = new Map([
  ["JR山手線", "山手線"],
  ["JR埼京線", "埼京線・川越線"],
  ["JR中央線", "中央線快速"],
  ["JR総武線", "中央・総武線各駅停車"],
  ["JR京浜東北線", "京浜東北線・根岸線"],
  ["JR常磐線", "常磐線快速"],
  ["丸ノ内線", "東京メトロ丸ノ内線"],
  ["銀座線", "東京メトロ銀座線"],
  ["日比谷線", "東京メトロ日比谷線"],
  ["東西線", "東京メトロ東西線"],
  ["千代田線", "東京メトロ千代田線"],
  ["有楽町線", "東京メトロ有楽町線"],
  ["半蔵門線", "東京メトロ半蔵門線"],
  ["南北線", "東京メトロ南北線"],
  ["副都心線", "東京メトロ副都心線"],
  ["浅草線", "都営浅草線"],
  ["三田線", "都営三田線"],
  ["新宿線", "都営新宿線"],
  ["大江戸線", "都営大江戸線"],
  ["目黒線", "東急目黒線"],
  ["大井町線", "東急大井町線"],
  ["小田急線", "小田急小田原線"],
  ["京急線", "京急本線"],
  ["東京モノレール", "東京モノレール羽田空港線"],
]);

export function normalizeStationLineName(line: string) {
  return stationLineAliases.get(line) ?? line;
}

export function isStationLineVisible(line: string) {
  return Boolean(line) && !line.includes("Shinkansen") && !line.includes("新幹線");
}

export function normalizeStationLineNames(lines: string[]) {
  return Array.from(new Set(lines.map(normalizeStationLineName).filter(isStationLineVisible)));
}

export function normalizeTokyoStation(station: TokyoStation): TokyoStation {
  return {
    ...station,
    lines: normalizeStationLineNames(station.lines),
  };
}

export function normalizeTokyoStationsForApp(stations: TokyoStation[]) {
  return stations.map(normalizeTokyoStation);
}

export function getStationDisplayName(station: TokyoStation) {
  return `${station.nameJa}駅`;
}

export function getStationSubtitle(station: TokyoStation) {
  const ward = station.ward ? `${station.ward} / ` : "";
  return `${ward}${normalizeStationLineNames(station.lines).slice(0, 2).join("・") || "路線情報あり"}`;
}

export function getStationLineOptions(stations: TokyoStation[]) {
  const counts = new Map<string, number>();
  stations.forEach((station) => {
    normalizeStationLineNames(station.lines).forEach((line) => {
      counts.set(line, (counts.get(line) ?? 0) + 1);
    });
  });
  return Array.from(counts.entries())
    .filter(([, count]) => count >= minStationsPerVisibleLine)
    .map(([line]) => line)
    .sort((left, right) => left.localeCompare(right, "ja"));
}

export function filterStationsByLine(stations: TokyoStation[], line: string) {
  if (!line || line === allStationLineFilter) return stations;
  return stations.filter((station) => normalizeStationLineNames(station.lines).includes(line));
}

export function searchTokyoStations(stations: TokyoStation[], query: string, limit = 8) {
  const keyword = normalizeQuery(query);
  if (!keyword) return [];
  return stations
    .map((station) => ({ score: scoreStation(station, keyword), station }))
    .filter((item) => item.score > 0)
    .sort((left, right) => right.score - left.score || left.station.nameJa.localeCompare(right.station.nameJa, "ja"))
    .slice(0, limit)
    .map((item) => item.station);
}

export function getPopularStations(stations: TokyoStation[], limit = 8) {
  const result: TokyoStation[] = [];
  popularTokyoStationNames.forEach((name) => {
    const station = stations.find((item) => item.nameJa === name || item.nameJa.replace(/駅$/, "") === name);
    if (station && !result.some((item) => item.id === station.id)) result.push(station);
  });
  return result.slice(0, limit);
}

export function getNearestStations(stations: TokyoStation[], location: { lat: number; lng: number } | null, limit = 6) {
  if (!location) return [];
  return stations
    .map((station) => ({
      distance: getDistanceKm(location.lat, location.lng, station.latitude, station.longitude),
      station,
    }))
    .sort((left, right) => left.distance - right.distance)
    .slice(0, limit)
    .map((item) => item.station);
}

function scoreStation(station: TokyoStation, keyword: string) {
  const haystack = [
    station.nameJa,
    station.nameZhCN,
    station.nameZhTW,
    station.nameKana,
    station.nameEn,
    station.ward ?? "",
    normalizeStationLineNames(station.lines).join(" "),
    station.stationCodes.join(" "),
  ]
    .join(" ")
    .toLowerCase();
  if (normalizeQuery(station.nameJa) === keyword) return 100;
  if (normalizeQuery(station.nameJa).startsWith(keyword)) return 80;
  if (haystack.includes(keyword)) return 50;
  return 0;
}

function normalizeQuery(value: string) {
  return value.trim().replace(/駅$/u, "").toLowerCase();
}

function getDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const earthRadius = 6371;
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}
