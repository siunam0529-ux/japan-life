import { CURRENT_USER_ID, CURRENT_USER_NAME } from "@/lib/community/currentUser";
import {
  isCommunityCommentStatus,
  isCommunityLocale,
  isCommunityNotificationTargetType,
  isCommunityNotificationType,
  isCommunityPostStatus,
  isCommunityPostType,
  isCommunityReportStatus,
  type CommunityComment,
  type CommunityLocale,
  type CommunityNotification,
  type CommunityPost,
  type CommunityReport,
  type CommunityReportTargetType,
  type CommunityUserProfile,
} from "@/lib/community/types";

export const communityPostsStorageKey = "japan-life-community-posts";
export const communityCommentsStorageKey = "japan-life-community-comments";
export const communityLikesStorageKey = "japan-life-community-likes";
export const communityFavoritesStorageKey = "japan-life-community-favorites";
export const communityReportsStorageKey = "japan-life-community-reports";
export const communityNotificationsStorageKey = "japan-life-community-notifications";
export const communityUserProfileStorageKey = "japan-life-community-user-profile";
export const communityUsersStorageKey = "japan-life-community-users";

export const communityCurrentUserId = CURRENT_USER_ID;
export const communityLocalUserId = CURRENT_USER_ID;
export const communityLocalUserName = CURRENT_USER_NAME;

const legacyMockUserIdPrefix = ["mo", "ck-user-"].join("");

export const defaultCommunityUserProfile: CommunityUserProfile = {
  area: "日本",
  avatar: "linear-gradient(135deg, #60a5fa, #f9a8d4)",
  bio: "在日本生活中，喜欢记录日常、经验和有用的信息。",
  commentReceivedCount: 0,
  displayName: "Nam",
  favoriteReceivedCount: 0,
  id: communityCurrentUserId,
  isAnonymousDefault: false,
  joinedAt: "2026/05",
  languages: ["生活社区"],
  likeReceivedCount: 0,
  postCount: 0,
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

function numberValue(value: unknown, fallback = 0) {
  const next = Number(value);
  return Number.isFinite(next) ? next : fallback;
}

function stringList(value: unknown, fallback: string[] = []) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && Boolean(item.trim())) : fallback;
}

function cleanCommunityImages(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.flatMap((image) => {
    if (typeof image === "string") return image.startsWith("http") || image.startsWith("/") ? [image] : [];
    if (!image || typeof image !== "object") return [];
    const item = image as Record<string, unknown>;
    const url = typeof item.url === "string" ? item.url : "";
    if (url.startsWith("data:image")) return [];
    if (typeof item.coverText === "string" || item.type === "text-cover" || item.type === "placeholder") return [image];
    if (url.startsWith("http") || url.startsWith("/")) return [image];
    return [];
  });
}

export function createCommunityId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function formatCommunityNow() {
  return new Intl.DateTimeFormat("zh-CN", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "2-digit",
  }).format(new Date());
}

export function readCommunityPosts(defaultLocale: CommunityLocale = "zh-cn") {
  return readJson<Partial<CommunityPost>[]>(communityPostsStorageKey, [])
    .filter((item) => item && typeof item.id === "string")
    .filter((item) => isCommunityPostType(String(item.type ?? "")))
    .map((item) => {
      const likeCount = numberValue(item.likeCount ?? item.likes);
      const commentCount = numberValue(item.commentCount ?? item.comments);
      const favoriteCount = numberValue(item.favoriteCount ?? item.favorites);
      const viewCount = numberValue(item.viewCount ?? item.views);
      const type = item.type;
      return {
        ...item,
        area: typeof item.area === "string" && item.area.trim() ? item.area : "??",
        authorId: typeof item.authorId === "string" && item.authorId.trim() ? item.authorId : communityCurrentUserId,
        authorName: typeof item.authorName === "string" && item.authorName.trim() ? item.authorName : communityLocalUserName,
        commentCount,
        comments: commentCount,
        communityLocale: isCommunityLocale(String(item.communityLocale ?? "")) ? item.communityLocale : defaultLocale,
        content: typeof item.content === "string" ? item.content : "",
        favoriteCount,
        favorites: favoriteCount,
        images: cleanCommunityImages(item.images),
        isAnonymous: Boolean(item.isAnonymous),
        isFeatured: Boolean(item.isFeatured),
        isOfficialRecommended: Boolean(item.isOfficialRecommended),
        isPinned: Boolean(item.isPinned),
        likeCount,
        likes: likeCount,
        pinnedUntil: item.pinnedUntil ?? null,
        reportCount: numberValue(item.reportCount),
        status: isCommunityPostStatus(String(item.status ?? "")) ? item.status : "published",
        tags: stringList(item.tags),
        title: typeof item.title === "string" ? item.title : "",
        type,
        viewCount,
        views: viewCount,
      } as CommunityPost;
    });
}

