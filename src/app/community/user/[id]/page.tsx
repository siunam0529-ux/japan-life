"use client";

import { ChevronDown, Heart, MapPin, MessageCircle, Sparkles, UserRound, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { BackButton } from "@/components/BackButton";
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

const defaultProfileBio = "分享在日生活，记录每个美好瞬间";

export default function CommunityUserPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const userId = params.id;
  const [activeTab, setActiveTab] = useState<ProfileTab>("notes");
  const [profile, setProfile] = useState<CommunityUserProfile | null>(null);
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [displayName, setDisplayName] = useState("Japan Life 用户");
  const [displayId, setDisplayId] = useState(userId);
  const [displayBio, setDisplayBio] = useState(defaultProfileBio);
  const [displayAvatar, setDisplayAvatar] = useState("");
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
      setShowFavorites(savedShowFavorites);
      setShowLiked(savedShowLiked);
      setShowComments(savedShowComments);
      void refreshOwnRelations(resolvedSubjectUserId, () => mounted);
    } else {
      setDisplayBio(defaultProfileBio);
      setDisplayAvatar("");
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
      setDisplayName(messageRemark || localProfile.displayName || "Japan Life 用户");
      setDisplayId(localProfile.id);
      setDisplayBio(localProfile.bio || defaultProfileBio);
      setDisplayAvatar(localProfile.avatar || "");
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
        setDisplayBio(profileResult.data.bio || defaultProfileBio);
        setDisplayAvatar(profileResult.data.avatar || "");
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
  }, [currentAccountId, refreshOwnRelations, userId]);

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
    const converted = authorPosts.map(postToProfileNote);
    return {
      comments: (isOwnProfile || showComments) ? commentsToProfileNotes(comments, posts) : [],
      favorites: showFavorites ? favoritePosts.map(postToProfileNote) : [],
      liked: showLiked ? likedPosts.map(postToProfileNote) : [],
      notes: converted,
    } satisfies Record<ProfileTab, ProfileNote[]>;
  }, [authorPosts, comments, favoritePosts, isOwnProfile, likedPosts, posts, showComments, showFavorites, showLiked]);

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

  const followLabel = followStats.isMutual ? "互相关注" : followStats.viewerFollowsUser ? "已关注" : "关注";
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
      followerName: readMeProfile(currentAccountId ? { id: currentAccountId } : null).displayName || "Japan Life 用户",
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
      setMessageStatus("已拉黑用户不能私信。");
      return;
    }
    const result = await getOrCreateConversation(subjectUserId, displayName);
    if (!result.data) {
      setMessageStatus(result.error || "私信暂时不可用。");
      return;
    }
    router.push(`/messages/${result.data.id}`);
  };

  return (
    <main className="min-h-screen bg-[#eef7ff] text-[#061a3a]">
      <div className="mx-auto min-h-screen w-full max-w-[430px] overflow-x-hidden bg-[linear-gradient(180deg,#eff8ff_0%,#f8fbff_44%,#ffffff_100%)] pb-28">
        <section className="relative overflow-hidden px-4 pb-6 pt-5">
          <div className="absolute inset-0 bg-[#eaf6ff] bg-[url('/images/weather-hero-bg.png')] bg-cover bg-center" />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.52)_0%,rgba(239,248,255,0.38)_58%,rgba(255,255,255,0.86)_100%)]" />

          <div className="relative z-10 flex items-center justify-between">
            <BackButton fallbackHref="/community/all" />
          </div>

          <div className="relative z-10 mt-7 flex items-center gap-4">
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
              <h1 className="truncate text-[26px] font-black leading-8 tracking-normal text-[#061a3a]">{displayName}</h1>
              <p className="mt-1 flex min-w-0 items-center gap-1 text-[13px] font-bold text-[#40546f]">Japan Life ID：{displayId}</p>
              <p className="mt-1 flex items-center gap-1 text-[13px] font-bold text-[#40546f]">
                <MapPin className="h-3.5 w-3.5 text-[#2563eb]" />
                {profile?.area || "日本"}
              </p>
            </div>
          </div>

          <p className="relative z-10 mt-5 text-[15px] font-bold leading-6 text-[#263b59]">{displayBio}</p>

          <div className="relative z-10 mt-4 grid w-[156px] grid-cols-2 rounded-[18px] bg-white/88 px-4 py-3 shadow-[0_12px_24px_rgba(37,99,235,0.10)] ring-1 ring-white/90 backdrop-blur-xl">
            <ProfileStat href={`/community/user/${subjectUserId}/follows?tab=following`} label="关注" value={followStats.followingCount} />
            <ProfileStat href={`/community/user/${subjectUserId}/follows?tab=followers`} label="粉丝" value={followStats.followerCount} />
          </div>

          {!isOwnProfile ? (
            <div className="relative z-10 mt-3 grid grid-cols-2 gap-2">
              <button className={`inline-flex h-12 items-center justify-center gap-1 rounded-[18px] text-sm font-black shadow-sm ring-1 ${isBlocked ? "bg-slate-100 text-slate-400 ring-slate-200" : followStats.viewerFollowsUser ? "bg-white/90 text-[#2563eb] ring-blue-100" : "bg-[#2563eb] text-white ring-[#2563eb]"}`} disabled={isBlocked} onClick={handleFollowClick} type="button">
                {isBlocked ? "已拉黑" : followLabel}
                {!isBlocked && followStats.viewerFollowsUser ? <ChevronDown className="h-4 w-4" /> : null}
              </button>
              <button className={`inline-flex h-12 items-center justify-center gap-2 rounded-[18px] text-sm font-black shadow-sm ring-1 ${isBlocked ? "bg-slate-100 text-slate-400 ring-slate-200" : "bg-white/90 text-[#2563eb] ring-blue-100"}`} onClick={() => void openPrivateMessage()} type="button">
                <MessageCircle className="h-4 w-4" />
                发私信
              </button>
            </div>
          ) : null}

          {messageStatus ? <p className="relative z-10 mt-2 rounded-2xl bg-blue-50 px-3 py-2 text-xs font-black text-[#2563eb]">{messageStatus}</p> : null}
          {followRemark ? <p className="relative z-10 mt-2 text-xs font-black text-[#2563eb]">备注：{followRemark}</p> : null}

        </section>

        <section className="-mt-1 rounded-t-[30px] bg-white px-4 pb-8 pt-2 shadow-[0_-10px_28px_rgba(37,99,235,0.06)]">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <TabButton active={activeTab === "notes"} label="笔记" onClick={() => setActiveTab("notes")} />
            <TabButton active={activeTab === "favorites"} label="收藏" onClick={() => setActiveTab("favorites")} />
            <TabButton active={activeTab === "liked"} label="赞过" onClick={() => setActiveTab("liked")} />
            <TabButton active={activeTab === "comments"} label="评论" onClick={() => setActiveTab("comments")} />
          </div>

          {blocked ? (
            <PrivateState label={isBlocked ? "主页内容" : activeTab === "favorites" ? "收藏" : activeTab === "comments" ? "评论" : "赞过"} blocked={isBlocked} />
          ) : notes.length === 0 ? (
            <EmptyState />
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
                <p className="mt-1 text-xs font-bold text-[#64748b]">可以给 TA 设置备注，或者取消关注。</p>
              </div>
              <button className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 text-[#2563eb]" onClick={() => setFollowSheetOpen(false)} type="button" aria-label="关闭">
                <X className="h-4 w-4" />
              </button>
            </div>

            <label className="mt-4 grid gap-2">
              <span className="text-sm font-black text-[#263b59]">设置备注名</span>
              <input className="h-12 rounded-2xl border border-blue-100 bg-blue-50/70 px-4 text-sm font-black text-[#061a3a] outline-none focus:border-[#2563eb]" maxLength={20} onChange={(event) => setRemarkDraft(event.target.value)} placeholder={displayName} value={remarkDraft} />
            </label>
            <button className="mt-3 h-12 w-full rounded-2xl bg-[#2563eb] text-sm font-black text-white shadow-[0_12px_24px_rgba(37,99,235,0.20)]" onClick={saveRemark} type="button">
              保存备注
            </button>
            <button className="mt-3 h-12 w-full rounded-2xl bg-rose-50 text-sm font-black text-rose-600 ring-1 ring-rose-100" onClick={cancelFollow} type="button">
              取消关注
            </button>
          </section>
        </div>
      ) : null}

      {confirmUnfollowOpen ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/42 px-8">
          <section className="w-full max-w-[330px] overflow-hidden rounded-[18px] bg-white text-center shadow-[0_24px_70px_rgba(15,23,42,0.28)]">
            <p className="px-5 py-8 text-[19px] font-black text-[#111827]">不再关注该作者？</p>
            <div className="grid grid-cols-2 border-t border-slate-100">
              <button className="h-14 border-r border-slate-100 text-[17px] font-black text-slate-400" onClick={() => setConfirmUnfollowOpen(false)} type="button">取消</button>
              <button className="h-14 text-[17px] font-black text-rose-500" onClick={cancelFollow} type="button">不再关注</button>
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

function postToProfileNote(post: CommunityPost): ProfileNote {
  return {
    category: getCategory(post.type),
    coverText: getCoverText(post.title, post.content),
    description: post.content || "分享在日生活",
    href: getCommunityPostHref(post, "all"),
    id: post.id,
    image: post.images?.[0],
    likes: post.likeCount || post.likes || 0,
    time: post.createdAt,
    title: post.title,
  };
}

function commentsToProfileNotes(comments: CommunityComment[], posts: CommunityPost[]): ProfileNote[] {
  return comments
    .filter((comment) => comment.status === "published" && !comment.isAnonymous)
    .map((comment) => {
      const post = posts.find((item) => item.id === comment.postId);
      return {
        category: "评论",
        coverText: getCoverText(post?.title || comment.content, comment.content),
        description: comment.content,
        href: post ? getCommunityPostHref(post, "all") : undefined,
        id: comment.id,
        image: post?.images?.[0],
        likes: post?.likeCount || post?.likes || 0,
        time: comment.createdAt || "刚刚",
        title: post?.title || "评论过的帖子",
      } satisfies ProfileNote;
    });
}

function getCategory(type: CommunityPostType) {
  if (type === "secondhand") return "省钱情报";
  if (type === "buddy") return "旅行记录";
  if (type === "help" || type === "helper") return "手帐攻略";
  return "在日生活";
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
        <div className="mt-2 flex items-center justify-between gap-2 text-[11px] font-black text-[#64748b]"><span>{note.time}</span><span className="inline-flex items-center gap-1"><Heart className="h-3.5 w-3.5" />{note.likes}</span></div>
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

function EmptyState() {
  return <section className="mt-5 rounded-[24px] border border-blue-100 bg-[linear-gradient(135deg,#eff6ff,#ffffff)] p-6 text-center shadow-[0_12px_28px_rgba(37,99,235,0.08)]"><div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-[#2563eb] ring-1 ring-blue-100"><Sparkles className="h-6 w-6" /></div><p className="mt-3 text-sm font-black text-[#263b59]">这里还没有公开内容</p></section>;
}

function PrivateState({ blocked = false, label }: { blocked?: boolean; label: string }) {
  return <section className="mt-5 rounded-[24px] border border-blue-100 bg-[linear-gradient(135deg,#eff6ff,#ffffff)] p-6 text-center shadow-[0_12px_28px_rgba(37,99,235,0.08)]"><div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-[#2563eb] ring-1 ring-blue-100"><Sparkles className="h-6 w-6" /></div><p className="mt-3 text-sm font-black text-[#263b59]">{blocked ? "已拉黑该用户，主页内容不可见" : `TA 暂时没有公开${label}`}</p></section>;
}

function parseCommunityTime(value: string) {
  const match = value.match(/^(\d{2})\/(\d{2})\s+(\d{2}):(\d{2})$/);
  if (!match) return 0;
  const [, month, day, hour, minute] = match;
  return new Date(2026, Number(month) - 1, Number(day), Number(hour), Number(minute)).getTime();
}
