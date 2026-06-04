"use client";

import { Edit3, Eye, Heart, MessageCircle, PackageCheck, Star, Trash2, XCircle } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { CommunityCurationBadges } from "@/components/community/CommunityCurationBadges";
import { CommunityLoginRequiredCard } from "@/components/community/CommunityLoginRequiredCard";
import { CommunityNotificationButton } from "@/components/community/CommunityNotificationButton";
import { CommunityPostImageFrame } from "@/components/community/CommunityPostImageFrame";
import { CommunityEmptyState } from "@/components/community/CommunityStates";
import { useLanguage } from "@/hooks/useLanguage";
import { clearCommunityPostPreloadCache } from "@/lib/appPreload";
import { CURRENT_USER_ID, CURRENT_USER_NAME, getCurrentCommunityUser, type CommunityUser } from "@/lib/community/currentUser";
import { communityReactionChangeEvent, dispatchCommunityPostChange, dispatchCommunityReactionChange } from "@/lib/community/reactionEvents";
import { getCommunityNewPostHref, getCommunityPostHref, getCommunitySelectionHref } from "@/lib/community/routes";
import {
  communityFavoritesStorageKey,
  communityLikesStorageKey,
  formatCommunityNow,
  getCommunityCommentsByAuthor,
  getCommunityFavoriteIds,
  getCommunityLikeIds,
  getCommunityPosts,
  mergeCommunityPosts,
  readCommunityComments,
  readCommunityIdSet,
  readCommunityPosts,
  softDeleteComment,
  toggleCommunityFavorite,
  toggleCommunityLike,
  updateCommunityPost,
  writeCommunityComments,
  writeCommunityPosts,
} from "@/lib/community/repository";
import {
  type CommunityComment,
  type CommunityCommentStatus,
  type CommunityPost,
  type CommunityPostStatus,
} from "@/lib/community/types";
import type { Language } from "@/lib/i18n/translations";

type MeTab = "posts" | "favorites" | "liked" | "comments";

const tabs: { id: MeTab; icon: typeof Heart }[] = [
  { id: "posts", icon: Star },
  { id: "favorites", icon: Heart },
  { id: "liked", icon: Heart },
  { id: "comments", icon: MessageCircle },
];

