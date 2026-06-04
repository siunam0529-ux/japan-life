"use client";

import { ArrowLeft, Check, ChevronRight, Heart, Lock, MessageCircle, Pencil, Pin, Settings2, Share2, Smile, Star, Trash2, UserRound, X } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import type { FormEvent, ReactNode, UIEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { CommunityPostImageFrame, getPreviewColor } from "@/components/community/CommunityPostImageFrame";
import { CommunityErrorState } from "@/components/community/CommunityStates";
import { isOwnAccountProfile, readMeProfile } from "@/lib/account/profile";
import { clearCommunityPostPreloadCache, getCachedCommunityPost, rememberCommunityPost } from "@/lib/appPreload";
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
  createCommunityReport,
  formatCommunityNow,
  getCommunityCommentLikeIds,
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
  softDeleteComment,
  toggleCommunityCommentLike,
  toggleCommunityFavorite,
  toggleCommunityLike,
  updateCommunityPost,
  writeCommunityComments,
  writeCommunityIdSet,
  writeCommunityPosts,
  type CommunityUser,
} from "@/lib/community/repository";
import { dispatchCommunityPostChange, dispatchCommunityReactionChange } from "@/lib/community/reactionEvents";
import { getCommunityLocaleHref, getCommunityUserHref } from "@/lib/community/routes";
import { getCommunityTopicHref } from "@/lib/community/topics";
import { getCommunityPostTypeLabel, hasCommunityRiskKeyword, isCommunityViewLocale, type CommunityComment, type CommunityLocale, type CommunityPost, type CommunityPostImage, type CommunityPostType, type CommunityUserProfile, type CommunityViewLocale } from "@/lib/community/types";
import { getOrCreateConversation } from "@/lib/messages/api";
import { withBackFrom } from "@/lib/navigation/back";
import type { Language } from "@/lib/i18n/translations";

const typeTone: Record<CommunityPostType, string> = {
  buddy: "bg-violet-50 text-violet-700 ring-violet-100",
  discount: "bg-orange-50 text-orange-700 ring-orange-100",
  friend: "bg-rose-50 text-rose-700 ring-rose-100",
  secondhand: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  share: "bg-pink-50 text-pink-700 ring-pink-100",
};

const communityCommentLikesStorageKey = "japan-life-community-comment-likes";
const communityPinnedCommentsStorageKey = "japan-life-community-pinned-comments";
const oneWeekMs = 7 * 24 * 60 * 60 * 1000;

type CommunityAuthorAvatarProfile = Pick<CommunityUserProfile, "avatar" | "displayName" | "id">;

