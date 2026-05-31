import type { TrainStatusLanguage, TrainStatusLineId, TrainStatusTone } from "@/data/trainStatus";
import { getTokyoDateString } from "@/lib/api/holidays";
import type { OdptClientLine } from "@/lib/trainStatus/odptClient";
import { getTokyoDateTimeString } from "@/lib/utils/format";

export type TrainIncidentRecord = {
  date: string;
  detailByLanguage: Record<TrainStatusLanguage, string>;
  endedAt?: string;
  id: string;
  lastSeenAt: string;
  lineId: TrainStatusLineId;
  startedAt: string;
  statusByLanguage: Record<TrainStatusLanguage, string>;
  tone: Exclude<TrainStatusTone, "green">;
};

export const trainIncidentRecordsStorageKey = "japan-life-train-status-incidents";
export const trainIncidentRecordsChangeEvent = "japan-life-train-status-incidents-change";

const maxRecordDays = 7;

export function isActiveOdptIncident(line: Pick<OdptClientLine, "tone">) {
  return line.tone === "orange" || line.tone === "red";
}

export function readTrainIncidentRecords() {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(trainIncidentRecordsStorageKey);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isTrainIncidentRecord);
  } catch {
    return [];
  }
}

export function syncTodayTrainIncidentRecords(lines: OdptClientLine[]) {
  if (typeof window === "undefined") return [];

  const today = getTokyoDateString();
  const nowLabel = getTokyoDateTimeString();
  const activeLines = lines.filter(isActiveOdptIncident);
  const activeLineIds = new Set(activeLines.map((line) => line.id));
  const records = readTrainIncidentRecords().filter((record) => shouldKeepRecord(record, today));
  const byId = new Map(records.map((record) => [record.id, record]));

  activeLines.forEach((line) => {
    const id = `${today}:${line.id}`;
    const current = byId.get(id);
    byId.set(id, {
      date: today,
      detailByLanguage: line.detailByLanguage,
      id,
      lastSeenAt: nowLabel,
      lineId: line.id,
      startedAt: current?.startedAt || line.incidentStartedAt || line.updatedAt || nowLabel,
      statusByLanguage: line.statusByLanguage,
      tone: line.tone === "red" ? "red" : "orange",
    });
  });

  for (const record of byId.values()) {
    if (record.date === today && !activeLineIds.has(record.lineId) && !record.endedAt) {
      byId.set(record.id, { ...record, endedAt: nowLabel });
    }
  }

  const next = [...byId.values()].sort((a, b) => b.startedAt.localeCompare(a.startedAt));
  writeTrainIncidentRecords(next);
  return next;
}

function writeTrainIncidentRecords(records: TrainIncidentRecord[]) {
  try {
    const previous = window.localStorage.getItem(trainIncidentRecordsStorageKey);
    const next = JSON.stringify(records);
    if (previous === next) return;
    window.localStorage.setItem(trainIncidentRecordsStorageKey, next);
    window.dispatchEvent(new Event(trainIncidentRecordsChangeEvent));
  } catch {
    // Local records are helpful, but they should never break the app.
  }
}

function shouldKeepRecord(record: TrainIncidentRecord, today: string) {
  if (record.date === today) return true;
  const todayTime = Date.parse(`${today}T00:00:00+09:00`);
  const recordTime = Date.parse(`${record.date}T00:00:00+09:00`);
  if (!Number.isFinite(todayTime) || !Number.isFinite(recordTime)) return false;
  return todayTime - recordTime <= maxRecordDays * 86_400_000;
}

function isTrainIncidentRecord(value: unknown): value is TrainIncidentRecord {
  if (!value || typeof value !== "object") return false;
  const record = value as Partial<TrainIncidentRecord>;
  return (
    typeof record.date === "string" &&
    typeof record.id === "string" &&
    typeof record.lastSeenAt === "string" &&
    typeof record.lineId === "string" &&
    typeof record.startedAt === "string" &&
    (record.tone === "orange" || record.tone === "red") &&
    isLanguageRecord(record.detailByLanguage) &&
    isLanguageRecord(record.statusByLanguage) &&
    (typeof record.endedAt === "undefined" || typeof record.endedAt === "string")
  );
}

function isLanguageRecord(value: unknown): value is Record<TrainStatusLanguage, string> {
  if (!value || typeof value !== "object") return false;
  const record = value as Partial<Record<TrainStatusLanguage, unknown>>;
  return typeof record["zh-CN"] === "string" && typeof record["zh-TW"] === "string" && typeof record.ja === "string";
}
