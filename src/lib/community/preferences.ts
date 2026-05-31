import { getCurrentCommunityUser } from "@/lib/community/currentUser";
import { readCommunityUserProfile, upsertCommunityProfile, writeCommunityUserProfile } from "@/lib/community/repository";
import type { CommunityPost, CommunityPostType, CommunityViewLocale } from "@/lib/community/types";

export type CommunityInterestState = {
  hasCompletedOnboarding: boolean;
  hasSkippedOnboarding: boolean;
  interests: string[];
  updatedAt: string;
};

export const communityInterestsStorageKey = "japan-life-community-interests";
export const communityCompletedOnboardingKey = "hasCompletedCommunityOnboarding";
export const communitySkippedOnboardingKey = "hasSkippedCommunityOnboarding";
export const communityMaxInterests = 8;

export const communityInterestOptions: Record<CommunityViewLocale, string[]> = {
  all: ["美食", "グルメ", "省钱生活", "節約生活", "租房搬家", "部屋探し", "打工职场", "バイト", "闲置赠送", "譲ります", "同城搭子", "友達募集", "宠物生活", "ペット生活"],
  ja: ["グルメ", "節約生活", "部屋探し", "バイト", "手続き・ビザ", "譲ります", "友達募集", "ペット生活", "病院・薬", "東京散歩", "言語交換", "生活相談"],
  "zh-cn": ["美食", "省钱生活", "租房搬家", "打工职场", "手续签证", "闲置赠送", "同城搭子", "宠物生活", "医院药妆", "东京散步", "语言交换", "生活求助"],
  "zh-tw": ["美食", "慳錢生活", "租屋搬屋", "打工職場", "手續簽證", "二手贈送", "同城搭子", "寵物生活", "醫院藥妝", "東京散步", "語言交換", "生活求助"],
};

export const communityInterestDialogCopy: Record<CommunityViewLocale, { save: string; skip: string; subtitle: string; title: string }> = {
  all: {
    save: "保存兴趣",
    skip: "跳过",
    subtitle: "选择几个感兴趣的话题，社区会优先推荐相关内容",
    title: "你想看什么内容？",
  },
  ja: {
    save: "興味を保存",
    skip: "スキップ",
    subtitle: "興味のあるトピックを選ぶと、関連する投稿を優先して表示します",
    title: "どんな投稿を見たいですか？",
  },
  "zh-cn": {
    save: "保存兴趣",
    skip: "跳过",
    subtitle: "选择几个感兴趣的话题，社区会优先推荐相关内容",
    title: "你想看什么内容？",
  },
  "zh-tw": {
    save: "保存興趣",
    skip: "跳過",
    subtitle: "揀幾個感興趣嘅話題，社區會優先顯示相關內容",
    title: "你想睇咩內容？",
  },
};

export function getCommunityInterests(): CommunityInterestState {
  if (typeof window === "undefined") return createEmptyInterestState();
  const stored = readStoredInterestState();
  return {
    hasCompletedOnboarding: stored.hasCompletedOnboarding || window.localStorage.getItem(communityCompletedOnboardingKey) === "true",
    hasSkippedOnboarding: stored.hasSkippedOnboarding || window.localStorage.getItem(communitySkippedOnboardingKey) === "true",
    interests: normalizeInterests(stored.interests),
    updatedAt: stored.updatedAt,
  };
}

export async function saveCommunityInterests(interests: string[]) {
  const nextState: CommunityInterestState = {
    hasCompletedOnboarding: true,
    hasSkippedOnboarding: false,
    interests: normalizeInterests(interests).slice(0, communityMaxInterests),
    updatedAt: new Date().toISOString(),
  };
  writeInterestState(nextState);

  const user = await getCurrentCommunityUser();
  if (!user) return nextState;
  const currentProfile = readCommunityUserProfile();
  const profile = {
    ...currentProfile,
    id: user.id,
    interests: nextState.interests,
  };
  const result = await upsertCommunityProfile(profile);
  if (result.source !== "supabase" || result.error) {
    writeCommunityUserProfile(profile);
  }
  return nextState;
}

export function markCommunityOnboardingSkipped() {
  const current = getCommunityInterests();
  const nextState: CommunityInterestState = {
    ...current,
    hasCompletedOnboarding: false,
    hasSkippedOnboarding: true,
    updatedAt: new Date().toISOString(),
  };
  writeInterestState(nextState);
  return nextState;
}

export function hasCompletedCommunityOnboarding(profileInterests: string[] = []) {
  const state = getCommunityInterests();
  return state.hasCompletedOnboarding || state.hasSkippedOnboarding || profileInterests.length > 0 || state.interests.length > 0;
}

export function shouldShowCommunityOnboarding(profileInterests: string[] = []) {
  const state = getCommunityInterests();
  return !state.hasCompletedOnboarding && !state.hasSkippedOnboarding && profileInterests.length === 0 && state.interests.length === 0;
}

