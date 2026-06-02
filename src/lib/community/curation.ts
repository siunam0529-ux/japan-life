import type { CommunityLocale, CommunityPost, CommunityViewLocale } from "@/lib/community/types";

export type CommunitySortMode = "latest" | "recommend";
export type CommunityCurationBadgeKey = "pinned" | "featured" | "official";

const unifiedCurationLabels: Record<CommunityCurationBadgeKey, string> = {
  featured: "精选",
  official: "官方推荐",
  pinned: "置顶",
};

const curationLabels: Record<CommunityLocale | "all", Record<CommunityCurationBadgeKey, string>> = {
  all: unifiedCurationLabels,
  ja: unifiedCurationLabels,
  "zh-cn": unifiedCurationLabels,
  "zh-tw": unifiedCurationLabels,
};

export function isCommunityPostPinned(post: CommunityPost, now = Date.now()) {
  if (!post.isPinned) return false;
  if (!post.pinnedUntil) return true;
  const pinnedUntilTime = Date.parse(post.pinnedUntil);
  if (Number.isNaN(pinnedUntilTime)) return true;
  return pinnedUntilTime >= now;
}

export function isCommunityPostFeatured(post: CommunityPost) {
  return Boolean(post.isFeatured);
}

export function hasCommunityCuration(post: CommunityPost) {
  return isCommunityPostPinned(post) || isCommunityPostFeatured(post) || post.isOfficialRecommended;
}

export function getCommunityCurationBadges(post: CommunityPost, locale: CommunityViewLocale = "all") {
  const labels = curationLabels[locale === "all" ? "all" : locale];
  const badges: { key: CommunityCurationBadgeKey; label: string }[] = [];
  if (isCommunityPostPinned(post)) badges.push({ key: "pinned", label: labels.pinned });
  if (isCommunityPostFeatured(post)) badges.push({ key: "featured", label: labels.featured });
  if (post.isOfficialRecommended) badges.push({ key: "official", label: labels.official });
  return badges;
}

export function compareCommunityPosts(
  left: CommunityPost,
  right: CommunityPost,
  options: { chronologicalFirst?: boolean; mode?: CommunitySortMode } = {},
) {
  const curationCompare = getCommunityCurationPriority(right) - getCommunityCurationPriority(left);
  if (curationCompare !== 0) return curationCompare;

  const timeCompare = parseCommunityCreatedAt(right.createdAt) - parseCommunityCreatedAt(left.createdAt);
  if (options.chronologicalFirst || options.mode !== "recommend") return timeCompare;

  const scoreCompare = getCommunityRecommendScore(right) - getCommunityRecommendScore(left);
  return scoreCompare === 0 ? timeCompare : scoreCompare;
}

export function sortCommunityPosts(posts: CommunityPost[], mode: CommunitySortMode = "latest", chronologicalFirst = false) {
  return [...posts].sort((left, right) => compareCommunityPosts(left, right, { chronologicalFirst, mode }));
}

export function getFeaturedCommunityPosts(posts: CommunityPost[], locale: CommunityViewLocale, limit = 5) {
  return sortCommunityPosts(
    posts.filter((post) => post.status === "published" && hasCommunityCuration(post)),
    "recommend",
  ).slice(0, limit);
}

export function parseCommunityCreatedAt(value: string) {
  const compactMatch = value.match(/^(\d{2})\/(\d{2})\s+(\d{2}):(\d{2})$/);
  if (compactMatch) {
    const [, month, day, hour, minute] = compactMatch;
    return new Date(2026, Number(month) - 1, Number(day), Number(hour), Number(minute)).getTime();
  }
  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function getCommunityCurationPriority(post: CommunityPost) {
  if (isCommunityPostPinned(post)) return 3;
  if (post.isOfficialRecommended) return 2;
  if (isCommunityPostFeatured(post)) return 1;
  return 0;
}

function getCommunityRecommendScore(post: CommunityPost) {
  return post.likes + post.comments * 2 + post.favorites;
}