const detailCopy = {
  "zh-CN": {
    back: "返回",
    notFound: "这条内容可能已经删除，或社区数据暂时不可用。",
    justNow: "刚刚",
    ownVisibility: { private: "仅自己可见", public: "公开可见" },
    editSettings: "编辑和权限设置",
    shareLabel: "分享链接",
    shareFallbackText: "Japan Life 社区帖子",
    shareTitle: "Japan Life 社区",
    shareCopied: "分享链接已复制。",
    shareCopyFailed: "暂时无法复制链接，请稍后再试。",
    loginRequired: "请先登录",
    cannotMessageSelf: "不能给自己发私信。",
    messageUnavailable: "私信暂时不可用。",
    reportPrompt: "举报原因（可补充说明）",
    reportDefault: "其他",
    reportFailed: "举报失败，请稍后再试。",
    reportSubmitted: "举报已提交，我们会尽快处理。",
    submitFailed: "提交失败，请稍后再试。",
    communityUnavailable: "社区数据暂时不可用，请稍后再试。",
    commentPending: "评论已提交，等待审核后显示。",
    commentPublished: "评论已发布。",
    commentDeleted: "评论已删除。",
    deleteFailed: "删除失败，请稍后再试。",
    pinned: "评论已置顶。",
    unpinned: "评论已取消置顶。",
    postUnpinned: "已取消置顶。",
    postPinned: "帖子已置顶 7 天。",
    visibilityPrivate: "已设为仅自己可见。",
    visibilityPublic: "已设为公开可见。",
    deletePostConfirm: "确定删除这篇帖子？删除后别人将看不到。",
    postDeleted: "帖子已删除。",
    notificationCommentTitle: "有人评论了你的帖子",
    commentPlaceholder: "说点什么...",
    replyingTo: (name: string) => `正在回复 @${name}`,
    replyPlaceholder: (name: string) => `回复 @${name}`,
    cancel: "取消",
    publish: "发布",
    comments: (count: number) => `评论 ${count}`,
    noComments: "暂无评论，来坐第一楼。",
    viewProfile: (name: string) => `查看 ${name} 的主页`,
    pinnedLabel: "置顶",
    reply: "回复",
    likeComment: "点赞评论",
    commentSettings: "评论设置",
    noteSettings: "帖子设置",
    closeNoteSettings: "关闭帖子设置",
    close: "关闭",
    edit: "编辑",
    delete: "删除",
    permissionSettings: "权限设置",
    publicNote: "公开帖子",
    pinnedNote: "已置顶",
    pinNote: "置顶帖子",
    closePermissionSettings: "关闭权限设置",
    publicVisible: "公开可见",
    publicVisibleDesc: "其他用户可以在社区和你的主页看到这篇帖子。",
    privateVisible: "仅自己可见",
    privateVisibleDesc: "只保留在你的账号里，其他用户看不到。",
    unpin: "取消置顶",
    favorite: "收藏",
    copy: "复制",
    message: "私信",
    report: "举报",
    like: "点赞",
  },
  "zh-TW": {
    back: "返回",
    notFound: "這條內容可能已經刪除，或社群数据源暫時不可用。",
    justNow: "剛剛",
    ownVisibility: { private: "僅自己可見", public: "公開可見" },
    editSettings: "編輯和權限設定",
    shareLabel: "分享連結",
    shareFallbackText: "Japan Life 社群貼文",
    shareTitle: "Japan Life 社群",
    shareCopied: "分享連結已複製。",
    shareCopyFailed: "暫時無法複製連結，請稍後再試。",
    loginRequired: "請先登入",
    cannotMessageSelf: "不能給自己發私訊。",
    messageUnavailable: "私訊暫時不可用。",
    reportPrompt: "檢舉原因（可補充說明）",
    reportDefault: "其他",
    reportFailed: "檢舉失敗，請稍後再試。",
    reportSubmitted: "檢舉已提交，我們會盡快處理。",
    submitFailed: "提交失敗，請稍後再試。",
    communityUnavailable: "社群数据源暫時不可用，請稍後再試。",
    commentPending: "評論已提交，等待審核後顯示。",
    commentPublished: "評論已發布。",
    commentDeleted: "評論已刪除。",
    deleteFailed: "刪除失敗，請稍後再試。",
    pinned: "評論已置頂。",
    unpinned: "評論已取消置頂。",
    postUnpinned: "已取消置頂。",
    postPinned: "貼文已置頂 7 天。",
    visibilityPrivate: "已設為僅自己可見。",
    visibilityPublic: "已設為公開可見。",
    deletePostConfirm: "確定刪除這篇貼文？刪除後別人將看不到。",
    postDeleted: "貼文已刪除。",
    notificationCommentTitle: "有人評論了你的貼文",
    commentPlaceholder: "說點什麼...",
    replyingTo: (name: string) => `正在回覆 @${name}`,
    replyPlaceholder: (name: string) => `回覆 @${name}`,
    cancel: "取消",
    publish: "發布",
    comments: (count: number) => `評論 ${count}`,
    noComments: "暫無評論，來坐第一樓。",
    viewProfile: (name: string) => `查看 ${name} 的主頁`,
    pinnedLabel: "置頂",
    reply: "回覆",
    likeComment: "按讚評論",
    commentSettings: "評論設定",
    noteSettings: "貼文設定",
    closeNoteSettings: "關閉貼文設定",
    close: "關閉",
    edit: "編輯",
    delete: "刪除",
    permissionSettings: "權限設定",
    publicNote: "公開貼文",
    pinnedNote: "已置頂",
    pinNote: "置頂貼文",
    closePermissionSettings: "關閉權限設定",
    publicVisible: "公開可見",
    publicVisibleDesc: "其他使用者可以在社群和你的主頁看到這篇貼文。",
    privateVisible: "僅自己可見",
    privateVisibleDesc: "只保留在你的帳號裡，其他使用者看不到。",
    unpin: "取消置頂",
    favorite: "收藏",
    copy: "複製",
    message: "私訊",
    report: "檢舉",
    like: "按讚",
  },
  ja: {
    back: "戻る",
    notFound: "この内容は削除されたか、コミュニティデータが一時的に利用できません。",
    justNow: "たった今",
    ownVisibility: { private: "自分だけに表示", public: "公開中" },
    editSettings: "編集と権限設定",
    shareLabel: "リンクを共有",
    shareFallbackText: "Japan Life コミュニティ投稿",
    shareTitle: "Japan Life コミュニティ",
    shareCopied: "共有リンクをコピーしました。",
    shareCopyFailed: "リンクをコピーできません。しばらくしてからお試しください。",
    loginRequired: "先にログインしてください",
    cannotMessageSelf: "自分にはメッセージを送れません。",
    messageUnavailable: "メッセージは現在利用できません。",
    reportPrompt: "通報理由（補足も入力可）",
    reportDefault: "その他",
    reportFailed: "通報に失敗しました。しばらくしてからお試しください。",
    reportSubmitted: "通報を送信しました。できるだけ早く確認します。",
    submitFailed: "送信に失敗しました。しばらくしてからお試しください。",
    communityUnavailable: "コミュニティデータを一時的に利用できません。しばらくしてからお試しください。",
    commentPending: "コメントを送信しました。審査後に表示されます。",
    commentPublished: "コメントを投稿しました。",
    commentDeleted: "コメントを削除しました。",
    deleteFailed: "削除に失敗しました。しばらくしてからお試しください。",
    pinned: "コメントを固定しました。",
    unpinned: "コメントの固定を解除しました。",
    postUnpinned: "固定を解除しました。",
    postPinned: "投稿を 7 日間固定しました。",
    visibilityPrivate: "自分だけに表示しました。",
    visibilityPublic: "公開表示にしました。",
    deletePostConfirm: "この投稿を削除しますか？削除後は他の人に表示されません。",
    postDeleted: "投稿を削除しました。",
    notificationCommentTitle: "あなたの投稿にコメントが届きました",
    commentPlaceholder: "コメントを書く...",
    replyingTo: (name: string) => `@${name} に返信中`,
    replyPlaceholder: (name: string) => `@${name} に返信`,
    cancel: "キャンセル",
    publish: "投稿",
    comments: (count: number) => `コメント ${count}`,
    noComments: "まだコメントはありません。最初にコメントしてみましょう。",
    viewProfile: (name: string) => `${name} のプロフィールを見る`,
    pinnedLabel: "固定",
    reply: "返信",
    likeComment: "コメントにいいね",
    commentSettings: "コメント設定",
    noteSettings: "投稿設定",
    closeNoteSettings: "投稿設定を閉じる",
    close: "閉じる",
    edit: "編集",
    delete: "削除",
    permissionSettings: "権限設定",
    publicNote: "投稿を公開",
    pinnedNote: "固定済み",
    pinNote: "投稿を固定",
    closePermissionSettings: "権限設定を閉じる",
    publicVisible: "公開",
    publicVisibleDesc: "他のユーザーがコミュニティとあなたのプロフィールでこの投稿を見られます。",
    privateVisible: "自分だけに表示",
    privateVisibleDesc: "自分のアカウント内だけに残し、他のユーザーには表示しません。",
    unpin: "固定を解除",
    favorite: "保存",
    copy: "コピー",
    message: "メッセージ",
    report: "通報",
    like: "いいね",
  },
} as const;

type DetailText = (typeof detailCopy)[Language];

function detailLanguage(locale: string): Language {
  if (locale === "zh-tw") return "zh-TW";
  if (locale === "ja") return "ja";
  return "zh-CN";
}

