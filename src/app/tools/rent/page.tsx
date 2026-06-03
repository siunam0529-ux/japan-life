"use client";

import { Bookmark, Check, CheckCircle2, ChevronDown, ChevronRight, Copy, GitCompare, Home, Search, TrainFront, WalletCards } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { BackButton } from "@/components/BackButton";
import { StationLineGroupPicker } from "@/components/stations/StationLineGroupPicker";
import { areaItems, type AreaItem } from "@/data/areas";
import { tokyoRailLineConfigs } from "@/data/trainStatus";
import { tokyoStationRent2025, type LayoutType, type StationRentData } from "@/data/tokyoStationRent2025";
import { useFavorites } from "@/hooks/useFavorites";
import { useLanguage } from "@/hooks/useLanguage";
import { useTokyoStations } from "@/hooks/useTokyoStations";
import { formatCurrency } from "@/lib/formatCurrency";
import { estimateRentByStation, estimateRentFromStationData } from "@/lib/rentEstimate";
import { allStationLineFilter, normalizeStationLineName, normalizeStationLineNames } from "@/lib/stations/stationSearch";
import type { TokyoStation } from "@/lib/stations/types";

const layouts: LayoutType[] = ["1R", "1K", "1DK", "1LDK", "2K", "2DK", "2LDK", "3LDK"];
const rentFormStorageKey = "japan-life:rent-form";
type RentStationOption = Omit<StationRentData, "ward"> & {
  hasStationRentReference: boolean;
  source: "rent-reference" | "generic-reference";
  ward: string;
};
const defaultRentForm = {
  age: "55",
  brokerMonths: "1",
  cleaningFee: "40000",
  compareLeftStation: "池袋",
  compareLeftWard: "豊島区",
  compareRightStation: "高田馬場",
  compareRightWard: "新宿区",
  depositMonths: "1",
  fireInsurance: "20000",
  floor: "1",
  guaranteeFee: "40000",
  keyMoneyMonths: "1",
  layout: "3LDK" as LayoutType,
  lockFee: "22000",
  managementFee: "10000",
  rent: "110000",
  size: "45",
  station: "上板橋",
  tab: "quick" as "quick" | "detail",
  walkMinutes: "7",
  ward: "板橋区",
};
type RentFormState = typeof defaultRentForm;
type CompareTab = "summary" | "scores" | "details";
type ActiveRentTool = "rent" | "compare";

const yen = (value: number) => formatCurrency(value, "JPY");

const rentStationPickerCopy = {
  "zh-CN": {
    allLines: "不限线路",
    current: (selected: RentStationOption | undefined) =>
      selected
        ? `当前：${selected.station}，${selected.hasStationRentReference ? "使用车站租金参考数据估算。" : "暂无单站租金参考，先使用通用参考。"}`
        : "请选择车站。除天气外，Japan Life 的位置查询会按车站处理。",
    empty: "没有找到符合当前线路和搜索词的车站。可以清空搜索，或换条线路。",
    loading: "正在读取 ODPT 东京都车站...",
    placeholder: "搜索车站或线路，例如 池袋 / 板橋 / 東武東上線",
    sourceLabel: (selected: RentStationOption) => (selected.hasStationRentReference ? "1K参考" : "通用参考"),
    selectedLineCount: (line: string, count: number) => `${line}：${count} 个 ODPT 车站`,
    summary: "未选线路时只显示当前车站；也可以直接搜索任意 ODPT 车站。",
    title: "按线路 / 车站搜索房租参考",
  },
  "zh-TW": {
    allLines: "不限路線",
    current: (selected: RentStationOption | undefined) =>
      selected
        ? `目前：${selected.station}，${selected.hasStationRentReference ? "使用車站租金參考資料估算。" : "暫無單站租金參考，先使用通用參考。"}`
        : "請選擇車站。除天氣外，Japan Life 的位置查詢會按車站處理。",
    empty: "沒有找到符合目前路線和搜尋詞的車站。可以清空搜尋，或換條路線。",
    loading: "正在讀取 ODPT 東京都車站...",
    placeholder: "搜尋車站或路線，例如 池袋 / 板橋 / 東武東上線",
    sourceLabel: (selected: RentStationOption) => (selected.hasStationRentReference ? "1K參考" : "通用參考"),
    selectedLineCount: (line: string, count: number) => `${line}：${count} 個 ODPT 車站`,
    summary: "未選路線時只顯示目前車站，也可以直接搜尋任意 ODPT 車站。",
    title: "按路線 / 車站搜尋房租參考",
  },
  ja: {
    allLines: "指定なし",
    current: (selected: RentStationOption | undefined) =>
      selected
        ? `現在：${selected.station}。${selected.hasStationRentReference ? "駅別の参考家賃データで試算します。" : "駅別参考がないため、共通参考で試算します。"}`
        : "駅を選んでください。天気以外の位置検索は駅を基準にします。",
    empty: "現在の路線と検索条件に合う駅がありません。検索を消すか、別の路線を選んでください。",
    loading: "ODPT の東京都駅データを読み込み中...",
    placeholder: "駅名または路線で検索 例：池袋 / 板橋 / 東武東上線",
    sourceLabel: (selected: RentStationOption) => (selected.hasStationRentReference ? "1K参考" : "共通参考"),
    selectedLineCount: (line: string, count: number) => `${line}：ODPT駅 ${count}件`,
    summary: "路線未選択時は現在の駅だけを表示します。ODPT駅は直接検索できます。",
    title: "路線 / 駅から家賃参考を探す",
  },
} as const;

