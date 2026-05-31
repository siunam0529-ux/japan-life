import { tokyoRailLineConfigs, type TrainStatusLine } from "@/data/trainStatus";

export type RailCompanyGroup = {
  id: string;
  label: string;
  lines: TrainStatusLine[];
};

export type StationLineNameGroup = {
  id: string;
  label: string;
  lines: string[];
};

const companyGroups = [
  { id: "jr-east", label: "JR東日本", prefixes: ["odpt.Railway:JR-East."] },
  { id: "jr-central", label: "JR東海", prefixes: ["odpt.Railway:JR-Central."] },
  { id: "tokyo-metro", label: "東京メトロ", prefixes: ["odpt.Railway:TokyoMetro."] },
  { id: "toei", label: "都営交通", prefixes: ["odpt.Railway:Toei."] },
  { id: "tokyu", label: "東急電鉄", prefixes: ["odpt.Railway:Tokyu."] },
  { id: "seibu", label: "西武鉄道", prefixes: ["odpt.Railway:Seibu."] },
  { id: "tobu", label: "東武鉄道", prefixes: ["odpt.Railway:Tobu."] },
  { id: "keio", label: "京王電鉄", prefixes: ["odpt.Railway:Keio."] },
  { id: "odakyu", label: "小田急電鉄", prefixes: ["odpt.Railway:Odakyu."] },
  { id: "odakyu-hakone", label: "小田急箱根", prefixes: ["odpt.Railway:OdakyuHakone."] },
  { id: "keisei", label: "京成電鉄", prefixes: ["odpt.Railway:Keisei."] },
  { id: "shibayama", label: "芝山鉄道", prefixes: ["odpt.Railway:Shibayama."] },
  { id: "keikyu", label: "京浜急行電鉄", prefixes: ["odpt.Railway:Keikyu."] },
  { id: "mir", label: "つくばエクスプレス", prefixes: ["odpt.Railway:MIR."] },
  { id: "twr", label: "東京臨海高速鉄道", prefixes: ["odpt.Railway:TWR."] },
  { id: "yurikamome", label: "ゆりかもめ", prefixes: ["odpt.Railway:Yurikamome."] },
  { id: "tokyo-monorail", label: "東京モノレール", prefixes: ["odpt.Railway:TokyoMonorail."] },
  { id: "tama-monorail", label: "多摩都市モノレール", prefixes: ["odpt.Railway:TamaMonorail."] },
  { id: "saitama-railway", label: "埼玉高速鉄道", prefixes: ["odpt.Railway:SaitamaRailway."] },
  { id: "hokuso", label: "北総鉄道", prefixes: ["odpt.Railway:Hokuso."] },
  { id: "kanto-railway", label: "関東鉄道", prefixes: ["odpt.Railway:KantoRailway."] },
  { id: "minatomirai", label: "横浜高速鉄道", prefixes: ["odpt.Railway:Minatomirai."] },
  { id: "sotetsu", label: "相模鉄道", prefixes: ["odpt.Railway:Sotetsu."] },
  { id: "toyo-rapid", label: "東葉高速鉄道", prefixes: ["odpt.Railway:ToyoRapid."] },
  { id: "yokohama-municipal", label: "横浜市営地下鉄", prefixes: ["odpt.Railway:YokohamaMunicipal."] },
] as const;

const otherGroup = { id: "other", label: "その他" };

export function groupTrainStatusLines(lines: TrainStatusLine[]): RailCompanyGroup[] {
  const buckets = new Map<string, RailCompanyGroup>();
  const configById = new Map(tokyoRailLineConfigs.map((line) => [line.id, line]));

  lines.forEach((line) => {
    const config = configById.get(line.id);
    const group = getCompanyGroupByRailways(config?.railways ?? []);
    const bucket = buckets.get(group.id) ?? { id: group.id, label: group.label, lines: [] };
    bucket.lines.push(line);
    buckets.set(group.id, bucket);
  });

  return sortGroups([...buckets.values()]);
}

export function groupStationLineNames(lineNames: string[]): StationLineNameGroup[] {
  const buckets = new Map<string, StationLineNameGroup>();
  const configByName = new Map(tokyoRailLineConfigs.map((line) => [line.name.ja, line]));

  lineNames.forEach((lineName) => {
    const config = configByName.get(lineName);
    const group = getCompanyGroupByRailways(config?.railways ?? []);
    const bucket = buckets.get(group.id) ?? { id: group.id, label: group.label, lines: [] };
    if (!bucket.lines.includes(lineName)) bucket.lines.push(lineName);
    buckets.set(group.id, bucket);
  });

  return sortGroups([...buckets.values()]);
}

function getCompanyGroupByRailways(railways: readonly string[]) {
  return (
    companyGroups.find((group) => railways.some((railway) => group.prefixes.some((prefix) => railway.startsWith(prefix)))) ??
    otherGroup
  );
}

function sortGroups<T extends { id: string }>(groups: T[]) {
  const order = new Map<string, number>(companyGroups.map((group, index) => [group.id, index]));
  return groups.sort((left, right) => (order.get(left.id) ?? 999) - (order.get(right.id) ?? 999));
}
