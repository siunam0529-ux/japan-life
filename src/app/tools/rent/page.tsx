"use client";

import { Bookmark } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { BackButton } from "@/components/BackButton";
import { useFavorites } from "@/hooks/useFavorites";
import { useLanguage } from "@/hooks/useLanguage";
import type { Language } from "@/lib/i18n/translations";
import { formatCurrency } from "@/lib/formatCurrency";

type Layout = "1R" | "1K" | "1LDK" | "2LDK" | "3LDK";

type AreaReference = {
  ward: string;
  wardZhTW?: string;
  wardJa?: string;
  stations: string[];
  stationsZhTW?: string[];
  stationsJa?: string[];
  rents: Record<Layout, number>;
  stationOneRoom?: Record<string, number>;
  source: string;
};

const areaReferences: AreaReference[] = [
  { ward: "千代田区", stations: ["东京", "秋叶原", "神田"], rents: { "1R": 88000, "1K": 105000, "1LDK": 188000, "2LDK": 310000, "3LDK": 430000 }, source: "2026 静态参考：东京23区租房相场 mock baseline" },
  { ward: "中央区", stations: ["银座", "日本桥", "胜哄"], rents: { "1R": 86000, "1K": 103000, "1LDK": 182000, "2LDK": 292000, "3LDK": 410000 }, source: "2026 静态参考：东京23区租房相场 mock baseline" },
  { ward: "港区", stations: ["六本木", "品川", "麻布十番"], rents: { "1R": 105000, "1K": 128000, "1LDK": 235000, "2LDK": 390000, "3LDK": 560000 }, source: "2026 静态参考：东京23区租房相场 mock baseline" },
  { ward: "新宿区", stations: ["新宿", "高田马场", "新大久保"], rents: { "1R": 88000, "1K": 104800, "1LDK": 175000, "2LDK": 272000, "3LDK": 385000 }, stationOneRoom: { "高田马场": 114000, "新大久保": 135000 }, source: "2026 静态参考：东京23区租房相场 mock baseline" },
  { ward: "文京区", stations: ["后乐园", "本乡三丁目", "茗荷谷"], rents: { "1R": 76000, "1K": 92000, "1LDK": 155000, "2LDK": 235000, "3LDK": 320000 }, source: "2026 静态参考：东京23区租房相场 mock baseline" },
  { ward: "台东区", stations: ["上野", "浅草", "御徒町"], rents: { "1R": 59000, "1K": 71200, "1LDK": 136000, "2LDK": 165700, "3LDK": 212300 }, stationOneRoom: { "浅草": 102000 }, source: "2026 静态参考：东京23区租房相场 mock baseline" },
  { ward: "墨田区", stations: ["锦糸町", "押上", "両国"], rents: { "1R": 62000, "1K": 75000, "1LDK": 124000, "2LDK": 178000, "3LDK": 232000 }, source: "2026 静态参考：东京23区租房相场 mock baseline" },
  { ward: "江东区", stations: ["丰洲", "龟户", "门前仲町"], rents: { "1R": 68000, "1K": 83000, "1LDK": 142000, "2LDK": 210000, "3LDK": 285000 }, source: "2026 静态参考：东京23区租房相场 mock baseline" },
  { ward: "品川区", stations: ["品川", "五反田", "大井町"], rents: { "1R": 76000, "1K": 93000, "1LDK": 160000, "2LDK": 248000, "3LDK": 340000 }, source: "2026 静态参考：东京23区租房相场 mock baseline" },
  { ward: "目黑区", stations: ["中目黑", "自由之丘", "学芸大学"], rents: { "1R": 82000, "1K": 99000, "1LDK": 176000, "2LDK": 280000, "3LDK": 395000 }, source: "2026 静态参考：东京23区租房相场 mock baseline" },
  { ward: "大田区", stations: ["蒲田", "大森", "羽田机场"], rents: { "1R": 59000, "1K": 71000, "1LDK": 118000, "2LDK": 165000, "3LDK": 220000 }, source: "2026 静态参考：东京23区租房相场 mock baseline" },
  { ward: "世田谷区", stations: ["三轩茶屋", "下北泽", "二子玉川"], rents: { "1R": 72000, "1K": 88000, "1LDK": 148000, "2LDK": 222000, "3LDK": 305000 }, source: "2026 静态参考：东京23区租房相场 mock baseline" },
  { ward: "涩谷区", stations: ["涩谷", "惠比寿", "笹塚"], rents: { "1R": 95000, "1K": 116000, "1LDK": 205000, "2LDK": 335000, "3LDK": 470000 }, source: "2026 静态参考：东京23区租房相场 mock baseline" },
  { ward: "中野区", stations: ["中野", "东中野", "野方"], rents: { "1R": 66000, "1K": 79000, "1LDK": 128000, "2LDK": 184000, "3LDK": 245000 }, source: "2026 静态参考：东京23区租房相场 mock baseline" },
  { ward: "杉并区", stations: ["高圆寺", "荻窪", "阿佐谷"], rents: { "1R": 63000, "1K": 76000, "1LDK": 122000, "2LDK": 172000, "3LDK": 230000 }, source: "2026 静态参考：东京23区租房相场 mock baseline" },
  { ward: "丰岛区", stations: ["池袋", "大塚", "目白"], rents: { "1R": 68500, "1K": 82400, "1LDK": 132000, "2LDK": 195000, "3LDK": 262000 }, stationOneRoom: { "池袋": 120400 }, source: "2026 静态参考：东京23区租房相场 mock baseline" },
  { ward: "北区", stations: ["赤羽", "王子", "田端"], rents: { "1R": 56000, "1K": 67000, "1LDK": 104000, "2LDK": 150000, "3LDK": 198000 }, source: "2026 静态参考：东京23区租房相场 mock baseline" },
  { ward: "荒川区", stations: ["日暮里", "南千住", "町屋"], rents: { "1R": 55000, "1K": 66000, "1LDK": 102000, "2LDK": 145000, "3LDK": 190000 }, source: "2026 静态参考：东京23区租房相场 mock baseline" },
  { ward: "板桥区", stations: ["上板桥", "板桥", "大山"], rents: { "1R": 52000, "1K": 62500, "1LDK": 91400, "2LDK": 141000, "3LDK": 185000 }, source: "2026 静态参考：东京23区租房相场 mock baseline" },
  { ward: "练马区", stations: ["练马", "光丘", "石神井公园"], rents: { "1R": 54000, "1K": 65000, "1LDK": 98000, "2LDK": 142000, "3LDK": 188000 }, source: "2026 静态参考：东京23区租房相场 mock baseline" },
  { ward: "足立区", stations: ["北千住", "绫濑", "西新井"], rents: { "1R": 50000, "1K": 60000, "1LDK": 90000, "2LDK": 128000, "3LDK": 168000 }, source: "2026 静态参考：东京23区租房相场 mock baseline" },
  { ward: "葛饰区", stations: ["龟有", "新小岩", "金町"], rents: { "1R": 49000, "1K": 59000, "1LDK": 87000, "2LDK": 123000, "3LDK": 160000 }, source: "2026 静态参考：东京23区租房相场 mock baseline" },
  { ward: "江户川区", stations: ["葛西", "小岩", "船堀"], rents: { "1R": 51000, "1K": 61800, "1LDK": 89200, "2LDK": 138500, "3LDK": 178000 }, source: "2026 静态参考：东京23区租房相场 mock baseline" },
];

