import type { User } from "@supabase/supabase-js";
import {
  type CommunityComment,
  type CommunityCommentStatus,
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
  isCommunityCommentStatus,
  isCommunityLocale,
  isCommunityNotificationTargetType,
  isCommunityNotificationType,
  isCommunityPostStatus,
  isCommunityPostType,
  isCommunityReportStatus,
} from "@/lib/community/types";
import { supabase } from "@/lib/supabase";

export const USE_SUPABASE_COMMUNITY = true;

type CommunitySource = "supabase" | "fallback";

export type CommunityDataResult<T> = {
  data: T;
  error: string;
  source: CommunitySource;
};

export type GetCommunityPostsOptions = {
  authorId?: string;
  includeAllStatuses?: boolean;
  limit?: number;
  locale?: CommunityLocale | "all";
  status?: CommunityPostStatus | CommunityPostStatus[];
  tag?: string;
};

export type CommunityPostRow = {
  id: string;
  user_id?: string | null;
  community_locale: string;
  type: string;
  title: string;
  content: string;
  area: string | null;
  author_name: string | null;
  is_anonymous: boolean | null;
  images: unknown;
  tags: string[] | null;
  status: string;
  like_count: number | null;
  comment_count: number | null;
  favorite_count: number | null;
  view_count?: number | null;
  report_count: number | null;
  is_solved: boolean | null;
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
  share_category?: string | null;
  time: string | null;
  created_at: string;
  updated_at: string | null;
};

export type CommunityCommentRow = {
  id: string;
  post_id: string;
  user_id?: string | null;
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
  public_id?: string | null;
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

export const communityPostSelectColumns = [
  "id",
  "user_id",
  "community_locale",
  "type",
  "title",
  "content",
  "area",
  "author_name",
  "is_anonymous",
  "images",
  "tags",
  "status",
  "like_count",
  "comment_count",
  "favorite_count",
  "view_count",
  "report_count",
  "is_solved",
  "is_featured",
  "is_pinned",
  "is_official_recommended",
  "featured_reason",
  "price",
  "item_status",
  "condition",
  "pickup_method",
  "buddy_type",
  "people",
  "budget",
  "helper_category",
  "help_category",
  "share_category",
  "pinned_until",
  "time",
  "created_at",
  "updated_at",
].join(",");

export const communityCommentSelectColumns = [
  "id",
  "post_id",
  "user_id",
  "parent_id",
  "community_locale",
  "author_name",
  "content",
  "is_anonymous",
  "status",
  "like_count",
  "report_count",
  "created_at",
  "updated_at",
].join(",");

function fallbackResult<T>(data: T, error = ""): CommunityDataResult<T> {
  return { data, error, source: "fallback" };
}

function supabaseResult<T>(data: T, error = ""): CommunityDataResult<T> {
  return { data, error, source: "supabase" };
}

function formatCommunityTimestamp(value: string | null | undefined) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("zh-CN", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "2-digit",
  }).format(date);
}

