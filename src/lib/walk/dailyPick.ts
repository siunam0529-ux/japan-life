import { getWalkContext, recommendWalkSpot, type WalkContext } from "@/lib/walk/recommendationLogic";
import { walkSpots, type WalkSpot, type WalkTag } from "@/lib/walk/spots";
import type { WalkFeedbackId } from "@/lib/walk/feedback";
import { getTokyoDateKey, readDailyWalkPick, readSkippedSpotIdsByDate, writeDailyWalkPick, writeSkippedSpotIdsByDate } from "@/lib/walk/storage";
import type { DailyWalkPick } from "@/lib/walk/types";
import type { WalkWeatherSnapshot } from "@/lib/walk/weatherRecommendation";
export type { DailyWalkPick } from "@/lib/walk/types";
export { getTokyoDateKey, readDailyWalkPick, readSkippedSpotIdsByDate, writeDailyWalkPick, writeSkippedSpotIdsByDate } from "@/lib/walk/storage";

function getSpotById(spotId: string) {
  return walkSpots.find((spot) => spot.id === spotId) ?? null;
}

function buildPick(spot: WalkSpot, date: string, selectedTag: WalkTag | "全部"): DailyWalkPick {
  return {
    date,
    selectedTag,
    spotId: spot.id,
    task: spot.tasks[0] ?? spot.walkTask,
  };
}

export function getDailyWalkPick({
  context = getWalkContext(),
  date = getTokyoDateKey(),
  feedbackIds = [],
  poolOverride,
  selectedTag = "全部",
  weatherSnapshot,
}: {
  context?: WalkContext;
  date?: string;
  feedbackIds?: WalkFeedbackId[];
  poolOverride?: WalkSpot[];
  selectedTag?: WalkTag | "全部";
  weatherSnapshot?: WalkWeatherSnapshot;
} = {}) {
  const saved = readDailyWalkPick();
  const skipped = readSkippedSpotIdsByDate()[date] ?? [];
  const savedSpot = saved?.date === date ? getSpotById(saved.spotId) : null;
  if (saved && savedSpot && !skipped.includes(savedSpot.id)) {
    return { pick: saved, spot: savedSpot };
  }
  const nextSpot = recommendWalkSpot({ activeTag: selectedTag, context, feedbackIds, poolOverride, skippedSpotIds: skipped, weatherSnapshot });
  const nextPick = buildPick(nextSpot, date, selectedTag);
  writeDailyWalkPick(nextPick);
  return { pick: nextPick, spot: nextSpot };
}

export function shuffleDailyWalkPick({
  context,
  currentSpotId,
  date = getTokyoDateKey(),
  feedbackIds = [],
  poolOverride,
  selectedTag = "全部",
  weatherSnapshot,
}: {
  context: WalkContext;
  currentSpotId?: string;
  date?: string;
  feedbackIds?: WalkFeedbackId[];
  poolOverride?: WalkSpot[];
  selectedTag?: WalkTag | "全部";
  weatherSnapshot?: WalkWeatherSnapshot;
}) {
  const skipped = readSkippedSpotIdsByDate()[date] ?? [];
  const nextSpot = recommendWalkSpot({ activeTag: selectedTag, context, currentId: currentSpotId, feedbackIds, poolOverride, skippedSpotIds: skipped, weatherSnapshot });
  const nextPick = buildPick(nextSpot, date, selectedTag);
  writeDailyWalkPick(nextPick);
  return { pick: nextPick, spot: nextSpot };
}

export function skipDailyWalkSpot({
  context,
  date = getTokyoDateKey(),
  feedbackIds = [],
  poolOverride,
  selectedTag = "全部",
  spotId,
  weatherSnapshot,
}: {
  context: WalkContext;
  date?: string;
  feedbackIds?: WalkFeedbackId[];
  poolOverride?: WalkSpot[];
  selectedTag?: WalkTag | "全部";
  spotId: string;
  weatherSnapshot?: WalkWeatherSnapshot;
}) {
  const skippedByDate = readSkippedSpotIdsByDate();
  const nextSkipped = Array.from(new Set([...(skippedByDate[date] ?? []), spotId]));
  skippedByDate[date] = nextSkipped;
  writeSkippedSpotIdsByDate(skippedByDate);
  const nextSpot = recommendWalkSpot({ activeTag: selectedTag, context, currentId: spotId, feedbackIds, poolOverride, skippedSpotIds: nextSkipped, weatherSnapshot });
  const nextPick = buildPick(nextSpot, date, selectedTag);
  writeDailyWalkPick(nextPick);
  return { pick: nextPick, skippedSpotIds: nextSkipped, spot: nextSpot };
}
