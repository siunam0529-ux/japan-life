import { communityMockPosts } from "@/lib/community/mock";
import * as communitySupabase from "@/lib/community/supabase";
import { canUseCommunitySupabase, getCommunityDataMode, shouldUseCommunityLocalFallback } from "@/lib/community/dataMode";
export { getCurrentCommunityUser, MOCK_COMMUNITY_USER, requireCommunityUser, type CommunityUser } from "@/lib/community/currentUser";
import {
  addCommunityNotification as addLocalCommunityNotification,
  communityCurrentUserId,
  communityFavoritesStorageKey,
  communityLikesStorageKey,
  communityLocalUserId,
  communityLocalUserName,
  createCommunityId,
  createCommunityNotification,
  formatCommunityNow,
  getCommunityUser,
  mergeCommunityPosts,
  readCommunityComments,
  readCommunityContactRequests,
  readCommunityIdSet,
  readCommunityNotifications,
  readCommunityPosts,
  readCommunityReports,
  readCommunityUserProfile,
  readCommunityUsers,
  writeCommunityComments,
  writeCommunityContactRequests,
  writeCommunityIdSet,
  writeCommunityNotifications,
  writeCommunityPosts,
  writeCommunityReports,
  writeCommunityUserProfile,
} from "@/lib/community/storage";
import {
  type CommunityComment,
  type CommunityCommentStatus,
  type CommunityContactRequest,
  type CommunityContactRequestStatus,
  type CommunityLocale,
  type CommunityNotification,
  type CommunityPost,
  type CommunityPostStatus,
  type CommunityReport,
  type CommunityReportTargetType,
  type CommunityUserProfile,
  type CommunityViewLocale,
  hasCommunityRiskKeyword,
  isCommunityLocale,
} from "@/lib/community/types";
import { supabaseConfigError } from "@/lib/supabase";

export {
  mapCommentFromDb,
  mapContactRequestFromDb,
  mapPostFromDb,
  mapReportFromDb,
} from "@/lib/community/supabase";

export type {
  CommunityCommentRow,
  CommunityContactRequestRow,
  CommunityPostRow,
  CommunityReportRow,
} from "@/lib/community/supabase";

export {
  addLocalCommunityNotification as addCommunityNotification,
  communityCurrentUserId,
  communityFavoritesStorageKey,
  communityLikesStorageKey,
  communityLocalUserId,
  communityLocalUserName,
  createCommunityId,
  createCommunityNotification,
  formatCommunityNow,
  getCommunityUser,
  mergeCommunityPosts,
  readCommunityComments,
  readCommunityContactRequests,
  readCommunityIdSet,
  readCommunityNotifications,
  readCommunityPosts,
  readCommunityReports,
  readCommunityUserProfile,
  readCommunityUsers,
  writeCommunityComments,
  writeCommunityContactRequests,
  writeCommunityIdSet,
  writeCommunityNotifications,
  writeCommunityPosts,
  writeCommunityReports,
  writeCommunityUserProfile,
};

type CommunitySource = "supabase" | "fallback";

export type CommunityRepositoryResult<T> = {
  data: T;
  error: string;
  source: CommunitySource;
};

export type GetCommunityPostsOptions = {
  authorId?: string;
  includeAllStatuses?: boolean;
  includeMock?: boolean;
  limit?: number;
  locale?: CommunityViewLocale;
  status?: CommunityPostStatus | CommunityPostStatus[];
  tag?: string;
};

export type CreateCommentInput = {
  authorId?: string;
  authorName: string;
  communityLocale: CommunityLocale;
  content: string;
  isAnonymous?: boolean;
  parentId?: string;
  postId: string;
};

export type CreateContactRequestInput = {
  communityLocale?: CommunityLocale;
  contact: string;
  fromName: string;
  fromUserId?: string;
  message: string;
  postId: string;
  toUserId?: string;
};

export type CreateReportInput = {
  detail?: string;
  reason: string;
  targetId: string;
  targetType: CommunityReportTargetType;
  userId?: string;
};

export type CreateNotificationInput = Omit<CommunityNotification, "createdAt" | "id" | "isRead"> & {
  createdAt?: string;
  id?: string;
  isRead?: boolean;
};

function canUseSupabaseCommunity() {
  return canUseCommunitySupabase();
}

