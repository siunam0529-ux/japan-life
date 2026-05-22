"use client";

import { ArrowRightLeft, Banknote, Clock3, Coins } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { BackButton } from "@/components/BackButton";
import { DataNotice } from "@/components/DataNotice";
import { useLanguage } from "@/hooks/useLanguage";
import { useUserSettings } from "@/hooks/useUserSettings";
import { buildRateMatrix, fetchExchangeRates, getMockExchangeRates, type ExchangeCurrency, type ExchangeRateItem } from "@/lib/api/exchange";
import { formatCurrency } from "@/lib/formatCurrency";

const currencies: ExchangeCurrency[] = ["JPY", "CNY", "HKD", "TWD", "USD"];

function numberValue(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export default function ExchangePage() {
  const { language, t } = useLanguage();
  const labels = {
    "zh-CN": {
      amount: "金额",
      source: "Japan Life 本地备用汇率",
      subtitle: "优先使用 Frankfurter 实时汇率。API 失败或缺少 TWD 时自动使用本地备用数据。",
      title: "汇率换算",
      todayRate: "今日汇率",
    },
    "zh-TW": {
      amount: "金額",
      source: "Japan Life 本地備用匯率",
      subtitle: "優先使用 Frankfurter 即時匯率。API 失敗或缺少 TWD 時自動使用本地備用資料。",
      title: "匯率換算",
      todayRate: "今日匯率",
    },
    ja: {
      amount: "金額",
      source: "Japan Life 予備為替データ",
      subtitle: "Frankfurter の為替レートを優先します。API失敗時やTWD不足時はローカル予備データを使います。",
      title: "為替換算",
      todayRate: "今日の為替",
    },
  }[language];
  const { settings } = useUserSettings();
  const [amount, setAmount] = useState("10000");
  const [from, setFrom] = useState<ExchangeCurrency>("JPY");
  const [to, setTo] = useState<ExchangeCurrency>((settings?.defaultCurrency ?? settings?.currency ?? "CNY") as ExchangeCurrency);
  const [copied, setCopied] = useState(false);
  const [rateItems, setRateItems] = useState<ExchangeRateItem[]>(() => getMockExchangeRates().items);
  const [rateSource, setRateSource] = useState<"frankfurter" | "mock">("mock");
  const [updatedAt, setUpdatedAt] = useState("2026-05-21");
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
    <main className="min-h-screen bg-[#f5f0e7] text-stone-950">
      <div className="mx-auto min-h-screen max-w-[430px] bg-[#fbf8f2] px-4 py-5 shadow-2xl shadow-stone-300/40">
        <div className="mb-4 flex items-center justify-between">
          <BackButton />
          <span className="rounded-full bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-800">Japan Life</span>
        </div>

        <section className="grid gap-4">
          <div className="rounded-[24px] bg-emerald-800 p-5 text-white shadow-[0_16px_35px_rgba(20,108,92,0.22)]">
            <ArrowRightLeft className="mb-4 h-8 w-8" />
            <h1 className="text-2xl font-black">{labels.title}</h1>
            <p className="mt-2 text-xs font-bold leading-5 text-emerald-50">{labels.subtitle}</p>
          </div>

          <div className="rounded-[20px] border border-stone-200 bg-white p-3 shadow-sm">
            <div className="grid gap-2">
              <label>
                <span className="mb-1 block text-xs font-black text-stone-600">{labels.amount}</span>
                <span className="flex h-9 items-center rounded-xl border border-stone-200 bg-stone-50 px-2.5">
                  <input className="min-w-0 flex-1 bg-transparent text-sm font-black outline-none" inputMode="decimal" onChange={(event) => setAmount(event.target.value)} type="number" value={amount} />
                  <Coins className="h-4 w-4 text-stone-400" />
                </span>
              </label>
              <CurrencySelect label="From" value={from} onChange={setFrom} />
              <CurrencySelect label="To" value={effectiveTo} onChange={setTo} />
              <button className="h-9 rounded-xl bg-emerald-50 px-3 text-emerald-800" onClick={() => { setFrom(effectiveTo); setTo(from); }} type="button">
                <ArrowRightLeft className="h-4 w-4" />
              </button>
            </div>
          </div>
        </section>

        <section className="mt-4 grid gap-4">
          <div className="rounded-[22px] border border-stone-200 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-black text-stone-500">{amount || 0} {from}</p>
                <p className="mt-1 text-3xl font-black text-emerald-800">{formatCurrency(result.converted, effectiveTo)}</p>
                <p className="mt-2 text-xs font-bold text-stone-500">1 {from} = {result.rate.toFixed(6)} {effectiveTo}</p>
              </div>
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800">
                <Banknote className="h-5 w-5" />
              </span>
            </div>
            <button className="mt-3 rounded-xl bg-emerald-800 px-3 py-2 text-xs font-black text-white" onClick={async () => {
              await navigator.clipboard.writeText(`${amount || 0} ${from} = ${formatCurrency(result.converted, effectiveTo)}`);
              setCopied(true);
            }} type="button">
              {copied ? t.common.copied : t.common.copy}
            </button>
          </div>

          <div className="rounded-[22px] border border-stone-200 bg-white p-4 shadow-sm">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-base font-black">{labels.todayRate}</h2>
              <span className="flex items-center gap-1 text-xs font-black text-stone-500"><Clock3 className="h-3.5 w-3.5" />{updatedAt}</span>
            </div>
            {rateItems.filter((item) => item.code !== "JPY").map((item) => (
              <div className="flex items-center justify-between border-b border-stone-100 py-2 last:border-0" key={item.code}>
                <span className="text-xs font-black text-stone-500">{item.pair}</span>
                <span className="text-sm font-black text-emerald-800">{item.value.toFixed(item.value < 0.01 ? 4 : 3)}</span>
              </div>
            ))}
            <p className="mt-3 text-xs font-bold text-stone-500">
              {rateSource === "frankfurter" ? "Frankfurter API" : t.common.fallbackData}
              {fallbackReason ? ` · ${fallbackReason}` : ""}
              <br />
              {t.common.referenceOnly}
            </p>
          </div>
        </section>
        <DataNotice source={rateSource === "frankfurter" ? "Frankfurter API" : labels.source} sourceZhTW={rateSource === "frankfurter" ? "Frankfurter API" : "Japan Life 本地備用匯率"} updatedAt={updatedAt} />
      </div>
    </main>
  );
}

function CurrencySelect({ label, onChange, value }: { label: string; onChange: (value: ExchangeCurrency) => void; value: ExchangeCurrency }) {
  return (
    <label>
      <span className="mb-1 block text-xs font-black text-stone-600">{label}</span>
      <select className="h-9 w-full rounded-xl border border-stone-200 bg-stone-50 px-2.5 text-xs font-black outline-none" onChange={(event) => onChange(event.target.value as ExchangeCurrency)} value={value}>
        {currencies.map((currency) => <option key={currency} value={currency}>{currency}</option>)}
      </select>
    </label>
  );
}