const layouts: Layout[] = ["1R", "1K", "1LDK", "2LDK", "3LDK"];

const yen = (value: number) => formatCurrency(value, "JPY");
const zhTwMap: Record<string, string> = {
  "台东区": "台東區",
  "江东区": "江東區",
  "目黑区": "目黑區",
  "涩谷区": "澀谷區",
  "杉并区": "杉並區",
  "丰岛区": "豐島區",
  "板桥区": "板橋區",
  "练马区": "練馬區",
  "葛饰区": "葛飾區",
  "江户川区": "江戶川區",
  "东京": "東京",
  "银座": "銀座",
  "日本桥": "日本橋",
  "胜哄": "勝鬨",
  "高田马场": "高田馬場",
  "后乐园": "後樂園",
  "本乡三丁目": "本鄉三丁目",
  "浅草": "淺草",
  "锦糸町": "錦糸町",
  "丰洲": "豐洲",
  "龟户": "龜戶",
  "目白": "目白",
  "上板桥": "上板橋",
  "板桥": "板橋",
  "练马": "練馬",
  "绫濑": "綾瀨",
  "龟有": "龜有",
};
const jaMap: Record<string, string> = {
  "台东区": "台東区",
  "江东区": "江東区",
  "目黑区": "目黒区",
  "涩谷区": "渋谷区",
  "杉并区": "杉並区",
  "丰岛区": "豊島区",
  "板桥区": "板橋区",
  "练马区": "練馬区",
  "葛饰区": "葛飾区",
  "江户川区": "江戸川区",
  "东京": "東京",
  "银座": "銀座",
  "日本桥": "日本橋",
  "胜哄": "勝どき",
  "高田马场": "高田馬場",
  "后乐园": "後楽園",
  "本乡三丁目": "本郷三丁目",
  "浅草": "浅草",
  "锦糸町": "錦糸町",
  "丰洲": "豊洲",
  "龟户": "亀戸",
  "门前仲町": "門前仲町",
  "中目黑": "中目黒",
  "自由之丘": "自由が丘",
  "羽田机场": "羽田空港",
  "三轩茶屋": "三軒茶屋",
  "下北泽": "下北沢",
  "涩谷": "渋谷",
  "惠比寿": "恵比寿",
  "高圆寺": "高円寺",
  "池袋": "池袋",
  "上板桥": "上板橋",
  "板桥": "板橋",
  "练马": "練馬",
  "石神井公园": "石神井公園",
  "绫濑": "綾瀬",
  "龟有": "亀有",
};

