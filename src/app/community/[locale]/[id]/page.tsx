"use client";

import { ArrowLeft, Heart, MessageCircle, Send, UserRound } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import type { FormEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { CommunityLoginRequiredCard } from "@/components/community/CommunityLoginRequiredCard";
import { CommunityPostImageFrame, getPreviewColor } from "@/components/community/CommunityPostImageFrame";
import { CommunityErrorState } from "@/components/community/CommunityStates";
import { communityMockPosts } from "@/lib/community/mock";
import {
  addCommunityNotification,
  communityCurrentUserId,
  communityLikesStorageKey,
  communityLocalUserId,
  createCommunityComment,
  createCommunityId,
  createCommunityNotification,
  formatCommunityNow,
  getCurrentCommunityUser,
  getCommunityComments,
  getCommunityLikeIds,
  getCommunityPostById,
  getCommunityProfile,
  mergeCommunityPosts,
  readCommunityComments,
  readCommunityIdSet,
  readCommunityPosts,
  readCommunityUserProfile,
  readCommunityUsers,
  toggleCommunityLike,
  writeCommunityComments,
  writeCommunityIdSet,
  writeCommunityPosts,
  type CommunityUser,
} from "@/lib/community/repository";
import { getCommunityLocaleHref, getCommunityUserHref } from "@/lib/community/routes";
import { getCommunityTopicHref } from "@/lib/community/topics";
import { getCommunityPostTypeLabel, hasCommunityRiskKeyword, isCommunityViewLocale, type CommunityComment, type CommunityLocale, type CommunityPost, type CommunityPostImage, type CommunityPostType, type CommunityUserProfile, type CommunityViewLocale } from "@/lib/community/types";

const typeTone: Record<CommunityPostType, string> = {
  buddy: "bg-violet-50 text-violet-700 ring-violet-100",
  help: "bg-amber-50 text-amber-700 ring-amber-100",
  helper: "bg-blue-50 text-blue-700 ring-blue-100",
  secondhand: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  share: "bg-pink-50 text-pink-700 ring-pink-100",
};

export default function CommunityPostDetailPage() {
  const params = useParams<{ id: string; locale: string }>();
  const postId = params.id;
  const rawLocale = params.locale;
  const validViewLocale = isCommunityViewLocale(rawLocale);
  const viewLocale: CommunityViewLocale = validViewLocale ? rawLocale : "zh-cn";
  const storageFallbackLocale: CommunityLocale = viewLocale === "all" ? "zh-cn" : viewLocale;
  const backHref = validViewLocale ? getCommunityLocaleHref(viewLocale) : getCommunityLocaleHref("all");
  const commentSectionRef = useRef<HTMLElement | null>(null);
  const [activeImage, setActiveImage] = useState(0);
  const [comments, setComments] = useState<CommunityComment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [currentUser, setCurrentUser] = useState<CommunityUser | null>(null);
  const [likes, setLikes] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState("");
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [profileName, setProfileName] = useState("Nam");
  const [supabaseEnabled, setSupabaseEnabled] = useState(false);
  const [users, setUsers] = useState<CommunityUserProfile[]>([]);

  useEffect(() => {
    setPosts(readCommunityPosts(storageFallbackLocale));
    setComments(readCommunityComments());
    setLikes(readCommunityIdSet(communityLikesStorageKey));
    setProfileName(readCommunityUserProfile().displayName);
    setUsers(readCommunityUsers());
    let mounted = true;
    void getCurrentCommunityUser().then((user) => {
      if (!mounted) return;
      setCurrentUser(user);
      if (user) setProfileName(user.name);
    });
    void getCommunityPostById(postId, viewLocale).then((result) => {
      if (!mounted) return;
      if (result.source === "supabase") {
        setSupabaseEnabled(Boolean(result.data));
        setPosts(result.data ? [result.data] : []);
        if (result.data?.authorId) {
          void getCommunityProfile(result.data.authorId).then((profile) => {
            if (mounted && profile.data) setUsers((current) => [profile.data!, ...current.filter((user) => user.id !== profile.data!.id)]);
          });
        }
      }
    });
    void getCommunityComments(postId).then((result) => {
      if (mounted && result.source === "supabase") setComments(result.data);
    });
    void getCommunityLikeIds().then((result) => {
      if (mounted && result.source === "supabase") setLikes(result.data);
    });
    return () => {
      mounted = false;
    };
  }, [postId, storageFallbackLocale, viewLocale]);

  const allPosts = useMemo(() => supabaseEnabled ? posts : mergeCommunityPosts(posts, communityMockPosts), [posts, supabaseEnabled]);
  const post = validViewLocale ? allPosts.find((item) => item.id === postId && item.status === "published" && (viewLocale === "all" || item.communityLocale === viewLocale)) : null;
  const currentPostLocale = post?.communityLocale ?? storageFallbackLocale;
  const postComments = useMemo(
    () => comments
      .filter((comment) => comment.postId === postId && comment.status === "published")
      .sort((left, right) => parseCommunityTime(right.createdAt) - parseCommunityTime(left.createdAt)),
    [comments, postId],
  );

  async function handleLike() {
    if (!post) return;
    if (!currentUser) {
      setMessage("请先登录");
      return;
    }

    const wasActive = likes.has(postId);

    if (!supabaseEnabled) {
      const next = new Set(likes);
      if (wasActive) next.delete(postId);
      else next.add(postId);
      setLikes(next);
      writeCommunityIdSet(communityLikesStorageKey, next);
      if (!wasActive && post.authorId !== currentUser.id) {
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
    setPosts((items) => items.map((item) => item.id === postId ? {
      ...item,
      likeCount: result.data!.count,
      likes: result.data!.count,
    } : item));
  }

  async function submitComment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!commentText.trim()) return;
    if (!currentUser) {
      setMessage("请先登录");
      return;
    }
    const hasRisk = hasCommunityRiskKeyword(commentText.trim());
    if (supabaseEnabled) {
      const result = await createCommunityComment({
        authorId: currentUser.id,
        authorName: currentUser.name,
        communityLocale: currentPostLocale,
        content: commentText.trim(),
        isAnonymous: false,
        parentId: undefined,
        postId,
      });
      if (!result.data) {
        setMessage(result.error || "提交失败，请稍后再试。");
        return;
      }
      setComments((current) => [result.data!, ...current]);
      setPosts((items) => items.map((item) => item.id === postId ? { ...item, comments: item.comments + 1 } : item));
      setCommentText("");
      setMessage(hasRisk ? "评论已提交，等待审核后显示。" : "评论已发布。");
      return;
    }
    const nextComment: CommunityComment = {
      id: createCommunityId("community-comment"),
      communityLocale: currentPostLocale,
      authorId: currentUser.id || communityLocalUserId,
      authorName: currentUser.name || profileName,
      content: commentText.trim(),
      createdAt: formatCommunityNow(),
      isAnonymous: false,
      likeCount: 0,
      parentId: undefined,
      postId,
      reportCount: 0,
      status: hasRisk ? "reported" : "published",
    };
    const nextComments = [nextComment, ...comments].slice(0, 240);
    setComments(nextComments);
    writeCommunityComments(nextComments);
    patchStoredPost({ comments: (post?.comments ?? 0) + 1 });
    if (!hasRisk && post && post.authorId !== currentUser.id) {
      addCommunityNotification(createCommunityNotification({
        communityLocale: post.communityLocale,
        message: `${nextComment.authorName}：${commentText.trim()}`,
        postId: post.id,
        targetId: nextComment.id,
        targetType: "comment",
        title: "有人评论了你的帖子",
        type: "comment",
        userId: post.authorId || communityCurrentUserId,
      }));
    }
    setCommentText("");
    setMessage(hasRisk ? "评论已提交，等待审核后显示。" : "评论已发布。");
  }

  function patchStoredPost(patch: Partial<CommunityPost>) {
    if (!post) return;
    const stored = readCommunityPosts(currentPostLocale);
    const existsInStorage = stored.some((item) => item.id === post.id);
    const nextStored = existsInStorage
      ? stored.map((item) => item.id === post.id ? { ...item, ...patch } : item)
      : [{ ...post, ...patch }, ...stored];
    writeCommunityPosts(nextStored.slice(0, 120));
    setPosts(nextStored);
  }

  if (!post) {
    return (
      <main className="jl-tool-theme min-h-screen text-[#061a3a]">
        <div className="jl-tool-shell mx-auto min-h-screen w-full max-w-[430px] px-4 pb-32 pt-5">
          <Link className="inline-flex h-9 items-center gap-2 rounded-full bg-white/85 px-4 text-sm font-black text-[#2563EB] shadow-sm ring-1 ring-blue-100" href={backHref}>
            <ArrowLeft className="h-4 w-4" />
            返回
          </Link>
          <div className="mt-4">
            <CommunityErrorState actionHref={backHref} description="可能本地数据被清理，或者它不属于当前语言社区。" />
          </div>
        </div>
      </main>
    );
  }

  const author = users.find((user) => user.id === post.authorId);
  const totalComments = postComments.length;
  const liked = likes.has(postId);

  return (
    <main className="min-h-screen bg-white text-[#111827]">
      <div className="mx-auto min-h-screen w-full max-w-[430px] pb-[92px]">
        <header className="sticky top-0 z-40 flex h-[62px] items-center gap-3 border-b border-slate-100 bg-white/96 px-3 backdrop-blur">
          <Link className="flex h-10 w-8 shrink-0 items-center justify-center text-[#111827]" href={backHref} aria-label="返回">
            <ArrowLeft className="h-6 w-6" />
          </Link>
          <AuthorInline author={author} post={post} />
        </header>

        {message ? <p className="mx-4 mt-3 rounded-2xl bg-blue-50 px-4 py-3 text-xs font-black text-[#1D4ED8] ring-1 ring-blue-100">{message}</p> : null}

        <PostImageGallery activeImage={activeImage} onSelect={setActiveImage} post={post} />

        <section className="px-4 pb-5 pt-4">
          <h1 className="text-[20px] font-[900] leading-[28px] text-[#222] [overflow-wrap:anywhere]">{post.title}</h1>
          <p className="mt-3 whitespace-pre-wrap text-[15px] font-semibold leading-[26px] text-[#303030] [overflow-wrap:anywhere]">{post.content}</p>
          <TagLinks tags={post.tags} viewLocale={viewLocale} />
          <div className="mt-5 flex items-center justify-between border-b border-slate-100 pb-5 text-[13px] font-bold text-slate-400">
            <span>{post.createdAt || "刚刚"} {post.area}</span>
            <span className={`rounded-full px-2.5 py-1 text-[11px] font-black ring-1 ${typeTone[post.type]}`}>{getCommunityPostTypeLabel(post.type)}</span>
          </div>
        </section>

        <CommentsSection
          canComment={Boolean(currentUser)}
          commentText={commentText}
          comments={postComments}
          onCommentTextChange={setCommentText}
          onSubmit={submitComment}
          sectionRef={commentSectionRef}
          totalComments={totalComments}
        />
      </div>
      <BottomCommentBar
        canComment={Boolean(currentUser)}
        commentText={commentText}
        liked={liked}
        likeCount={post.likes + (liked ? 1 : 0)}
        onCommentTextChange={setCommentText}
        onLike={() => void handleLike()}
        onSubmit={submitComment}
        totalComments={totalComments}
      />
    </main>
  );
}

function PostImageGallery({ activeImage, onSelect, post }: { activeImage: number; onSelect: (index: number) => void; post: CommunityPost }) {
  const postImages = Array.isArray(post.images) ? post.images : [];
  const images = postImages.length ? postImages : [{ alt: post.title, id: "placeholder-main", previewColor: getPreviewColor(post.type), type: "placeholder" as const }];
  const mainImage = images[Math.min(activeImage, images.length - 1)];
  return (
    <section>
      <ImageFrame image={mainImage} large type={post.type} />
      {images.length > 1 ? (
        <div className="flex gap-2 overflow-x-auto px-4 py-3">
          {images.map((image, index) => (
            <button className={`h-16 w-16 shrink-0 overflow-hidden rounded-2xl ring-2 ${activeImage === index ? "ring-[#2563EB]" : "ring-transparent"}`} key={getImageKey(image, index)} onClick={() => onSelect(index)} type="button">
              <ImageFrame image={image} type={post.type} />
            </button>
          ))}
        </div>
      ) : null}
    </section>
  );
}

function ImageFrame({ image, large = false, type }: { image: CommunityPostImage; large?: boolean; type: CommunityPostType }) {
  return <CommunityPostImageFrame className={large ? "!h-[430px] !rounded-none" : "h-16 rounded-2xl"} image={image} large={large} showAlt={false} type={type} />;
}

function getImageKey(image: CommunityPostImage, index: number) {
  if (typeof image === "string") return `${image}-${index}`;
  if ("id" in image && image.id) return image.id;
  if ("path" in image && image.path) return image.path;
  return `community-image-${index}`;
}

function AuthorInline({ author, post }: { author?: CommunityUserProfile; post: CommunityPost }) {
  const avatarStyle = { background: author?.avatar ?? "linear-gradient(135deg,#60a5fa,#f9a8d4)" };
  const content = (
    <>
      <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full text-white shadow-sm" style={avatarStyle}>
        <UserRound className="h-5 w-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[16px] font-[900] text-[#222]">{post.authorName}</span>
      </span>
    </>
  );
  if (!post.authorId) {
    return <div className="flex min-w-0 flex-1 items-center gap-2.5">{content}</div>;
  }
  return (
    <Link className="flex min-w-0 flex-1 items-center gap-2.5" href={getCommunityUserHref(post.authorId)}>
      {content}
    </Link>
  );
}

function TagLinks({ tags, viewLocale }: { tags: string[]; viewLocale: CommunityViewLocale }) {
  if (tags.length === 0) return null;
  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {tags.map((tag) => (
        <Link className="rounded-full bg-[rgba(219,234,254,0.7)] px-3 py-1 text-xs font-black text-[#1D4ED8]" href={getCommunityTopicHref(tag, viewLocale)} key={tag}>
          #{tag}
        </Link>
      ))}
    </div>
  );
}

