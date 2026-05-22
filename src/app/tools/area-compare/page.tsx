"use client";

import { CheckCircle2, Copy, Home, MapPin, WalletCards } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { BackButton } from "@/components/BackButton";
import { areaItems, type AreaItem } from "@/data/areas";
import { useLanguage } from "@/hooks/useLanguage";
import { formatCurrency } from "@/lib/formatCurrency";

const copy = {
  "zh-CN": {
    title: "地区对比",
    subtitle: "比较房租、时薪、交通和生活便利度",
    areaA: "地区 A",
    areaB: "地区 B",
    same: "请选择两个不同地区",
    recommend: (name: string) => `综合来看，${name} 更适合你。`,
    rent: "房租对比",
    wage: "时薪对比",
    monthlyDiff: "每月差额",
    yearlyDiff: "一年差额",
    wagePressure: "时薪较高，但房租压力也可能更大。",
    scores: "评分对比",
    scoreLabels: {
      transport: "交通便利度",
      foreignerFriendly: "外国人友好度",
      livingConvenience: "生活便利度",
      safety: "安全度",
      chineseResource: "中文资源",
    },
    recommendedFor: "适合人群",
    prosCons: "优缺点对比",
    pros: "优点",
    cons: "缺点",
    detail: "查看地区详情",
    rentTool: "用房租评估",
    places: "查看附近店铺",
    copyResult: "复制对比结果",
    copied: "已复制对比结果",
    note: "数据仅供参考，实际房租和生活感受会因房源、车站距离和个人情况而不同。",
  },
  "zh-TW": {
    title: "地區比較",
    subtitle: "比較房租、時薪、交通和生活便利度",
    areaA: "地區 A",
    areaB: "地區 B",
    same: "請選擇兩個不同地區",
    recommend: (name: string) => `綜合來看，${name} 更適合你。`,
    rent: "房租比較",
    wage: "時薪比較",
    monthlyDiff: "每月差額",
    yearlyDiff: "一年差額",
    wagePressure: "時薪較高，但房租壓力也可能更大。",
    scores: "評分比較",
    scoreLabels: {
      transport: "交通便利度",
      foreignerFriendly: "外國人友好度",
      livingConvenience: "生活便利度",
      safety: "安全度",
      chineseResource: "中文資源",
    },
    recommendedFor: "適合人群",
    prosCons: "優缺點比較",
    pros: "優點",
    cons: "缺點",
    detail: "查看地區詳情",
    rentTool: "用房租評估",
    places: "查看附近店鋪",
    copyResult: "複製比較結果",
    copied: "已複製比較結果",
    note: "資料僅供參考，實際房租和生活感受會因房源、車站距離和個人情況而不同。",
  },
  ja: {
    title: "エリア比較",
    subtitle: "家賃、時給、交通、生活の便利さを比較",
    areaA: "エリア A",
    areaB: "エリア B",
    same: "別々のエリアを選んでください",
    recommend: (name: string) => `総合的には、${name} のほうがおすすめです。`,
    rent: "家賃比較",
    wage: "時給比較",
    monthlyDiff: "毎月の差額",
    yearlyDiff: "年間の差額",
    wagePressure: "時給は高めですが、家賃の負担も大きくなる可能性があります。",
    scores: "スコア比較",
    scoreLabels: {
      transport: "交通の便利さ",
      foreignerFriendly: "外国人向けの暮らしやすさ",
      livingConvenience: "生活の便利さ",
      safety: "治安",
      chineseResource: "中国語リソース",
    },
    recommendedFor: "おすすめの人",
    prosCons: "メリット・注意点",
    pros: "メリット",
    cons: "注意点",
    detail: "エリア詳細",
    rentTool: "家賃チェック",
    places: "近くのお店",
    copyResult: "比較結果をコピー",
    copied: "比較結果をコピーしました",
    note: "情報は参考用です。実際の家賃や住みやすさは物件、駅からの距離、個人の状況によって変わります。",
  },
} as const;

function areaName(area: AreaItem, language: keyof typeof copy) {
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
    rentScore(area.averageRent) * 0.1
  );
}

