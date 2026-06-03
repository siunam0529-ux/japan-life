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
  readCommunityIdSet,
  readCommunityNotifications,
  readCommunityPosts,
  readCommunityReports,
  readCommunityUserProfile,
  readCommunityUsers,
  writeCommunityComments,
  writeCommunityIdSet,
  writeCommunityNotifications,
  writeCommunityPosts,
  writeCommunityReports,
  writeCommunityUserProfile,
} from "@/lib/community/storage";
import {
  type CommunityComment,
  type CommunityCommentStatus,
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
import { supabase, supabaseConfigError } from "@/lib/supabase";

export {
  mapCommentFromDb,
  mapPostFromDb,
  mapReportFromDb,
} from "@/lib/community/supabase";

export type {
  CommunityCommentRow,
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
  readCommunityIdSet,
  readCommunityNotifications,
  readCommunityPosts,
  readCommunityReports,
  readCommunityUserProfile,
  readCommunityUsers,
  writeCommunityComments,
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

const communityUnavailableMessage = "Community data is unavailable. Check Supabase connection.";
const communityRequestTimeoutMs = 8000;

function canUseSupabaseCommunity() {
  return canUseCommunitySupabase();
}

function shouldFallbackToLocal() {
  return shouldUseCommunityLocalFallback();
}

export function getCommunityRepositoryMode() {
  return {
    dataMode: getCommunityDataMode(),
    error: canUseSupabaseCommunity() ? "" : supabaseConfigError || "Supabase is not configured.",
    source: canUseSupabaseCommunity() ? "supabase" as const : "fallback" as const,
  };
}

function fallbackResult<T>(data: T, error = ""): CommunityRepositoryResult<T> {
  if (error) console.warn("[community:repository] local mode", error);
  return { data, error, source: "fallback" };
}

function supabaseResult<T>(data: T, error = ""): CommunityRepositoryResult<T> {
  return { data, error, source: "supabase" };
}

function unavailableResult<T>(data: T, error = supabaseConfigError || communityUnavailableMessage): CommunityRepositoryResult<T> {
  return supabaseResult(data, error);
}

async function getCommunityAuthHeaders(extraHeaders?: HeadersInit) {
  const headers = new Headers(extraHeaders);
  if (supabase && !headers.has("authorization")) {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token ?? "";
    if (token) headers.set("authorization", `Bearer ${token}`);
  }
  return headers;
}

async function fetchCommunityJson<T>(url: string, init?: RequestInit): Promise<{ data: T | null; error: string; ok: boolean }> {
  if (typeof window === "undefined") return { data: null, error: "Browser API route fetch is unavailable.", ok: false };
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), communityRequestTimeoutMs);
  try {
    const response = await fetch(url, { ...init, headers: await getCommunityAuthHeaders(init?.headers), signal: controller.signal });
    const data = (await response.json().catch(() => null)) as T | null;
    const error = data && typeof data === "object" && "error" in data ? String((data as { error?: unknown }).error || "") : "";
    return { data, error, ok: response.ok };
  } catch (error) {
    const message = error instanceof DOMException && error.name === "AbortError" ? "社区详情加载超时，请刷新后再试。" : error instanceof Error ? error.message : "社区详情加载失败。";
    return { data: null, error: message, ok: false };
  } finally {
    window.clearTimeout(timeout);
  }
}

function filterPosts(posts: CommunityPost[], options: GetCommunityPostsOptions = {}) {
  const statuses = Array.isArray(options.status) ? options.status : options.status ? [options.status] : ["published"];
  return posts
    .filter((post) => options.locale && options.locale !== "all" ? post.communityLocale === options.locale : true)
    .filter((post) => options.authorId ? post.authorId === options.authorId || post.authorId === readCommunityUserProfile().accountId : true)
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
  if (!shouldFallbackToLocal()) return unavailableResult([]);
  return fallbackResult(filterPosts(readCommunityPosts(), options));
}

