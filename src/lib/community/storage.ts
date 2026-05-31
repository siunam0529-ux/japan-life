import {
  isCommunityCommentStatus,
  isCommunityContactRequestStatus,
  isCommunityLocale,
  isCommunityNotificationTargetType,
  isCommunityNotificationType,
  isCommunityPostType,
  isCommunityPostStatus,
  isCommunityReportStatus,
  type CommunityComment,
  type CommunityContactRequest,
  type CommunityLocale,
  type CommunityNotification,
  type CommunityPost,
  type CommunityReport,
  type CommunityReportTargetType,
  type CommunityUserProfile,
} from "@/lib/community/types";
import { CURRENT_USER_ID, CURRENT_USER_NAME } from "@/lib/community/currentUser";

export const communityPostsStorageKey = "japan-life-community-posts";
export const communityCommentsStorageKey = "japan-life-community-comments";
export const communityContactRequestsStorageKey = "japan-life-community-contact-requests";
export const communityLikesStorageKey = "japan-life-community-likes";
export const communityFavoritesStorageKey = "japan-life-community-favorites";
export const communityReportsStorageKey = "japan-life-community-reports";
export const communityNotificationsStorageKey = "japan-life-community-notifications";
export const communityUserProfileStorageKey = "japan-life-community-user-profile";
export const communityUsersStorageKey = "japan-life-community-users";

export const communityCurrentUserId = CURRENT_USER_ID;
export const communityLocalUserId = CURRENT_USER_ID;
export const communityLocalUserName = CURRENT_USER_NAME;

export const defaultCommunityUserProfile: CommunityUserProfile = {
  area: "东京",
  avatar: "linear-gradient(135deg, #60a5fa, #f9a8d4)",
  bio: "在东京生活中，喜欢记录美食、省钱技巧和适合散步的地方。",
  commentReceivedCount: 0,
  displayName: "Nam",
  favoriteReceivedCount: 0,
  id: communityCurrentUserId,
  interests: ["美食", "散步", "省钱", "生活分享"],
  isAnonymousDefault: false,
  joinedAt: "2026/05",
  languages: ["简中", "繁中", "日本語"],
  likeReceivedCount: 0,
  postCount: 0,
};

export const mockCommunityUsers: CommunityUserProfile[] = [
  defaultCommunityUserProfile,
  {
    area: "新宿",
    avatar: "linear-gradient(135deg, #34d399, #93c5fd)",
    bio: "喜欢咖啡、看展和语言交换，常在新宿附近活动。",
    commentReceivedCount: 0,
    displayName: "Miki",
    favoriteReceivedCount: 0,
    id: "mock-user-miki",
    interests: ["咖啡", "看展", "语言交换"],
    isAnonymousDefault: false,
    joinedAt: "2026/04",
    languages: ["日本語", "中文"],
    likeReceivedCount: 0,
    postCount: 0,
  },
  {
    area: "池袋",
    avatar: "linear-gradient(135deg, #f472b6, #60a5fa)",
    bio: "关注二手、搬家和打工资讯，常分享省钱经验。",
    commentReceivedCount: 0,
    displayName: "Ken",
    favoriteReceivedCount: 0,
    id: "mock-user-ken",
    interests: ["二手", "搬家", "打工"],
    isAnonymousDefault: false,
    joinedAt: "2026/03",
    languages: ["繁中", "日本語"],
    likeReceivedCount: 0,
    postCount: 0,
  },
  {
    area: "上野",
    avatar: "linear-gradient(135deg, #2dd4bf, #f9a8d4)",
    bio: "散歩、グルメ、写真が好きです。上野周辺をよく歩きます。",
    commentReceivedCount: 0,
    displayName: "Aya",
    favoriteReceivedCount: 0,
    id: "mock-user-aya",
    interests: ["散歩", "グルメ", "写真"],
    isAnonymousDefault: false,
    joinedAt: "2026/02",
    languages: ["日本語"],
    likeReceivedCount: 0,
    postCount: 0,
  },
  {
    area: "板桥区",
    avatar: "linear-gradient(135deg, #818cf8, #38bdf8)",
    bio: "正在熟悉日本生活，常看租房、手续和宠物相关内容。",
    commentReceivedCount: 0,
    displayName: "Lin",
    favoriteReceivedCount: 0,
    id: "mock-user-lin",
    interests: ["租房", "手续", "宠物"],
    isAnonymousDefault: false,
    joinedAt: "2026/01",
    languages: ["简中", "日本語"],
    likeReceivedCount: 0,
    postCount: 0,
  },
];

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
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
    .map((item) => {
      const legacyFeatured = Boolean(item.featured);
      const isFeatured = Boolean(item.isFeatured ?? legacyFeatured);
      const likeCount = Number.isFinite(Number(item.likeCount ?? item.likes)) ? Number(item.likeCount ?? item.likes) : 0;
      const commentCount = Number.isFinite(Number(item.commentCount ?? item.comments)) ? Number(item.commentCount ?? item.comments) : 0;
      const favoriteCount = Number.isFinite(Number(item.favoriteCount ?? item.favorites)) ? Number(item.favoriteCount ?? item.favorites) : 0;
      return {
        ...item,
        authorId: item.authorId === "japan-life-local-user" ? communityCurrentUserId : (typeof item.authorId === "string" ? item.authorId : ""),
        authorName: typeof item.authorName === "string" && item.authorName.trim() ? item.authorName : communityLocalUserName,
        area: typeof item.area === "string" && item.area.trim() ? item.area : "东京",
        communityLocale: isCommunityLocale(String(item.communityLocale ?? "")) ? item.communityLocale : defaultLocale,
        content: typeof item.content === "string" ? item.content : "",
        commentCount,
        comments: commentCount,
        featured: legacyFeatured || isFeatured,
        featuredReason: typeof item.featuredReason === "string" ? item.featuredReason : undefined,
        favoriteCount,
        favorites: favoriteCount,
        images: Array.isArray(item.images) ? item.images : [],
        isFeatured,
        isOfficialRecommended: Boolean(item.isOfficialRecommended),
        isPinned: Boolean(item.isPinned),
        likeCount,
        likes: likeCount,
        pinnedUntil: typeof item.pinnedUntil === "string" ? item.pinnedUntil : null,
        reportCount: Number.isFinite(Number(item.reportCount)) ? Number(item.reportCount) : 0,
        status: isCommunityPostStatus(String(item.status ?? "")) ? item.status : "published",
        tags: Array.isArray(item.tags) ? item.tags.filter((tag): tag is string => typeof tag === "string") : [],
        title: typeof item.title === "string" && item.title.trim() ? item.title : "社区内容",
        type: isCommunityPostType(String(item.type ?? "")) ? item.type : "share",
      } as CommunityPost;
    });
}

