import type { TrainStatusLanguage, TrainStatusLine, TrainStatusLineId, TrainStatusTone } from "@/data/trainStatus";

export type OdptClientLine = {
  detailByLanguage: Record<TrainStatusLanguage, string>;
  id: TrainStatusLineId;
  source: "odpt";
  statusByLanguage: Record<TrainStatusLanguage, string>;
  tone: TrainStatusTone;
  updatedAt: string | null;
};

export const odptRefreshIntervalMs = 60_000;

export type OdptApiResponse =
  | {
      fetchedAt: string;
      lines: OdptClientLine[];
      source: "odpt";
    }
  | {
      error?: string;
      source: "fallback";
    };

export async function fetchOdptTrainStatusLines(): Promise<{ lines: OdptClientLine[]; source: "fallback" | "odpt" }> {
  try {
    const response = await fetch("/api/train-status/odpt", { cache: "no-store" });
    const payload = (await response.json()) as OdptApiResponse;
    if (!response.ok || payload.source !== "odpt" || !Array.isArray(payload.lines)) {
      return { lines: [], source: "fallback" };
    }
    return { lines: payload.lines, source: "odpt" };
  } catch {
    return { lines: [], source: "fallback" };
  }
}

export function mergeOdptLines(baseLines: TrainStatusLine[], odptLines: OdptClientLine[], language: TrainStatusLanguage): TrainStatusLine[] {
  if (odptLines.length === 0) return baseLines;
  const byId = new Map(odptLines.map((line) => [line.id, line]));
  return baseLines.map((line) => {
    const odptLine = byId.get(line.id);
    if (!odptLine) return line;
    return {
      ...line,
      detail: odptLine.detailByLanguage[language],
      source: "odpt",
      status: odptLine.statusByLanguage[language] || line.status,
      tone: odptLine.tone,
      updatedAt: odptLine.updatedAt ?? undefined,
    };
  });
}
