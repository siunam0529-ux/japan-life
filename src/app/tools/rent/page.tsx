"use client";

import { Bookmark, CheckCircle2, ChevronDown, Copy, GitCompare, Home, WalletCards } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { BackButton } from "@/components/BackButton";
import { areaItems, type AreaItem } from "@/data/areas";
import { tokyoStationRent2025, tokyoWards2025, type LayoutType, type StationRentData } from "@/data/tokyoStationRent2025";
import { useFavorites } from "@/hooks/useFavorites";
import { useLanguage } from "@/hooks/useLanguage";
import { formatCurrency } from "@/lib/formatCurrency";
import { estimateRentByStation, staticRentReferenceNotice } from "@/lib/rentEstimate";

const layouts: LayoutType[] = ["1R", "1K", "1DK", "1LDK", "2K", "2DK", "2LDK", "3LDK"];
const rentFormStorageKey = "japan-life:rent-form";
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
    areaCompare: "地区对比",
    areaCompareHint: "比较两个区/车站的参考租金，和上面的房租评估使用同一份数据。",
    areaA: "地区 A",
    areaB: "地区 B",
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
    areaCompare: "地區比較",
    areaCompareHint: "比較兩個區/車站的參考租金，和上面的房租評估使用同一份資料。",
    areaA: "地區 A",
    areaB: "地區 B",
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
    areaCompare: "エリア比較",
    areaCompareHint: "2つの区・駅の参考家賃を比較します。上の家賃チェックと同じデータを使います。",
    areaA: "エリア A",
    areaB: "エリア B",
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
  return areaItems.find((area) => area.nameJa.includes(station.ward.replace("区", "")) || area.nameZhCN.includes(station.ward.replace("区", ""))) ?? areaItems.find((area) => area.nameZhCN.includes(station.area) || area.nameJa.includes(station.area));
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
    <label className="block">
      <span className="mb-1 block text-xs font-bold text-slate-600">{label}</span>
      <span className="flex h-9 items-center rounded-xl border border-blue-200 bg-white px-2.5 shadow-sm">
        {prefix ? <span className="mr-2 text-xs font-black text-[#2563EB]">{prefix}</span> : null}
        <input
          className="min-w-0 flex-1 bg-transparent text-[13px] font-bold text-slate-950 outline-none"
          inputMode="decimal"
          onChange={(event) => onChange(event.target.value)}
          type="number"
          value={value}
        />
        {suffix ? <span className="ml-2 text-xs font-bold text-slate-500">{suffix}</span> : null}
      </span>
    </label>
  );
}

function FormPanel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-[18px] border border-stone-200/80 bg-white p-3 shadow-[0_7px_18px_rgba(32,38,34,0.06)]">
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