export function getCommunityRepositoryMode() {
  return {
    dataMode: getCommunityDataMode(),
    error: canUseSupabaseCommunity() ? "" : supabaseConfigError || "Supabase is not configured.",
    source: canUseSupabaseCommunity() ? "supabase" as const : "fallback" as const,
  };
}

function shouldFallbackToLocal() {
  return shouldUseCommunityLocalFallback();
}

function fallbackResult<T>(data: T, error = supabaseConfigError || ""): CommunityRepositoryResult<T> {
  if (error) console.warn("[community:repository] fallback to localStorage/mock", error);
  return { data, error, source: "fallback" };
}

function supabaseResult<T>(data: T, error = ""): CommunityRepositoryResult<T> {
  return { data, error, source: "supabase" };
}

function fallbackPosts(includeMock = true) {
  const stored = readCommunityPosts();
  return includeMock ? mergeCommunityPosts(stored, communityMockPosts) : stored;
}

function filterPosts(posts: CommunityPost[], options: GetCommunityPostsOptions = {}) {
  const statuses = Array.isArray(options.status) ? options.status : options.status ? [options.status] : ["published"];
  return posts
    .filter((post) => options.locale && options.locale !== "all" ? post.communityLocale === options.locale : true)
    .filter((post) => options.authorId ? post.authorId === options.authorId : true)
    .filter((post) => options.tag ? post.tags.includes(options.tag) : true)
    .filter((post) => options.includeAllStatuses ? true : statuses.includes(post.status))
    .sort((left, right) => parseCommunityTime(right.createdAt) - parseCommunityTime(left.createdAt))
    .slice(0, options.limit ?? posts.length);
}

export async function getCommunityPosts(options: GetCommunityPostsOptions = {}): Promise<CommunityRepositoryResult<CommunityPost[]>> {
  if (canUseSupabaseCommunity()) {
    const result = await communitySupabase.getCommunityPosts(options);
    if (result.source === "supabase") return supabaseResult(result.data, result.error);
  }
  if (!shouldFallbackToLocal()) return supabaseResult([], supabaseConfigError || "Supabase community data is unavailable.");
  return fallbackResult(filterPosts(fallbackPosts(options.includeMock ?? true), options));
}

export async function getCommunityPostById(id: string, locale: CommunityViewLocale = "all"): Promise<CommunityRepositoryResult<CommunityPost | null>> {
  if (canUseSupabaseCommunity()) {
    const result = await communitySupabase.getCommunityPostById(id, locale);
    if (result.source === "supabase") return supabaseResult(result.data, result.error);
  }
  if (!shouldFallbackToLocal()) return supabaseResult(null, supabaseConfigError || "Supabase community data is unavailable.");
  const post = fallbackPosts(true).find((item) => item.id === id && item.status === "published" && (locale === "all" || item.communityLocale === locale)) ?? null;
  return fallbackResult(post);
}

export async function createCommunityPost(input: CommunityPost): Promise<CommunityRepositoryResult<CommunityPost | null>> {
  if (!isCommunityLocale(input.communityLocale)) return supabaseResult(null, "Invalid community locale.");
  if (canUseSupabaseCommunity()) {
    const result = await communitySupabase.createCommunityPost(input);
    if (result.source === "supabase" && result.data) return supabaseResult(result.data, result.error);
    if (result.source === "supabase" && result.error) return supabaseResult(null, result.error);
  }
  if (!shouldFallbackToLocal()) return supabaseResult(null, supabaseConfigError || "Supabase community data is unavailable.");
  writeCommunityPosts([input, ...readCommunityPosts(input.communityLocale)].slice(0, 100));
  return fallbackResult(input);
}

export async function updateCommunityPost(id: string, input: Partial<CommunityPost>): Promise<CommunityRepositoryResult<CommunityPost | null>> {
  if (canUseSupabaseCommunity()) {
    const result = await communitySupabase.updateCommunityPost(id, input);
    if (result.source === "supabase" && result.data) return supabaseResult(result.data, result.error);
  }
  if (!shouldFallbackToLocal()) return supabaseResult(null, supabaseConfigError || "Supabase community data is unavailable.");
  const posts = readCommunityPosts();
  const previous = posts.find((post) => post.id === id);
  if (!previous) return fallbackResult(null);
  const nextPost = { ...previous, ...input };
  writeCommunityPosts(posts.map((post) => post.id === id ? nextPost : post));
  return fallbackResult(nextPost);
}