function normalizeStringList(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function normalizeImages(value: unknown): CommunityPostImage[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((image) => {
    if (typeof image === "string") return image.startsWith("http") || image.startsWith("/") ? [image] : [];
    if (!image || typeof image !== "object") return [];
    const item = image as Record<string, unknown>;
    const url = typeof item.url === "string" ? item.url : "";
    if (url.startsWith("data:image")) return [];
    if (typeof item.coverText === "string" || item.type === "text-cover" || item.type === "placeholder") return [image as CommunityPostImage];
    if (url.startsWith("http") || url.startsWith("/")) return [image as CommunityPostImage];
    return [];
  });
}

export function mapPostFromDb(row: CommunityPostRow): CommunityPost {
  const likeCount = Number(row.like_count ?? 0);
  const commentCount = Number(row.comment_count ?? 0);
  const favoriteCount = Number(row.favorite_count ?? 0);
  const viewCount = Number(row.view_count ?? 0);
  const type = isCommunityPostType(row.type) ? row.type as CommunityPostType : "share";
  return {
    id: row.id,
    area: row.area || "日本",
    authorId: row.user_id || "",
    authorName: row.author_name || "Japan Life User",
    buddyType: row.buddy_type ?? undefined,
    budget: row.budget ?? undefined,
    commentCount,
    comments: commentCount,
    communityLocale: isCommunityLocale(row.community_locale) ? row.community_locale as CommunityLocale : "zh-cn",
    condition: row.condition ?? undefined,
    content: row.content,
    createdAt: formatCommunityTimestamp(row.created_at),
    favoriteCount,
    favorites: favoriteCount,
    featuredReason: row.featured_reason ?? undefined,
    helpCategory: row.help_category ?? undefined,
    helperCategory: row.helper_category ?? undefined,
    images: normalizeImages(row.images),
    isAnonymous: Boolean(row.is_anonymous),
    isFeatured: Boolean(row.is_featured),
    isOfficialRecommended: Boolean(row.is_official_recommended),
    isPinned: Boolean(row.is_pinned),
    isSolved: row.is_solved ?? undefined,
    itemStatus: row.item_status ?? undefined,
    likeCount,
    likes: likeCount,
    people: row.people ?? undefined,
    pickupMethod: row.pickup_method ?? undefined,
    pinnedUntil: row.pinned_until ?? null,
    price: row.price ?? undefined,
    reportCount: Number(row.report_count ?? 0),
    shareCategory: row.share_category ?? undefined,
    status: isCommunityPostStatus(row.status) ? row.status as CommunityPostStatus : "published",
    tags: normalizeStringList(row.tags),
    time: row.time ?? undefined,
    title: row.title,
    type,
    updatedAt: row.updated_at ?? undefined,
    viewCount,
    views: viewCount,
  };
}

export function mapPostToDb(post: Partial<CommunityPost>, userId?: string) {
  return {
    area: post.area,
    user_id: post.authorId ?? userId,
    author_name: post.authorName,
    buddy_type: post.buddyType,
    budget: post.budget,
    comment_count: post.commentCount ?? post.comments,
    community_locale: post.communityLocale,
    condition: post.condition,
    content: post.content,
    favorite_count: post.favoriteCount ?? post.favorites,
    help_category: post.helpCategory,
    helper_category: post.helperCategory,
    images: post.images ?? [],
    is_anonymous: post.isAnonymous,
    is_featured: post.isFeatured,
    is_official_recommended: post.isOfficialRecommended,
    is_pinned: post.isPinned,
    is_solved: post.isSolved,
    item_status: post.itemStatus,
    like_count: post.likeCount ?? post.likes,
    people: post.people,
    pickup_method: post.pickupMethod,
    pinned_until: post.pinnedUntil,
    price: post.price,
    report_count: post.reportCount,
    share_category: post.shareCategory,
    status: post.status,
    tags: post.tags ?? [],
    time: post.time,
    title: post.title,
    type: post.type,
    view_count: post.viewCount ?? post.views,
  };
}

export function mapCommentFromDb(row: CommunityCommentRow): CommunityComment {
  return {
    id: row.id,
    authorId: row.user_id || "",
    authorName: row.author_name || "Japan Life User",
    communityLocale: isCommunityLocale(String(row.community_locale ?? "")) ? row.community_locale as CommunityLocale : "zh-cn",
    content: row.content,
    createdAt: formatCommunityTimestamp(row.created_at),
    isAnonymous: Boolean(row.is_anonymous),
    likeCount: Number(row.like_count ?? 0),
    parentId: row.parent_id ?? undefined,
    postId: row.post_id,
    reportCount: Number(row.report_count ?? 0),
    status: isCommunityCommentStatus(row.status) ? row.status as CommunityCommentStatus : "published",
  };
}

export function mapReportFromDb(row: CommunityReportRow): CommunityReport {
  const targetType = row.target_type === "comment" || row.target_type === "user" ? row.target_type : "post";
  return {
    id: row.id,
    createdAt: formatCommunityTimestamp(row.created_at),
    detail: row.detail || "",
    reason: row.reason,
    status: isCommunityReportStatus(String(row.status ?? "")) ? row.status as CommunityReportStatus : "pending",
    targetId: row.target_id,
    targetType: targetType as CommunityReportTargetType,
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
    targetType: isCommunityNotificationTargetType(String(row.target_type ?? "")) ? row.target_type as CommunityNotificationTargetType : undefined,
    title: row.title,
    type: isCommunityNotificationType(row.type) ? row.type as CommunityNotificationType : "system",
    userId: row.user_id,
  };
}

export function mapProfileFromDb(row: CommunityProfileRow): CommunityUserProfile {
  return {
    id: row.public_id || `jl-${row.id.slice(0, 8)}`,
    accountId: row.id,
    area: row.area || "日本",
    avatar: row.avatar || "linear-gradient(135deg, #60a5fa, #f9a8d4)",
    bio: row.bio || "",
    commentReceivedCount: 0,
    displayName: row.display_name || "Japan Life User",
    favoriteReceivedCount: 0,
    interests: normalizeStringList(row.interests),
    isAnonymousDefault: Boolean(row.is_anonymous_default),
    joinedAt: formatCommunityTimestamp(row.created_at),
    languages: normalizeStringList(row.languages),
    likeReceivedCount: 0,
    postCount: 0,
  };
}

function mapProfileToDb(profile: CommunityUserProfile, userId: string) {
  return {
    id: userId,
    public_id: profile.id || `jl-${userId.slice(0, 8)}`,
    area: profile.area || "日本",
    avatar: profile.avatar || "",
    bio: profile.bio || "",
    display_name: profile.displayName || "Japan Life User",
    interests: profile.interests ?? [],
    is_anonymous_default: Boolean(profile.isAnonymousDefault),
    languages: profile.languages ?? [],
  };
}

function mapProfileToLegacyDb(profile: CommunityUserProfile, userId: string) {
  const { public_id: _publicId, ...payload } = mapProfileToDb(profile, userId);
  void _publicId;
  return payload;
}

export async function getCurrentUser(): Promise<CommunityDataResult<User | null>> {
  if (!supabase) return fallbackResult(null);
  const { data, error } = await supabase.auth.getUser();
  return error ? fallbackResult(null, error.message) : supabaseResult(data.user);
}

export async function getCommunityPosts(_options?: unknown): Promise<CommunityDataResult<CommunityPost[]>> {
  if (!supabase) return fallbackResult([]);
  const options = (_options ?? {}) as GetCommunityPostsOptions;
  const statuses = Array.isArray(options.status) ? options.status : options.status ? [options.status] : ["published"];
  let query = supabase
    .from("community_posts")
    .select(communityPostSelectColumns)
    .order("created_at", { ascending: false });

  if (options.locale && options.locale !== "all") query = query.eq("community_locale", options.locale);
  if (options.authorId) query = query.eq("user_id", options.authorId);
  if (!options.includeAllStatuses) query = query.in("status", statuses);
  if (options.tag) query = query.contains("tags", [options.tag]);
  if (options.limit) query = query.limit(options.limit);

  const { data, error } = await query.returns<CommunityPostRow[]>();
  if (error) return fallbackResult([], error.message);
  return supabaseResult((data ?? []).map(mapPostFromDb));
}

export async function getCommunityPostById(_id?: unknown, _locale?: unknown): Promise<CommunityDataResult<CommunityPost | null>> {
  if (!supabase || typeof _id !== "string") return fallbackResult(null);
  const locale = typeof _locale === "string" ? _locale : "all";
  let query = supabase.from("community_posts").select(communityPostSelectColumns).eq("id", _id);
  if (locale !== "all" && isCommunityLocale(locale)) query = query.eq("community_locale", locale);
  const { data, error } = await query.maybeSingle<CommunityPostRow>();
  if (error) return fallbackResult(null, error.message);
  return supabaseResult(data ? mapPostFromDb(data) : null);
}

export async function createCommunityPost(_input?: unknown): Promise<CommunityDataResult<CommunityPost | null>> {
  if (!supabase || !_input) return fallbackResult(null);
  const post = _input as CommunityPost;
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) return fallbackResult(null, userError?.message || "Login required.");
  const { data, error } = await supabase
    .from("community_posts")
    .insert(mapPostToDb(post, userData.user.id))
    .select(communityPostSelectColumns)
    .single<CommunityPostRow>();
  if (error) return fallbackResult(null, error.message);
  return supabaseResult(mapPostFromDb(data));
}