const rentCopy = {
  "zh-CN": {
    title: "房租评估",
    subtitle: "2025-2026 东京热门车站参考",
    quick: "快速评估",
    detail: "详细评估",
    location: "位置",
    ward: "区域",
    station: "车站",
    walkMinutes: "步行分钟",
    housing: "房屋信息",
    monthlyRent: "月租（含管理费）",
    size: "面积",
    layout: "户型",
    floor: "楼层",
    initialCost: "初期费用（预估）",
    keyMoney: "礼金",
    deposit: "敷金",
    broker: "中介费",
    fireInsurance: "火灾保险",
    guarantee: "保证金",
    cleaning: "清扫费",
    rentBase: "房租本体",
    management: "管理费",
    age: "筑年",
    lock: "换锁费",
    score: "综合评分",
    caution: "注意",
    good: "良好",
    scoreDescGood: "该房源性价比良好，适合居住。",
    scoreDescCaution: "该房源性价比需要再确认。",
    monthlyCost: "每月居住成本（预估）",
    referenceRent: "车站参考租金",
    perSqm: "每平米房租",
    advice: "建议",
    walkAdvice: (minutes: string) => `步行 ${minutes} 分钟可达车站，通勤便利。`,
    diffAdvice: (layout: string, ref: string, diffText: string) => `${layout} 户型参考为 ${ref}，当前成本${diffText}。`,
    initialAdvice: (cost: string, months: string) => `初期费用约 ${cost}，约 ${months} 个月房租。`,
    higher: (value: string) => `高出 ${value}`,
    lower: (value: string) => `低于 ${value}`,
    save: "保存评估",
    copy: "复制结果",
    areaCompare: "车站对比",
    areaCompareHint: "比较两个车站的参考租金，和上面的房租评估使用同一份数据。",
    areaA: "车站 A",
    areaB: "车站 B",
    monthlyDiff: "每月差额",
    yearlyDiff: "一年差额",
    cheaper: "更便宜",
    sameStation: "请选择两个不同车站",
    compareCopy: "复制对比",
    compareCopied: "已复制对比",
    compareSummary: "概览",
    compareScores: "评分",
    compareDetails: "详情",
    wage: "时薪对比",
    scores: "评分对比",
    recommend: (name: string) => `综合来看，${name} 更适合你。`,
    wagePressure: "时薪较高，但房租压力也可能更大。",
    scoreLabels: {
      transport: "交通便利度",
      foreignerFriendly: "外国人友好度",
      livingConvenience: "生活便利度",
      safety: "安全度",
      chineseResource: "中文资源",
    },
    recommendedFor: "适合人群",
    pros: "优点",
    cons: "缺点",
    places: "查看附近店铺",
    sourcePrefix: "车站参考",
    stationReferenceFallback: "2025-2026 东京热门车站参考",
    referenceNotice: "本结果基于东京热门车站公开租金相场整理的静态参考估算，仅供参考，并非正式不动产估价。实际租金会因楼龄、楼层、朝向、管理费、设备、契约条件、市场变化等因素而不同。",
    stationReferenceLabel: (hasStationRentReference: boolean) => (hasStationRentReference ? "车站1K参考" : "通用参考"),
    priceHigh: "偏贵",
    priceLow: "偏便宜",
    priceMarket: "接近市场",
  },
  "zh-TW": {
    title: "房租評估",
    subtitle: "2025-2026 東京熱門車站參考",
    quick: "快速評估",
    detail: "詳細評估",
    location: "位置",
    ward: "區域",
    station: "車站",
    walkMinutes: "步行分鐘",
    housing: "房屋資訊",
    monthlyRent: "月租（含管理費）",
    size: "面積",
    layout: "房型",
    floor: "樓層",
    initialCost: "初期費用（預估）",
    keyMoney: "禮金",
    deposit: "敷金",
    broker: "仲介費",
    fireInsurance: "火災保險",
    guarantee: "保證金",
    cleaning: "清掃費",
    rentBase: "房租本體",
    management: "管理費",
    age: "築年",
    lock: "換鎖費",
    score: "綜合評分",
    caution: "注意",
    good: "良好",
    scoreDescGood: "該房源性價比良好，適合居住。",
    scoreDescCaution: "該房源性價比需要再確認。",
    monthlyCost: "每月居住成本（預估）",
    referenceRent: "車站參考租金",
    perSqm: "每平方公尺房租",
    advice: "建議",
    walkAdvice: (minutes: string) => `步行 ${minutes} 分鐘可到車站，通勤便利。`,
    diffAdvice: (layout: string, ref: string, diffText: string) => `${layout} 房型參考為 ${ref}，目前成本${diffText}。`,
    initialAdvice: (cost: string, months: string) => `初期費用約 ${cost}，約 ${months} 個月房租。`,
    higher: (value: string) => `高出 ${value}`,
    lower: (value: string) => `低於 ${value}`,
    save: "儲存評估",
    copy: "複製結果",
    areaCompare: "車站比較",
    areaCompareHint: "比較兩個車站的參考租金，和上面的房租評估使用同一份資料。",
    areaA: "車站 A",
    areaB: "車站 B",
    monthlyDiff: "每月差額",
    yearlyDiff: "一年差額",
    cheaper: "較便宜",
    sameStation: "請選擇兩個不同車站",
    compareCopy: "複製比較",
    compareCopied: "已複製比較",
    compareSummary: "概覽",
    compareScores: "評分",
    compareDetails: "詳情",
    wage: "時薪比較",
    scores: "評分比較",
    recommend: (name: string) => `綜合來看，${name} 更適合你。`,
    wagePressure: "時薪較高，但房租壓力也可能更大。",
    scoreLabels: {
      transport: "交通便利度",
      foreignerFriendly: "外國人友好度",
      livingConvenience: "生活便利度",
      safety: "安全度",
      chineseResource: "中文資源",
    },
    recommendedFor: "適合人群",
    pros: "優點",
    cons: "缺點",
    places: "查看附近店鋪",
    sourcePrefix: "車站參考",
    stationReferenceFallback: "2025-2026 東京熱門車站參考",
    referenceNotice: "本結果基於東京熱門車站公開租金行情整理的靜態參考估算，僅供參考，並非正式不動產估價。實際租金會因屋齡、樓層、朝向、管理費、設備、契約條件和市場變化等因素而不同。",
    stationReferenceLabel: (hasStationRentReference: boolean) => (hasStationRentReference ? "車站1K參考" : "通用參考"),
    priceHigh: "偏貴",
    priceLow: "偏便宜",
    priceMarket: "接近市場",
  },
  ja: {
    title: "家賃チェック",
    subtitle: "2025-2026 東京人気駅参考",
    quick: "クイック",
    detail: "詳細",
    location: "場所",
    ward: "エリア",
    station: "駅",
    walkMinutes: "徒歩分数",
    housing: "物件情報",
    monthlyRent: "月額賃料（管理費込）",
    size: "面積",
    layout: "間取り",
    floor: "階数",
    initialCost: "初期費用（目安）",
    keyMoney: "礼金",
    deposit: "敷金",
    broker: "仲介手数料",
    fireInsurance: "火災保険",
    guarantee: "保証料",
    cleaning: "清掃費",
    rentBase: "家賃本体",
    management: "管理費",
    age: "築年数",
    lock: "鍵交換費",
    score: "総合スコア",
    caution: "要確認",
    good: "良好",
    scoreDescGood: "この物件は費用感が良好で、住みやすい候補です。",
    scoreDescCaution: "この物件は費用感をもう一度確認しましょう。",
    monthlyCost: "月額居住費（目安）",
    referenceRent: "駅参考家賃",
    perSqm: "1m²あたり家賃",
    advice: "アドバイス",
    walkAdvice: (minutes: string) => `駅まで徒歩 ${minutes} 分で、通勤しやすい条件です。`,
    diffAdvice: (layout: string, ref: string, diffText: string) => `${layout} の参考家賃は ${ref}、現在の費用は${diffText}です。`,
    initialAdvice: (cost: string, months: string) => `初期費用は約 ${cost}、月額費用の約 ${months} か月分です。`,
    higher: (value: string) => `${value} 高い`,
    lower: (value: string) => `${value} 低い`,
    save: "評価を保存",
    copy: "結果をコピー",
    areaCompare: "駅比較",
    areaCompareHint: "2つの駅の参考家賃を比較します。上の家賃チェックと同じデータを使います。",
    areaA: "駅 A",
    areaB: "駅 B",
    monthlyDiff: "毎月の差額",
    yearlyDiff: "年間差額",
    cheaper: "安い",
    sameStation: "別々の駅を選んでください",
    compareCopy: "比較をコピー",
    compareCopied: "コピー済み",
    compareSummary: "概要",
    compareScores: "スコア",
    compareDetails: "詳細",
    wage: "時給比較",
    scores: "スコア比較",
    recommend: (name: string) => `総合的には、${name} のほうがおすすめです。`,
    wagePressure: "時給は高めですが、家賃の負担も大きくなる可能性があります。",
    scoreLabels: {
      transport: "交通の便利さ",
      foreignerFriendly: "外国人向けの暮らしやすさ",
      livingConvenience: "生活の便利さ",
      safety: "治安",
      chineseResource: "中国語リソース",
    },
    recommendedFor: "おすすめの人",
    pros: "メリット",
    cons: "注意点",
    places: "近くのお店",
    sourcePrefix: "駅参考",
    stationReferenceFallback: "2025-2026 東京人気駅参考",
    referenceNotice: "この結果は東京の人気駅の公開家賃相場をもとにした参考試算です。正式な不動産査定ではありません。実際の家賃は築年数、階数、向き、管理費、設備、契約条件、市場変化などで変わります。",
    stationReferenceLabel: (hasStationRentReference: boolean) => (hasStationRentReference ? "駅1K参考" : "共通参考"),
    priceHigh: "高め",
    priceLow: "安め",
    priceMarket: "相場に近い",
  },
} as const;

