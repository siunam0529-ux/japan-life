import { mockExchangeRateItems } from "@/data/mockExchangeRates";

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
  source: "frankfurter" | "mock";
  updatedAt: string;
  fallbackReason?: string;
};

const currencies: ExchangeCurrency[] = ["JPY", "CNY", "HKD", "TWD", "USD"];
const frankfurterLatestUrl = "https://api.frankfurter.dev/v2/rates?base=JPY&quotes=CNY,HKD,TWD,USD";
const fallbackTrends: Record<ExchangeCurrency, number[]> = {
  JPY: [1, 1, 1, 1, 1, 1, 1],
  CNY: [0.0481, 0.0483, 0.0482, 0.0486, 0.0485, 0.0488, 0.0488],
  HKD: [0.0518, 0.0517, 0.0515, 0.0516, 0.0514, 0.0515, 0.0515],
  TWD: [0.201, 0.202, 0.2025, 0.202, 0.203, 0.2035, 0.203],
  USD: [0.00645, 0.00647, 0.00646, 0.00649, 0.00648, 0.0065, 0.0065],
};

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

function fallback(reason?: string): ExchangeRatesResult {
  return {
    items: mockExchangeRateItems.map((item) => {
      const trend = fallbackTrends[item.code];
      const first = trend[0] ?? item.value;
      const last = trend.at(-1) ?? item.value;
      return {
        ...item,
        changePercent: first > 0 ? ((last - first) / first) * 100 : 0,
        trend,
      };
    }),
    source: "mock",
    updatedAt: "2026-05-21",
    fallbackReason: reason,
  };
}

export function getMockExchangeRates(reason?: string) {
  return fallback(reason);
}

function normalizeRates(
  rates: Partial<Record<ExchangeCurrency, number>>,
  trends: Partial<Record<ExchangeCurrency, number[]>>,
  date?: string,
): ExchangeRatesResult {
  const mockMap = new Map(mockExchangeRateItems.map((item) => [item.code, item.value]));

  const items = currencies.map((code) => {
    const value = code === "JPY" ? 1 : rates[code] ?? mockMap.get(code) ?? 0;
    const trend = code === "JPY" ? fallbackTrends.JPY : trends[code]?.length ? trends[code] : fallbackTrends[code];
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

  const missing = currencies.filter((code) => code !== "JPY" && (typeof rates[code] !== "number" || !trends[code]?.length));

  return {
    items,
    source: missing.length > 0 ? "mock" : "frankfurter",
    updatedAt: date ?? new Date().toISOString().slice(0, 10),
    fallbackReason: missing.length > 0 ? `Frankfurter missing: ${missing.join(", ")}` : undefined,
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
      return fallback(`HTTP latest:${latestResponse.status} trend:${trendResponse.status}`);
    }

    const latestData = await readFrankfurterRows(latestResponse);
    const trendData = await readFrankfurterRows(trendResponse);

    if (!Array.isArray(latestData) || !Array.isArray(trendData)) {
      return fallback("Invalid response");
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
    return fallback(error instanceof Error ? error.message : "Network error");
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
