"use client";

import { ArrowRightLeft, Banknote, Clock3, Coins, RefreshCw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { BackButton } from "@/components/BackButton";
import { DataNotice } from "@/components/DataNotice";
import { useLanguage } from "@/hooks/useLanguage";
import { useUserSettings } from "@/hooks/useUserSettings";
import { buildRateMatrix, fetchExchangeRates, getMockExchangeRates, type ExchangeCurrency, type ExchangeRateItem } from "@/lib/api/exchange";
import { formatCurrency } from "@/lib/formatCurrency";

const currencies: ExchangeCurrency[] = ["JPY", "CNY", "HKD", "TWD", "USD"];

const copy = {
  "zh-CN": {
    amount: "金额",
    source: "Japan Life 本地备用汇率",
    subtitle: "优先使用 Frankfurter 汇率。市场休市或部分币种延迟时，数据日期可能停留在最近交易日。",
    title: "汇率换算",
    todayRate: "今日汇率",
  },
  "zh-TW": {
    amount: "金額",
    source: "Japan Life 本地備用匯率",
    subtitle: "優先使用 Frankfurter 匯率。市場休市或部分幣種延遲時，資料日期可能停留在最近交易日。",
    title: "匯率換算",
    todayRate: "今日匯率",
  },
  ja: {
    amount: "金額",
    source: "Japan Life 予備為替データ",
    subtitle: "Frankfurter の為替データを優先します。市場休場や一部通貨の遅延により、データ日付が直近の取引日に留まる場合があります。",
    title: "為替換算",
    todayRate: "今日の為替",
  },
} as const;

function numberValue(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export default function ExchangePage() {
  const { language, t } = useLanguage();
  const labels = copy[language];
  const { settings } = useUserSettings();
  const [amount, setAmount] = useState("10000");
  const [from, setFrom] = useState<ExchangeCurrency>("JPY");
  const [to, setTo] = useState<ExchangeCurrency>((settings?.defaultCurrency ?? settings?.currency ?? "CNY") as ExchangeCurrency);
  const [copied, setCopied] = useState(false);
  const [rateItems, setRateItems] = useState<ExchangeRateItem[]>(() => getMockExchangeRates().items);
  const [rateSource, setRateSource] = useState<"frankfurter" | "mock">("mock");
  const [updatedAt, setUpdatedAt] = useState("2026-05-22");
  const [fallbackReason, setFallbackReason] = useState<string | undefined>();
  const effectiveTo = to === "CNY" && settings?.defaultCurrency && settings.defaultCurrency !== "JPY"
    ? settings.defaultCurrency as ExchangeCurrency
    : to;

  useEffect(() => {
    let active = true;
    fetchExchangeRates().then((result) => {
      if (!active) return;
      setRateItems(result.items);
      setRateSource(result.source);
      setUpdatedAt(result.updatedAt);
      setFallbackReason(result.fallbackReason);
    });

    return () => {
      active = false;
    };
  }, []);

  const rateMatrix = useMemo(() => buildRateMatrix(rateItems), [rateItems]);

  const result = useMemo(() => {
    const rate = rateMatrix[from]?.[effectiveTo] ?? 0;
    return { rate, converted: numberValue(amount) * rate };
  }, [amount, effectiveTo, from, rateMatrix]);

  return (
    <main className="min-h-screen bg-[#F6FAFF] text-[#0F172A]">
      <div className="mx-auto min-h-screen max-w-[430px] bg-[radial-gradient(circle_at_top,#DFF1FF_0%,#F6FAFF_42%,#FFFFFF_100%)] px-4 py-5">
        <div className="mb-4 flex items-center justify-between">
          <BackButton />
          <span className="rounded-full bg-white/75 px-3 py-2 text-xs font-black text-[#2563EB] shadow-sm backdrop-blur-xl">Japan Life</span>
        </div>

        <section className="grid gap-4">
          <div className="jl-info-card rounded-[28px] p-5">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/85 text-[#2563EB] shadow-sm">
                <RefreshCw className="h-5 w-5" />
              </span>
              <h1 className="text-2xl font-black">{labels.title}</h1>
            </div>
            <p className="mt-2 text-xs font-bold leading-5 text-[#64748B]">{labels.subtitle}</p>
          </div>

          <div className="rounded-[22px] border border-white/60 bg-white/75 p-3 shadow-sm backdrop-blur-xl">
            <div className="grid gap-2">
              <label>
                <span className="mb-1 block text-xs font-black text-[#64748B]">{labels.amount}</span>
                <span className="flex h-9 items-center rounded-xl border border-blue-100 bg-sky-50/70 px-2.5">
                  <input className="min-w-0 flex-1 bg-transparent text-sm font-black outline-none" inputMode="decimal" onChange={(event) => setAmount(event.target.value)} type="number" value={amount} />
                  <Coins className="h-4 w-4 text-[#64748B]" />
                </span>
              </label>
              <CurrencySelect label="From" value={from} onChange={setFrom} />
              <CurrencySelect label="To" value={effectiveTo} onChange={setTo} />
              <button className="h-9 rounded-xl bg-blue-50 px-3 text-[#2563EB]" onClick={() => { setFrom(effectiveTo); setTo(from); }} type="button">
                <ArrowRightLeft className="h-4 w-4" />
              </button>
            </div>
          </div>
        </section>

        <section className="mt-4 grid gap-4">
          <div className="rounded-[22px] border border-white/60 bg-white/75 p-4 shadow-sm backdrop-blur-xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-black text-[#64748B]">{amount || 0} {from}</p>
                <p className="mt-1 text-3xl font-black text-[#2563EB]">{formatCurrency(result.converted, effectiveTo)}</p>
                <p className="mt-2 text-xs font-bold text-[#64748B]">1 {from} = {result.rate.toFixed(6)} {effectiveTo}</p>
              </div>
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-[#2563EB]">
                <Banknote className="h-5 w-5" />
              </span>
            </div>
            <button className="mt-3 rounded-xl bg-[#2563EB] px-3 py-2 text-xs font-black text-white" onClick={async () => {
              await navigator.clipboard.writeText(`${amount || 0} ${from} = ${formatCurrency(result.converted, effectiveTo)}`);
              setCopied(true);
            }} type="button">
              {copied ? t.common.copied : t.common.copy}
            </button>
          </div>

          <div className="rounded-[22px] border border-white/60 bg-white/75 p-4 shadow-sm backdrop-blur-xl">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-base font-black">{labels.todayRate}</h2>
              <span className="flex items-center gap-1 text-xs font-black text-[#64748B]"><Clock3 className="h-3.5 w-3.5" />{updatedAt}</span>
            </div>
            {rateItems.filter((item) => item.code !== "JPY").map((item) => (
              <div className="flex items-center justify-between border-b border-slate-100 py-2 last:border-0" key={item.code}>
                <span className="text-xs font-black text-[#64748B]">{item.pair}</span>
                <span className="text-sm font-black text-[#2563EB]">{item.value.toFixed(item.value < 0.01 ? 4 : 3)}</span>
              </div>
            ))}
            <p className="mt-3 text-xs font-bold text-[#64748B]">
              {rateSource === "frankfurter" ? "Frankfurter API" : t.common.fallbackData}
              {fallbackReason ? ` / ${fallbackReason}` : ""}
            </p>
          </div>
        </section>

        <DataNotice
          source={rateSource === "frankfurter" ? "Frankfurter API" : labels.source}
          sourceZhTW={rateSource === "frankfurter" ? "Frankfurter API" : "Japan Life 本地備用匯率"}
          sourceJa={rateSource === "frankfurter" ? "Frankfurter API" : "Japan Life 予備為替データ"}
          updatedAt={updatedAt}
          note="这里显示的是汇率数据日期，不一定等于 App 打开时间。周末、节假日或部分币种延迟时，可能停留在最近交易日；换汇、汇款或付款前请以银行、支付服务或官方页面为准。"
          noteZhTW="這裡顯示的是匯率資料日期，不一定等於 App 開啟時間。週末、假日或部分幣種延遲時，可能停留在最近交易日；換匯、匯款或付款前請以銀行、支付服務或官方頁面為準。"
          noteJa="ここに表示されるのは為替データの日付で、アプリを開いた時刻とは限りません。週末・祝日・一部通貨の遅延により直近の取引日に留まる場合があります。両替、送金、支払い前には銀行・決済サービス・公式ページをご確認ください。"
        />
      </div>
    </main>
  );
}

function CurrencySelect({ label, onChange, value }: { label: string; onChange: (value: ExchangeCurrency) => void; value: ExchangeCurrency }) {
  return (
    <label>
      <span className="mb-1 block text-xs font-black text-[#64748B]">{label}</span>
      <select className="h-9 w-full rounded-xl border border-blue-100 bg-sky-50/70 px-2.5 text-xs font-black outline-none" onChange={(event) => onChange(event.target.value as ExchangeCurrency)} value={value}>
        {currencies.map((currency) => <option key={currency} value={currency}>{currency}</option>)}
      </select>
    </label>
  );
}
