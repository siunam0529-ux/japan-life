import { NextResponse } from "next/server";
import { tokyoRailLineConfigs, type TrainStatusLanguage, type TrainStatusTone } from "@/data/trainStatus";
import { getTokyoDateTimeString } from "@/lib/utils/format";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const odptEndpoint = "https://api.odpt.org/api/v4/odpt:TrainInformation";

const normalStatus: Record<TrainStatusLanguage, string> = {
  "zh-CN": "正常",
  "zh-TW": "正常",
  ja: "平常運転",
};

type OdptLocalizedText = Partial<Record<"en" | "ja" | "ja-Hrkt" | "ko" | "zh-Hans" | "zh-Hant", string>>;

type OdptTrainInformation = {
  "dc:date"?: string;
  "dct:valid"?: string;
  "odpt:operator"?: string;
  "odpt:railway"?: string;
  "odpt:trainInformationStatus"?: OdptLocalizedText | string;
  "odpt:trainInformationText"?: OdptLocalizedText | string;
};

export async function GET() {
  const apiKey = getOdptApiKey();
  if (!apiKey) {
    return jsonNoStore({ error: "ODPT_API_KEY is not configured.", source: "fallback" }, 503);
  }

  const url = new URL(odptEndpoint);
  url.searchParams.set("acl:consumerKey", apiKey);

  try {
    const response = await fetch(url, {
      cache: "no-store",
      headers: { accept: "application/json" },
    });

    if (!response.ok) {
      return jsonNoStore({ error: "ODPT request failed.", source: "fallback" }, 502);
    }

    const payload = (await response.json()) as unknown;
    if (!Array.isArray(payload)) {
      return jsonNoStore({ error: "ODPT response shape is invalid.", source: "fallback" }, 502);
    }

    const records = payload.filter(isOdptTrainInformation);
    const fetchedAt = getTokyoDateTimeString();
    return jsonNoStore({
      fetchedAt,
      lines: tokyoRailLineConfigs.map((line) => toClientLine(line, records, fetchedAt)),
      source: "odpt",
    });
  } catch {
    return jsonNoStore({ error: "ODPT request failed.", source: "fallback" }, 502);
  }
}

function jsonNoStore(body: unknown, status = 200) {
  return NextResponse.json(body, {
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      Pragma: "no-cache",
    },
    status,
  });
}

function getOdptApiKey() {
  return (
    process.env.ODPT_API_KEY?.trim() ||
    process.env.ODPT_CONSUMER_KEY?.trim() ||
    process.env.ODPT_CONSUMERKEY?.trim() ||
    ""
  );
}

function isOdptTrainInformation(value: unknown): value is OdptTrainInformation {
  return Boolean(value && typeof value === "object");
}

function toClientLine(line: (typeof tokyoRailLineConfigs)[number], records: OdptTrainInformation[], fetchedAt: string) {
  const record = records.find((item) => {
    const railway = item["odpt:railway"];
    return typeof railway === "string" && line.railways.includes(railway);
  });

  if (!record) {
    return {
      detailByLanguage: normalStatus,
      id: line.id,
      source: "odpt" as const,
      statusByLanguage: normalStatus,
      tone: "green" as TrainStatusTone,
      updatedAt: fetchedAt,
    };
  }

  const detailJa = pickText(record["odpt:trainInformationText"], "ja") || pickText(record["odpt:trainInformationStatus"], "ja");
  const statusJa = inferJapaneseStatus(record);
  const tone = inferTone(`${statusJa} ${detailJa}`);
  const statusByLanguage = {
    "zh-CN": toShortStatus(statusJa, tone, "zh-CN"),
    "zh-TW": toShortStatus(statusJa, tone, "zh-TW"),
    ja: statusJa || normalStatus.ja,
  };
  const detailByLanguage = getDetailByLanguage(record, detailJa, tone, statusByLanguage);

  return {
    detailByLanguage,
    id: line.id,
    source: "odpt" as const,
    statusByLanguage,
    tone,
    updatedAt: fetchedAt,
  };
}

function pickText(value: OdptLocalizedText | string | undefined, key: keyof OdptLocalizedText) {
  if (!value) return "";
  if (typeof value === "string") return value;
  return value[key] || value.ja || value.en || "";
}

function pickSpecificText(value: OdptLocalizedText | string | undefined, key: keyof OdptLocalizedText) {
  if (!value || typeof value === "string") return "";
  return value[key] || "";
}

function getDetailByLanguage(
  record: OdptTrainInformation,
  detailJa: string,
  tone: TrainStatusTone,
  statusByLanguage: Record<TrainStatusLanguage, string>,
) {
  if (tone === "green") {
    return statusByLanguage;
  }

  return {
    "zh-CN": pickSpecificText(record["odpt:trainInformationText"], "zh-Hans") || toDetailText(detailJa, tone, "zh-CN"),
    "zh-TW": pickSpecificText(record["odpt:trainInformationText"], "zh-Hant") || toDetailText(detailJa, tone, "zh-TW"),
    ja: detailJa || statusByLanguage.ja,
  };
}

function inferJapaneseStatus(record: OdptTrainInformation) {
  const detail = pickText(record["odpt:trainInformationText"], "ja");
  const status = pickText(record["odpt:trainInformationStatus"], "ja");
  const combined = `${status} ${detail}`.trim();
  if (!combined) return "平常運転";
  if (isNormalOperationText(combined)) return "平常運転";
  if (/(運転見合わせ|運休|不通)/.test(combined)) return "運転見合わせ";
  if (/(遅延|遅れ)/.test(combined)) return "遅延";
  if (/(運転再開|再開)/.test(combined)) return "運転再開";
  if (/(平常|通常)/.test(combined)) return "平常運転";
  return "運行情報あり";
}

function inferTone(text: string): TrainStatusTone {
  if (isNormalOperationText(text)) return "green";
  if (/(運転見合わせ|運休|不通|Suspended|suspended)/.test(text)) return "red";
  if (/(遅延|遅れ|見合わせ|再開|変更|Delay|delay)/.test(text)) return "orange";
  return "green";
}

function isNormalOperationText(text: string) {
  return (
    /(平常|通常|正常|運行情報はありません|運転に支障はありません)/.test(text) ||
    /(遅延|遅れ).{0,80}(ありません|ございません|なし|発生していません)/.test(text) ||
    /(１５|15)分以上の(遅延|遅れ)はありません/.test(text) ||
    /no\s+(delay|delays|service disruption)/i.test(text)
  );
}

function toShortStatus(statusJa: string, tone: TrainStatusTone, language: TrainStatusLanguage) {
  if (tone === "green") return language === "ja" ? "平常運転" : "正常";
  if (/(運転見合わせ|運休|不通)/.test(statusJa)) return language === "ja" ? "運転見合わせ" : language === "zh-TW" ? "暫停運行" : "暂停运行";
  if (/(運転再開|再開)/.test(statusJa)) return language === "ja" ? "運転再開" : language === "zh-TW" ? "恢復運行" : "恢复运行";
  if (/(遅延|遅れ)/.test(statusJa)) return language === "ja" ? "遅延" : language === "zh-TW" ? "延誤" : "延误";
  return language === "ja" ? statusJa || "運行情報あり" : language === "zh-TW" ? "有運行資訊" : "有运行信息";
}

function toDetailText(detailJa: string, tone: TrainStatusTone, language: TrainStatusLanguage) {
  if (!detailJa) return language === "ja" ? "ODPT 参考：運行情報があります。" : "ODPT 参考：有运行信息，请出发前确认。";
  return language === "ja" ? detailJa : `ODPT 参考：${detailJa}`;
}