export function writeCommunityPosts(posts: CommunityPost[]) {
  writeJson(communityPostsStorageKey, posts);
}

export function readCommunityComments() {
  return readJson<Partial<CommunityComment>[]>(communityCommentsStorageKey, [])
    .filter((item) => item && typeof item.id === "string")
    .map((item) => ({
      ...item,
      authorId: typeof item.authorId === "string" && item.authorId.trim() ? item.authorId : communityCurrentUserId,
      authorName: typeof item.authorName === "string" && item.authorName.trim() ? item.authorName : communityLocalUserName,
      communityLocale: isCommunityLocale(String(item.communityLocale ?? "")) ? item.communityLocale : "zh-cn",
      content: typeof item.content === "string" ? item.content : "",
      createdAt: typeof item.createdAt === "string" ? item.createdAt : formatCommunityNow(),
      isAnonymous: Boolean(item.isAnonymous),
      likeCount: numberValue(item.likeCount),
      postId: typeof item.postId === "string" ? item.postId : "",
      reportCount: numberValue(item.reportCount),
      status: isCommunityCommentStatus(String(item.status ?? "")) ? item.status : "published",
    }) as CommunityComment);
}

export function writeCommunityComments(comments: CommunityComment[]) {
  writeJson(communityCommentsStorageKey, comments);
}

function isReportTargetType(value: string): value is CommunityReportTargetType {
  return value === "post" || value === "comment" || value === "user";
}

export function readCommunityReports() {
  return readJson<Partial<CommunityReport>[]>(communityReportsStorageKey, [])
    .filter((item) => item && typeof item.id === "string")
    .map((item) => {
      const status = String(item.status ?? "");
      const targetType = String(item.targetType ?? "");
      return {
        createdAt: typeof item.createdAt === "string" ? item.createdAt : formatCommunityNow(),
        detail: typeof item.detail === "string" ? item.detail : "",
        id: item.id!,
        reason: typeof item.reason === "string" ? item.reason : "其他",
        status: isCommunityReportStatus(status) ? item.status : "pending",
        targetId: typeof item.targetId === "string" ? item.targetId : "",
        targetType: isReportTargetType(targetType) ? item.targetType : "post",
        userId: typeof item.userId === "string" ? item.userId : undefined,
      } as CommunityReport;
    });
}

export function writeCommunityReports(reports: CommunityReport[]) {
  writeJson(communityReportsStorageKey, reports);
}

export function createCommunityNotification(input: Omit<CommunityNotification, "createdAt" | "id" | "isRead"> & { createdAt?: string; id?: string; isRead?: boolean }): CommunityNotification {
  return {
    ...input,
    createdAt: input.createdAt || formatCommunityNow(),
    id: input.id || createCommunityId("community-notification"),
    isRead: input.isRead ?? false,
  };
}