const communityMeCopy = {
  "zh-CN": {
    title: "我的社区",
    subtitle: "管理你的帖子、收藏和评论",
    switchCommunity: "切换",
    loading: "加载中...",
    loginRequired: "请先登录",
    submitFail: "提交失败，请稍后再试。",
    tabs: { comments: "我的评论", favorites: "我的收藏", liked: "我赞过", posts: "我的帖子" },
    empty: {
      comments: { description: "你还没有评论", title: "这里还没有内容" },
      favorites: { description: "你还没有收藏内容", title: "这里还没有内容" },
      liked: { description: "你还没有点赞内容", title: "这里还没有内容" },
      posts: { actionLabel: "去发布", description: "你还没有发布内容", title: "这里还没有内容" },
    },
    postStatus: { deleted: "已删除", hidden: "已隐藏", pending: "待审核", published: "已发布", reported: "被举报" },
    commentStatus: { deleted: "已删除", hidden: "已隐藏", published: "已发布", reported: "被举报" },
    postType: { buddy: "搭子", discount: "折扣福利", friend: "交友", secondhand: "闲置", share: "分享" },
    prompts: { area: "编辑地区", content: "编辑内容", tags: "编辑标签（用空格分隔）", title: "编辑标题" },
    messages: {
      commentDeleted: "评论已删除。",
      favoriteRemoved: "已取消收藏。",
      favoriteRestored: "已恢复收藏。",
      invalidPost: "标题、内容和地区不能为空。",
      likeRemoved: "已取消点赞。",
      likeRestored: "已恢复点赞。",
      postDeleted: "帖子已删除，前台不会再显示。",
      postSold: "已标记为已出。",
      postUpdated: "帖子已更新。",
    },
    labels: {
      comments: "评论",
      delete: "删除",
      deleteComment: "删除评论",
      edit: "编辑",
      favoriteTime: "收藏时间：本机收藏",
      favorites: "收藏",
      hiddenContent: "内容已不可见",
      likeTime: "点赞时间：本机点赞",
      likes: "点赞",
      postMaybeDeleted: "帖子可能已删除",
      publicHidden: "前台不可见",
      removeFavorite: "取消收藏",
      removeLike: "取消点赞",
      setSold: "设为已出",
      view: "查看",
      viewPost: "查看帖子",
    },
  },
  "zh-TW": {
    title: "我的社群",
    subtitle: "管理你的貼文、收藏和評論",
    switchCommunity: "切換",
    loading: "載入中...",
    loginRequired: "請先登入",
    submitFail: "提交失敗，請稍後再試。",
    tabs: { comments: "我的評論", favorites: "我的收藏", liked: "我按讚過", posts: "我的貼文" },
    empty: {
      comments: { description: "你還沒有評論", title: "這裡還沒有內容" },
      favorites: { description: "你還沒有收藏內容", title: "這裡還沒有內容" },
      liked: { description: "你還沒有按讚內容", title: "這裡還沒有內容" },
      posts: { actionLabel: "去發布", description: "你還沒有發布內容", title: "這裡還沒有內容" },
    },
    postStatus: { deleted: "已刪除", hidden: "已隱藏", pending: "待審核", published: "已發布", reported: "被檢舉" },
    commentStatus: { deleted: "已刪除", hidden: "已隱藏", published: "已發布", reported: "被檢舉" },
    postType: { buddy: "搭子", discount: "折扣福利", friend: "交友", secondhand: "閒置", share: "分享" },
    prompts: { area: "編輯地區", content: "編輯內容", tags: "編輯標籤（用空格分隔）", title: "編輯標題" },
    messages: {
      commentDeleted: "評論已刪除。",
      favoriteRemoved: "已取消收藏。",
      favoriteRestored: "已恢復收藏。",
      invalidPost: "標題、內容和地區不能為空。",
      likeRemoved: "已取消按讚。",
      likeRestored: "已恢復按讚。",
      postDeleted: "貼文已刪除，前台不會再顯示。",
      postSold: "已標記為已出。",
      postUpdated: "貼文已更新。",
    },
    labels: {
      comments: "評論",
      delete: "刪除",
      deleteComment: "刪除評論",
      edit: "編輯",
      favoriteTime: "收藏時間：本機收藏",
      favorites: "收藏",
      hiddenContent: "內容已不可見",
      likeTime: "按讚時間：本機按讚",
      likes: "按讚",
      postMaybeDeleted: "貼文可能已刪除",
      publicHidden: "前台不可見",
      removeFavorite: "取消收藏",
      removeLike: "取消按讚",
      setSold: "設為已出",
      view: "查看",
      viewPost: "查看貼文",
    },
  },
  ja: {
    title: "マイコミュニティ",
    subtitle: "自分の投稿、保存、コメントを管理します",
    switchCommunity: "切替",
    loading: "読み込み中...",
    loginRequired: "先にログインしてください",
    submitFail: "送信に失敗しました。しばらくしてからもう一度お試しください。",
    tabs: { comments: "自分のコメント", favorites: "保存", liked: "いいね済み", posts: "自分の投稿" },
    empty: {
      comments: { description: "まだコメントがありません", title: "まだ内容がありません" },
      favorites: { description: "まだ保存した内容がありません", title: "まだ内容がありません" },
      liked: { description: "まだいいねした内容がありません", title: "まだ内容がありません" },
      posts: { actionLabel: "投稿する", description: "まだ投稿がありません", title: "まだ内容がありません" },
    },
    postStatus: { deleted: "削除済み", hidden: "非表示", pending: "審査待ち", published: "公開済み", reported: "通報済み" },
    commentStatus: { deleted: "削除済み", hidden: "非表示", published: "公開済み", reported: "通報済み" },
    postType: { buddy: "仲間募集", discount: "割引・特典", friend: "友達募集", secondhand: "譲渡", share: "共有" },
    prompts: { area: "エリアを編集", content: "内容を編集", tags: "タグを編集（スペース区切り）", title: "タイトルを編集" },
    messages: {
      commentDeleted: "コメントを削除しました。",
      favoriteRemoved: "保存を解除しました。",
      favoriteRestored: "保存を復元しました。",
      invalidPost: "タイトル、内容、エリアは空にできません。",
      likeRemoved: "いいねを解除しました。",
      likeRestored: "いいねを復元しました。",
      postDeleted: "投稿を削除しました。公開画面には表示されません。",
      postSold: "譲渡済みにしました。",
      postUpdated: "投稿を更新しました。",
    },
    labels: {
      comments: "コメント",
      delete: "削除",
      deleteComment: "コメントを削除",
      edit: "編集",
      favoriteTime: "保存日時：この端末で保存",
      favorites: "保存",
      hiddenContent: "内容は表示できません",
      likeTime: "いいね日時：この端末でいいね",
      likes: "いいね",
      postMaybeDeleted: "投稿は削除された可能性があります",
      publicHidden: "公開画面では非表示",
      removeFavorite: "保存を解除",
      removeLike: "いいねを解除",
      setSold: "譲渡済みにする",
      view: "表示",
      viewPost: "投稿を見る",
    },
  },
} as const;

