import type { User } from "@supabase/supabase-js";
import { supabase, supabaseConfigError } from "@/lib/supabase";
import {
  communityCommentStatuses,
  communityContactRequestStatuses,
  communityLocales,
  communityNotificationTargetTypes,
  communityNotificationTypes,
  communityPostStatuses,
  communityPostTypes,
  communityReportStatuses,
  hasCommunityRiskKeyword,
  isCommunityLocale,
  isCommunityViewLocale,
  type CommunityComment,
  type CommunityCommentStatus,
  type CommunityContactRequest,
  type CommunityContactRequestStatus,
  type CommunityLocale,
  type CommunityNotification,
  type CommunityNotificationTargetType,
  type CommunityNotificationType,
  type CommunityPost,
  type CommunityPostImage,
  type CommunityPostStatus,
  type CommunityPostType,
  type CommunityReport,
  type CommunityReportStatus,
  type CommunityReportTargetType,
  type CommunityUserProfile,
  type CommunityViewLocale,
} from "@/lib/community/types";

export const USE_SUPABASE_COMMUNITY = true;

type CommunitySource = "supabase" | "fallback";

export type CommunityDataResult<T> = {
  data: T;
  error: string;
  source: CommunitySource;
};

export type CommunityPostRow = {
  id: string;
  user_id?: string | null;
  author_id?: string | null;
  community_locale: string;
  type: string;
  title: string;
  content: string;
  area: string;
  author_name: string | null;
  is_anonymous: boolean | null;
  images: unknown;
  tags: string[] | null;
  status: string;
  like_count: number | null;
  comment_count: number | null;
  favorite_count: number | null;
  report_count: number | null;
  is_solved: boolean | null;
  featured?: boolean | null;
  is_featured?: boolean | null;
  is_pinned?: boolean | null;
  is_official_recommended?: boolean | null;
  featured_reason?: string | null;
  pinned_until?: string | null;
  price: string | null;
  item_status: string | null;
  condition: string | null;
  pickup_method: string | null;
  buddy_type: string | null;
  people: string | null;
  budget: string | null;
  helper_category: string | null;
  help_category: string | null;
  share_category: string | null;
  time: string | null;
  created_at: string;
  updated_at: string | null;
};

export type CommunityCommentRow = {
  id: string;
  post_id: string;
  user_id?: string | null;
  author_id?: string | null;
  parent_id: string | null;
  community_locale?: string | null;
  author_name: string | null;
  content: string;
  is_anonymous: boolean | null;
  status: string;
  like_count: number | null;
  report_count: number | null;
  created_at: string;
  updated_at: string | null;
};

export type CommunityContactRequestRow = {
  id: string;
  post_id: string;
  from_user_id: string;
  to_user_id: string;
  community_locale?: string | null;
  from_name: string | null;
  message: string;
  contact: string;
  status: string | null;
  created_at: string;
};

export type CommunityReportRow = {
  id: string;
  user_id: string;
  target_type: string;
  target_id: string;
  reason: string;
  detail: string | null;
  status: string | null;
  created_at: string;
};

export type CommunityNotificationRow = {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  target_type: string | null;
  target_id: string | null;
  post_id: string | null;
  community_locale: string | null;
  is_read: boolean | null;
  created_at: string;
};

export type CommunityProfileRow = {
  id: string;
  user_id?: string | null;
  display_name: string | null;
  avatar: string | null;
  bio: string | null;
  area: string | null;
  languages: string[] | null;
  interests: string[] | null;
  is_anonymous_default: boolean | null;
  created_at: string;
  updated_at: string | null;
};

type GetCommunityPostsOptions = {
  authorId?: string;
  includeAllStatuses?: boolean;
  limit?: number;
  locale?: CommunityViewLocale;
  status?: CommunityPostStatus | CommunityPostStatus[];
  tag?: string;
};

type CreateCommentInput = {
  authorId?: string;
  authorName: string;
  communityLocale: CommunityLocale;
  content: string;
  isAnonymous: boolean;
  parentId?: string;
  postId: string;
};

type CreateContactRequestInput = {
  contact: string;
  fromName: string;
  message: string;
  postId: string;
};

type CreateReportInput = {
  detail?: string;
  reason: string;
  targetId: string;
  targetType: CommunityReportTargetType;
};

const loginRequiredMessage = "请先登录后再使用社区功能。";
const submitFailedMessage = "提交失败，请稍后再试。";
let hasWarnedCommunityFallback = false;

function canUseSupabaseCommunity() {
  return USE_SUPABASE_COMMUNITY && Boolean(supabase);
}

function fallbackResult<T>(data: T, error = supabaseConfigError || "Supabase is not configured."): CommunityDataResult<T> {
  if (supabaseConfigError) warnCommunityFallback(supabaseConfigError);
  return { data, error, source: "fallback" };
}

