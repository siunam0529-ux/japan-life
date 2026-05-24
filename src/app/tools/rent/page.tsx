"use client";

import { Bookmark, Home } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { BackButton } from "@/components/BackButton";
import { tokyoStationRent2025, tokyoWards2025, type LayoutType } from "@/data/tokyoStationRent2025";
import { useFavorites } from "@/hooks/useFavorites";
import { useLanguage } from "@/hooks/useLanguage";
import { formatCurrency } from "@/lib/formatCurrency";
import { estimateRentByStation, rentEstimateDisclaimer } from "@/lib/rentEstimate";

const layouts: LayoutType[] = ["1R", "1K", "1DK", "1LDK", "2K", "2DK", "2LDK", "3LDK"];
const rentFormStorageKey = "japan-life:rent-form";
const defaultRentForm = {
  age: "55",
  brokerMonths: "1",
  cleaningFee: "40000",
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
  const [tab, setTab] = useState<"quick" | "detail">(defaultRentForm.tab);
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
  const [saved, setSaved] = useState(false);

  const applyFormState = (form: RentFormState) => {
    setAge(form.age);
    setBrokerMonths(form.brokerMonths);
    setCleaningFee(form.cleaningFee);
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
    setTab(form.tab);
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
      tab,
      walkMinutes,
      ward,
    }),
    [age, brokerMonths, cleaningFee, depositMonths, fireInsurance, floor, guaranteeFee, keyMoneyMonths, layout, lockFee, managementFee, rent, size, station, tab, walkMinutes, ward],
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

        <section className="jl-info-card mb-4 rounded-[28px] p-5">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/85 text-[#2563EB] shadow-sm">
              <Home className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <h2 className="text-[22px] font-black leading-tight tracking-tight text-slate-950">{labels.title}</h2>
              <p className="mt-1 text-xs font-bold leading-5 text-slate-500">{labels.subtitle}</p>
            </div>
          </div>
        </section>

        <div className="mb-3 grid grid-cols-2 rounded-xl bg-white p-1 shadow-sm">
          <button className={`selection-chip rounded-lg py-2 text-xs font-black ${tab === "quick" ? "is-selected" : ""}`} onClick={() => setTab("quick")} type="button">
            {labels.quick}
          </button>
          <button className={`selection-chip rounded-lg py-2 text-xs font-black ${tab === "detail" ? "is-selected" : ""}`} onClick={() => setTab("detail")} type="button">
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
                  <select className="h-9 w-full rounded-xl border border-stone-200 bg-[#f3f1eb] px-2.5 text-[13px] font-bold outline-none" onChange={(event) => setStation(event.target.value)} value={station}>
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
                <InputField label={labels.monthlyRent} onChange={(value) => {
                  const total = numberValue(value);
                  const mgmt = numberValue(managementFee);
                  setRent(String(Math.max(total - mgmt, 0)));
                }} value={String(numberValue(rent) + numberValue(managementFee))} />
                <InputField label={labels.size} onChange={setSize} value={size} suffix="m²" />
                <label className="block">
                  <span className="mb-1 block text-[11px] font-bold text-slate-600">{labels.layout}</span>
                  <select className="h-9 w-full rounded-xl border border-stone-200 bg-[#f3f1eb] px-2.5 text-[13px] font-bold outline-none" onChange={(event) => setLayout(event.target.value as LayoutType)} value={layout}>
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
              {labels.sourcePrefix}: {result.stationData ? `${result.stationData.ward} / ${result.stationData.station} / base1K ${yen(result.stationData.base1K)}` : "2025-2026 东京热门车站参考"}。{t.common.referenceOnly}
            </p>
            <p className="mt-2 rounded-2xl bg-amber-50 p-3 text-[11px] font-bold leading-5 text-amber-800">{rentEstimateDisclaimer}</p>
          </section>
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
