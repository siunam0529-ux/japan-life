"use client";

import { ChevronDown, Heart, Lock, MapPin, MessageCircle, Sparkles, UserRound, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { BackButton } from "@/components/BackButton";
import { useLanguage } from "@/hooks/useLanguage";
import { formatJapanAccountArea, getAccountAreaDisplay } from "@/lib/account/area";
import { readMeProfile } from "@/lib/account/profile";
import { addCommunityFollowNotification } from "@/lib/community/followNotifications";
import { followCommunityUser, getCommunityFollowRemark, getCommunityFollowStats, readCommunityFollowingUsers, setCommunityFollowRemark, unfollowCommunityUser } from "@/lib/community/follow";
import { communityShowCommentsKey as showCommentsKey, communityShowFavoritesKey as showFavoritesKey, communityShowLikedKey as showLikedKey, isCommunityUserBlocked } from "@/lib/community/privacy";
import { communityCurrentUserId, communityFavoritesStorageKey, communityLikesStorageKey, getCommunityCommentsByAuthor, getCommunityFavoriteIds, getCommunityLikeIds, getCommunityPosts, getCommunityProfile, readCommunityIdSet, readCommunityPosts, readCommunityUserProfile, readCommunityUsers } from "@/lib/community/repository";
import { communityReactionChangeEvent } from "@/lib/community/reactionEvents";
import { getCommunityPostHref } from "@/lib/community/routes";
import type { CommunityComment, CommunityPost, CommunityPostImage, CommunityPostType, CommunityUserProfile } from "@/lib/community/types";
import { getOrCreateConversation } from "@/lib/messages/api";
import { readMessageUserRemark } from "@/lib/messages/listActions";
import type { Language } from "@/lib/i18n/translations";
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
  time: string;
  likes: number;
};

