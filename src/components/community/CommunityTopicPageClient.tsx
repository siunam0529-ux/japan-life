"use client";

import { ArrowLeft, Eye, Heart, UserRound } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { CommunityNotificationButton } from "@/components/community/CommunityNotificationButton";
import { CommunityPostImageFrame } from "@/components/community/CommunityPostImageFrame";
import { CommunityProfileButton } from "@/components/community/CommunityProfileButton";
import { CommunityEmptyState } from "@/components/community/CommunityStates";
import { useLanguage } from "@/hooks/useLanguage";
import { isOwnAccountProfile, readMeProfile } from "@/lib/account/profile";
import { compareCommunityPosts } from "@/lib/community/curation";
import { communityReactionChangeEvent, dispatchCommunityReactionChange, type CommunityReactionChangeDetail } from "@/lib/community/reactionEvents";
import { communityMeHref, getCommunityLocaleHref, getCommunityNewPostHref, getCommunityPostHref, getCommunitySelectionHref, getCommunityUserHref } from "@/lib/community/routes";
import { getCurrentCommunityUser, type CommunityUser } from "@/lib/community/currentUser";
import { addCommunityNotification, communityCurrentUserId, communityLikesStorageKey, createCommunityNotification, getCommunityLikeIds, getCommunityPosts, getCommunityProfile, readCommunityIdSet, readCommunityPosts, readCommunityUsers, toggleCommunityLike } from "@/lib/community/repository";
import { getCommunityPostTypeLabel, type CommunityPost, type CommunityPostType, type CommunityUserProfile, type CommunityViewLocale } from "@/lib/community/types";
import { withBackFrom } from "@/lib/navigation/back";

const typeTone: Record<CommunityPostType, string> = {
  buddy: "bg-violet-50 text-violet-700 ring-violet-100",
  help: "bg-amber-50 text-amber-700 ring-amber-100",
  helper: "bg-blue-50 text-blue-700 ring-blue-100",
  secondhand: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  share: "bg-pink-50 text-pink-700 ring-pink-100",
};
const topicCopy = {
  "zh-CN": {
    back: "返回",
    myCommunity: "我的社区",
    switch: "切换",
    subtitle: "看看大家关于这个话题的分享",
    count: (value: number) => `共 ${value} 条内容`,
    likeFail: "点赞失败，请稍后再试。",
    likeNoticeTitle: "有人点赞了你的帖子",
    likeNoticeMessage: (title: string) => `你的分享「${title}」收到新的点赞。`,
    publishTopic: "发布这个话题",
    emptyDesc: "来发布第一条和这个话题相关的内容吧。",
    emptyTitle: "还没有相关内容",
    like: "点赞",
    viewProfile: (author: string) => `查看 ${author} 的主页`,
  },
  "zh-TW": {
    back: "返回",
    myCommunity: "我的社區",
    switch: "切換",
    subtitle: "看看大家關於這個話題的分享",
    count: (value: number) => `共 ${value} 條內容`,
    likeFail: "點讚失敗，請稍後再試。",
    likeNoticeTitle: "有人點讚了你的帖子",
    likeNoticeMessage: (title: string) => `你的分享「${title}」收到新的點讚。`,
    publishTopic: "發布這個話題",
    emptyDesc: "來發布第一條和這個話題相關的內容吧。",
    emptyTitle: "還沒有相關內容",
    like: "點讚",
    viewProfile: (author: string) => `查看 ${author} 的主頁`,
  },
  ja: {
    back: "戻る",
    myCommunity: "マイコミュニティ",
    switch: "切替",
    subtitle: "このトピックについてのみんなの投稿を見る",
    count: (value: number) => `${value} 件の内容`,
    likeFail: "いいねに失敗しました。しばらくしてからもう一度お試しください。",
    likeNoticeTitle: "投稿にいいねが届きました",
    likeNoticeMessage: (title: string) => `あなたの投稿「${title}」に新しいいいねが届きました。`,
    publishTopic: "このトピックを投稿",
    emptyDesc: "このトピックに関連する最初の投稿をしてみましょう。",
    emptyTitle: "関連する内容はまだありません",
    like: "いいね",
    viewProfile: (author: string) => `${author} のプロフィールを見る`,
  },
} as const;

