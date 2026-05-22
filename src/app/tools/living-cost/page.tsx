"use client";

import { AlertTriangle, CheckCircle2, Home, PiggyBank, ReceiptText, ShieldCheck, Utensils, WalletCards } from "lucide-react";
import { useMemo, useState } from "react";
import { BackButton } from "@/components/BackButton";
import { useLanguage } from "@/hooks/useLanguage";
import type { Language } from "@/lib/i18n/translations";
import { formatCurrency } from "@/lib/formatCurrency";

const fieldDefs = [
  { key: "income", icon: WalletCards, primary: true },
  { key: "rent", icon: Home, primary: true },
  { key: "food", icon: Utensils, primary: true },
  { key: "transit", icon: ReceiptText, primary: true },
  { key: "phone", icon: ReceiptText },
  { key: "utilities", icon: ReceiptText },
  { key: "insurance", icon: ShieldCheck },
  { key: "other", icon: PiggyBank },
] as const;

type CostKey = (typeof fieldDefs)[number]["key"];
type CostState = Record<CostKey, string>;

const initialCosts: CostState = {
  income: "246500",
  rent: "88000",
  food: "45000",
  transit: "12000",
  phone: "4000",
  utilities: "12000",
  insurance: "18000",
  other: "20000",
};

const copy = {
  "zh-CN": {
    title: "生活成本计算",
    desc: "把常用支出放在首屏，其他固定费用收进更多选项。",
    more: "更多选项",
    fields: { income: "月收入", rent: "房租", food: "食费", transit: "交通费", phone: "手机费", utilities: "水电煤", insurance: "保险/年金", other: "其他支出" },
    stats: { expenses: "总支出", remaining: "剩余", expenseRatio: "支出占比", income: "收入", bar: "支出占收入比例" },
    status: {
      deficit: ["赤字", "当月支出已超过收入，需要优先压缩非必要支出。"],
      healthy: ["健康", "剩余超过收入 30%，可以继续保持，并建立储蓄或应急金。"],
      normal: ["普通", "整体可控，建议继续跟踪食费、通信费和其他支出。"],
      danger: ["危险", "剩余低于收入 10%，预算缓冲较小，建议重新检查房租和固定支出。"],
    },
  },
  "zh-TW": {
    title: "生活成本計算",
    desc: "把常用支出放在首屏，其他固定費用收進更多選項。",
    more: "更多選項",
    fields: { income: "月收入", rent: "房租", food: "餐費", transit: "交通費", phone: "手機費", utilities: "水電瓦斯", insurance: "保險/年金", other: "其他支出" },
    stats: { expenses: "總支出", remaining: "剩餘", expenseRatio: "支出占比", income: "收入", bar: "支出占收入比例" },
    status: {
      deficit: ["赤字", "當月支出已超過收入，需要優先壓縮非必要支出。"],
      healthy: ["健康", "剩餘超過收入 30%，可以繼續保持，並建立儲蓄或緊急預備金。"],
      normal: ["普通", "整體可控，建議繼續追蹤餐費、通信費和其他支出。"],
      danger: ["危險", "剩餘低於收入 10%，預算緩衝較小，建議重新檢查房租和固定支出。"],
    },
  },
  ja: {
    title: "生活費計算",
    desc: "よく使う支出を先に表示し、固定費は詳細オプションにまとめます。",
    more: "詳細オプション",
    fields: { income: "月収", rent: "家賃", food: "食費", transit: "交通費", phone: "携帯料金", utilities: "光熱費", insurance: "保険/年金", other: "その他支出" },
    stats: { expenses: "支出合計", remaining: "残り", expenseRatio: "支出割合", income: "収入", bar: "収入に対する支出割合" },
    status: {
      deficit: ["赤字", "今月の支出が収入を超えています。不要な支出から見直しましょう。"],
      healthy: ["健康", "残りが収入の30%を超えています。このまま貯蓄や緊急資金を作れます。"],
      normal: ["普通", "全体は管理できています。食費、通信費、その他支出を続けて確認しましょう。"],
      danger: ["注意", "残りが収入の10%未満です。家賃と固定費をもう一度確認しましょう。"],
    },
  },
} as const;

const yen = (value: number) => formatCurrency(value, "JPY");
const toNumber = (value: string) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

function evaluate(remainingRatio: number, remaining: number, text: (typeof copy)[Language]) {
  if (remaining < 0) return { label: text.status.deficit[0], advice: text.status.deficit[1], className: "border-red-100 bg-red-50 text-red-700", bar: "bg-red-500", icon: AlertTriangle };
  if (remainingRatio > 30) return { label: text.status.healthy[0], advice: text.status.healthy[1], className: "border-emerald-100 bg-emerald-50 text-emerald-800", bar: "bg-emerald-700", icon: CheckCircle2 };
  if (remainingRatio >= 10) return { label: text.status.normal[0], advice: text.status.normal[1], className: "border-amber-100 bg-amber-50 text-amber-800", bar: "bg-amber-500", icon: CheckCircle2 };
  return { label: text.status.danger[0], advice: text.status.danger[1], className: "border-red-100 bg-red-50 text-red-700", bar: "bg-red-500", icon: AlertTriangle };
}

