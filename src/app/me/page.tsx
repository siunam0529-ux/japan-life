"use client";

import type { User } from "@supabase/supabase-js";
import { Camera, Heart, MapPin, Pencil, Settings, Sparkles, UserRound, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { BackButton } from "@/components/BackButton";
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
const profileNameUpdatedAtKey = "japan-life:me-profile-name-updated-at";
const profileBioUpdatedAtKey = "japan-life:me-profile-bio-updated-at";
const publishHref = "/community/all/new";
const loginHref = "/login?redirect=/me";
const defaultProfileBio = "分享在日生活，记录每个美好瞬间";
const oneDayMs = 24 * 60 * 60 * 1000;
const nameCooldownMs = 7 * oneDayMs;
const bioCooldownMs = oneDayMs;
const idCooldownMs = 365 * oneDayMs;

function readProfileSnapshot(user: User | null): MeProfileSnapshot {
  const defaultName = getDefaultProfileName(user);
  const defaultId = getDefaultProfileId(user);
  const rawSavedProfileId = window.localStorage.getItem(profileIdKey);
  const savedProfileId = rawSavedProfileId || defaultId;
  const savedId = savedProfileId === "local-user" ? defaultId : savedProfileId;
  const savedIdChanged = window.localStorage.getItem(profileIdChangedKey) === "true" || Boolean(rawSavedProfileId && savedId !== defaultId && savedId !== "local-user");
  const savedIdUpdatedAt = Number(window.localStorage.getItem(profileIdUpdatedAtKey) || 0);
  const savedNameUpdatedAt = Number(window.localStorage.getItem(profileNameUpdatedAtKey) || 0);
  const savedBioUpdatedAt = Number(window.localStorage.getItem(profileBioUpdatedAtKey) || 0);
  return {
    avatar: window.localStorage.getItem(profileAvatarKey) || "",
    bio: window.localStorage.getItem(profileBioKey) || defaultProfileBio,
    bioUpdatedAt: Number.isFinite(savedBioUpdatedAt) ? savedBioUpdatedAt : 0,
    id: savedId,
    idChanged: savedIdChanged,
    idUpdatedAt: Number.isFinite(savedIdUpdatedAt) && savedIdUpdatedAt ? savedIdUpdatedAt : (savedIdChanged ? Date.now() : 0),
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
  window.localStorage.setItem(profileNameUpdatedAtKey, String(snapshot.nameUpdatedAt));
  window.localStorage.setItem(profileBioUpdatedAtKey, String(snapshot.bioUpdatedAt));
  window.localStorage.setItem(showFavoritesKey, String(snapshot.showFavorites));
  window.localStorage.setItem(showLikedKey, String(snapshot.showLiked));
  window.localStorage.setItem(showCommentsKey, String(snapshot.showComments));
}

function createSnapshotFromCommunityProfile(profile: { avatar: string; bio: string; id: string; displayName: string }, user: User | null, fallback: MeProfileSnapshot): MeProfileSnapshot {
  const defaultId = getDefaultProfileId(user);
  const publicId = normalizeProfileId(profile.id) || fallback.id || defaultId;
  return {
    ...fallback,
    avatar: profile.avatar && !profile.avatar.startsWith("linear-gradient") ? profile.avatar : fallback.avatar,
    bio: profile.bio || fallback.bio,
    id: publicId,
    idChanged: fallback.idChanged || publicId !== defaultId,
    idUpdatedAt: fallback.idUpdatedAt || (publicId !== defaultId ? Date.now() : 0),
    name: profile.displayName || fallback.name,
  };
}

export default function MePage() {
  const router = useRouter();
  const [authState, setAuthState] = useState<"checking" | "signed-in" | "signed-out">("checking");
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<ProfileTab>("notes");
  const [profileName, setProfileName] = useState("Japan Life 用户");
  const [profileId, setProfileId] = useState("local-user");
  const [profileBio, setProfileBio] = useState(defaultProfileBio);
  const [profileAvatar, setProfileAvatar] = useState("");
  const [draftName, setDraftName] = useState("Japan Life 用户");
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
    if (localSnapshot.idChanged) writeProfileSnapshot(localSnapshot);

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
    if (authState === "signed-out") router.replace(withBackFrom(loginHref, { preferPrevious: true }));
  }, [authState, router]);

  useEffect(() => {
    if (authState !== "signed-in" || !authUser?.id) return;
    let mounted = true;
    void loadMeCommunityActivity(authUser.id).then(({ allPostResult, commentResult, favoriteResult, likeResult, ownPostResult }) => {
      if (!mounted) return;
      setOwnPosts(ownPostResult.data);
      setAllPosts(allPostResult.data);
      setOwnComments(commentResult.data);
      setFavoriteIds(favoriteResult.data);
      setLikeIds(likeResult.data);
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
    const ownNotes = ownPosts.map((post) => postToProfileNote(post, likeIds.has(post.id)));
    const favoriteNotes = allPosts.filter((post) => favoriteIds.has(post.id)).map((post) => postToProfileNote(post, likeIds.has(post.id)));
    const likedNotes = allPosts.filter((post) => likeIds.has(post.id)).map((post) => postToProfileNote(post, true));
    return {
      comments: [],
      favorites: favoriteNotes,
      liked: likedNotes,
      notes: ownNotes,
    } satisfies Record<ProfileTab, ProfileNote[]>;
  }, [allPosts, favoriteIds, likeIds, ownPosts]);

  const commentRows = useMemo(() => commentsToProfileRows(ownComments, allPosts), [allPosts, ownComments]);

  const notes = useMemo(() => noteData[activeTab], [activeTab, noteData]);

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
      saveProfileAvatar(uploadedAvatar, authUser, () => setEditMessage("头像已更新。"));
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const value = typeof reader.result === "string" ? reader.result : "";
      if (!value) return;
      setProfileAvatar(value);
      saveProfileAvatar(value, authUser, () => setEditMessage("头像图片太大，无法保存在本机。请换一张更小的图片。"));
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

    if (idChanged && !canEditAfter(idUpdatedAt, idCooldownMs, now)) {
      setEditMessage(`Japan Life ID 1 年只能改一次，还要等 ${formatRemainingTime(idUpdatedAt, idCooldownMs, now)}。`);
      return;
    }
    if (nameChanged && !canEditAfter(nameUpdatedAt, nameCooldownMs, now)) {
      setEditMessage(`名字 7 天只能改一次，还要等 ${formatRemainingTime(nameUpdatedAt, nameCooldownMs, now)}。`);
      return;
    }
    if (bioChanged && !canEditAfter(bioUpdatedAt, bioCooldownMs, now)) {
      setEditMessage(`简介 1 天只能改一次，还要等 ${formatRemainingTime(bioUpdatedAt, bioCooldownMs, now)}。`);
      return;
    }

    const nextSnapshot: MeProfileSnapshot = {
      avatar: profileAvatar,
      bio: nextBio,
      bioUpdatedAt: bioChanged ? now : bioUpdatedAt,
      id: nextId,
      idChanged: idChanged || Boolean(idUpdatedAt),
      idUpdatedAt: idChanged ? now : idUpdatedAt,
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
          name={profileName}
          onEdit={openEditor}
          onAvatarChange={updateAvatar}
          stats={{
            followers: followStats.followerCount,
            following: followStats.followingCount,
          }}
        />

        <ProfileContent
          activeTab={activeTab}
          avatar={profileAvatar}
          commentRows={commentRows}
          displayName={profileName}
          notes={notes}
          onTabChange={setActiveTab}
        />
      </div>

      {editing ? (
        <div className="fixed inset-0 z-[80] flex items-end justify-center bg-slate-950/35 px-4 pb-5 pt-16 backdrop-blur-sm">
          <section className="w-full max-w-[430px] rounded-[28px] bg-white p-5 shadow-[0_24px_60px_rgba(15,76,129,0.20)]">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black text-[#061a3a]">编辑资料</h2>
              <button className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 text-[#2563eb]" onClick={() => setEditing(false)} type="button" aria-label="关闭">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-4 grid gap-3">
              <ProfileInput hint={getCooldownHint(nameUpdatedAt, nameCooldownMs, "名字 7 天只能改一次")} label="名字" onChange={setDraftName} placeholder="Japan Life 用户" value={draftName} />
              <ProfileInput disabled={!canEditAfter(idUpdatedAt, idCooldownMs)} hint={getCooldownHint(idUpdatedAt, idCooldownMs, "Japan Life ID 1 年只能改一次，别人可以用这个 ID 搜到你。")} label="Japan Life ID" onChange={(value) => setDraftId(normalizeProfileId(value))} placeholder="local-user" value={draftId} />
              <ProfileTextarea hint={getCooldownHint(bioUpdatedAt, bioCooldownMs, "简介 1 天只能改一次")} label="简介" onChange={setDraftBio} placeholder={defaultProfileBio} value={draftBio} />
              <PrivacyToggle checked={draftShowFavorites} label="公开我的收藏" onChange={setDraftShowFavorites} />
              <PrivacyToggle checked={draftShowLiked} label="公开我的赞过" onChange={setDraftShowLiked} />
              <PrivacyToggle checked={draftShowComments} label="公开我的评论" onChange={setDraftShowComments} />
            </div>
            {editMessage ? <p className="mt-4 rounded-2xl bg-amber-50 px-4 py-3 text-xs font-black leading-5 text-amber-700 ring-1 ring-amber-100">{editMessage}</p> : null}
            <button className="mt-5 flex h-12 w-full items-center justify-center rounded-2xl bg-[#2563eb] text-sm font-black text-white shadow-[0_12px_24px_rgba(37,99,235,0.22)] disabled:bg-slate-300" disabled={savingProfile} onClick={saveProfile} type="button">
              {savingProfile ? "保存中..." : "保存"}
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
  return metadataName?.trim() || user?.email?.split("@")[0] || "Japan Life 用户";
}

function getDefaultProfileId(user: User | null) {
  return user?.id ? `jl-${user.id.slice(0, 8)}` : "local-user";
}

async function loadMeCommunityActivity(userId: string) {
  const [ownPostResult, allPostResult, commentResult, favoriteResult, likeResult] = await Promise.all([
    getCommunityPosts({ authorId: userId, status: "published" }),
    getCommunityPosts({ status: "published" }),
    getCommunityCommentsByAuthor(userId),
    getCommunityFavoriteIds(userId),
    getCommunityLikeIds(userId),
  ]);
  return { allPostResult, commentResult, favoriteResult, likeResult, ownPostResult };
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

function formatRemainingTime(lastUpdatedAt: number, cooldownMs: number, now = Date.now()) {
  const remainingMs = Math.max(0, lastUpdatedAt + cooldownMs - now);
  const days = Math.ceil(remainingMs / oneDayMs);
  return `${days} 天`;
}

function getCooldownHint(lastUpdatedAt: number, cooldownMs: number, fallback: string) {
  if (!lastUpdatedAt) return fallback;
  if (canEditAfter(lastUpdatedAt, cooldownMs)) return fallback;
  return `${fallback}，还要等 ${formatRemainingTime(lastUpdatedAt, cooldownMs)}。`;
}

function parseCommunityTime(value: string) {
  const parsed = Date.parse(value);
  if (Number.isFinite(parsed)) return parsed;
  const match = value.match(/^(\d{2})\/(\d{2})\s+(\d{2}):(\d{2})$/);
  if (!match) return 0;
  const [, month, day, hour, minute] = match;
  return new Date(new Date().getFullYear(), Number(month) - 1, Number(day), Number(hour), Number(minute)).getTime();
}

function postToProfileNote(post: CommunityPost, likedByMe = false): ProfileNote {
  return {
    category: getCategory(post.type),
    coverText: getCoverText(post.title, post.content),
    description: post.content || "分享在日生活",
    href: getCommunityPostHref(post, "all"),
    id: post.id,
    image: post.images?.[0],
    likedByMe,
    likes: post.likeCount || post.likes || 0,
    time: post.createdAt || "刚刚",
    title: post.title,
  };
}

function commentsToProfileRows(comments: CommunityComment[], posts: CommunityPost[]): ProfileCommentRow[] {
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
        postTitle: post?.title || "评论过的笔记",
        time: comment.createdAt || "刚刚",
      } satisfies ProfileCommentRow;
    });
}

function getCategory(type: CommunityPostType) {
  if (type === "secondhand") return "省钱情报";
  if (type === "buddy") return "旅行记录";
  if (type === "help" || type === "helper") return "手帐攻略";
  return "在日生活";
}

function ProfileHero({ avatar, bio, editable, id, name, onAvatarChange, onEdit, stats }: { avatar: string; bio: string; editable?: boolean; id: string; name: string; onAvatarChange?: (file: File | null) => void; onEdit?: () => void; stats: { followers: number; following: number } }) {
  return (
    <section className="relative overflow-hidden px-4 pb-6 pt-5">
      <div className="absolute inset-0 bg-[#eaf6ff] bg-[url('/images/weather-hero-bg.png')] bg-cover bg-center" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.52)_0%,rgba(239,248,255,0.38)_58%,rgba(255,255,255,0.86)_100%)]" />

      <div className="relative z-10 flex items-center justify-between">
        <BackButton fallbackHref="/" />
        <div className="flex items-center gap-2">
          {editable ? (
            <button className="inline-flex h-10 items-center gap-1.5 rounded-full bg-white/86 px-4 text-xs font-black text-[#0f4fd8] shadow-[0_10px_24px_rgba(37,99,235,0.12)] ring-1 ring-white/90 backdrop-blur-xl" onClick={onEdit} type="button">
              <Pencil className="h-3.5 w-3.5" />
              编辑资料
            </button>
          ) : null}
          <Link className="flex h-10 w-10 items-center justify-center rounded-full bg-white/86 text-[#2563eb] shadow-[0_10px_24px_rgba(37,99,235,0.12)] ring-1 ring-white/90 backdrop-blur-xl" href="/me/settings" aria-label="设置">
            <Settings className="h-4.5 w-4.5" />
          </Link>
        </div>
      </div>

      <div className="relative z-10 mt-7 flex items-center gap-4">
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
          <h1 className="truncate text-[26px] font-black leading-8 tracking-normal text-[#061a3a]">{name}</h1>
          <p className="mt-1 flex min-w-0 items-center gap-1 text-[13px] font-bold text-[#40546f]">Japan Life ID：{id}</p>
          <p className="mt-1 flex items-center gap-1 text-[13px] font-bold text-[#40546f]">
            <MapPin className="h-3.5 w-3.5 text-[#2563eb]" />
            日本
          </p>
        </div>
      </div>

      <p className="relative z-10 mt-5 text-[15px] font-bold leading-6 text-[#263b59]">{bio}</p>

      <div className="relative z-10 mt-4 grid w-[156px] grid-cols-2 rounded-[18px] bg-white/88 px-4 py-3 shadow-[0_12px_24px_rgba(37,99,235,0.10)] ring-1 ring-white/90 backdrop-blur-xl">
        <ProfileStat href={`/community/user/${id}/follows?tab=following`} label="关注" value={stats.following} />
        <ProfileStat href={`/community/user/${id}/follows?tab=followers`} label="粉丝" value={stats.followers} />
      </div>

    </section>
  );
}

function ProfileStat({ href, label, value }: { href?: string; label: string; value: number }) {
  if (href) {
    return (
      <Link className="min-w-0 rounded-2xl text-center transition active:scale-[0.96]" href={href}>
        <p className="truncate text-[17px] font-black leading-5 text-[#061a3a]">{value}</p>
        <p className="mt-1 truncate text-[11px] font-black text-[#40546f]">{label}</p>
      </Link>
    );
  }

  return (
    <div className="min-w-0 text-center">
      <p className="truncate text-[17px] font-black leading-5 text-[#061a3a]">{value}</p>
      <p className="mt-1 truncate text-[11px] font-black text-[#40546f]">{label}</p>
    </div>
  );
}

function ProfileContent({ activeTab, avatar, commentRows, displayName, notes, onTabChange }: { activeTab: ProfileTab; avatar: string; commentRows: ProfileCommentRow[]; displayName: string; notes: ProfileNote[]; onTabChange: (value: ProfileTab) => void }) {
  return (
    <section className="-mt-1 rounded-t-[30px] bg-white px-4 pb-8 pt-2 shadow-[0_-10px_28px_rgba(37,99,235,0.06)]">
      <div className="flex items-center gap-2 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <TabButton active={activeTab === "notes"} label="笔记" onClick={() => onTabChange("notes")} />
        <TabButton active={activeTab === "favorites"} label="收藏" onClick={() => onTabChange("favorites")} />
        <TabButton active={activeTab === "liked"} label="赞过" onClick={() => onTabChange("liked")} />
        <TabButton active={activeTab === "comments"} label="评论" onClick={() => onTabChange("comments")} />
      </div>

      {activeTab === "comments" ? (
        commentRows.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="mt-2">
            {commentRows.map((comment) => (
              <ProfileCommentItem
                avatar={avatar}
                comment={comment}
                displayName={displayName}
                key={comment.id}
              />
            ))}
          </div>
        )
      ) : notes.length === 0 ? (
        <EmptyState />
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

function TabButton({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button className={`h-8 shrink-0 rounded-full px-4 text-[12px] font-black transition active:scale-[0.97] ${active ? "bg-[#2563eb] text-white shadow-[0_10px_20px_rgba(37,99,235,0.20)]" : "bg-[#eff6ff] text-[#263b59]"}`} onClick={onClick} type="button">
      {label}
    </button>
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

function ProfileCommentItem({ avatar, comment, displayName }: { avatar: string; comment: ProfileCommentRow; displayName: string }) {
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
            来自笔记 · {comment.postTitle}
          </Link>
        ) : (
          <p className="mt-2 truncate text-[13px] font-bold text-slate-400">来自笔记 · {comment.postTitle}</p>
        )}
        <p className="mt-1 text-[12px] font-bold text-slate-400">{formatProfileCommentTime(comment.time)}</p>
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

function formatProfileCommentTime(value: string) {
  const match = value.match(/^(\d{2})\/(\d{2})/);
  if (match) return `${match[1]}-${match[2]} 日本　设为公开`;
  return value ? `${value} 日本　设为公开` : "刚刚 日本　设为公开";
}

function EmptyState() {
  return (
    <section className="mt-5 rounded-[24px] border border-blue-100 bg-[linear-gradient(135deg,#eff6ff,#ffffff)] p-6 text-center shadow-[0_12px_28px_rgba(37,99,235,0.08)]">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-[#2563eb] ring-1 ring-blue-100"><Sparkles className="h-6 w-6" /></div>
      <p className="mt-3 text-sm font-black text-[#263b59]">还没有发布内容，去记录你的在日生活吧</p>
      <Link className="mt-4 inline-flex h-10 items-center justify-center rounded-full bg-[#2563eb] px-5 text-sm font-black text-white shadow-[0_12px_24px_rgba(37,99,235,0.22)]" href={publishHref}>去发布</Link>
    </section>
  );
}
