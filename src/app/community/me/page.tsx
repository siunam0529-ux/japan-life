"use client";

import { CheckCircle2, Copy, Edit3, Eye, Heart, Inbox, MessageCircle, PackageCheck, Send, Star, Trash2, XCircle } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { CommunityCurationBadges } from "@/components/community/CommunityCurationBadges";
import { CommunityLoginRequiredCard } from "@/components/community/CommunityLoginRequiredCard";
import { CommunityNotificationButton } from "@/components/community/CommunityNotificationButton";
import { CommunityPostImageFrame } from "@/components/community/CommunityPostImageFrame";
import { CommunityEmptyState } from "@/components/community/CommunityStates";
import { CURRENT_USER_ID, CURRENT_USER_NAME, getCurrentCommunityUser, type CommunityUser } from "@/lib/community/currentUser";
import { communityMockPosts } from "@/lib/community/mock";
import { getCommunityNewPostHref, getCommunityPostHref, getCommunitySelectionHref } from "@/lib/community/routes";
import {
  communityFavoritesStorageKey,
  getCommunityFavoriteIds,
  getCommunityPosts,
  getReceivedContactRequests,
  getSentContactRequests,
  mergeCommunityPosts,
  readCommunityComments,
  readCommunityContactRequests,
  readCommunityIdSet,
  readCommunityPosts,
  softDeleteComment,
  toggleCommunityFavorite,
  updateCommunityPost,
  updateContactRequestStatus,
  writeCommunityComments,
  writeCommunityContactRequests,
  writeCommunityIdSet,
  writeCommunityPosts,
} from "@/lib/community/repository";
import {
  getCommunityPostTypeLabel,
  type CommunityComment,
  type CommunityCommentStatus,
  type CommunityContactRequest,
  type CommunityContactRequestStatus,
  type CommunityPost,
  type CommunityPostStatus,
} from "@/lib/community/types";

type MeTab = "posts" | "favorites" | "received" | "sent" | "comments";

const tabs: { id: MeTab; label: string; icon: typeof Heart }[] = [
  { id: "posts", icon: Star, label: "我的帖子" },
  { id: "favorites", icon: Heart, label: "我的收藏" },
  { id: "received", icon: Inbox, label: "收到的申请" },
  { id: "sent", icon: Send, label: "发出的申请" },
  { id: "comments", icon: MessageCircle, label: "我的评论" },
];

const emptyCopy: Record<MeTab, { actionHref?: string; actionLabel?: string; description: string; title: string }> = {
  comments: { description: "你还没有评论", title: "这里还没有内容" },
  favorites: { description: "你还没有收藏内容", title: "这里还没有内容" },
  posts: { actionHref: getCommunityNewPostHref("all"), actionLabel: "去发布", description: "你还没有发布内容", title: "这里还没有内容" },
  received: { description: "还没有人申请联系你", title: "这里还没有内容" },
  sent: { description: "你还没有发出申请", title: "这里还没有内容" },
};

const postStatusLabels: Record<CommunityPostStatus, string> = {
  deleted: "已删除",
  hidden: "已隐藏",
  pending: "待审核",
  published: "已发布",
  reported: "被举报",
};

const commentStatusLabels: Record<CommunityCommentStatus, string> = {
  deleted: "已删除",
  hidden: "已隐藏",
  published: "已发布",
  reported: "被举报",
};

const requestStatusLabels: Record<CommunityContactRequestStatus, string> = {
  accepted: "已接受",
  cancelled: "已取消",
  declined: "已拒绝",
  deleted: "已删除",
  hidden: "已隐藏",
  pending: "待处理",
  read: "已读",
  rejected: "已拒绝",
};