function localText(value: string, language: Language) {
  if (language === "zh-TW") return zhTwMap[value] ?? value;
  if (language === "ja") return jaMap[value] ?? value;
  return value;
}

function stationList(reference: AreaReference, language: Language) {
  if (language === "zh-TW") return reference.stationsZhTW ?? reference.stations.map((stationName) => localText(stationName, language));
  if (language === "ja") return reference.stationsJa ?? reference.stations.map((stationName) => localText(stationName, language));
  return reference.stations;
}

const rentCopy = {
  "zh-CN": {
    title: "房租评估",
    subtitle: "东京23区参考 · mock data",
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
    referenceRent: "23区参考租金",
    perSqm: "每平米房租",
    advice: "建议",
    walkAdvice: (minutes: string) => `步行 ${minutes} 分钟可达车站，通勤便利。`,
    diffAdvice: (layout: string, ref: string, diffText: string) => `${layout} 户型参考为 ${ref}，当前成本${diffText}。`,
    initialAdvice: (cost: string, months: string) => `初期费用约 ${cost}，约 ${months} 个月房租。`,
    higher: (value: string) => `高出 ${value}`,
    lower: (value: string) => `低于 ${value}`,
    save: "保存评估",
    copy: "复制结果",
    sourcePrefix: "23区参考",
    priceHigh: "偏贵",
    priceLow: "偏便宜",
    priceMarket: "接近市场",
  },
  "zh-TW": {
    title: "房租評估",
    subtitle: "東京23區參考 · mock data",
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
    referenceRent: "23區參考租金",
    perSqm: "每平方公尺房租",
    advice: "建議",
    walkAdvice: (minutes: string) => `步行 ${minutes} 分鐘可到車站，通勤便利。`,
    diffAdvice: (layout: string, ref: string, diffText: string) => `${layout} 房型參考為 ${ref}，目前成本${diffText}。`,
    initialAdvice: (cost: string, months: string) => `初期費用約 ${cost}，約 ${months} 個月房租。`,
    higher: (value: string) => `高出 ${value}`,
    lower: (value: string) => `低於 ${value}`,
    save: "儲存評估",
    copy: "複製結果",
    sourcePrefix: "23區參考",
    priceHigh: "偏貴",
    priceLow: "偏便宜",
    priceMarket: "接近市場",
  },
  ja: {
    title: "家賃チェック",
    subtitle: "東京23区参考 · mock data",
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
    referenceRent: "23区参考家賃",
    perSqm: "1m²あたり家賃",
    advice: "アドバイス",
    walkAdvice: (minutes: string) => `駅まで徒歩 ${minutes} 分で、通勤しやすい条件です。`,
    diffAdvice: (layout: string, ref: string, diffText: string) => `${layout} の参考家賃は ${ref}、現在の費用は${diffText}です。`,
    initialAdvice: (cost: string, months: string) => `初期費用は約 ${cost}、月額費用の約 ${months} か月分です。`,
    higher: (value: string) => `${value} 高い`,
    lower: (value: string) => `${value} 低い`,
    save: "評価を保存",
    copy: "結果をコピー",
    sourcePrefix: "23区参考",
    priceHigh: "高め",
    priceLow: "安め",
    priceMarket: "相場に近い",
  },
} as const;