type CommunityMeText = (typeof communityMeCopy)[Language];

export default function CommunityMePage() {
  const { language } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const text = communityMeCopy[language];
  const [activeTab, setActiveTab] = useState<MeTab>("posts");
  const [comments, setComments] = useState<CommunityComment[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [likeIds, setLikeIds] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState("");
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [currentUserId, setCurrentUserId] = useState(CURRENT_USER_ID);
  const [currentUser, setCurrentUser] = useState<CommunityUser | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  const refreshCommunityData = useCallback(async (isMounted: () => boolean = () => true) => {
    setPosts(readCommunityPosts());
    setFavoriteIds(readCommunityIdSet(communityFavoritesStorageKey));
    setLikeIds(readCommunityIdSet(communityLikesStorageKey));
    setComments(readCommunityComments());
    const user = await getCurrentCommunityUser();
    if (!isMounted()) return;
    setCurrentUser(user);
    setAuthChecked(true);
    if (!user) return;
    setCurrentUserId(user.id);
    const [myPostResult, publicPostResult, favoriteResult, likeResult, commentResult] = await Promise.all([
      getCommunityPosts({ authorId: user.id, includeAllStatuses: true }),
      getCommunityPosts(),
      getCommunityFavoriteIds(user.id),
      getCommunityLikeIds(user.id),
      getCommunityCommentsByAuthor(user.id, true),
    ]);
    if (!isMounted()) return;
    if (myPostResult.source === "supabase" || publicPostResult.source === "supabase") {
      setPosts(mergeCommunityPosts(myPostResult.data, publicPostResult.data));
    }
    if (favoriteResult.source === "supabase") setFavoriteIds(favoriteResult.data);
    if (likeResult.source === "supabase") setLikeIds(likeResult.data);
    if (commentResult.source === "supabase") setComments(commentResult.data);
  }, []);

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (isMeTab(tab)) setActiveTab(tab);
  }, [searchParams]);

  const selectTab = useCallback((tab: MeTab) => {
    setActiveTab(tab);
    const nextParams = new URLSearchParams(searchParams.toString());
    if (tab === "posts") nextParams.delete("tab");
    else nextParams.set("tab", tab);
    const query = nextParams.toString();
    router.replace(query ? `/community/me?${query}` : "/community/me", { scroll: false });
  }, [router, searchParams]);

  useEffect(() => {
    let mounted = true;
    void refreshCommunityData(() => mounted);
    return () => {
      mounted = false;
    };
  }, [refreshCommunityData]);

  useEffect(() => {
    const refresh = () => void refreshCommunityData();
    window.addEventListener(communityReactionChangeEvent, refresh);
    window.addEventListener("focus", refresh);
    window.addEventListener("pageshow", refresh);
    return () => {
      window.removeEventListener(communityReactionChangeEvent, refresh);
      window.removeEventListener("focus", refresh);
      window.removeEventListener("pageshow", refresh);
    };
  }, [refreshCommunityData]);

  const allPosts = useMemo(
    () => posts
      .sort((left, right) => parseCommunityTime(right.createdAt) - parseCommunityTime(left.createdAt)),
    [posts],
  );

  const myPosts = useMemo(
    () => allPosts.filter((post) => post.authorId === currentUserId),
    [allPosts, currentUserId],
  );

  const favoritePosts = useMemo(
    () => allPosts.filter((post) => favoriteIds.has(post.id)),
    [allPosts, favoriteIds],
  );

  const likedPosts = useMemo(
    () => allPosts.filter((post) => likeIds.has(post.id)),
    [allPosts, likeIds],
  );

  const myComments = useMemo(
    () => comments
      .filter((comment) => comment.authorId === currentUserId)
      .sort((left, right) => parseCommunityTime(right.createdAt) - parseCommunityTime(left.createdAt)),
    [comments, currentUserId],
  );

  async function patchPost(postId: string, patch: Partial<CommunityPost>, nextMessage: string) {
    if (!currentUser) {
      setMessage(text.loginRequired);
      return;
    }
    const result = await updateCommunityPost(postId, patch);
    if (result.source === "supabase") {
      if (result.error || !result.data) {
        setMessage(result.error || text.submitFail);
        return;
      }
      clearCommunityPostPreloadCache(postId);
      dispatchCommunityPostChange({ post: result.data, postId, status: result.data.status });
      setPosts((items) => result.data!.status === "deleted" ? items.filter((post) => post.id !== postId) : mergeCommunityPosts([result.data!], items));
      setMessage(nextMessage);
      return;
    }
    const currentPost = allPosts.find((post) => post.id === postId);
    if (!currentPost) return;
    const nextPost = { ...currentPost, ...patch };
    const storedPosts = readCommunityPosts();
    const nextPosts = storedPosts.some((post) => post.id === postId)
      ? storedPosts.map((post) => post.id === postId ? { ...post, ...patch } : post)
      : [nextPost, ...storedPosts];
    writeCommunityPosts(nextPosts);
    clearCommunityPostPreloadCache(postId);
    dispatchCommunityPostChange({ post: nextPost, postId, status: nextPost.status });
    setPosts(nextPost.status === "deleted" ? nextPosts.filter((post) => post.id !== postId) : nextPosts);
    setMessage(nextMessage);
  }

  async function editPost(post: CommunityPost) {
    if (!currentUser) {
      setMessage(text.loginRequired);
      return;
    }
    const nextTitle = window.prompt(text.prompts.title, post.title);
    if (nextTitle === null) return;
    const nextContent = window.prompt(text.prompts.content, post.content);
    if (nextContent === null) return;
    const nextArea = window.prompt(text.prompts.area, post.area);
    if (nextArea === null) return;
    const nextTagsText = window.prompt(text.prompts.tags, post.tags.join(" "));
    if (nextTagsText === null) return;

    const title = nextTitle.trim();
    const content = nextContent.trim();
    const area = nextArea.trim();
    const tags = nextTagsText.replace(/[，、]/g, " ").split(/[,\s]+/).map((tag) => tag.trim()).filter(Boolean).slice(0, 8);
    if (!title || !content || !area) {
      setMessage(text.messages.invalidPost);
      return;
    }

    await patchPost(post.id, { area, content, tags, title, updatedAt: formatCommunityNow() }, text.messages.postUpdated);
  }

  async function removeFavorite(postId: string) {
    if (!currentUser) {
      setMessage(text.loginRequired);
      return;
    }
    const result = await toggleCommunityFavorite(postId, currentUser.id);
    if (result.error || !result.data) {
      setMessage(result.error || text.submitFail);
      return;
    }
    const nextFavorites = new Set(favoriteIds);
    if (result.data.active) nextFavorites.add(postId);
    else nextFavorites.delete(postId);
    setFavoriteIds(nextFavorites);
    setPosts((items) => items.map((post) => post.id === postId ? {
      ...post,
      favoriteCount: result.data!.count,
      favorites: result.data!.count,
    } : post));
    dispatchCommunityReactionChange({ active: result.data.active, count: result.data.count, postId, type: "favorite" });
    setMessage(result.data.active ? text.messages.favoriteRestored : text.messages.favoriteRemoved);
  }

  async function removeLike(postId: string) {
    if (!currentUser) {
      setMessage(text.loginRequired);
      return;
    }
    const result = await toggleCommunityLike(postId, currentUser.id);
    if (result.error || !result.data) {
      setMessage(result.error || text.submitFail);
      return;
    }
    const nextLikes = new Set(likeIds);
    if (result.data.active) nextLikes.add(postId);
    else nextLikes.delete(postId);
    setLikeIds(nextLikes);
    setPosts((items) => items.map((post) => post.id === postId ? {
      ...post,
      likeCount: result.data!.count,
      likes: result.data!.count,
    } : post));
    dispatchCommunityReactionChange({ active: result.data.active, count: result.data.count, postId, type: "like" });
    setMessage(result.data.active ? text.messages.likeRestored : text.messages.likeRemoved);
  }

  async function deleteComment(commentId: string) {
    if (!currentUser) {
      setMessage(text.loginRequired);
      return;
    }
    const result = await softDeleteComment(commentId);
    if (result.source === "supabase") {
      if (result.error || !result.data) {
        setMessage(result.error || text.submitFail);
        return;
      }
      setComments((items) => items.map((comment) => comment.id === commentId ? { ...comment, status: "deleted" as const } : comment));
      setMessage(text.messages.commentDeleted);
      return;
    }
    const nextComments = comments.map((comment) => comment.id === commentId ? { ...comment, status: "deleted" as const } : comment);
    setComments(nextComments);
    writeCommunityComments(nextComments);
    setMessage(text.messages.commentDeleted);
  }

  if (!authChecked) {
    return (
      <main className="jl-tool-theme min-h-screen text-[#061a3a]">
        <div className="jl-tool-shell mx-auto min-h-screen w-full max-w-[430px] px-4 pb-[110px] pt-4">
          <div className="rounded-[24px] border border-white/80 bg-white/86 p-4 text-sm font-black text-[#2563EB] shadow-[0_12px_28px_rgba(15,76,129,0.08)]">{text.loading}</div>
        </div>
      </main>
    );
  }

  if (!currentUser) {
    return (
      <main className="jl-tool-theme min-h-screen text-[#061a3a]">
        <div className="jl-tool-shell mx-auto min-h-screen w-full max-w-[430px] px-4 pb-[110px] pt-4">
          <CommunityLoginRequiredCard />
        </div>
      </main>
    );
  }

  return (
    <main className="jl-tool-theme min-h-screen text-[#061a3a]">
      <div className="jl-tool-shell mx-auto min-h-screen w-full max-w-[430px] px-4 pb-[110px] pt-4">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-lg font-[850] leading-7 text-[#061a3a]">{text.title}</p>
            <p className="text-[11px] font-bold text-[#64748b]">{currentUser?.name ?? CURRENT_USER_NAME}</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <CommunityNotificationButton />
            <Link className="inline-flex h-9 items-center rounded-full bg-white/85 px-3 text-xs font-black text-[#2563EB] shadow-sm ring-1 ring-blue-100" href={getCommunitySelectionHref()}>
              {text.switchCommunity}
            </Link>
          </div>
        </div>

        <section className="mt-4 rounded-[30px] bg-white/85 p-5 shadow-[0_18px_40px_rgba(37,99,235,0.12)] ring-1 ring-white/80 backdrop-blur">
          <p className="text-xs font-black text-[#2563EB]">My Community</p>
          <h1 className="mt-1 text-[26px] font-[850] leading-8 text-[#061a3a]">{text.title}</h1>
          <p className="mt-2 text-[13px] font-bold leading-5 text-[#40546f]">{text.subtitle}</p>
        </section>

        {message ? <p className="mt-4 rounded-2xl bg-blue-50 px-4 py-3 text-xs font-black text-[#1D4ED8] ring-1 ring-blue-100">{message}</p> : null}

        <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const href = tab.id === "posts" ? "/community/me" : `/community/me?tab=${tab.id}`;
            return (
              <Link
                className={`inline-flex h-[34px] shrink-0 items-center gap-1.5 rounded-full px-[14px] text-[13px] font-extrabold ${activeTab === tab.id ? "bg-[linear-gradient(135deg,#2563eb,#38bdf8)] text-white shadow-[0_10px_22px_rgba(37,99,235,0.22)]" : "bg-white/80 text-[#40546f] ring-1 ring-blue-100"}`}
                href={href}
                key={tab.id}
                onClick={(event) => { event.preventDefault(); selectTab(tab.id); }}
              >
                <Icon className="h-4 w-4" />
                {text.tabs[tab.id]}
              </Link>
            );
          })}
        </div>

        <section className="mt-4 grid gap-3">
          {activeTab === "posts" ? (
            <PostList
              empty={{ ...text.empty.posts, actionHref: getCommunityNewPostHref("all") }}
              labels={text.labels}
              postStatusLabels={text.postStatus}
              postTypeLabels={text.postType}
              onDelete={(post) => void patchPost(post.id, { status: "deleted" }, text.messages.postDeleted)}
              onEdit={(post) => void editPost(post)}
              onMarkSold={(post) => void patchPost(post.id, { itemStatus: "已出" }, text.messages.postSold)}
              language={language}
              posts={myPosts}
            />
          ) : null}
          {activeTab === "favorites" ? (
            <FavoriteList empty={text.empty.favorites} labels={text.labels} language={language} postTypeLabels={text.postType} onRemove={(postId) => void removeFavorite(postId)} posts={favoritePosts} />
          ) : null}
          {activeTab === "liked" ? (
            <LikedList empty={text.empty.liked} labels={text.labels} language={language} postTypeLabels={text.postType} onRemove={(postId) => void removeLike(postId)} posts={likedPosts} />
          ) : null}
          {activeTab === "comments" ? (
            <CommentList commentStatusLabels={text.commentStatus} comments={myComments} empty={text.empty.comments} labels={text.labels} onDelete={(commentId) => void deleteComment(commentId)} posts={allPosts} />
          ) : null}
        </section>
      </div>
    </main>
  );
}