export default function AreaComparePage() {
  const { language } = useLanguage();
  const text = copy[language];
  const [leftId, setLeftId] = useState("toshima-ikebukuro");
  const [rightId, setRightId] = useState("takadanobaba");
  const [copied, setCopied] = useState(false);

  const left = useMemo(() => areaItems.find((area) => area.id === leftId) ?? areaItems[0], [leftId]);
  const right = useMemo(() => areaItems.find((area) => area.id === rightId) ?? areaItems[1], [rightId]);
  const sameArea = left.id === right.id;
  const leftScore = totalScore(left);
  const rightScore = totalScore(right);
  const winner = leftScore >= rightScore ? left : right;
  const rentDiff = Math.abs(left.averageRent - right.averageRent);
  const wageDiff = Math.abs(left.averageWage - right.averageWage);
  const higherWage = left.averageWage >= right.averageWage ? left : right;
  const higherWageRentAlsoHigher = higherWage.averageRent > (higherWage.id === left.id ? right.averageRent : left.averageRent);

  const resultText = `${areaName(left, language)} vs ${areaName(right, language)}
平均房租：${formatCurrency(left.averageRent, "JPY")} vs ${formatCurrency(right.averageRent, "JPY")}
每月差额：${formatCurrency(rentDiff, "JPY")}
综合推荐：${areaName(winner, language)}`;

  const copyResult = async () => {
    try {
      await navigator.clipboard.writeText(resultText);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f5f0e7] text-stone-950">
      <div className="mx-auto min-h-screen max-w-[430px] bg-[#fbf8f2] px-4 py-5 shadow-2xl shadow-stone-300/40">
        <div className="mb-4 flex items-center justify-between">
          <BackButton variant="icon" />
          <span className="rounded-full bg-emerald-50 px-4 py-2 text-xs font-black text-emerald-800">Japan Life</span>
        </div>

        <section className="rounded-[28px] bg-emerald-800 p-5 text-white shadow-[0_18px_45px_rgba(20,108,92,0.22)]">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/85 text-[#2563EB] shadow-sm">
              <MapPin className="h-5 w-5" />
            </span>
            <h1 className="text-2xl font-black">{text.title} / エリア比較</h1>
          </div>
          <p className="mt-2 text-sm font-semibold leading-6 text-emerald-50">{text.subtitle}</p>
        </section>

        <section className="mt-4 grid grid-cols-2 gap-2.5 rounded-[22px] border border-stone-200 bg-white p-3 shadow-sm">
          <SelectArea label={text.areaA} value={leftId} onChange={setLeftId} language={language} />
          <SelectArea label={text.areaB} value={rightId} onChange={setRightId} language={language} />
          {sameArea && <p className="col-span-2 rounded-2xl bg-red-50 p-3 text-xs font-black text-red-700">{text.same}</p>}
        </section>

        {!sameArea && (
          <>
            <section className="mt-4 rounded-[24px] border border-emerald-100 bg-white p-4 shadow-sm">
              <p className="text-xs font-black text-emerald-700">Score</p>
              <h2 className="mt-1 text-xl font-black">{text.recommend(areaName(winner, language))}</h2>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <ScorePill name={areaName(left, language)} score={leftScore} />
                <ScorePill name={areaName(right, language)} score={rightScore} />
              </div>
            </section>

            <section className="mt-4 grid gap-3">
              <CompareCard title={text.rent} icon={Home}>
                <TwoValues left={formatCurrency(left.averageRent, "JPY")} right={formatCurrency(right.averageRent, "JPY")} />
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <MiniStat label={text.monthlyDiff} value={formatCurrency(rentDiff, "JPY")} />
                  <MiniStat label={text.yearlyDiff} value={formatCurrency(rentDiff * 12, "JPY")} />
                </div>
              </CompareCard>

              <CompareCard title={text.wage} icon={WalletCards}>
                <TwoValues left={formatCurrency(left.averageWage, "JPY")} right={formatCurrency(right.averageWage, "JPY")} />
                <MiniStat label={text.monthlyDiff} value={formatCurrency(wageDiff, "JPY")} />
                {higherWageRentAlsoHigher && <p className="mt-3 rounded-2xl bg-amber-50 p-3 text-xs font-black leading-5 text-amber-800">{text.wagePressure}</p>}
              </CompareCard>
            </section>

            <section className="mt-4 rounded-[24px] border border-stone-200 bg-white p-4 shadow-sm">
              <h2 className="text-lg font-black">{text.scores}</h2>
              {[
                [text.scoreLabels.transport, left.transportScore, right.transportScore],
                [text.scoreLabels.foreignerFriendly, left.foreignerFriendlyScore, right.foreignerFriendlyScore],
                [text.scoreLabels.livingConvenience, left.livingConvenienceScore, right.livingConvenienceScore],
                [text.scoreLabels.safety, left.safetyScore, right.safetyScore],
                [text.scoreLabels.chineseResource, left.chineseResourceScore, right.chineseResourceScore],
              ].map(([label, leftValue, rightValue]) => (
                <ScoreRow key={label as string} label={label as string} left={leftValue as number} right={rightValue as number} />
              ))}
            </section>

            <section className="mt-4 grid gap-3">
              <AreaSummary area={left} language={language} text={text} />
              <AreaSummary area={right} language={language} text={text} />
            </section>

            <section className="mt-4 grid grid-cols-2 gap-2.5">
              <Link className="rounded-2xl bg-white p-3 text-center text-xs font-black shadow-sm" href={`/areas/${winner.id}`}>{text.detail}</Link>
              <Link className="rounded-2xl bg-white p-3 text-center text-xs font-black shadow-sm" href="/tools/rent">{text.rentTool}</Link>
              <Link className="rounded-2xl bg-white p-3 text-center text-xs font-black shadow-sm" href={`/places?area=${winner.id}`}>{text.places}</Link>
              <button className="rounded-2xl bg-emerald-800 p-3 text-center text-xs font-black text-white shadow-sm" onClick={copyResult} type="button">
                <Copy className="mr-1 inline h-3.5 w-3.5" /> {text.copyResult}
              </button>
            </section>
            {copied && <p className="mt-3 rounded-2xl bg-emerald-50 p-3 text-center text-xs font-black text-emerald-800">{text.copied}</p>}
          </>
        )}

        <p className="mt-5 rounded-2xl bg-white p-3 text-xs font-bold leading-5 text-stone-500 shadow-sm">{text.note}</p>
      </div>
    </main>
  );
}

function SelectArea({ label, value, onChange, language }: { label: string; value: string; onChange: (value: string) => void; language: keyof typeof copy }) {
  return (
    <label className="min-w-0">
      <span className="text-[11px] font-black text-stone-500">{label}</span>
      <select className="mt-1 h-10 w-full rounded-2xl border border-stone-200 bg-stone-50 px-2 text-xs font-black outline-none" value={value} onChange={(event) => onChange(event.target.value)}>
        {areaItems.map((area) => <option key={area.id} value={area.id}>{areaName(area, language)}</option>)}
      </select>
    </label>
  );
}

function ScorePill({ name, score }: { name: string; score: number }) {
  return <div className="rounded-2xl bg-emerald-50 p-3"><p className="truncate text-xs font-black text-emerald-700">{name}</p><p className="text-2xl font-black text-emerald-900">{score}</p></div>;
}

function CompareCard({ title, icon: Icon, children }: { title: string; icon: typeof Home; children: ReactNode }) {
  return <section className="rounded-[24px] border border-stone-200 bg-white p-4 shadow-sm"><h2 className="mb-3 flex items-center gap-2 text-lg font-black"><Icon className="h-5 w-5 text-emerald-800" />{title}</h2>{children}</section>;
}

function TwoValues({ left, right }: { left: string; right: string }) {
  return <div className="grid grid-cols-2 gap-2"><MiniStat label="A" value={left} /><MiniStat label="B" value={right} /></div>;
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl bg-stone-50 p-3"><p className="text-[11px] font-black text-stone-500">{label}</p><p className="mt-1 text-base font-black">{value}</p></div>;
}

function ScoreRow({ label, left, right }: { label: string; left: number; right: number }) {
  return (
    <div className="mt-3">
      <div className="mb-1 flex justify-between text-xs font-black text-stone-500"><span>{label}</span><span>{left} / {right}</span></div>
      <div className="grid grid-cols-2 gap-2">
        <Bar value={left} />
        <Bar value={right} />
      </div>
    </div>
  );
}

function Bar({ value }: { value: number }) {
  return <div className="h-2 rounded-full bg-stone-100"><div className="h-full rounded-full bg-emerald-700" style={{ width: `${value}%` }} /></div>;
}

function AreaSummary({ area, language, text }: { area: AreaItem; language: keyof typeof copy; text: typeof copy[keyof typeof copy] }) {
  const pros = language === "ja" ? area.prosJa : language === "zh-TW" ? area.prosZhTW : area.prosZhCN;
  const cons = language === "ja" ? area.consJa : language === "zh-TW" ? area.consZhTW : area.consZhCN;
  const recommended = language === "ja" ? area.recommendedForJa : language === "zh-TW" ? area.recommendedForZhTW : area.recommendedForZhCN;
  return (
    <section className="rounded-[24px] border border-stone-200 bg-white p-4 shadow-sm">
      <h2 className="text-lg font-black">{areaName(area, language)}</h2>
      <p className="mt-1 text-xs font-bold text-stone-500">{area.nameEn}</p>
      <p className="mt-3 rounded-2xl bg-emerald-50 p-3 text-xs font-black leading-5 text-emerald-800">{text.recommendedFor}: {recommended}</p>
      <div className="mt-3 grid gap-2">
        <ListBlock title={text.pros} items={pros} positive />
        <ListBlock title={text.cons} items={cons} />
      </div>
    </section>
  );
}

function ListBlock({ title, items, positive = false }: { title: string; items: string[]; positive?: boolean }) {
  return <div><p className={`text-xs font-black ${positive ? "text-emerald-700" : "text-amber-700"}`}>{title}</p>{items.map((item) => <p className="mt-1 flex items-center gap-1 text-xs font-bold text-stone-600" key={item}><CheckCircle2 className="h-3.5 w-3.5 text-emerald-700" />{item}</p>)}</div>;
}