export function writeCommunityPosts(posts: CommunityPost[]) {
  writeJson(communityPostsStorageKey, posts);
}

function normalizeStringList(value: unknown, fallback: string[]) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string" && Boolean(item.trim()))
    : fallback;
}

function normalizeCommunityUserProfile(value: Partial<CommunityUserProfile> | null | undefined, fallback: CommunityUserProfile = defaultCommunityUserProfile): CommunityUserProfile {
  return {
    area: typeof value?.area === "string" && value.area.trim() ? value.area : fallback.area,
    avatar: typeof value?.avatar === "string" && value.avatar.trim() ? value.avatar : fallback.avatar,
    bio: typeof value?.bio === "string" ? value.bio : fallback.bio,
    commentReceivedCount: Number.isFinite(Number(value?.commentReceivedCount)) ? Number(value?.commentReceivedCount) : fallback.commentReceivedCount,
    displayName: typeof value?.displayName === "string" && value.displayName.trim() ? value.displayName : fallback.displayName,
    favoriteReceivedCount: Number.isFinite(Number(value?.favoriteReceivedCount)) ? Number(value?.favoriteReceivedCount) : fallback.favoriteReceivedCount,
    id: typeof value?.id === "string" && value.id.trim() ? value.id : fallback.id,
    interests: normalizeStringList(value?.interests, fallback.interests),
    isAnonymousDefault: Boolean(value?.isAnonymousDefault),
    joinedAt: typeof value?.joinedAt === "string" && value.joinedAt.trim() ? value.joinedAt : fallback.joinedAt,
    languages: normalizeStringList(value?.languages, fallback.languages),
    likeReceivedCount: Number.isFinite(Number(value?.likeReceivedCount)) ? Number(value?.likeReceivedCount) : fallback.likeReceivedCount,
    postCount: Number.isFinite(Number(value?.postCount)) ? Number(value?.postCount) : fallback.postCount,
  };
}

export function readCommunityUserProfile() {
  return normalizeCommunityUserProfile(readJson<Partial<CommunityUserProfile> | null>(communityUserProfileStorageKey, null));
}

export function writeCommunityUserProfile(profile: CommunityUserProfile) {
  const nextProfile = normalizeCommunityUserProfile(profile);
  writeJson(communityUserProfileStorageKey, nextProfile);
  const users = readCommunityUsers();
  writeCommunityUsers([nextProfile, ...users.filter((user) => user.id !== nextProfile.id)]);
}