function supabaseResult<T>(data: T, error = ""): CommunityDataResult<T> {
  return { data, error, source: "supabase" };
}

function warnCommunityError(action: string, error: unknown) {
  console.warn(`[community:supabase] ${action}`, error);
}

function warnCommunityFallback(error: unknown) {
  if (hasWarnedCommunityFallback) return;
  hasWarnedCommunityFallback = true;
  console.warn("[community:supabase] fallback to localStorage/mock data", error);
}

function isCommunityPostType(value: string): value is CommunityPostType {
  return communityPostTypes.some((item) => item.id === value);
}

function isCommunityPostStatusValue(value: string): value is CommunityPostStatus {
  return communityPostStatuses.includes(value as CommunityPostStatus);
}

function isCommunityCommentStatusValue(value: string): value is CommunityCommentStatus {
  return communityCommentStatuses.includes(value as CommunityCommentStatus);
}

function isCommunityContactRequestStatusValue(value: string): value is CommunityContactRequestStatus {
  return communityContactRequestStatuses.includes(value as CommunityContactRequestStatus);
}

function isCommunityReportStatusValue(value: string): value is CommunityReportStatus {
  return communityReportStatuses.includes(value as CommunityReportStatus);
}

function isCommunityNotificationTypeValue(value: string): value is CommunityNotificationType {
  return communityNotificationTypes.includes(value as CommunityNotificationType);
}

function isCommunityNotificationTargetTypeValue(value: string): value is CommunityNotificationTargetType {
  return communityNotificationTargetTypes.includes(value as CommunityNotificationTargetType);
}

function isCommunityReportTargetTypeValue(value: string): value is CommunityReportTargetType {
  return value === "post" || value === "comment" || value === "user";
}

function cleanObject(input: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(input).filter(([, value]) => value !== undefined));
}