function numberValue(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function areaName(area: AreaItem, language: keyof typeof rentCopy) {
  if (language === "zh-TW") return area.nameZhTW;
  if (language === "ja") return area.nameJa;
  return area.nameZhCN;
}

function rentScore(rent: number) {
  if (rent < 70000) return 95;
  if (rent < 80000) return 85;
  if (rent < 90000) return 75;
  if (rent < 100000) return 65;
  return 55;
}

function totalScore(area: AreaItem) {
  return Math.round(
    area.transportScore * 0.25 +
      area.livingConvenienceScore * 0.2 +
      area.foreignerFriendlyScore * 0.2 +
      area.safetyScore * 0.15 +
      area.chineseResourceScore * 0.1 +
      rentScore(area.averageRent) * 0.1,
  );
}

function findAreaForStation(station: StationRentData) {
  const exact = areaItems.find((area) => area.nameJa.includes(station.station) || area.nameZhCN.includes(station.station) || area.nameEn.toLowerCase().includes(station.area.toLowerCase()));
  if (exact) return exact;
  const wardCore = station.ward ? station.ward.replace("区", "") : "";
  return (wardCore ? areaItems.find((area) => area.nameJa.includes(wardCore) || area.nameZhCN.includes(wardCore)) : null) ?? areaItems.find((area) => area.nameZhCN.includes(station.area) || area.nameJa.includes(station.area));
}

function InputField({
  label,
  prefix,
  value,
  onChange,
  suffix,
}: {
  label: string;
  prefix?: string;
  value: string;
  onChange: (value: string) => void;
  suffix?: string;
}) {
  return (
    <label className="block min-w-0">
      <span className="mb-1 block truncate text-xs font-bold text-slate-600">{label}</span>
      <span className="flex h-9 min-w-0 items-center rounded-xl border border-blue-200 bg-white px-2.5 shadow-sm">
        {prefix ? <span className="mr-1.5 shrink-0 text-xs font-black text-[#2563EB]">{prefix}</span> : null}
        <input
          className="min-w-0 flex-1 bg-transparent text-[13px] font-bold text-slate-950 outline-none"
          inputMode="decimal"
          onChange={(event) => onChange(event.target.value)}
          type="number"
          value={value}
        />
        {suffix ? <span className="ml-1.5 shrink-0 whitespace-nowrap text-xs font-bold text-slate-500">{suffix}</span> : null}
      </span>
    </label>
  );
}

function FormPanel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="min-w-0 rounded-[18px] border border-stone-200/80 bg-white p-3 shadow-[0_7px_18px_rgba(32,38,34,0.06)]">
      <h2 className="mb-3 text-sm font-black text-slate-950">{title}</h2>
      {children}
    </section>
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[14px] bg-stone-50 p-3">
      <p className="text-[11px] font-bold text-slate-600">{label}</p>
      <p className="mt-1 text-lg font-black text-slate-950">{value}</p>
    </div>
  );
}

function matchRentStation(item: RentStationOption, query: string) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return true;
  return [item.station, ...item.lines].filter(Boolean).some((value) => value.toLowerCase().includes(normalized));
}

const allRentLineFilter = allStationLineFilter;

function formatStationLineSummary(lines: string[]) {
  const visibleLines = normalizeStationLineNames(lines).filter((line) => line !== allRentLineFilter);
  if (visibleLines.length === 0) return "线路信息";
  const [first] = visibleLines;
  return visibleLines.length > 1 ? `${first} +${visibleLines.length - 1}` : first;
}

function formatRentStationMeta(item: RentStationOption, text: (typeof rentStationPickerCopy)[keyof typeof rentStationPickerCopy]) {
  return `${formatStationLineSummary(item.lines)} / ${text.sourceLabel(item)} ${yen(item.base1K)}`;
}

function createRentStationOptions(stations: TokyoStation[]): RentStationOption[] {
  const options = new Map<string, RentStationOption>();

  stations.forEach((station) => {
    const name = station.nameJa.replace(/駅$/u, "");
    const stationLines = normalizeStationLineNames(station.lines);
    const reference = tokyoStationRent2025.find((item) => item.station === name);
    const current = options.get(name);
    if (current) {
      current.lines = normalizeStationLineNames([...current.lines, ...stationLines]);
      current.ward = current.ward || station.ward || "";
      return;
    }
    const hasStationRentReference = Boolean(reference);
    const referenceWard = station.ward ?? reference?.ward ?? "";
    options.set(name, {
      area: reference?.area ?? "车站参考",
      base1K: reference?.base1K ?? 85000,
      hasStationRentReference,
      lines: stationLines.length > 0 ? stationLines : ["路線情報あり"],
      source: hasStationRentReference ? "rent-reference" : "generic-reference",
      station: name,
      ward: referenceWard,
    });
  });

  return [...options.values()].sort((left, right) => {
    return left.station.localeCompare(right.station, "ja");
  });
}

function getRentLineOptions(options: RentStationOption[]) {
  const availableLines = new Set<string>();
  options.forEach((item) => {
    item.lines.forEach((line) => {
      availableLines.add(line);
    });
  });
  return tokyoRailLineConfigs
    .map((line) => normalizeStationLineName(line.name.ja))
    .filter((line, index, lines) => lines.indexOf(line) === index)
    .filter((line) => availableLines.has(line));
}

