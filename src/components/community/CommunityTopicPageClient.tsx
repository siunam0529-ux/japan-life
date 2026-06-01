"use client";

import { ArrowLeft, Heart, MessageCircle, Plus, UserRound } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { CommunityNotificationButton } from "@/components/community/CommunityNotificationButton";
import { CommunityPostImageFrame } from "@/components/community/CommunityPostImageFrame";
import { CommunityProfileButton } from "@/components/community/CommunityProfileButton";
import { CommunityEmptyState } from "@/components/community/CommunityStates";
import { compareCommunityPosts } from "@/lib/community/curation";
import { communityMockPosts } from "@/lib/community/mock";
import { communityMeHref, getCommunityLocaleHref, getCommunityNewPostHref, getCommunityPostHref, getCommunitySelectionHref, getCommunityUserHref } from "@/lib/community/routes";
import { getCurrentCommunityUser, type CommunityUser } from "@/lib/community/currentUser";
import { addCommunityNotification, communityCurrentUserId, communityLikesStorageKey, createCommunityNotification, getCommunityLikeIds, getCommunityPosts, mergeCommunityPosts, readCommunityIdSet, readCommunityPosts, toggleCommunityLike, writeCommunityIdSet } from "@/lib/community/repository";
import { getCommunityPostTypeLabel, type CommunityPost, type CommunityPostType, type CommunityViewLocale } from "@/lib/community/types";
import { withBackFrom } from "@/lib/navigation/back";

const typeTone: Record<CommunityPostType, string> = {
  buddy: "bg-violet-50 text-violet-700 ring-violet-100",
  help: "bg-amber-50 text-amber-700 ring-amber-100",
  helper: "bg-blue-50 text-blue-700 ring-blue-100",
  secondhand: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  share: "bg-pink-50 text-pink-700 ring-pink-100",
};