function numberValue(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function InputField({
  label,
  value,
  onChange,
  suffix,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  suffix?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-bold text-slate-600">{label}</span>
      <span className="flex h-9 items-center rounded-xl border border-stone-300 bg-[#f3f1eb] px-2.5">
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

export default function RentPage() {
  const { language, t } = useLanguage();
  const labels = rentCopy[language];
  const { toggleFavorite } = useFavorites();
  const [tab, setTab] = useState<"quick" | "detail">("quick");
  const [ward, setWard] = useState("板桥区");
  const selectedReference = areaReferences.find((item) => item.ward === ward) ?? areaReferences[0];
  const localizedStations = stationList(selectedReference, language);
  const [station, setStation] = useState("上板桥");
  const [walkMinutes, setWalkMinutes] = useState("7");
  const [rent, setRent] = useState("110000");
  const [managementFee, setManagementFee] = useState("10000");
  const [size, setSize] = useState("45");
  const [age, setAge] = useState("55");
  const [floor, setFloor] = useState("1");
  const [layout, setLayout] = useState<Layout>("3LDK");
  const [depositMonths, setDepositMonths] = useState("1");
  const [keyMoneyMonths, setKeyMoneyMonths] = useState("1");
  const [brokerMonths, setBrokerMonths] = useState("1");
  const [guaranteeFee, setGuaranteeFee] = useState("40000");
  const [fireInsurance, setFireInsurance] = useState("20000");
  const [lockFee, setLockFee] = useState("22000");
  const [cleaningFee, setCleaningFee] = useState("40000");
  const [copied, setCopied] = useState(false);

  const result = useMemo(() => {
    const monthlyRent = numberValue(rent);
    const monthlyTotal = monthlyRent + numberValue(managementFee);
    const areaSize = Math.max(numberValue(size), 1);
    const referenceRent = selectedReference.stationOneRoom?.[station] ?? selectedReference.rents[layout];
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
      referenceRent,
      score,
    };
  }, [age, brokerMonths, cleaningFee, depositMonths, fireInsurance, guaranteeFee, keyMoneyMonths, labels.priceHigh, labels.priceLow, labels.priceMarket, layout, lockFee, managementFee, rent, selectedReference, size, station, walkMinutes]);

  const saveResult = () => {
    toggleFavorite({
      id: `rent-${ward}-${station}-${layout}`,
      type: "article",
      title: `${ward} ${station} ${labels.title}`,
      subtitle: `${layout} / ${size}m² / ${yen(result.monthlyTotal)} / ${result.priceLabel}`,
    });
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

        <div className="mb-3 grid grid-cols-2 rounded-xl bg-white p-1 shadow-sm">
          <button className={`rounded-lg py-2 text-xs font-black ${tab === "quick" ? "bg-emerald-700 text-white" : "text-stone-500"}`} onClick={() => setTab("quick")} type="button">
            {labels.quick}
          </button>
          <button className={`rounded-lg py-2 text-xs font-black ${tab === "detail" ? "bg-emerald-700 text-white" : "text-stone-500"}`} onClick={() => setTab("detail")} type="button">
            {labels.detail}
          </button>
        </div>

        <section className="grid gap-3">
          <div className="grid gap-3">
            <FormPanel title={labels.location}>
              <div className="grid grid-cols-1 gap-2 min-[390px]:grid-cols-3">
                <label className="block">
                  <span className="mb-1 block text-[11px] font-bold text-slate-600">{labels.ward}</span>
                  <select
                    className="h-9 w-full rounded-xl border border-stone-200 bg-[#f3f1eb] px-2.5 text-[13px] font-bold outline-none"
                    onChange={(event) => {
                      const nextWard = event.target.value;
                      const nextReference = areaReferences.find((item) => item.ward === nextWard) ?? areaReferences[0];
                      setWard(nextWard);
                      setStation(nextReference.stations[0]);
                    }}
                    value={ward}
                  >
                    {areaReferences.map((item) => (
                      <option key={item.ward} value={item.ward}>
                        {localText(item.ward, language)}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="mb-1 block text-[11px] font-bold text-slate-600">{labels.station}</span>
                  <select className="h-9 w-full rounded-xl border border-stone-200 bg-[#f3f1eb] px-2.5 text-[13px] font-bold outline-none" onChange={(event) => setStation(event.target.value)} value={station}>
                    {selectedReference.stations.map((item) => (
                      <option key={item} value={item}>
                        {localizedStations[selectedReference.stations.indexOf(item)] ?? localText(item, language)}
                      </option>
                    ))}
                  </select>
                </label>
                <InputField label={labels.walkMinutes} onChange={setWalkMinutes} value={walkMinutes} />
              </div>
            </FormPanel>

            <FormPanel title={labels.housing}>
              <div className="grid grid-cols-1 gap-2 min-[360px]:grid-cols-2">
                <InputField label={labels.monthlyRent} onChange={(value) => {
                  const total = numberValue(value);
                  const mgmt = numberValue(managementFee);
                  setRent(String(Math.max(total - mgmt, 0)));
                }} value={String(numberValue(rent) + numberValue(managementFee))} />
                <InputField label={labels.size} onChange={setSize} value={size} suffix="m²" />
                <label className="block">
                  <span className="mb-1 block text-[11px] font-bold text-slate-600">{labels.layout}</span>
                  <select className="h-9 w-full rounded-xl border border-stone-200 bg-[#f3f1eb] px-2.5 text-[13px] font-bold outline-none" onChange={(event) => setLayout(event.target.value as Layout)} value={layout}>
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

            <FormPanel title={labels.initialCost}>
              <div className="grid grid-cols-1 gap-2 min-[390px]:grid-cols-3">
                <InputField label={labels.keyMoney} onChange={setKeyMoneyMonths} value={keyMoneyMonths} suffix={language === "ja" ? "か月" : language === "zh-TW" ? "個月" : "个月"} />
                <InputField label={labels.deposit} onChange={setDepositMonths} value={depositMonths} suffix={language === "ja" ? "か月" : language === "zh-TW" ? "個月" : "个月"} />
                <InputField label={labels.broker} onChange={setBrokerMonths} value={brokerMonths} suffix={language === "ja" ? "か月" : language === "zh-TW" ? "個月" : "个月"} />
                <InputField label={labels.fireInsurance} onChange={setFireInsurance} value={fireInsurance} />
                <InputField label={labels.guarantee} onChange={setGuaranteeFee} value={guaranteeFee} />
                <InputField label={labels.cleaning} onChange={setCleaningFee} value={cleaningFee} />
              </div>
              {tab === "detail" && (
                <div className="mt-2 grid grid-cols-1 gap-2 border-t border-stone-100 pt-2 min-[360px]:grid-cols-2">
                  <InputField label={labels.rentBase} onChange={setRent} value={rent} />
                  <InputField label={labels.management} onChange={setManagementFee} value={managementFee} />
                  <InputField label={labels.age} onChange={setAge} value={age} />
                  <InputField label={labels.lock} onChange={setLockFee} value={lockFee} />
                </div>
              )}
            </FormPanel>
          </div>

          <section className="rounded-[22px] border border-stone-200/80 bg-white p-4 shadow-[0_10px_28px_rgba(32,38,34,0.07)]">
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
              {labels.sourcePrefix}: {selectedReference.source}。{t.common.referenceOnly}
            </p>
          </section>
        </section>

        <div className="fixed inset-x-0 bottom-0 z-20 mx-auto flex max-w-[430px] gap-2 border-t border-stone-200 bg-white/95 px-4 py-3 backdrop-blur">
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