function PostList({
  empty,
  labels,
  onDelete,
  onEdit,
  onMarkSold,
  postStatusLabels,
  postTypeLabels,
  language,
  posts,
}: {
  empty: { actionHref?: string; actionLabel?: string; description: string; title: string };
  labels: CommunityMeText["labels"];
  language: Language;
  onDelete: (post: CommunityPost) => void;
  onEdit: (post: CommunityPost) => void;
  onMarkSold: (post: CommunityPost) => void;
  postStatusLabels: CommunityMeText["postStatus"];
  postTypeLabels: CommunityMeText["postType"];
  posts: CommunityPost[];
}) {
  if (posts.length === 0) return <EmptyState {...empty} />;
  return posts.map((post) => (
    <PostManageCard
      key={post.id}
      labels={labels}
      onDelete={() => onDelete(post)}
      onEdit={() => onEdit(post)}
      onMarkSold={() => onMarkSold(post)}
      post={post}
      postStatusLabels={postStatusLabels}
      postTypeLabels={postTypeLabels}
      language={language}
    />
  ));
}

function PostManageCard({
  labels,
  onDelete,
  onEdit,
  onMarkSold,
  post,
  postStatusLabels,
  postTypeLabels,
  language,
}: {
  labels: CommunityMeText["labels"];
  language: Language;
  onDelete: () => void;
  onEdit: () => void;
  onMarkSold: () => void;
  post: CommunityPost;
  postStatusLabels: CommunityMeText["postStatus"];
  postTypeLabels: CommunityMeText["postType"];
}) {
  return (
    <article className="rounded-[24px] border border-white/80 bg-white/85 p-[14px] shadow-[0_12px_28px_rgba(15,76,129,0.08)]">
      <PostCardHeader language={language} post={post} />
      <div className="mt-3 flex flex-wrap gap-1.5">
        <Badge>{postTypeLabels[post.type]}</Badge>
        <Badge>{post.area}</Badge>
        <Badge>{post.createdAt}</Badge>
        <StatusBadge status={post.status}>{postStatusLabels[post.status]}</StatusBadge>
        {post.itemStatus ? <Badge tone="green">{post.itemStatus}</Badge> : null}
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2 text-center text-[11px] font-black text-slate-500">
        <StatMini label={labels.likes} value={post.likes} />
        <StatMini label={labels.comments} value={post.comments} />
        <StatMini label={labels.favorites} value={post.favorites} />
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {post.status === "published" ? <ActionLink href={getCommunityPostHref(post, "all")} icon={<Eye className="h-3.5 w-3.5" />} label={labels.view} /> : <ActionPill disabled icon={<Eye className="h-3.5 w-3.5" />} label={labels.publicHidden} />}
        <ActionPill icon={<Edit3 className="h-3.5 w-3.5" />} label={labels.edit} onClick={onEdit} />
        {post.type === "secondhand" && post.itemStatus !== "已出" ? <ActionPill icon={<PackageCheck className="h-3.5 w-3.5" />} label={labels.setSold} onClick={onMarkSold} tone="green" /> : null}
        {post.status !== "deleted" ? <ActionPill icon={<Trash2 className="h-3.5 w-3.5" />} label={labels.delete} onClick={onDelete} tone="red" /> : null}
      </div>
    </article>
  );
}