export function readCommunityUsers() {
  const stored = readJson<Partial<CommunityUserProfile>[]>(communityUsersStorageKey, []);
  if (stored.length === 0) writeJson(communityUsersStorageKey, mockCommunityUsers);
  const users = stored.length
    ? stored.flatMap((user) => typeof user?.id === "string" ? [normalizeCommunityUserProfile(user, mockCommunityUsers.find((item) => item.id === user.id) ?? defaultCommunityUserProfile)] : [])
    : mockCommunityUsers;
  const currentProfile = readCommunityUserProfile();
  const merged = [currentProfile, ...users, ...mockCommunityUsers];
  const seen = new Set<string>();
  return merged.filter((user) => {
    if (seen.has(user.id)) return false;
    seen.add(user.id);
    return true;
  });
}

export function writeCommunityUsers(users: CommunityUserProfile[]) {
  writeJson(communityUsersStorageKey, users.map((user) => normalizeCommunityUserProfile(user, mockCommunityUsers.find((item) => item.id === user.id) ?? defaultCommunityUserProfile)));
}

export function getCommunityUser(userId: string) {
  return readCommunityUsers().find((user) => user.id === userId);
}

export function mergeCommunityPosts(primary: CommunityPost[], fallback: CommunityPost[]) {
  const seen = new Set<string>();
  return [...primary, ...fallback].filter((post) => {
    if (seen.has(post.id)) return false;
    seen.add(post.id);
    return true;
  });
}

export function readCommunityComments() {
  return readJson<Partial<CommunityComment>[]>(communityCommentsStorageKey, [])
    .filter((item) => item && typeof item.id === "string")
    .map((item) => ({
      ...item,
      authorId: item.authorId === "japan-life-local-user" ? communityCurrentUserId : (typeof item.authorId === "string" ? item.authorId : ""),
      communityLocale: isCommunityLocale(String(item.communityLocale ?? "")) ? item.communityLocale : "zh-cn",
      likeCount: Number.isFinite(Number(item.likeCount)) ? Number(item.likeCount) : 0,
      parentId: typeof item.parentId === "string" ? item.parentId : undefined,
      reportCount: Number.isFinite(Number(item.reportCount)) ? Number(item.reportCount) : 0,
      status: isCommunityCommentStatus(String(item.status ?? "")) ? item.status : "published",
    }) as CommunityComment);
}

export function writeCommunityComments(comments: CommunityComment[]) {
  writeJson(communityCommentsStorageKey, comments);
}

export function readCommunityContactRequests() {
  return readJson<Partial<CommunityContactRequest>[]>(communityContactRequestsStorageKey, [])
    .filter((item) => item && typeof item.id === "string")
    .map((item) => ({
      ...item,
      communityLocale: isCommunityLocale(String(item.communityLocale ?? "")) ? item.communityLocale : "zh-cn",
      fromUserId: item.fromUserId === "japan-life-local-user" ? communityCurrentUserId : (typeof item.fromUserId === "string" ? item.fromUserId : ""),
      status: isCommunityContactRequestStatus(String(item.status ?? "")) ? item.status : "pending",
    }) as CommunityContactRequest);
}

export function writeCommunityContactRequests(requests: CommunityContactRequest[]) {
  writeJson(communityContactRequestsStorageKey, requests);
}

function isReportTargetType(value: string): value is CommunityReportTargetType {
  return value === "post" || value === "comment" || value === "user";
}

export function readCommunityReports() {
  const raw = readJson<unknown[]>(communityReportsStorageKey, []);
  return raw.flatMap((item): CommunityReport[] => {
    if (typeof item === "string") {
      const [targetId, reason = "其他"] = item.split(":");
      if (!targetId) return [];
      return [{
        id: `legacy-report-${targetId}-${reason}`,
        createdAt: "",
        detail: "",
        reason,
        status: "pending",
        targetId,
        targetType: "post",
      }];
    }
    if (!item || typeof item !== "object") return [];
    const report = item as Partial<CommunityReport>;
    if (typeof report.id !== "string" || typeof report.targetId !== "string") return [];
    const status = String(report.status ?? "");
    const targetType = String(report.targetType ?? "");
    return [{
      id: report.id,
      createdAt: typeof report.createdAt === "string" ? report.createdAt : "",
      detail: typeof report.detail === "string" ? report.detail : "",
      reason: typeof report.reason === "string" ? report.reason : "其他",
      status: isCommunityReportStatus(status) ? status : "pending",
      targetId: report.targetId,
      targetType: isReportTargetType(targetType) ? targetType : "post",
    }];
  });
}

