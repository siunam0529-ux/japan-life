import type { CommunityPost, CommunityViewLocale } from "@/lib/community/types";

export const communityMaxInterests = 5;

const interestsStorageKey = "japan-life-community-interests";
const onboardingSkippedKey = "japan-life-community-onboarding-skipped";

type CommunityInterestState = {
  interests: string[];
};

type InterestDialogCopy = {
  save: string;
  skip: string;
  subtitle: string;
  title: string;
};

const defaultInterests = ["美食", "租房", "打工", "闲置", "搭子", "手续", "日语", "省钱"];

const unifiedDialogCopy: InterestDialogCopy = {
  save: "保存",
  skip: "跳过",
  subtitle: "选择几个感兴趣的话题，社区会优先推荐相关内容。",
  title: "选择兴趣",
};

export const communityInterestDialogCopy: Record<CommunityViewLocale, InterestDialogCopy> = {
  all: unifiedDialogCopy,
  ja: unifiedDialogCopy,
  "zh-cn": unifiedDialogCopy,
  "zh-tw": unifiedDialogCopy,
};

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) as T : fallback;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

function cleanInterests(interests: unknown): string[] {
  return Array.isArray(interests)
    ? interests.filter((item): item is string => typeof item === "string" && Boolean(item.trim())).slice(0, communityMaxInterests)
    : [];
}

export function getCommunityInterestOptions(_locale: CommunityViewLocale = "all") {
  void _locale;
  return defaultInterests;
}

export function getCommunityInterests(): CommunityInterestState {
  return { interests: cleanInterests(readJson<string[]>(interestsStorageKey, [])) };
}

export async function saveCommunityInterests(interests: string[]): Promise<CommunityInterestState> {
  const next = cleanInterests(interests);
  writeJson(interestsStorageKey, next);
  if (typeof window !== "undefined") window.localStorage.setItem(onboardingSkippedKey, "true");
  return { interests: next };
}

export function shouldShowCommunityOnboarding() {
  if (typeof window === "undefined") return false;
  return !window.localStorage.getItem(onboardingSkippedKey) && getCommunityInterests().interests.length === 0;
}

export function markCommunityOnboardingSkipped() {
  if (typeof window !== "undefined") window.localStorage.setItem(onboardingSkippedKey, "true");
}

export function getRecommendedPosts(posts: CommunityPost[], interests: string[], options: { mode?: "latest" | "recommend" } = {}): CommunityPost[] {
  if (options.mode !== "recommend" || interests.length === 0) return posts;
  const interestSet = new Set(interests.map((item) => item.toLowerCase()));
  return [...posts].sort((left, right) => scorePost(right, interestSet) - scorePost(left, interestSet));
}

export function getCommunityRecommendationReason(post: CommunityPost, interests: string[]) {
  const lower = `${post.title} ${post.content} ${post.tags.join(" ")}`.toLowerCase();
  return interests.find((interest) => lower.includes(interest.toLowerCase())) || "";
}

function scorePost(post: CommunityPost, interests: Set<string>) {
  const lower = `${post.title} ${post.content} ${post.tags.join(" ")}`.toLowerCase();
  let score = 0;
  interests.forEach((interest) => {
    if (lower.includes(interest)) score += 1;
  });
  return score;
}
