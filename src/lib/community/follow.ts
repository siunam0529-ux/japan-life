import { communityCurrentUserId, defaultCommunityUserProfile, readCommunityIdSet, readCommunityPosts, readCommunityUserProfile, readCommunityUsers, writeCommunityIdSet } from "@/lib/community/storage";
import type { CommunityPost, CommunityUserProfile } from "@/lib/community/types";

export const communityFollowingUsersStorageKey = "japan-life-community-following-users";
export const communityFollowerUsersStorageKey = "japan-life-community-follower-users";
export const communityFollowRemarksStorageKey = "japan-life-community-follow-remarks";
const communityFollowDataVersionKey = "japan-life-community-follow-data-version";
const communityFollowDataVersion = "account-v1";

export type CommunityFollowStats = {
  followerCount: number;
  followingCount: number;
  isMutual: boolean;
  userFollowsViewer: boolean;
  viewerFollowsUser: boolean;
};

export type CommunityFollowListKind = "followers" | "following";
export type CommunityFollowPageTab = "mutual" | CommunityFollowListKind;

export function readCommunityFollowingUsers() {
  ensureCommunityFollowStorageMigrated();
  return readCommunityIdSet(communityFollowingUsersStorageKey);
}

export function writeCommunityFollowingUsers(values: Set<string>) {
  ensureCommunityFollowStorageMigrated();
  writeCommunityIdSet(communityFollowingUsersStorageKey, values);
}

export function readCommunityFollowerUsers() {
  ensureCommunityFollowStorageMigrated();
  return readCommunityIdSet(communityFollowerUsersStorageKey);
}

export function writeCommunityFollowerUsers(values: Set<string>) {
  ensureCommunityFollowStorageMigrated();
  writeCommunityIdSet(communityFollowerUsersStorageKey, values);
}

export function followCommunityUser(userId: string) {
  const targetUserId = userId.trim();
  if (!targetUserId || targetUserId === communityCurrentUserId) return readCommunityFollowingUsers();
  const next = readCommunityFollowingUsers();
  next.add(targetUserId);
  writeCommunityFollowingUsers(next);
  return next;
}

export function unfollowCommunityUser(userId: string) {
  const targetUserId = userId.trim();
  const next = readCommunityFollowingUsers();
  next.delete(targetUserId);
  writeCommunityFollowingUsers(next);
  return next;
}

export function removeCommunityFollower(userId: string) {
  const targetUserId = userId.trim();
  const next = readCommunityFollowerUsers();
  next.delete(targetUserId);
  writeCommunityFollowerUsers(next);
  return next;
}

export function removeCommunityRelationship(userId: string) {
  return {
    followers: removeCommunityFollower(userId),
    following: unfollowCommunityUser(userId),
  };
}

export function getCommunityFollowStats(userId: string, options: { currentUserId?: string; isOwnProfile?: boolean } = {}): CommunityFollowStats {
  const currentUserId = options.currentUserId || communityCurrentUserId;
  const isOwnProfile = Boolean(options.isOwnProfile || userId === currentUserId);
  const followingUsers = readCommunityFollowingUsers();
  const followerUsers = readCommunityFollowerUsers();
  const viewerFollowsUser = !isOwnProfile && followingUsers.has(userId);
  const userFollowsViewer = !isOwnProfile && followerUsers.has(userId);
  const localFollowerBoost = viewerFollowsUser ? 1 : 0;

  return {
    followerCount: isOwnProfile ? followerUsers.size : localFollowerBoost,
    followingCount: isOwnProfile ? followingUsers.size : 0,
    isMutual: viewerFollowsUser && userFollowsViewer,
    userFollowsViewer,
    viewerFollowsUser,
  };
}

export function getCommunityFollowList(userId: string, kind: CommunityFollowListKind, options: { isOwnProfile?: boolean } = {}): CommunityUserProfile[] {
  const users = readCommunityFollowCandidateUsers();
  const isOwnProfile = Boolean(options.isOwnProfile || userId === communityCurrentUserId);

  if (kind === "following") {
    const ids = isOwnProfile ? readCommunityFollowingUsers() : new Set<string>();
    return orderUsersByIds(ids, users);
  }

  const ids = isOwnProfile
    ? readCommunityFollowerUsers()
    : new Set(readCommunityFollowingUsers().has(userId) ? [communityCurrentUserId] : []);
  return orderUsersByIds(ids, users);
}