export default function CommunityPostDetailPage() {
  const params = useParams<{ id: string; locale: string }>();
  const router = useRouter();
  const postId = params.id;
  const rawLocale = params.locale;
  const text = detailCopy[detailLanguage(rawLocale)];
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
  const [pinnedCommentIds, setPinnedCommentIds] = useState<Set<string>>(new Set());
  const [commentAuthors, setCommentAuthors] = useState<Record<string, CommunityAuthorAvatarProfile>>({});
  const [commentText, setCommentText] = useState("");
  const [replyTarget, setReplyTarget] = useState<CommunityComment | null>(null);
  const [commentActionTarget, setCommentActionTarget] = useState<CommunityComment | null>(null);
  const [currentUser, setCurrentUser] = useState<CommunityUser | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [likes, setLikes] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState("");
  const [postActionSubmitting, setPostActionSubmitting] = useState(false);
  const [postPrivacyOpen, setPostPrivacyOpen] = useState(false);
  const [postSettingsOpen, setPostSettingsOpen] = useState(false);
  const [postLoading, setPostLoading] = useState(true);
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [supabaseEnabled, setSupabaseEnabled] = useState(false);

  useEffect(() => {
    const cachedPost = getCachedCommunityPost(postId);
    setPostLoading(!cachedPost);
    setPosts(cachedPost ? [cachedPost] : localMode ? readCommunityPosts(storageFallbackLocale) : []);
    setComments(localMode ? readCommunityComments() : []);
    setFavorites(localMode ? readCommunityIdSet(communityFavoritesStorageKey) : new Set());
    setLikes(localMode ? readCommunityIdSet(communityLikesStorageKey) : new Set());
    setCommentLikes(localMode ? readCommunityIdSet(communityCommentLikesStorageKey) : new Set());
    setPinnedCommentIds(readCommunityIdSet(getPinnedCommentStorageKey(postId)));
    let mounted = true;

    void getCurrentCommunityUser().then((user) => {
      if (mounted) setCurrentUser(user);
    });

    void getCommunityPostById(postId, viewLocale).then((result) => {
      if (!mounted) return;
      if (result.source === "supabase") {
        setSupabaseEnabled(true);
        setPosts(result.data ? [result.data] : []);
        if (result.data) rememberCommunityPost(result.data);
        if (result.data?.authorId) {
          void getCommunityProfile(result.data.authorId).then((profile) => {
            if (mounted && profile.data) setAuthor(profile.data);
          });
        }
      }
      setPostLoading(false);
    }).catch(() => {
      if (mounted) setPostLoading(false);
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

    void getCommunityCommentLikeIds(postId).then((result) => {
      if (mounted && result.source === "supabase") setCommentLikes(result.data);
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
  const candidatePost = validViewLocale ? allPosts.find((item) => item.id === postId) ?? null : null;
  const isCandidateOwnPost = Boolean(candidatePost && currentUser && isOwnAccountProfile(candidatePost.authorId, currentUser));
  const post = candidatePost && (candidatePost.status === "published" || (candidatePost.status === "hidden" && isCandidateOwnPost)) ? candidatePost : null;
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
      setMessage(text.loginRequired);
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
      dispatchCommunityReactionChange({ active, count: nextCount, postId, type: "like" });
      if (active && post.authorId !== currentUser.id) {
        addCommunityNotification(createCommunityNotification({
          communityLocale: post.communityLocale,
          message: `\u4f60\u7684\u5206\u4eab\u300a${post.title}\u300b\u6536\u5230\u65b0\u7684\u70b9\u8d5e\u3002`,
          postId: post.id,
          targetId: post.id,
          targetType: "post",
          title: "\u6709\u4eba\u70b9\u8d5e\u4e86\u4f60\u7684\u5e16\u5b50",
          type: "like",
          userId: post.authorId || communityCurrentUserId,
        }));
      }
      return;
    }

    const result = await toggleCommunityLike(postId, currentUser.id);
    if (!result.data) {
      setMessage(result.error || "\u70b9\u8d5e\u5931\u8d25\uff0c\u8bf7\u7a0d\u540e\u518d\u8bd5\u3002");
      return;
    }
    const next = new Set(likes);
    if (result.data.active) next.add(postId);
    else next.delete(postId);
    setLikes(next);
    setPosts((items) => items.map((item) => item.id === postId ? { ...item, likeCount: result.data!.count, likes: result.data!.count } : item));
    dispatchCommunityReactionChange({ active: result.data.active, count: result.data.count, postId, type: "like" });
  }

  async function handleFavorite() {
    if (!post) return;
    if (!currentUser) {
      setMessage("\u8bf7\u5148\u767b\u5f55");
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
      dispatchCommunityReactionChange({ active, count: nextCount, postId, type: "favorite" });
      return;
    }

    const result = await toggleCommunityFavorite(postId, currentUser.id);
    if (!result.data) {
      setMessage(result.error || "\u6536\u85cf\u5931\u8d25\uff0c\u8bf7\u7a0d\u540e\u518d\u8bd5\u3002");
      return;
    }
    const next = new Set(favorites);
    if (result.data.active) next.add(postId);
    else next.delete(postId);
    setFavorites(next);
    setPosts((items) => items.map((item) => item.id === postId ? { ...item, favoriteCount: result.data!.count, favorites: result.data!.count } : item));
    dispatchCommunityReactionChange({ active: result.data.active, count: result.data.count, postId, type: "favorite" });
  }

  function togglePinnedComment(comment: CommunityComment) {
    if (!isOwnPost || comment.parentId) return;
    const next = new Set(pinnedCommentIds);
    const active = !next.has(comment.id);
    if (active) next.add(comment.id);
    else next.delete(comment.id);
    setPinnedCommentIds(next);
    writeCommunityIdSet(getPinnedCommentStorageKey(postId), next);
    setMessage(active ? "\u8bc4\u8bba\u5df2\u7f6e\u9876\u3002" : "\u8bc4\u8bba\u5df2\u53d6\u6d88\u7f6e\u9876\u3002");
    closeCommentActions();
  }

  async function favoriteFromCommentMenu() {
    await handleFavorite();
    closeCommentActions();
  }

  async function openCommentAuthorMessage(comment: CommunityComment) {
    if (!currentUser) {
      setMessage(text.loginRequired);
      closeCommentActions();
      return;
    }
    if (!comment.authorId || comment.authorId === currentUser.id) {
      setMessage(text.cannotMessageSelf);
      closeCommentActions();
      return;
    }
    const result = await getOrCreateConversation(comment.authorId, comment.authorName);
    closeCommentActions();
    if (!result.data) {
      setMessage(result.error || text.messageUnavailable);
      return;
    }
    router.push(`/messages/${result.data.id}`);
  }

  async function reportComment(comment: CommunityComment) {
    if (!currentUser) {
      setMessage("\u8bf7\u5148\u767b\u5f55");
      closeCommentActions();
      return;
    }
    const detail = window.prompt("\u4e3e\u62a5\u539f\u56e0\uff08\u53ef\u8865\u5145\u8bf4\u660e\uff09", "\u5176\u4ed6");
    if (detail === null) return;
    const result = await createCommunityReport({
      detail: detail.trim(),
      reason: detail.trim() || "\u5176\u4ed6",
      targetId: comment.id,
      targetType: "comment",
      userId: currentUser.id,
    });
    if (!result.data) {
      setMessage(result.error || "\u4e3e\u62a5\u5931\u8d25\uff0c\u8bf7\u7a0d\u540e\u518d\u8bd5\u3002");
      closeCommentActions();
      return;
    }
    const nextReportCount = Number(comment.reportCount ?? 0) + 1;
    setComments((items) => items.map((item) => item.id === comment.id ? {
      ...item,
      reportCount: nextReportCount,
      status: nextReportCount >= 3 ? "reported" : item.status,
    } : item));
    setMessage("\u4e3e\u62a5\u5df2\u63d0\u4ea4\uff0c\u6211\u4eec\u4f1a\u5c3d\u5feb\u5904\u7406\u3002");
    closeCommentActions();
  }

  async function submitComment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const content = commentText.trim();
    if (!content || !post) return;
    if (!currentUser) {
      setMessage(text.loginRequired);
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
        setMessage(result.error || "\u63d0\u4ea4\u5931\u8d25\uff0c\u8bf7\u7a0d\u540e\u518d\u8bd5\u3002");
        return;
      }
      setComments((current) => [result.data!, ...current]);
      setPosts((items) => items.map((item) => item.id === postId ? { ...item, comments: item.comments + 1, commentCount: Number(item.commentCount ?? item.comments) + 1 } : item));
      setCommentText("");
      setReplyTarget(null);
      setMessage(hasRisk ? "\u8bc4\u8bba\u5df2\u63d0\u4ea4\uff0c\u7b49\u5f85\u5ba1\u6838\u540e\u663e\u793a\u3002" : "\u8bc4\u8bba\u5df2\u53d1\u5e03\u3002");
      return;
    }

    if (!isCommunityLocalMode()) {
      setMessage("\u793e\u533a\u6570\u636e\u6682\u65f6\u4e0d\u53ef\u7528\uff0c\u8bf7\u7a0d\u540e\u518d\u8bd5\u3002");
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
        title: text.notificationCommentTitle,
        type: "comment",
        userId: post.authorId || communityCurrentUserId,
      }));
    }
    setCommentText("");
    setReplyTarget(null);
    setMessage(hasRisk ? "\u8bc4\u8bba\u5df2\u63d0\u4ea4\uff0c\u7b49\u5f85\u5ba1\u6838\u540e\u663e\u793a\u3002" : "\u8bc4\u8bba\u5df2\u53d1\u5e03\u3002");
  }


  function closeCommentActions() {
    setCommentActionTarget(null);
  }

  async function deleteComment(comment: CommunityComment) {
    const result = await softDeleteComment(comment.id, post?.id);
    if (result.error || !result.data) {
      setMessage(result.error || "\u5220\u9664\u5931\u8d25\uff0c\u8bf7\u7a0d\u540e\u518d\u8bd5\u3002");
      closeCommentActions();
      return;
    }
    const nextComments = comments.map((item) => item.id === comment.id || item.parentId === comment.id ? { ...item, status: "deleted" as const } : item);
    setComments(nextComments);
    if (isCommunityLocalMode()) writeCommunityComments(nextComments);
    if (post) {
      patchStoredPost({
        commentCount: Math.max(0, Number(post.commentCount ?? post.comments ?? 0) - 1),
        comments: Math.max(0, Number(post.comments ?? 0) - 1),
      });
    }
    setMessage(text.commentDeleted);
    closeCommentActions();
  }

  async function handleCommentLike(commentId: string) {
    if (!currentUser) {
      setMessage(text.loginRequired);
      return;
    }
    const result = await toggleCommunityCommentLike(commentId, currentUser.id);
    if (result.error || !result.data) {
      setMessage(result.error || text.submitFailed);
      return;
    }
    const next = new Set(commentLikes);
    if (result.data.active) next.add(commentId);
    else next.delete(commentId);
    setCommentLikes(next);
    if (isCommunityLocalMode()) writeCommunityIdSet(communityCommentLikesStorageKey, next);
    setComments((items) => items.map((item) => item.id === commentId ? { ...item, likeCount: result.data!.count } : item));
  }

  function startCommentReply(comment: CommunityComment) {
    if (!currentUser) {
      setMessage(text.loginRequired);
      return;
    }
    setReplyTarget(comment);
    setCommentText("");
    window.setTimeout(() => document.querySelector<HTMLInputElement>("[data-community-comment-input]")?.focus(), 60);
  }

  async function editOwnPost() {
    if (!post || !currentUser || !isOwnPost) return;
    setPostSettingsOpen(false);
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
    const tags = nextTagsText.replace(/[??]/g, " ").split(/[,\s]+/).map((tag) => tag.trim()).filter(Boolean).slice(0, 8);
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
    clearCommunityPostPreloadCache(post.id);
    dispatchCommunityPostChange({ post: result.data, postId: post.id, status: result.data.status });
    setMessage("\u5e16\u5b50\u5df2\u66f4\u65b0\u3002");
  }

  async function applyOwnPostPatch(patch: Partial<CommunityPost>, successMessage: string) {
    if (!post || !currentUser || !isOwnPost || postActionSubmitting) return null;
    setPostActionSubmitting(true);
    const result = await updateCommunityPost(post.id, { ...patch, updatedAt: formatCommunityNow() });
    setPostActionSubmitting(false);
    if (!result.data) {
      setMessage(result.error || "\u64cd\u4f5c\u5931\u8d25\uff0c\u8bf7\u7a0d\u540e\u518d\u8bd5\u3002");
      return null;
    }
    setPosts((items) => {
      const exists = items.some((item) => item.id === post.id);
      if (result.data!.status === "deleted") return items.filter((item) => item.id !== post.id);
      return exists ? items.map((item) => item.id === post.id ? result.data! : item) : [result.data!, ...items];
    });
    patchStoredPost(result.data);
    clearCommunityPostPreloadCache(post.id);
    dispatchCommunityPostChange({ post: result.data, postId: post.id, status: result.data.status });
    setMessage(successMessage);
    return result.data;
  }

  async function pinOwnPost() {
    if (post?.isPinned) {
      const next = await applyOwnPostPatch({ isPinned: false, pinnedUntil: null }, "\u5df2\u53d6\u6d88\u7f6e\u9876\u3002");
      if (next) setPostSettingsOpen(false);
      return;
    }
    const pinnedUntil = getPinnedUntilIso();
    const next = await applyOwnPostPatch({ isPinned: true, pinnedUntil }, "\u5e16\u5b50\u5df2\u7f6e\u9876 7 \u5929\u3002");
    if (next) setPostSettingsOpen(false);
  }

  async function applyPostVisibility(visibility: "public" | "private") {
    const hidden = visibility === "private";
    const next = await applyOwnPostPatch({ status: hidden ? "hidden" : "published" }, hidden ? "\u5df2\u8bbe\u4e3a\u4ec5\u81ea\u5df1\u53ef\u89c1\u3002" : "\u5df2\u8bbe\u4e3a\u516c\u5f00\u53ef\u89c1\u3002");
    if (next) {
      setPostPrivacyOpen(false);
      setPostSettingsOpen(false);
    }
  }

  async function deleteOwnPost() {
    if (!window.confirm("\u786e\u5b9a\u5220\u9664\u8fd9\u7bc7\u5e16\u5b50\uff1f\u5220\u9664\u540e\u522b\u4eba\u5c06\u770b\u4e0d\u5230\u3002")) return;
    const next = await applyOwnPostPatch({ status: "deleted" }, "\u5e16\u5b50\u5df2\u5220\u9664\u3002");
    if (next) {
      setPostSettingsOpen(false);
      window.setTimeout(() => {
        window.location.href = backHref;
      }, 250);
    }
  }

  async function sharePost() {
    if (!post || typeof window === "undefined") return;
    const url = window.location.href;
    const shareData = {
      text: post.content ? post.content.slice(0, 80) : "Japan Life \u793e\u533a\u5e16\u5b50",
      title: post.title || "Japan Life \u793e\u533a",
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
      setMessage("\u5206\u4eab\u94fe\u63a5\u5df2\u590d\u5236\u3002");
    } catch {
      setMessage("\u6682\u65f6\u65e0\u6cd5\u590d\u5236\u94fe\u63a5\uff0c\u8bf7\u7a0d\u540e\u518d\u8bd5\u3002");
    }
  }

  function patchStoredPost(patch: Partial<CommunityPost>) {
    if (!post || !isCommunityLocalMode()) return;
    const stored = readCommunityPosts(currentPostLocale);
    if (patch.status === "deleted") {
      const nextStored = stored.filter((item) => item.id !== post.id);
      writeCommunityPosts(nextStored.slice(0, 120));
      setPosts(nextStored);
      return;
    }
    const existsInStorage = stored.some((item) => item.id === post.id);
    const nextStored = existsInStorage
      ? stored.map((item) => item.id === post.id ? { ...item, ...patch } : item)
      : [{ ...post, ...patch }, ...stored];
    writeCommunityPosts(nextStored.slice(0, 120));
    setPosts(nextStored);
  }

  if (!post && postLoading) {
    return (
      <main className="jl-tool-theme min-h-screen text-[#061a3a]">
        <div className="jl-tool-shell mx-auto min-h-screen w-full max-w-[430px] px-4 pb-32 pt-5">
          <Link className="inline-flex h-9 items-center gap-2 rounded-full bg-white/85 px-4 text-sm font-black text-[#2563EB] shadow-sm ring-1 ring-blue-100" href={backHref}>
            <ArrowLeft className="h-4 w-4" />
            {text.back}
          </Link>
        </div>
      </main>
    );
  }

  if (!post) {
    return (
      <main className="jl-tool-theme min-h-screen text-[#061a3a]">
        <div className="jl-tool-shell mx-auto min-h-screen w-full max-w-[430px] px-4 pb-32 pt-5">
          <Link className="inline-flex h-9 items-center gap-2 rounded-full bg-white/85 px-4 text-sm font-black text-[#2563EB] shadow-sm ring-1 ring-blue-100" href={backHref}>
            <ArrowLeft className="h-4 w-4" />
            \u8fd4\u56de
          </Link>
          <div className="mt-4">
            <CommunityErrorState actionHref={backHref} description={message || "\u8fd9\u6761\u5185\u5bb9\u53ef\u80fd\u5df2\u7ecf\u5220\u9664\uff0c\u6216\u793e\u533a\u6570\u636e\u6682\u65f6\u4e0d\u53ef\u7528\u3002"} />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white text-[#111827]">
      <div className="mx-auto min-h-screen w-full max-w-[430px] pb-[92px]">
        <header className="sticky top-0 z-40 flex h-[62px] items-center gap-3 border-b border-slate-100 bg-white/96 px-3 backdrop-blur">
          <Link className="flex h-10 w-8 shrink-0 items-center justify-center text-[#111827]" href={backHref} aria-label={text.back}>
            <ArrowLeft className="h-6 w-6" />
          </Link>
          <div className="min-w-0 flex-1">
            <AuthorInline author={author ?? getLocalAuthorProfile(post.authorId, currentUser)} post={post} />
          </div>
          <button className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[#111827] transition active:scale-95 active:bg-slate-100" onClick={() => void sharePost()} type="button" aria-label={text.shareLabel}>
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
            <span>{post.createdAt || text.justNow} {post.area}</span>
            <span className={"rounded-full px-2.5 py-1 text-[11px] font-black ring-1 " + typeTone[post.type]}>{getCommunityPostTypeLabel(post.type, viewLocale)}</span>
          </div>
          {isOwnPost ? (
            <button className="mt-4 flex w-full items-center gap-3 rounded-[18px] bg-[#f7f8fb] px-4 py-3 text-left ring-1 ring-slate-100 transition active:scale-[0.99] active:bg-slate-100" onClick={() => setPostSettingsOpen(true)} type="button">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-[#2563EB] shadow-sm">
                <Lock className="h-5 w-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[14px] font-black text-[#222]">{post.status === "hidden" ? text.ownVisibility.private : text.ownVisibility.public}</span>
                <span className="mt-0.5 block text-[12px] font-bold text-slate-500">{text.editSettings}</span>
              </span>
              <ChevronRight className="h-5 w-5 shrink-0 text-slate-400" />
            </button>
          ) : null}
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
          pinnedCommentIds={pinnedCommentIds}
          replyTarget={replyTarget}
          sectionRef={commentSectionRef}
          text={text}
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
        onEditPost={() => setPostSettingsOpen(true)}
        onFavorite={() => void handleFavorite()}
        onLike={() => void handleLike()}
        onSubmit={submitComment}
        text={text}
        totalComments={postComments.length}
        replyTarget={replyTarget}
      />
      <PostSettingsSheet
        busy={postActionSubmitting}
        open={postSettingsOpen && isOwnPost}
        post={post}
        onClose={() => setPostSettingsOpen(false)}
        onDelete={() => void deleteOwnPost()}
        onEdit={() => void editOwnPost()}
        onPin={() => void pinOwnPost()}
        onVisibility={() => setPostPrivacyOpen(true)}
        text={text}
      />
      <PostPrivacySheet
        busy={postActionSubmitting}
        open={postPrivacyOpen && isOwnPost}
        post={post}
        onClose={() => setPostPrivacyOpen(false)}
        onSelect={(visibility) => void applyPostVisibility(visibility)}
        text={text}
      />
      <CommentActionSheet
        comment={commentActionTarget}
        currentUserId={currentUser?.id ?? ""}
        isOwnPost={isOwnPost}
        onClose={closeCommentActions}
        onDelete={deleteComment}
        onFavorite={() => void favoriteFromCommentMenu()}
        onMessage={(comment) => void openCommentAuthorMessage(comment)}
        onPin={togglePinnedComment}
        onReport={(comment) => void reportComment(comment)}
        onReply={(comment) => { startCommentReply(comment); closeCommentActions(); }}
        pinnedCommentIds={pinnedCommentIds}
        text={text}
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
            <button className={(activeIndex === index ? "h-2 w-2 bg-rose-500" : "h-1.5 w-1.5 bg-slate-300") + " rounded-full transition-all"} key={"dot-" + getImageKey(image, index)} onClick={() => showImage(index)} type="button" aria-label={`Image ${index + 1}`} aria-current={activeIndex === index ? "true" : undefined}>
              <span className="sr-only">{`Image ${index + 1}`}</span>
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

function InlineCommentForm({ canComment, className = "", commentText, loginHref, onCancelReply, onCommentTextChange, onSubmit, replyTarget, text, variant = "section" }: { canComment: boolean; className?: string; commentText: string; loginHref: string; onCancelReply?: () => void; onCommentTextChange: (value: string) => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void; replyTarget: CommunityComment | null; text: DetailText; variant?: "bottom" | "section" }) {
  if (!canComment) {
    return (
      <Link className={(variant === "bottom" ? "flex h-11 min-w-0 flex-1 items-center gap-2 rounded-full bg-[#f4f4f6] px-4 text-[15px] font-bold text-slate-500" : "flex h-11 items-center rounded-full bg-slate-50 px-4 text-sm font-bold text-slate-400 ring-1 ring-slate-100") + " " + className} href={loginHref}>
        <Pencil className="h-5 w-5 shrink-0" />
        {text.commentPlaceholder}
      </Link>
    );
  }
  return (
    <form className={(variant === "bottom" ? "min-w-0 flex-1" : "rounded-[18px] bg-slate-50 p-3 ring-1 ring-slate-100") + " " + className} onSubmit={onSubmit}>
      {replyTarget && variant === "section" ? (
        <div className="mb-2 flex items-center justify-between gap-2 text-xs font-black text-slate-500">
          <span className="min-w-0 truncate">{text.replyingTo(replyTarget.authorName)}</span>
          <button className="shrink-0 text-[#2563EB]" onClick={onCancelReply} type="button">{text.cancel}</button>
        </div>
      ) : null}
      <label className={variant === "bottom" ? "flex h-11 min-w-0 items-center gap-2 rounded-full bg-[#f4f4f6] px-4 text-slate-500" : "flex min-h-11 items-center gap-2 rounded-full bg-white px-4 ring-1 ring-slate-100"}>
        <Pencil className="h-5 w-5 shrink-0 text-slate-500" />
        <input className="min-w-0 flex-1 border-0 bg-transparent text-[15px] font-bold outline-none placeholder:text-slate-500" data-community-comment-input onChange={(event) => onCommentTextChange(event.target.value)} placeholder={replyTarget ? text.replyPlaceholder(replyTarget.authorName) : text.commentPlaceholder} value={commentText} />
        {commentText.trim() ? <button className="shrink-0 text-xs font-black text-[#2563EB]" type="submit">{text.publish}</button> : null}
      </label>
    </form>
  );
}

function CommentsSection({ canComment, commentAuthors, commentLikes, commentText, comments, loginHref, onCancelReply, onCommentAction, onCommentLike, onCommentTextChange, onReply, onSubmit, pinnedCommentIds, replyTarget, sectionRef, text, totalComments }: { canComment: boolean; commentAuthors: Record<string, CommunityAuthorAvatarProfile>; commentLikes: Set<string>; commentText: string; comments: CommunityComment[]; loginHref: string; onCancelReply: () => void; onCommentAction: (comment: CommunityComment) => void; onCommentLike: (commentId: string) => void; onCommentTextChange: (value: string) => void; onReply: (comment: CommunityComment) => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void; pinnedCommentIds: Set<string>; replyTarget: CommunityComment | null; sectionRef: React.RefObject<HTMLElement | null>; text: DetailText; totalComments: number }) {
  const commentIds = new Set(comments.map((comment) => comment.id));
  const rootComments = comments
    .filter((comment) => !comment.parentId || !commentIds.has(comment.parentId))
    .sort((left, right) => Number(pinnedCommentIds.has(right.id)) - Number(pinnedCommentIds.has(left.id)));
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
        <CommentItem author={commentAuthors[comment.authorId]} comment={comment} compact={compact} liked={commentLikes.has(comment.id)} pinned={pinnedCommentIds.has(comment.id)} onAction={() => onCommentAction(comment)} onLike={() => onCommentLike(comment.id)} onReply={() => onReply(comment)} text={text} />
        {replies.length ? <div className={(compact ? "ml-10" : "ml-[52px]") + " mt-1 grid gap-1"}>{replies.map((reply) => renderComment(reply, true))}</div> : null}
      </div>
    );
  };
  return (
    <section className="border-t border-slate-100 px-4 py-4" data-comment-section ref={sectionRef}>
      <div className="flex items-center justify-between">
        <h2 className="text-[16px] font-black text-[#222]">{text.comments(totalComments)}</h2>
        <span className="text-lg font-black leading-none text-slate-500">+</span>
      </div>
      <InlineCommentForm canComment={canComment} className="mt-3" commentText={commentText} loginHref={loginHref} onCancelReply={onCancelReply} onCommentTextChange={onCommentTextChange} onSubmit={onSubmit} replyTarget={replyTarget} text={text} />
      <div className="mt-4 grid gap-1">
        {comments.length === 0 ? <p className="rounded-2xl bg-slate-50 p-3 text-xs font-bold text-slate-400">{text.noComments}</p> : null}
        {rootComments.map((comment) => renderComment(comment))}
      </div>
    </section>
  );
}

function CommentItem({ author, comment, compact = false, liked, onAction, onLike, onReply, pinned = false, text }: { author?: CommunityAuthorAvatarProfile; comment: CommunityComment; compact?: boolean; liked: boolean; onAction: () => void; onLike: () => void; onReply: () => void; pinned?: boolean; text: DetailText }) {
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
  const count = Number(comment.likeCount ?? 0);
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
        <Link className="shrink-0 rounded-full transition active:scale-95" href={profileHref} onClick={(event) => event.stopPropagation()} onPointerDown={(event) => { event.stopPropagation(); clearTimer(); }} onPointerUp={(event) => event.stopPropagation()} aria-label={text.viewProfile(comment.authorName)}>
          <AuthorAvatar avatar={author?.avatar} name={comment.authorName} sizeClass={compact ? "h-8 w-8" : "h-10 w-10"} iconClass={compact ? "h-4 w-4" : "h-5 w-5"} />
        </Link>
        <div className="min-w-0 flex-1 pr-1">
          <Link className="inline-block max-w-full truncate text-[13px] font-black text-slate-500 transition active:text-[#2563EB]" href={profileHref} onClick={(event) => event.stopPropagation()} onPointerDown={(event) => { event.stopPropagation(); clearTimer(); }}>
            {comment.authorName}
          </Link>
          <p className={(compact ? "text-[14px]" : "text-[15px]") + " whitespace-pre-wrap font-black leading-6 text-[#222] [overflow-wrap:anywhere]"}>{comment.content}</p>
          <div className="mt-0.5 flex items-center gap-3 text-[12px] font-black text-slate-400">
            {pinned ? <span className="rounded-full bg-amber-50 px-2 py-0.5 text-amber-600">{text.pinnedLabel}</span> : null}
            <span>{comment.createdAt}</span>
            <button className="transition active:text-[#2563EB]" onClick={(event) => { event.stopPropagation(); onReply(); }} onPointerDown={(event) => { event.stopPropagation(); clearTimer(); }} type="button">{text.reply}</button>
          </div>
        </div>
        <div className={(compact ? "pt-5" : "pt-7") + " flex shrink-0 items-start gap-4"}>
          <button className={(liked ? "text-pink-600" : "text-slate-500") + " flex min-w-7 shrink-0 flex-col items-center gap-0.5 text-[11px] font-black transition active:scale-95"} onClick={(event) => { event.stopPropagation(); onLike(); }} onPointerDown={(event) => { event.stopPropagation(); clearTimer(); }} type="button" aria-label={text.likeComment}>
            <Heart className={(liked ? "fill-current " : "") + "h-6 w-6 stroke-[1.9]"} />
            {count > 0 ? <span>{count}</span> : null}
          </button>
          <button className="flex min-w-7 shrink-0 flex-col items-center text-slate-500 transition active:scale-95 active:text-[#2563EB]" onClick={(event) => { event.stopPropagation(); onAction(); }} onPointerDown={(event) => { event.stopPropagation(); clearTimer(); }} type="button" aria-label={text.commentSettings}>
            <Smile className="h-6 w-6 stroke-[1.9]" />
          </button>
        </div>
      </div>
    </article>
  );
}

function getPinnedUntilIso() {
  return new Date(Date.now() + oneWeekMs).toISOString();
}

function getPinnedCommentStorageKey(postId: string) {
  return `${communityPinnedCommentsStorageKey}:${postId}`;
}

function PostSettingsSheet({ busy, onClose, onDelete, onEdit, onPin, onVisibility, open, post, text }: { busy: boolean; onClose: () => void; onDelete: () => void; onEdit: () => void; onPin: () => void; onVisibility: () => void; open: boolean; post: CommunityPost; text: DetailText }) {
  if (!open) return null;
  const visibilityLabel = post.status === "hidden" ? text.publicNote : text.permissionSettings;
  const pinLabel = post.isPinned ? text.pinnedNote : text.pinNote;
  return (
    <section className="fixed inset-0 z-[95] bg-black/45" role="dialog" aria-modal="true" aria-label={text.noteSettings}>
      <button className="absolute inset-0 h-full w-full" onClick={onClose} type="button" aria-label={text.closeNoteSettings} />
      <div className="absolute inset-x-0 bottom-0 mx-auto w-full max-w-[430px] px-3 pb-4">
        <div className="mx-auto mb-2 h-1.5 w-11 rounded-full bg-white/70" />
        <div className="rounded-[20px] bg-white px-4 pb-5 pt-4 shadow-[0_-18px_50px_rgba(15,23,42,0.24)]">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-[17px] font-black text-[#222]">{text.noteSettings}</h2>
            <button className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition active:scale-95" onClick={onClose} type="button" aria-label={text.close}>
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="grid grid-cols-4 gap-3">
            <PostSettingsAction disabled={busy} icon={<Pencil className="h-5 w-5" />} label={text.edit} onClick={onEdit} />
            <PostSettingsAction disabled={busy} icon={<Lock className="h-5 w-5" />} label={visibilityLabel} onClick={onVisibility} />
            <PostSettingsAction disabled={busy} icon={<Pin className="h-5 w-5" />} label={pinLabel} onClick={onPin} />
            <PostSettingsAction danger disabled={busy} icon={<Trash2 className="h-5 w-5" />} label={text.delete} onClick={onDelete} />
          </div>
        </div>
      </div>
    </section>
  );
}

function PostSettingsAction({ danger = false, disabled = false, icon, label, onClick }: { danger?: boolean; disabled?: boolean; icon: ReactNode; label: string; onClick: () => void }) {
  return (
    <button className={(danger ? "text-red-600" : "text-[#222]") + " flex min-w-0 flex-col items-center gap-2 rounded-[16px] px-2 py-2 text-center text-[12px] font-black transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-45"} disabled={disabled} onClick={onClick} type="button">
      <span className={(danger ? "bg-red-50 text-red-600" : "bg-slate-100 text-slate-700") + " flex h-12 w-12 items-center justify-center rounded-full"}>
        {icon}
      </span>
      <span className="w-full truncate">{label}</span>
    </button>
  );
}

function PostPrivacySheet({ busy, onClose, onSelect, open, post, text }: { busy: boolean; onClose: () => void; onSelect: (visibility: "public" | "private") => void; open: boolean; post: CommunityPost; text: DetailText }) {
  if (!open) return null;
  const currentVisibility = post.status === "hidden" ? "private" : "public";
  return (
    <section className="fixed inset-0 z-[100] bg-black/45" role="dialog" aria-modal="true" aria-label={text.permissionSettings}>
      <button className="absolute inset-0 h-full w-full" onClick={onClose} type="button" aria-label={text.closePermissionSettings} />
      <div className="absolute inset-x-0 bottom-0 mx-auto w-full max-w-[430px] px-3 pb-4">
        <div className="mx-auto mb-2 h-1.5 w-11 rounded-full bg-white/70" />
        <div className="rounded-[20px] bg-white px-4 pb-5 pt-4 shadow-[0_-18px_50px_rgba(15,23,42,0.24)]">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-[17px] font-black text-[#222]">{text.permissionSettings}</h2>
            <button className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition active:scale-95" onClick={onClose} type="button" aria-label={text.close}>
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="grid gap-2">
            <PrivacyOption active={currentVisibility === "public"} disabled={busy} label={text.publicVisible} description={text.publicVisibleDesc} onClick={() => onSelect("public")} />
            <PrivacyOption active={currentVisibility === "private"} disabled={busy} label={text.privateVisible} description={text.privateVisibleDesc} onClick={() => onSelect("private")} />
          </div>
        </div>
      </div>
    </section>
  );
}

function PrivacyOption({ active, description, disabled, label, onClick }: { active: boolean; description: string; disabled: boolean; label: string; onClick: () => void }) {
  return (
    <button className={(active ? "border-blue-200 bg-blue-50 text-[#1d4ed8]" : "border-slate-100 bg-white text-[#222]") + " flex items-center gap-3 rounded-[18px] border px-4 py-3 text-left transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"} disabled={disabled} onClick={onClick} type="button">
      <span className={(active ? "bg-[#2563EB] text-white" : "bg-slate-100 text-slate-400") + " flex h-6 w-6 shrink-0 items-center justify-center rounded-full"}>
        {active ? <Check className="h-4 w-4" /> : null}
      </span>
      <span className="min-w-0">
        <span className="block text-[14px] font-black">{label}</span>
        <span className="mt-1 block text-[12px] font-bold leading-4 text-slate-500">{description}</span>
      </span>
    </button>
  );
}

function CommentActionSheet({ comment, currentUserId, isOwnPost, onClose, onDelete, onFavorite, onMessage, onPin, onReport, onReply, pinnedCommentIds, text }: { comment: CommunityComment | null; currentUserId: string; isOwnPost: boolean; onClose: () => void; onDelete: (comment: CommunityComment) => void; onFavorite: () => void; onMessage: (comment: CommunityComment) => void; onPin: (comment: CommunityComment) => void; onReport: (comment: CommunityComment) => void; onReply: (comment: CommunityComment) => void; pinnedCommentIds: Set<string>; text: DetailText }) {
  if (!comment) return null;
  const isOwnComment = Boolean(currentUserId && comment.authorId === currentUserId);
  const showDelete = isOwnPost || isOwnComment;
  const canPin = isOwnPost && !comment.parentId;
  const pinLabel = pinnedCommentIds.has(comment.id) ? text.unpin : text.pinnedLabel;
  return (
    <section className="fixed inset-0 z-[90] bg-black/45" role="dialog" aria-modal="true">
      <button className="absolute inset-0 h-full w-full" onClick={onClose} type="button" aria-label={text.close} />
      <div className="absolute inset-x-0 bottom-0 mx-auto w-full max-w-[430px] px-3 pb-4">
        <div className="mx-auto mb-2 h-1.5 w-11 rounded-full bg-white/70" />
        <div className="overflow-hidden rounded-[18px] bg-white shadow-[0_-18px_50px_rgba(15,23,42,0.24)]">
          {canPin ? <ActionSheetButton label={pinLabel} onClick={() => onPin(comment)} /> : null}
          <ActionSheetButton label={text.reply} onClick={() => onReply(comment)} />
          <ActionSheetButton label={text.favorite} onClick={onFavorite} />
          <ActionSheetButton label={text.copy} onClick={() => { void navigator.clipboard?.writeText(comment.content); onClose(); }} />
          {!isOwnComment ? <ActionSheetButton label={text.message} onClick={() => onMessage(comment)} /> : null}
          {!isOwnComment ? <ActionSheetButton label={text.report} onClick={() => onReport(comment)} /> : null}
          {showDelete ? <ActionSheetButton danger label={text.delete} onClick={() => onDelete(comment)} /> : null}
        </div>
        <button className="mt-2 h-12 w-full rounded-[18px] bg-white text-[15px] font-black text-[#222] shadow-[0_-8px_26px_rgba(15,23,42,0.12)]" onClick={onClose} type="button">{text.cancel}</button>
      </div>
    </section>
  );
}

function ActionSheetButton({ danger = false, label, onClick }: { danger?: boolean; label: string; onClick: () => void }) {
  return <button className={(danger ? "text-red-600" : "text-[#222]") + " flex h-12 w-full items-center px-4 text-left text-[15px] font-black active:bg-slate-50"} onClick={onClick} type="button">{label}</button>;
}

function BottomCommentBar({ canComment, commentText, favoriteCount, favorited, isOwnPost, liked, likeCount, loginHref, onCommentTextChange, onEditPost, onFavorite, onLike, onSubmit, replyTarget, text, totalComments }: { canComment: boolean; commentText: string; favoriteCount: number; favorited: boolean; isOwnPost: boolean; liked: boolean; likeCount: number; loginHref: string; onCommentTextChange: (value: string) => void; onEditPost: () => void; onFavorite: () => void; onLike: () => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void; replyTarget: CommunityComment | null; text: DetailText; totalComments: number }) {
  return (
    <section className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-100 bg-white/96 px-3 py-2.5 backdrop-blur">
      <div className={"mx-auto grid max-w-[430px] items-center gap-3 " + (isOwnPost ? "grid-cols-[auto_minmax(0,1fr)_auto_auto_auto]" : "grid-cols-[minmax(0,1fr)_auto_auto_auto]")}>
        {isOwnPost ? (
          <button className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#f4f4f6] text-[#2563EB] transition active:scale-95 active:bg-blue-50" onClick={onEditPost} type="button" aria-label={text.noteSettings} title={text.noteSettings}>
            <Settings2 className="h-5 w-5" />
          </button>
        ) : null}
        <InlineCommentForm canComment={canComment} commentText={commentText} loginHref={loginHref} onCommentTextChange={onCommentTextChange} onSubmit={onSubmit} replyTarget={replyTarget} text={text} variant="bottom" />
        <button className={"flex shrink-0 items-center gap-1 text-[15px] font-black " + (liked ? "text-pink-600" : "text-[#222]")} onClick={onLike} type="button" aria-label={text.like}>
          <Heart className={"h-8 w-8 stroke-[1.8] " + (liked ? "fill-current" : "")} />
          {likeCount}
        </button>
        <button className={"flex shrink-0 items-center gap-1 text-[15px] font-black " + (favorited ? "text-amber-500" : "text-[#222]")} onClick={onFavorite} type="button" aria-label={text.favorite}>
          <Star className={"h-8 w-8 stroke-[1.8] " + (favorited ? "fill-current" : "")} />
          {favoriteCount}
        </button>
        <button className="flex shrink-0 items-center gap-1 text-[15px] font-black text-[#222]" onClick={() => document.querySelector("[data-comment-section]")?.scrollIntoView({ behavior: "smooth", block: "start" })} type="button" aria-label={text.comments(totalComments)}>
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
