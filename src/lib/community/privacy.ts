import { removeCommunityRelationship } from "@/lib/community/follow";

export const communityShowFavoritesKey = "japan-life:me-show-favorites";
export const communityShowLikedKey = "japan-life:me-show-liked";
export const communityShowCommentsKey = "japan-life:me-show-comments";
export const communityShowFollowingKey = "japan-life:me-show-following";
export const communityShowFollowersKey = "japan-life:me-show-followers";
export const communityPrivateMessagePrivacyKey = "japan-life-community-private-message-privacy";
export const communityBlacklistKey = "japan-life-community-blacklist";

export type CommunityPrivateMessagePrivacy = "all" | "following" | "mutual";

export function readCommunityBlacklist() {
  if (typeof window === "undefined") return [] as string[];
  try {
    const list = JSON.parse(window.localStorage.getItem(communityBlacklistKey) || "[]") as unknown[];
    return [...new Set(list.filter((item): item is string => typeof item === "string").map((item) => item.trim()).filter(Boolean))];
  } catch {
    return [];
  }
}

export function writeCommunityBlacklist(list: string[]) {
  if (typeof window === "undefined") return;
  const next = [...new Set(list.map((item) => item.trim()).filter(Boolean))];
  next.forEach((userId) => {
    removeCommunityRelationship(userId);
  });
  window.localStorage.setItem(communityBlacklistKey, JSON.stringify(next));
}

export function addCommunityBlockedUser(userId: string) {
  const targetUserId = userId.trim();
  if (!targetUserId) return readCommunityBlacklist();
  const next = [...new Set([targetUserId, ...readCommunityBlacklist()])];
  writeCommunityBlacklist(next);
  return next;
}

export function isCommunityUserBlocked(userId: string) {
  return readCommunityBlacklist().includes(userId);
}

export function readCommunityPrivateMessagePrivacy(): CommunityPrivateMessagePrivacy {
  if (typeof window === "undefined") return "all";
  const value = window.localStorage.getItem(communityPrivateMessagePrivacyKey);
  return value === "following" || value === "mutual" ? value : "all";
}

export function writeCommunityPrivateMessagePrivacy(value: CommunityPrivateMessagePrivacy) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(communityPrivateMessagePrivacyKey, value);
}