export function writeCommunityReports(reports: CommunityReport[]) {
  writeJson(communityReportsStorageKey, reports);
}

export function createCommunityNotification(input: Omit<CommunityNotification, "createdAt" | "id" | "isRead"> & { createdAt?: string; id?: string; isRead?: boolean }) {
  return {
    ...input,
    createdAt: input.createdAt ?? formatCommunityNow(),
    id: input.id ?? createCommunityId("community-notification"),
    isRead: input.isRead ?? false,
  };
}

export function createMockCommunityNotifications() {
  return [
    createCommunityNotification({
      id: "mock-community-notification-1",
      communityLocale: "zh-cn",
      message: "Miki：这个表格我之前也填过，可以这样写。",
      postId: "mock-community-zh-cn-2",
      targetId: "mock-community-zh-cn-2",
      targetType: "post",
      title: "有人评论了你的帖子",
      type: "comment",
      userId: communityCurrentUserId,
    }),
    createCommunityNotification({
      id: "mock-community-notification-2",
      communityLocale: "zh-cn",
      message: "对方对你的「搬家出清：小冰箱免费送」感兴趣。",
      postId: "mock-community-zh-cn-3",
      targetId: "mock-community-zh-cn-3",
      targetType: "contact_request",
      title: "有人申请联系你",
      type: "contact_request",
      userId: communityCurrentUserId,
    }),
    createCommunityNotification({
      id: "mock-community-notification-3",
      communityLocale: "zh-cn",
      isRead: true,
      message: "你的分享「池袋这家中华料理午餐很便宜」收到新的点赞。",
      postId: "mock-community-zh-cn-1",
      targetId: "mock-community-zh-cn-1",
      targetType: "post",
      title: "有人点赞了你的帖子",
      type: "like",
      userId: communityCurrentUserId,
    }),
    createCommunityNotification({
      id: "mock-community-notification-4",
      communityLocale: "zh-tw",
      message: "有人回复了你的繁中社區帖子。",
      postId: "mock-community-zh-tw-2",
      targetId: "mock-community-zh-tw-2",
      targetType: "post",
      title: "有人留言",
      type: "comment",
      userId: communityCurrentUserId,
    }),
    createCommunityNotification({
      id: "mock-community-notification-5",
      communityLocale: "ja",
      isRead: true,
      message: "あなたの投稿が日本語コミュニティで公開されました。",
      postId: "mock-community-ja-2",
      targetId: "mock-community-ja-2",
      targetType: "post",
      title: "投稿が承認されました",
      type: "post_approved",
      userId: communityCurrentUserId,
    }),
    createCommunityNotification({
      id: "mock-community-notification-6",
      communityLocale: "zh-cn",
      message: "线下见面请优先选择公共场所，不要提前转账。",
      targetType: "system",
      title: "社区安全提醒",
      type: "system",
      userId: communityCurrentUserId,
    }),
  ];
}

export function readCommunityNotifications() {
  const stored = readJson<Partial<CommunityNotification>[]>(communityNotificationsStorageKey, []);
  if (stored.length === 0) return createMockCommunityNotifications();
  return stored
    .filter((item) => item && typeof item.id === "string")
    .map((item) => {
      const type = String(item.type ?? "");
      const targetType = String(item.targetType ?? "");
      return {
        id: item.id as string,
        communityLocale: isCommunityLocale(String(item.communityLocale ?? "")) ? item.communityLocale : "zh-cn",
        createdAt: typeof item.createdAt === "string" ? item.createdAt : "",
        isRead: Boolean(item.isRead),
        message: typeof item.message === "string" ? item.message : "",
        postId: typeof item.postId === "string" ? item.postId : undefined,
        targetId: typeof item.targetId === "string" ? item.targetId : undefined,
        targetType: isCommunityNotificationTargetType(targetType) ? targetType : undefined,
        title: typeof item.title === "string" ? item.title : "",
        type: isCommunityNotificationType(type) ? type : "system",
        userId: typeof item.userId === "string" ? item.userId : communityCurrentUserId,
      } as CommunityNotification;
    });
}

export function writeCommunityNotifications(notifications: CommunityNotification[]) {
  writeJson(communityNotificationsStorageKey, notifications);
}

export function addCommunityNotification(notification: CommunityNotification) {
  const notifications = readCommunityNotifications();
  writeCommunityNotifications([notification, ...notifications].slice(0, 300));
}

export function readCommunityIdSet(key: string) {
  return new Set(readJson<string[]>(key, []).filter((item) => typeof item === "string"));
}

export function writeCommunityIdSet(key: string, values: Set<string>) {
  writeJson(key, [...values]);
}