const profileCopy = {
  "zh-CN": {
    defaultBio: "分享在日生活，记录每个美好瞬间",
    defaultUser: "Japan Life 用户",
    defaultArea: "日本",
    followStats: { followers: "粉丝", following: "关注" },
    follow: "关注",
    following: "已关注",
    mutualFollow: "互相关注",
    blocked: "已拉黑",
    message: "发私信",
    blockedMessage: "已拉黑用户不能私信。",
    messageUnavailable: "私信暂时不可用。",
    remark: (value: string) => `备注：${value}`,
    tabs: { comments: "评论", favorites: "收藏", liked: "赞过", notes: "笔记" },
    privateLabels: { comments: "评论", favorites: "收藏", liked: "赞过", profile: "主页内容" },
    followSheetDesc: "可以给 TA 设置备注，或者取消关注。",
    close: "关闭",
    remarkName: "设置备注名",
    saveRemark: "保存备注",
    cancelFollow: "取消关注",
    confirmUnfollow: "不再关注该作者？",
    cancel: "取消",
    unfollow: "不再关注",
    shareLife: "分享在日生活",
    comment: "评论",
    justNow: "刚刚",
    commentedPost: "评论过的帖子",
    categories: { buddy: "旅行记录", default: "在日生活", help: "手帐攻略", secondhand: "省钱情报" },
    empty: "这里还没有公开内容",
    privateState: (label: string) => `TA 暂时没有公开${label}`,
    blockedState: "已拉黑该用户，主页内容不可见",
  },
  "zh-TW": {
    defaultBio: "分享在日生活，記錄每個美好瞬間",
    defaultUser: "Japan Life 使用者",
    defaultArea: "日本",
    followStats: { followers: "粉絲", following: "關注" },
    follow: "關注",
    following: "已關注",
    mutualFollow: "互相關注",
    blocked: "已拉黑",
    message: "發私訊",
    blockedMessage: "已拉黑使用者不能私訊。",
    messageUnavailable: "私訊暫時不可用。",
    remark: (value: string) => `備註：${value}`,
    tabs: { comments: "評論", favorites: "收藏", liked: "讚過", notes: "筆記" },
    privateLabels: { comments: "評論", favorites: "收藏", liked: "讚過", profile: "主頁內容" },
    followSheetDesc: "可以給 TA 設定備註，或者取消關注。",
    close: "關閉",
    remarkName: "設定備註名",
    saveRemark: "保存備註",
    cancelFollow: "取消關注",
    confirmUnfollow: "不再關注該作者？",
    cancel: "取消",
    unfollow: "不再關注",
    shareLife: "分享在日生活",
    comment: "評論",
    justNow: "剛剛",
    commentedPost: "評論過的貼文",
    categories: { buddy: "旅行記錄", default: "在日生活", help: "手帳攻略", secondhand: "省錢情報" },
    empty: "這裡還沒有公開內容",
    privateState: (label: string) => `TA 暫時沒有公開${label}`,
    blockedState: "已拉黑該使用者，主頁內容不可見",
  },
  ja: {
    defaultBio: "日本での暮らしを共有し、日々のよい瞬間を記録します",
    defaultUser: "Japan Life ユーザー",
    defaultArea: "日本",
    followStats: { followers: "フォロワー", following: "フォロー" },
    follow: "フォロー",
    following: "フォロー中",
    mutualFollow: "相互フォロー",
    blocked: "ブロック済み",
    message: "メッセージ",
    blockedMessage: "ブロック済みユーザーにはメッセージを送れません。",
    messageUnavailable: "メッセージは現在利用できません。",
    remark: (value: string) => `メモ：${value}`,
    tabs: { comments: "コメント", favorites: "保存", liked: "いいね済み", notes: "投稿" },
    privateLabels: { comments: "コメント", favorites: "保存", liked: "いいね済み", profile: "プロフィール内容" },
    followSheetDesc: "TA にメモを設定するか、フォローを解除できます。",
    close: "閉じる",
    remarkName: "メモ名を設定",
    saveRemark: "メモを保存",
    cancelFollow: "フォロー解除",
    confirmUnfollow: "この作者のフォローを解除しますか？",
    cancel: "キャンセル",
    unfollow: "フォロー解除",
    shareLife: "日本での暮らしを共有",
    comment: "コメント",
    justNow: "たった今",
    commentedPost: "コメントした投稿",
    categories: { buddy: "旅行記録", default: "日本生活", help: "暮らしの攻略", secondhand: "節約情報" },
    empty: "まだ公開コンテンツがありません",
    privateState: (label: string) => `TA は${label}を公開していません`,
    blockedState: "このユーザーをブロック済みのため、プロフィール内容は表示できません",
  },
} as const;

type ProfileText = (typeof profileCopy)[Language];