export function readCommunityNotifications() {
  return readJson<Partial<CommunityNotification>[]>(communityNotificationsStorageKey, [])
    .filter((item) => item && typeof item.id === "string")
    .map((item) => ({
      ...item,
      communityLocale: isCommunityLocale(String(item.communityLocale ?? "")) ? item.communityLocale : "zh-cn",
      createdAt: typeof item.createdAt === "string" ? item.createdAt : formatCommunityNow(),
      isRead: Boolean(item.isRead),
      message: typeof item.message === "string" ? item.message : "",
      targetType: isCommunityNotificationTargetType(String(item.targetType ?? "")) ? item.targetType : undefined,
      title: typeof item.title === "string" ? item.title : "Japan Life",
      type: isCommunityNotificationType(String(item.type ?? "")) ? item.type : "system",
      userId: typeof item.userId === "string" ? item.userId : communityCurrentUserId,
    }) as CommunityNotification);
}

export function writeCommunityNotifications(notifications: CommunityNotification[]) {
  writeJson(communityNotificationsStorageKey, notifications);
}

export function addCommunityNotification(notification: CommunityNotification) {
  writeCommunityNotifications([notification, ...readCommunityNotifications()].slice(0, 200));
}

export function readCommunityIdSet(key: string) {
  return new Set(readJson<string[]>(key, []));
}

export function writeCommunityIdSet(key: string, ids: Set<string>) {
  writeJson(key, [...ids]);
}

function normalizeCommunityUserProfile(value: Partial<CommunityUserProfile> | null | undefined, fallback: CommunityUserProfile = defaultCommunityUserProfile): CommunityUserProfile {
  return {
    accountId: typeof value?.accountId === "string" && value.accountId.trim() ? value.accountId : fallback.accountId,
    area: typeof value?.area === "string" && value.area.trim() ? value.area : fallback.area,
    avatar: typeof value?.avatar === "string" && value.avatar.trim() ? value.avatar : fallback.avatar,
    bio: typeof value?.bio === "string" ? value.bio : fallback.bio,
    commentReceivedCount: numberValue(value?.commentReceivedCount, fallback.commentReceivedCount),
    displayName: typeof value?.displayName === "string" && value.displayName.trim() ? value.displayName : fallback.displayName,
    favoriteReceivedCount: numberValue(value?.favoriteReceivedCount, fallback.favoriteReceivedCount),
    id: typeof value?.id === "string" && value.id.trim() ? value.id : fallback.id,
    isAnonymousDefault: Boolean(value?.isAnonymousDefault),
    joinedAt: typeof value?.joinedAt === "string" && value.joinedAt.trim() ? value.joinedAt : fallback.joinedAt,
    languages: stringList(value?.languages, fallback.languages),
    likeReceivedCount: numberValue(value?.likeReceivedCount, fallback.likeReceivedCount),
    postCount: numberValue(value?.postCount, fallback.postCount),
  };
}

export function readCommunityUserProfile() {
  return normalizeCommunityUserProfile(readJson<Partial<CommunityUserProfile>>(communityUserProfileStorageKey, defaultCommunityUserProfile));
}

export function writeCommunityUserProfile(profile: CommunityUserProfile) {
  writeJson(communityUserProfileStorageKey, normalizeCommunityUserProfile(profile));
}

export function readCommunityUsers() {
  return readJson<Partial<CommunityUserProfile>[]>(communityUsersStorageKey, [])
    .flatMap((user) => {
      if (typeof user?.id !== "string" || user.id.startsWith(legacyMockUserIdPrefix)) return [];
      return [normalizeCommunityUserProfile(user)];
    });
}

export function writeCommunityUsers(users: CommunityUserProfile[]) {
  writeJson(
    communityUsersStorageKey,
    users
      .filter((user) => !user.id.startsWith(legacyMockUserIdPrefix))
      .map((user) => normalizeCommunityUserProfile(user)),
  );
}

export function getCommunityUser(userId: string) {
  return readCommunityUsers().find((user) => user.id === userId || user.accountId === userId);
}

export function mergeCommunityPosts(primary: CommunityPost[], fallback: CommunityPost[]) {
  const seen = new Set<string>();
  return [...primary, ...fallback].filter((post) => {
    if (seen.has(post.id)) return false;
    seen.add(post.id);
    return true;
  });
}