export async function getCommunityPostById(id: string, locale: CommunityViewLocale = "all"): Promise<CommunityRepositoryResult<CommunityPost | null>> {
  if (canUseSupabaseCommunity()) {
    if (typeof window !== "undefined") {
      const result = await fetchCommunityJson<{ error?: string; item?: CommunityPost | null }>(`/api/community/posts/${encodeURIComponent(id)}`);
      if (result.ok) return supabaseResult(result.data?.item ?? null, result.error);
      return supabaseResult(null, result.error || communityUnavailableMessage);
    }
    const result = await communitySupabase.getCommunityPostById(id, locale);
    if (result.source === "supabase") return supabaseResult(result.data, result.error);
  }
  if (!shouldFallbackToLocal()) return unavailableResult(null);
  const post = readCommunityPosts().find((item) => item.id === id && item.status === "published" && (locale === "all" || item.communityLocale === locale)) ?? null;
  return fallbackResult(post);
}

export async function createCommunityPost(input: CommunityPost): Promise<CommunityRepositoryResult<CommunityPost | null>> {
  if (!isCommunityLocale(input.communityLocale)) return supabaseResult(null, "Invalid community locale.");
  if (canUseSupabaseCommunity()) {
    const result = await communitySupabase.createCommunityPost(input);
    if (result.source === "supabase") return supabaseResult(result.data, result.error);
  }
  if (!shouldFallbackToLocal()) return unavailableResult(null);
  writeCommunityPosts([input, ...readCommunityPosts(input.communityLocale)].slice(0, 100));
  return fallbackResult(input);
}

export async function updateCommunityPost(id: string, input: Partial<CommunityPost>): Promise<CommunityRepositoryResult<CommunityPost | null>> {
  if (canUseSupabaseCommunity()) {
    if (typeof window !== "undefined") {
      const result = await fetchCommunityJson<{ error?: string; item?: CommunityPost | null }>(`/api/community/posts/${encodeURIComponent(id)}`, {
        body: JSON.stringify(input),
        headers: { "content-type": "application/json" },
        method: "PATCH",
      });
      if (result.ok) return supabaseResult(result.data?.item ?? null, result.error);
      return supabaseResult(null, result.error || communityUnavailableMessage);
    }
    const result = await communitySupabase.updateCommunityPost(id, input);
    if (result.source === "supabase") return supabaseResult(result.data, result.error);
  }
  if (!shouldFallbackToLocal()) return unavailableResult(null);
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
  if (!shouldFallbackToLocal()) return unavailableResult([]);
  const comments = readCommunityComments()
    .filter((comment) => comment.postId === postId)
    .filter((comment) => includeAllStatuses || comment.status === "published")
    .sort((left, right) => parseCommunityTime(right.createdAt) - parseCommunityTime(left.createdAt));
  return fallbackResult(comments);
}

export async function getCommentsByAuthor(authorId: string, includeAllStatuses = false): Promise<CommunityRepositoryResult<CommunityComment[]>> {
  if (canUseSupabaseCommunity()) {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams();
      if (authorId) params.set("authorId", authorId);
      if (includeAllStatuses) params.set("includeAllStatuses", "1");
      const query = params.toString();
      const result = await fetchCommunityJson<{ error?: string; items?: CommunityComment[] }>(`/api/community/comments${query ? `?${query}` : ""}`);
      if (result.ok) return supabaseResult(result.data?.items ?? [], result.error);
      return supabaseResult([], result.error || communityUnavailableMessage);
    }
    const result = await communitySupabase.getCommunityCommentsByAuthor(authorId, includeAllStatuses);
    if (result.source === "supabase") return supabaseResult(result.data, result.error);
  }
  if (!shouldFallbackToLocal()) return unavailableResult([]);
  const comments = readCommunityComments()
    .filter((comment) => comment.authorId === authorId)
    .filter((comment) => includeAllStatuses || comment.status === "published")
    .sort((left, right) => parseCommunityTime(right.createdAt) - parseCommunityTime(left.createdAt));
  return fallbackResult(comments);
}