function CompareStationPicker({
  label,
  onStationChange,
  onWardChange,
  station,
  stationLabel,
  ward,
  wardLabel,
}: {
  label: string;
  onStationChange: (value: string) => void;
  onWardChange: (value: string) => void;
  station: string;
  stationLabel: string;
  ward: string;
  wardLabel: string;
}) {
  const stations = tokyoStationRent2025.filter((item) => item.ward === ward);

  return (
    <div className="grid gap-2 rounded-2xl border border-stone-200 bg-stone-50 p-3">
      <p className="text-xs font-black text-slate-700">{label}</p>
      <label className="block">
        <span className="mb-1 block text-[11px] font-bold text-slate-600">{wardLabel}</span>
        <select className="rent-field-select h-9 w-full rounded-xl px-2.5 text-[13px] font-bold outline-none" onChange={(event) => onWardChange(event.target.value)} value={ward}>
          {tokyoWards2025.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="mb-1 block text-[11px] font-bold text-slate-600">{stationLabel}</span>
        <select className="rent-field-select h-9 w-full rounded-xl px-2.5 text-[13px] font-bold outline-none" onChange={(event) => onStationChange(event.target.value)} value={station}>
          {stations.map((item) => (
            <option key={item.station} value={item.station}>
              {item.station}
            </option>
          ))}
        </select>
      </label>
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
  const [activeTool, setActiveTool] = useState<ActiveRentTool>("rent");
  const [detailOpen, setDetailOpen] = useState(defaultRentForm.tab === "detail");
  const [compareTab, setCompareTab] = useState<CompareTab>("summary");
  const [ward, setWard] = useState(defaultRentForm.ward);
  const stationOptions = useMemo(() => tokyoStationRent2025.filter((item) => item.ward === ward), [ward]);
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
    const estimate = estimateRentByStation({
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
      score,
    };
  }, [age, brokerMonths, cleaningFee, depositMonths, fireInsurance, guaranteeFee, keyMoneyMonths, labels.priceHigh, labels.priceLow, labels.priceMarket, layout, lockFee, managementFee, rent, size, station, walkMinutes]);

  const compareResult = useMemo(() => {
    const leftStationData = tokyoStationRent2025.find((item) => item.station === compareLeftStation) ?? tokyoStationRent2025[0];
    const rightStationData = tokyoStationRent2025.find((item) => item.station === compareRightStation) ?? tokyoStationRent2025[1];
    const leftArea = findAreaForStation(leftStationData) ?? areaItems[0];
    const rightArea = findAreaForStation(rightStationData) ?? areaItems[1];
    const leftScore = totalScore(leftArea);
    const rightScore = totalScore(rightArea);
    const winner = leftScore >= rightScore ? leftArea : rightArea;
    const left = estimateRentByStation({
      buildingAge: numberValue(age),
      floor: numberValue(floor),
      layout,
      size: numberValue(size),
      stationName: compareLeftStation,
      walkMinutes: numberValue(walkMinutes),
    });
    const right = estimateRentByStation({
      buildingAge: numberValue(age),
      floor: numberValue(floor),
      layout,
      size: numberValue(size),
      stationName: compareRightStation,
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
  }, [age, compareLeftStation, compareRightStation, floor, layout, size, walkMinutes]);

  const saveResult = () => {
    toggleFavorite({
      id: `rent-${ward}-${station}-${layout}`,
      type: "article",
      title: `${ward} ${station} ${labels.title}`,
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
    <main className="min-h-screen bg-[#f5f0e7] text-slate-950">
      <div className="mx-auto min-h-screen max-w-[430px] bg-[#fbf8f2] px-4 pb-24 pt-4 shadow-2xl shadow-stone-300/40">
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
              <div className="grid grid-cols-1 gap-2 min-[390px]:grid-cols-3">
                <label className="block">
                  <span className="mb-1 block text-[11px] font-bold text-slate-600">{labels.ward}</span>
                  <select
                    className="rent-field-select h-9 w-full rounded-xl px-2.5 text-[13px] font-bold outline-none"
                    onChange={(event) => {
                      const nextWard = event.target.value;
                      setWard(nextWard);
                      setStation(tokyoStationRent2025.find((item) => item.ward === nextWard)?.station ?? station);
                    }}
                    value={ward}
                  >
                    {tokyoWards2025.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="mb-1 block text-[11px] font-bold text-slate-600">{labels.station}</span>
                  <select className="rent-field-select h-9 w-full rounded-xl px-2.5 text-[13px] font-bold outline-none" onChange={(event) => setStation(event.target.value)} value={station}>
                    {stationOptions.map((item) => (
                      <option key={item.station} value={item.station}>
                        {item.station}
                      </option>
                    ))}
                  </select>
                </label>
                <InputField label={labels.walkMinutes} onChange={setWalkMinutes} value={walkMinutes} />
              </div>
            </FormPanel>

            <FormPanel title={labels.housing}>
              <div className="grid grid-cols-1 gap-2 min-[360px]:grid-cols-2">
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
                    <div className="grid grid-cols-1 gap-2 min-[390px]:grid-cols-3">
                      <InputField label={labels.keyMoney} onChange={setKeyMoneyMonths} value={keyMoneyMonths} suffix={language === "ja" ? "か月" : language === "zh-TW" ? "個月" : "个月"} />
                      <InputField label={labels.deposit} onChange={setDepositMonths} value={depositMonths} suffix={language === "ja" ? "か月" : language === "zh-TW" ? "個月" : "个月"} />
                      <InputField label={labels.broker} onChange={setBrokerMonths} value={brokerMonths} suffix={language === "ja" ? "か月" : language === "zh-TW" ? "個月" : "个月"} />
                      <InputField label={labels.fireInsurance} prefix="¥" onChange={setFireInsurance} value={fireInsurance} />
                      <InputField label={labels.guarantee} prefix="¥" onChange={setGuaranteeFee} value={guaranteeFee} />
                      <InputField label={labels.cleaning} prefix="¥" onChange={setCleaningFee} value={cleaningFee} />
                    </div>
                    <div className="mt-2 grid grid-cols-1 gap-2 border-t border-stone-100 pt-2 min-[360px]:grid-cols-2">
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
                  <div className="grid grid-cols-1 gap-2 min-[390px]:grid-cols-2">
                    <CompareStationPicker
                      label={labels.areaA}
                      station={compareLeftStation}
                      ward={compareLeftWard}
                      wardLabel={labels.ward}
                      stationLabel={labels.station}
                      onStationChange={setCompareLeftStation}
                      onWardChange={(nextWard) => {
                        setCompareLeftWard(nextWard);
                        setCompareLeftStation(tokyoStationRent2025.find((item) => item.ward === nextWard)?.station ?? compareLeftStation);
                      }}
                    />
                    <CompareStationPicker
                      label={labels.areaB}
                      station={compareRightStation}
                      ward={compareRightWard}
                      wardLabel={labels.ward}
                      stationLabel={labels.station}
                      onStationChange={setCompareRightStation}
                      onWardChange={(nextWard) => {
                        setCompareRightWard(nextWard);
                        setCompareRightStation(tokyoStationRent2025.find((item) => item.ward === nextWard)?.station ?? compareRightStation);
                      }}
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
                          <Link className="rounded-2xl border border-blue-100 bg-white p-3 text-center text-xs font-black text-[#2563EB] shadow-sm" href={`/places?area=${compareResult.winner.id}`}>
                            {labels.places}
                          </Link>
                        </div>
                      )}

                      <button
                        className="flex h-11 items-center justify-center gap-2 rounded-2xl border border-[#0A84FF] bg-white text-sm font-black text-[#0066D6]"
                        onClick={async () => {
                          await navigator.clipboard.writeText(`${labels.areaCompare}\n${compareLeftWard} ${compareLeftStation}: ${yen(compareResult.leftRent)} / ${areaName(compareResult.leftArea, language)} Score ${compareResult.leftScore}\n${compareRightWard} ${compareRightStation}: ${yen(compareResult.rightRent)} / ${areaName(compareResult.rightArea, language)} Score ${compareResult.rightScore}\n${labels.monthlyDiff}: ${yen(compareResult.diff)}\n${labels.yearlyDiff}: ${yen(compareResult.diff * 12)}\n${labels.wage}: ${yen(compareResult.leftArea.averageWage)} vs ${yen(compareResult.rightArea.averageWage)}\n${labels.recommend(areaName(compareResult.winner, language))}\n${staticRentReferenceNotice}`);
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
            <div className="flex items-center gap-4">
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

            <div className="mt-4 grid grid-cols-1 gap-2 min-[360px]:grid-cols-2">
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
              {labels.sourcePrefix}: {result.stationData ? `${result.stationData.ward} / ${result.stationData.station} / base1K ${yen(result.stationData.base1K)}` : "2025-2026 东京热门车站参考"}。{t.common.referenceOnly}
            </p>
            <p className="mt-2 rounded-2xl bg-amber-50 p-3 text-[11px] font-bold leading-5 text-amber-800">{staticRentReferenceNotice}</p>
          </section>}
        </section>

        <div className="fixed inset-x-0 bottom-0 z-20 mx-auto flex max-w-[430px] gap-2 border-t border-stone-200 bg-white/95 px-4 py-3 backdrop-blur">
          <button className="flex h-11 flex-1 items-center justify-center rounded-2xl border border-[#0A84FF] bg-white text-sm font-black text-[#0066D6]" onClick={saveForm} type="button">
            {saved ? t.common.copied : t.common.save}
          </button>
          <button className="flex h-11 flex-1 items-center justify-center rounded-2xl border border-slate-300 bg-white text-sm font-black text-slate-700" onClick={clearForm} type="button">
            {language === "ja" ? "クリア" : language === "zh-TW" ? "清空" : "清空"}
          </button>
          <button className="flex h-11 flex-1 items-center justify-center rounded-2xl border border-emerald-700 bg-white text-sm font-black text-emerald-800" onClick={saveResult} type="button">
            {labels.save}
          </button>
          <button
            className="flex h-11 flex-1 items-center justify-center rounded-2xl bg-emerald-800 text-sm font-black text-white"
            onClick={async () => {
              await navigator.clipboard.writeText(`${t.rent.shareText}\n${ward} ${station}\n${layout} / ${size}m²\n${labels.monthlyCost} ${yen(result.monthlyTotal)}\n${labels.referenceRent} ${result.priceLabel}\nScore ${result.score}`);
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