function CommentsSection({ canComment, commentText, comments, onCommentTextChange, onSubmit, sectionRef, totalComments }: { canComment: boolean; commentText: string; comments: CommunityComment[]; onCommentTextChange: (value: string) => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void; sectionRef: React.RefObject<HTMLElement | null>; totalComments: number }) {
  return (
    <section className="border-t border-slate-100 px-4 py-4" data-comment-section ref={sectionRef}>
      <div className="flex items-center justify-between">
        <h2 className="text-[16px] font-black text-[#222]">评论</h2>
        <span className="text-xs font-black text-slate-400">{totalComments}</span>
      </div>
      {canComment ? (
        <form className="mt-3 hidden gap-2" onSubmit={onSubmit}>
          <div className="flex gap-2">
            <input className="min-h-11 flex-1 rounded-full border border-slate-300/85 bg-white/90 px-4 text-sm font-bold outline-none focus:border-[#2563EB]" onChange={(event) => onCommentTextChange(event.target.value)} placeholder="说点什么吧..." value={commentText} />
            <button className="flex h-11 w-14 items-center justify-center rounded-full bg-[#2563EB] text-white disabled:bg-slate-300" disabled={!commentText.trim()} type="submit">
              <Send className="h-4 w-4" />
            </button>
          </div>
        </form>
      ) : (
        <div className="mt-3">
          <CommunityLoginRequiredCard description="登录后可以发布内容和留言。" />
        </div>
      )}
      <div className="mt-4 grid gap-3">
        {comments.length === 0 ? <p className="rounded-2xl bg-slate-50 p-3 text-xs font-bold text-slate-400">还没有评论。</p> : null}
        {comments.map((comment) => (
          <CommentItem
            comment={comment}
            key={comment.id}
          />
        ))}
      </div>
    </section>
  );
}

