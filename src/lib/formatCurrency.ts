export type SupportedCurrency = "JPY" | "CNY" | "HKD" | "TWD" | "USD";

const currencyLocales: Record<SupportedCurrency, string> = {
  JPY: "ja-JP",
  CNY: "zh-CN",
  HKD: "zh-HK",
  TWD: "zh-TW",
  USD: "en-US",
};

export function formatCurrency(value: number, currency: SupportedCurrency = "JPY") {
  const roundedValue = currency === "JPY" ? Math.round(value || 0) : value || 0;

  return new Intl.NumberFormat(currencyLocales[currency], {
    style: "currency",
    currency,
    maximumFractionDigits: currency === "JPY" ? 0 : 2,
  }).format(roundedValue);
}