export async function softDeleteCommunityPost(id: string) {
  return updateCommunityPost(id, { status: "deleted" });
}

export async function getComments(postId: string, includeAllStatuses = false): Promise<CommunityRepositoryResult<CommunityComment[]>> {
  if (canUseSupabaseCommunity()) {
    const result = await communitySupabase.getCommunityComments(postId);
    if (result.source === "supabase") return supabaseResult(result.data, result.error);
  }
  if (!shouldFallbackToLocal()) return supabaseResult([], supabaseConfigError || "Supabase community data is unavailable.");
  const comments = readCommunityComments()
    .filter((comment) => comment.postId === postId)
    .filter((comment) => includeAllStatuses || comment.status === "published")
    .sort((left, right) => parseCommunityTime(right.createdAt) - parseCommunityTime(left.createdAt));
  return fallbackResult(comments);
}

export async function createComment(input: CreateCommentInput): Promise<CommunityRepositoryResult<CommunityComment | null>> {
  if (canUseSupabaseCommunity()) {
    const result = await communitySupabase.createCommunityComment({
      authorId: input.authorId,
      authorName: input.authorName,
      communityLocale: input.communityLocale,
      content: input.content,
      isAnonymous: input.isAnonymous ?? false,
      parentId: input.parentId,
      postId: input.postId,
    });
    if (result.source === "supabase" && result.data) return supabaseResult(result.data, result.error);
    if (result.source === "supabase" && result.error) return supabaseResult(null, result.error);
  }
  if (!shouldFallbackToLocal()) return supabaseResult(null, supabaseConfigError || "Supabase community data is unavailable.");

  const hasRisk = hasCommunityRiskKeyword(input.content);
  const comment: CommunityComment = {
    id: createCommunityId("community-comment"),
    authorId: input.authorId || communityLocalUserId,
    authorName: input.authorName || communityLocalUserName,
    communityLocale: input.communityLocale,
    content: input.content,
    createdAt: formatCommunityNow(),
    isAnonymous: input.isAnonymous ?? false,
    likeCount: 0,
    parentId: input.parentId,
    postId: input.postId,
    reportCount: 0,
    status: hasRisk ? "reported" : "published",
  };
  writeCommunityComments([comment, ...readCommunityComments()].slice(0, 240));
  patchLocalPost(input.postId, (post) => ({ ...post, comments: post.comments + 1, commentCount: post.commentCount + 1 }));
  const post = fallbackPosts(true).find((item) => item.id === input.postId);
  if (!hasRisk && post && post.authorId !== comment.authorId) {
    addLocalCommunityNotification(createCommunityNotification({
      communityLocale: post.communityLocale,
      message: `${comment.authorName}: ${comment.content}`,
      postId: post.id,
      targetId: comment.id,
      targetType: "comment",
      title: input.parentId ? "有人回复了你的评论" : "有人评论了你的帖子",
      type: input.parentId ? "reply" : "comment",
      userId: post.authorId || communityCurrentUserId,
    }));
  }
  return fallbackResult(comment);
}

export async function softDeleteComment(id: string): Promise<CommunityRepositoryResult<boolean>> {
  if (canUseSupabaseCommunity()) {
    const result = await communitySupabase.updateCommunityCommentStatus(id, "deleted");
    if (result.source === "supabase") return supabaseResult(Boolean(result.data), result.error);
  }
  if (!shouldFallbackToLocal()) return supabaseResult(false, supabaseConfigError || "Supabase community data is unavailable.");
  const comments = readCommunityComments();
  const exists = comments.some((comment) => comment.id === id);
  if (!exists) return fallbackResult(false);
  writeCommunityComments(comments.map((comment) => comment.id === id ? { ...comment, status: "deleted" } : comment));
  return fallbackResult(true);
}

export async function toggleLike(postId: string, userId = communityCurrentUserId): Promise<CommunityRepositoryResult<{ active: boolean; count: number } | null>> {
  if (canUseSupabaseCommunity()) {
    const result = await communitySupabase.toggleCommunityLike(postId);
    if (result.source === "supabase") return supabaseResult(result.data, result.error);
  }
  if (!shouldFallbackToLocal()) return supabaseResult(null, supabaseConfigError || "Supabase community data is unavailable.");
  return toggleLocalRelation(postId, userId, communityLikesStorageKey, "likes", "likeCount");
}