export async function createComment(input: CreateCommentInput): Promise<CommunityRepositoryResult<CommunityComment | null>> {
  if (canUseSupabaseCommunity()) {
    if (typeof window !== "undefined") {
      const result = await fetchCommunityJson<{ count?: number; error?: string; item?: CommunityComment | null }>("/api/community/comments", {
        body: JSON.stringify({
          communityLocale: input.communityLocale,
          content: input.content,
          parentId: input.parentId,
          postId: input.postId,
        }),
        headers: { "content-type": "application/json" },
        method: "POST",
      });
      if (result.ok) return supabaseResult(result.data?.item ?? null, result.error);
      return supabaseResult(null, result.error || communityUnavailableMessage);
    }
    const result = await communitySupabase.createCommunityComment({
      authorId: input.authorId,
      authorName: input.authorName,
      communityLocale: input.communityLocale,
      content: input.content,
      isAnonymous: input.isAnonymous ?? false,
      parentId: input.parentId,
      postId: input.postId,
    });
    if (result.source === "supabase") return supabaseResult(result.data, result.error);
  }
  if (!shouldFallbackToLocal()) return unavailableResult(null);
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
  const post = readCommunityPosts().find((item) => item.id === input.postId);
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

export async function softDeleteComment(id: string, postId?: string): Promise<CommunityRepositoryResult<boolean>> {
  if (canUseSupabaseCommunity()) {
    if (typeof window !== "undefined") {
      const result = await fetchCommunityJson<{ error?: string; ok?: boolean }>("/api/community/comments", {
        body: JSON.stringify({ id, postId }),
        headers: { "content-type": "application/json" },
        method: "DELETE",
      });
      if (result.ok) return supabaseResult(Boolean(result.data?.ok ?? true), result.error);
      return supabaseResult(false, result.error || communityUnavailableMessage);
    }
    const result = await communitySupabase.updateCommunityCommentStatus(id, "deleted");
    if (result.source === "supabase") return supabaseResult(Boolean(result.data), result.error);
  }
  if (!shouldFallbackToLocal()) return unavailableResult(false);
  const comments = readCommunityComments();
  const exists = comments.some((comment) => comment.id === id);
  if (!exists) return fallbackResult(false);
  writeCommunityComments(comments.map((comment) => comment.id === id || comment.parentId === id ? { ...comment, status: "deleted" } : comment));
  const comment = comments.find((item) => item.id === id);
  if (comment) patchLocalPost(comment.postId, (post) => ({ ...post, commentCount: Math.max(0, Number(post.commentCount ?? post.comments ?? 0) - 1), comments: Math.max(0, Number(post.comments ?? 0) - 1) }));
  return fallbackResult(true);
}

export async function toggleCommentLike(commentId: string, userId = communityCurrentUserId): Promise<CommunityRepositoryResult<{ active: boolean; count: number } | null>> {
  if (canUseSupabaseCommunity()) {
    if (typeof window !== "undefined") {
      const result = await fetchCommunityJson<{ active?: boolean; count?: number; error?: string }>("/api/community/comment-reactions", {
        body: JSON.stringify({ commentId }),
        headers: { "content-type": "application/json" },
        method: "POST",
      });
      if (result.ok && typeof result.data?.active === "boolean" && typeof result.data.count === "number") {
        return supabaseResult({ active: result.data.active, count: result.data.count }, result.error);
      }
      return supabaseResult(null, result.error || communityUnavailableMessage);
    }
    return unavailableResult(null);
  }
  if (!shouldFallbackToLocal()) return unavailableResult(null);
  const storageKey = "japan-life-community-comment-likes";
  const ids = readCommunityIdSet(storageKey);
  const active = !ids.has(commentId);
  if (active) ids.add(commentId);
  else ids.delete(commentId);
  writeCommunityIdSet(storageKey, ids);

  let nextCount = 0;
  const comments = readCommunityComments();
  writeCommunityComments(comments.map((comment) => {
    if (comment.id !== commentId) return comment;
    nextCount = Math.max(0, Number(comment.likeCount ?? 0) + (active ? 1 : -1));
    return { ...comment, likeCount: nextCount };
  }));
  void userId;
  return fallbackResult({ active, count: nextCount });
}

export async function getCommunityCommentLikeIds(postId?: string): Promise<CommunityRepositoryResult<Set<string>>> {
  if (canUseSupabaseCommunity()) {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams();
      if (postId) params.set("postId", postId);
      const query = params.toString();
      const result = await fetchCommunityJson<{ error?: string; ids?: string[] }>(`/api/community/comment-reactions${query ? `?${query}` : ""}`);
      if (result.ok) return supabaseResult(new Set(result.data?.ids ?? []), result.error);
      return supabaseResult(new Set<string>(), result.error || communityUnavailableMessage);
    }
    return unavailableResult(new Set<string>());
  }
  if (!shouldFallbackToLocal()) return unavailableResult(new Set<string>());
  return fallbackResult(readCommunityIdSet("japan-life-community-comment-likes"));
}