export function CommunityTopicPageClient({ locale = "all", tag }: { locale?: CommunityViewLocale; tag: string }) {
  const { language } = useLanguage();
  const text = topicCopy[language];
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<CommunityUser | null>(null);
  const [likes, setLikes] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState("");
  const [supabaseEnabled, setSupabaseEnabled] = useState(false);
  const [userPosts, setUserPosts] = useState<CommunityPost[]>([]);
  const [authorProfiles, setAuthorProfiles] = useState<Record<string, CommunityUserProfile>>({});

  useEffect(() => {
    let mounted = true;
    setUserPosts(readCommunityPosts(locale === "all" ? "zh-cn" : locale));
    setLikes(readCommunityIdSet(communityLikesStorageKey));
    void getCurrentCommunityUser().then((user) => {
      if (mounted) setCurrentUser(user);
    });
    void getCommunityPosts({ locale, tag }).then((result) => {
      if (!mounted) return;
      if (result.source === "supabase") {
        setSupabaseEnabled(true);
        setUserPosts(result.data);
      } else {
        setSupabaseEnabled(false);
      }
    });
    void getCommunityLikeIds().then((result) => {
      if (mounted && result.source === "supabase") setLikes(result.data);
    });
    return () => {
      mounted = false;
    };
  }, [locale, tag]);

  useEffect(() => {
    function syncReaction(event: Event) {
      const detail = (event as CustomEvent<CommunityReactionChangeDetail>).detail;
      if (!detail?.postId) return;
      if (detail.type === "like") {
        setLikes((current) => {
          const next = new Set(current);
          if (detail.active) next.add(detail.postId);
          else next.delete(detail.postId);
          return next;
        });
        setUserPosts((items) => items.map((post) => post.id === detail.postId ? { ...post, likeCount: detail.count, likes: detail.count } : post));
      }
    }
    window.addEventListener(communityReactionChangeEvent, syncReaction);
    return () => window.removeEventListener(communityReactionChangeEvent, syncReaction);
  }, []);

  const visiblePosts = useMemo(
    () => userPosts
      .filter((post) => post.status === "published")
      .filter((post) => locale === "all" || post.communityLocale === locale)
      .filter((post) => post.tags.includes(tag))
      .sort((left, right) => compareCommunityPosts(left, right, { mode: "latest" })),
    [locale, tag, userPosts],
  );

  useEffect(() => {
    let mounted = true;
    const missingAuthorIds = [...new Set(visiblePosts.map((post) => post.authorId).filter(Boolean))]
      .filter((authorId) => !authorProfiles[authorId]);
    if (missingAuthorIds.length === 0) return () => {
      mounted = false;
    };

    void Promise.all(missingAuthorIds.map((authorId) => getCommunityProfile(authorId))).then((results) => {
      if (!mounted) return;
      setAuthorProfiles((current) => {
        const next = { ...current };
        results.forEach((result, index) => {
          if (result.data) next[missingAuthorIds[index]] = result.data;
        });
        return next;
      });
    });

    return () => {
      mounted = false;
    };
  }, [authorProfiles, visiblePosts]);

  const backHref = getCommunityLocaleHref(locale);

  async function handleLike(postId: string) {
    if (!currentUser) {
      router.push(withBackFrom(`/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`));
      return;
    }

    const wasActive = likes.has(postId);

    if (!supabaseEnabled) {
      const result = await toggleCommunityLike(postId, currentUser.id);
      if (!result.data) {
        setMessage(result.error || text.likeFail);
        return;
      }
      const next = new Set(likes);
      if (result.data.active) next.add(postId);
      else next.delete(postId);
      setLikes(next);
      setUserPosts((items) => items.map((post) => post.id === postId ? {
        ...post,
        likeCount: result.data!.count,
        likes: result.data!.count,
      } : post));
      dispatchCommunityReactionChange({ active: result.data.active, count: result.data.count, postId, type: "like" });

      if (result.data.active && !wasActive) {
        const post = visiblePosts.find((item) => item.id === postId);
        if (post) {
          addCommunityNotification(createCommunityNotification({
            communityLocale: post.communityLocale,
            message: text.likeNoticeMessage(post.title),
            postId: post.id,
            targetId: post.id,
            targetType: "post",
            title: text.likeNoticeTitle,
            type: "like",
            userId: post.authorId || communityCurrentUserId,
          }));
        }
      }
      return;
    }

    const result = await toggleCommunityLike(postId, currentUser.id);
    if (!result.data) {
      setMessage(result.error || text.likeFail);
      return;
    }

    const next = new Set(likes);
    if (result.data.active) next.add(postId);
    else next.delete(postId);
    setLikes(next);
    setUserPosts((items) => items.map((post) => post.id === postId ? {
      ...post,
      likeCount: result.data!.count,
      likes: result.data!.count,
    } : post));
    dispatchCommunityReactionChange({ active: result.data.active, count: result.data.count, postId, type: "like" });
  }

  return (
    <main className="jl-tool-theme min-h-screen text-[#061a3a]">
      <div className="jl-tool-shell mx-auto min-h-screen w-full max-w-[430px] px-4 pb-32 pt-5">
        <div className="flex items-center justify-between gap-2">
          <Link className="inline-flex h-9 items-center gap-2 rounded-full bg-white/85 px-4 text-sm font-black text-[#2563EB] shadow-sm ring-1 ring-blue-100" href={backHref} prefetch={false}>
            <ArrowLeft className="h-4 w-4" />
            {text.back}
          </Link>
          <div className="flex shrink-0 items-center gap-2">
            <CommunityNotificationButton />
            <CommunityProfileButton href={communityMeHref} label={text.myCommunity} />
            <Link className="inline-flex h-9 items-center rounded-full bg-white/85 px-3 text-xs font-black text-[#2563EB] shadow-sm ring-1 ring-blue-100" href={getCommunitySelectionHref()} prefetch={false}>
              {text.switch}
            </Link>
          </div>
        </div>

        <section className="mt-4 rounded-[28px] bg-[linear-gradient(135deg,rgba(219,234,254,0.92),rgba(255,228,240,0.82))] p-[18px] shadow-[0_14px_32px_rgba(15,76,129,0.10)] ring-1 ring-white/80">
          <p className="text-xs font-black text-[#2563EB]">Topic</p>
          <h1 className="mt-1 text-[26px] font-[850] leading-8 text-[#061a3a]">#{tag}</h1>
          <p className="mt-2 text-[13px] font-bold leading-5 text-[#40546f]">{text.subtitle}</p>
          <p className="mt-3 inline-flex rounded-full bg-white/80 px-3 py-1 text-xs font-black text-[#1D4ED8] ring-1 ring-blue-100">{text.count(visiblePosts.length)}</p>
        </section>

        {message ? <p className="mt-4 rounded-2xl bg-blue-50 px-4 py-3 text-xs font-black text-[#1D4ED8] ring-1 ring-blue-100">{message}</p> : null}

        <section className="mt-4 grid grid-cols-2 gap-3 max-[359px]:grid-cols-1">
          {visiblePosts.map((post) => (
            <TopicPostCard
              key={post.id}
              likeActive={likes.has(post.id)}
              locale={locale}
              onLike={() => void handleLike(post.id)}
              post={post}
              currentUser={currentUser}
              profile={authorProfiles[post.authorId]}
              text={text}
            />
          ))}
        </section>

        {visiblePosts.length === 0 ? (
          <div className="mt-4">
            <CommunityEmptyState
              actionHref={getCommunityNewPostHref(locale)}
              actionLabel={text.publishTopic}
              description={text.emptyDesc}
              title={text.emptyTitle}
            />
          </div>
        ) : null}

      </div>
    </main>
  );
}

