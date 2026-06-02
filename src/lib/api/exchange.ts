import { getTokyoDateTimeString } from "@/lib/utils/format";

export type ExchangeCurrency = "JPY" | "CNY" | "HKD" | "TWD" | "USD";

export type ExchangeRateItem = {
  code: ExchangeCurrency;
  pair: `JPY/${ExchangeCurrency}`;
  changePercent: number;
  trend: number[];
  value: number;
};

export type ExchangeRatesResult = {
  items: ExchangeRateItem[];
  source: "frankfurter" | "unavailable";
  updatedAt: string;
  fallbackReason?: string;
};

const currencies: ExchangeCurrency[] = ["JPY", "CNY", "HKD", "TWD", "USD"];
const frankfurterLatestUrl = "https://api.frankfurter.dev/v2/rates?base=JPY&quotes=CNY,HKD,TWD,USD";

type FrankfurterRateRow = {
  date?: string;
  base?: string;
  quote?: ExchangeCurrency;
  rate?: number;
};

type FrankfurterLegacyResponse = {
  date?: string;
  rates?: Partial<Record<ExchangeCurrency, number>> | Record<string, Partial<Record<ExchangeCurrency, number>>>;
};

function isRateRow(value: unknown): value is FrankfurterRateRow {
  return typeof value === "object" && value !== null && "quote" in value && "rate" in value;
}

async function readFrankfurterRows(response: Response): Promise<FrankfurterRateRow[]> {
  const text = await response.text();
  const trimmed = text.trim();
  if (!trimmed) return [];

  const parsed = trimmed.includes("\n")
    ? trimmed
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => JSON.parse(line) as unknown)
    : (JSON.parse(trimmed) as unknown);

  if (Array.isArray(parsed)) return parsed.filter(isRateRow);
  if (isRateRow(parsed)) return [parsed];

  const legacy = parsed as FrankfurterLegacyResponse;
  if (!legacy.rates) return [];

  const firstRateValue = Object.values(legacy.rates)[0];
  if (typeof firstRateValue === "number") {
    return Object.entries(legacy.rates).map(([quote, rate]) => ({
      date: legacy.date,
      quote: quote as ExchangeCurrency,
      rate: rate as number,
    }));
  }

  return Object.entries(legacy.rates).flatMap(([date, rates]) =>
    Object.entries(rates as Partial<Record<ExchangeCurrency, number>>).map(([quote, rate]) => ({
      date,
      quote: quote as ExchangeCurrency,
      rate,
    })),
  );
}

function unavailable(reason?: string): ExchangeRatesResult {
  return {
    items: currencies.map((code) => ({
      changePercent: 0,
      code,
      pair: `JPY/${code}` as `JPY/${ExchangeCurrency}`,
      trend: code === "JPY" ? [1] : [],
      value: code === "JPY" ? 1 : 0,
    })),
    source: "unavailable",
    updatedAt: getTokyoDateTimeString(),
    fallbackReason: reason,
  };
}

export function getEmptyExchangeRates(reason?: string) {
  return unavailable(reason);
}

function normalizeRates(
  rates: Partial<Record<ExchangeCurrency, number>>,
  trends: Partial<Record<ExchangeCurrency, number[]>>,
  date?: string,
): ExchangeRatesResult {
  const missing = currencies.filter((code) => code !== "JPY" && typeof rates[code] !== "number");
  if (missing.length > 0) return unavailable(`Frankfurter missing: ${missing.join(", ")}`);

  const items = currencies.map((code) => {
    const value = code === "JPY" ? 1 : rates[code] ?? 0;
    const trend = code === "JPY" ? [1] : trends[code]?.length ? trends[code] : [value];
    const first = trend[0] ?? value;
    const last = trend.at(-1) ?? value;
    return {
      code,
      pair: `JPY/${code}` as `JPY/${ExchangeCurrency}`,
      changePercent: first > 0 ? ((last - first) / first) * 100 : 0,
      trend,
      value,
    };
  });

  return {
    items,
    source: "frankfurter",
    updatedAt: date ? `${date} ${getTokyoDateTimeString().split(" ").at(-1) ?? ""}`.trim() : getTokyoDateTimeString(),
    fallbackReason: undefined,
  };
}

function getLatestRateDate(rows: FrankfurterRateRow[]) {
  return rows
    .map((row) => row.date)
    .filter((date): date is string => typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date))
    .sort()
    .at(-1);
}

export async function fetchExchangeRates(): Promise<ExchangeRatesResult> {
  try {
    const today = new Date();
    const end = today.toISOString().slice(0, 10);
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - 21);
    const start = startDate.toISOString().slice(0, 10);
    const frankfurterTrendUrl = `https://api.frankfurter.dev/v2/rates?base=JPY&quotes=CNY,HKD,TWD,USD&from=${start}&to=${end}`;

    const [latestResponse, trendResponse] = await Promise.all([
      fetch(frankfurterLatestUrl, { cache: "no-store" }),
      fetch(frankfurterTrendUrl, { cache: "no-store" }),
    ]);

    if (!latestResponse.ok || !trendResponse.ok) {
      return unavailable(`HTTP latest:${latestResponse.status} trend:${trendResponse.status}`);
    }

    const latestData = await readFrankfurterRows(latestResponse);
    const trendData = await readFrankfurterRows(trendResponse);

    if (!Array.isArray(latestData) || !Array.isArray(trendData)) {
      return unavailable("Invalid response");
    }

    const latestRates = latestData.reduce((acc, row) => {
      if (row.quote && typeof row.rate === "number") acc[row.quote] = row.rate;
      return acc;
    }, {} as Partial<Record<ExchangeCurrency, number>>);

    const trends = trendData.reduce((acc, row) => {
      if (row.quote && typeof row.rate === "number") {
        acc[row.quote] = [...(acc[row.quote] ?? []), row.rate];
      }
      return acc;
    }, {} as Partial<Record<ExchangeCurrency, number[]>>);

    const latestDate = getLatestRateDate(latestData);
    return normalizeRates(latestRates, trends, latestDate);
  } catch (error) {
    return unavailable(error instanceof Error ? error.message : "Network error");
  }
}

export function buildRateMatrix(items: ExchangeRateItem[]) {
  const jpyRates = new Map(items.map((item) => [item.code, item.value]));

  return currencies.reduce(
    (matrix, from) => {
      matrix[from] = currencies.reduce(
        (row, to) => {
          if (from === to) {
            row[to] = 1;
          } else if (from === "JPY") {
            row[to] = jpyRates.get(to) ?? 0;
          } else if (to === "JPY") {
            const fromRate = jpyRates.get(from) ?? 0;
            row[to] = fromRate > 0 ? 1 / fromRate : 0;
          } else {
            const fromRate = jpyRates.get(from) ?? 0;
            const toRate = jpyRates.get(to) ?? 0;
            row[to] = fromRate > 0 ? toRate / fromRate : 0;
          }
          return row;
        },
        {} as Record<ExchangeCurrency, number>,
      );
      return matrix;
    },
    {} as Record<ExchangeCurrency, Record<ExchangeCurrency, number>>,
  );
}
