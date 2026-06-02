"use client";

import { ArrowLeft, Heart, MessageCircle, Pencil, Share2, Smile, Star, UserRound } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import type { FormEvent, ReactNode, UIEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { CommunityPostImageFrame, getPreviewColor } from "@/components/community/CommunityPostImageFrame";
import { CommunityErrorState } from "@/components/community/CommunityStates";
import { isOwnAccountProfile, readMeProfile } from "@/lib/account/profile";
import { isCommunityLocalMode } from "@/lib/community/dataMode";
import {
  addCommunityNotification,
  communityFavoritesStorageKey,
  communityCurrentUserId,
  communityLikesStorageKey,
  communityLocalUserId,
  createCommunityComment,
  createCommunityId,
  createCommunityNotification,
  formatCommunityNow,
  getCurrentCommunityUser,
  getCommunityComments,
  getCommunityFavoriteIds,
  getCommunityLikeIds,
  getCommunityPostById,
  getCommunityProfile,
  readCommunityComments,
  readCommunityIdSet,
  readCommunityPosts,
  readCommunityUsers,
  toggleCommunityFavorite,
  toggleCommunityLike,
  updateCommunityPost,
  writeCommunityComments,
  writeCommunityIdSet,
  writeCommunityPosts,
  type CommunityUser,
} from "@/lib/community/repository";
import { getCommunityLocaleHref, getCommunityUserHref } from "@/lib/community/routes";
import { getCommunityTopicHref } from "@/lib/community/topics";
import { getCommunityPostTypeLabel, hasCommunityRiskKeyword, isCommunityViewLocale, type CommunityComment, type CommunityLocale, type CommunityPost, type CommunityPostImage, type CommunityPostType, type CommunityUserProfile, type CommunityViewLocale } from "@/lib/community/types";
import { withBackFrom } from "@/lib/navigation/back";

const typeTone: Record<CommunityPostType, string> = {
  buddy: "bg-violet-50 text-violet-700 ring-violet-100",
  help: "bg-amber-50 text-amber-700 ring-amber-100",
  helper: "bg-blue-50 text-blue-700 ring-blue-100",
  secondhand: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  share: "bg-pink-50 text-pink-700 ring-pink-100",
};

const communityCommentLikesStorageKey = "japan-life-community-comment-likes";

type CommunityAuthorAvatarProfile = Pick<CommunityUserProfile, "avatar" | "displayName" | "id">;

export default function CommunityPostDetailPage() {
  const params = useParams<{ id: string; locale: string }>();
  const postId = params.id;
  const rawLocale = params.locale;
  const validViewLocale = isCommunityViewLocale(rawLocale);
  const viewLocale: CommunityViewLocale = "all";
  const localMode = isCommunityLocalMode();
  const storageFallbackLocale: CommunityLocale = "zh-cn";
  const backHref = getCommunityLocaleHref("all");
  const loginHref = "/login?redirect=" + encodeURIComponent(`/community/all/${postId}`);
  const commentSectionRef = useRef<HTMLElement | null>(null);
  const [activeImage, setActiveImage] = useState(0);
  const [author, setAuthor] = useState<CommunityUserProfile | null>(null);
  const [comments, setComments] = useState<CommunityComment[]>([]);
  const [commentLikes, setCommentLikes] = useState<Set<string>>(new Set());
  const [commentAuthors, setCommentAuthors] = useState<Record<string, CommunityAuthorAvatarProfile>>({});
  const [commentText, setCommentText] = useState("");
  const [replyTarget, setReplyTarget] = useState<CommunityComment | null>(null);
  const [commentActionTarget, setCommentActionTarget] = useState<CommunityComment | null>(null);
  const [currentUser, setCurrentUser] = useState<CommunityUser | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [likes, setLikes] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState("");
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [supabaseEnabled, setSupabaseEnabled] = useState(false);

  useEffect(() => {
    setPosts(localMode ? readCommunityPosts(storageFallbackLocale) : []);
    setComments(localMode ? readCommunityComments() : []);
    setFavorites(localMode ? readCommunityIdSet(communityFavoritesStorageKey) : new Set());
    setLikes(localMode ? readCommunityIdSet(communityLikesStorageKey) : new Set());
    setCommentLikes(localMode ? readCommunityIdSet(communityCommentLikesStorageKey) : new Set());
    let mounted = true;

    void getCurrentCommunityUser().then((user) => {
      if (mounted) setCurrentUser(user);
    });

    void getCommunityPostById(postId, viewLocale).then((result) => {
      if (!mounted) return;
      if (result.source === "supabase") {
        setSupabaseEnabled(true);
        setPosts(result.data ? [result.data] : []);
        if (result.data?.authorId) {
          void getCommunityProfile(result.data.authorId).then((profile) => {
            if (mounted && profile.data) setAuthor(profile.data);
          });
        }
      }
    });

    void getCommunityComments(postId).then((result) => {
      if (!mounted) return;
      if (result.source === "supabase") setComments(result.data);
    });

    void getCommunityLikeIds().then((result) => {
      if (mounted && result.source === "supabase") setLikes(result.data);
    });

    void getCommunityFavoriteIds().then((result) => {
      if (mounted && result.source === "supabase") setFavorites(result.data);
    });

    return () => {
      mounted = false;
    };
  }, [localMode, postId, storageFallbackLocale, viewLocale]);

  const allPosts = useMemo(() => {
    const storedPosts = localMode ? readCommunityPosts(storageFallbackLocale) : [];
    const seen = new Set<string>();
    return [...posts, ...storedPosts].filter((item) => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });
  }, [localMode, posts, storageFallbackLocale]);
  const post = validViewLocale ? allPosts.find((item) => item.id === postId && item.status === "published") : null;
  const currentPostLocale = post?.communityLocale ?? storageFallbackLocale;
  const isOwnPost = Boolean(post && currentUser && isOwnAccountProfile(post.authorId, currentUser));
  const postComments = useMemo(
    () => comments
      .filter((comment) => comment.postId === postId && comment.status === "published")
      .sort((left, right) => parseCommunityTime(right.createdAt) - parseCommunityTime(left.createdAt)),
    [comments, postId],
  );
  const liked = likes.has(postId);
  const favorited = favorites.has(postId);

  useEffect(() => {
    const authorIds = Array.from(new Set(postComments.map((comment) => comment.authorId).filter(Boolean)));
    if (authorIds.length === 0) {
      setCommentAuthors({});
      return;
    }

    let mounted = true;
    const localProfiles = Object.fromEntries(
      authorIds
        .map((authorId) => {
          const profile = getLocalAuthorProfile(authorId, currentUser);
          return profile ? [authorId, profile] : null;
        })
        .filter((entry): entry is [string, CommunityAuthorAvatarProfile] => Boolean(entry)),
    );
    setCommentAuthors((current) => ({ ...current, ...localProfiles }));

    void Promise.all(
      authorIds
        .filter((authorId) => !localProfiles[authorId])
        .map(async (authorId) => {
          const result = await getCommunityProfile(authorId);
          return result.data ? [authorId, result.data] as const : null;
        }),
    ).then((entries) => {
      if (!mounted) return;
      const nextProfiles = Object.fromEntries(entries.filter((entry): entry is readonly [string, CommunityUserProfile] => Boolean(entry)));
      if (Object.keys(nextProfiles).length) setCommentAuthors((current) => ({ ...current, ...nextProfiles }));
    });

    return () => {
      mounted = false;
    };
  }, [currentUser, postComments]);

  async function handleLike() {
    if (!post) return;
    if (!currentUser) {
      setMessage("请先登录");
      return;
    }

    if (!supabaseEnabled && isCommunityLocalMode()) {
      const active = !likes.has(postId);
      const next = new Set(likes);
      if (active) next.add(postId);
      else next.delete(postId);
      setLikes(next);
      writeCommunityIdSet(communityLikesStorageKey, next);
      const nextCount = Math.max(0, post.likes + (active ? 1 : -1));
      patchStoredPost({ likes: nextCount, likeCount: nextCount });
      if (active && post.authorId !== currentUser.id) {
        addCommunityNotification(createCommunityNotification({
          communityLocale: post.communityLocale,
          message: "你的分享《" + post.title + "》收到新的点赞。",
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
    setPosts((items) => items.map((item) => item.id === postId ? { ...item, likeCount: result.data!.count, likes: result.data!.count } : item));
  }

  async function handleFavorite() {
    if (!post) return;
    if (!currentUser) {
      setMessage("请先登录");
      return;
    }

    if (!supabaseEnabled && isCommunityLocalMode()) {
      const active = !favorites.has(postId);
      const next = new Set(favorites);
      if (active) next.add(postId);
      else next.delete(postId);
      setFavorites(next);
      writeCommunityIdSet(communityFavoritesStorageKey, next);
      const nextCount = Math.max(0, Number(post.favoriteCount ?? post.favorites ?? 0) + (active ? 1 : -1));
      patchStoredPost({ favorites: nextCount, favoriteCount: nextCount });
      return;
    }

    const result = await toggleCommunityFavorite(postId, currentUser.id);
    if (!result.data) {
      setMessage(result.error || "收藏失败，请稍后再试。");
      return;
    }
    const next = new Set(favorites);
    if (result.data.active) next.add(postId);
    else next.delete(postId);
    setFavorites(next);
    setPosts((items) => items.map((item) => item.id === postId ? { ...item, favoriteCount: result.data!.count, favorites: result.data!.count } : item));
  }

  async function submitComment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const content = commentText.trim();
    if (!content || !post) return;
    if (!currentUser) {
      setMessage("请先登录");
      return;
    }
    const hasRisk = hasCommunityRiskKeyword(content);

    if (supabaseEnabled) {
      const result = await createCommunityComment({
        authorId: currentUser.id,
        authorName: currentUser.name,
        communityLocale: currentPostLocale,
        content,
        isAnonymous: false,
        parentId: replyTarget?.id,
        postId,
      });
      if (!result.data) {
        setMessage(result.error || "提交失败，请稍后再试。");
        return;
      }
      setComments((current) => [result.data!, ...current]);
      setPosts((items) => items.map((item) => item.id === postId ? { ...item, comments: item.comments + 1, commentCount: Number(item.commentCount ?? item.comments) + 1 } : item));
      setCommentText("");
      setReplyTarget(null);
      setMessage(hasRisk ? "评论已提交，等待审核后显示。" : "评论已发布。");
      return;
    }

    if (!isCommunityLocalMode()) {
      setMessage("社区数据暂时不可用，请稍后再试。");
      return;
    }

    const nextComment: CommunityComment = {
      id: createCommunityId("community-comment"),
      communityLocale: currentPostLocale,
      authorId: currentUser.id || communityLocalUserId,
      authorName: currentUser.name,
      content,
      createdAt: formatCommunityNow(),
      isAnonymous: false,
      likeCount: 0,
      parentId: replyTarget?.id,
      postId,
      reportCount: 0,
      status: hasRisk ? "reported" : "published",
    };
    const nextComments = [nextComment, ...comments].slice(0, 240);
    setComments(nextComments);
    writeCommunityComments(nextComments);
    patchStoredPost({ comments: (post.comments ?? 0) + 1, commentCount: Number(post.commentCount ?? post.comments) + 1 });
    if (!hasRisk && post.authorId !== currentUser.id) {
      addCommunityNotification(createCommunityNotification({
        communityLocale: post.communityLocale,
        message: nextComment.authorName + ": " + content,
        postId: post.id,
        targetId: nextComment.id,
        targetType: "comment",
        title: "有人评论了你的帖子",
        type: "comment",
        userId: post.authorId || communityCurrentUserId,
      }));
    }
    setCommentText("");
    setReplyTarget(null);
    setMessage(hasRisk ? "评论已提交，等待审核后显示。" : "评论已发布。");
  }


  function closeCommentActions() {
    setCommentActionTarget(null);
  }

  function deleteComment(comment: CommunityComment) {
    const nextComments = comments.map((item) => item.id === comment.id || item.parentId === comment.id ? { ...item, status: "deleted" as const } : item);
    setComments(nextComments);
    if (isCommunityLocalMode()) writeCommunityComments(nextComments);
    setMessage("评论已删除");
    closeCommentActions();
  }

  function handleCommentLike(commentId: string) {
    if (!currentUser) {
      setMessage("请先登录");
      return;
    }
    const wasActive = commentLikes.has(commentId);
    const next = new Set(commentLikes);
    if (wasActive) next.delete(commentId);
    else next.add(commentId);
    setCommentLikes(next);
    writeCommunityIdSet(communityCommentLikesStorageKey, next);
    setComments((items) => items.map((item) => item.id === commentId ? { ...item, likeCount: Math.max(0, Number(item.likeCount ?? 0) + (wasActive ? -1 : 1)) } : item));
  }

  function startCommentReply(comment: CommunityComment) {
    if (!currentUser) {
      setMessage("请先登录");
      return;
    }
    setReplyTarget(comment);
    setCommentText("");
    window.setTimeout(() => document.querySelector<HTMLInputElement>("[data-community-comment-input]")?.focus(), 60);
  }

  async function editOwnPost() {
    if (!post || !currentUser || !isOwnPost) return;
    const nextTitle = window.prompt("\u7f16\u8f91\u6807\u9898", post.title);
    if (nextTitle === null) return;
    const nextContent = window.prompt("\u7f16\u8f91\u5185\u5bb9", post.content);
    if (nextContent === null) return;
    const nextArea = window.prompt("\u7f16\u8f91\u5730\u533a", post.area);
    if (nextArea === null) return;
    const nextTagsText = window.prompt("\u7f16\u8f91\u6807\u7b7e\uff08\u7528\u7a7a\u683c\u5206\u9694\uff09", post.tags.join(" "));
    if (nextTagsText === null) return;

    const title = nextTitle.trim();
    const content = nextContent.trim();
    const area = nextArea.trim();
    const tags = nextTagsText.split(/[\s,，、]+/).map((tag) => tag.trim()).filter(Boolean).slice(0, 8);
    if (!title || !content || !area) {
      setMessage("\u6807\u9898\u3001\u5185\u5bb9\u548c\u5730\u533a\u4e0d\u80fd\u4e3a\u7a7a\u3002");
      return;
    }

    const result = await updateCommunityPost(post.id, { area, content, tags, title, updatedAt: formatCommunityNow() });
    if (!result.data) {
      setMessage(result.error || "\u4fdd\u5b58\u5931\u8d25\uff0c\u8bf7\u7a0d\u540e\u518d\u8bd5\u3002");
      return;
    }
    setPosts((items) => items.map((item) => item.id === post.id ? result.data! : item));
    patchStoredPost(result.data);
    setMessage("\u5e16\u5b50\u5df2\u66f4\u65b0\u3002");
  }

  async function sharePost() {
    if (!post || typeof window === "undefined") return;
    const url = window.location.href;
    const shareData = {
      text: post.content ? post.content.slice(0, 80) : "Japan Life 社区帖子",
      title: post.title || "Japan Life 社区",
      url,
    };
    const webNavigator = navigator as Navigator & { share?: (data: ShareData) => Promise<void> };
    if (webNavigator.share) {
      try {
        await webNavigator.share(shareData);
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }
    try {
      await navigator.clipboard?.writeText(url);
      setMessage("分享链接已复制");
    } catch {
      setMessage("暂时无法复制链接，请稍后再试。");
    }
  }

  function patchStoredPost(patch: Partial<CommunityPost>) {
    if (!post || !isCommunityLocalMode()) return;
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
            <CommunityErrorState actionHref={backHref} description={message || "这条内容可能已经删除，或社区数据暂时不可用。"} />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white text-[#111827]">
      <div className="mx-auto min-h-screen w-full max-w-[430px] pb-[92px]">
        <header className="sticky top-0 z-40 flex h-[62px] items-center gap-3 border-b border-slate-100 bg-white/96 px-3 backdrop-blur">
          <Link className="flex h-10 w-8 shrink-0 items-center justify-center text-[#111827]" href={backHref} aria-label="返回">
            <ArrowLeft className="h-6 w-6" />
          </Link>
          <div className="min-w-0 flex-1">
            <AuthorInline author={author ?? getLocalAuthorProfile(post.authorId, currentUser)} post={post} />
          </div>
          <button className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[#111827] transition active:scale-95 active:bg-slate-100" onClick={() => void sharePost()} type="button" aria-label="分享链接">
            <Share2 className="h-6 w-6 stroke-[2.2]" />
          </button>
        </header>

        {message ? <p className="mx-4 mt-3 rounded-2xl bg-blue-50 px-4 py-3 text-xs font-black text-[#1D4ED8] ring-1 ring-blue-100">{message}</p> : null}

        <PostImageGallery activeImage={activeImage} onSelect={setActiveImage} post={post} />

        <section className="px-4 pb-5 pt-4">
          <h1 className="text-[20px] font-[900] leading-[28px] text-[#222] [overflow-wrap:anywhere]">{post.title}</h1>
          <p className="mt-3 whitespace-pre-wrap text-[15px] font-semibold leading-[26px] text-[#303030] [overflow-wrap:anywhere]">{post.content}</p>
          <TagLinks tags={post.tags} viewLocale={viewLocale} />
          <div className="mt-5 flex items-center justify-between gap-3 border-b border-slate-100 pb-5 text-[13px] font-bold text-slate-400">
            <span>{post.createdAt || "刚刚"} {post.area}</span>
            <span className={"rounded-full px-2.5 py-1 text-[11px] font-black ring-1 " + typeTone[post.type]}>{getCommunityPostTypeLabel(post.type)}</span>
          </div>
        </section>

        <CommentsSection
          canComment={Boolean(currentUser)}
          commentAuthors={commentAuthors}
          commentLikes={commentLikes}
          commentText={commentText}
          comments={postComments}
          loginHref={withBackFrom(loginHref)}
          onCancelReply={() => setReplyTarget(null)}
          onCommentAction={setCommentActionTarget}
          onCommentLike={handleCommentLike}
          onCommentTextChange={setCommentText}
          onReply={startCommentReply}
          onSubmit={submitComment}
          replyTarget={replyTarget}
          sectionRef={commentSectionRef}
          totalComments={postComments.length}
        />
      </div>
      <BottomCommentBar
        canComment={Boolean(currentUser)}
        commentText={commentText}
        favoriteCount={Number(post.favoriteCount ?? post.favorites ?? 0)}
        favorited={favorited}
        isOwnPost={isOwnPost}
        liked={liked}
        likeCount={Number(post.likeCount ?? post.likes ?? 0)}
        loginHref={withBackFrom(loginHref)}
        onCommentTextChange={setCommentText}
        onEditPost={() => void editOwnPost()}
        onFavorite={() => void handleFavorite()}
        onLike={() => void handleLike()}
        onSubmit={submitComment}
        totalComments={postComments.length}
        replyTarget={replyTarget}
      />
      <CommentActionSheet
        comment={commentActionTarget}
        currentUserId={currentUser?.id ?? ""}
        isOwnPost={isOwnPost}
        onClose={closeCommentActions}
        onDelete={deleteComment}
        onReply={(comment) => { startCommentReply(comment); closeCommentActions(); }}
      />
    </main>
  );
}

function PostImageGallery({ activeImage, onSelect, post }: { activeImage: number; onSelect: (index: number) => void; post: CommunityPost }) {
  const galleryRef = useRef<HTMLDivElement | null>(null);
  const postImages = Array.isArray(post.images) ? post.images : [];
  const images = postImages.length ? postImages : [{ alt: post.title, id: "placeholder-main", previewColor: getPreviewColor(post.type), type: "placeholder" as const }];
  const activeIndex = Math.min(activeImage, images.length - 1);

  useEffect(() => {
    if (activeImage !== activeIndex) onSelect(activeIndex);
  }, [activeImage, activeIndex, onSelect]);

  function handleScroll(event: UIEvent<HTMLDivElement>) {
    const width = event.currentTarget.clientWidth;
    if (!width) return;
    const nextIndex = Math.min(images.length - 1, Math.max(0, Math.round(event.currentTarget.scrollLeft / width)));
    if (nextIndex !== activeImage) onSelect(nextIndex);
  }

  function showImage(index: number) {
    const nextIndex = Math.min(images.length - 1, Math.max(0, index));
    onSelect(nextIndex);
    galleryRef.current?.scrollTo({ behavior: "smooth", left: galleryRef.current.clientWidth * nextIndex });
  }

  return (
    <section className="relative bg-white">
      <div className="flex snap-x snap-mandatory overflow-x-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" data-community-image-gallery onScroll={handleScroll} ref={galleryRef}>
        {images.map((image, index) => (
          <div className="w-full shrink-0 snap-center" key={getImageKey(image, index)}>
            <ImageFrame image={image} large type={post.type} />
          </div>
        ))}
      </div>
      {images.length > 1 ? (
        <>
          <span className="absolute right-3 top-3 z-10 rounded-full bg-black/45 px-2.5 py-1 text-xs font-black leading-none text-white shadow-sm">{activeIndex + 1}/{images.length}</span>
          <div className="flex h-8 items-center justify-center gap-1.5 bg-white" data-community-image-dots>
          {images.map((image, index) => (
            <button className={(activeIndex === index ? "h-2 w-2 bg-rose-500" : "h-1.5 w-1.5 bg-slate-300") + " rounded-full transition-all"} key={"dot-" + getImageKey(image, index)} onClick={() => showImage(index)} type="button" aria-label={"查看第 " + (index + 1) + " 张图"} aria-current={activeIndex === index ? "true" : undefined}>
              <span className="sr-only">第 {index + 1} 张</span>
            </button>
          ))}
          </div>
        </>
      ) : null}
    </section>
  );
}

function ImageFrame({ image, large = false, type }: { image: CommunityPostImage; large?: boolean; type: CommunityPostType }) {
  return <CommunityPostImageFrame className={large ? "!h-[430px] !rounded-none" : "h-16 rounded-2xl"} image={image} large={large} showAlt={false} type={type} />;
}

function getImageKey(image: CommunityPostImage, index: number) {
  if (typeof image === "string") return image + "-" + index;
  if ("id" in image && image.id) return image.id;
  if ("path" in image && image.path) return image.path;
  return "community-image-" + index;
}

function AuthorInline({ author, post }: { author?: CommunityAuthorAvatarProfile; post: CommunityPost }) {
  const content = (
    <>
      <AuthorAvatar avatar={author?.avatar} name={post.authorName} sizeClass="h-9 w-9" iconClass="h-5 w-5" />
      <span className="min-w-0">
        <span className="block truncate text-[16px] font-[900] text-[#222]">{post.authorName}</span>
      </span>
    </>
  );
  if (!post.authorId) return <div className="inline-flex max-w-full items-center gap-2.5">{content}</div>;
  return (
    <Link className="inline-flex max-w-full items-center gap-2.5 rounded-full pr-1 transition active:scale-[0.98]" href={withBackFrom(getCommunityUserHref(post.authorId))}>
      {content}
    </Link>
  );
}

function AuthorAvatar({ avatar, iconClass, name, sizeClass }: { avatar?: string; iconClass: string; name: string; sizeClass: string }) {
  const imageAvatar = isImageAvatar(avatar || "");
  return (
    <span className={sizeClass + " flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-[linear-gradient(135deg,#60a5fa,#f9a8d4)] text-white shadow-sm"} style={avatar && !imageAvatar ? { background: avatar } : undefined}>
      {imageAvatar ? <img alt={name} className="h-full w-full object-cover" src={avatar} /> : <UserRound className={iconClass} />}
    </span>
  );
}

function isImageAvatar(value: string) {
  return value.startsWith("data:image") || value.startsWith("http") || value.startsWith("/");
}

function getLocalAuthorProfile(authorId: string, currentUser: CommunityUser | null): CommunityAuthorAvatarProfile | undefined {
  if (!authorId) return undefined;
  if (isOwnAccountProfile(authorId, currentUser)) {
    const profile = readMeProfile(currentUser);
    return { avatar: profile.avatar, displayName: profile.displayName, id: profile.publicId || authorId };
  }
  const profile = readCommunityUsers().find((user) => user.id === authorId || user.accountId === authorId);
  return profile ? { avatar: profile.avatar, displayName: profile.displayName, id: profile.id } : undefined;
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

function InlineCommentForm({ canComment, className = "", commentText, loginHref, onCancelReply, onCommentTextChange, onSubmit, replyTarget, variant = "section" }: { canComment: boolean; className?: string; commentText: string; loginHref: string; onCancelReply?: () => void; onCommentTextChange: (value: string) => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void; replyTarget: CommunityComment | null; variant?: "bottom" | "section" }) {
  if (!canComment) {
    return (
      <Link className={(variant === "bottom" ? "flex h-11 min-w-0 flex-1 items-center gap-2 rounded-full bg-[#f4f4f6] px-4 text-[15px] font-bold text-slate-500" : "flex h-11 items-center rounded-full bg-slate-50 px-4 text-sm font-bold text-slate-400 ring-1 ring-slate-100") + " " + className} href={loginHref}>
        <Pencil className="h-5 w-5 shrink-0" />
        说点什么...
      </Link>
    );
  }
  return (
    <form className={(variant === "bottom" ? "min-w-0 flex-1" : "rounded-[18px] bg-slate-50 p-3 ring-1 ring-slate-100") + " " + className} onSubmit={onSubmit}>
      {replyTarget && variant === "section" ? (
        <div className="mb-2 flex items-center justify-between gap-2 text-xs font-black text-slate-500">
          <span className="min-w-0 truncate">正在回复 @{replyTarget.authorName}</span>
          <button className="shrink-0 text-[#2563EB]" onClick={onCancelReply} type="button">取消</button>
        </div>
      ) : null}
      <label className={variant === "bottom" ? "flex h-11 min-w-0 items-center gap-2 rounded-full bg-[#f4f4f6] px-4 text-slate-500" : "flex min-h-11 items-center gap-2 rounded-full bg-white px-4 ring-1 ring-slate-100"}>
        <Pencil className="h-5 w-5 shrink-0 text-slate-500" />
        <input className="min-w-0 flex-1 border-0 bg-transparent text-[15px] font-bold outline-none placeholder:text-slate-500" data-community-comment-input onChange={(event) => onCommentTextChange(event.target.value)} placeholder={replyTarget ? "回复 @" + replyTarget.authorName : "说点什么..."} value={commentText} />
        {commentText.trim() ? <button className="shrink-0 text-xs font-black text-[#2563EB]" type="submit">发布</button> : null}
      </label>
    </form>
  );
}

function CommentsSection({ canComment, commentAuthors, commentLikes, commentText, comments, loginHref, onCancelReply, onCommentAction, onCommentLike, onCommentTextChange, onReply, onSubmit, replyTarget, sectionRef, totalComments }: { canComment: boolean; commentAuthors: Record<string, CommunityAuthorAvatarProfile>; commentLikes: Set<string>; commentText: string; comments: CommunityComment[]; loginHref: string; onCancelReply: () => void; onCommentAction: (comment: CommunityComment) => void; onCommentLike: (commentId: string) => void; onCommentTextChange: (value: string) => void; onReply: (comment: CommunityComment) => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void; replyTarget: CommunityComment | null; sectionRef: React.RefObject<HTMLElement | null>; totalComments: number }) {
  const commentIds = new Set(comments.map((comment) => comment.id));
  const rootComments = comments.filter((comment) => !comment.parentId || !commentIds.has(comment.parentId));
  const repliesByParent = new Map<string, CommunityComment[]>();
  comments.forEach((comment) => {
    if (!comment.parentId || !commentIds.has(comment.parentId)) return;
    const replies = repliesByParent.get(comment.parentId) ?? [];
    replies.push(comment);
    repliesByParent.set(comment.parentId, replies);
  });
  const renderComment = (comment: CommunityComment, compact = false): ReactNode => {
    const replies = repliesByParent.get(comment.id) ?? [];
    return (
      <div key={comment.id}>
        <CommentItem author={commentAuthors[comment.authorId]} comment={comment} compact={compact} liked={commentLikes.has(comment.id)} onAction={() => onCommentAction(comment)} onLike={() => onCommentLike(comment.id)} onReply={() => onReply(comment)} />
        {replies.length ? <div className={(compact ? "ml-10" : "ml-[52px]") + " mt-1 grid gap-1"}>{replies.map((reply) => renderComment(reply, true))}</div> : null}
      </div>
    );
  };
  return (
    <section className="border-t border-slate-100 px-4 py-4" data-comment-section ref={sectionRef}>
      <div className="flex items-center justify-between">
        <h2 className="text-[16px] font-black text-[#222]">评论 {totalComments}</h2>
        <span className="text-lg font-black leading-none text-slate-500">+</span>
      </div>
      <InlineCommentForm canComment={canComment} className="mt-3" commentText={commentText} loginHref={loginHref} onCancelReply={onCancelReply} onCommentTextChange={onCommentTextChange} onSubmit={onSubmit} replyTarget={replyTarget} />
      <div className="mt-4 grid gap-1">
        {comments.length === 0 ? <p className="rounded-2xl bg-slate-50 p-3 text-xs font-bold text-slate-400">暂无评论，来坐第一楼</p> : null}
        {rootComments.map((comment) => renderComment(comment))}
      </div>
    </section>
  );
}

function CommentItem({ author, comment, compact = false, liked, onAction, onLike, onReply }: { author?: CommunityAuthorAvatarProfile; comment: CommunityComment; compact?: boolean; liked: boolean; onAction: () => void; onLike: () => void; onReply: () => void }) {
  const timerRef = useRef<number | null>(null);
  const triggeredRef = useRef(false);
  const clearTimer = () => {
    if (timerRef.current === null) return;
    window.clearTimeout(timerRef.current);
    timerRef.current = null;
  };
  const openActions = () => {
    clearTimer();
    triggeredRef.current = true;
    onAction();
  };
  const reply = () => {
    if (triggeredRef.current) {
      triggeredRef.current = false;
      return;
    }
    onReply();
  };
  const count = Number(comment.likeCount ?? 0) + (liked ? 1 : 0);
  const profileHref = withBackFrom(getCommunityUserHref(author?.id || comment.authorId || communityLocalUserId));
  return (
    <article
      className={(compact ? "py-2" : "py-2.5") + " select-none text-sm leading-6 text-[#222]"}
      id={"comment-" + comment.id}
      onClick={reply}
      onContextMenu={(event) => { event.preventDefault(); openActions(); }}
      onPointerCancel={clearTimer}
      onPointerDown={(event) => { if (event.button !== 0) return; triggeredRef.current = false; timerRef.current = window.setTimeout(openActions, 520); }}
      onPointerLeave={clearTimer}
      onPointerUp={clearTimer}
    >
      <div className={(compact ? "gap-2" : "gap-3") + " flex items-start"}>
        <Link className="shrink-0 rounded-full transition active:scale-95" href={profileHref} onClick={(event) => event.stopPropagation()} onPointerDown={(event) => { event.stopPropagation(); clearTimer(); }} onPointerUp={(event) => event.stopPropagation()} aria-label={"查看 " + comment.authorName + " 的主页"}>
          <AuthorAvatar avatar={author?.avatar} name={comment.authorName} sizeClass={compact ? "h-8 w-8" : "h-10 w-10"} iconClass={compact ? "h-4 w-4" : "h-5 w-5"} />
        </Link>
        <div className="min-w-0 flex-1 pr-1">
          <Link className="inline-block max-w-full truncate text-[13px] font-black text-slate-500 transition active:text-[#2563EB]" href={profileHref} onClick={(event) => event.stopPropagation()} onPointerDown={(event) => { event.stopPropagation(); clearTimer(); }}>
            {comment.authorName}
          </Link>
          <p className={(compact ? "text-[14px]" : "text-[15px]") + " whitespace-pre-wrap font-black leading-6 text-[#222] [overflow-wrap:anywhere]"}>{comment.content}</p>
          <div className="mt-0.5 flex items-center gap-3 text-[12px] font-black text-slate-400">
            <span>{comment.createdAt}</span>
            <button className="transition active:text-[#2563EB]" onClick={(event) => { event.stopPropagation(); onReply(); }} onPointerDown={(event) => { event.stopPropagation(); clearTimer(); }} type="button">回复</button>
          </div>
        </div>
        <div className={(compact ? "pt-5" : "pt-7") + " flex shrink-0 items-start gap-4"}>
          <button className={(liked ? "text-pink-600" : "text-slate-500") + " flex min-w-7 shrink-0 flex-col items-center gap-0.5 text-[11px] font-black transition active:scale-95"} onClick={(event) => { event.stopPropagation(); onLike(); }} onPointerDown={(event) => { event.stopPropagation(); clearTimer(); }} type="button" aria-label="点赞评论">
            <Heart className={(liked ? "fill-current " : "") + "h-6 w-6 stroke-[1.9]"} />
            {count > 0 ? <span>{count}</span> : null}
          </button>
          <button className="flex min-w-7 shrink-0 flex-col items-center text-slate-500 transition active:scale-95 active:text-[#2563EB]" onClick={(event) => { event.stopPropagation(); onAction(); }} onPointerDown={(event) => { event.stopPropagation(); clearTimer(); }} type="button" aria-label="评论设置">
            <Smile className="h-6 w-6 stroke-[1.9]" />
          </button>
        </div>
      </div>
    </article>
  );
}

function CommentActionSheet({ comment, currentUserId, isOwnPost, onClose, onDelete, onReply }: { comment: CommunityComment | null; currentUserId: string; isOwnPost: boolean; onClose: () => void; onDelete: (comment: CommunityComment) => void; onReply: (comment: CommunityComment) => void }) {
  if (!comment) return null;
  const isOwnComment = Boolean(currentUserId && comment.authorId === currentUserId);
  const showDelete = isOwnPost || isOwnComment;
  return (
    <section className="fixed inset-0 z-[90] bg-black/45" role="dialog" aria-modal="true">
      <button className="absolute inset-0 h-full w-full" onClick={onClose} type="button" aria-label="关闭" />
      <div className="absolute inset-x-0 bottom-0 mx-auto w-full max-w-[430px] px-3 pb-4">
        <div className="mx-auto mb-2 h-1.5 w-11 rounded-full bg-white/70" />
        <div className="overflow-hidden rounded-[18px] bg-white shadow-[0_-18px_50px_rgba(15,23,42,0.24)]">
          {isOwnPost && !comment.parentId ? <ActionSheetButton label="置顶" onClick={onClose} /> : null}
          <ActionSheetButton label="回复" onClick={() => onReply(comment)} />
          <ActionSheetButton label="收藏" onClick={onClose} />
          <ActionSheetButton label="复制" onClick={() => { void navigator.clipboard?.writeText(comment.content); onClose(); }} />
          {!isOwnComment ? <ActionSheetButton label="私信" onClick={onClose} /> : null}
          {!isOwnComment ? <ActionSheetButton label="不喜欢" onClick={onClose} /> : null}
          {!isOwnComment ? <ActionSheetButton label="举报" onClick={onClose} /> : null}
          {showDelete ? <ActionSheetButton danger label="删除" onClick={() => onDelete(comment)} /> : null}
        </div>
        <button className="mt-2 h-12 w-full rounded-[18px] bg-white text-[15px] font-black text-[#222] shadow-[0_-8px_26px_rgba(15,23,42,0.12)]" onClick={onClose} type="button">取消</button>
      </div>
    </section>
  );
}

function ActionSheetButton({ danger = false, label, onClick }: { danger?: boolean; label: string; onClick: () => void }) {
  return <button className={(danger ? "text-red-600" : "text-[#222]") + " flex h-12 w-full items-center px-4 text-left text-[15px] font-black active:bg-slate-50"} onClick={onClick} type="button">{label}</button>;
}

function BottomCommentBar({ canComment, commentText, favoriteCount, favorited, isOwnPost, liked, likeCount, loginHref, onCommentTextChange, onEditPost, onFavorite, onLike, onSubmit, replyTarget, totalComments }: { canComment: boolean; commentText: string; favoriteCount: number; favorited: boolean; isOwnPost: boolean; liked: boolean; likeCount: number; loginHref: string; onCommentTextChange: (value: string) => void; onEditPost: () => void; onFavorite: () => void; onLike: () => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void; replyTarget: CommunityComment | null; totalComments: number }) {
  return (
    <section className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-100 bg-white/96 px-3 py-2.5 backdrop-blur">
      <div className={"mx-auto grid max-w-[430px] items-center gap-3 " + (isOwnPost ? "grid-cols-[auto_minmax(0,1fr)_auto_auto_auto]" : "grid-cols-[minmax(0,1fr)_auto_auto_auto]")}>
        {isOwnPost ? (
          <button className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#f4f4f6] text-[#2563EB] transition active:scale-95 active:bg-blue-50" onClick={onEditPost} type="button" aria-label="\u7f16\u8f91\u5e16\u5b50" title="\u7f16\u8f91\u5e16\u5b50">
            <Pencil className="h-5 w-5" />
          </button>
        ) : null}
        <InlineCommentForm canComment={canComment} commentText={commentText} loginHref={loginHref} onCommentTextChange={onCommentTextChange} onSubmit={onSubmit} replyTarget={replyTarget} variant="bottom" />
        <button className={"flex shrink-0 items-center gap-1 text-[15px] font-black " + (liked ? "text-pink-600" : "text-[#222]")} onClick={onLike} type="button" aria-label="点赞">
          <Heart className={"h-8 w-8 stroke-[1.8] " + (liked ? "fill-current" : "")} />
          {likeCount}
        </button>
        <button className={"flex shrink-0 items-center gap-1 text-[15px] font-black " + (favorited ? "text-amber-500" : "text-[#222]")} onClick={onFavorite} type="button" aria-label="收藏">
          <Star className={"h-8 w-8 stroke-[1.8] " + (favorited ? "fill-current" : "")} />
          {favoriteCount}
        </button>
        <button className="flex shrink-0 items-center gap-1 text-[15px] font-black text-[#222]" onClick={() => document.querySelector("[data-comment-section]")?.scrollIntoView({ behavior: "smooth", block: "start" })} type="button" aria-label="评论">
          <MessageCircle className="h-8 w-8 stroke-[1.8]" />
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