export function CommunityTopicPageClient({ locale = "all", tag }: { locale?: CommunityViewLocale; tag: string }) {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<CommunityUser | null>(null);
  const [likes, setLikes] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState("");
  const [supabaseEnabled, setSupabaseEnabled] = useState(false);
  const [userPosts, setUserPosts] = useState<CommunityPost[]>([]);

  useEffect(() => {
    let mounted = true;
    setUserPosts(readCommunityPosts(locale === "all" ? "zh-cn" : locale));
    setLikes(readCommunityIdSet(communityLikesStorageKey));
    void getCurrentCommunityUser().then((user) => {
      if (mounted) setCurrentUser(user);
    });
    void getCommunityPosts({ locale, tag }).then((result) => {
      if (!mounted) return;
      if (result.source === "supabase" && result.data.length > 0) {
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

  const visiblePosts = useMemo(
    () => (supabaseEnabled ? userPosts : mergeCommunityPosts(userPosts, communityMockPosts))
      .filter((post) => post.status === "published")
      .filter((post) => locale === "all" || post.communityLocale === locale)
      .filter((post) => post.tags.includes(tag))
      .sort((left, right) => compareCommunityPosts(left, right, { mode: "latest" })),
    [locale, supabaseEnabled, tag, userPosts],
  );

  const backHref = getCommunityLocaleHref(locale);

  async function handleLike(postId: string) {
    if (!currentUser) {
      router.push(withBackFrom(`/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`));
      return;
    }

    const wasActive = likes.has(postId);

    if (!supabaseEnabled) {
      const next = new Set(likes);
      if (wasActive) next.delete(postId);
      else next.add(postId);
      setLikes(next);
      writeCommunityIdSet(communityLikesStorageKey, next);

      if (!wasActive) {
        const post = visiblePosts.find((item) => item.id === postId);
        if (post) {
          addCommunityNotification(createCommunityNotification({
            communityLocale: post.communityLocale,
            message: `你的分享「${post.title}」收到新的点赞。`,
            postId: post.id,
            targetId: post.id,
            targetType: "post",
            title: "有人点赞了你的帖子",
            type: "like",
            userId: post.authorId || communityCurrentUserId,
          }));
        }
      }
      return;
    }

    const result = await toggleCommunityLike(postId, currentUser.id);
    if (!result.data) {
      setMessage(result.error || "点赞失败，请稍后再试。");
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
  }

  return (
    <main className="jl-tool-theme min-h-screen text-[#061a3a]">
      <div className="jl-tool-shell mx-auto min-h-screen w-full max-w-[430px] px-4 pb-32 pt-5">
        <div className="flex items-center justify-between gap-2">
          <Link className="inline-flex h-9 items-center gap-2 rounded-full bg-white/85 px-4 text-sm font-black text-[#2563EB] shadow-sm ring-1 ring-blue-100" href={backHref}>
            <ArrowLeft className="h-4 w-4" />
            返回
          </Link>
          <div className="flex shrink-0 items-center gap-2">
            <CommunityNotificationButton />
            <CommunityProfileButton href={communityMeHref} label="我的社区" />
            <Link className="inline-flex h-9 items-center rounded-full bg-white/85 px-3 text-xs font-black text-[#2563EB] shadow-sm ring-1 ring-blue-100" href={getCommunitySelectionHref()}>
              切换
            </Link>
          </div>
        </div>

        <section className="mt-4 rounded-[28px] bg-[linear-gradient(135deg,rgba(219,234,254,0.92),rgba(255,228,240,0.82))] p-[18px] shadow-[0_14px_32px_rgba(15,76,129,0.10)] ring-1 ring-white/80">
          <p className="text-xs font-black text-[#2563EB]">Topic</p>
          <h1 className="mt-1 text-[26px] font-[850] leading-8 text-[#061a3a]">#{tag}</h1>
          <p className="mt-2 text-[13px] font-bold leading-5 text-[#40546f]">看看大家关于这个话题的分享</p>
          <p className="mt-3 inline-flex rounded-full bg-white/80 px-3 py-1 text-xs font-black text-[#1D4ED8] ring-1 ring-blue-100">共 {visiblePosts.length} 条内容</p>
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
            />
          ))}
        </section>

        {visiblePosts.length === 0 ? (
          <div className="mt-4">
            <CommunityEmptyState
              actionHref={getCommunityNewPostHref(locale)}
              actionLabel="发布这个话题"
              description="来发布第一条和这个话题相关的内容吧。"
              title="还没有相关内容"
            />
          </div>
        ) : null}

        <Link className="fixed bottom-24 right-5 z-40 inline-flex h-12 items-center gap-2 rounded-full bg-[linear-gradient(135deg,#2563eb,#38bdf8)] px-5 text-sm font-black text-white shadow-[0_16px_32px_rgba(37,99,235,0.28)]" href={getCommunityNewPostHref(locale)}>
          <Plus className="h-5 w-5" />
          发布内容
        </Link>
      </div>
    </main>
  );
}

function TopicPostCard({ likeActive, locale, onLike, post }: { likeActive: boolean; locale: CommunityViewLocale; onLike: () => void; post: CommunityPost }) {
  const author = post.authorName;
  return (
    <article className="overflow-hidden rounded-[22px] border border-white/80 bg-white/90 shadow-[0_12px_30px_rgba(37,99,235,0.09)] backdrop-blur">
      <Link className="block" href={getCommunityPostHref(post, locale)}>
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
        <AuthorLink author={author} post={post} />
        <div className="flex shrink-0 items-center gap-2 text-[11px] font-black text-slate-500">
          <button className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-1 ${likeActive ? "bg-pink-50 text-pink-600" : "bg-white text-slate-500"}`} onClick={onLike} type="button" aria-label="点赞">
            <Heart className={`h-3.5 w-3.5 ${likeActive ? "fill-current" : ""}`} />
            {post.likes + (likeActive ? 1 : 0)}
          </button>
          <span className="inline-flex items-center gap-0.5">
            <MessageCircle className="h-3.5 w-3.5" />
            {post.comments}
          </span>
        </div>
      </div>
    </article>
  );
}

function AuthorLink({ author, post }: { author: string; post: CommunityPost }) {
  const content = (
    <>
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-50 text-[#2563EB]">
        <UserRound className="h-3.5 w-3.5" />
      </span>
      <span className="truncate text-[11px] font-bold text-slate-600">{author}</span>
    </>
  );
  if (!post.authorId) {
    return <div className="flex min-w-0 items-center gap-1.5">{content}</div>;
  }
  return (
    <Link className="flex min-w-0 items-center gap-1.5 rounded-full pr-1 transition hover:bg-blue-50/70" href={getCommunityUserHref(post.authorId)}>
      {content}
    </Link>
  );
}

function getImageHeight(type: CommunityPostType) {
  if (type === "share") return 150;
  if (type === "secondhand") return 145;
  if (type === "help") return 110;
  if (type === "buddy") return 130;
  return 120;
}