function FavoriteList({ empty, labels, language, onRemove, posts, postTypeLabels }: { empty: { description: string; title: string }; labels: CommunityMeText["labels"]; language: Language; onRemove: (postId: string) => void; posts: CommunityPost[]; postTypeLabels: CommunityMeText["postType"] }) {
  if (posts.length === 0) return <EmptyState {...empty} />;
  return posts.map((post) => {
    const hidden = post.status === "hidden" || post.status === "deleted";
    return (
      <article className={`rounded-[24px] border p-[14px] shadow-[0_12px_28px_rgba(15,76,129,0.08)] ${hidden ? "border-slate-200 bg-slate-50/90 text-slate-500" : "border-white/80 bg-white/85"}`} key={post.id}>
        <PostCardHeader language={language} post={post} muted={hidden} />
        <div className="mt-3 flex flex-wrap gap-1.5">
          <Badge>{postTypeLabels[post.type]}</Badge>
          <Badge>{post.authorName}</Badge>
          <Badge>{post.area}</Badge>
          <Badge>{labels.favoriteTime}</Badge>
          {hidden ? <StatusBadge status={post.status}>{labels.hiddenContent}</StatusBadge> : null}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {!hidden ? <ActionLink href={getCommunityPostHref(post, "all")} icon={<Eye className="h-3.5 w-3.5" />} label={labels.view} /> : null}
          <ActionPill icon={<XCircle className="h-3.5 w-3.5" />} label={labels.removeFavorite} onClick={() => onRemove(post.id)} tone="red" />
        </div>
      </article>
    );
  });
}

