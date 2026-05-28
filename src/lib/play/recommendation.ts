import { playDestinations } from "@/lib/play/destinations";
import type { PlayDestination, PlayFilterTag, PlayMode } from "@/lib/play/types";

const oneDayIds = new Set(["kamakura", "enoshima", "kawagoe", "takao", "okutama", "yokohama"]);
const weekendTripIds = new Set(["kamakura", "enoshima", "kawagoe", "takao", "okutama", "yokohama", "showa-kinen-park", "odaiba"]);
const eveningTags: PlayFilterTag[] = ["夜景", "咖啡", "购物", "海边"];

function scoreMode(destination: PlayDestination, mode: PlayMode) {
  if (mode === "半日游") {
    return destination.bestTime.includes("半日") && destination.prefecture === "东京" && destination.difficulty === "轻松" ? 8 : destination.bestTime.includes("半日") ? 4 : 0;
  }
  if (mode === "一日游") {
    return oneDayIds.has(destination.id) || destination.bestTime.includes("一日") || destination.tags.includes("想有出门感") ? 8 : 0;
  }
  if (mode === "傍晚出发") {
    return destination.bestTime.includes("傍晚出发") || eveningTags.some((tag) => destination.tags.includes(tag)) ? 8 : 0;
  }
  return weekendTripIds.has(destination.id) || destination.tags.includes("想有出门感") ? 8 : 0;
}

function scoreDestination(destination: PlayDestination, filters: PlayFilterTag[], mode: PlayMode) {
  const modeScore = scoreMode(destination, mode);
  const filterScore = filters.reduce((score, filter) => {
    if (destination.tags.includes(filter)) return score + 3;
    if (destination.bestFor.includes(filter as never)) return score + 2;
    if (destination.bestTime.includes(filter as never)) return score + 2;
    return score;
  }, 0);
  return modeScore + filterScore + 1;
}

export function getPlayMatches(filters: PlayFilterTag[], mode: PlayMode) {
  const sorted = [...playDestinations].sort((left, right) => scoreDestination(right, filters, mode) - scoreDestination(left, filters, mode));
  return sorted.filter((destination) => scoreMode(destination, mode) > 0 || filters.some((filter) => destination.tags.includes(filter)));
}

export function pickPlayDestination({
  currentId,
  filters,
  mode,
}: {
  currentId?: string;
  filters: PlayFilterTag[];
  mode: PlayMode;
}) {
  const matches = getPlayMatches(filters, mode);
  const candidates = matches.filter((destination) => destination.id !== currentId);
  const rankedCandidates = candidates.slice(0, 8);
  const pool = rankedCandidates.length > 0 ? rankedCandidates : matches.slice(0, 8);
  if (pool.length === 0) return null;
  return pool[Math.floor(Math.random() * pool.length)];
}

export function getPlayDestinationById(id: string) {
  return playDestinations.find((destination) => destination.id === id) ?? null;
}

export function getInitialPlayPick(savedId: string | null, filters: PlayFilterTag[], mode: PlayMode) {
  const saved = savedId ? getPlayDestinationById(savedId) : null;
  if (saved && getPlayMatches(filters, mode).some((destination) => destination.id === saved.id)) return saved;
  return pickPlayDestination({ filters, mode });
}