export async function toggleFavorite(postId: string, userId = communityCurrentUserId): Promise<CommunityRepositoryResult<{ active: boolean; count: number } | null>> {
  if (canUseSupabaseCommunity()) {
    const result = await communitySupabase.toggleCommunityFavorite(postId);
    if (result.source === "supabase") return supabaseResult(result.data, result.error);
  }
  if (!shouldFallbackToLocal()) return supabaseResult(null, supabaseConfigError || "Supabase community data is unavailable.");
  return toggleLocalRelation(postId, userId, communityFavoritesStorageKey, "favorites", "favoriteCount");
}

export async function getCommunityLikeIds(userId = communityCurrentUserId): Promise<CommunityRepositoryResult<Set<string>>> {
  if (canUseSupabaseCommunity()) {
    const result = await communitySupabase.getCommunityLikeIds();
    if (result.source === "supabase") return supabaseResult(result.data, result.error);
  }
  if (!shouldFallbackToLocal()) return supabaseResult(new Set<string>(), supabaseConfigError || "Supabase community data is unavailable.");
  void userId;
  return fallbackResult(readCommunityIdSet(communityLikesStorageKey));
}

export async function getCommunityFavoriteIds(userId = communityCurrentUserId): Promise<CommunityRepositoryResult<Set<string>>> {
  if (canUseSupabaseCommunity()) {
    const result = await communitySupabase.getCommunityFavoriteIds();
    if (result.source === "supabase") return supabaseResult(result.data, result.error);
  }
  if (!shouldFallbackToLocal()) return supabaseResult(new Set<string>(), supabaseConfigError || "Supabase community data is unavailable.");
  void userId;
  return fallbackResult(readCommunityIdSet(communityFavoritesStorageKey));
}

export async function createContactRequest(input: CreateContactRequestInput): Promise<CommunityRepositoryResult<CommunityContactRequest | null>> {
  if (canUseSupabaseCommunity()) {
    const result = await communitySupabase.createContactRequest({
      contact: input.contact,
      fromName: input.fromName,
      message: input.message,
      postId: input.postId,
    });
    if (result.source === "supabase" && result.data) return supabaseResult(result.data, result.error);
    if (result.source === "supabase" && result.error) return supabaseResult(null, result.error);
  }
  if (!shouldFallbackToLocal()) return supabaseResult(null, supabaseConfigError || "Supabase community data is unavailable.");
  const post = fallbackPosts(true).find((item) => item.id === input.postId);
  const request: CommunityContactRequest = {
    id: createCommunityId("community-contact"),
    communityLocale: input.communityLocale || post?.communityLocale || "zh-cn",
    contact: input.contact,
    createdAt: formatCommunityNow(),
    fromName: input.fromName,
    fromUserId: input.fromUserId || communityLocalUserId,
    message: input.message,
    postId: input.postId,
    status: "pending",
    toUserId: input.toUserId || post?.authorId || communityCurrentUserId,
  };
  writeCommunityContactRequests([request, ...readCommunityContactRequests()].slice(0, 200));
  if (post && post.authorId !== request.fromUserId) {
    addLocalCommunityNotification(createCommunityNotification({
      communityLocale: request.communityLocale,
      message: `${request.fromName} 对你的「${post.title}」感兴趣。`,
      postId: post.id,
      targetId: request.id,
      targetType: "contact_request",
      title: "有人申请联系你",
      type: "contact_request",
      userId: request.toUserId || post.authorId || communityCurrentUserId,
    }));
  }
  return fallbackResult(request);
}

export async function getReceivedContactRequests(userId = communityCurrentUserId): Promise<CommunityRepositoryResult<CommunityContactRequest[]>> {
  if (canUseSupabaseCommunity()) {
    const result = await communitySupabase.getReceivedContactRequests();
    if (result.source === "supabase") return supabaseResult(result.data, result.error);
  }
  if (!shouldFallbackToLocal()) return supabaseResult([], supabaseConfigError || "Supabase community data is unavailable.");
  const posts = fallbackPosts(true);
  const requests = readCommunityContactRequests().filter((request) => request.toUserId === userId || posts.some((post) => post.id === request.postId && post.authorId === userId));
  return fallbackResult(requests);
}