function LikedList({ empty, labels, language, onRemove, posts, postTypeLabels }: { empty: { description: string; title: string }; labels: CommunityMeText["labels"]; language: Language; onRemove: (postId: string) => void; posts: CommunityPost[]; postTypeLabels: CommunityMeText["postType"] }) {
  if (posts.length === 0) return <EmptyState {...empty} />;
  return posts.map((post) => {
    const hidden = post.status === "hidden" || post.status === "deleted";
    return (
      <article className={`rounded-[24px] border p-[14px] shadow-[0_12px_28px_rgba(15,76,129,0.08)] ${hidden ? "border-slate-200 bg-slate-50/90 text-slate-500" : "border-white/80 bg-white/85"}`} key={post.id}>
        <PostCardHeader language={language} post={post} muted={hidden} />
        <div className="mt-3 flex flex-wrap gap-1.5">
          <Badge>{postTypeLabels[post.type]}</Badge>
          <Badge>{post.authorName}</Badge>
          <Badge>{post.area}</Badge>
          <Badge>{labels.likeTime}</Badge>
          {hidden ? <StatusBadge status={post.status}>{labels.hiddenContent}</StatusBadge> : null}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {!hidden ? <ActionLink href={getCommunityPostHref(post, "all")} icon={<Eye className="h-3.5 w-3.5" />} label={labels.view} /> : null}
          <ActionPill icon={<XCircle className="h-3.5 w-3.5" />} label={labels.removeLike} onClick={() => onRemove(post.id)} tone="red" />
        </div>
      </article>
    );
  });
}