export default function CommunityUserPage() {
  const { language } = useLanguage();
  const text = profileCopy[language];
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = params.id;
  const [activeTab, setActiveTab] = useState<ProfileTab>("notes");
  const [profile, setProfile] = useState<CommunityUserProfile | null>(null);
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [displayName, setDisplayName] = useState<string>(text.defaultUser);
  const [displayId, setDisplayId] = useState(userId);
  const [displayBio, setDisplayBio] = useState<string>(text.defaultBio);
  const [displayAvatar, setDisplayAvatar] = useState("");
  const [displayArea, setDisplayArea] = useState<string>(text.defaultArea);
  const [followSheetOpen, setFollowSheetOpen] = useState(false);
  const [confirmUnfollowOpen, setConfirmUnfollowOpen] = useState(false);
  const [followingUsers, setFollowingUsers] = useState<Set<string>>(new Set());
  const [followRemark, setFollowRemark] = useState("");
  const [isBlocked, setIsBlocked] = useState(false);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [currentAccountId, setCurrentAccountId] = useState("");
  const [subjectUserId, setSubjectUserId] = useState(userId);
  const [messageStatus, setMessageStatus] = useState("");
  const [comments, setComments] = useState<CommunityComment[]>([]);
  const [remarkDraft, setRemarkDraft] = useState("");
  const [showFavorites, setShowFavorites] = useState(true);
  const [showLiked, setShowLiked] = useState(true);
  const [showComments, setShowComments] = useState(false);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [likeIds, setLikeIds] = useState<Set<string>>(new Set());

  const refreshOwnRelations = useCallback(async (accountId: string, isMounted: () => boolean = () => true) => {
    setFavoriteIds(readCommunityIdSet(communityFavoritesStorageKey));
    setLikeIds(readCommunityIdSet(communityLikesStorageKey));
    setPosts(readCommunityPosts());
    const [favoriteResult, likeResult, postsResult] = await Promise.all([
      getCommunityFavoriteIds(accountId),
      getCommunityLikeIds(accountId),
      getCommunityPosts({ status: "published" }),
    ]);
    if (!isMounted()) return;
    if (favoriteResult.source === "supabase") setFavoriteIds(favoriteResult.data);
    if (likeResult.source === "supabase") setLikeIds(likeResult.data);
    if (postsResult.data.length) setPosts(postsResult.data);
  }, []);

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
    router.replace(query ? `/community/user/${userId}?${query}` : `/community/user/${userId}`, { scroll: false });
  }, [router, searchParams, userId]);

  useEffect(() => {
    let mounted = true;
    if (!supabase) {
      setCurrentAccountId("");
      return;
    }
    void supabase.auth.getSession().then(({ data }) => {
      if (mounted) setCurrentAccountId(data.session?.user.id ?? "");
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentAccountId(session?.user.id ?? "");
    });
    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    const meProfile = readMeProfile(currentAccountId ? { id: currentAccountId } : null);
    const isOwnProfileValue = userId === currentAccountId || userId === communityCurrentUserId || userId === "local-user" || userId === meProfile.publicId;
    const resolvedSubjectUserId = isOwnProfileValue ? (currentAccountId || communityCurrentUserId) : userId;
    const savedName = meProfile.displayName;
    const savedId = meProfile.publicId;
    const savedBio = meProfile.bio;
    const savedAvatar = meProfile.avatar;
    const savedArea = getAccountAreaDisplay();
    const savedShowFavorites = window.localStorage.getItem(showFavoritesKey) !== "false";
    const savedShowLiked = window.localStorage.getItem(showLikedKey) !== "false";
    const savedShowComments = window.localStorage.getItem(showCommentsKey) === "true";
    const messageRemark = readMessageUserRemark(resolvedSubjectUserId);
    const savedFollowingUsers = readCommunityFollowingUsers();
    const savedRemark = getCommunityFollowRemark(resolvedSubjectUserId);

    setSubjectUserId(resolvedSubjectUserId);
    setIsOwnProfile(isOwnProfileValue);
    setIsBlocked(isCommunityUserBlocked(resolvedSubjectUserId));
    setFollowingUsers(savedFollowingUsers);
    setFollowRemark(savedRemark);
    setRemarkDraft(savedRemark);

    if (isOwnProfileValue) {
      setDisplayName(savedName);
      setDisplayId(savedId);
      setDisplayBio(savedBio);
      setDisplayAvatar(savedAvatar);
      setDisplayArea(savedArea);
      setShowFavorites(savedShowFavorites);
      setShowLiked(savedShowLiked);
      setShowComments(savedShowComments);
      void refreshOwnRelations(resolvedSubjectUserId, () => mounted);
    } else {
      setDisplayBio(text.defaultBio);
      setDisplayAvatar("");
      setDisplayArea(text.defaultArea);
      setShowFavorites(false);
      setShowLiked(false);
      setShowComments(false);
      setFavoriteIds(new Set());
      setLikeIds(new Set());
      if (messageRemark) setDisplayName(messageRemark);
    }

    const currentProfile = readCommunityUserProfile();
    const users = readCommunityUsers();
    const localProfile = isOwnProfileValue
      ? { ...currentProfile, avatar: savedAvatar || currentProfile.avatar, bio: savedBio, displayName: savedName, id: resolvedSubjectUserId }
      : users.find((item) => item.id === resolvedSubjectUserId || item.id === userId) ?? null;
    setProfile(localProfile);
    if (!isOwnProfileValue && localProfile) {
      setDisplayName(messageRemark || localProfile.displayName || text.defaultUser);
      setDisplayId(localProfile.id);
      setDisplayBio(localProfile.bio || text.defaultBio);
      setDisplayAvatar(localProfile.avatar || "");
      setDisplayArea(formatJapanAccountArea(localProfile.area));
    }

    setPosts(readCommunityPosts());
    void Promise.all([getCommunityProfile(resolvedSubjectUserId), getCommunityPosts({ status: "published" }), getCommunityCommentsByAuthor(resolvedSubjectUserId)]).then(([profileResult, postsResult, commentsResult]) => {
      if (!mounted) return;
      if (!isOwnProfileValue && profileResult.data) {
        const profileAccountId = profileResult.data.accountId || profileResult.data.id;
        setSubjectUserId(profileAccountId);
        setProfile(profileResult.data);
        setDisplayName(messageRemark || profileResult.data.displayName);
        setDisplayId(profileResult.data.id);
        setDisplayBio(profileResult.data.bio || text.defaultBio);
        setDisplayAvatar(profileResult.data.avatar || "");
        setDisplayArea(formatJapanAccountArea(profileResult.data.area));
        void getCommunityCommentsByAuthor(profileAccountId).then((latestComments) => {
          if (mounted) setComments(latestComments.data);
        });
      }
      if (postsResult.data.length) setPosts(postsResult.data);
      setComments(commentsResult.data);
    });
    return () => {
      mounted = false;
    };
  }, [currentAccountId, refreshOwnRelations, text.defaultArea, text.defaultBio, text.defaultUser, userId]);

  useEffect(() => {
    if (!isOwnProfile) return;
    const refreshArea = () => setDisplayArea(getAccountAreaDisplay(profile?.area));
    window.addEventListener("japan-life:user-settings-change", refreshArea);
    window.addEventListener("storage", refreshArea);
    return () => {
      window.removeEventListener("japan-life:user-settings-change", refreshArea);
      window.removeEventListener("storage", refreshArea);
    };
  }, [isOwnProfile, profile?.area]);

  useEffect(() => {
    if (!isOwnProfile || !subjectUserId) return;
    const refresh = () => void refreshOwnRelations(subjectUserId);
    window.addEventListener(communityReactionChangeEvent, refresh);
    window.addEventListener("focus", refresh);
    window.addEventListener("pageshow", refresh);
    return () => {
      window.removeEventListener(communityReactionChangeEvent, refresh);
      window.removeEventListener("focus", refresh);
      window.removeEventListener("pageshow", refresh);
    };
  }, [isOwnProfile, refreshOwnRelations, subjectUserId]);

  const authorPosts = useMemo(
    () => posts
      .filter((post) => post.authorId === subjectUserId && post.status === "published" && !post.isAnonymous)
      .sort((left, right) => parseCommunityTime(right.createdAt) - parseCommunityTime(left.createdAt)),
    [posts, subjectUserId],
  );
  const favoritePosts = useMemo(
    () => posts
      .filter((post) => post.status === "published" && favoriteIds.has(post.id))
      .sort((left, right) => parseCommunityTime(right.createdAt) - parseCommunityTime(left.createdAt)),
    [favoriteIds, posts],
  );
  const likedPosts = useMemo(
    () => posts
      .filter((post) => post.status === "published" && likeIds.has(post.id))
      .sort((left, right) => parseCommunityTime(right.createdAt) - parseCommunityTime(left.createdAt)),
    [likeIds, posts],
  );

  const noteData = useMemo(() => {
    const converted = authorPosts.map((post) => postToProfileNote(post, text));
    return {
      comments: (isOwnProfile || showComments) ? commentsToProfileNotes(comments, posts, text) : [],
      favorites: showFavorites ? favoritePosts.map((post) => postToProfileNote(post, text)) : [],
      liked: showLiked ? likedPosts.map((post) => postToProfileNote(post, text)) : [],
      notes: converted,
    } satisfies Record<ProfileTab, ProfileNote[]>;
  }, [authorPosts, comments, favoritePosts, isOwnProfile, likedPosts, posts, showComments, showFavorites, showLiked, text]);

  const blocked =
    isBlocked ||
    (activeTab === "favorites" && !showFavorites) ||
    (activeTab === "liked" && !showLiked) ||
    (activeTab === "comments" && !isOwnProfile && !showComments);

  const notes = useMemo(() => {
    if (blocked) return [];
    return noteData[activeTab];
  }, [activeTab, blocked, noteData]);

  const followStats = useMemo(
    () => {
      const stats = getCommunityFollowStats(subjectUserId, { isOwnProfile });
      const viewerFollowsUser = !isOwnProfile && followingUsers.has(subjectUserId);
      return {
        ...stats,
        followerCount: stats.followerCount + (viewerFollowsUser && !stats.viewerFollowsUser ? 1 : 0),
        isMutual: viewerFollowsUser && stats.userFollowsViewer,
        viewerFollowsUser,
      };
    },
    [followingUsers, isOwnProfile, subjectUserId],
  );

  const followLabel = followStats.isMutual ? text.mutualFollow : followStats.viewerFollowsUser ? text.following : text.follow;
  const handleFollowClick = () => {
    if (isOwnProfile) return;
    if (isBlocked) return;
    if (followStats.viewerFollowsUser) {
      setConfirmUnfollowOpen(true);
      return;
    }
    const next = followCommunityUser(subjectUserId);
    void addCommunityFollowNotification({
      followedUserId: subjectUserId,
      followerId: readMeProfile(currentAccountId ? { id: currentAccountId } : null).publicId || communityCurrentUserId,
      followerName: readMeProfile(currentAccountId ? { id: currentAccountId } : null).displayName || text.defaultUser,
    });
    setFollowingUsers(next);
  };

  const cancelFollow = () => {
    const next = unfollowCommunityUser(subjectUserId);
    setFollowingUsers(next);
    setFollowSheetOpen(false);
    setConfirmUnfollowOpen(false);
  };

  const saveRemark = () => {
    const nextRemark = setCommunityFollowRemark(subjectUserId, remarkDraft);
    setFollowRemark(nextRemark);
    setRemarkDraft(nextRemark);
    setFollowSheetOpen(false);
  };

  const openPrivateMessage = async () => {
    if (isBlocked) {
      setMessageStatus(text.blockedMessage);
      return;
    }
    const result = await getOrCreateConversation(subjectUserId, displayName);
    if (!result.data) {
      setMessageStatus(result.error || text.messageUnavailable);
      return;
    }
    router.push(`/messages/${result.data.id}`);
  };

  return (
    <main className="min-h-screen bg-[#eef7ff] text-[#061a3a]">
      <div className="mx-auto min-h-screen w-full max-w-[430px] overflow-x-hidden bg-[linear-gradient(180deg,#eff8ff_0%,#f8fbff_44%,#ffffff_100%)] pb-28">
        <div className="mx-4 mt-4 flex items-center justify-between">
          <BackButton fallbackHref="/community/all" />
        </div>

        <section className="relative mx-4 mt-3 overflow-hidden rounded-[26px] border border-white/80 bg-white/80 px-4 pb-[18px] pt-5 shadow-[0_14px_32px_rgba(15,76,129,0.09)] backdrop-blur-2xl">
          <div className="absolute inset-0 bg-[url('/images/sakura-tokyo-bg.png')] bg-[length:100%_100%] bg-center bg-no-repeat" />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.28)_0%,rgba(239,248,255,0.18)_58%,rgba(255,255,255,0.38)_100%)]" />

          <div className="relative z-10 flex items-center gap-4">
            <div className="flex h-[104px] w-[104px] shrink-0 items-center justify-center rounded-full bg-white/92 p-2 shadow-[0_18px_38px_rgba(37,99,235,0.16)] ring-1 ring-white">
              <div
                className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-[linear-gradient(135deg,#dbeafe,#ffffff,#eff6ff)] text-[#2563eb] ring-1 ring-blue-100"
                style={displayAvatar && displayAvatar.startsWith("linear-gradient") ? { background: displayAvatar } : undefined}
              >
                {displayAvatar && !displayAvatar.startsWith("linear-gradient") ? (
                  <Image alt={displayName} className="object-cover" fill sizes="96px" src={displayAvatar} unoptimized />
                ) : (
                  <UserRound className="h-12 w-12 stroke-[1.8]" />
                )}
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-[25px] font-[850] leading-8 tracking-normal text-[#061a3a] drop-shadow-[0_1px_0_rgba(255,255,255,0.78)]">{displayName}</h1>
              <p className="mt-1 flex min-w-0 items-center gap-1 text-[13px] font-extrabold text-[#263b59]">Japan Life ID：{displayId}</p>
              <p className="mt-1 flex items-center gap-1 text-[13px] font-extrabold text-[#263b59]">
                <MapPin className="h-3.5 w-3.5 text-[#2563eb]" />
                {displayArea}
              </p>
            </div>
          </div>

          <p className="relative z-10 mt-5 text-[15px] font-extrabold leading-6 text-[#263b59] drop-shadow-[0_1px_0_rgba(255,255,255,0.65)]">{displayBio}</p>

          <div className="relative z-10 mt-4 grid h-[68px] w-[156px] grid-cols-2 items-center rounded-[20px] bg-white/86 px-4 shadow-[0_12px_26px_rgba(15,76,129,0.10)] ring-1 ring-white/90 backdrop-blur-2xl">
            <ProfileStat href={`/community/user/${subjectUserId}/follows?tab=following`} label={text.followStats.following} value={followStats.followingCount} />
            <ProfileStat href={`/community/user/${subjectUserId}/follows?tab=followers`} label={text.followStats.followers} value={followStats.followerCount} />
          </div>

          {!isOwnProfile ? (
            <div className="relative z-10 mt-3 grid grid-cols-2 gap-2">
              <button className={`inline-flex h-12 items-center justify-center gap-1 rounded-[18px] text-sm font-black shadow-sm ring-1 ${isBlocked ? "bg-slate-100 text-slate-400 ring-slate-200" : followStats.viewerFollowsUser ? "bg-white/90 text-[#2563eb] ring-blue-100" : "bg-[#2563eb] text-white ring-[#2563eb]"}`} disabled={isBlocked} onClick={handleFollowClick} type="button">
                {isBlocked ? text.blocked : followLabel}
                {!isBlocked && followStats.viewerFollowsUser ? <ChevronDown className="h-4 w-4" /> : null}
              </button>
              <button className={`inline-flex h-12 items-center justify-center gap-2 rounded-[18px] text-sm font-black shadow-sm ring-1 ${isBlocked ? "bg-slate-100 text-slate-400 ring-slate-200" : "bg-white/90 text-[#2563eb] ring-blue-100"}`} onClick={() => void openPrivateMessage()} type="button">
                <MessageCircle className="h-4 w-4" />
                {text.message}
              </button>
            </div>
          ) : null}

          {messageStatus ? <p className="relative z-10 mt-2 rounded-2xl bg-blue-50 px-3 py-2 text-xs font-black text-[#2563eb]">{messageStatus}</p> : null}
          {followRemark ? <p className="relative z-10 mt-2 text-xs font-black text-[#2563eb]">{text.remark(followRemark)}</p> : null}

        </section>

        <section className="-mt-1 rounded-t-[30px] bg-white px-4 pb-8 pt-2 shadow-[0_-10px_28px_rgba(37,99,235,0.06)]">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <TabButton active={activeTab === "notes"} href={`/community/user/${userId}`} label={text.tabs.notes} onClick={() => selectTab("notes")} />
            <TabButton active={activeTab === "favorites"} href={`/community/user/${userId}?tab=favorites`} label={text.tabs.favorites} locked={!showFavorites} onClick={() => selectTab("favorites")} />
            <TabButton active={activeTab === "liked"} href={`/community/user/${userId}?tab=liked`} label={text.tabs.liked} locked={!showLiked} onClick={() => selectTab("liked")} />
            <TabButton active={activeTab === "comments"} href={`/community/user/${userId}?tab=comments`} label={text.tabs.comments} locked={!showComments} onClick={() => selectTab("comments")} />
          </div>

          {blocked ? (
            <PrivateState label={isBlocked ? text.privateLabels.profile : activeTab === "favorites" ? text.privateLabels.favorites : activeTab === "comments" ? text.privateLabels.comments : text.privateLabels.liked} blocked={isBlocked} text={text} />
          ) : notes.length === 0 ? (
            <EmptyState text={text} />
          ) : (
            <div className="mt-3 grid grid-cols-2 gap-2.5">
              {notes.map((note) => <NoteCard key={note.id} note={note} />)}
            </div>
          )}
        </section>
      </div>

      {followSheetOpen ? (
        <div className="fixed inset-0 z-[90] flex items-end justify-center bg-slate-950/35 px-3 pb-3 backdrop-blur-sm" onClick={() => setFollowSheetOpen(false)}>
          <section className="w-full max-w-[430px] rounded-[28px] bg-white p-4 shadow-[0_24px_70px_rgba(15,23,42,0.22)]" onClick={(event) => event.stopPropagation()}>
            <div className="mx-auto h-1.5 w-10 rounded-full bg-slate-200" />
            <div className="mt-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black text-[#061a3a]">{followLabel}</h2>
                <p className="mt-1 text-xs font-bold text-[#64748b]">{text.followSheetDesc}</p>
              </div>
              <button className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 text-[#2563eb]" onClick={() => setFollowSheetOpen(false)} type="button" aria-label={text.close}>
                <X className="h-4 w-4" />
              </button>
            </div>

            <label className="mt-4 grid gap-2">
              <span className="text-sm font-black text-[#263b59]">{text.remarkName}</span>
              <input className="h-12 rounded-2xl border border-blue-100 bg-blue-50/70 px-4 text-sm font-black text-[#061a3a] outline-none focus:border-[#2563eb]" maxLength={20} onChange={(event) => setRemarkDraft(event.target.value)} placeholder={displayName} value={remarkDraft} />
            </label>
            <button className="mt-3 h-12 w-full rounded-2xl bg-[#2563eb] text-sm font-black text-white shadow-[0_12px_24px_rgba(37,99,235,0.20)]" onClick={saveRemark} type="button">
              {text.saveRemark}
            </button>
            <button className="mt-3 h-12 w-full rounded-2xl bg-rose-50 text-sm font-black text-rose-600 ring-1 ring-rose-100" onClick={cancelFollow} type="button">
              {text.cancelFollow}
            </button>
          </section>
        </div>
      ) : null}

      {confirmUnfollowOpen ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/42 px-8">
          <section className="w-full max-w-[330px] overflow-hidden rounded-[18px] bg-white text-center shadow-[0_24px_70px_rgba(15,23,42,0.28)]">
            <p className="px-5 py-8 text-[19px] font-black text-[#111827]">{text.confirmUnfollow}</p>
            <div className="grid grid-cols-2 border-t border-slate-100">
              <button className="h-14 border-r border-slate-100 text-[17px] font-black text-slate-400" onClick={() => setConfirmUnfollowOpen(false)} type="button">{text.cancel}</button>
              <button className="h-14 text-[17px] font-black text-rose-500" onClick={cancelFollow} type="button">{text.unfollow}</button>
            </div>
          </section>
        </div>
      ) : null}

    </main>
  );
}

function ProfileStat({ href, label, value }: { href?: string; label: string; value: number }) {
  if (href) {
    return (
      <Link className="min-w-0 rounded-2xl text-center transition active:scale-[0.96]" href={href} prefetch={false}>
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

function postToProfileNote(post: CommunityPost, text: ProfileText): ProfileNote {
  return {
    category: getCategory(post.type, text),
    coverText: getCoverText(post.title, post.content),
    description: post.content || text.shareLife,
    href: getCommunityPostHref(post, "all"),
    id: post.id,
    image: post.images?.[0],
    likes: post.likeCount || post.likes || 0,
    time: post.createdAt,
    title: post.title,
  };
}

function commentsToProfileNotes(comments: CommunityComment[], posts: CommunityPost[], text: ProfileText): ProfileNote[] {
  return comments
    .filter((comment) => comment.status === "published" && !comment.isAnonymous)
    .map((comment) => {
      const post = posts.find((item) => item.id === comment.postId);
      return {
        category: text.comment,
        coverText: getCoverText(post?.title || comment.content, comment.content),
        description: comment.content,
        href: post ? getCommunityPostHref(post, "all") : undefined,
        id: comment.id,
        image: post?.images?.[0],
        likes: post?.likeCount || post?.likes || 0,
        time: comment.createdAt || text.justNow,
        title: post?.title || text.commentedPost,
      } satisfies ProfileNote;
    });
}

function getCategory(type: CommunityPostType, text: ProfileText) {
  if (type === "secondhand") return text.categories.secondhand;
  if (type === "buddy") return text.categories.buddy;
  if (type === "help" || type === "helper") return text.categories.help;
  return text.categories.default;
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
        <div className="mt-2 flex items-center justify-between gap-2 text-[11px] font-black text-[#64748b]"><span>{note.time}</span><span className="inline-flex items-center gap-1"><Heart className="h-3.5 w-3.5" />{note.likes}</span></div>
      </div>
    </article>
  );
  if (!note.href) return card;
  return (
    <Link className="block transition active:scale-[0.98]" href={note.href} prefetch={false}>
      {card}
    </Link>
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

function isProfileTab(value: string | null): value is ProfileTab {
  return value === "notes" || value === "favorites" || value === "liked" || value === "comments";
}

function EmptyState({ text }: { text: ProfileText }) {
  return <section className="mt-5 rounded-[24px] border border-blue-100 bg-[linear-gradient(135deg,#eff6ff,#ffffff)] p-6 text-center shadow-[0_12px_28px_rgba(37,99,235,0.08)]"><div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-[#2563eb] ring-1 ring-blue-100"><Sparkles className="h-6 w-6" /></div><p className="mt-3 text-sm font-black text-[#263b59]">{text.empty}</p></section>;
}

function PrivateState({ blocked = false, label, text }: { blocked?: boolean; label: string; text: ProfileText }) {
  return <section className="mt-5 rounded-[24px] border border-blue-100 bg-[linear-gradient(135deg,#eff6ff,#ffffff)] p-6 text-center shadow-[0_12px_28px_rgba(37,99,235,0.08)]"><div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-[#2563eb] ring-1 ring-blue-100"><Sparkles className="h-6 w-6" /></div><p className="mt-3 text-sm font-black text-[#263b59]">{blocked ? text.blockedState : text.privateState(label)}</p></section>;
}

function parseCommunityTime(value: string) {
  const match = value.match(/^(\d{2})\/(\d{2})\s+(\d{2}):(\d{2})$/);
  if (!match) return 0;
  const [, month, day, hour, minute] = match;
  return new Date(2026, Number(month) - 1, Number(day), Number(hour), Number(minute)).getTime();
}