export default function LivingCostPage() {
  const { language } = useLanguage();
  const text = copy[language];
  const [costs, setCosts] = useState<CostState>(initialCosts);
  const result = useMemo(() => {
    const income = toNumber(costs.income);
    const expenses = fieldDefs.filter((field) => field.key !== "income").reduce((sum, field) => sum + toNumber(costs[field.key]), 0);
    const remaining = income - expenses;
    const expenseRatio = income > 0 ? (expenses / income) * 100 : 0;
    const remainingRatio = income > 0 ? (remaining / income) * 100 : 0;
    return { income, expenses, remaining, expenseRatio, remainingRatio, status: evaluate(remainingRatio, remaining, text) };
  }, [costs, text]);

  const StatusIcon = result.status.icon;

  return (
    <main className="min-h-screen bg-[#f5f0e7] text-stone-950">
      <div className="mx-auto min-h-screen max-w-[430px] bg-[#fbf8f2] px-4 py-5 shadow-2xl shadow-stone-300/40">
        <div className="mb-4 flex items-center justify-between">
          <BackButton />
          <span className="rounded-full bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-800">Japan Life</span>
        </div>

        <section className="rounded-[24px] bg-emerald-800 p-5 text-white shadow-[0_16px_35px_rgba(20,108,92,0.22)]">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/85 text-[#2563EB] shadow-sm">
              <WalletCards className="h-5 w-5" />
            </span>
            <h1 className="text-2xl font-black">{text.title}</h1>
          </div>
          <p className="mt-2 text-xs font-bold leading-5 text-emerald-50">{text.desc}</p>
        </section>

        <section className="mt-4 grid gap-4">
          <div className="rounded-[20px] border border-stone-200 bg-white p-3 shadow-sm">
            <div className="grid gap-2">
              {fieldDefs.filter((field) => "primary" in field && field.primary).map((field) => <CostInput key={field.key} field={field} label={text.fields[field.key]} value={costs[field.key]} onChange={(value) => setCosts((current) => ({ ...current, [field.key]: value }))} />)}
            </div>
            <details className="mt-3 rounded-xl bg-stone-50 p-3">
              <summary className="cursor-pointer text-sm font-black text-stone-800">{text.more}</summary>
              <div className="mt-3 grid gap-2">
                {fieldDefs.filter((field) => !("primary" in field && field.primary)).map((field) => <CostInput key={field.key} field={field} label={text.fields[field.key]} value={costs[field.key]} onChange={(value) => setCosts((current) => ({ ...current, [field.key]: value }))} />)}
              </div>
            </details>
          </div>

          <div className="grid gap-3">
            <div className="grid grid-cols-1 gap-2 min-[360px]:grid-cols-2">
              <Stat title={text.stats.expenses} value={yen(result.expenses)} />
              <Stat title={text.stats.remaining} value={yen(result.remaining)} sub={`${result.remainingRatio.toFixed(1)}%`} />
              <Stat title={text.stats.expenseRatio} value={`${result.expenseRatio.toFixed(1)}%`} />
              <Stat title={text.stats.income} value={yen(result.income)} />
            </div>
            <div className="rounded-[20px] border border-stone-200 bg-white p-4 shadow-sm">
              <div className="mb-2 flex justify-between text-xs font-black text-stone-500">
                <span>{text.stats.bar}</span>
                <span>{result.expenseRatio.toFixed(1)}%</span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-emerald-100">
                <div className={`h-full rounded-full ${result.status.bar}`} style={{ width: `${Math.min(Math.max(result.expenseRatio, 0), 100)}%` }} />
              </div>
            </div>
            <div className={`rounded-[20px] border p-4 ${result.status.className}`}>
              <div className="flex items-start gap-3">
                <StatusIcon className="mt-0.5 h-5 w-5 shrink-0" />
                <div>
                  <p className="font-black">{result.status.label}</p>
                  <p className="mt-1 text-sm font-bold leading-6">{result.status.advice}</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function CostInput({ field, label, onChange, value }: { field: (typeof fieldDefs)[number]; label: string; onChange: (value: string) => void; value: string }) {
  const Icon = field.icon;
  return (
    <label className="block">
      <span className="mb-1 flex items-center gap-1.5 text-xs font-black text-stone-600">
        <Icon className="h-3.5 w-3.5 text-emerald-800" />
        {label}
      </span>
      <span className="flex h-9 items-center rounded-xl border border-stone-200 bg-stone-50 px-2.5">
        <input className="min-w-0 flex-1 bg-transparent text-sm font-black outline-none" inputMode="numeric" onChange={(event) => onChange(event.target.value)} type="number" value={value} />
        <span className="ml-1.5 text-[11px] font-black text-stone-500">JPY</span>
      </span>
    </label>
  );
}

function Stat({ sub, title, value }: { sub?: string; title: string; value: string }) {
  return (
    <div className="rounded-[18px] border border-stone-200 bg-white p-3 shadow-sm">
      <p className="text-xs font-black text-stone-500">{title}</p>
      <p className="mt-1 text-lg font-black">{value}</p>
      {sub ? <p className="mt-1 text-xs font-bold text-stone-500">{sub}</p> : null}
    </div>
  );
}
