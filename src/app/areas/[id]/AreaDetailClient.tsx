"use client";

import { MapPin } from "lucide-react";
import { AreaBackButton } from "@/components/AreaBackButton";
import type { AreaItem } from "@/data/areas";
import { useLanguage } from "@/hooks/useLanguage";
import { formatCurrency } from "@/lib/formatCurrency";

const areaDetailCopy = {
  "zh-CN": {
    metrics: {
      rent: "平均房租",
      wage: "平均时薪",
      transport: "交通",
      foreigner: "外国人友好",
      convenience: "生活便利",
      safety: "安全度",
    },
    recommended: "适合人群",
    pros: "优点",
    cons: "注意点",
    note: "本页地区数据为 Japan Life 静态参考数据，仅供生活参考，不作为正式租房、签约或行政判断依据。实际房租、交通和生活感受会因房源、车站、时间和个人条件不同而变化。",
  },
  "zh-TW": {
    metrics: {
      rent: "平均房租",
      wage: "平均時薪",
      transport: "交通",
      foreigner: "外國人友好",
      convenience: "生活便利",
      safety: "安全度",
    },
    recommended: "適合人群",
    pros: "優點",
    cons: "注意點",
    note: "本頁地區資料為 Japan Life 靜態參考資料，僅供生活參考，不作為正式租屋、簽約或行政判斷依據。實際房租、交通和生活感受會因房源、車站、時間和個人條件不同而變化。",
  },
  ja: {
    metrics: {
      rent: "平均家賃",
      wage: "平均時給",
      transport: "交通",
      foreigner: "外国人向け",
      convenience: "生活利便性",
      safety: "安全度",
    },
    recommended: "おすすめの人",
    pros: "良い点",
    cons: "注意点",
    note: "このページのエリアデータは Japan Life の静的参考データです。暮らしの参考用であり、賃貸契約、契約判断、行政判断の根拠ではありません。実際の家賃、交通、住み心地は物件、駅、時期、個人条件によって変わります。",
  },
} as const;

function areaName(area: AreaItem, language: keyof typeof areaDetailCopy) {
  if (language === "zh-TW") return area.nameZhTW;
  if (language === "ja") return area.nameJa;
  return area.nameZhCN;
}

function recommendedFor(area: AreaItem, language: keyof typeof areaDetailCopy) {
  if (language === "zh-TW") return area.recommendedForZhTW;
  if (language === "ja") return area.recommendedForJa;
  return area.recommendedForZhCN;
}

function pros(area: AreaItem, language: keyof typeof areaDetailCopy) {
  if (language === "zh-TW") return area.prosZhTW;
  if (language === "ja") return area.prosJa;
  return area.prosZhCN;
}

function cons(area: AreaItem, language: keyof typeof areaDetailCopy) {
  if (language === "zh-TW") return area.consZhTW;
  if (language === "ja") return area.consJa;
  return area.consZhCN;
}

export function AreaDetailClient({ area }: { area: AreaItem }) {
  const { language } = useLanguage();
  const text = areaDetailCopy[language];

  return (
    <main className="jl-tool-theme min-h-screen text-stone-950">
      <div className="jl-tool-shell mx-auto min-h-screen max-w-[430px] px-4 py-5">
        <div className="mb-4 flex items-center justify-between">
          <AreaBackButton />
          <span className="rounded-full bg-emerald-50 px-4 py-2 text-xs font-black text-emerald-800">Japan Life</span>
        </div>
        <section className="rounded-[28px] bg-emerald-800 p-5 text-white shadow-[0_18px_45px_rgba(20,108,92,0.22)]">
          <MapPin className="h-9 w-9" />
          <h1 className="mt-4 text-2xl font-black">{areaName(area, language)} / {area.nameJa}</h1>
          <p className="mt-2 text-sm font-semibold leading-6 text-emerald-50">{area.nameEn}</p>
        </section>
        <section className="mt-4 grid grid-cols-2 gap-2.5">
          <Metric label={text.metrics.rent} value={formatCurrency(area.averageRent, "JPY")} />
          <Metric label={text.metrics.wage} value={formatCurrency(area.averageWage, "JPY")} />
          <Metric label={text.metrics.transport} value={`${area.transportScore}/100`} />
          <Metric label={text.metrics.foreigner} value={`${area.foreignerFriendlyScore}/100`} />
          <Metric label={text.metrics.convenience} value={`${area.livingConvenienceScore}/100`} />
          <Metric label={text.metrics.safety} value={`${area.safetyScore}/100`} />
        </section>
        <section className="mt-4 rounded-[24px] border border-stone-200 bg-white p-4 shadow-sm">
          <h2 className="text-lg font-black">{text.recommended}</h2>
          <p className="mt-2 text-sm font-bold leading-6 text-stone-600">{recommendedFor(area, language)}</p>
          <h2 className="mt-4 text-lg font-black">{text.pros}</h2>
          {pros(area, language).map((item) => <p className="mt-1 text-sm font-bold text-stone-600" key={item}>- {item}</p>)}
          <h2 className="mt-4 text-lg font-black">{text.cons}</h2>
          {cons(area, language).map((item) => <p className="mt-1 text-sm font-bold text-stone-600" key={item}>- {item}</p>)}
        </section>
        <p className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-bold leading-5 text-amber-900">
          {text.note}
        </p>
      </div>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-[20px] bg-white p-4 shadow-sm"><p className="text-xs font-black text-stone-500">{label}</p><p className="mt-1 text-lg font-black">{value}</p></div>;
}