export async function toggleLike(postId: string, userId = communityCurrentUserId): Promise<CommunityRepositoryResult<{ active: boolean; count: number } | null>> {
  if (canUseSupabaseCommunity()) {
    if (typeof window !== "undefined") {
      const result = await fetchCommunityJson<{ active?: boolean; count?: number; error?: string }>("/api/community/reactions", {
        body: JSON.stringify({ postId, type: "like" }),
        headers: { "content-type": "application/json" },
        method: "POST",
      });
      if (result.ok && typeof result.data?.active === "boolean" && typeof result.data.count === "number") {
        return supabaseResult({ active: result.data.active, count: result.data.count }, result.error);
      }
      return supabaseResult(null, result.error || communityUnavailableMessage);
    }
    const result = await communitySupabase.toggleCommunityLike(postId);
    if (result.source === "supabase") return supabaseResult(result.data, result.error);
  }
  if (!shouldFallbackToLocal()) return unavailableResult(null);
  return toggleLocalRelation(postId, userId, communityLikesStorageKey, "likes", "likeCount");
}

export async function toggleFavorite(postId: string, userId = communityCurrentUserId): Promise<CommunityRepositoryResult<{ active: boolean; count: number } | null>> {
  if (canUseSupabaseCommunity()) {
    if (typeof window !== "undefined") {
      const result = await fetchCommunityJson<{ active?: boolean; count?: number; error?: string }>("/api/community/reactions", {
        body: JSON.stringify({ postId, type: "favorite" }),
        headers: { "content-type": "application/json" },
        method: "POST",
      });
      if (result.ok && typeof result.data?.active === "boolean" && typeof result.data.count === "number") {
        return supabaseResult({ active: result.data.active, count: result.data.count }, result.error);
      }
      return supabaseResult(null, result.error || communityUnavailableMessage);
    }
    const result = await communitySupabase.toggleCommunityFavorite(postId);
    if (result.source === "supabase") return supabaseResult(result.data, result.error);
  }
  if (!shouldFallbackToLocal()) return unavailableResult(null);
  return toggleLocalRelation(postId, userId, communityFavoritesStorageKey, "favorites", "favoriteCount");
}

export async function getCommunityLikeIds(userId = communityCurrentUserId): Promise<CommunityRepositoryResult<Set<string>>> {
  if (canUseSupabaseCommunity()) {
    if (typeof window !== "undefined") {
      const result = await fetchCommunityJson<{ error?: string; ids?: string[] }>("/api/community/reactions?type=like");
      if (result.ok) return supabaseResult(new Set(result.data?.ids ?? []), result.error);
      return supabaseResult(new Set<string>(), result.error || communityUnavailableMessage);
    }
    const result = await communitySupabase.getCommunityLikeIds();
    if (result.source === "supabase") return supabaseResult(result.data, result.error);
  }
  if (!shouldFallbackToLocal()) return unavailableResult(new Set<string>());
  void userId;
  return fallbackResult(readCommunityIdSet(communityLikesStorageKey));
}

export async function getCommunityFavoriteIds(userId = communityCurrentUserId): Promise<CommunityRepositoryResult<Set<string>>> {
  if (canUseSupabaseCommunity()) {
    if (typeof window !== "undefined") {
      const result = await fetchCommunityJson<{ error?: string; ids?: string[] }>("/api/community/reactions?type=favorite");
      if (result.ok) return supabaseResult(new Set(result.data?.ids ?? []), result.error);
      return supabaseResult(new Set<string>(), result.error || communityUnavailableMessage);
    }
    const result = await communitySupabase.getCommunityFavoriteIds();
    if (result.source === "supabase") return supabaseResult(result.data, result.error);
  }
  if (!shouldFallbackToLocal()) return unavailableResult(new Set<string>());
  void userId;
  return fallbackResult(readCommunityIdSet(communityFavoritesStorageKey));
}

