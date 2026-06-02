import type { TrainStatusLanguage, TrainStatusLine, TrainStatusLineId, TrainStatusTone } from "@/data/trainStatus";

export type OdptClientLine = {
  detailByLanguage: Record<TrainStatusLanguage, string>;
  id: TrainStatusLineId;
  incidentStartedAt: string | null;
  incidentValidUntil: string | null;
  source: "odpt";
  statusByLanguage: Record<TrainStatusLanguage, string>;
  tone: TrainStatusTone;
  updatedAt: string | null;
};

export const odptRefreshIntervalMs = 60_000;

const unavailableStatusByLanguage: Record<TrainStatusLanguage, string> = {
  "zh-CN": "暂不可用",
  "zh-TW": "暫不可用",
  ja: "一時利用不可",
};

const notProvidedStatusByLanguage: Record<TrainStatusLanguage, string> = {
  "zh-CN": "未提供实时状态",
  "zh-TW": "未提供即時狀態",
  ja: "リアルタイム未提供",
};

const unavailableDetailByLanguage: Record<TrainStatusLanguage, string> = {
  "zh-CN": "ODPT 运行信息暂时不可用，请出发前确认铁路公司官方信息。",
  "zh-TW": "ODPT 運行資訊暫時不可用，出發前請確認鐵路公司官方資訊。",
  ja: "ODPT の運行情報を一時的に取得できません。出発前に鉄道会社の公式情報を確認してください。",
};

const notProvidedDetailByLanguage: Record<TrainStatusLanguage, string> = {
  "zh-CN": "ODPT 本次没有返回这条线路的实时状态，请出发前确认铁路公司官方信息。",
  "zh-TW": "ODPT 本次沒有返回這條路線的即時狀態，出發前請確認鐵路公司官方資訊。",
  ja: "ODPT からこの路線のリアルタイム状態が返っていません。出発前に鉄道会社の公式情報を確認してください。",
};

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
  if (odptLines.length === 0) {
    return baseLines.map((line) => ({
      ...line,
      detail: unavailableDetailByLanguage[language],
      source: "local",
      status: unavailableStatusByLanguage[language],
      tone: "orange",
      updatedAt: undefined,
    }));
  }
  const byId = new Map(odptLines.map((line) => [line.id, line]));
  return baseLines.map((line) => {
    const odptLine = byId.get(line.id);
    if (!odptLine) {
      return {
        ...line,
        detail: notProvidedDetailByLanguage[language],
        source: "local",
        status: notProvidedStatusByLanguage[language],
        tone: "orange",
        updatedAt: undefined,
      };
    }
    return {
      ...line,
      detail: odptLine.detailByLanguage[language],
      incidentStartedAt: odptLine.incidentStartedAt ?? undefined,
      incidentValidUntil: odptLine.incidentValidUntil ?? undefined,
      source: "odpt",
      status: odptLine.statusByLanguage[language] || line.status,
      tone: odptLine.tone,
      updatedAt: odptLine.updatedAt ?? undefined,
    };
  });
}
