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
  return `/community/${locale}`;
}

export function getCommunityNewPostHref(locale: CommunityViewLocale) {
  return `/community/${locale}/new`;
}

export function getCommunityPostHref(post: Pick<CommunityPost, "communityLocale" | "id">, viewLocale?: CommunityViewLocale) {
  return `/community/${viewLocale ?? post.communityLocale}/${post.id}`;
}

export function getCommunityTopicRoute(tag: string, locale: CommunityViewLocale = "all") {
  return `/community/${locale}/topic/${encodeURIComponent(normalizeCommunityTag(tag))}`;
}

export function getCommunityUserHref(userId: string) {
  return `/community/user/${userId}`;
}

export function isPostInCommunityView(post: Pick<CommunityPost, "communityLocale">, locale: CommunityViewLocale) {
  return locale === "all" || post.communityLocale === locale;
}

export function defaultPostLocale(locale: CommunityViewLocale): CommunityLocale {
  return locale === "all" ? "zh-cn" : locale;
}