export default function CommunityMePage() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<MeTab>("posts");
  const [comments, setComments] = useState<CommunityComment[]>([]);
  const [contactRequests, setContactRequests] = useState<CommunityContactRequest[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState("");
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [currentUserId, setCurrentUserId] = useState(CURRENT_USER_ID);
  const [currentUser, setCurrentUser] = useState<CommunityUser | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (isMeTab(tab)) setActiveTab(tab);
  }, [searchParams]);

  useEffect(() => {
    setPosts(readCommunityPosts());
    setFavoriteIds(readCommunityIdSet(communityFavoritesStorageKey));
    setContactRequests(readCommunityContactRequests());
    setComments(readCommunityComments());
    let mounted = true;
    void getCurrentCommunityUser().then(async (user) => {
      if (!mounted) return;
      setCurrentUser(user);
      setAuthChecked(true);
      if (!user) return;
      setCurrentUserId(user.id);
      const [myPostResult, publicPostResult, favoriteResult, receivedResult, sentResult] = await Promise.all([
        getCommunityPosts({ authorId: user.id, includeAllStatuses: true, includeMock: false }),
        getCommunityPosts({ includeMock: false }),
        getCommunityFavoriteIds(user.id),
        getReceivedContactRequests(user.id),
        getSentContactRequests(user.id),
      ]);
      if (!mounted) return;
      if (myPostResult.source === "supabase" || publicPostResult.source === "supabase") {
        setPosts(mergeCommunityPosts(myPostResult.data, publicPostResult.data));
      }
      if (favoriteResult.source === "supabase") setFavoriteIds(favoriteResult.data);
      if (receivedResult.source === "supabase" || sentResult.source === "supabase") {
        setContactRequests(mergeRequests(receivedResult.data, sentResult.data));
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  const allPosts = useMemo(
    () => mergeCommunityPosts(posts, communityMockPosts).sort((left, right) => parseCommunityTime(right.createdAt) - parseCommunityTime(left.createdAt)),
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

  const receivedRequests = useMemo(
    () => contactRequests
      .filter((request) => request.status !== "cancelled" && request.status !== "deleted" && request.status !== "hidden")
      .filter((request) => {
        const post = allPosts.find((item) => item.id === request.postId);
        return request.toUserId === currentUserId || post?.authorId === currentUserId;
      })
      .sort((left, right) => parseCommunityTime(right.createdAt) - parseCommunityTime(left.createdAt)),
    [allPosts, contactRequests, currentUserId],
  );

  const sentRequests = useMemo(
    () => contactRequests
      .filter((request) => request.fromUserId === currentUserId && request.status !== "deleted" && request.status !== "hidden")
      .sort((left, right) => parseCommunityTime(right.createdAt) - parseCommunityTime(left.createdAt)),
    [contactRequests, currentUserId],
  );

  const myComments = useMemo(
    () => comments
      .filter((comment) => comment.authorId === currentUserId)
      .sort((left, right) => parseCommunityTime(right.createdAt) - parseCommunityTime(left.createdAt)),
    [comments, currentUserId],
  );

  async function patchPost(postId: string, patch: Partial<CommunityPost>, nextMessage: string) {
    if (!currentUser) {
      setMessage("请先登录");
      return;
    }
    const result = await updateCommunityPost(postId, patch);
    if (result.source === "supabase") {
      if (result.error || !result.data) {
        setMessage(result.error || "提交失败，请稍后再试。");
        return;
      }
      setPosts((items) => mergeCommunityPosts([result.data!], items));
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
    setPosts(nextPosts);
    setMessage(nextMessage);
  }

  async function removeFavorite(postId: string) {
    if (!currentUser) {
      setMessage("请先登录");
      return;
    }
    const result = await toggleCommunityFavorite(postId, currentUser.id);
    if (result.source === "supabase") {
      if (result.error || !result.data) {
        setMessage(result.error || "提交失败，请稍后再试。");
        return;
      }
      const nextFavorites = new Set(favoriteIds);
      nextFavorites.delete(postId);
      setFavoriteIds(nextFavorites);
      setPosts((items) => items.map((post) => post.id === postId ? {
        ...post,
        favoriteCount: result.data!.count,
        favorites: result.data!.count,
      } : post));
      setMessage("已取消收藏。");
      return;
    }
    const nextFavorites = new Set(favoriteIds);
    nextFavorites.delete(postId);
    setFavoriteIds(nextFavorites);
    writeCommunityIdSet(communityFavoritesStorageKey, nextFavorites);

    const targetPost = allPosts.find((post) => post.id === postId);
    if (targetPost) {
      await patchPost(postId, {
        favoriteCount: Math.max(0, targetPost.favoriteCount - 1),
        favorites: Math.max(0, targetPost.favorites - 1),
      }, "已取消收藏。");
    } else {
      setMessage("已取消收藏。");
    }
  }

  async function patchRequest(requestId: string, status: CommunityContactRequestStatus, nextMessage: string) {
    if (!currentUser) {
      setMessage("请先登录");
      return;
    }
    const result = await updateContactRequestStatus(requestId, status);
    if (result.source === "supabase") {
      if (result.error || !result.data) {
        setMessage(result.error || "提交失败，请稍后再试。");
        return;
      }
      setContactRequests((requests) => requests.map((request) => request.id === requestId ? result.data! : request));
      setMessage(nextMessage);
      return;
    }
    const nextRequests = contactRequests.map((request) => request.id === requestId ? { ...request, status } : request);
    setContactRequests(nextRequests);
    writeCommunityContactRequests(nextRequests);
    setMessage(nextMessage);
  }

  async function copyContact(contact: string) {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(contact);
      setMessage("已复制联系方式。");
      return;
    }
    setMessage(`联系方式：${contact}`);
  }

  async function deleteComment(commentId: string) {
    if (!currentUser) {
      setMessage("请先登录");
      return;
    }
    const result = await softDeleteComment(commentId);
    if (result.source === "supabase") {
      if (result.error || !result.data) {
        setMessage(result.error || "提交失败，请稍后再试。");
        return;
      }
      setComments((items) => items.map((comment) => comment.id === commentId ? { ...comment, status: "deleted" as const } : comment));
      setMessage("评论已删除。");
      return;
    }
    const nextComments = comments.map((comment) => comment.id === commentId ? { ...comment, status: "deleted" as const } : comment);
    setComments(nextComments);
    writeCommunityComments(nextComments);
    setMessage("评论已删除。");
  }

  if (!authChecked) {
    return (
      <main className="jl-tool-theme min-h-screen text-[#061a3a]">
        <div className="jl-tool-shell mx-auto min-h-screen w-full max-w-[430px] px-4 pb-[110px] pt-4">
          <div className="rounded-[24px] border border-white/80 bg-white/86 p-4 text-sm font-black text-[#2563EB] shadow-[0_12px_28px_rgba(15,76,129,0.08)]">加载中...</div>
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
            <p className="truncate text-lg font-[850] leading-7 text-[#061a3a]">我的社区</p>
            <p className="text-[11px] font-bold text-[#64748b]">{currentUser?.name ?? CURRENT_USER_NAME}</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <CommunityNotificationButton />
            <Link className="inline-flex h-9 items-center rounded-full bg-white/85 px-3 text-xs font-black text-[#2563EB] shadow-sm ring-1 ring-blue-100" href={getCommunitySelectionHref()}>
              切换
            </Link>
          </div>
        </div>

        <section className="mt-4 rounded-[30px] bg-white/85 p-5 shadow-[0_18px_40px_rgba(37,99,235,0.12)] ring-1 ring-white/80 backdrop-blur">
          <p className="text-xs font-black text-[#2563EB]">My Community</p>
          <h1 className="mt-1 text-[26px] font-[850] leading-8 text-[#061a3a]">我的社区</h1>
          <p className="mt-2 text-[13px] font-bold leading-5 text-[#40546f]">管理你的帖子、收藏和联系申请</p>
        </section>

        {message ? <p className="mt-4 rounded-2xl bg-blue-50 px-4 py-3 text-xs font-black text-[#1D4ED8] ring-1 ring-blue-100">{message}</p> : null}

        <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                className={`inline-flex h-[34px] shrink-0 items-center gap-1.5 rounded-full px-[14px] text-[13px] font-extrabold ${activeTab === tab.id ? "bg-[linear-gradient(135deg,#2563eb,#38bdf8)] text-white shadow-[0_10px_22px_rgba(37,99,235,0.22)]" : "bg-white/80 text-[#40546f] ring-1 ring-blue-100"}`}
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                type="button"
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        <section className="mt-4 grid gap-3">
          {activeTab === "posts" ? (
            <PostList
              contactRequests={contactRequests}
              empty={emptyCopy.posts}
              onDelete={(post) => void patchPost(post.id, { status: "deleted" }, "帖子已删除，前台不会再显示。")}
              onEdit={() => setMessage("编辑功能第一版先保留入口，暂不开放。")}
              onMarkSold={(post) => void patchPost(post.id, { itemStatus: "已出" }, "已标记为已出。")}
              onMarkSolved={(post) => void patchPost(post.id, { isSolved: true }, "已标记为已解决。")}
              posts={myPosts}
            />
          ) : null}
          {activeTab === "favorites" ? (
            <FavoriteList empty={emptyCopy.favorites} onRemove={(postId) => void removeFavorite(postId)} posts={favoritePosts} />
          ) : null}
          {activeTab === "received" ? (
            <RequestList
              empty={emptyCopy.received}
              mode="received"
              onAccept={(request) => void patchRequest(request.id, "accepted", "已接受申请。")}
              onCancel={(request) => void patchRequest(request.id, "cancelled", "申请已取消。")}
              onCopy={(request) => void copyContact(request.contact)}
              onRead={(request) => void patchRequest(request.id, "read", "已标为已读。")}
              onReject={(request) => void patchRequest(request.id, "rejected", "已拒绝申请。")}
              posts={allPosts}
              requests={receivedRequests}
            />
          ) : null}
          {activeTab === "sent" ? (
            <RequestList
              empty={emptyCopy.sent}
              mode="sent"
              onAccept={(request) => void patchRequest(request.id, "accepted", "已接受申请。")}
              onCancel={(request) => void patchRequest(request.id, "cancelled", "申请已取消。")}
              onCopy={(request) => void copyContact(request.contact)}
              onRead={(request) => void patchRequest(request.id, "read", "已标为已读。")}
              onReject={(request) => void patchRequest(request.id, "rejected", "已拒绝申请。")}
              posts={allPosts}
              requests={sentRequests}
            />
          ) : null}
          {activeTab === "comments" ? (
            <CommentList comments={myComments} empty={emptyCopy.comments} onDelete={(commentId) => void deleteComment(commentId)} posts={allPosts} />
          ) : null}
        </section>
      </div>
    </main>
  );
}

function PostList({
  contactRequests,
  empty,
  onDelete,
  onEdit,
  onMarkSold,
  onMarkSolved,
  posts,
}: {
  contactRequests: CommunityContactRequest[];
  empty: { actionHref?: string; actionLabel?: string; description: string; title: string };
  onDelete: (post: CommunityPost) => void;
  onEdit: () => void;
  onMarkSold: (post: CommunityPost) => void;
  onMarkSolved: (post: CommunityPost) => void;
  posts: CommunityPost[];
}) {
  if (posts.length === 0) return <EmptyState {...empty} />;
  return posts.map((post) => (
    <PostManageCard
      applicationCount={contactRequests.filter((request) => request.postId === post.id && request.status !== "cancelled" && request.status !== "deleted").length}
      key={post.id}
      onDelete={() => onDelete(post)}
      onEdit={onEdit}
      onMarkSold={() => onMarkSold(post)}
      onMarkSolved={() => onMarkSolved(post)}
      post={post}
    />
  ));
}

function PostManageCard({ applicationCount, onDelete, onEdit, onMarkSold, onMarkSolved, post }: { applicationCount: number; onDelete: () => void; onEdit: () => void; onMarkSold: () => void; onMarkSolved: () => void; post: CommunityPost }) {
  return (
    <article className="rounded-[24px] border border-white/80 bg-white/85 p-[14px] shadow-[0_12px_28px_rgba(15,76,129,0.08)]">
      <PostCardHeader post={post} />
      <div className="mt-3 flex flex-wrap gap-1.5">
        <Badge>{getCommunityPostTypeLabel(post.type)}</Badge>
        <Badge>{post.area}</Badge>
        <Badge>{post.createdAt}</Badge>
        <StatusBadge status={post.status}>{postStatusLabels[post.status]}</StatusBadge>
        {post.isSolved ? <Badge tone="green">已解决</Badge> : null}
        {post.itemStatus ? <Badge tone="green">{post.itemStatus}</Badge> : null}
      </div>
      <div className="mt-3 grid grid-cols-4 gap-2 text-center text-[11px] font-black text-slate-500">
        <StatMini label="点赞" value={post.likes} />
        <StatMini label="评论" value={post.comments} />
        <StatMini label="收藏" value={post.favorites} />
        <StatMini label="申请" value={applicationCount} />
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {post.status === "published" ? <ActionLink href={getCommunityPostHref(post, "all")} icon={<Eye className="h-3.5 w-3.5" />} label="查看" /> : <ActionPill disabled icon={<Eye className="h-3.5 w-3.5" />} label="前台不可见" />}
        <ActionPill icon={<Edit3 className="h-3.5 w-3.5" />} label="编辑" onClick={onEdit} />
        {post.type === "help" && !post.isSolved ? <ActionPill icon={<CheckCircle2 className="h-3.5 w-3.5" />} label="设为已解决" onClick={onMarkSolved} tone="green" /> : null}
        {post.type === "secondhand" && post.itemStatus !== "已出" ? <ActionPill icon={<PackageCheck className="h-3.5 w-3.5" />} label="设为已出" onClick={onMarkSold} tone="green" /> : null}
        {post.status !== "deleted" ? <ActionPill icon={<Trash2 className="h-3.5 w-3.5" />} label="删除" onClick={onDelete} tone="red" /> : null}
      </div>
    </article>
  );
}

function FavoriteList({ empty, onRemove, posts }: { empty: { description: string; title: string }; onRemove: (postId: string) => void; posts: CommunityPost[] }) {
  if (posts.length === 0) return <EmptyState {...empty} />;
  return posts.map((post) => {
    const hidden = post.status === "hidden" || post.status === "deleted";
    return (
      <article className={`rounded-[24px] border p-[14px] shadow-[0_12px_28px_rgba(15,76,129,0.08)] ${hidden ? "border-slate-200 bg-slate-50/90 text-slate-500" : "border-white/80 bg-white/85"}`} key={post.id}>
        <PostCardHeader post={post} muted={hidden} />
        <div className="mt-3 flex flex-wrap gap-1.5">
          <Badge>{getCommunityPostTypeLabel(post.type)}</Badge>
          <Badge>{post.authorName}</Badge>
          <Badge>{post.area}</Badge>
          <Badge>收藏时间：本机收藏</Badge>
          {hidden ? <StatusBadge status={post.status}>内容已不可见</StatusBadge> : null}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {!hidden ? <ActionLink href={getCommunityPostHref(post, "all")} icon={<Eye className="h-3.5 w-3.5" />} label="查看" /> : null}
          <ActionPill icon={<XCircle className="h-3.5 w-3.5" />} label="取消收藏" onClick={() => onRemove(post.id)} tone="red" />
        </div>
      </article>
    );
  });
}

function RequestList({
  empty,
  mode,
  onAccept,
  onCancel,
  onCopy,
  onRead,
  onReject,
  posts,
  requests,
}: {
  empty: { description: string; title: string };
  mode: "received" | "sent";
  onAccept: (request: CommunityContactRequest) => void;
  onCancel: (request: CommunityContactRequest) => void;
  onCopy: (request: CommunityContactRequest) => void;
  onRead: (request: CommunityContactRequest) => void;
  onReject: (request: CommunityContactRequest) => void;
  posts: CommunityPost[];
  requests: CommunityContactRequest[];
}) {
  if (requests.length === 0) return <EmptyState {...empty} />;
  return requests.map((request) => {
    const post = posts.find((item) => item.id === request.postId);
    return (
      <article className="rounded-[24px] border border-white/80 bg-white/85 p-[14px] shadow-[0_12px_28px_rgba(15,76,129,0.08)]" key={request.id}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="line-clamp-1 text-sm font-black text-[#061a3a]">{post?.title ?? "帖子可能已删除"}</p>
            <p className="mt-1 text-xs font-bold text-slate-500">{post ? getCommunityPostTypeLabel(post.type) : "未知类型"} / {request.createdAt}</p>
          </div>
          <StatusBadge status={request.status}>{requestStatusLabels[request.status]}</StatusBadge>
        </div>
        <p className="mt-3 text-sm font-bold leading-6 text-slate-700">{request.message}</p>
        <div className="mt-3 rounded-2xl bg-[rgba(219,234,254,0.72)] p-2.5 text-[13px] font-bold leading-5 text-[#1d4ed8]">
          {mode === "received" ? `${request.fromName} 的联系方式：${request.contact}` : `我的联系方式：${request.contact}`}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {mode === "received" && request.status === "pending" ? <ActionPill icon={<CheckCircle2 className="h-3.5 w-3.5" />} label="标为已读" onClick={() => onRead(request)} /> : null}
          {mode === "received" && request.status !== "accepted" ? <ActionPill icon={<CheckCircle2 className="h-3.5 w-3.5" />} label="接受" onClick={() => onAccept(request)} tone="green" /> : null}
          {mode === "received" && request.status !== "rejected" ? <ActionPill icon={<XCircle className="h-3.5 w-3.5" />} label="拒绝" onClick={() => onReject(request)} tone="red" /> : null}
          {post?.status === "published" ? <ActionLink href={getCommunityPostHref(post, "all")} icon={<Eye className="h-3.5 w-3.5" />} label="查看原帖" /> : null}
          {mode === "received" ? <ActionPill icon={<Copy className="h-3.5 w-3.5" />} label="复制联系方式" onClick={() => onCopy(request)} /> : null}
          {mode === "sent" && request.status !== "cancelled" ? <ActionPill icon={<XCircle className="h-3.5 w-3.5" />} label="取消申请" onClick={() => onCancel(request)} tone="red" /> : null}
        </div>
      </article>
    );
  });
}

function CommentList({ comments, empty, onDelete, posts }: { comments: CommunityComment[]; empty: { description: string; title: string }; onDelete: (commentId: string) => void; posts: CommunityPost[] }) {
  if (comments.length === 0) return <EmptyState {...empty} />;
  return comments.map((comment) => {
    const post = posts.find((item) => item.id === comment.postId);
    return (
      <article className="rounded-[24px] border border-white/80 bg-white/85 p-[14px] shadow-[0_12px_28px_rgba(15,76,129,0.08)]" key={comment.id}>
        <p className="whitespace-pre-wrap text-sm font-bold leading-6 text-slate-700">{comment.content}</p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          <Badge>{post?.title ?? "帖子可能已删除"}</Badge>
          <Badge>{comment.createdAt}</Badge>
          <StatusBadge status={comment.status}>{commentStatusLabels[comment.status]}</StatusBadge>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {post?.status === "published" ? <ActionLink href={getCommunityPostHref(post, "all")} icon={<Eye className="h-3.5 w-3.5" />} label="查看帖子" /> : null}
          {comment.status !== "deleted" ? <ActionPill icon={<Trash2 className="h-3.5 w-3.5" />} label="删除评论" onClick={() => onDelete(comment.id)} tone="red" /> : null}
        </div>
      </article>
    );
  });
}

function PostCardHeader({ muted = false, post }: { muted?: boolean; post: CommunityPost }) {
  return (
    <div className="grid grid-cols-[92px_minmax(0,1fr)] gap-3">
      <div className="h-[92px] overflow-hidden rounded-[18px]">
        <CommunityPostImageFrame image={post.images?.[0]} type={post.type} />
      </div>
      <div className="min-w-0">
        <h2 className={`line-clamp-2 text-base font-black leading-6 ${muted ? "text-slate-500" : "text-[#061a3a]"}`}>{post.title}</h2>
        <p className="mt-1 line-clamp-2 text-xs font-bold leading-5 text-slate-600">{post.content}</p>
        <div className="mt-2">
          <CommunityCurationBadges locale="all" post={post} />
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

function StatusBadge({ children, status }: { children: React.ReactNode; status: CommunityCommentStatus | CommunityContactRequestStatus | CommunityPostStatus }) {
  const tone = status === "published" || status === "accepted" ? "bg-emerald-50 text-emerald-700 ring-emerald-100"
    : status === "hidden" || status === "pending" || status === "read" ? "bg-amber-50 text-amber-700 ring-amber-100"
      : status === "deleted" || status === "rejected" || status === "cancelled" || status === "declined" ? "bg-rose-50 text-rose-700 ring-rose-100"
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
  return value === "posts" || value === "favorites" || value === "received" || value === "sent" || value === "comments";
}

function mergeRequests(left: CommunityContactRequest[], right: CommunityContactRequest[]) {
  const seen = new Set<string>();
  return [...left, ...right].filter((request) => {
    if (seen.has(request.id)) return false;
    seen.add(request.id);
    return true;
  });
}

function parseCommunityTime(value: string) {
  const match = value.match(/^(\d{2})\/(\d{2})\s+(\d{2}):(\d{2})$/);
  if (!match) return 0;
  const [, month, day, hour, minute] = match;
  return new Date(2026, Number(month) - 1, Number(day), Number(hour), Number(minute)).getTime();
}