export function getCommunityMutualFollowList(userId: string, options: { isOwnProfile?: boolean } = {}): CommunityUserProfile[] {
  const users = readCommunityFollowCandidateUsers();
  const isOwnProfile = Boolean(options.isOwnProfile || userId === communityCurrentUserId);
  if (!isOwnProfile) {
    const following = getCommunityFollowList(userId, "following", { isOwnProfile });
    const followers = getCommunityFollowList(userId, "followers", { isOwnProfile });
    const followerIds = new Set(followers.map((user) => user.id));
    return following.filter((user) => followerIds.has(user.id));
  }

  const followingIds = readCommunityFollowingUsers();
  const followerIds = readCommunityFollowerUsers();
  return users.filter((user) => followingIds.has(user.id) && followerIds.has(user.id));
}

function readCommunityFollowCandidateUsers() {
  const byId = new Map<string, CommunityUserProfile>();
  const addUser = (user: CommunityUserProfile) => {
    if (!user.id || byId.has(user.id)) return;
    byId.set(user.id, user);
  };

  readCommunityUsers().forEach(addUser);
  addUser(readCommunityUserProfile());
  readCommunityPosts().forEach((post) => {
    if (!post.authorId || post.isAnonymous) return;
    addUser(createProfileFromPostAuthor(post));
  });

  return [...byId.values()];
}

function orderUsersByIds(ids: Set<string>, users: CommunityUserProfile[]) {
  const byId = new Map(users.map((user) => [user.id, user]));
  return [...ids].map((id) => byId.get(id) ?? createFallbackProfileFromId(id));
}

function createProfileFromPostAuthor(post: CommunityPost): CommunityUserProfile {
  return {
    ...defaultCommunityUserProfile,
    area: post.area || defaultCommunityUserProfile.area,
    avatar: defaultCommunityUserProfile.avatar,
    bio: "",
    commentReceivedCount: 0,
    displayName: post.authorName || "Japan Life 用户",
    favoriteReceivedCount: post.favoriteCount ?? post.favorites ?? 0,
    id: post.authorId,
    joinedAt: "",
    likeReceivedCount: post.likeCount ?? post.likes ?? 0,
    postCount: 1,
  };
}

function createFallbackProfileFromId(id: string): CommunityUserProfile {
  return {
    ...defaultCommunityUserProfile,
    bio: "",
    displayName: "Japan Life 用户",
    id,
    joinedAt: "",
  };
}

export function getCommunityFollowRemark(userId: string) {
  return readCommunityFollowRemarks()[userId] || "";
}

export function setCommunityFollowRemark(userId: string, remark: string) {
  const remarks = readCommunityFollowRemarks();
  const nextRemark = remark.trim().slice(0, 20);
  if (nextRemark) remarks[userId] = nextRemark;
  else delete remarks[userId];
  writeCommunityFollowRemarks(remarks);
  return nextRemark;
}

function readCommunityFollowRemarks() {
  ensureCommunityFollowStorageMigrated();
  if (typeof window === "undefined") return {} as Record<string, string>;
  try {
    const value = JSON.parse(window.localStorage.getItem(communityFollowRemarksStorageKey) || "{}") as Record<string, unknown>;
    return Object.fromEntries(Object.entries(value).filter(([, remark]) => typeof remark === "string")) as Record<string, string>;
  } catch {
    return {};
  }
}

function writeCommunityFollowRemarks(remarks: Record<string, string>) {
  ensureCommunityFollowStorageMigrated();
  if (typeof window === "undefined") return;
  window.localStorage.setItem(communityFollowRemarksStorageKey, JSON.stringify(remarks));
}

function ensureCommunityFollowStorageMigrated() {
  if (typeof window === "undefined") return;
  if (window.localStorage.getItem(communityFollowDataVersionKey) === communityFollowDataVersion) return;
  window.localStorage.setItem(communityFollowDataVersionKey, communityFollowDataVersion);
}