export function getRecommendedPosts(posts: CommunityPost[], interests: string[], options: { mode?: "latest" | "recommend" } = {}) {
  if (options.mode !== "recommend" || interests.length === 0) return posts;
  return [...posts].sort((left, right) => {
    const pinnedCompare = Number(right.isPinned) - Number(left.isPinned);
    if (pinnedCompare !== 0) return pinnedCompare;
    return getCommunityRecommendationScore(right, interests) - getCommunityRecommendationScore(left, interests);
  });
}

export function getCommunityRecommendationReason(post: CommunityPost, interests: string[]) {
  const matchedInterest = interests.find((interest) => postMatchesInterest(post, interest));
  return matchedInterest ? `因为你关注了 #${matchedInterest}` : "";
}

export function getCommunityInterestOptions(locale: CommunityViewLocale) {
  return communityInterestOptions[locale];
}

export function normalizeInterests(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string" && Boolean(item.trim())).map((item) => item.trim()).slice(0, communityMaxInterests)
    : [];
}

function getCommunityRecommendationScore(post: CommunityPost, interests: string[]) {
  const interestMatchCount = interests.reduce((sum, interest) => sum + getInterestMatchWeight(post, interest), 0);
  return post.likes
    + post.comments * 2
    + post.favorites * 2
    + interestMatchCount * 20
    + getRecentBonus(post.createdAt)
    + (post.isFeatured || post.featured ? 15 : 0)
    + (post.isOfficialRecommended ? 20 : 0)
    + (post.isPinned ? 100 : 0);
}

function getInterestMatchWeight(post: CommunityPost, interest: string) {
  let score = 0;
  const lowerInterest = interest.toLowerCase();
  const text = `${post.title} ${post.content} ${post.tags.join(" ")}`.toLowerCase();
  if (post.tags.some((tag) => tag.toLowerCase() === lowerInterest)) score += 2;
  if (text.includes(lowerInterest)) score += 1;
  if (getInterestPostTypes(interest).includes(post.type)) score += 1;
  return score;
}

function postMatchesInterest(post: CommunityPost, interest: string) {
  return getInterestMatchWeight(post, interest) > 0;
}

function getInterestPostTypes(interest: string): CommunityPostType[] {
  if (["美食", "グルメ", "省钱生活", "慳錢生活", "節約生活", "宠物生活", "寵物生活", "ペット生活"].includes(interest)) return ["share", "helper"];
  if (["租房搬家", "租屋搬屋", "部屋探し", "打工职场", "打工職場", "バイト", "手续签证", "手續簽證", "手続き・ビザ", "生活求助", "生活相談"].includes(interest)) return ["help"];
  if (["闲置赠送", "二手贈送", "譲ります"].includes(interest)) return ["secondhand"];
  if (["同城搭子", "友達募集", "语言交换", "語言交換", "言語交換", "东京散步", "東京散步", "東京散歩"].includes(interest)) return ["buddy"];
  if (["医院药妆", "醫院藥妝", "病院・薬"].includes(interest)) return ["help", "helper"];
  return [];
}

function getRecentBonus(createdAt: string) {
  const createdTime = parseCommunityTime(createdAt);
  if (!createdTime) return 0;
  const age = Date.now() - createdTime;
  if (age <= 24 * 60 * 60 * 1000) return 20;
  if (age <= 7 * 24 * 60 * 60 * 1000) return 8;
  return 0;
}

function parseCommunityTime(value: string) {
  const compactMatch = value.match(/^(\d{2})\/(\d{2})\s+(\d{2}):(\d{2})$/);
  if (compactMatch) {
    const [, month, day, hour, minute] = compactMatch;
    return new Date(2026, Number(month) - 1, Number(day), Number(hour), Number(minute)).getTime();
  }
  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function createEmptyInterestState(): CommunityInterestState {
  return {
    hasCompletedOnboarding: false,
    hasSkippedOnboarding: false,
    interests: [],
    updatedAt: "",
  };
}

function readStoredInterestState() {
  if (typeof window === "undefined") return createEmptyInterestState();
  try {
    const raw = window.localStorage.getItem(communityInterestsStorageKey);
    if (!raw) return createEmptyInterestState();
    const parsed = JSON.parse(raw) as Partial<CommunityInterestState>;
    return {
      hasCompletedOnboarding: Boolean(parsed.hasCompletedOnboarding),
      hasSkippedOnboarding: Boolean(parsed.hasSkippedOnboarding),
      interests: normalizeInterests(parsed.interests),
      updatedAt: typeof parsed.updatedAt === "string" ? parsed.updatedAt : "",
    };
  } catch {
    return createEmptyInterestState();
  }
}

function writeInterestState(state: CommunityInterestState) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(communityInterestsStorageKey, JSON.stringify(state));
  window.localStorage.setItem(communityCompletedOnboardingKey, String(state.hasCompletedOnboarding));
  window.localStorage.setItem(communitySkippedOnboardingKey, String(state.hasSkippedOnboarding));
}
