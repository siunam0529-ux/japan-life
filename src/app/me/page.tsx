"use client";

import type { User } from "@supabase/supabase-js";
import { Camera, Heart, Lock, MapPin, Pencil, Settings, Sparkles, UserRound, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { BackButton } from "@/components/BackButton";
import { useLanguage } from "@/hooks/useLanguage";
import { getAccountAreaDisplay } from "@/lib/account/area";
import { createCommunityProfileFromMeProfile, readMeProfile } from "@/lib/account/profile";
import { getCommunityFollowStats, type CommunityFollowStats } from "@/lib/community/follow";
import { communityShowCommentsKey as showCommentsKey, communityShowFavoritesKey as showFavoritesKey, communityShowLikedKey as showLikedKey } from "@/lib/community/privacy";
import { communityReactionChangeEvent } from "@/lib/community/reactionEvents";
import { getCommunityCommentsByAuthor, getCommunityFavoriteIds, getCommunityLikeIds, getCommunityPosts, getCommunityProfile, readCommunityUserProfile, upsertCommunityProfile, writeCommunityUserProfile } from "@/lib/community/repository";
import { getCommunityPostHref } from "@/lib/community/routes";
import type { CommunityComment, CommunityPost, CommunityPostImage, CommunityPostType } from "@/lib/community/types";
import { withBackFrom } from "@/lib/navigation/back";
import { supabase } from "@/lib/supabase";

type ProfileTab = "notes" | "favorites" | "liked" | "comments";

type ProfileNote = {
  id: string;
  title: string;
  category: string;
  coverText: string;
  description: string;
  href?: string;
  image?: CommunityPostImage;
  likedByMe?: boolean;
  time: string;
  likes: number;
};

type ProfileCommentRow = {
  id: string;
  content: string;
  href?: string;
  likes: number;
  postTitle: string;
  time: string;
};

type MeProfileSnapshot = {
  avatar: string;
  bio: string;
  bioUpdatedAt: number;
  id: string;
  idChanged: boolean;
  idUpdatedAt: number;
  name: string;
  nameUpdatedAt: number;
  showComments: boolean;
  showFavorites: boolean;
  showLiked: boolean;
};

const profileNameKey = "japan-life:me-profile-name";
const profileIdKey = "japan-life:me-profile-id";
const profileBioKey = "japan-life:me-profile-bio";
const profileAvatarKey = "japan-life:me-profile-avatar";
const profileIdChangedKey = "japan-life:me-profile-id-changed";
const profileIdUpdatedAtKey = "japan-life:me-profile-id-updated-at";
const profileIdManualUpdatedAtKey = "japan-life:me-profile-id-manual-updated-at";
const profileNameUpdatedAtKey = "japan-life:me-profile-name-updated-at";
const profileNameManualUpdatedAtKey = "japan-life:me-profile-name-manual-updated-at";
const profileBioUpdatedAtKey = "japan-life:me-profile-bio-updated-at";
const profileBioManualUpdatedAtKey = "japan-life:me-profile-bio-manual-updated-at";
const publishHref = "/community/all/new";
const loginHref = "/login?redirect=/me";
const defaultProfileBio = "分享在日生活，记录每个美好瞬间";
const oneDayMs = 24 * 60 * 60 * 1000;
const nameCooldownMs = 7 * oneDayMs;
const bioCooldownMs = oneDayMs;
const idCooldownMs = 365 * oneDayMs;
const meCopy = {
  "zh-CN": {
    defaultName: "Japan Life \u7528\u6237",
    fallbackArea: "\u65e5\u672c",
    avatarUpdated: "\u5934\u50cf\u5df2\u66f4\u65b0\u3002",
    avatarTooLarge: "\u5934\u50cf\u56fe\u7247\u592a\u5927\uff0c\u65e0\u6cd5\u4fdd\u5b58\u5728\u672c\u673a\u3002\u8bf7\u6362\u4e00\u5f20\u66f4\u5c0f\u7684\u56fe\u7247\u3002",
    idCooldown: (remaining: string) => "Japan Life ID 1 \u5e74\u53ea\u80fd\u6539\u4e00\u6b21\uff0c\u8fd8\u8981\u7b49 " + remaining + "\u3002",
    nameCooldown: (remaining: string) => "\u540d\u5b57 7 \u5929\u53ea\u80fd\u6539\u4e00\u6b21\uff0c\u8fd8\u8981\u7b49 " + remaining + "\u3002",
    bioCooldown: (remaining: string) => "\u7b80\u4ecb 1 \u5929\u53ea\u80fd\u6539\u4e00\u6b21\uff0c\u8fd8\u8981\u7b49 " + remaining + "\u3002",
    editProfile: "\u7f16\u8f91\u8d44\u6599",
    close: "\u5173\u95ed",
    name: "\u540d\u5b57",
    nameHint: "\u540d\u5b57 7 \u5929\u53ea\u80fd\u6539\u4e00\u6b21",
    idHint: "Japan Life ID 1 \u5e74\u53ea\u80fd\u6539\u4e00\u6b21\uff0c\u522b\u4eba\u53ef\u4ee5\u7528\u8fd9\u4e2a ID \u641c\u5230\u4f60\u3002",
    bio: "\u7b80\u4ecb",
    bioHint: "\u7b80\u4ecb 1 \u5929\u53ea\u80fd\u6539\u4e00\u6b21",
    publicFavorites: "\u516c\u5f00\u6211\u7684\u6536\u85cf",
    publicLiked: "\u516c\u5f00\u6211\u7684\u8d5e\u8fc7",
    publicComments: "\u516c\u5f00\u6211\u7684\u8bc4\u8bba",
    saving: "\u4fdd\u5b58\u4e2d...",
    save: "\u4fdd\u5b58",
    loadTimeout: "\u52a0\u8f7d\u8d85\u65f6",
    day: (days: number) => String(days) + " \u5929",
    waitMore: (fallback: string, remaining: string) => fallback + "\uff0c\u8fd8\u8981\u7b49 " + remaining + "\u3002",
    noteFallback: "\u5206\u4eab\u5728\u65e5\u751f\u6d3b",
    justNow: "\u521a\u521a",
    commentedNote: "\u8bc4\u8bba\u8fc7\u7684\u7b14\u8bb0",
    categories: { secondhand: "\u7701\u94b1\u60c5\u62a5", buddy: "\u65c5\u884c\u8bb0\u5f55", discount: "\u6298\u6263\u798f\u5229", friend: "\u4ea4\u53cb\u52a8\u6001", default: "\u5728\u65e5\u751f\u6d3b" },
    settings: "\u8bbe\u7f6e",
    following: "\u5173\u6ce8",
    followers: "\u7c89\u4e1d",
    tabs: { notes: "\u7b14\u8bb0", favorites: "\u6536\u85cf", liked: "\u8d5e\u8fc7", comments: "\u8bc4\u8bba" },
    empty: {
      comments: { text: "\u8fd8\u6ca1\u6709\u8bc4\u8bba\u8fc7\u5185\u5bb9" },
      favorites: { text: "\u8fd8\u6ca1\u6709\u6536\u85cf\u5185\u5bb9" },
      liked: { text: "\u8fd8\u6ca1\u6709\u8d5e\u8fc7\u5185\u5bb9" },
      notes: { actionHref: publishHref, actionLabel: "\u53bb\u53d1\u5e03", text: "\u8fd8\u6ca1\u6709\u53d1\u5e03\u5185\u5bb9\uff0c\u53bb\u8bb0\u5f55\u4f60\u7684\u5728\u65e5\u751f\u6d3b\u5427" },
    },
    fromNote: (title: string) => "\u6765\u81ea\u7b14\u8bb0 \u00b7 " + title,
    publicTime: (value: string) => value + " \u65e5\u672c\u3000\u8bbe\u4e3a\u516c\u5f00",
  },
  "zh-TW": {
    defaultName: "Japan Life \u7528\u6236",
    fallbackArea: "\u65e5\u672c",
    avatarUpdated: "\u982d\u50cf\u5df2\u66f4\u65b0\u3002",
    avatarTooLarge: "\u982d\u50cf\u5716\u7247\u592a\u5927\uff0c\u7121\u6cd5\u4fdd\u5b58\u5728\u672c\u6a5f\u3002\u8acb\u63db\u4e00\u5f35\u66f4\u5c0f\u7684\u5716\u7247\u3002",
    idCooldown: (remaining: string) => "Japan Life ID 1 \u5e74\u53ea\u80fd\u6539\u4e00\u6b21\uff0c\u9084\u8981\u7b49 " + remaining + "\u3002",
    nameCooldown: (remaining: string) => "\u540d\u5b57 7 \u5929\u53ea\u80fd\u6539\u4e00\u6b21\uff0c\u9084\u8981\u7b49 " + remaining + "\u3002",
    bioCooldown: (remaining: string) => "\u7c21\u4ecb 1 \u5929\u53ea\u80fd\u6539\u4e00\u6b21\uff0c\u9084\u8981\u7b49 " + remaining + "\u3002",
    editProfile: "\u7de8\u8f2f\u8cc7\u6599",
    close: "\u95dc\u9589",
    name: "\u540d\u5b57",
    nameHint: "\u540d\u5b57 7 \u5929\u53ea\u80fd\u6539\u4e00\u6b21",
    idHint: "Japan Life ID 1 \u5e74\u53ea\u80fd\u6539\u4e00\u6b21\uff0c\u5225\u4eba\u53ef\u4ee5\u7528\u9019\u500b ID \u641c\u5230\u4f60\u3002",
    bio: "\u7c21\u4ecb",
    bioHint: "\u7c21\u4ecb 1 \u5929\u53ea\u80fd\u6539\u4e00\u6b21",
    publicFavorites: "\u516c\u958b\u6211\u7684\u6536\u85cf",
    publicLiked: "\u516c\u958b\u6211\u7684\u6309\u8b9a",
    publicComments: "\u516c\u958b\u6211\u7684\u8a55\u8ad6",
    saving: "\u4fdd\u5b58\u4e2d...",
    save: "\u4fdd\u5b58",
    loadTimeout: "\u8f09\u5165\u903e\u6642",
    day: (days: number) => String(days) + " \u5929",
    waitMore: (fallback: string, remaining: string) => fallback + "\uff0c\u9084\u8981\u7b49 " + remaining + "\u3002",
    noteFallback: "\u5206\u4eab\u5728\u65e5\u751f\u6d3b",
    justNow: "\u525b\u525b",
    commentedNote: "\u8a55\u8ad6\u904e\u7684\u7b46\u8a18",
    categories: { secondhand: "\u7701\u9322\u60c5\u5831", buddy: "\u65c5\u884c\u8a18\u9304", discount: "\u6298\u6263\u798f\u5229", friend: "\u4ea4\u53cb\u52d5\u614b", default: "\u5728\u65e5\u751f\u6d3b" },
    settings: "\u8a2d\u5b9a",
    following: "\u95dc\u6ce8",
    followers: "\u7c89\u7d72",
    tabs: { notes: "\u7b46\u8a18", favorites: "\u6536\u85cf", liked: "\u6309\u8b9a", comments: "\u8a55\u8ad6" },
    empty: {
      comments: { text: "\u9084\u6c92\u6709\u8a55\u8ad6\u904e\u5167\u5bb9" },
      favorites: { text: "\u9084\u6c92\u6709\u6536\u85cf\u5167\u5bb9" },
      liked: { text: "\u9084\u6c92\u6709\u6309\u8b9a\u5167\u5bb9" },
      notes: { actionHref: publishHref, actionLabel: "\u53bb\u767c\u5e03", text: "\u9084\u6c92\u6709\u767c\u5e03\u5167\u5bb9\uff0c\u53bb\u8a18\u9304\u4f60\u7684\u5728\u65e5\u751f\u6d3b\u5427" },
    },
    fromNote: (title: string) => "\u4f86\u81ea\u7b46\u8a18 \u00b7 " + title,
    publicTime: (value: string) => value + " \u65e5\u672c\u3000\u8a2d\u70ba\u516c\u958b",
  },
  ja: {
    defaultName: "Japan Life \u30e6\u30fc\u30b6\u30fc",
    fallbackArea: "\u65e5\u672c",
    avatarUpdated: "\u30a2\u30d0\u30bf\u30fc\u3092\u66f4\u65b0\u3057\u307e\u3057\u305f\u3002",
    avatarTooLarge: "\u753b\u50cf\u304c\u5927\u304d\u3059\u304e\u3066\u7aef\u672b\u306b\u4fdd\u5b58\u3067\u304d\u307e\u305b\u3093\u3002\u5c0f\u3055\u3081\u306e\u753b\u50cf\u306b\u5909\u66f4\u3057\u3066\u304f\u3060\u3055\u3044\u3002",
    idCooldown: (remaining: string) => "Japan Life ID \u306f1\u5e74\u306b1\u56de\u3060\u3051\u5909\u66f4\u3067\u304d\u307e\u3059\u3002\u3042\u3068 " + remaining + " \u5f85\u3063\u3066\u304f\u3060\u3055\u3044\u3002",
    nameCooldown: (remaining: string) => "\u540d\u524d\u306f7\u65e5\u306b1\u56de\u3060\u3051\u5909\u66f4\u3067\u304d\u307e\u3059\u3002\u3042\u3068 " + remaining + " \u5f85\u3063\u3066\u304f\u3060\u3055\u3044\u3002",
    bioCooldown: (remaining: string) => "\u81ea\u5df1\u7d39\u4ecb\u306f1\u65e5\u306b1\u56de\u3060\u3051\u5909\u66f4\u3067\u304d\u307e\u3059\u3002\u3042\u3068 " + remaining + " \u5f85\u3063\u3066\u304f\u3060\u3055\u3044\u3002",
    editProfile: "\u30d7\u30ed\u30d5\u30a3\u30fc\u30eb\u7de8\u96c6",
    close: "\u9589\u3058\u308b",
    name: "\u540d\u524d",
    nameHint: "\u540d\u524d\u306f7\u65e5\u306b1\u56de\u3060\u3051\u5909\u66f4\u3067\u304d\u307e\u3059",
    idHint: "Japan Life ID \u306f1\u5e74\u306b1\u56de\u3060\u3051\u5909\u66f4\u3067\u304d\u307e\u3059\u3002\u4ed6\u306e\u4eba\u306f\u3053\u306eID\u3067\u3042\u306a\u305f\u3092\u691c\u7d22\u3067\u304d\u307e\u3059\u3002",
    bio: "\u81ea\u5df1\u7d39\u4ecb",
    bioHint: "\u81ea\u5df1\u7d39\u4ecb\u306f1\u65e5\u306b1\u56de\u3060\u3051\u5909\u66f4\u3067\u304d\u307e\u3059",
    publicFavorites: "\u4fdd\u5b58\u3057\u305f\u6295\u7a3f\u3092\u516c\u958b",
    publicLiked: "\u3044\u3044\u306d\u3057\u305f\u6295\u7a3f\u3092\u516c\u958b",
    publicComments: "\u30b3\u30e1\u30f3\u30c8\u3092\u516c\u958b",
    saving: "\u4fdd\u5b58\u4e2d...",
    save: "\u4fdd\u5b58",
    loadTimeout: "\u8aad\u307f\u8fbc\u307f\u304c\u30bf\u30a4\u30e0\u30a2\u30a6\u30c8\u3057\u307e\u3057\u305f",
    day: (days: number) => String(days) + "\u65e5",
    waitMore: (fallback: string, remaining: string) => fallback + "\u3002\u3042\u3068 " + remaining + " \u5f85\u3063\u3066\u304f\u3060\u3055\u3044\u3002",
    noteFallback: "\u65e5\u672c\u3067\u306e\u66ae\u3089\u3057\u3092\u30b7\u30a7\u30a2",
    justNow: "\u305f\u3063\u305f\u4eca",
    commentedNote: "\u30b3\u30e1\u30f3\u30c8\u3057\u305f\u30ce\u30fc\u30c8",
    categories: { secondhand: "\u7bc0\u7d04\u60c5\u5831", buddy: "\u65c5\u306e\u8a18\u9332", discount: "\u5272\u5f15\u30fb\u7279\u5178", friend: "\u53cb\u9054\u52df\u96c6", default: "\u65e5\u672c\u751f\u6d3b" },
    settings: "\u8a2d\u5b9a",
    following: "\u30d5\u30a9\u30ed\u30fc",
    followers: "\u30d5\u30a9\u30ed\u30ef\u30fc",
    tabs: { notes: "\u30ce\u30fc\u30c8", favorites: "\u4fdd\u5b58", liked: "\u3044\u3044\u306d", comments: "\u30b3\u30e1\u30f3\u30c8" },
    empty: {
      comments: { text: "\u307e\u3060\u30b3\u30e1\u30f3\u30c8\u3057\u305f\u5185\u5bb9\u306f\u3042\u308a\u307e\u305b\u3093" },
      favorites: { text: "\u307e\u3060\u4fdd\u5b58\u3057\u305f\u5185\u5bb9\u306f\u3042\u308a\u307e\u305b\u3093" },
      liked: { text: "\u307e\u3060\u3044\u3044\u306d\u3057\u305f\u5185\u5bb9\u306f\u3042\u308a\u307e\u305b\u3093" },
      notes: { actionHref: publishHref, actionLabel: "\u6295\u7a3f\u3059\u308b", text: "\u307e\u3060\u6295\u7a3f\u304c\u3042\u308a\u307e\u305b\u3093\u3002\u65e5\u672c\u3067\u306e\u66ae\u3089\u3057\u3092\u8a18\u9332\u3057\u3066\u307f\u307e\u3057\u3087\u3046" },
    },
    fromNote: (title: string) => "\u30ce\u30fc\u30c8\u3088\u308a \u00b7 " + title,
    publicTime: (value: string) => value + " \u65e5\u672c\u3000\u516c\u958b\u8a2d\u5b9a",
  },
};

type MeText = typeof meCopy["zh-CN"];


function readProfileSnapshot(user: User | null): MeProfileSnapshot {
  const defaultName = getDefaultProfileName(user);
  const defaultId = getDefaultProfileId(user);
  const rawSavedProfileId = window.localStorage.getItem(profileIdKey);
  const savedProfileId = rawSavedProfileId || defaultId;
  const savedId = savedProfileId === "local-user" || isAccountUuidLikeId(savedProfileId, user) ? defaultId : savedProfileId;
  const savedIdIsDefault = savedId === defaultId;
  const savedManualIdUpdatedAt = Number(window.localStorage.getItem(profileIdManualUpdatedAtKey) || 0);
  const savedIdChanged = !savedIdIsDefault && Number.isFinite(savedManualIdUpdatedAt) && savedManualIdUpdatedAt > 0;
  const savedNameUpdatedAt = Number(window.localStorage.getItem(profileNameManualUpdatedAtKey) || 0);
  const savedBioUpdatedAt = Number(window.localStorage.getItem(profileBioManualUpdatedAtKey) || 0);
  return {
    avatar: window.localStorage.getItem(profileAvatarKey) || "",
    bio: window.localStorage.getItem(profileBioKey) || defaultProfileBio,
    bioUpdatedAt: Number.isFinite(savedBioUpdatedAt) ? savedBioUpdatedAt : 0,
    id: savedId,
    idChanged: savedIdChanged,
    idUpdatedAt: savedIdChanged ? savedManualIdUpdatedAt : 0,
    name: window.localStorage.getItem(profileNameKey) || defaultName,
    nameUpdatedAt: Number.isFinite(savedNameUpdatedAt) ? savedNameUpdatedAt : 0,
    showComments: window.localStorage.getItem(showCommentsKey) === "true",
    showFavorites: window.localStorage.getItem(showFavoritesKey) !== "false",
    showLiked: window.localStorage.getItem(showLikedKey) !== "false",
  };
}

function writeProfileSnapshot(snapshot: MeProfileSnapshot) {
  window.localStorage.setItem(profileNameKey, snapshot.name);
  window.localStorage.setItem(profileIdKey, snapshot.id);
  window.localStorage.setItem(profileBioKey, snapshot.bio);
  window.localStorage.setItem(profileAvatarKey, snapshot.avatar);
  window.localStorage.setItem(profileIdChangedKey, String(snapshot.idChanged));
  window.localStorage.setItem(profileIdUpdatedAtKey, String(snapshot.idUpdatedAt));
  if (snapshot.idChanged && snapshot.idUpdatedAt) window.localStorage.setItem(profileIdManualUpdatedAtKey, String(snapshot.idUpdatedAt));
  else window.localStorage.removeItem(profileIdManualUpdatedAtKey);
  window.localStorage.setItem(profileNameUpdatedAtKey, String(snapshot.nameUpdatedAt));
  if (snapshot.nameUpdatedAt) window.localStorage.setItem(profileNameManualUpdatedAtKey, String(snapshot.nameUpdatedAt));
  else window.localStorage.removeItem(profileNameManualUpdatedAtKey);
  window.localStorage.setItem(profileBioUpdatedAtKey, String(snapshot.bioUpdatedAt));
  if (snapshot.bioUpdatedAt) window.localStorage.setItem(profileBioManualUpdatedAtKey, String(snapshot.bioUpdatedAt));
  else window.localStorage.removeItem(profileBioManualUpdatedAtKey);
  window.localStorage.setItem(showFavoritesKey, String(snapshot.showFavorites));
  window.localStorage.setItem(showLikedKey, String(snapshot.showLiked));
  window.localStorage.setItem(showCommentsKey, String(snapshot.showComments));
}

function createSnapshotFromCommunityProfile(profile: { avatar: string; bio: string; id: string; displayName: string }, user: User | null, fallback: MeProfileSnapshot): MeProfileSnapshot {
  const defaultId = getDefaultProfileId(user);
  const normalizedProfileId = normalizeProfileId(profile.id);
  const publicId = normalizedProfileId && !isAccountUuidLikeId(normalizedProfileId, user) ? normalizedProfileId : fallback.id || defaultId;
  const publicIdChanged = publicId !== defaultId;
  return {
    ...fallback,
    avatar: profile.avatar && !profile.avatar.startsWith("linear-gradient") ? profile.avatar : fallback.avatar,
    bio: profile.bio || fallback.bio,
    bioUpdatedAt: fallback.bioUpdatedAt,
    id: publicId,
    idChanged: publicIdChanged && fallback.idChanged,
    idUpdatedAt: publicIdChanged ? fallback.idUpdatedAt : 0,
    name: profile.displayName || fallback.name,
    nameUpdatedAt: fallback.nameUpdatedAt,
  };
}

function isAccountUuidLikeId(value: string, user: User | null) {
  const normalized = normalizeProfileId(value);
  if (!normalized || !user?.id) return false;
  return normalizeProfileId(user.id).startsWith(normalized) || normalized.startsWith(normalizeProfileId(user.id).slice(0, 8));
}

export default function MePage() {
  const router = useRouter();
  const { language } = useLanguage();
  const text = meCopy[language];
  const searchParams = useSearchParams();
  const [authState, setAuthState] = useState<"checking" | "signed-in" | "signed-out">("checking");
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<ProfileTab>("notes");
  const [profileName, setProfileName] = useState(text.defaultName);
  const [profileId, setProfileId] = useState("local-user");
  const [profileBio, setProfileBio] = useState(defaultProfileBio);
  const [profileAvatar, setProfileAvatar] = useState("");
  const [profileArea, setProfileArea] = useState(text.fallbackArea);
  const [draftName, setDraftName] = useState(text.defaultName);
  const [draftId, setDraftId] = useState("local-user");
  const [draftBio, setDraftBio] = useState(defaultProfileBio);
  const [showFavorites, setShowFavorites] = useState(true);
  const [showLiked, setShowLiked] = useState(true);
  const [showComments, setShowComments] = useState(false);
  const [draftShowFavorites, setDraftShowFavorites] = useState(true);
  const [draftShowLiked, setDraftShowLiked] = useState(true);
  const [draftShowComments, setDraftShowComments] = useState(false);
  const [editing, setEditing] = useState(false);
  const [idUpdatedAt, setIdUpdatedAt] = useState(0);
  const [nameUpdatedAt, setNameUpdatedAt] = useState(0);
  const [bioUpdatedAt, setBioUpdatedAt] = useState(0);
  const [editMessage, setEditMessage] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [allPosts, setAllPosts] = useState<CommunityPost[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [likeIds, setLikeIds] = useState<Set<string>>(new Set());
  const [ownComments, setOwnComments] = useState<CommunityComment[]>([]);
  const [ownPosts, setOwnPosts] = useState<CommunityPost[]>([]);
  const [communityActivityLoading, setCommunityActivityLoading] = useState(true);
  const [followStats, setFollowStats] = useState<CommunityFollowStats>(() => ({
    followerCount: 0,
    followingCount: 0,
    isMutual: false,
    userFollowsViewer: false,
    viewerFollowsUser: false,
  }));

  const applyProfileSnapshot = useCallback((snapshot: MeProfileSnapshot, options: { updateDraft?: boolean } = {}) => {
    setProfileName(snapshot.name);
    setProfileId(snapshot.id);
    setProfileBio(snapshot.bio);
    setProfileAvatar(snapshot.avatar);
    setIdUpdatedAt(snapshot.idUpdatedAt);
    setNameUpdatedAt(snapshot.nameUpdatedAt);
    setBioUpdatedAt(snapshot.bioUpdatedAt);
    setShowFavorites(snapshot.showFavorites);
    setShowLiked(snapshot.showLiked);
    setShowComments(snapshot.showComments);
    setFollowStats(getCommunityFollowStats(authUser?.id || snapshot.id, { currentUserId: authUser?.id, isOwnProfile: true }));
    if (options.updateDraft ?? true) {
      setDraftName(snapshot.name);
      setDraftId(snapshot.id);
      setDraftBio(snapshot.bio);
      setDraftShowFavorites(snapshot.showFavorites);
      setDraftShowLiked(snapshot.showLiked);
      setDraftShowComments(snapshot.showComments);
    }
  }, [authUser?.id]);

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (isProfileTab(tab)) setActiveTab(tab);
  }, [searchParams]);

  const selectTab = useCallback((tab: ProfileTab) => {
    setActiveTab(tab);
    const nextParams = new URLSearchParams(searchParams.toString());
    if (tab === "notes") nextParams.delete("tab");
    else nextParams.set("tab", tab);
    const query = nextParams.toString();
    router.replace(query ? `/me?${query}` : "/me", { scroll: false });
  }, [router, searchParams]);

  useEffect(() => {
    let mounted = true;
    if (!supabase) {
      setAuthState("signed-out");
      setAuthUser(null);
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      const user = data.session?.user ?? null;
      setAuthUser(user);
      setAuthState(user ? "signed-in" : "signed-out");
    }).catch((error) => {
      console.warn("[me] failed to read auth session", error);
      if (!mounted) return;
      setAuthUser(null);
      setAuthState("signed-out");
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user ?? null;
      setAuthUser(user);
      setAuthState(user ? "signed-in" : "signed-out");
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (authState !== "signed-in") return;
    let mounted = true;
    const localSnapshot = readProfileSnapshot(authUser);
    applyProfileSnapshot(localSnapshot);
    writeProfileSnapshot(localSnapshot);

    void getCommunityProfile(authUser?.id || "").then((result) => {
      if (!mounted || !result.data) return;
      const cloudSnapshot = createSnapshotFromCommunityProfile(result.data, authUser, localSnapshot);
      writeProfileSnapshot(cloudSnapshot);
      applyProfileSnapshot(cloudSnapshot);
    });

    return () => {
      mounted = false;
    };
  }, [applyProfileSnapshot, authState, authUser]);

  useEffect(() => {
    if (authState !== "signed-in") return;
    const refreshProfile = () => {
      applyProfileSnapshot(readProfileSnapshot(authUser), { updateDraft: !editing });
    };
    window.addEventListener("japan-life:me-profile-change", refreshProfile);
    return () => window.removeEventListener("japan-life:me-profile-change", refreshProfile);
  }, [applyProfileSnapshot, authState, authUser, editing]);

  useEffect(() => {
    const refreshArea = () => setProfileArea(getAccountAreaDisplay());
    refreshArea();
    window.addEventListener("japan-life:user-settings-change", refreshArea);
    window.addEventListener("storage", refreshArea);
    return () => {
      window.removeEventListener("japan-life:user-settings-change", refreshArea);
      window.removeEventListener("storage", refreshArea);
    };
  }, []);

  useEffect(() => {
    if (authState === "signed-out") router.replace(withBackFrom(loginHref, { preferPrevious: true }));
  }, [authState, router]);

  useEffect(() => {
    if (authState !== "signed-in" || !authUser?.id) return;
    let mounted = true;
    setCommunityActivityLoading(true);
    void loadMeCommunityActivity(authUser.id).then(({ allPostResult, commentResult, favoriteResult, likeResult, ownPostResult }) => {
      if (!mounted) return;
      setOwnPosts(ownPostResult.data);
      setAllPosts(allPostResult.data);
      setOwnComments(commentResult.data);
      setFavoriteIds(favoriteResult.data);
      setLikeIds(likeResult.data);
      setCommunityActivityLoading(false);
    }).catch((error) => {
      console.warn("[me] failed to load community activity", error);
      if (mounted) setCommunityActivityLoading(false);
    });
    return () => {
      mounted = false;
    };
  }, [authState, authUser?.id]);

  useEffect(() => {
    if (authState !== "signed-in" || !authUser?.id) return;
    const refreshCommunityActivity = () => {
      void loadMeCommunityActivity(authUser.id).then(({ allPostResult, commentResult, favoriteResult, likeResult, ownPostResult }) => {
        setOwnPosts(ownPostResult.data);
        setAllPosts(allPostResult.data);
        setOwnComments(commentResult.data);
        setFavoriteIds(favoriteResult.data);
        setLikeIds(likeResult.data);
      });
    };
    window.addEventListener(communityReactionChangeEvent, refreshCommunityActivity);
    window.addEventListener("focus", refreshCommunityActivity);
    window.addEventListener("pageshow", refreshCommunityActivity);
    return () => {
      window.removeEventListener(communityReactionChangeEvent, refreshCommunityActivity);
      window.removeEventListener("focus", refreshCommunityActivity);
      window.removeEventListener("pageshow", refreshCommunityActivity);
    };
  }, [authState, authUser?.id]);

  const noteData = useMemo(() => {
    const ownNotes = ownPosts.map((post) => postToProfileNote(post, text, likeIds.has(post.id)));
    const favoriteNotes = allPosts.filter((post) => favoriteIds.has(post.id)).map((post) => postToProfileNote(post, text, likeIds.has(post.id)));
    const likedNotes = allPosts.filter((post) => likeIds.has(post.id)).map((post) => postToProfileNote(post, text, true));
    return {
      comments: [],
      favorites: favoriteNotes,
      liked: likedNotes,
      notes: ownNotes,
    } satisfies Record<ProfileTab, ProfileNote[]>;
  }, [allPosts, favoriteIds, likeIds, ownPosts, text]);

  const commentRows = useMemo(() => commentsToProfileRows(ownComments, allPosts, text), [allPosts, ownComments, text]);

  const notes = useMemo(() => noteData[activeTab], [activeTab, noteData]);
  const effectiveIdUpdatedAt = idUpdatedAt;

  const openEditor = () => {
    setDraftName(profileName);
    setDraftId(profileId);
    setDraftBio(profileBio);
    setDraftShowFavorites(showFavorites);
    setDraftShowLiked(showLiked);
    setDraftShowComments(showComments);
    setEditMessage("");
    setEditing(true);
  };

  const updateAvatar = async (file: File | null) => {
    if (!file || !file.type.startsWith("image/")) return;
    setEditMessage("");
    const uploadedAvatar = await uploadProfileAvatar(file);
    if (uploadedAvatar) {
      setProfileAvatar(uploadedAvatar);
      saveProfileAvatar(uploadedAvatar, authUser, () => setEditMessage(text.avatarUpdated));
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const value = typeof reader.result === "string" ? reader.result : "";
      if (!value) return;
      setProfileAvatar(value);
      saveProfileAvatar(value, authUser, () => setEditMessage(text.avatarTooLarge));
    };
    reader.readAsDataURL(file);
  };

  const saveProfile = async () => {
    const nextName = draftName.trim() || getDefaultProfileName(authUser);
    const nextId = normalizeProfileId(draftId) || getDefaultProfileId(authUser);
    const nextBio = draftBio.trim() || defaultProfileBio;
    const now = Date.now();
    const nameChanged = nextName !== profileName;
    const idChanged = nextId !== profileId;
    const bioChanged = nextBio !== profileBio;

    if (idChanged && !canEditAfter(effectiveIdUpdatedAt, idCooldownMs, now)) {
      setEditMessage(text.idCooldown(formatRemainingTime(effectiveIdUpdatedAt, idCooldownMs, now, text)));
      return;
    }
    if (nameChanged && !canEditAfter(nameUpdatedAt, nameCooldownMs, now)) {
      setEditMessage(text.nameCooldown(formatRemainingTime(nameUpdatedAt, nameCooldownMs, now, text)));
      return;
    }
    if (bioChanged && !canEditAfter(bioUpdatedAt, bioCooldownMs, now)) {
      setEditMessage(text.bioCooldown(formatRemainingTime(bioUpdatedAt, bioCooldownMs, now, text)));
      return;
    }

    const nextSnapshot: MeProfileSnapshot = {
      avatar: profileAvatar,
      bio: nextBio,
      bioUpdatedAt: bioChanged ? now : bioUpdatedAt,
      id: nextId,
      idChanged: idChanged || Boolean(effectiveIdUpdatedAt),
      idUpdatedAt: idChanged ? now : effectiveIdUpdatedAt,
      name: nextName,
      nameUpdatedAt: nameChanged ? now : nameUpdatedAt,
      showComments: draftShowComments,
      showFavorites: draftShowFavorites,
      showLiked: draftShowLiked,
    };

    setSavingProfile(true);
    setEditMessage("");

    const profileResult = await upsertCommunityProfile({
      ...readCommunityUserProfile(),
      accountId: authUser?.id || "",
      avatar: nextSnapshot.avatar || readCommunityUserProfile().avatar,
      bio: nextSnapshot.bio,
      displayName: nextSnapshot.name,
      id: nextSnapshot.id,
    });
    setSavingProfile(false);

    if (profileResult.source === "supabase" && profileResult.error) {
      setEditMessage(profileResult.error);
      return;
    }

    applyProfileSnapshot(nextSnapshot);
    writeProfileSnapshot(nextSnapshot);
    if (profileResult.source === "fallback") {
      writeCommunityUserProfile({ ...readCommunityUserProfile(), accountId: authUser?.id || "", avatar: nextSnapshot.avatar || readCommunityUserProfile().avatar, bio: nextSnapshot.bio, displayName: nextSnapshot.name, id: nextSnapshot.id });
    }
    dispatchMeProfileChange();
    setEditMessage("");
    setEditing(false);
  };

  if (authState === "checking") {
    return (
      <main className="min-h-screen bg-[#eef7ff] text-[#061a3a]">
        <div className="mx-auto flex min-h-screen w-full max-w-[430px] items-center justify-center bg-[linear-gradient(180deg,#eff8ff_0%,#ffffff_100%)] px-4 pb-24">
          <span className="h-10 w-10 animate-pulse rounded-full bg-blue-100" />
        </div>
      </main>
    );
  }

  if (authState === "signed-out") {
    return (
      <main className="min-h-screen bg-[#eef7ff] text-[#061a3a]">
        <div className="mx-auto flex min-h-screen w-full max-w-[430px] items-center justify-center bg-[linear-gradient(180deg,#eff8ff_0%,#ffffff_100%)] px-4 pb-24">
          <span className="h-10 w-10 animate-pulse rounded-full bg-blue-100" />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#eef7ff] text-[#061a3a]">
      <div className="mx-auto min-h-screen w-full max-w-[430px] overflow-x-hidden bg-[linear-gradient(180deg,#eff8ff_0%,#f8fbff_44%,#ffffff_100%)] pb-28">
        <ProfileHero
          bio={profileBio}
          avatar={profileAvatar}
          editable
          id={profileId}
          area={profileArea}
          name={profileName}
          onEdit={openEditor}
          onAvatarChange={updateAvatar}
          stats={{
            followers: followStats.followerCount,
            following: followStats.followingCount,
          }}
          text={text}
        />

        <ProfileContent
          activeTab={activeTab}
          avatar={profileAvatar}
          loading={communityActivityLoading}
          commentRows={commentRows}
          displayName={profileName}
          notes={notes}
          onTabChange={selectTab}
          showComments={showComments}
          showFavorites={showFavorites}
          showLiked={showLiked}
          text={text}
        />
      </div>

      {editing ? (
        <div className="fixed inset-0 z-[80] flex items-end justify-center bg-slate-950/35 px-4 pb-5 pt-16 backdrop-blur-sm">
          <section className="w-full max-w-[430px] rounded-[28px] bg-white p-5 shadow-[0_24px_60px_rgba(15,76,129,0.20)]">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black text-[#061a3a]">{text.editProfile}</h2>
              <button className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 text-[#2563eb]" onClick={() => setEditing(false)} type="button" aria-label={text.close}>
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-4 grid gap-3">
              <ProfileInput hint={getCooldownHint(nameUpdatedAt, nameCooldownMs, text.nameHint, text)} label={text.name} onChange={setDraftName} placeholder={text.defaultName} value={draftName} />
              <ProfileInput disabled={!canEditAfter(effectiveIdUpdatedAt, idCooldownMs)} hint={getCooldownHint(effectiveIdUpdatedAt, idCooldownMs, text.idHint, text)} label="Japan Life ID" onChange={(value) => setDraftId(normalizeProfileId(value))} placeholder="local-user" value={draftId} />
              <ProfileTextarea hint={getCooldownHint(bioUpdatedAt, bioCooldownMs, text.bioHint, text)} label={text.bio} onChange={setDraftBio} placeholder={defaultProfileBio} value={draftBio} />
              <PrivacyToggle checked={draftShowFavorites} label={text.publicFavorites} onChange={setDraftShowFavorites} />
              <PrivacyToggle checked={draftShowLiked} label={text.publicLiked} onChange={setDraftShowLiked} />
              <PrivacyToggle checked={draftShowComments} label={text.publicComments} onChange={setDraftShowComments} />
            </div>
            {editMessage ? <p className="mt-4 rounded-2xl bg-amber-50 px-4 py-3 text-xs font-black leading-5 text-amber-700 ring-1 ring-amber-100">{editMessage}</p> : null}
            <button className="mt-5 flex h-12 w-full items-center justify-center rounded-2xl bg-[#2563eb] text-sm font-black text-white shadow-[0_12px_24px_rgba(37,99,235,0.22)] disabled:bg-slate-300" disabled={savingProfile} onClick={saveProfile} type="button">
              {savingProfile ? text.saving : text.save}
            </button>
          </section>
        </div>
      ) : null}

    </main>
  );
}

function getDefaultProfileName(user: User | null) {
  const metadata = user?.user_metadata as Record<string, unknown> | undefined;
  const metadataName = [metadata?.full_name, metadata?.name]
    .find((value): value is string => typeof value === "string" && Boolean(value.trim()));
  return metadataName?.trim() || user?.email?.split("@")[0] || meCopy["zh-CN"].defaultName;
}

function getDefaultProfileId(user: User | null) {
  return user?.id ? `jl-${user.id.slice(0, 8)}` : "local-user";
}

async function loadMeCommunityActivity(userId: string) {
  const [ownPostResult, allPostResult, commentResult, favoriteResult, likeResult] = await Promise.all([
    withCommunityActivityTimeout(getCommunityPosts({ authorId: userId, status: "published" }), []),
    withCommunityActivityTimeout(getCommunityPosts({ status: "published" }), []),
    withCommunityActivityTimeout(getCommunityCommentsByAuthor(userId), []),
    withCommunityActivityTimeout(getCommunityFavoriteIds(userId), new Set<string>()),
    withCommunityActivityTimeout(getCommunityLikeIds(userId), new Set<string>()),
  ]);
  return { allPostResult, commentResult, favoriteResult, likeResult, ownPostResult };
}

async function withCommunityActivityTimeout<T>(promise: Promise<{ data: T; error: string; source: "fallback" | "supabase" }>, fallbackData: T) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<{ data: T; error: string; source: "fallback" | "supabase" }>((resolve) => {
        timer = setTimeout(() => resolve({ data: fallbackData, error: meCopy["zh-CN"].loadTimeout, source: "fallback" }), 2500);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

async function uploadProfileAvatar(file: File) {
  try {
    const { data } = supabase ? await supabase.auth.getSession() : { data: { session: null } };
    const token = data.session?.access_token ?? "";
    if (!token) return "";
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", "avatars");
    const response = await fetch("/api/upload-public-image", {
      body: formData,
      headers: { authorization: `Bearer ${token}` },
      method: "POST",
    });
    if (!response.ok) return "";
    const result = (await response.json().catch(() => null)) as { publicUrl?: unknown } | null;
    return typeof result?.publicUrl === "string" ? result.publicUrl : "";
  } catch {
    return "";
  }
}

function saveProfileAvatar(value: string, user: User | null, onError: () => void) {
  try {
    window.localStorage.setItem(profileAvatarKey, value);
    void syncCommunityProfileWithMe(user);
    dispatchMeProfileChange();
  } catch {
    onError();
  }
}

async function syncCommunityProfileWithMe(user: User | null) {
  if (!user) return;
  const profile = createCommunityProfileFromMeProfile(readMeProfile(user), readCommunityUserProfile());
  const result = await upsertCommunityProfile(profile);
  if (result.source === "fallback") writeCommunityUserProfile(profile);
}

function dispatchMeProfileChange() {
  window.dispatchEvent(new Event("japan-life:me-profile-change"));
}

function normalizeProfileId(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9_-]/g, "").slice(0, 24);
}

function canEditAfter(lastUpdatedAt: number, cooldownMs: number, now = Date.now()) {
  return !lastUpdatedAt || now - lastUpdatedAt >= cooldownMs;
}

function formatRemainingTime(lastUpdatedAt: number, cooldownMs: number, now = Date.now(), text: MeText = meCopy["zh-CN"]) {
  const remainingMs = Math.max(0, lastUpdatedAt + cooldownMs - now);
  const days = Math.ceil(remainingMs / oneDayMs);
  return text.day(days);
}

function getCooldownHint(lastUpdatedAt: number, cooldownMs: number, fallback: string, text: MeText = meCopy["zh-CN"]) {
  if (!lastUpdatedAt) return fallback;
  if (canEditAfter(lastUpdatedAt, cooldownMs)) return fallback;
  return text.waitMore(fallback, formatRemainingTime(lastUpdatedAt, cooldownMs, Date.now(), text));
}

function parseCommunityTime(value: string) {
  const parsed = Date.parse(value);
  if (Number.isFinite(parsed)) return parsed;
  const match = value.match(/^(\d{2})\/(\d{2})\s+(\d{2}):(\d{2})$/);
  if (!match) return 0;
  const [, month, day, hour, minute] = match;
  return new Date(new Date().getFullYear(), Number(month) - 1, Number(day), Number(hour), Number(minute)).getTime();
}

function postToProfileNote(post: CommunityPost, text: MeText, likedByMe = false): ProfileNote {
  return {
    category: getCategory(post.type, text),
    coverText: getCoverText(post.title, post.content),
    description: post.content || text.noteFallback,
    href: getCommunityPostHref(post, "all"),
    id: post.id,
    image: post.images?.[0],
    likedByMe,
    likes: post.likeCount || post.likes || 0,
    time: post.createdAt || text.justNow,
    title: post.title,
  };
}

function commentsToProfileRows(comments: CommunityComment[], posts: CommunityPost[], text: MeText): ProfileCommentRow[] {
  const postsById = new Map(posts.map((post) => [post.id, post]));
  return [...comments]
    .filter((comment) => comment.status === "published" && !comment.isAnonymous)
    .sort((left, right) => parseCommunityTime(right.createdAt) - parseCommunityTime(left.createdAt))
    .map((comment) => {
      const post = postsById.get(comment.postId);
      const href = post ? `${getCommunityPostHref(post, "all")}#comment-${comment.id}` : undefined;
      return {
        content: comment.content,
        href,
        id: comment.id,
        likes: comment.likeCount ?? 0,
        postTitle: post?.title || text.commentedNote,
        time: comment.createdAt || text.justNow,
      } satisfies ProfileCommentRow;
    });
}

function getCategory(type: CommunityPostType, text: MeText) {
  if (type === "secondhand") return text.categories.secondhand;
  if (type === "buddy") return text.categories.buddy;
  if (type === "friend") return text.categories.friend;
  if (type === "discount") return text.categories.discount;
  return text.categories.default;
}

function ProfileHero({ area, avatar, bio, editable, id, name, onAvatarChange, onEdit, stats, text }: { area: string; avatar: string; bio: string; editable?: boolean; id: string; name: string; onAvatarChange?: (file: File | null) => void; onEdit?: () => void; stats: { followers: number; following: number }; text: MeText }) {
  return (
    <>
      <div className="mx-4 mt-4 flex items-center justify-between">
        <BackButton fallbackHref="/" />
        <div className="flex items-center gap-2">
          {editable ? (
            <button className="inline-flex h-10 items-center gap-1.5 rounded-full bg-white/86 px-4 text-xs font-black text-[#0f4fd8] shadow-[0_10px_24px_rgba(37,99,235,0.12)] ring-1 ring-white/90 backdrop-blur-xl" onClick={onEdit} type="button">
              <Pencil className="h-3.5 w-3.5" />
              {text.editProfile}
            </button>
          ) : null}
          <Link className="flex h-10 w-10 items-center justify-center rounded-full bg-white/86 text-[#2563eb] shadow-[0_10px_24px_rgba(37,99,235,0.12)] ring-1 ring-white/90 backdrop-blur-xl" href="/me/settings" aria-label={text.settings}>
            <Settings className="h-4.5 w-4.5" />
          </Link>
        </div>
      </div>

      <section className="relative mx-4 mt-3 overflow-hidden rounded-[26px] border border-white/80 bg-white/80 px-4 pb-[18px] pt-5 shadow-[0_14px_32px_rgba(15,76,129,0.09)] backdrop-blur-2xl">
        <div className="absolute inset-0 bg-[url('/images/sakura-tokyo-bg.png')] bg-[length:100%_100%] bg-center bg-no-repeat" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.28)_0%,rgba(239,248,255,0.18)_58%,rgba(255,255,255,0.38)_100%)]" />

      <div className="relative z-10 flex items-center gap-4">
        <label className="group relative flex h-[104px] w-[104px] shrink-0 cursor-pointer items-center justify-center rounded-full bg-white/92 p-2 shadow-[0_18px_38px_rgba(37,99,235,0.16)] ring-1 ring-white">
          <span className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-[linear-gradient(135deg,#dbeafe,#ffffff,#eff6ff)] text-[#2563eb] ring-1 ring-blue-100">
            {avatar ? <Image alt={name} className="object-cover" fill sizes="96px" src={avatar} unoptimized /> : <UserRound className="h-12 w-12 stroke-[1.8]" />}
            <span className="absolute inset-x-0 bottom-0 flex h-8 items-center justify-center bg-slate-950/35 text-white opacity-0 transition group-active:opacity-100 group-hover:opacity-100">
              <Camera className="h-4 w-4" />
            </span>
          </span>
          <input accept="image/*" className="hidden" onChange={(event) => onAvatarChange?.(event.target.files?.[0] ?? null)} type="file" />
        </label>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-[25px] font-[850] leading-8 tracking-normal text-[#061a3a] drop-shadow-[0_1px_0_rgba(255,255,255,0.78)]">{name}</h1>
          <p className="mt-1 flex min-w-0 items-center gap-1 text-[13px] font-extrabold text-[#263b59]">Japan Life ID：{id}</p>
          <p className="mt-1 flex items-center gap-1 text-[13px] font-extrabold text-[#263b59]">
            <MapPin className="h-3.5 w-3.5 text-[#2563eb]" />
            {area}
          </p>
        </div>
      </div>

      <p className="relative z-10 mt-5 text-[15px] font-extrabold leading-6 text-[#263b59] drop-shadow-[0_1px_0_rgba(255,255,255,0.65)]">{bio}</p>

      <div className="relative z-10 mt-4 grid h-[68px] w-[156px] grid-cols-2 items-center rounded-[20px] bg-white/86 px-4 shadow-[0_12px_26px_rgba(15,76,129,0.10)] ring-1 ring-white/90 backdrop-blur-2xl">
        <ProfileStat href={`/community/user/${id}/follows?tab=following`} label={text.following} value={stats.following} />
        <ProfileStat href={`/community/user/${id}/follows?tab=followers`} label={text.followers} value={stats.followers} />
      </div>

      </section>
    </>
  );
}

function ProfileStat({ href, label, value }: { href?: string; label: string; value: number }) {
  if (href) {
    return (
      <Link className="min-w-0 rounded-2xl text-center transition active:scale-[0.96]" href={href}>
        <p className="truncate text-[17px] font-[850] leading-5 text-[#061a3a]">{value}</p>
        <p className="mt-1 truncate text-[11px] font-extrabold text-[#263b59]">{label}</p>
      </Link>
    );
  }

  return (
    <div className="min-w-0 text-center">
      <p className="truncate text-[17px] font-[850] leading-5 text-[#061a3a]">{value}</p>
      <p className="mt-1 truncate text-[11px] font-extrabold text-[#263b59]">{label}</p>
    </div>
  );
}

function ProfileContent({ activeTab, avatar, commentRows, displayName, loading, notes, onTabChange, showComments, showFavorites, showLiked, text }: { activeTab: ProfileTab; avatar: string; commentRows: ProfileCommentRow[]; displayName: string; loading: boolean; notes: ProfileNote[]; onTabChange: (value: ProfileTab) => void; showComments: boolean; showFavorites: boolean; showLiked: boolean; text: MeText }) {
  const empty = text.empty[activeTab];
  return (
    <section className="-mt-1 rounded-t-[30px] bg-white px-4 pb-8 pt-2 shadow-[0_-10px_28px_rgba(37,99,235,0.06)]">
      <div className="flex items-center gap-2 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <TabButton active={activeTab === "notes"} href="/me" label={text.tabs.notes} onClick={() => onTabChange("notes")} />
        <TabButton active={activeTab === "favorites"} href="/me?tab=favorites" label={text.tabs.favorites} locked={!showFavorites} onClick={() => onTabChange("favorites")} />
        <TabButton active={activeTab === "liked"} href="/me?tab=liked" label={text.tabs.liked} locked={!showLiked} onClick={() => onTabChange("liked")} />
        <TabButton active={activeTab === "comments"} href="/me?tab=comments" label={text.tabs.comments} locked={!showComments} onClick={() => onTabChange("comments")} />
      </div>

      {loading ? (
        <ProfileContentSkeleton />
      ) : activeTab === "comments" ? (
        commentRows.length === 0 ? (
          <EmptyState {...empty} />
        ) : (
          <div className="mt-2">
            {commentRows.map((comment) => (
              <ProfileCommentItem
                avatar={avatar}
                comment={comment}
                displayName={displayName}
                key={comment.id}
                text={text}
              />
            ))}
          </div>
        )
      ) : notes.length === 0 ? (
        <EmptyState {...empty} />
      ) : (
        <div className="mt-3 grid grid-cols-2 gap-2.5">
          {notes.map((note) => (
            <NoteCard key={note.id} note={note} />
          ))}
        </div>
      )}
    </section>
  );
}

function ProfileContentSkeleton() {
  return (
    <div className="mt-3 grid grid-cols-2 gap-2.5">
      {Array.from({ length: 4 }).map((_, index) => (
        <article className="overflow-hidden rounded-[18px] bg-white shadow-[0_10px_26px_rgba(15,76,129,0.08)] ring-1 ring-blue-100/70" key={index}>
          <div className="h-[122px] animate-pulse bg-blue-50" />
          <div className="p-2.5">
            <div className="h-4 w-3/4 animate-pulse rounded-full bg-slate-100" />
            <div className="mt-2 h-3 w-full animate-pulse rounded-full bg-slate-100" />
            <div className="mt-2 h-3 w-1/2 animate-pulse rounded-full bg-slate-100" />
          </div>
        </article>
      ))}
    </div>
  );
}

function ProfileInput({ disabled = false, hint, label, onChange, placeholder, value }: { disabled?: boolean; hint?: string; label: string; onChange: (value: string) => void; placeholder: string; value: string }) {
  return (
    <label className="grid gap-1.5">
      <span className="text-xs font-black text-[#64748b]">{label}</span>
      <input className="h-12 rounded-2xl border border-blue-100 bg-blue-50/70 px-4 text-sm font-black outline-none focus:border-[#2563eb] disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400" disabled={disabled} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} value={value} />
      {hint ? <span className="text-[11px] font-bold leading-4 text-slate-400">{hint}</span> : null}
    </label>
  );
}

function ProfileTextarea({ hint, label, onChange, placeholder, value }: { hint?: string; label: string; onChange: (value: string) => void; placeholder: string; value: string }) {
  return (
    <label className="grid gap-1.5">
      <span className="text-xs font-black text-[#64748b]">{label}</span>
      <textarea className="min-h-24 resize-none rounded-2xl border border-blue-100 bg-blue-50/70 px-4 py-3 text-sm font-black leading-5 outline-none focus:border-[#2563eb]" maxLength={80} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} value={value} />
      <span className="flex items-center justify-between gap-2 text-[11px] font-bold leading-4 text-slate-400">
        <span>{hint}</span>
        <span>{value.length}/80</span>
      </span>
    </label>
  );
}

function PrivacyToggle({ checked, label, onChange }: { checked: boolean; label: string; onChange: (value: boolean) => void }) {
  return (
    <button className="flex items-center justify-between rounded-2xl border border-blue-100 bg-blue-50/60 px-4 py-3 text-left" onClick={() => onChange(!checked)} type="button">
      <span className="text-sm font-black text-[#263b59]">{label}</span>
      <span className={`relative h-7 w-12 rounded-full transition ${checked ? "bg-[#2563eb]" : "bg-slate-300"}`}>
        <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition ${checked ? "left-6" : "left-1"}`} />
      </span>
    </button>
  );
}

function TabButton({ active, href, label, locked = false, onClick }: { active: boolean; href: string; label: string; locked?: boolean; onClick: () => void }) {
  return (
    <Link className={`inline-flex h-8 shrink-0 items-center gap-1 rounded-full px-4 text-[12px] font-black transition active:scale-[0.97] ${active ? "bg-[#2563eb] text-white shadow-[0_10px_20px_rgba(37,99,235,0.20)]" : "bg-[#eff6ff] text-[#263b59]"}`} href={href} onClick={(event) => { event.preventDefault(); onClick(); }}>
      <span>{label}</span>
      {locked ? <Lock className="h-3 w-3 stroke-[2.4]" /> : null}
    </Link>
  );
}

function NoteCard({ note }: { note: ProfileNote }) {
  const card = (
    <article className="min-w-0 overflow-hidden rounded-[18px] bg-white shadow-[0_10px_26px_rgba(15,76,129,0.08)] ring-1 ring-blue-100/70">
      <div className="relative h-[122px] overflow-hidden rounded-t-[18px]">
        <NoteCover note={note} />
        <span className="absolute left-2 top-2 rounded-full bg-white/88 px-2.5 py-1 text-[10px] font-black text-[#2563eb] shadow-sm backdrop-blur">{note.category}</span>
      </div>
      <div className="p-2.5">
        <h2 className="line-clamp-2 text-[13px] font-black leading-[18px] text-[#061a3a]">{note.title}</h2>
        <p className="mt-1 line-clamp-2 text-[11px] font-bold leading-4 text-[#64748b]">{note.description}</p>
        <div className="mt-2 flex items-center justify-between gap-2 text-[11px] font-black text-[#64748b]">
          <span>{note.time}</span>
          <span className={`inline-flex items-center gap-1 ${note.likedByMe ? "text-pink-600" : ""}`}><Heart className={`h-3.5 w-3.5 ${note.likedByMe ? "fill-current" : ""}`} />{note.likes}</span>
        </div>
      </div>
    </article>
  );
  if (!note.href) return card;
  return (
    <Link className="block transition active:scale-[0.98]" href={note.href}>
      {card}
    </Link>
  );
}

function ProfileCommentItem({ avatar, comment, displayName, text }: { avatar: string; comment: ProfileCommentRow; displayName: string; text: MeText }) {
  return (
    <article className="grid grid-cols-[44px_minmax(0,1fr)_auto] gap-3 border-b border-slate-100 py-4 last:border-b-0">
      <div className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-[linear-gradient(135deg,#dbeafe,#ffffff,#eff6ff)] text-[#2563eb] ring-1 ring-blue-100">
        {avatar ? (
          <Image alt={displayName} className="object-cover" fill sizes="40px" src={avatar} unoptimized />
        ) : (
          <UserRound className="h-5 w-5 stroke-[1.8]" />
        )}
      </div>
      <div className="min-w-0">
        <p className="truncate text-[13px] font-bold text-slate-400">{displayName}</p>
        <p className="mt-1 whitespace-pre-wrap break-words text-[15px] font-black leading-6 text-[#061a3a]">{comment.content}</p>
        {comment.href ? (
          <Link className="mt-2 block truncate text-[13px] font-bold text-slate-400 active:text-[#2563eb]" href={comment.href}>
            {text.fromNote(comment.postTitle)}
          </Link>
        ) : (
          <p className="mt-2 truncate text-[13px] font-bold text-slate-400">{text.fromNote(comment.postTitle)}</p>
        )}
        <p className="mt-1 text-[12px] font-bold text-slate-400">{formatProfileCommentTime(comment.time, text)}</p>
      </div>
      <div className="flex min-w-[34px] items-start justify-end gap-1 pt-6 text-[12px] font-black text-slate-400">
        <Heart className="h-4 w-4" />
        <span>{comment.likes}</span>
      </div>
    </article>
  );
}

function NoteCover({ note }: { note: ProfileNote }) {
  const imageUrl = getProfileNoteImageUrl(note.image);
  if (imageUrl) return <div className="h-full w-full bg-cover bg-center" style={{ backgroundImage: `url(${imageUrl})` }} />;
  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden bg-[linear-gradient(135deg,#eff6ff,#ffffff_48%,#dbeafe)] px-4 text-center">
      <div className="absolute -right-8 -top-8 h-20 w-20 rounded-full bg-blue-200/45 blur-2xl" />
      <div className="absolute -bottom-10 left-2 h-20 w-20 rounded-full bg-sky-200/40 blur-2xl" />
      <p className="relative z-10 line-clamp-3 text-[18px] font-black leading-6 text-[#061a3a] [overflow-wrap:anywhere]">{note.coverText}</p>
    </div>
  );
}

function getProfileNoteImageUrl(image: CommunityPostImage | undefined) {
  if (!image) return "";
  if (typeof image === "string") return image;
  return image.url || image.path || "";
}

function getCoverText(title: string, content: string) {
  return (title || content || "Japan Life").trim().slice(0, 32);
}

function formatProfileCommentTime(value: string, text: MeText) {
  const match = value.match(/^(\d{2})\/(\d{2})/);
  if (match) return text.publicTime(`${match[1]}-${match[2]}`);
  return text.publicTime(value || text.justNow);
}

function isProfileTab(value: string | null): value is ProfileTab {
  return value === "notes" || value === "favorites" || value === "liked" || value === "comments";
}

function EmptyState({ actionHref, actionLabel, text }: { actionHref?: string; actionLabel?: string; text: string }) {
  return (
    <section className="mt-5 rounded-[24px] border border-blue-100 bg-[linear-gradient(135deg,#eff6ff,#ffffff)] p-6 text-center shadow-[0_12px_28px_rgba(37,99,235,0.08)]">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-[#2563eb] ring-1 ring-blue-100"><Sparkles className="h-6 w-6" /></div>
      <p className="mt-3 text-sm font-black text-[#263b59]">{text}</p>
      {actionHref && actionLabel ? <Link className="mt-4 inline-flex h-10 items-center justify-center rounded-full bg-[#2563eb] px-5 text-sm font-black text-white shadow-[0_12px_24px_rgba(37,99,235,0.22)]" href={actionHref}>{actionLabel}</Link> : null}
    </section>
  );
}