function CommentList({ commentStatusLabels, comments, empty, labels, onDelete, posts }: { commentStatusLabels: CommunityMeText["commentStatus"]; comments: CommunityComment[]; empty: { description: string; title: string }; labels: CommunityMeText["labels"]; onDelete: (commentId: string) => void; posts: CommunityPost[] }) {
  if (comments.length === 0) return <EmptyState {...empty} />;
  return comments.map((comment) => {
    const post = posts.find((item) => item.id === comment.postId);
    return (
      <article className="rounded-[24px] border border-white/80 bg-white/85 p-[14px] shadow-[0_12px_28px_rgba(15,76,129,0.08)]" key={comment.id}>
        <p className="whitespace-pre-wrap text-sm font-bold leading-6 text-slate-700">{comment.content}</p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          <Badge>{post?.title ?? labels.postMaybeDeleted}</Badge>
          <Badge>{comment.createdAt}</Badge>
          <StatusBadge status={comment.status}>{commentStatusLabels[comment.status]}</StatusBadge>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {post?.status === "published" ? <ActionLink href={getCommunityPostHref(post, "all")} icon={<Eye className="h-3.5 w-3.5" />} label={labels.viewPost} /> : null}
          {comment.status !== "deleted" ? <ActionPill icon={<Trash2 className="h-3.5 w-3.5" />} label={labels.deleteComment} onClick={() => onDelete(comment.id)} tone="red" /> : null}
        </div>
      </article>
    );
  });
}