function getRentStationSuggestions({
  options,
  query,
  selectedLine,
}: {
  options: RentStationOption[];
  query: string;
  selectedLine: string;
}) {
  const lineFiltered = selectedLine === allRentLineFilter ? options : options.filter((item) => item.lines.includes(selectedLine));
  const matches = lineFiltered.filter((item) => matchRentStation(item, query));
  if (query.trim()) return matches.slice(0, 60);
  if (selectedLine !== allRentLineFilter) return lineFiltered;
  return [];
}

function RentStationSearchPicker({
  language,
  loading,
  options,
  selectedStation,
  onSelect,
}: {
  language: keyof typeof rentStationPickerCopy;
  loading: boolean;
  options: RentStationOption[];
  selectedStation: string;
  onSelect: (item: RentStationOption) => void;
}) {
  const text = rentStationPickerCopy[language];
  const [query, setQuery] = useState("");
  const [selectedLine, setSelectedLine] = useState(allRentLineFilter);
  const lineOptions = useMemo(() => getRentLineOptions(options), [options]);
  const suggestions = useMemo(() => getRentStationSuggestions({ options, query, selectedLine }), [options, query, selectedLine]);
  const selected = options.find((item) => item.station === selectedStation);
  const hasQuery = Boolean(query.trim());

  const renderStationList = (items: RentStationOption[]) => (
    <div className="max-h-[260px] overflow-y-auto rounded-2xl bg-white shadow-sm ring-1 ring-blue-100">
      <div className="overflow-hidden rounded-2xl">
        {items.length > 0 ? (
          items.map((item, index) => {
            const active = item.station === selectedStation;
            return (
              <button
                className={`flex min-h-12 w-full items-center justify-between gap-3 px-4 text-left text-sm font-black transition active:bg-blue-100 ${
                  active ? "bg-blue-50 text-blue-800" : "text-slate-950"
                } ${index > 0 ? "border-t border-slate-100" : ""}`}
                key={`${item.station}-${item.lines.join("-")}`}
                onClick={() => {
                  onSelect(item);
                  setQuery("");
                }}
                type="button"
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate">{item.station}</span>
                  <span className="mt-0.5 block truncate text-xs font-bold text-slate-500">
                    {formatRentStationMeta(item, text)}
                  </span>
                </span>
                {active ? <Check className="h-4 w-4 shrink-0 text-blue-700" /> : <ChevronRight className="h-5 w-5 shrink-0 text-slate-300" />}
              </button>
            );
          })
        ) : (
          <p className="rounded-2xl border border-amber-100 bg-white p-3 text-xs font-bold leading-5 text-amber-800">{text.empty}</p>
        )}
      </div>
    </div>
  );

  return (
    <section className="rounded-2xl border border-blue-100 bg-blue-50/60 p-3">
      <div className="flex items-center gap-2">
        <TrainFront className="h-4 w-4 text-blue-700" />
        <p className="text-xs font-black text-blue-800">{text.title}</p>
      </div>
      <label className="mt-2 flex min-h-11 items-center gap-2 rounded-2xl border border-blue-100 bg-white px-3">
        <Search className="h-4 w-4 shrink-0 text-blue-700" />
        <input
          className="min-w-0 flex-1 bg-transparent text-sm font-bold text-slate-950 outline-none placeholder:text-slate-400"
          onChange={(event) => {
            setQuery(event.target.value);
          }}
          placeholder={text.placeholder}
          value={query}
        />
      </label>
      <StationLineGroupPicker
        allLabel={text.allLines}
        allValue={allRentLineFilter}
        language={language}
        lineOptions={lineOptions}
        renderSelectedLineContent={(line) => renderStationList(getRentStationSuggestions({ options, query: "", selectedLine: line }))}
        selectedLine={selectedLine}
        onSelectLine={(line) => {
          setSelectedLine(line);
          setQuery("");
        }}
      />
      <p className="mt-2 text-[11px] font-bold leading-5 text-slate-500">
        {text.current(selected)}
      </p>
      <p className="mt-1 text-[11px] font-black text-blue-800">
        {selectedLine === allRentLineFilter ? text.summary : text.selectedLineCount(selectedLine, suggestions.length)}
      </p>
      {loading ? <p className="mt-2 text-xs font-bold text-slate-500">{text.loading}</p> : null}
      {hasQuery ? <div className="mx-3 mt-3">{renderStationList(suggestions)}</div> : null}
    </section>
  );
}

function CompareStationPicker({
  label,
  language,
  loading,
  onStationChange,
  options,
  station,
}: {
  label: string;
  language: keyof typeof rentStationPickerCopy;
  loading: boolean;
  onStationChange: (value: string) => void;
  options: RentStationOption[];
  station: string;
}) {
  return (
    <div className="grid gap-2 rounded-2xl border border-stone-200 bg-stone-50 p-3">
      <p className="text-xs font-black text-slate-700">{label}</p>
      <RentStationSearchPicker
        language={language}
        loading={loading}
        options={options}
        selectedStation={station}
        onSelect={(item) => {
          onStationChange(item.station);
        }}
      />
    </div>
  );
}

function CompareCard({ title, icon: Icon, children }: { title: string; icon: typeof Home; children: ReactNode }) {
  return (
    <section className="rounded-[20px] border border-stone-200 bg-white p-3 shadow-sm">
      <h3 className="mb-3 flex items-center gap-2 text-sm font-black text-slate-950">
        <Icon className="h-4 w-4 text-[#2563EB]" />
        {title}
      </h3>
      {children}
    </section>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-stone-50 p-3">
      <p className="text-[11px] font-black text-slate-500">{label}</p>
      <p className="mt-1 text-base font-black text-slate-950">{value}</p>
    </div>
  );
}

function TwoValues({ left, right }: { left: string; right: string }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <MiniStat label="A" value={left} />
      <MiniStat label="B" value={right} />
    </div>
  );
}

function ScorePill({ name, score }: { name: string; score: number }) {
  return (
    <div className="rounded-2xl bg-blue-50 p-3">
      <p className="truncate text-xs font-black text-[#2563EB]">{name}</p>
      <p className="text-2xl font-black text-slate-950">{score}</p>
    </div>
  );
}

function ScoreRow({ label, left, right }: { label: string; left: number; right: number }) {
  return (
    <div className="mt-3">
      <div className="mb-1 flex justify-between text-xs font-black text-slate-500">
        <span>{label}</span>
        <span>{left} / {right}</span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Bar value={left} />
        <Bar value={right} />
      </div>
    </div>
  );
}

function Bar({ value }: { value: number }) {
  return (
    <div className="h-2 rounded-full bg-stone-100">
      <div className="h-full rounded-full bg-[#2563EB]" style={{ width: `${value}%` }} />
    </div>
  );
}