export async function getSentContactRequests(userId = communityCurrentUserId): Promise<CommunityRepositoryResult<CommunityContactRequest[]>> {
  if (canUseSupabaseCommunity()) {
    const result = await communitySupabase.getMyContactRequests();
    if (result.source === "supabase") return supabaseResult(result.data, result.error);
  }
  if (!shouldFallbackToLocal()) return supabaseResult([], supabaseConfigError || "Supabase community data is unavailable.");
  return fallbackResult(readCommunityContactRequests().filter((request) => request.fromUserId === userId));
}

export async function updateContactRequestStatus(id: string, status: CommunityContactRequestStatus): Promise<CommunityRepositoryResult<CommunityContactRequest | null>> {
  if (canUseSupabaseCommunity()) {
    const result = await communitySupabase.updateContactRequestStatus(id, status);
    if (result.source === "supabase" && result.data) return supabaseResult(result.data, result.error);
  }
  if (!shouldFallbackToLocal()) return supabaseResult(null, supabaseConfigError || "Supabase community data is unavailable.");
  const requests = readCommunityContactRequests();
  const previous = requests.find((request) => request.id === id);
  if (!previous) return fallbackResult(null);
  const nextRequest = { ...previous, status };
  writeCommunityContactRequests(requests.map((request) => request.id === id ? nextRequest : request));
  return fallbackResult(nextRequest);
}

export async function createReport(input: CreateReportInput): Promise<CommunityRepositoryResult<CommunityReport | null>> {
  if (canUseSupabaseCommunity()) {
    const result = await communitySupabase.createCommunityReport({
      detail: input.detail,
      reason: input.reason,
      targetId: input.targetId,
      targetType: input.targetType,
    });
    if (result.source === "supabase" && result.data) return supabaseResult(result.data, result.error);
    if (result.source === "supabase" && result.error) return supabaseResult(null, result.error);
  }
  if (!shouldFallbackToLocal()) return supabaseResult(null, supabaseConfigError || "Supabase community data is unavailable.");
  const report: CommunityReport = {
    id: createCommunityId("community-report"),
    createdAt: formatCommunityNow(),
    detail: input.detail ?? "",
    reason: input.reason,
    status: "pending",
    targetId: input.targetId,
    targetType: input.targetType,
    userId: input.userId,
  };
  writeCommunityReports([report, ...readCommunityReports()].slice(0, 300));
  patchLocalReportTarget(input.targetType, input.targetId);
  return fallbackResult(report);
}

export async function getReports(): Promise<CommunityRepositoryResult<CommunityReport[]>> {
  if (canUseSupabaseCommunity()) {
    const result = await communitySupabase.getAllCommunityReports();
    if (result.source === "supabase") return supabaseResult(result.data, result.error);
  }
  if (!shouldFallbackToLocal()) return supabaseResult([], supabaseConfigError || "Supabase community data is unavailable.");
  return fallbackResult(readCommunityReports());
}

export async function getNotifications(userId = communityCurrentUserId): Promise<CommunityRepositoryResult<CommunityNotification[]>> {
  if (canUseSupabaseCommunity()) {
    const result = await communitySupabase.getNotifications();
    if (result.source === "supabase") return supabaseResult(result.data, result.error);
  }
  if (!shouldFallbackToLocal()) return supabaseResult([], supabaseConfigError || "Supabase community data is unavailable.");
  return fallbackResult(readCommunityNotifications().filter((notification) => notification.userId === userId));
}

export async function createNotification(input: CreateNotificationInput): Promise<CommunityRepositoryResult<CommunityNotification>> {
  const notification = createCommunityNotification(input);
  addLocalCommunityNotification(notification);
  return fallbackResult(notification);
}

export async function markNotificationRead(id: string, userId = communityCurrentUserId): Promise<CommunityRepositoryResult<boolean>> {
  if (canUseSupabaseCommunity()) {
    const result = await communitySupabase.markNotificationRead(id);
    if (result.source === "supabase") return supabaseResult(result.data, result.error);
  }
  if (!shouldFallbackToLocal()) return supabaseResult(false, supabaseConfigError || "Supabase community data is unavailable.");
  writeCommunityNotifications(readCommunityNotifications().map((notification) => notification.id === id && notification.userId === userId ? { ...notification, isRead: true } : notification));
  return fallbackResult(true);
}