function TopicPostCard({ currentUser, likeActive, locale, onLike, post, profile, text }: { currentUser: CommunityUser | null; likeActive: boolean; locale: CommunityViewLocale; onLike: () => void; post: CommunityPost; profile?: CommunityUserProfile; text: (typeof topicCopy)[keyof typeof topicCopy] }) {
  const author = post.authorName;
  return (
    <article className="overflow-hidden rounded-[22px] border border-white/80 bg-white/90 shadow-[0_12px_30px_rgba(37,99,235,0.09)] backdrop-blur">
      <Link className="block" href={getCommunityPostHref(post, locale)} prefetch={false}>
        <div className="relative overflow-hidden rounded-t-[22px]" style={{ height: getImageHeight(post.type) }}>
          <CommunityPostImageFrame image={post.images?.[0]} type={post.type} />
          <div className="absolute inset-0 bg-white/10" />
          <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
            <span className={`rounded-full px-2.5 py-1 text-[11px] font-black ring-1 ${typeTone[post.type]}`}>{getCommunityPostTypeLabel(post.type)}</span>
          </div>
        </div>
        <div className="p-3">
          <h2 className="line-clamp-2 text-sm font-black leading-5">{post.title}</h2>
          <p className="mt-1 line-clamp-2 text-xs font-semibold leading-5 text-slate-600">{post.content}</p>
        </div>
      </Link>
      <div className="flex items-center justify-between gap-2 px-3 pb-3">
        <AuthorLink author={author} currentUser={currentUser} post={post} profile={profile} text={text} />
        <div className="flex shrink-0 items-center gap-2 text-[11px] font-black text-slate-500">
          <span className="inline-flex items-center gap-0.5 rounded-full px-1.5 py-1 text-slate-500">
            <Eye className="h-3.5 w-3.5" />
            {post.viewCount ?? post.views ?? 0}
          </span>
          <button className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-1 ${likeActive ? "bg-pink-50 text-pink-600" : "bg-white text-slate-500"}`} onClick={onLike} type="button" aria-label={text.like}>
            <Heart className={`h-3.5 w-3.5 ${likeActive ? "fill-current" : ""}`} />
            {post.likeCount ?? post.likes}
          </button>
        </div>
      </div>
    </article>
  );
}

function AuthorLink({ author, currentUser, post, profile, text }: { author: string; currentUser: CommunityUser | null; post: CommunityPost; profile?: CommunityUserProfile; text: (typeof topicCopy)[keyof typeof topicCopy] }) {
  const avatarValue = getAuthorAvatar(post, currentUser, profile);
  const imageAvatar = isImageAvatar(avatarValue);
  const avatar = (
    <span className="flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-full bg-blue-50 text-[#2563EB]" style={avatarValue && !imageAvatar ? { background: avatarValue } : undefined}>
      {imageAvatar ? <img alt={author} className="h-full w-full object-cover" src={avatarValue} /> : <UserRound className="h-3.5 w-3.5" />}
    </span>
  );
  if (!post.authorId) {
    return (
      <div className="flex min-w-0 items-center gap-1.5">
        {avatar}
        <span className="truncate text-[11px] font-bold text-slate-600">{author}</span>
      </div>
    );
  }
  return (
    <div className="flex min-w-0 items-center gap-1.5">
      <Link className="shrink-0 rounded-full transition active:scale-95" href={withBackFrom(getCommunityUserHref(profile?.id || post.authorId))} prefetch={false} aria-label={text.viewProfile(author)}>
        {avatar}
      </Link>
      <span className="truncate text-[11px] font-bold text-slate-600">{author}</span>
    </div>
  );
}

function getAuthorAvatar(post: CommunityPost, currentUser: CommunityUser | null, profile?: CommunityUserProfile) {
  if (post.authorId && isOwnAccountProfile(post.authorId, currentUser)) return readMeProfile(currentUser).avatar;
  if (profile?.avatar) return profile.avatar;
  return readCommunityUsers().find((user) => user.id === post.authorId)?.avatar || "";
}

function isImageAvatar(value: string) {
  return value.startsWith("data:image") || value.startsWith("http") || value.startsWith("/");
}

function getImageHeight(type: CommunityPostType) {
  if (type === "share") return 150;
  if (type === "secondhand") return 145;
  if (type === "help") return 110;
  if (type === "buddy") return 130;
  return 120;
}