function PostCardHeader({ language, muted = false, post }: { language: Language; muted?: boolean; post: CommunityPost }) {
  return (
    <div className="grid grid-cols-[92px_minmax(0,1fr)] gap-3">
      <div className="h-[92px] overflow-hidden rounded-[18px]">
        <CommunityPostImageFrame image={post.images?.[0]} type={post.type} />
      </div>
      <div className="min-w-0">
        <h2 className={`line-clamp-2 text-base font-black leading-6 ${muted ? "text-slate-500" : "text-[#061a3a]"}`}>{post.title}</h2>
        <p className="mt-1 line-clamp-2 text-xs font-bold leading-5 text-slate-600">{post.content}</p>
        <div className="mt-2">
          <CommunityCurationBadges locale={language === "ja" ? "ja" : "all"} post={post} />
        </div>
      </div>
    </div>
  );
}

function EmptyState({ actionHref, actionLabel, description, title }: { actionHref?: string; actionLabel?: string; description: string; title: string }) {
  return <CommunityEmptyState actionHref={actionHref} actionLabel={actionLabel} description={description} title={title} />;
}

function Badge({ children, tone = "blue" }: { children: React.ReactNode; tone?: "blue" | "green" }) {
  const toneClass = tone === "green" ? "bg-emerald-50 text-emerald-700 ring-emerald-100" : "bg-blue-50 text-[#1D4ED8] ring-blue-100";
  return <span className={`rounded-full px-2.5 py-1 text-[11px] font-black ring-1 ${toneClass}`}>{children}</span>;
}

function StatusBadge({ children, status }: { children: React.ReactNode; status: CommunityCommentStatus | CommunityPostStatus }) {
  const tone = status === "published" ? "bg-emerald-50 text-emerald-700 ring-emerald-100"
    : status === "hidden" || status === "pending" ? "bg-amber-50 text-amber-700 ring-amber-100"
      : status === "deleted" ? "bg-rose-50 text-rose-700 ring-rose-100"
        : "bg-slate-50 text-slate-600 ring-slate-200";
  return <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-black ring-1 ${tone}`}>{children}</span>;
}

function StatMini({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-blue-50/75 px-2 py-2 ring-1 ring-blue-100">
      <p className="text-sm font-black text-[#061a3a]">{value}</p>
      <p className="mt-0.5 text-[10px] font-bold text-slate-500">{label}</p>
    </div>
  );
}

function ActionPill({ disabled = false, icon, label, onClick, tone = "blue" }: { disabled?: boolean; icon: React.ReactNode; label: string; onClick?: () => void; tone?: "blue" | "green" | "red" }) {
  const toneClass = tone === "green" ? "bg-emerald-50 text-emerald-700 ring-emerald-100"
    : tone === "red" ? "bg-rose-50 text-rose-700 ring-rose-100"
      : "bg-blue-50 text-[#1D4ED8] ring-blue-100";
  return (
    <button className={`inline-flex h-[34px] items-center gap-1.5 rounded-full px-3 text-xs font-extrabold ring-1 disabled:bg-slate-50 disabled:text-slate-400 disabled:ring-slate-200 ${toneClass}`} disabled={disabled} onClick={onClick} type="button">
      {icon}
      {label}
    </button>
  );
}

function ActionLink({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Link className="inline-flex h-[34px] items-center gap-1.5 rounded-full bg-blue-50 px-3 text-xs font-extrabold text-[#1D4ED8] ring-1 ring-blue-100" href={href}>
      {icon}
      {label}
    </Link>
  );
}

function isMeTab(value: string | null): value is MeTab {
  return value === "posts" || value === "favorites" || value === "liked" || value === "comments";
}

function parseCommunityTime(value: string) {
  const match = value.match(/^(\d{2})\/(\d{2})\s+(\d{2}):(\d{2})$/);
  if (!match) return 0;
  const [, month, day, hour, minute] = match;
  return new Date(2026, Number(month) - 1, Number(day), Number(hour), Number(minute)).getTime();
}
