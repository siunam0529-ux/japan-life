import { normalizeCommunityTag } from "@/lib/community/topics";
import type { CommunityLocale, CommunityPost, CommunityViewLocale } from "@/lib/community/types";

export const communitySelectionHref = "/community/all";
export const communityHomeHref = "/community/all";
export const communityProfileHref = "/community/profile";
export const communityMeHref = "/community/me";
export const communityNotificationsHref = "/notifications";
export const adminCommunityHref = "/admin/community";

export function getCommunitySelectionHref() {
  return communitySelectionHref;
}

export function getCommunityLocaleHref(locale: CommunityViewLocale) {
  void locale;
  return "/community/all";
}

export function getCommunityNewPostHref(locale: CommunityViewLocale) {
  void locale;
  return "/community/all/new";
}

export function getCommunityPostHref(post: Pick<CommunityPost, "communityLocale" | "id">, viewLocale?: CommunityViewLocale) {
  void viewLocale;
  return `/community/all/${post.id}`;
}

export function getCommunityTopicRoute(tag: string, locale: CommunityViewLocale = "all") {
  void locale;
  return `/community/all/topic/${encodeURIComponent(normalizeCommunityTag(tag))}`;
}

export function getCommunityUserHref(userId: string) {
  return `/community/user/${userId}`;
}

export function isPostInCommunityView(post: Pick<CommunityPost, "communityLocale">, locale: CommunityViewLocale) {
  void post;
  void locale;
  return true;
}

export function defaultPostLocale(locale: CommunityViewLocale): CommunityLocale {
  return locale === "all" ? "zh-cn" : locale;
}