function AreaSummary({ area, language, labels }: { area: AreaItem; language: keyof typeof rentCopy; labels: (typeof rentCopy)[keyof typeof rentCopy] }) {
  const pros = language === "ja" ? area.prosJa : language === "zh-TW" ? area.prosZhTW : area.prosZhCN;
  const cons = language === "ja" ? area.consJa : language === "zh-TW" ? area.consZhTW : area.consZhCN;
  const recommended = language === "ja" ? area.recommendedForJa : language === "zh-TW" ? area.recommendedForZhTW : area.recommendedForZhCN;
  return (
    <section className="rounded-[20px] border border-stone-200 bg-white p-3 shadow-sm">
      <h3 className="text-base font-black text-slate-950">{areaName(area, language)}</h3>
      <p className="mt-1 text-xs font-bold text-slate-500">{area.nameEn}</p>
      <p className="mt-3 rounded-2xl bg-blue-50 p-3 text-xs font-black leading-5 text-[#1D4ED8]">
        {labels.recommendedFor}: {recommended}
      </p>
      <div className="mt-3 grid gap-2">
        <ListBlock items={pros} positive title={labels.pros} />
        <ListBlock items={cons} title={labels.cons} />
      </div>
    </section>
  );
}

function ListBlock({ title, items, positive = false }: { title: string; items: string[]; positive?: boolean }) {
  return (
    <div>
      <p className={`text-xs font-black ${positive ? "text-[#2563EB]" : "text-amber-700"}`}>{title}</p>
      {items.map((item) => (
        <p className="mt-1 flex items-center gap-1 text-xs font-bold leading-5 text-slate-600" key={item}>
          <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-[#2563EB]" />
          {item}
        </p>
      ))}
    </div>
  );
}

export default function RentPage() {
  const { language, t } = useLanguage();
  const labels = rentCopy[language];
  const { toggleFavorite } = useFavorites();
  const { loading: stationsLoading, stations: tokyoStations } = useTokyoStations(language);
  const [activeTool, setActiveTool] = useState<ActiveRentTool>("rent");
  const [detailOpen, setDetailOpen] = useState(defaultRentForm.tab === "detail");
  const [compareTab, setCompareTab] = useState<CompareTab>("summary");
  const [ward, setWard] = useState(defaultRentForm.ward);
  const rentStationOptions = useMemo(() => createRentStationOptions(tokyoStations), [tokyoStations]);
  const [station, setStation] = useState(defaultRentForm.station);
  const [walkMinutes, setWalkMinutes] = useState(defaultRentForm.walkMinutes);
  const [rent, setRent] = useState(defaultRentForm.rent);
  const [managementFee, setManagementFee] = useState(defaultRentForm.managementFee);
  const [size, setSize] = useState(defaultRentForm.size);
  const [age, setAge] = useState(defaultRentForm.age);
  const [floor, setFloor] = useState(defaultRentForm.floor);
  const [layout, setLayout] = useState<LayoutType>(defaultRentForm.layout);
  const [depositMonths, setDepositMonths] = useState(defaultRentForm.depositMonths);
  const [keyMoneyMonths, setKeyMoneyMonths] = useState(defaultRentForm.keyMoneyMonths);
  const [brokerMonths, setBrokerMonths] = useState(defaultRentForm.brokerMonths);
  const [guaranteeFee, setGuaranteeFee] = useState(defaultRentForm.guaranteeFee);
  const [fireInsurance, setFireInsurance] = useState(defaultRentForm.fireInsurance);
  const [lockFee, setLockFee] = useState(defaultRentForm.lockFee);
  const [cleaningFee, setCleaningFee] = useState(defaultRentForm.cleaningFee);
  const [copied, setCopied] = useState(false);
  const [compareCopied, setCompareCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [compareLeftWard, setCompareLeftWard] = useState(defaultRentForm.compareLeftWard);
  const [compareLeftStation, setCompareLeftStation] = useState(defaultRentForm.compareLeftStation);
  const [compareRightWard, setCompareRightWard] = useState(defaultRentForm.compareRightWard);
  const [compareRightStation, setCompareRightStation] = useState(defaultRentForm.compareRightStation);

  const applyFormState = (form: RentFormState) => {
    setAge(form.age);
    setBrokerMonths(form.brokerMonths);
    setCleaningFee(form.cleaningFee);
    setCompareLeftStation(form.compareLeftStation);
    setCompareLeftWard(form.compareLeftWard);
    setCompareRightStation(form.compareRightStation);
    setCompareRightWard(form.compareRightWard);
    setDepositMonths(form.depositMonths);
    setFireInsurance(form.fireInsurance);
    setFloor(form.floor);
    setGuaranteeFee(form.guaranteeFee);
    setKeyMoneyMonths(form.keyMoneyMonths);
    setLayout(form.layout);
    setLockFee(form.lockFee);
    setManagementFee(form.managementFee);
    setRent(form.rent);
    setSize(form.size);
    setStation(form.station);
    setDetailOpen(form.tab === "detail");
    setWalkMinutes(form.walkMinutes);
    setWard(form.ward);
  };

  useEffect(() => {
    try {
      const savedForm = window.localStorage.getItem(rentFormStorageKey);
      if (!savedForm) return;
      applyFormState({ ...defaultRentForm, ...JSON.parse(savedForm) });
    } catch {
      window.localStorage.removeItem(rentFormStorageKey);
    }
  }, []);

  const result = useMemo(() => {
    const monthlyRent = numberValue(rent);
    const monthlyTotal = monthlyRent + numberValue(managementFee);
    const areaSize = Math.max(numberValue(size), 1);
    const option = rentStationOptions.find((item) => item.station === station);
    const estimate = option
      ? estimateRentFromStationData({
          buildingAge: numberValue(age),
          floor: numberValue(floor),
          layout,
          size: numberValue(size),
          station: option,
          walkMinutes: numberValue(walkMinutes),
        })
      : estimateRentByStation({
          buildingAge: numberValue(age),
          floor: numberValue(floor),
          layout,
          size: numberValue(size),
          stationName: station,
          walkMinutes: numberValue(walkMinutes),
        });
    const referenceRent = estimate?.estimatedRent ?? 0;
    const diff = monthlyTotal - referenceRent;
    const diffRate = referenceRent > 0 ? (diff / referenceRent) * 100 : 0;
    const initialCost =
      monthlyRent * numberValue(depositMonths) +
      monthlyRent * numberValue(keyMoneyMonths) +
      monthlyRent * numberValue(brokerMonths) +
      numberValue(guaranteeFee) +
      numberValue(fireInsurance) +
      numberValue(lockFee) +
      numberValue(cleaningFee);
    const perSqm = monthlyTotal / areaSize;
    const agePenalty = numberValue(age) >= 35 ? 10 : 0;
    const walkPenalty = numberValue(walkMinutes) > 10 ? 8 : 0;
    const pricePenalty = diffRate > 20 ? 18 : diffRate > 10 ? 10 : diffRate < -10 ? -6 : 0;
    const initialPenalty = initialCost > monthlyRent * 4 ? 8 : 0;
    const score = Math.max(35, Math.min(98, Math.round(82 - agePenalty - walkPenalty - pricePenalty - initialPenalty)));
    const priceLabel = diffRate > 12 ? labels.priceHigh : diffRate < -8 ? labels.priceLow : labels.priceMarket;

    return {
      diff,
      diffRate,
      initialCost,
      monthlyTotal,
      perSqm,
      priceLabel,
      breakdown: estimate?.breakdown,
      referenceRent,
      stationData: estimate?.station,
      stationReferenceLabel: labels.stationReferenceLabel(Boolean(option?.hasStationRentReference)),
      score,
    };
  }, [age, brokerMonths, cleaningFee, depositMonths, fireInsurance, floor, guaranteeFee, keyMoneyMonths, labels, layout, lockFee, managementFee, rent, rentStationOptions, size, station, walkMinutes]);

  const compareResult = useMemo(() => {
    const leftStationData = rentStationOptions.find((item) => item.station === compareLeftStation) ?? tokyoStationRent2025[0];
    const rightStationData = rentStationOptions.find((item) => item.station === compareRightStation) ?? tokyoStationRent2025[1];
    const leftArea = findAreaForStation(leftStationData) ?? areaItems[0];
    const rightArea = findAreaForStation(rightStationData) ?? areaItems[1];
    const leftScore = totalScore(leftArea);
    const rightScore = totalScore(rightArea);
    const winner = leftScore >= rightScore ? leftArea : rightArea;
    const left = estimateRentFromStationData({
      buildingAge: numberValue(age),
      floor: numberValue(floor),
      layout,
      size: numberValue(size),
      station: leftStationData,
      walkMinutes: numberValue(walkMinutes),
    });
    const right = estimateRentFromStationData({
      buildingAge: numberValue(age),
      floor: numberValue(floor),
      layout,
      size: numberValue(size),
      station: rightStationData,
      walkMinutes: numberValue(walkMinutes),
    });
    const leftRent = left?.estimatedRent ?? leftStationData.base1K;
    const rightRent = right?.estimatedRent ?? rightStationData.base1K;
    const diff = Math.abs(leftRent - rightRent);
    const wageDiff = Math.abs(leftArea.averageWage - rightArea.averageWage);
    const higherWage = leftArea.averageWage >= rightArea.averageWage ? leftArea : rightArea;
    const higherWageRentAlsoHigher = higherWage.id === leftArea.id ? leftRent > rightRent : rightRent > leftRent;
    const cheaperStation = leftRent <= rightRent ? compareLeftStation : compareRightStation;

    return { cheaperStation, diff, higherWageRentAlsoHigher, left, leftArea, leftRent, leftScore, right, rightArea, rightRent, rightScore, wageDiff, winner };
  }, [age, compareLeftStation, compareRightStation, floor, layout, rentStationOptions, size, walkMinutes]);

  const saveResult = () => {
    toggleFavorite({
      id: `rent-${station}-${layout}`,
      type: "article",
      title: `${station} ${labels.title}`,
      subtitle: `${layout} / ${size}m² / ${yen(result.monthlyTotal)} / ${result.priceLabel}`,
    });
  };

  const currentForm = useMemo<RentFormState>(
    () => ({
      age,
      brokerMonths,
      cleaningFee,
      compareLeftStation,
      compareLeftWard,
      compareRightStation,
      compareRightWard,
      depositMonths,
      fireInsurance,
      floor,
      guaranteeFee,
      keyMoneyMonths,
      layout,
      lockFee,
      managementFee,
      rent,
      size,
      station,
      tab: detailOpen ? "detail" : "quick",
      walkMinutes,
      ward,
    }),
    [age, brokerMonths, cleaningFee, compareLeftStation, compareLeftWard, compareRightStation, compareRightWard, depositMonths, detailOpen, fireInsurance, floor, guaranteeFee, keyMoneyMonths, layout, lockFee, managementFee, rent, size, station, walkMinutes, ward],
  );

  const saveForm = () => {
    window.localStorage.setItem(rentFormStorageKey, JSON.stringify(currentForm));
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1400);
  };

  const clearForm = () => {
    window.localStorage.removeItem(rentFormStorageKey);
    applyFormState(defaultRentForm);
    setCopied(false);
    setCompareCopied(false);
    setSaved(false);
  };

  return (
    <main className="jl-tool-theme min-h-screen text-slate-950">
      <div className="jl-tool-shell mx-auto min-h-screen max-w-[430px] overflow-x-hidden px-4 pb-[calc(env(safe-area-inset-bottom)+13.5rem)] pt-4">
        <div className="mb-3 flex items-center justify-between">
          <BackButton variant="icon" />
          <div className="text-center">
            <h1 className="text-lg font-black">{labels.title}</h1>
            <p className="text-[10px] font-bold text-stone-500">{labels.subtitle}</p>
          </div>
          <Link className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-emerald-800 shadow-sm" href="/favorites">
            <Bookmark className="h-4 w-4" />
          </Link>
        </div>

        <section className="mb-4 grid grid-cols-2 gap-2">
          <button
            className={`rounded-[22px] border p-3 text-left shadow-sm transition ${activeTool === "rent" ? "border-[#0A84FF] bg-white text-[#0F172A]" : "border-blue-100 bg-white/70 text-slate-500"}`}
            onClick={() => setActiveTool("rent")}
            type="button"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-blue-50 text-[#2563EB]">
              <Home className="h-4 w-4" />
            </span>
            <span className="mt-2 block text-sm font-black">{labels.title}</span>
            <span className="mt-1 block text-[11px] font-bold leading-4 text-slate-500">{labels.subtitle}</span>
          </button>
          <button
            className={`rounded-[22px] border p-3 text-left shadow-sm transition ${activeTool === "compare" ? "border-[#0A84FF] bg-white text-[#0F172A]" : "border-blue-100 bg-white/70 text-slate-500"}`}
            onClick={() => setActiveTool("compare")}
            type="button"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-blue-50 text-[#2563EB]">
              <GitCompare className="h-4 w-4" />
            </span>
            <span className="mt-2 block text-sm font-black">{labels.areaCompare}</span>
            <span className="mt-1 block text-[11px] font-bold leading-4 text-slate-500">{labels.areaCompareHint}</span>
          </button>
        </section>

        <section className="grid gap-3">
          {activeTool === "rent" && <div className="grid gap-3">
            <FormPanel title={labels.location}>
              <div className="grid gap-2">
                <RentStationSearchPicker
                  language={language}
                  loading={stationsLoading}
                  options={rentStationOptions}
                  selectedStation={station}
                  onSelect={(item) => {
                    setStation(item.station);
                    setWard(item.ward || ward);
                  }}
                />
                <InputField label={labels.walkMinutes} onChange={setWalkMinutes} value={walkMinutes} />
              </div>
            </FormPanel>

            <FormPanel title={labels.housing}>
              <div className="jl-mobile-form-grid-wide">
                <InputField label={labels.monthlyRent} prefix="¥" onChange={(value) => {
                  const total = numberValue(value);
                  const mgmt = numberValue(managementFee);
                  setRent(String(Math.max(total - mgmt, 0)));
                }} value={String(numberValue(rent) + numberValue(managementFee))} />
                <InputField label={labels.size} onChange={setSize} value={size} suffix="m²" />
                <label className="block">
                  <span className="mb-1 block text-[11px] font-bold text-slate-600">{labels.layout}</span>
                  <select className="rent-field-select h-9 w-full rounded-xl px-2.5 text-[13px] font-bold outline-none" onChange={(event) => setLayout(event.target.value as LayoutType)} value={layout}>
                    {layouts.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </label>
                <InputField label={labels.floor} onChange={setFloor} value={floor} />
              </div>
            </FormPanel>

            <section className="rounded-[18px] border border-stone-200/80 bg-white shadow-[0_7px_18px_rgba(32,38,34,0.06)]">
              <button
                className="flex w-full items-center justify-between gap-3 px-3 py-3 text-left"
                onClick={() => setDetailOpen((current) => !current)}
                type="button"
              >
                <span>
                  <span className="block text-sm font-black text-slate-950">{labels.detail}</span>
                  <span className="mt-0.5 block text-[11px] font-bold text-slate-500">
                    {language === "ja" ? "初期費用や管理費を細かく入力" : language === "zh-TW" ? "需要時再填初期費用和管理費" : "需要时再填初期费用和管理费"}
                  </span>
                </span>
                <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-stone-200 bg-white text-slate-700 transition ${detailOpen ? "rotate-180" : ""}`}>
                  <ChevronDown className="h-4 w-4" />
                </span>
              </button>
              {detailOpen && (
                <div className="grid gap-3 border-t border-stone-100 p-3">
                  <FormPanel title={labels.initialCost}>
                    <div className="jl-mobile-form-grid">
                      <InputField label={labels.keyMoney} onChange={setKeyMoneyMonths} value={keyMoneyMonths} suffix={language === "ja" ? "か月" : language === "zh-TW" ? "個月" : "个月"} />
                      <InputField label={labels.deposit} onChange={setDepositMonths} value={depositMonths} suffix={language === "ja" ? "か月" : language === "zh-TW" ? "個月" : "个月"} />
                      <InputField label={labels.broker} onChange={setBrokerMonths} value={brokerMonths} suffix={language === "ja" ? "か月" : language === "zh-TW" ? "個月" : "个月"} />
                      <InputField label={labels.fireInsurance} prefix="¥" onChange={setFireInsurance} value={fireInsurance} />
                      <InputField label={labels.guarantee} prefix="¥" onChange={setGuaranteeFee} value={guaranteeFee} />
                      <InputField label={labels.cleaning} prefix="¥" onChange={setCleaningFee} value={cleaningFee} />
                    </div>
                    <div className="jl-mobile-form-grid-wide mt-2 border-t border-stone-100 pt-2">
                      <InputField label={labels.rentBase} prefix="¥" onChange={setRent} value={rent} />
                      <InputField label={labels.management} prefix="¥" onChange={setManagementFee} value={managementFee} />
                      <InputField label={labels.age} onChange={setAge} value={age} />
                      <InputField label={labels.lock} prefix="¥" onChange={setLockFee} value={lockFee} />
                    </div>
                  </FormPanel>
                </div>
              )}
            </section>
          </div>}

          {activeTool === "compare" && (
            <section className="rounded-[22px] border border-stone-200/80 bg-white shadow-[0_7px_18px_rgba(32,38,34,0.06)]">
                <div className="grid gap-3 border-t border-stone-100 p-3">
                  <div className="grid grid-cols-1 gap-3">
                    <CompareStationPicker
                      label={labels.areaA}
                      language={language}
                      loading={stationsLoading}
                      options={rentStationOptions}
                      station={compareLeftStation}
                      onStationChange={setCompareLeftStation}
                    />
                    <CompareStationPicker
                      label={labels.areaB}
                      language={language}
                      loading={stationsLoading}
                      options={rentStationOptions}
                      station={compareRightStation}
                      onStationChange={setCompareRightStation}
                    />
                  </div>
                  {compareLeftStation === compareRightStation ? (
                    <p className="rounded-2xl border border-red-100 bg-red-50 p-3 text-xs font-black text-red-700">{labels.sameStation}</p>
                  ) : (
                    <div className="grid gap-2">
                      <div className="grid grid-cols-3 gap-1 rounded-2xl bg-stone-100 p-1">
                        {[
                          { key: "summary" as const, label: labels.compareSummary },
                          { key: "scores" as const, label: labels.compareScores },
                          { key: "details" as const, label: labels.compareDetails },
                        ].map((item) => (
                          <button className={`selection-chip rounded-xl px-2 py-2 text-xs font-black ${compareTab === item.key ? "is-selected" : ""}`} key={item.key} onClick={() => setCompareTab(item.key)} type="button">
                            {item.label}
                          </button>
                        ))}
                      </div>

                      {compareTab === "summary" && (
                        <div className="grid gap-3">
                          <section className="rounded-[20px] border border-blue-100 bg-white p-3 shadow-sm">
                            <p className="text-xs font-black text-[#2563EB]">Score</p>
                            <h3 className="mt-1 text-lg font-black text-slate-950">{labels.recommend(areaName(compareResult.winner, language))}</h3>
                            <div className="mt-3 grid grid-cols-2 gap-2">
                              <ScorePill name={areaName(compareResult.leftArea, language)} score={compareResult.leftScore} />
                              <ScorePill name={areaName(compareResult.rightArea, language)} score={compareResult.rightScore} />
                            </div>
                          </section>

                          <CompareCard title={labels.referenceRent} icon={Home}>
                            <TwoValues left={yen(compareResult.leftRent)} right={yen(compareResult.rightRent)} />
                            <div className="mt-3 grid grid-cols-2 gap-2">
                              <MiniStat label={labels.monthlyDiff} value={yen(compareResult.diff)} />
                              <MiniStat label={labels.yearlyDiff} value={yen(compareResult.diff * 12)} />
                            </div>
                            <p className="mt-3 rounded-2xl bg-blue-50 p-3 text-xs font-black leading-5 text-[#1D4ED8]">
                              {labels.cheaper}: {compareResult.cheaperStation} / {layout} / {size}m²
                            </p>
                          </CompareCard>

                          <CompareCard title={labels.wage} icon={WalletCards}>
                            <TwoValues left={yen(compareResult.leftArea.averageWage)} right={yen(compareResult.rightArea.averageWage)} />
                            <MiniStat label={labels.monthlyDiff} value={yen(compareResult.wageDiff)} />
                            {compareResult.higherWageRentAlsoHigher && <p className="mt-3 rounded-2xl bg-amber-50 p-3 text-xs font-black leading-5 text-amber-800">{labels.wagePressure}</p>}
                          </CompareCard>
                        </div>
                      )}

                      {compareTab === "scores" && (
                        <section className="rounded-[20px] border border-stone-200 bg-white p-3 shadow-sm">
                          <h3 className="text-base font-black text-slate-950">{labels.scores}</h3>
                          {[
                            [labels.scoreLabels.transport, compareResult.leftArea.transportScore, compareResult.rightArea.transportScore],
                            [labels.scoreLabels.foreignerFriendly, compareResult.leftArea.foreignerFriendlyScore, compareResult.rightArea.foreignerFriendlyScore],
                            [labels.scoreLabels.livingConvenience, compareResult.leftArea.livingConvenienceScore, compareResult.rightArea.livingConvenienceScore],
                            [labels.scoreLabels.safety, compareResult.leftArea.safetyScore, compareResult.rightArea.safetyScore],
                            [labels.scoreLabels.chineseResource, compareResult.leftArea.chineseResourceScore, compareResult.rightArea.chineseResourceScore],
                          ].map(([label, leftValue, rightValue]) => (
                            <ScoreRow key={label as string} label={label as string} left={leftValue as number} right={rightValue as number} />
                          ))}
                        </section>
                      )}

                      {compareTab === "details" && (
                        <div className="grid gap-3">
                          <AreaSummary area={compareResult.leftArea} labels={labels} language={language} />
                          <AreaSummary area={compareResult.rightArea} labels={labels} language={language} />
                          <Link className="rounded-2xl border border-blue-100 bg-white p-3 text-center text-xs font-black text-[#2563EB] shadow-sm" href="/places">
                            {labels.places}
                          </Link>
                        </div>
                      )}

                      <button
                        className="flex h-11 items-center justify-center gap-2 rounded-2xl border border-[#0A84FF] bg-white text-sm font-black text-[#0066D6]"
                        onClick={async () => {
                          await navigator.clipboard.writeText(`${labels.areaCompare}\n${compareLeftStation}: ${yen(compareResult.leftRent)} / Score ${compareResult.leftScore}\n${compareRightStation}: ${yen(compareResult.rightRent)} / Score ${compareResult.rightScore}\n${labels.monthlyDiff}: ${yen(compareResult.diff)}\n${labels.yearlyDiff}: ${yen(compareResult.diff * 12)}\n${labels.wage}: ${yen(compareResult.leftArea.averageWage)} vs ${yen(compareResult.rightArea.averageWage)}\n${labels.recommend(areaName(compareResult.winner, language))}\n${labels.referenceNotice}`);
                          setCompareCopied(true);
                          window.setTimeout(() => setCompareCopied(false), 1600);
                        }}
                        type="button"
                      >
                        <Copy className="h-4 w-4" />
                        {compareCopied ? labels.compareCopied : labels.compareCopy}
                      </button>
                    </div>
                  )}
                </div>
            </section>
          )}

          {activeTool === "rent" && <section className="rounded-[22px] border border-stone-200/80 bg-white p-4 shadow-[0_10px_28px_rgba(32,38,34,0.07)]">
            <div className="flex flex-col gap-4 min-[390px]:flex-row min-[390px]:items-center">
              <div className="relative flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-emerald-100">
                <div className="absolute inset-2 rounded-full border-[8px] border-emerald-700 border-r-emerald-200" />
                <div className="relative text-center">
                  <p className="text-3xl font-black text-emerald-800">{result.score}</p>
                  <p className="text-[10px] font-black text-stone-500">/100</p>
                </div>
              </div>
              <div>
                <p className="text-lg font-black">
                  {labels.score}: <span className={result.score < 70 ? "text-amber-700" : "text-emerald-800"}>{result.score < 70 ? labels.caution : labels.good}</span>
                </p>
                <p className="mt-2 text-sm font-bold leading-6 text-stone-600">{result.score < 70 ? labels.scoreDescCaution : labels.scoreDescGood}</p>
              </div>
            </div>

            <div className="jl-mobile-form-grid-wide mt-4">
              <StatBox label={labels.monthlyCost} value={yen(result.monthlyTotal)} />
              <StatBox label={labels.initialCost} value={yen(result.initialCost)} />
              <StatBox label={labels.referenceRent} value={yen(result.referenceRent)} />
              <StatBox label={labels.perSqm} value={`${yen(result.perSqm)}/m²`} />
            </div>

            <div className="mt-4 rounded-[16px] border-l-4 border-emerald-700 bg-emerald-50 p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-black">{labels.advice}</p>
                  <ul className="mt-1 space-y-1 text-xs font-bold leading-5 text-emerald-950">
                    <li>{labels.walkAdvice(walkMinutes)}</li>
                    <li>
                      {labels.diffAdvice(layout, yen(result.referenceRent), result.diff >= 0 ? labels.higher(yen(result.diff)) : labels.lower(yen(Math.abs(result.diff))))}
                    </li>
                    <li>{labels.initialAdvice(yen(result.initialCost), (result.initialCost / Math.max(result.monthlyTotal, 1)).toFixed(1))}</li>
                  </ul>
                </div>
                <button className="text-emerald-800" onClick={saveResult} type="button" aria-label="保存">
                  <Bookmark className="h-5 w-5" />
                </button>
              </div>
            </div>

          <p className="mt-3 text-[11px] font-bold leading-5 text-stone-500">
            {labels.sourcePrefix}:{" "}
            {result.stationData
                ? `${result.stationData.station} / ${result.stationReferenceLabel} ${yen(result.stationData.base1K)}`
                : labels.stationReferenceFallback}
              。{t.common.referenceOnly}
            </p>
            <p className="mt-2 rounded-2xl bg-amber-50 p-3 text-[11px] font-bold leading-5 text-amber-800">{labels.referenceNotice}</p>
          </section>}
        </section>

        <div className="jl-mobile-action-bar fixed inset-x-4 bottom-[calc(env(safe-area-inset-bottom)+5.85rem)] z-20 mx-auto grid max-w-[398px] grid-cols-2 gap-2 bg-white/95 p-3 backdrop-blur min-[390px]:grid-cols-4">
          <button className="flex h-11 min-w-0 items-center justify-center rounded-2xl border border-[#0A84FF] bg-white px-2 text-xs font-black text-[#0066D6] min-[390px]:text-sm" onClick={saveForm} type="button">
            {saved ? t.common.copied : t.common.save}
          </button>
          <button className="flex h-11 min-w-0 items-center justify-center rounded-2xl border border-slate-300 bg-white px-2 text-xs font-black text-slate-700 min-[390px]:text-sm" onClick={clearForm} type="button">
            {language === "ja" ? "クリア" : language === "zh-TW" ? "清空" : "清空"}
          </button>
          <button className="flex h-11 min-w-0 items-center justify-center rounded-2xl border border-emerald-700 bg-white px-2 text-xs font-black text-emerald-800 min-[390px]:text-sm" onClick={saveResult} type="button">
            {labels.save}
          </button>
          <button
            className="flex h-11 min-w-0 items-center justify-center rounded-2xl bg-emerald-800 px-2 text-xs font-black text-white min-[390px]:text-sm"
            onClick={async () => {
              await navigator.clipboard.writeText(`${t.rent.shareText}\n${station}\n${layout} / ${size}m²\n${labels.monthlyCost} ${yen(result.monthlyTotal)}\n${labels.referenceRent} ${result.priceLabel}\nScore ${result.score}`);
              setCopied(true);
            }}
            type="button"
          >
            {copied ? t.common.copied : labels.copy}
          </button>
        </div>
      </div>
    </main>
  );
}