export async function markAllNotificationsRead(userId = communityCurrentUserId): Promise<CommunityRepositoryResult<boolean>> {
  if (canUseSupabaseCommunity()) {
    const result = await communitySupabase.markAllNotificationsRead();
    if (result.source === "supabase") return supabaseResult(result.data, result.error);
  }
  if (!shouldFallbackToLocal()) return supabaseResult(false, supabaseConfigError || "Supabase community data is unavailable.");
  writeCommunityNotifications(readCommunityNotifications().map((notification) => notification.userId === userId ? { ...notification, isRead: true } : notification));
  return fallbackResult(true);
}

export async function getCommunityProfile(userId = communityCurrentUserId): Promise<CommunityRepositoryResult<CommunityUserProfile | null>> {
  if (canUseSupabaseCommunity()) {
    const result = await communitySupabase.getCommunityProfile(userId);
    if (result.source === "supabase" && result.data) return supabaseResult(result.data, result.error);
  }
  if (!shouldFallbackToLocal()) return supabaseResult(null, supabaseConfigError || "Supabase community data is unavailable.");
  const profile = userId === communityCurrentUserId ? readCommunityUserProfile() : getCommunityUser(userId) ?? null;
  return fallbackResult(profile);
}

export async function upsertCommunityProfile(input: CommunityUserProfile): Promise<CommunityRepositoryResult<CommunityUserProfile | null>> {
  if (canUseSupabaseCommunity()) {
    const result = await communitySupabase.upsertCommunityProfile(input);
    if (result.source === "supabase" && result.data) return supabaseResult(result.data, result.error);
    if (result.source === "supabase" && result.error) return supabaseResult(null, result.error);
  }
  if (!shouldFallbackToLocal()) return supabaseResult(null, supabaseConfigError || "Supabase community data is unavailable.");
  writeCommunityUserProfile(input);
  return fallbackResult(input);
}

export const getCurrentUser = communitySupabase.getCurrentUser;
export const getCommunityComments = getComments;
export const createCommunityComment = createComment;
export const toggleCommunityLike = toggleLike;
export const toggleCommunityFavorite = toggleFavorite;
export const createCommunityReport = createReport;
export const getAllCommunityReports = getReports;
export const getMyContactRequests = getSentContactRequests;
export const markAllCommunityNotificationsRead = markAllNotificationsRead;

function toggleLocalRelation(
  postId: string,
  userId: string,
  storageKey: string,
  countKey: "likes" | "favorites",
  aggregateKey: "likeCount" | "favoriteCount",
) {
  const ids = readCommunityIdSet(storageKey);
  const active = !ids.has(postId);
  if (active) ids.add(postId);
  else ids.delete(postId);
  writeCommunityIdSet(storageKey, ids);

  let nextCount = 0;
  patchLocalPost(postId, (post) => {
    nextCount = Math.max(0, Number(post[countKey] ?? 0) + (active ? 1 : -1));
    return { ...post, [countKey]: nextCount, [aggregateKey]: nextCount };
  });
  void userId;
  return fallbackResult({ active, count: nextCount });
}

function patchLocalPost(postId: string, updater: (post: CommunityPost) => CommunityPost) {
  const stored = readCommunityPosts();
  if (!stored.some((post) => post.id === postId)) return;
  writeCommunityPosts(stored.map((post) => post.id === postId ? updater(post) : post));
}

function patchLocalReportTarget(targetType: CommunityReportTargetType, targetId: string) {
  const reports = readCommunityReports();
  const reportCount = reports.filter((report) => report.targetType === targetType && report.targetId === targetId).length;
  if (targetType === "post") {
    patchLocalPost(targetId, (post) => ({
      ...post,
      reportCount,
      status: reportCount >= 3 ? "reported" : post.status,
    }));
    return;
  }
  if (targetType !== "comment") return;
  const comments = readCommunityComments();
  if (!comments.some((comment) => comment.id === targetId)) return;
  const nextStatus: CommunityCommentStatus | undefined = reportCount >= 3 ? "reported" : undefined;
  writeCommunityComments(comments.map((comment) => comment.id === targetId ? {
    ...comment,
    reportCount,
    status: nextStatus ?? comment.status,
  } : comment));
}

function parseCommunityTime(value: string) {
  const match = value.match(/^(\d{2})\/(\d{2})\s+(\d{2}):(\d{2})$/);
  if (!match) return Date.parse(value) || 0;
  const [, month, day, hour, minute] = match;
  return new Date(2026, Number(month) - 1, Number(day), Number(hour), Number(minute)).getTime();
}