function normalizeStringList(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function normalizeImages(value: unknown): CommunityPostImage[] {
  return Array.isArray(value) ? (value as CommunityPostImage[]) : [];
}

function formatCommunityTimestamp(value: string | null | undefined) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");
  return `${month}/${day} ${hour}:${minute}`;
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function getUserDisplayName(user: User) {
  const metadata = user.user_metadata as Record<string, unknown> | null;
  const candidates = [metadata?.display_name, metadata?.name, metadata?.full_name, user.email?.split("@")[0]];
  return candidates.find((value): value is string => typeof value === "string" && Boolean(value.trim()))?.trim() ?? "Japan Life User";
}

async function requireCommunityUser(): Promise<CommunityDataResult<User | null>> {
  if (!canUseSupabaseCommunity() || !supabase) return fallbackResult<User | null>(null);
  const { data, error } = await supabase.auth.getUser();
  if (error) {
    warnCommunityError("get user", error);
    return supabaseResult<User | null>(null, loginRequiredMessage);
  }
  if (!data.user) return supabaseResult<User | null>(null, loginRequiredMessage);
  return supabaseResult(data.user);
}

export async function getCurrentUser() {
  if (!canUseSupabaseCommunity() || !supabase) return fallbackResult<User | null>(null);
  const { data, error } = await supabase.auth.getUser();
  if (error) {
    warnCommunityError("get current user", error);
    return supabaseResult<User | null>(null, error.message);
  }
  return supabaseResult<User | null>(data.user ?? null);
}

export function mapPostFromDb(row: CommunityPostRow): CommunityPost {
  const locale = isCommunityLocale(row.community_locale) ? row.community_locale : "zh-cn";
  const type = isCommunityPostType(row.type) ? row.type : "share";
  const status = isCommunityPostStatusValue(row.status) ? row.status : "published";
  return {
    id: row.id,
    area: row.area,
    authorId: row.author_id || row.user_id || "",
    authorName: row.author_name || "Japan Life User",
    buddyType: row.buddy_type ?? undefined,
    budget: row.budget ?? undefined,
    commentCount: Number(row.comment_count ?? 0),
    comments: Number(row.comment_count ?? 0),
    communityLocale: locale,
    condition: row.condition ?? undefined,
    content: row.content,
    createdAt: formatCommunityTimestamp(row.created_at),
    favoriteCount: Number(row.favorite_count ?? 0),
    favorites: Number(row.favorite_count ?? 0),
    featured: Boolean(row.featured || row.is_featured),
    featuredReason: row.featured_reason ?? undefined,
    helpCategory: row.help_category ?? undefined,
    helperCategory: row.helper_category ?? undefined,
    images: normalizeImages(row.images),
    isAnonymous: Boolean(row.is_anonymous),
    isFeatured: Boolean(row.is_featured || row.featured),
    isOfficialRecommended: Boolean(row.is_official_recommended),
    isPinned: Boolean(row.is_pinned),
    isSolved: Boolean(row.is_solved),
    itemStatus: row.item_status ?? undefined,
    likeCount: Number(row.like_count ?? 0),
    likes: Number(row.like_count ?? 0),
    people: row.people ?? undefined,
    pickupMethod: row.pickup_method ?? undefined,
    pinnedUntil: row.pinned_until ?? null,
    price: row.price ?? undefined,
    reportCount: Number(row.report_count ?? 0),
    shareCategory: row.share_category ?? undefined,
    status,
    tags: normalizeStringList(row.tags),
    time: row.time ?? undefined,
    title: row.title,
    type,
    updatedAt: formatCommunityTimestamp(row.updated_at),
  };
}

export function mapPostToDb(input: Partial<CommunityPost>, userId: string) {
  return cleanObject({
    author_id: input.authorId || userId,
    community_locale: input.communityLocale && isCommunityLocale(input.communityLocale) ? input.communityLocale : undefined,
    type: input.type,
    title: input.title,
    content: input.content,
    area: input.area,
    author_name: input.authorName,
    is_anonymous: input.isAnonymous,
    images: input.images ?? [],
    tags: input.tags ?? [],
    status: input.status ?? "published",
    like_count: input.likeCount ?? input.likes,
    comment_count: input.commentCount ?? input.comments,
    favorite_count: input.favoriteCount ?? input.favorites,
    report_count: input.reportCount,
    is_solved: input.isSolved,
    featured: input.featured,
    is_featured: input.isFeatured,
    is_pinned: input.isPinned,
    is_official_recommended: input.isOfficialRecommended,
    featured_reason: input.featuredReason,
    pinned_until: input.pinnedUntil,
    price: input.price,
    item_status: input.itemStatus,
    condition: input.condition,
    pickup_method: input.pickupMethod,
    buddy_type: input.buddyType,
    people: input.people,
    budget: input.budget,
    helper_category: input.helperCategory,
    help_category: input.helpCategory,
    share_category: input.shareCategory,
    time: input.time,
  });
}

export function mapCommentFromDb(row: CommunityCommentRow): CommunityComment {
  return {
    id: row.id,
    authorId: row.author_id || row.user_id || "",
    authorName: row.author_name || "Japan Life User",
    communityLocale: isCommunityLocale(String(row.community_locale ?? "")) ? row.community_locale as CommunityLocale : "zh-cn",
    content: row.content,
    createdAt: formatCommunityTimestamp(row.created_at),
    isAnonymous: Boolean(row.is_anonymous),
    likeCount: Number(row.like_count ?? 0),
    parentId: row.parent_id ?? undefined,
    postId: row.post_id,
    reportCount: Number(row.report_count ?? 0),
    status: isCommunityCommentStatusValue(row.status) ? row.status : "published",
  };
}

export function mapContactRequestFromDb(row: CommunityContactRequestRow): CommunityContactRequest {
  return {
    id: row.id,
    communityLocale: isCommunityLocale(String(row.community_locale ?? "")) ? row.community_locale as CommunityLocale : "zh-cn",
    contact: row.contact,
    createdAt: formatCommunityTimestamp(row.created_at),
    fromName: row.from_name || "Japan Life User",
    fromUserId: row.from_user_id,
    message: row.message,
    postId: row.post_id,
    status: isCommunityContactRequestStatusValue(String(row.status ?? "")) ? row.status as CommunityContactRequestStatus : "pending",
    toUserId: row.to_user_id,
  };
}

export function mapReportFromDb(row: CommunityReportRow): CommunityReport {
  return {
    id: row.id,
    createdAt: formatCommunityTimestamp(row.created_at),
    detail: row.detail ?? "",
    reason: row.reason,
    status: isCommunityReportStatusValue(String(row.status ?? "")) ? row.status as CommunityReportStatus : "pending",
    targetId: row.target_id,
    targetType: isCommunityReportTargetTypeValue(row.target_type) ? row.target_type : "post",
    userId: row.user_id,
  };
}

export function mapNotificationFromDb(row: CommunityNotificationRow): CommunityNotification {
  return {
    id: row.id,
    communityLocale: isCommunityLocale(String(row.community_locale ?? "")) ? row.community_locale as CommunityLocale : "zh-cn",
    createdAt: formatCommunityTimestamp(row.created_at),
    isRead: Boolean(row.is_read),
    message: row.message,
    postId: row.post_id ?? undefined,
    targetId: row.target_id ?? undefined,
    targetType: isCommunityNotificationTargetTypeValue(String(row.target_type ?? "")) ? row.target_type as CommunityNotificationTargetType : undefined,
    title: row.title,
    type: isCommunityNotificationTypeValue(row.type) ? row.type : "system",
    userId: row.user_id,
  };
}

export function mapProfileFromDb(row: CommunityProfileRow): CommunityUserProfile {
  return {
    id: row.user_id || row.id,
    area: row.area || "东京",
    avatar: row.avatar || "linear-gradient(135deg, #60a5fa, #f9a8d4)",
    bio: row.bio || "",
    commentReceivedCount: 0,
    displayName: row.display_name || "Japan Life User",
    favoriteReceivedCount: 0,
    interests: normalizeStringList(row.interests),
    isAnonymousDefault: Boolean(row.is_anonymous_default),
    joinedAt: formatCommunityTimestamp(row.created_at).slice(0, 5) || "",
    languages: normalizeStringList(row.languages),
    likeReceivedCount: 0,
    postCount: 0,
  };
}

export async function getCommunityPosts(options: GetCommunityPostsOptions = {}): Promise<CommunityDataResult<CommunityPost[]>> {
  if (!canUseSupabaseCommunity() || !supabase) return fallbackResult<CommunityPost[]>([]);
  try {
    let query = supabase.from("community_posts").select("*").order("created_at", { ascending: false });
    if (options.locale && isCommunityViewLocale(options.locale) && options.locale !== "all") query = query.eq("community_locale", options.locale);
    if (options.authorId) query = query.eq("author_id", options.authorId);
    if (options.tag) query = query.contains("tags", [options.tag]);
    if (!options.includeAllStatuses) {
      if (Array.isArray(options.status)) query = query.in("status", options.status);
      else query = query.eq("status", options.status ?? "published");
    }
    if (options.limit) query = query.limit(options.limit);
    const { data, error } = await query;
    if (error) throw error;
    return supabaseResult(((data ?? []) as CommunityPostRow[]).map(mapPostFromDb));
  } catch (error) {
    warnCommunityError("get posts", error);
    return fallbackResult<CommunityPost[]>([], "社区数据加载失败，请稍后再试。");
  }
}

export async function getAllCommunityContactRequests(): Promise<CommunityDataResult<CommunityContactRequest[]>> {
  if (!canUseSupabaseCommunity() || !supabase) return fallbackResult<CommunityContactRequest[]>([]);
  try {
    const { data, error } = await supabase.from("community_contact_requests").select("*").order("created_at", { ascending: false });
    if (error) throw error;
    return supabaseResult(((data ?? []) as CommunityContactRequestRow[]).map(mapContactRequestFromDb));
  } catch (error) {
    warnCommunityError("get all contact requests", error);
    return fallbackResult<CommunityContactRequest[]>([]);
  }
}

export async function getAllCommunityReports(): Promise<CommunityDataResult<CommunityReport[]>> {
  if (!canUseSupabaseCommunity() || !supabase) return fallbackResult<CommunityReport[]>([]);
  try {
    const { data, error } = await supabase.from("community_reports").select("*").order("created_at", { ascending: false });
    if (error) throw error;
    return supabaseResult(((data ?? []) as CommunityReportRow[]).map(mapReportFromDb));
  } catch (error) {
    warnCommunityError("get all reports", error);
    return fallbackResult<CommunityReport[]>([]);
  }
}

export async function getCommunityPostById(id: string, locale: CommunityViewLocale = "all"): Promise<CommunityDataResult<CommunityPost | null>> {
  if (!canUseSupabaseCommunity() || !supabase || !isUuid(id)) return fallbackResult<CommunityPost | null>(null);
  try {
    const { data, error } = await supabase.from("community_posts").select("*").eq("id", id).maybeSingle();
    if (error) throw error;
    if (!data) return supabaseResult<CommunityPost | null>(null);
    const post = mapPostFromDb(data as CommunityPostRow);
    if (post.status !== "published" || (locale !== "all" && post.communityLocale !== locale)) return supabaseResult<CommunityPost | null>(null);
    return supabaseResult(post);
  } catch (error) {
    warnCommunityError("get post", error);
    return fallbackResult<CommunityPost | null>(null, "社区数据加载失败，请稍后再试。");
  }
}

export async function createCommunityPost(input: CommunityPost): Promise<CommunityDataResult<CommunityPost | null>> {
  if (!canUseSupabaseCommunity() || !supabase) return fallbackResult<CommunityPost | null>(null);
  const userResult = await requireCommunityUser();
  if (!userResult.data) return supabaseResult<CommunityPost | null>(null, userResult.error || loginRequiredMessage);
  try {
    const payload = mapPostToDb({ ...input, authorId: userResult.data.id }, userResult.data.id);
    const { data, error } = await supabase.from("community_posts").insert(payload).select("*").single();
    if (error) throw error;
    return supabaseResult(mapPostFromDb(data as CommunityPostRow));
  } catch (error) {
    warnCommunityError("create post", error);
    return fallbackResult<CommunityPost | null>(null, submitFailedMessage);
  }
}

export async function updateCommunityPost(id: string, input: Partial<CommunityPost>): Promise<CommunityDataResult<CommunityPost | null>> {
  if (!canUseSupabaseCommunity() || !supabase || !isUuid(id)) return fallbackResult<CommunityPost | null>(null);
  const userResult = await requireCommunityUser();
  if (!userResult.data) return supabaseResult<CommunityPost | null>(null, userResult.error || loginRequiredMessage);
  try {
    const payload = mapPostToDb(input, userResult.data.id);
    delete payload.user_id;
    delete payload.author_id;
    const { data, error } = await supabase.from("community_posts").update(payload).eq("id", id).select("*").single();
    if (error) throw error;
    return supabaseResult(mapPostFromDb(data as CommunityPostRow));
  } catch (error) {
    warnCommunityError("update post", error);
    return fallbackResult<CommunityPost | null>(null, submitFailedMessage);
  }
}

export async function deleteCommunityPost(id: string): Promise<CommunityDataResult<boolean>> {
  const result = await updateCommunityPost(id, { status: "deleted" });
  return { data: Boolean(result.data), error: result.error, source: result.source };
}

export async function getCommunityComments(postId: string): Promise<CommunityDataResult<CommunityComment[]>> {
  if (!canUseSupabaseCommunity() || !supabase || !isUuid(postId)) return fallbackResult<CommunityComment[]>([]);
  try {
    const { data, error } = await supabase.from("community_comments").select("*").eq("post_id", postId).eq("status", "published").order("created_at", { ascending: false });
    if (error) throw error;
    return supabaseResult(((data ?? []) as CommunityCommentRow[]).map(mapCommentFromDb));
  } catch (error) {
    warnCommunityError("get comments", error);
    return fallbackResult<CommunityComment[]>([], "社区数据加载失败，请稍后再试。");
  }
}

export async function updateCommunityCommentStatus(id: string, status: CommunityCommentStatus): Promise<CommunityDataResult<CommunityComment | null>> {
  if (!canUseSupabaseCommunity() || !supabase || !isUuid(id)) return fallbackResult<CommunityComment | null>(null);
  try {
    const { data, error } = await supabase.from("community_comments").update({ status }).eq("id", id).select("*").single();
    if (error) throw error;
    return supabaseResult(mapCommentFromDb(data as CommunityCommentRow));
  } catch (error) {
    warnCommunityError("update comment status", error);
    return fallbackResult<CommunityComment | null>(null, submitFailedMessage);
  }
}

export async function createCommunityComment(input: CreateCommentInput): Promise<CommunityDataResult<CommunityComment | null>> {
  if (!canUseSupabaseCommunity() || !supabase || !isUuid(input.postId)) return fallbackResult<CommunityComment | null>(null);
  const userResult = await requireCommunityUser();
  if (!userResult.data) return supabaseResult<CommunityComment | null>(null, userResult.error || loginRequiredMessage);
  try {
    const hasRisk = hasCommunityRiskKeyword(input.content);
    const payload = cleanObject({
      post_id: input.postId,
      author_id: input.authorId || userResult.data.id,
      parent_id: input.parentId && isUuid(input.parentId) ? input.parentId : undefined,
      community_locale: input.communityLocale,
      author_name: input.authorName || getUserDisplayName(userResult.data),
      content: input.content,
      is_anonymous: input.isAnonymous,
      status: hasRisk ? "reported" : "published",
    });
    const { data, error } = await supabase.from("community_comments").insert(payload).select("*").single();
    if (error) throw error;
    const comment = mapCommentFromDb(data as CommunityCommentRow);
    const post = await getPostRow(input.postId);
    await updatePostCounter(input.postId, "comment_count", 1);
    const postOwnerId = post?.author_id || post?.user_id || "";
    if (!hasRisk && post && postOwnerId !== userResult.data.id) {
      await insertCommunityNotification({
        communityLocale: input.communityLocale,
        message: `${comment.authorName}: ${input.content}`,
        postId: input.postId,
        targetId: comment.id,
        targetType: "comment",
        title: input.parentId ? "有人回复了你的评论" : "有人评论了你的帖子",
        type: input.parentId ? "reply" : "comment",
        userId: postOwnerId,
      });
    }
    return supabaseResult(comment);
  } catch (error) {
    warnCommunityError("create comment", error);
    return fallbackResult<CommunityComment | null>(null, submitFailedMessage);
  }
}

export async function getCommunityLikeIds(): Promise<CommunityDataResult<Set<string>>> {
  return getCommunityRelationIds("community_likes");
}

export async function getCommunityFavoriteIds(): Promise<CommunityDataResult<Set<string>>> {
  return getCommunityRelationIds("community_favorites");
}

async function getCommunityRelationIds(table: "community_likes" | "community_favorites"): Promise<CommunityDataResult<Set<string>>> {
  if (!canUseSupabaseCommunity() || !supabase) return fallbackResult(new Set<string>());
  const userResult = await requireCommunityUser();
  if (!userResult.data) return supabaseResult(new Set<string>());
  try {
    const { data, error } = await supabase.from(table).select("post_id").eq("user_id", userResult.data.id);
    if (error) throw error;
    return supabaseResult(new Set((data ?? []).map((row) => String((row as { post_id: string }).post_id))));
  } catch (error) {
    warnCommunityError(`get ${table}`, error);
    return fallbackResult(new Set<string>());
  }
}

export async function toggleCommunityLike(postId: string): Promise<CommunityDataResult<{ active: boolean; count: number } | null>> {
  return togglePostRelation("community_likes", "like_count", postId, "like");
}

export async function toggleCommunityFavorite(postId: string): Promise<CommunityDataResult<{ active: boolean; count: number } | null>> {
  return togglePostRelation("community_favorites", "favorite_count", postId, "favorite");
}

async function togglePostRelation(
  table: "community_likes" | "community_favorites",
  counter: "like_count" | "favorite_count",
  postId: string,
  notificationType: "like" | "favorite",
): Promise<CommunityDataResult<{ active: boolean; count: number } | null>> {
  if (!canUseSupabaseCommunity() || !supabase || !isUuid(postId)) return fallbackResult(null);
  const userResult = await requireCommunityUser();
  if (!userResult.data) return supabaseResult(null, userResult.error || loginRequiredMessage);
  try {
    const { data: existing, error: existingError } = await supabase.from(table).select("id").eq("post_id", postId).eq("user_id", userResult.data.id).maybeSingle();
    if (existingError) throw existingError;
    const wasActive = Boolean(existing);
    if (wasActive) {
      const { error } = await supabase.from(table).delete().eq("post_id", postId).eq("user_id", userResult.data.id);
      if (error) throw error;
    } else {
      const { error } = await supabase.from(table).insert({ post_id: postId, user_id: userResult.data.id });
      if (error) throw error;
    }
    const count = await updatePostCounter(postId, counter, wasActive ? -1 : 1);
    if (!wasActive) {
      const post = await getPostRow(postId);
      const postOwnerId = post?.author_id || post?.user_id || "";
      if (post && postOwnerId !== userResult.data.id) {
        await insertCommunityNotification({
          communityLocale: isCommunityLocale(post.community_locale) ? post.community_locale : "zh-cn",
          message: notificationType === "like" ? `你的帖子「${post.title}」收到新的点赞。` : `有人收藏了你的帖子「${post.title}」。`,
          postId,
          targetId: postId,
          targetType: "post",
          title: notificationType === "like" ? "有人点赞了你的帖子" : "有人收藏了你的帖子",
          type: notificationType,
          userId: postOwnerId,
        });
      }
    }
    return supabaseResult({ active: !wasActive, count });
  } catch (error) {
    warnCommunityError(`toggle ${table}`, error);
    return fallbackResult(null, submitFailedMessage);
  }
}

export async function createContactRequest(input: CreateContactRequestInput): Promise<CommunityDataResult<CommunityContactRequest | null>> {
  if (!canUseSupabaseCommunity() || !supabase || !isUuid(input.postId)) return fallbackResult<CommunityContactRequest | null>(null);
  const userResult = await requireCommunityUser();
  if (!userResult.data) return supabaseResult<CommunityContactRequest | null>(null, userResult.error || loginRequiredMessage);
  try {
    const post = await getPostRow(input.postId);
    if (!post) return supabaseResult<CommunityContactRequest | null>(null, submitFailedMessage);
    const payload = {
      post_id: input.postId,
      from_user_id: userResult.data.id,
      to_user_id: post.author_id || post.user_id || userResult.data.id,
      community_locale: post.community_locale,
      from_name: input.fromName || getUserDisplayName(userResult.data),
      message: input.message,
      contact: input.contact,
      status: "pending",
    };
    const { data, error } = await supabase.from("community_contact_requests").insert(payload).select("*").single();
    if (error) throw error;
    const request = mapContactRequestFromDb(data as CommunityContactRequestRow);
    const postOwnerId = post.author_id || post.user_id || "";
    if (postOwnerId !== userResult.data.id) {
      await insertCommunityNotification({
        communityLocale: isCommunityLocale(post.community_locale) ? post.community_locale : "zh-cn",
        message: `对方对你的「${post.title}」感兴趣。`,
        postId: input.postId,
        targetId: request.id,
        targetType: "contact_request",
        title: "有人申请联系你",
        type: "contact_request",
        userId: postOwnerId,
      });
    }
    return supabaseResult(request);
  } catch (error) {
    warnCommunityError("create contact request", error);
    return fallbackResult<CommunityContactRequest | null>(null, submitFailedMessage);
  }
}

export async function getMyContactRequests(): Promise<CommunityDataResult<CommunityContactRequest[]>> {
  return getContactRequestsBySide("from_user_id");
}

export async function getReceivedContactRequests(): Promise<CommunityDataResult<CommunityContactRequest[]>> {
  return getContactRequestsBySide("to_user_id");
}

export async function updateContactRequestStatus(id: string, status: CommunityContactRequestStatus): Promise<CommunityDataResult<CommunityContactRequest | null>> {
  if (!canUseSupabaseCommunity() || !supabase || !isUuid(id)) return fallbackResult<CommunityContactRequest | null>(null);
  const userResult = await requireCommunityUser();
  if (!userResult.data) return supabaseResult<CommunityContactRequest | null>(null, userResult.error || loginRequiredMessage);
  try {
    const { data, error } = await supabase
      .from("community_contact_requests")
      .update({ status })
      .eq("id", id)
      .or(`from_user_id.eq.${userResult.data.id},to_user_id.eq.${userResult.data.id}`)
      .select("*")
      .single();
    if (error) throw error;
    return supabaseResult(mapContactRequestFromDb(data as CommunityContactRequestRow));
  } catch (error) {
    warnCommunityError("update contact request", error);
    return fallbackResult<CommunityContactRequest | null>(null, submitFailedMessage);
  }
}

async function getContactRequestsBySide(column: "from_user_id" | "to_user_id"): Promise<CommunityDataResult<CommunityContactRequest[]>> {
  if (!canUseSupabaseCommunity() || !supabase) return fallbackResult<CommunityContactRequest[]>([]);
  const userResult = await requireCommunityUser();
  if (!userResult.data) return supabaseResult<CommunityContactRequest[]>([]);
  try {
    const { data, error } = await supabase.from("community_contact_requests").select("*").eq(column, userResult.data.id).order("created_at", { ascending: false });
    if (error) throw error;
    return supabaseResult(((data ?? []) as CommunityContactRequestRow[]).map(mapContactRequestFromDb));
  } catch (error) {
    warnCommunityError("get contact requests", error);
    return fallbackResult<CommunityContactRequest[]>([]);
  }
}

export async function createCommunityReport(input: CreateReportInput): Promise<CommunityDataResult<CommunityReport | null>> {
  if (!canUseSupabaseCommunity() || !supabase || !isUuid(input.targetId)) return fallbackResult<CommunityReport | null>(null);
  const userResult = await requireCommunityUser();
  if (!userResult.data) return supabaseResult<CommunityReport | null>(null, userResult.error || loginRequiredMessage);
  try {
    const payload = {
      user_id: userResult.data.id,
      target_type: input.targetType,
      target_id: input.targetId,
      reason: input.reason,
      detail: input.detail ?? "",
      status: "pending",
    };
    const { data, error } = await supabase.from("community_reports").insert(payload).select("*").single();
    if (error) throw error;
    await updateReportCounter(input.targetType, input.targetId);
    return supabaseResult(mapReportFromDb(data as CommunityReportRow));
  } catch (error) {
    warnCommunityError("create report", error);
    return fallbackResult<CommunityReport | null>(null, submitFailedMessage);
  }
}

export async function getNotifications(): Promise<CommunityDataResult<CommunityNotification[]>> {
  if (!canUseSupabaseCommunity() || !supabase) return fallbackResult<CommunityNotification[]>([]);
  const userResult = await requireCommunityUser();
  if (!userResult.data) return supabaseResult<CommunityNotification[]>([]);
  try {
    const { data, error } = await supabase.from("community_notifications").select("*").eq("user_id", userResult.data.id).order("created_at", { ascending: false });
    if (error) throw error;
    return supabaseResult(((data ?? []) as CommunityNotificationRow[]).map(mapNotificationFromDb));
  } catch (error) {
    warnCommunityError("get notifications", error);
    return fallbackResult<CommunityNotification[]>([]);
  }
}

export async function markNotificationRead(id: string): Promise<CommunityDataResult<boolean>> {
  if (!canUseSupabaseCommunity() || !supabase || !isUuid(id)) return fallbackResult(false);
  const userResult = await requireCommunityUser();
  if (!userResult.data) return supabaseResult(false, userResult.error || loginRequiredMessage);
  try {
    const { error } = await supabase.from("community_notifications").update({ is_read: true }).eq("id", id).eq("user_id", userResult.data.id);
    if (error) throw error;
    return supabaseResult(true);
  } catch (error) {
    warnCommunityError("mark notification read", error);
    return supabaseResult(false, submitFailedMessage);
  }
}

export async function markAllNotificationsRead(): Promise<CommunityDataResult<boolean>> {
  if (!canUseSupabaseCommunity() || !supabase) return fallbackResult(false);
  const userResult = await requireCommunityUser();
  if (!userResult.data) return supabaseResult(false, userResult.error || loginRequiredMessage);
  try {
    const { error } = await supabase.from("community_notifications").update({ is_read: true }).eq("user_id", userResult.data.id).eq("is_read", false);
    if (error) throw error;
    return supabaseResult(true);
  } catch (error) {
    warnCommunityError("mark all notifications read", error);
    return supabaseResult(false, submitFailedMessage);
  }
}

export async function getCommunityProfile(userId: string): Promise<CommunityDataResult<CommunityUserProfile | null>> {
  if (!canUseSupabaseCommunity() || !supabase || !isUuid(userId)) return fallbackResult<CommunityUserProfile | null>(null);
  try {
    const { data, error } = await supabase.from("community_profiles").select("*").eq("id", userId).maybeSingle();
    if (error) throw error;
    return supabaseResult(data ? mapProfileFromDb(data as CommunityProfileRow) : null);
  } catch (error) {
    warnCommunityError("get profile", error);
    return fallbackResult<CommunityUserProfile | null>(null);
  }
}

export async function upsertCommunityProfile(input: CommunityUserProfile): Promise<CommunityDataResult<CommunityUserProfile | null>> {
  if (!canUseSupabaseCommunity() || !supabase) return fallbackResult<CommunityUserProfile | null>(null);
  const userResult = await requireCommunityUser();
  if (!userResult.data) return supabaseResult<CommunityUserProfile | null>(null, userResult.error || loginRequiredMessage);
  try {
    const payload = {
      id: userResult.data.id,
      display_name: input.displayName,
      avatar: input.avatar,
      bio: input.bio,
      area: input.area,
      languages: input.languages,
      interests: input.interests,
      is_anonymous_default: input.isAnonymousDefault,
    };
    const { data, error } = await supabase.from("community_profiles").upsert(payload, { onConflict: "id" }).select("*").single();
    if (error) throw error;
    return supabaseResult(mapProfileFromDb(data as CommunityProfileRow));
  } catch (error) {
    warnCommunityError("upsert profile", error);
    return fallbackResult<CommunityUserProfile | null>(null, submitFailedMessage);
  }
}

async function getPostRow(postId: string) {
  if (!supabase || !isUuid(postId)) return null;
  const { data, error } = await supabase.from("community_posts").select("*").eq("id", postId).maybeSingle();
  if (error) {
    warnCommunityError("get post row", error);
    return null;
  }
  return data as CommunityPostRow | null;
}

async function updatePostCounter(postId: string, field: "like_count" | "favorite_count" | "comment_count", delta: number) {
  if (!supabase) return 0;
  const post = await getPostRow(postId);
  const nextCount = Math.max(0, Number(post?.[field] ?? 0) + delta);
  const { error } = await supabase.from("community_posts").update({ [field]: nextCount }).eq("id", postId);
  if (error) warnCommunityError(`update ${field}`, error);
  return nextCount;
}

async function updateReportCounter(targetType: CommunityReportTargetType, targetId: string) {
  if (!supabase || targetType === "user") return 1;
  const table = targetType === "post" ? "community_posts" : "community_comments";
  const { data, error: readError } = await supabase.from(table).select("report_count,status").eq("id", targetId).maybeSingle();
  if (readError) {
    warnCommunityError("read report count", readError);
    return 1;
  }
  const current = Number((data as { report_count?: number | null } | null)?.report_count ?? 0);
  const nextCount = current + 1;
  const nextStatus = nextCount >= 3 ? "reported" : (data as { status?: string | null } | null)?.status;
  const { error } = await supabase.from(table).update(cleanObject({ report_count: nextCount, status: nextStatus })).eq("id", targetId);
  if (error) warnCommunityError("update report count", error);
  return nextCount;
}

async function insertCommunityNotification(input: Omit<CommunityNotification, "createdAt" | "id" | "isRead">) {
  if (!supabase || input.userId === undefined) return;
  if (input.targetId && !isUuid(input.targetId)) return;
  if (input.postId && !isUuid(input.postId)) return;
  const payload = {
    user_id: input.userId,
    type: input.type,
    title: input.title,
    message: input.message,
    target_type: input.targetType,
    target_id: input.targetId,
    post_id: input.postId,
    community_locale: communityLocales.includes(input.communityLocale) ? input.communityLocale : "zh-cn",
    is_read: false,
  };
  const { error } = await supabase.from("community_notifications").insert(cleanObject(payload));
  if (error) warnCommunityError("insert notification", error);
}