export async function updateCommunityPost(_id?: unknown, _input?: unknown): Promise<CommunityDataResult<CommunityPost | null>> {
  void _id;
  void _input;
  return fallbackResult(null);
}

export async function createCommunityComment(_input?: unknown): Promise<CommunityDataResult<CommunityComment | null>> {
  void _input;
  return fallbackResult(null);
}

export async function getCommunityComments(_postId?: unknown): Promise<CommunityDataResult<CommunityComment[]>> {
  if (!supabase || typeof _postId !== "string") return fallbackResult([]);
  const { data, error } = await supabase
    .from("community_comments")
    .select(communityCommentSelectColumns)
    .eq("post_id", _postId)
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .returns<CommunityCommentRow[]>();
  if (error) return fallbackResult([], error.message);
  return supabaseResult((data ?? []).map(mapCommentFromDb));
}

export async function getCommunityCommentsByAuthor(_authorId?: unknown, _includeAllStatuses = false): Promise<CommunityDataResult<CommunityComment[]>> {
  void _authorId;
  void _includeAllStatuses;
  return fallbackResult([]);
}

export async function updateCommunityCommentStatus(_id?: unknown, _status?: unknown): Promise<CommunityDataResult<CommunityComment | null>> {
  void _id;
  void _status;
  return fallbackResult(null);
}