function CommentItem({ comment }: { comment: CommunityComment }) {
  return (
    <article className="py-2 text-sm font-bold leading-6 text-slate-700">
      <div className="flex gap-2">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500">
          <UserRound className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-black text-[#2563EB]">{comment.authorName} <span className="font-bold text-slate-400">/ {comment.createdAt}</span></p>
          <p className="mt-1 whitespace-pre-wrap">{comment.content}</p>
        </div>
      </div>
    </article>
  );
}

function BottomCommentBar({ canComment, commentText, liked, likeCount, onCommentTextChange, onLike, onSubmit, totalComments }: { canComment: boolean; commentText: string; liked: boolean; likeCount: number; onCommentTextChange: (value: string) => void; onLike: () => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void; totalComments: number }) {
  return (
    <section className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-100 bg-white/96 px-4 py-3 backdrop-blur">
      <div className="mx-auto flex max-w-[430px] items-center gap-3">
        {canComment ? (
          <form className="min-w-0 flex-1" onSubmit={onSubmit}>
            <label className="flex h-11 items-center gap-2 rounded-full bg-slate-100 px-4">
              <span className="text-lg text-slate-500">✎</span>
              <input className="min-w-0 flex-1 border-0 bg-transparent text-sm font-bold outline-none placeholder:text-slate-400" onChange={(event) => onCommentTextChange(event.target.value)} placeholder="说点什么..." value={commentText} />
              {commentText.trim() ? (
                <button className="text-xs font-black text-[#2563EB]" type="submit">发送</button>
              ) : null}
            </label>
          </form>
        ) : (
          <Link className="flex h-11 min-w-0 flex-1 items-center rounded-full bg-slate-100 px-4 text-sm font-bold text-slate-400" href={`/login?redirect=${encodeURIComponent(typeof window === "undefined" ? "/community/all" : window.location.pathname + window.location.search)}`}>
            说点什么...
          </Link>
        )}
        <button className={`flex shrink-0 items-center gap-1 text-sm font-black ${liked ? "text-pink-600" : "text-[#222]"}`} onClick={onLike} type="button" aria-label="点赞">
          <Heart className={`h-7 w-7 ${liked ? "fill-current" : ""}`} />
          {likeCount}
        </button>
        <button className="flex shrink-0 items-center gap-1 text-sm font-black text-[#222]" onClick={() => document.querySelector("[data-comment-section]")?.scrollIntoView({ behavior: "smooth", block: "start" })} type="button" aria-label="评论">
          <MessageCircle className="h-7 w-7" />
          {totalComments}
        </button>
      </div>
    </section>
  );
}

function parseCommunityTime(value: string) {
  const match = value.match(/^(\d{2})\/(\d{2})\s+(\d{2}):(\d{2})$/);
  if (!match) return 0;
  const [, month, day, hour, minute] = match;
  return new Date(2026, Number(month) - 1, Number(day), Number(hour), Number(minute)).getTime();
}