export async function createReport(input: CreateReportInput): Promise<CommunityRepositoryResult<CommunityReport | null>> {
  if (canUseSupabaseCommunity()) {
    if (typeof window !== "undefined") {
      const result = await fetchCommunityJson<{ error?: string; item?: CommunityReport | null; reportCount?: number }>("/api/community/reports", {
        body: JSON.stringify({
          detail: input.detail,
          reason: input.reason,
          targetId: input.targetId,
          targetType: input.targetType,
        }),
        headers: { "content-type": "application/json" },
        method: "POST",
      });
      if (result.ok) return supabaseResult(result.data?.item ?? null, result.error);
      return supabaseResult(null, result.error || communityUnavailableMessage);
    }
    const result = await communitySupabase.createCommunityReport({
      detail: input.detail,
      reason: input.reason,
      targetId: input.targetId,
      targetType: input.targetType,
    });
    if (result.source === "supabase") return supabaseResult(result.data, result.error);
  }
  if (!shouldFallbackToLocal()) return unavailableResult(null);
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
  if (!shouldFallbackToLocal()) return unavailableResult([]);
  return fallbackResult(readCommunityReports());
}

export async function getNotifications(userId = communityCurrentUserId): Promise<CommunityRepositoryResult<CommunityNotification[]>> {
  if (canUseSupabaseCommunity()) {
    const result = await communitySupabase.getNotifications();
    if (result.source === "supabase") return supabaseResult(result.data, result.error);
  }
  if (!shouldFallbackToLocal()) return unavailableResult([]);
  return fallbackResult(readCommunityNotifications().filter((notification) => notification.userId === userId));
}

export async function createNotification(input: CreateNotificationInput): Promise<CommunityRepositoryResult<CommunityNotification>> {
  const notification = createCommunityNotification(input);
  if (canUseSupabaseCommunity()) {
    const result = await communitySupabase.createNotification(notification);
    if (result.source === "supabase" && result.data) return supabaseResult(result.data, result.error);
  }
  if (!shouldFallbackToLocal()) return unavailableResult(notification);
  addLocalCommunityNotification(notification);
  return fallbackResult(notification);
}

export async function markNotificationRead(id: string, userId = communityCurrentUserId): Promise<CommunityRepositoryResult<boolean>> {
  if (canUseSupabaseCommunity()) {
    const result = await communitySupabase.markNotificationRead(id);
    if (result.source === "supabase") return supabaseResult(result.data, result.error);
  }
  if (!shouldFallbackToLocal()) return unavailableResult(false);
  writeCommunityNotifications(readCommunityNotifications().map((notification) => notification.id === id && notification.userId === userId ? { ...notification, isRead: true } : notification));
  return fallbackResult(true);
}

export async function markAllNotificationsRead(userId = communityCurrentUserId): Promise<CommunityRepositoryResult<boolean>> {
  if (canUseSupabaseCommunity()) {
    const result = await communitySupabase.markAllNotificationsRead();
    if (result.source === "supabase") return supabaseResult(result.data, result.error);
  }
  if (!shouldFallbackToLocal()) return unavailableResult(false);
  writeCommunityNotifications(readCommunityNotifications().map((notification) => notification.userId === userId ? { ...notification, isRead: true } : notification));
  return fallbackResult(true);
}

export async function getCommunityProfile(userId = communityCurrentUserId): Promise<CommunityRepositoryResult<CommunityUserProfile | null>> {
  if (canUseSupabaseCommunity()) {
    const result = await communitySupabase.getCommunityProfile(userId);
    if (result.source === "supabase") return supabaseResult(result.data, result.error);
  }
  if (!shouldFallbackToLocal()) return unavailableResult(null);
  const profile = userId === communityCurrentUserId ? readCommunityUserProfile() : getCommunityUser(userId) ?? null;
  return fallbackResult(profile);
}

export async function upsertCommunityProfile(input: CommunityUserProfile): Promise<CommunityRepositoryResult<CommunityUserProfile | null>> {
  if (canUseSupabaseCommunity()) {
    const result = await communitySupabase.upsertCommunityProfile(input);
    if (result.source === "supabase") return supabaseResult(result.data, result.error);
  }
  if (!shouldFallbackToLocal()) return unavailableResult(null);
  writeCommunityUserProfile(input);
  return fallbackResult(input);
}

export const getCurrentUser = communitySupabase.getCurrentUser;
export const getCommunityComments = getComments;
export const getCommunityCommentsByAuthor = getCommentsByAuthor;
export const createCommunityComment = createComment;
export const toggleCommunityCommentLike = toggleCommentLike;
export const toggleCommunityLike = toggleLike;
export const toggleCommunityFavorite = toggleFavorite;
export const createCommunityReport = createReport;
export const getAllCommunityReports = getReports;
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