export async function toggleCommunityLike(_postId?: unknown): Promise<CommunityDataResult<{ active: boolean; count: number } | null>> {
  void _postId;
  return fallbackResult(null);
}

export async function toggleCommunityFavorite(_postId?: unknown): Promise<CommunityDataResult<{ active: boolean; count: number } | null>> {
  void _postId;
  return fallbackResult(null);
}

export async function getCommunityLikeIds(): Promise<CommunityDataResult<Set<string>>> {
  return fallbackResult(new Set<string>());
}

export async function getCommunityFavoriteIds(): Promise<CommunityDataResult<Set<string>>> {
  return fallbackResult(new Set<string>());
}

export async function createCommunityReport(_input?: unknown): Promise<CommunityDataResult<CommunityReport | null>> {
  void _input;
  return fallbackResult(null);
}

export async function getAllCommunityReports(): Promise<CommunityDataResult<CommunityReport[]>> {
  return fallbackResult([]);
}

export async function getNotifications(_userId?: unknown): Promise<CommunityDataResult<CommunityNotification[]>> {
  void _userId;
  return fallbackResult([]);
}

export async function createNotification(input: CommunityNotification): Promise<CommunityDataResult<CommunityNotification | null>> {
  return fallbackResult(input);
}

export async function markNotificationRead(_id?: unknown, _userId?: unknown): Promise<CommunityDataResult<boolean>> {
  void _id;
  void _userId;
  return fallbackResult(false);
}

export async function markAllNotificationsRead(_userId?: unknown): Promise<CommunityDataResult<boolean>> {
  void _userId;
  return fallbackResult(false);
}

export async function getCommunityProfile(_userId?: unknown): Promise<CommunityDataResult<CommunityUserProfile | null>> {
  if (!supabase) return fallbackResult(null);
  const userId = typeof _userId === "string" ? _userId.trim() : "";
  if (!userId) return fallbackResult(null);
  const columns = "id,public_id,display_name,avatar,bio,area,languages,interests,is_anonymous_default,created_at,updated_at";
  const { data, error } = await supabase
    .from("community_profiles")
    .select(columns)
    .eq("id", userId)
    .maybeSingle();
  if (error && isMissingColumnError(error)) {
    const fallback = await supabase
      .from("community_profiles")
      .select("id,display_name,avatar,bio,area,languages,interests,is_anonymous_default,created_at,updated_at")
      .eq("id", userId)
      .maybeSingle();
    if (fallback.error) return supabaseResult(null, fallback.error.message);
    return supabaseResult(fallback.data ? mapProfileFromDb(fallback.data as CommunityProfileRow) : null);
  }
  if (error) return supabaseResult(null, error.message);
  return supabaseResult(data ? mapProfileFromDb(data as CommunityProfileRow) : null);
}

export async function upsertCommunityProfile(input: CommunityUserProfile): Promise<CommunityDataResult<CommunityUserProfile | null>> {
  if (!supabase) return fallbackResult(input);
  const userId = input.accountId || input.id;
  if (!userId) return supabaseResult(null, "请先登录后再保存社区资料。");
  const { data, error } = await supabase
    .from("community_profiles")
    .upsert(mapProfileToDb(input, userId), { onConflict: "id" })
    .select("id,public_id,display_name,avatar,bio,area,languages,interests,is_anonymous_default,created_at,updated_at")
    .single();
  if (error && isMissingColumnError(error)) {
    const fallback = await supabase
      .from("community_profiles")
      .upsert(mapProfileToLegacyDb(input, userId), { onConflict: "id" })
      .select("id,display_name,avatar,bio,area,languages,interests,is_anonymous_default,created_at,updated_at")
      .single();
    if (fallback.error) return supabaseResult(null, fallback.error.message);
    return supabaseResult(fallback.data ? { ...mapProfileFromDb(fallback.data as CommunityProfileRow), id: input.id } : input);
  }
  if (error) return supabaseResult(null, error.message);
  return supabaseResult(data ? mapProfileFromDb(data as CommunityProfileRow) : input);
}

function isMissingColumnError(error: unknown) {
  return Boolean(error && typeof error === "object" && "code" in error && (error as { code?: unknown }).code === "42703");
}
