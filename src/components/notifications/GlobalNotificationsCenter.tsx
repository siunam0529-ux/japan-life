"use client";

import type { User } from "@supabase/supabase-js";
import { ArrowLeft, Bell, Handshake, Heart, Inbox, MessageCircle, Star, UserPlus, UserRound } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { CommunityLoginRequiredCard } from "@/components/community/CommunityLoginRequiredCard";
import { MessageConversationRow } from "@/components/messages/MessageConversationRow";
import { useLanguage } from "@/hooks/useLanguage";
import { getCachedNotifications, warmNotifications } from "@/lib/appPreload";
import { getCurrentCommunityUser, type CommunityUser } from "@/lib/community/currentUser";
import { readCommunityFollowingUsers, writeCommunityFollowingUsers } from "@/lib/community/follow";
import { getCommunityPostHref, getCommunitySelectionHref, getCommunityUserHref } from "@/lib/community/routes";
import { markNotificationRead, writeCommunityNotifications } from "@/lib/community/repository";
import { communityNotificationTypeLabels, type CommunityNotification, type CommunityNotificationType } from "@/lib/community/types";
import { fetchLifeHelperApplications, fetchLifeHelperJoinApplications, fetchLifeHelperRequests } from "@/lib/lifeHelper/api";
import type { LifeHelperBusinessApplication, LifeHelperPersonalApplication } from "@/lib/lifeHelper/join";
import { getLifeHelperCategoryLabel, type LifeHelperApplication, type LifeHelperRequest } from "@/lib/lifeHelper/types";
import { isJapanLifeOfficialUser, japanLifeOfficialUserId } from "@/lib/messages/api";
import { deleteMessageConversationLocally, hideMessageConversation, markMessageConversationUnread, readDeletedMessageConversationIds, readForcedUnreadMessageConversationIds, readHiddenMessageConversationIds, readMessageConversationRemarks, readMutedMessageConversationIds, readPinnedMessageConversationIds } from "@/lib/messages/listActions";
import type { ConversationListItem } from "@/lib/messages/types";
import { supabase } from "@/lib/supabase";
import type { Language } from "@/lib/i18n/translations";

type AppNotificationSource = "community" | "life-helper";
type AppNotificationTone = "blue" | "green" | "orange" | "rose" | "violet";
type CommunityQuickActionId = "reactions" | "follows" | "comments";

type AppNotification = {
  createdAt: string;
  detail: string;
  href: string;
  icon: LucideIcon;
  id: string;
  isRead: boolean;
  meta: string;
  source: AppNotificationSource;
  title: string;
  tone: AppNotificationTone;
  communityNotification?: CommunityNotification;
};

const appNotificationReadIdsKey = "japan-life-app-notification-read-ids";
const lifeHelperNotificationConversationId = "life-helper-notification-conversation";

const communityQuickActions = [
  { id: "reactions", icon: Heart, tone: "rose" as const },
  { id: "follows", icon: UserPlus, tone: "blue" as const },
  { id: "comments", icon: MessageCircle, tone: "green" as const },
] satisfies { id: CommunityQuickActionId; icon: LucideIcon; tone: AppNotificationTone }[];

const notificationCopy = {
  "zh-CN": {
    loading: "加载中...",
    loginTitle: "请先登录",
    loginDesc: "登录后可以查看消息和私信。",
    emptyMessages: "还没有私信，去社区认识新朋友吧",
    communityActionLabels: { reactions: "赞和收藏", follows: "新增关注", comments: "评论和 @" },
    communityDetailTitles: { reactions: "收到的赞和收藏", follows: "新增关注", comments: "收到的评论和 @" },
    noCategoryMessages: "暂时没有这类消息",
    back: "返回",
    notification: "通知",
    announcement: "公告",
    community: "去社区看看",
    officialLast: "官方公告、重要更新和系统通知会显示在这里。",
    participantUser: "Japan Life 用户",
    lifeHelperLast: "需求申请、申请状态和入驻审核结果会显示在这里。",
    lifeHelperName: "生活帮手通知",
    lifeHelperSubtitle: "申请、状态和审核结果",
    noLifeHelper: "暂无生活帮手通知",
    viewDetail: "查看详情",
    favoritePost: "收藏了你的笔记",
    thanks: "私信感谢",
    followedYou: "开始关注你了",
    mutualFollow: "互相关注",
    followBack: "回关",
    repliedComment: "回复了你的评论",
    commentedPost: "评论了你的笔记",
    like: "赞",
    reply: "回复",
    communityUser: "社区用户",
    priorComment: "你之前的评论",
    yourPost: "你的社区笔记",
    likedComment: "赞了你的评论",
    likedPost: "赞了你的笔记",
    yesterday: "昨天",
    receivedApplicationTitle: (title: string) => `收到「${title}」的申请`,
    receivedApplicationFallback: "收到生活帮手申请",
    sentApplication: "申请已发送，等待发布者确认。",
    applicationStatus: (status: string) => `申请状态：${status}`,
    appliedTitle: (title: string) => `你申请了「${title}」`,
    appliedFallback: "生活帮手申请状态",
    joinTitle: (name: string) => `入驻申请：${name}`,
    joinApproved: "你的生活帮手入驻申请已通过。",
    joinRejected: "你的生活帮手入驻申请暂未通过，可以检查资料后再提交。",
    joinPending: "你的生活帮手入驻申请正在审核中。",
    actionLabels: { delete: "删除", hidden: "不显示", markUnread: "标为未读", muted: "静音", pinned: "置顶", startChat: "开始聊天吧", unread: "未读消息", userFallback: "Japan Life 用户" },
  },
  "zh-TW": {
    loading: "載入中...",
    loginTitle: "請先登入",
    loginDesc: "登入後可以查看訊息和私訊。",
    emptyMessages: "還沒有私訊，去社群認識新朋友吧",
    communityActionLabels: { reactions: "讚和收藏", follows: "新增關注", comments: "評論和 @" },
    communityDetailTitles: { reactions: "收到的讚和收藏", follows: "新增關注", comments: "收到的評論和 @" },
    noCategoryMessages: "暫時沒有這類訊息",
    back: "返回",
    notification: "通知",
    announcement: "公告",
    community: "去社群看看",
    officialLast: "官方公告、重要更新和系統通知會顯示在這裡。",
    participantUser: "Japan Life 使用者",
    lifeHelperLast: "需求申請、申請狀態和入駐審核結果會顯示在這裡。",
    lifeHelperName: "生活幫手通知",
    lifeHelperSubtitle: "申請、狀態和審核結果",
    noLifeHelper: "暫無生活幫手通知",
    viewDetail: "查看詳情",
    favoritePost: "收藏了你的筆記",
    thanks: "私訊感謝",
    followedYou: "開始關注你了",
    mutualFollow: "互相關注",
    followBack: "回關",
    repliedComment: "回覆了你的評論",
    commentedPost: "評論了你的筆記",
    like: "讚",
    reply: "回覆",
    communityUser: "社群使用者",
    priorComment: "你之前的評論",
    yourPost: "你的社群筆記",
    likedComment: "讚了你的評論",
    likedPost: "讚了你的筆記",
    yesterday: "昨天",
    receivedApplicationTitle: (title: string) => `收到「${title}」的申請`,
    receivedApplicationFallback: "收到生活幫手申請",
    sentApplication: "申請已送出，等待發布者確認。",
    applicationStatus: (status: string) => `申請狀態：${status}`,
    appliedTitle: (title: string) => `你申請了「${title}」`,
    appliedFallback: "生活幫手申請狀態",
    joinTitle: (name: string) => `入駐申請：${name}`,
    joinApproved: "你的生活幫手入駐申請已通過。",
    joinRejected: "你的生活幫手入駐申請暫未通過，可以檢查資料後再提交。",
    joinPending: "你的生活幫手入駐申請正在審核中。",
    actionLabels: { delete: "刪除", hidden: "不顯示", markUnread: "標為未讀", muted: "靜音", pinned: "置頂", startChat: "開始聊天吧", unread: "未讀訊息", userFallback: "Japan Life 使用者" },
  },
  ja: {
    loading: "読み込み中...",
    loginTitle: "ログインしてください",
    loginDesc: "ログイン後、通知とメッセージを確認できます。",
    emptyMessages: "メッセージはまだありません。コミュニティで新しい人とつながりましょう",
    communityActionLabels: { reactions: "いいね・保存", follows: "新しいフォロー", comments: "コメント・@" },
    communityDetailTitles: { reactions: "届いたいいね・保存", follows: "新しいフォロー", comments: "届いたコメント・@" },
    noCategoryMessages: "この種類の通知はまだありません",
    back: "戻る",
    notification: "通知",
    announcement: "お知らせ",
    community: "コミュニティを見る",
    officialLast: "公式のお知らせ、重要な更新、システム通知がここに表示されます。",
    participantUser: "Japan Life ユーザー",
    lifeHelperLast: "依頼応募、応募状況、登録審査の結果がここに表示されます。",
    lifeHelperName: "生活サポート通知",
    lifeHelperSubtitle: "応募、ステータス、審査結果",
    noLifeHelper: "生活サポート通知はまだありません",
    viewDetail: "詳細を見る",
    favoritePost: "あなたの投稿を保存しました",
    thanks: "メッセージでお礼",
    followedYou: "あなたをフォローしました",
    mutualFollow: "相互フォロー",
    followBack: "フォロー返し",
    repliedComment: "あなたのコメントに返信しました",
    commentedPost: "あなたの投稿にコメントしました",
    like: "いいね",
    reply: "返信",
    communityUser: "コミュニティユーザー",
    priorComment: "以前のコメント",
    yourPost: "あなたのコミュニティ投稿",
    likedComment: "あなたのコメントにいいねしました",
    likedPost: "あなたの投稿にいいねしました",
    yesterday: "昨日",
    receivedApplicationTitle: (title: string) => `「${title}」に応募が届きました`,
    receivedApplicationFallback: "生活サポートの応募が届きました",
    sentApplication: "応募を送信しました。投稿者の確認を待っています。",
    applicationStatus: (status: string) => `応募ステータス：${status}`,
    appliedTitle: (title: string) => `「${title}」に応募しました`,
    appliedFallback: "生活サポート応募ステータス",
    joinTitle: (name: string) => `登録申請：${name}`,
    joinApproved: "生活サポートの登録申請が承認されました。",
    joinRejected: "生活サポートの登録申請は承認されませんでした。内容を確認して再提出できます。",
    joinPending: "生活サポートの登録申請は審査中です。",
    actionLabels: { delete: "削除", hidden: "非表示", markUnread: "未読にする", muted: "ミュート", pinned: "固定", startChat: "チャットを始めましょう", unread: "未読メッセージ", userFallback: "Japan Life ユーザー" },
  },
} as const;

type NotificationText = typeof notificationCopy[Language];


export function GlobalNotificationsCenter() {
  const { language } = useLanguage();
  const text = notificationCopy[language];
  const router = useRouter();
  const [communityNotifications, setCommunityNotifications] = useState<CommunityNotification[]>([]);
  const [communityUser, setCommunityUser] = useState<CommunityUser | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [conversationError, setConversationError] = useState("");
  const [conversations, setConversations] = useState<ConversationListItem[]>([]);
  const [conversationsLoading, setConversationsLoading] = useState(true);
  const [forcedUnreadConversationIds, setForcedUnreadConversationIds] = useState<Set<string>>(new Set());
  const [followingUserIds, setFollowingUserIds] = useState<Set<string>>(new Set());
  const [hiddenConversationIds, setHiddenConversationIds] = useState<Set<string>>(new Set());
  const [lifeHelperApplications, setLifeHelperApplications] = useState<LifeHelperApplication[]>([]);
  const [lifeHelperBusinessApplications, setLifeHelperBusinessApplications] = useState<LifeHelperBusinessApplication[]>([]);
  const [lifeHelperPersonalApplications, setLifeHelperPersonalApplications] = useState<LifeHelperPersonalApplication[]>([]);
  const [lifeHelperRequests, setLifeHelperRequests] = useState<LifeHelperRequest[]>([]);
  const [messageRemarks, setMessageRemarks] = useState<Record<string, string>>({});
  const [mutedConversationIds, setMutedConversationIds] = useState<Set<string>>(new Set());
  const [pinnedConversationIds, setPinnedConversationIds] = useState<Set<string>>(new Set());
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [selectedCommunityQuickAction, setSelectedCommunityQuickAction] = useState<CommunityQuickActionId | null>(null);
  const [showLifeHelperThread, setShowLifeHelperThread] = useState(false);
  const [supabaseCommunityEnabled, setSupabaseCommunityEnabled] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    setReadIds(readAppNotificationIds());
    setFollowingUserIds(readCommunityFollowingUsers());
    const cached = getCachedNotifications();
    if (cached) {
      setAuthChecked(true);
      setCommunityNotifications(cached.communityNotifications);
      setCommunityUser(cached.communityUserId ? { avatarUrl: "", email: "", id: cached.communityUserId, isMock: false, name: "" } : null);
      setConversations(cached.conversations);
      setConversationError(cached.conversationError);
      setConversationsLoading(false);
      setLifeHelperRequests(cached.requests);
      setLifeHelperApplications(cached.applications);
      setLifeHelperBusinessApplications(cached.businessApplications);
      setLifeHelperPersonalApplications(cached.helpers);
      setSupabaseCommunityEnabled(cached.supabaseCommunityEnabled);
      setForcedUnreadConversationIds(readForcedUnreadMessageConversationIds());
      setHiddenConversationIds(new Set([...readHiddenMessageConversationIds(), ...readDeletedMessageConversationIds()]));
      setMessageRemarks(readMessageConversationRemarks());
      setMutedConversationIds(readMutedMessageConversationIds());
      setPinnedConversationIds(readPinnedMessageConversationIds());
    }
    let mounted = true;

    const loadLifeHelperData = async () => {
      try {
        const [requests, applications, joins] = await Promise.all([
          withNotificationTimeout(fetchLifeHelperRequests(), []),
          withNotificationTimeout(fetchLifeHelperApplications(), []),
          withNotificationTimeout(fetchLifeHelperJoinApplications(), { business: [], helpers: [] }),
        ]);
        if (!mounted) return;
        setLifeHelperRequests(requests);
        setLifeHelperApplications(applications);
        setLifeHelperBusinessApplications(joins.business);
        setLifeHelperPersonalApplications(joins.helpers);
      } catch {
        if (!mounted) return;
        setLifeHelperRequests([]);
        setLifeHelperApplications([]);
        setLifeHelperBusinessApplications([]);
        setLifeHelperPersonalApplications([]);
      }
    };

    void getCurrentCommunityUser().then(async (currentUser) => {
      if (!mounted) return;
      setCommunityUser(currentUser);
      setAuthChecked(true);
      if (!currentUser) {
        setConversationsLoading(false);
        return;
      }
      const warmed = await warmNotifications();

      if (!mounted) return;
      setSupabaseCommunityEnabled(warmed.supabaseCommunityEnabled);
      setCommunityNotifications(warmed.communityNotifications);
      setConversations(warmed.conversations);
      setForcedUnreadConversationIds(readForcedUnreadMessageConversationIds());
      setHiddenConversationIds(new Set([...readHiddenMessageConversationIds(), ...readDeletedMessageConversationIds()]));
      setMessageRemarks(readMessageConversationRemarks());
      setMutedConversationIds(readMutedMessageConversationIds());
      setPinnedConversationIds(readPinnedMessageConversationIds());
      setConversationError(warmed.conversationError);
      setConversationsLoading(false);
      void loadLifeHelperData();
    });

    if (!supabase) return () => {
      mounted = false;
    };

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setUser(data.session?.user ?? null);
      if (data.session?.user) void loadLifeHelperData();
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) setUser(session?.user ?? null);
      if (session?.user) void loadLifeHelperData();
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);
  const notifications = useMemo(() => {
    return buildLifeHelperNotifications(user, readIds, lifeHelperRequests, lifeHelperApplications, lifeHelperBusinessApplications, lifeHelperPersonalApplications, text, communityUser?.id)
      .sort((left, right) => notificationTime(right.createdAt) - notificationTime(left.createdAt));
  }, [communityUser?.id, lifeHelperApplications, lifeHelperBusinessApplications, lifeHelperPersonalApplications, lifeHelperRequests, readIds, text, user]);
  const communityInteractionNotifications = useMemo(() => {
    return communityNotifications
      .filter(isCommunityInteractionNotification)
      .map(toAppCommunityNotification)
      .sort((left, right) => notificationTime(right.createdAt) - notificationTime(left.createdAt));
  }, [communityNotifications]);

  const unreadCount = notifications.filter((notification) => !notification.isRead).length;
  const communityQuickItems = useMemo(
    () => communityQuickActions.map((action) => {
      const items = communityInteractionNotifications.filter((notification) => getCommunityQuickActionId(notification.communityNotification) === action.id);
      return {
        ...action,
        latest: items[0],
        unreadCount: items.filter((notification) => !notification.isRead).length,
      };
    }),
    [communityInteractionNotifications],
  );
  const selectedCommunityNotifications = useMemo(() => {
    if (!selectedCommunityQuickAction) return [];
    return communityInteractionNotifications.filter((notification) => getCommunityQuickActionId(notification.communityNotification) === selectedCommunityQuickAction);
  }, [communityInteractionNotifications, selectedCommunityQuickAction]);
  const visibleConversations = useMemo(
    () => {
      const hasOfficialConversation = conversations.some(isOfficialConversation);
      const mergedConversations = [
        ...conversations,
        ...(hasOfficialConversation ? [] : [buildOfficialConversation(communityUser?.id || user?.id || "", text)]),
        buildLifeHelperConversation(notifications, unreadCount, communityUser?.id || user?.id || "", text),
      ];
      const visibleItems = mergedConversations
        .filter((conversation) => isOfficialConversation(conversation) || isLifeHelperConversation(conversation) || !hiddenConversationIds.has(conversation.id))
        .map((conversation) => (
          isOfficialConversation(conversation) || isLifeHelperConversation(conversation)
            ? conversation
            : { ...conversation, otherUserName: messageRemarks[conversation.id] || conversation.otherUserName }
        ))
        .map((conversation) => (
          forcedUnreadConversationIds.has(conversation.id) && conversation.unreadCount === 0 && conversation.lastMessageSenderId !== communityUser?.id
            ? { ...conversation, unreadCount: 1 }
            : conversation
        ));
      return visibleItems.sort((left, right) => {
        const leftOfficial = isOfficialConversation(left);
        const rightOfficial = isOfficialConversation(right);
        if (leftOfficial !== rightOfficial) return leftOfficial ? -1 : 1;
        const leftLifeHelper = isLifeHelperConversation(left);
        const rightLifeHelper = isLifeHelperConversation(right);
        if (leftLifeHelper !== rightLifeHelper) return leftLifeHelper ? -1 : 1;
        const leftPinned = pinnedConversationIds.has(left.id);
        const rightPinned = pinnedConversationIds.has(right.id);
        if (leftPinned !== rightPinned) return leftPinned ? -1 : 1;
        return Date.parse(right.lastMessageAt || right.updatedAt) - Date.parse(left.lastMessageAt || left.updatedAt);
      });
    },
    [communityUser?.id, conversations, forcedUnreadConversationIds, hiddenConversationIds, messageRemarks, notifications, pinnedConversationIds, text, unreadCount, user?.id],
  );

  function saveReadIds(nextReadIds: Set<string>) {
    setReadIds(nextReadIds);
    writeAppNotificationIds(nextReadIds);
  }
  function markAllRead() {
    saveReadIds(new Set([...readIds, ...notifications.map((notification) => notification.id)]));
  }

  function markOneCommunityRead(notification: AppNotification) {
    if (!notification.communityNotification) return;
    const nextCommunityNotifications = communityNotifications.map((item) => (
      item.id === notification.communityNotification?.id ? { ...item, isRead: true } : item
    ));
    setCommunityNotifications(nextCommunityNotifications);
    if (supabaseCommunityEnabled) void markNotificationRead(notification.communityNotification.id, communityUser?.id);
    else writeCommunityNotifications(nextCommunityNotifications);
  }

  function openCommunityNotification(notification: AppNotification) {
    markOneCommunityRead(notification);
    if (notification.href) router.push(notification.href);
  }

  function openCommunityQuickAction(item: (typeof communityQuickItems)[number]) {
    setSelectedCommunityQuickAction(item.id);
  }

  function followBack(notification: AppNotification) {
    const actorId = getFollowActorId(notification);
    if (!actorId || followingUserIds.has(actorId)) {
      openCommunityNotification(notification);
      return;
    }
    const nextFollowingUserIds = new Set(followingUserIds);
    nextFollowingUserIds.add(actorId);
    setFollowingUserIds(nextFollowingUserIds);
    writeCommunityFollowingUsers(nextFollowingUserIds);
    markOneCommunityRead(notification);
  }

  function handleConversationMarkUnread(conversationId: string) {
    markMessageConversationUnread(conversationId);
    setForcedUnreadConversationIds(readForcedUnreadMessageConversationIds());
  }

  function handleConversationHide(conversationId: string) {
    hideMessageConversation(conversationId);
    setHiddenConversationIds(new Set([...readHiddenMessageConversationIds(), ...readDeletedMessageConversationIds()]));
  }

  function handleConversationDelete(conversationId: string) {
    deleteMessageConversationLocally(conversationId);
    setHiddenConversationIds(new Set([...readHiddenMessageConversationIds(), ...readDeletedMessageConversationIds()]));
  }

  function handleConversationActivate(conversationId: string) {
    if (conversationId !== lifeHelperNotificationConversationId) return;
    markAllRead();
    setShowLifeHelperThread(true);
  }

  if (!authChecked) {
    return (
      <main className="jl-tool-theme min-h-screen text-[#061a3a]">
        <div className="jl-tool-shell mx-auto min-h-screen w-full max-w-[430px] px-4 pb-32 pt-5">
          <div className="rounded-[24px] border border-white/80 bg-white/86 p-4 text-sm font-black text-[#2563EB] shadow-[0_12px_28px_rgba(15,76,129,0.08)]">{text.loading}</div>
        </div>
      </main>
    );
  }

  if (!communityUser) {
    return (
      <main className="jl-tool-theme min-h-screen text-[#061a3a]">
        <div className="jl-tool-shell mx-auto min-h-screen w-full max-w-[430px] px-4 pb-32 pt-5">
          <CommunityLoginRequiredCard description={text.loginDesc} title={text.loginTitle} />
        </div>
      </main>
    );
  }

  if (selectedCommunityQuickAction) {
    return (
      <CommunityQuickDetailPage
        actionId={selectedCommunityQuickAction}
        followingUserIds={followingUserIds}
        language={language}
        notifications={selectedCommunityNotifications}
        onBack={() => setSelectedCommunityQuickAction(null)}
        onFollowBack={followBack}
        onOpen={openCommunityNotification}
        text={text}
      />
    );
  }

  if (showLifeHelperThread) {
    return (
      <LifeHelperNotificationThread
        language={language}
        notifications={notifications}
        onBack={() => setShowLifeHelperThread(false)}
        text={text}
      />
    );
  }

  return (
    <main className="jl-tool-theme min-h-screen text-[#061a3a]">
      <div className="jl-tool-shell mx-auto min-h-screen w-full max-w-[430px] px-4 pb-32 pt-5">
        <header className="mb-5 grid grid-cols-[72px_1fr_72px] items-center">
          <span className="h-10" aria-hidden />
          <h1 className="text-center text-[20px] font-black tracking-normal text-[#111827]">{text.notification}</h1>
          <span className="h-10" aria-hidden />
        </header>

        <section className="mb-5 rounded-[28px] bg-white/92 px-3 py-4 shadow-[0_18px_42px_rgba(15,76,129,0.08)] ring-1 ring-blue-50">
          <div className="grid grid-cols-3 gap-2">
            {communityQuickItems.map((item) => (
              <TopIconButton
                icon={item.icon}
                key={item.id}
                label={text.communityActionLabels[item.id]}
                onClick={() => openCommunityQuickAction(item)}
                tone={item.tone}
                unreadCount={item.unreadCount}
              />
            ))}
          </div>
        </section>

        <section>
          {conversationsLoading ? (
            <div className="h-[74px]" aria-hidden />
          ) : conversationError ? (
            <EmptyState description={conversationError} text={text} />
          ) : visibleConversations.length === 0 ? (
            <EmptyState description={text.emptyMessages} text={text} />
          ) : (
            <div className="grid gap-3">
              {visibleConversations.map((conversation) => (
                <MessageConversationRow
                  compact
                  conversation={conversation}
                  fixed={isOfficialConversation(conversation) || isLifeHelperConversation(conversation)}
                  fixedIcon={isLifeHelperConversation(conversation) ? "notification" : "announcement"}
                  fixedLabel={isLifeHelperConversation(conversation) ? text.notification : text.announcement}
                  formatTime={formatMessageTime}
                  href={isLifeHelperConversation(conversation) ? "/notifications" : undefined}
                  key={conversation.id}
                  muted={mutedConversationIds.has(conversation.id)}
                  onActivate={handleConversationActivate}
                  actionLabels={text.actionLabels}
                  onDelete={handleConversationDelete}
                  onHide={handleConversationHide}
                  onMarkUnread={handleConversationMarkUnread}
                  pinned={isOfficialConversation(conversation) || isLifeHelperConversation(conversation) || pinnedConversationIds.has(conversation.id)}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function EmptyState({ description, text }: { description: string; text: NotificationText }) {
  return (
    <section className="rounded-[26px] bg-white/85 p-7 text-center shadow-[0_14px_34px_rgba(15,76,129,0.08)] ring-1 ring-blue-50">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-[#2563EB]">
        <MessageCircle className="h-7 w-7" />
      </div>
      <p className="mt-4 text-sm font-black leading-6 text-slate-500">{description}</p>
      <Link className="mt-5 inline-flex h-10 items-center justify-center rounded-full bg-[#2563EB] px-5 text-sm font-black text-white" href="/community/all" prefetch={false}>
        {text.community}
      </Link>
    </section>
  );
}

async function withNotificationTimeout<T>(promise: Promise<T>, fallback: T) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((resolve) => {
        timer = setTimeout(() => resolve(fallback), 2500);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

function isOfficialConversation(conversation: ConversationListItem) {
  return conversation.isOfficial || isJapanLifeOfficialUser(conversation.otherUserId);
}

function isLifeHelperConversation(conversation: ConversationListItem) {
  return conversation.id === lifeHelperNotificationConversationId;
}

function buildOfficialConversation(currentUserId: string, text: NotificationText): ConversationListItem {
  const now = new Date().toISOString();
  return {
    createdAt: now,
    id: japanLifeOfficialUserId,
    isOfficial: true,
    lastMessage: text.officialLast,
    lastMessageAt: now,
    lastMessageSenderId: japanLifeOfficialUserId,
    otherUserAvatar: "/images/app-icon.png",
    otherUserId: japanLifeOfficialUserId,
    otherUserName: "Japan Life Official",
    participantAId: japanLifeOfficialUserId,
    participantAName: "Japan Life Official",
    participantBId: currentUserId || "japan-life-viewer",
    participantBName: text.participantUser,
    unreadCount: 0,
    updatedAt: now,
  };
}

function buildLifeHelperConversation(notifications: AppNotification[], unreadCount: number, currentUserId: string, text: NotificationText): ConversationListItem {
  const latest = notifications[0];
  const createdAt = latest?.createdAt || "";
  return {
    createdAt,
    id: lifeHelperNotificationConversationId,
    lastMessage: latest?.detail || text.lifeHelperLast,
    lastMessageAt: createdAt,
    lastMessageSenderId: "life-helper-system",
    otherUserAvatar: "linear-gradient(135deg,#dbeafe,#ffffff,#bfdbfe)",
    otherUserId: "life-helper-system",
    otherUserName: text.lifeHelperName,
    participantAId: "life-helper-system",
    participantAName: text.lifeHelperName,
    participantBId: currentUserId || "life-helper-viewer",
    participantBName: text.participantUser,
    unreadCount,
    updatedAt: createdAt,
  };
}

function LifeHelperNotificationThread({ language, notifications, onBack, text }: { language: Language; notifications: AppNotification[]; onBack: () => void; text: NotificationText }) {
  return (
    <main className="min-h-screen bg-[#f5faff] text-[#061a3a]">
      <div className="mx-auto min-h-screen w-full max-w-[430px] bg-[#f5faff] pb-24">
        <header className="sticky top-0 z-30 grid h-[58px] grid-cols-[52px_1fr_52px] items-center border-b border-blue-50 bg-white/95 px-2 backdrop-blur">
          <button className="flex h-11 w-11 items-center justify-center rounded-full text-[#202124] transition active:bg-slate-100" onClick={onBack} type="button" aria-label={text.back}>
            <ArrowLeft className="h-7 w-7" />
          </button>
          <div className="min-w-0 text-center">
            <h1 className="truncate text-[18px] font-black">{text.lifeHelperName}</h1>
            <p className="truncate text-[11px] font-bold text-slate-400">{text.lifeHelperSubtitle}</p>
          </div>
          <span aria-hidden />
        </header>

        {notifications.length === 0 ? (
          <section className="px-6 py-16 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-[#2563EB] ring-1 ring-blue-100">
              <Bell className="h-8 w-8" />
            </div>
            <p className="mt-4 text-sm font-black text-slate-500">{text.noLifeHelper}</p>
          </section>
        ) : (
          <section className="space-y-4 px-4 py-5">
            {notifications.map((notification) => (
              <article className="flex items-start gap-3" key={notification.id}>
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-[#2563EB] ring-1 ring-blue-100">
                  <Bell className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1 rounded-[20px] rounded-tl-md bg-white px-4 py-3 shadow-[0_10px_24px_rgba(15,76,129,0.08)] ring-1 ring-blue-50">
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="min-w-0 text-sm font-black leading-5 text-[#061a3a]">{notification.title}</h2>
                    <span className="shrink-0 text-[11px] font-bold text-slate-400">{formatMessageTime(notification.createdAt, language, text)}</span>
                  </div>
                  <p className="mt-2 text-sm font-bold leading-6 text-slate-600">{notification.detail}</p>
                  {notification.meta ? <p className="mt-2 text-xs font-bold text-slate-400">{notification.meta}</p> : null}
                  <Link className="mt-3 inline-flex h-9 items-center justify-center rounded-full bg-[#2563EB] px-4 text-xs font-black text-white shadow-[0_8px_18px_rgba(37,99,235,0.18)]" href={notification.href} prefetch={false}>
                    {text.viewDetail}
                  </Link>
                </div>
              </article>
            ))}
          </section>
        )}
      </div>
    </main>
  );
}

function TopIconButton({
  icon: Icon,
  label,
  onClick,
  tone,
  unreadCount,
}: {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  tone: AppNotificationTone;
  unreadCount: number;
}) {
  const badgeText = unreadCount > 99 ? "99+" : String(unreadCount);
  return (
    <button
      className="relative flex min-w-0 flex-col items-center rounded-[22px] px-1.5 py-2.5 text-center transition active:scale-[0.98] active:bg-blue-50/70"
      onClick={onClick}
      type="button"
    >
      <span className={`relative flex h-[54px] w-[54px] items-center justify-center rounded-[20px] shadow-[0_10px_22px_rgba(15,76,129,0.06)] ${getQuickIconToneClass(tone)}`}>
        <Icon className={`h-7 w-7 stroke-[2.7] ${tone === "rose" ? "fill-current" : ""}`} />
        {unreadCount > 0 ? (
          <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#ff2d55] px-1.5 text-[10px] font-black leading-none text-white shadow-[0_4px_12px_rgba(255,45,85,0.28)] ring-2 ring-white">
            {badgeText}
          </span>
        ) : null}
      </span>
      <span className="mt-2 max-w-full truncate text-[13px] font-black leading-5 text-[#111827]">{label}</span>
    </button>
  );
}

function CommunityQuickDetailPage({
  actionId,
  followingUserIds,
  language,
  notifications,
  onBack,
  onFollowBack,
  onOpen,
  text,
}: {
  actionId: CommunityQuickActionId;
  followingUserIds: Set<string>;
  language: Language;
  notifications: AppNotification[];
  onBack: () => void;
  onFollowBack: (notification: AppNotification) => void;
  onOpen: (notification: AppNotification) => void;
  text: NotificationText;
}) {
  const action = communityQuickActions.find((item) => item.id === actionId) ?? communityQuickActions[0];
  const EmptyIcon = action.icon;
  return (
    <main className="min-h-screen bg-white text-[#202124]">
      <div className="mx-auto min-h-screen w-full max-w-[430px] bg-white pb-20">
        <header className="sticky top-0 z-30 grid h-[58px] grid-cols-[52px_1fr_52px] items-center border-b border-slate-100 bg-white/96 px-2 backdrop-blur">
          <button className="flex h-11 w-11 items-center justify-center rounded-full text-[#202124] transition active:bg-slate-100" onClick={onBack} type="button" aria-label={text.back}>
            <ArrowLeft className="h-7 w-7" />
          </button>
          <h1 className="truncate text-center text-[18px] font-black">{text.communityDetailTitles[actionId]}</h1>
          <span aria-hidden />
        </header>

        <section>
          {notifications.length === 0 ? (
            <section className="px-6 py-16 text-center">
              <div className={`mx-auto flex h-14 w-14 items-center justify-center rounded-[20px] ${getQuickIconToneClass(action.tone)}`}>
                <EmptyIcon className={`h-7 w-7 ${action.tone === "rose" ? "fill-current" : ""}`} />
              </div>
              <p className="mt-4 text-sm font-black text-slate-500">{text.noCategoryMessages}</p>
            </section>
          ) : notifications.map((notification) => (
            <CommunityQuickRow
              actionId={actionId}
              followingUserIds={followingUserIds}
              key={notification.id}
              notification={notification}
              onFollowBack={() => onFollowBack(notification)}
              onOpen={() => onOpen(notification)}
              language={language}
              text={text}
            />
          ))}
        </section>
      </div>
    </main>
  );
}

function CommunityQuickRow({ actionId, followingUserIds, language, notification, onFollowBack, onOpen, text }: { actionId: CommunityQuickActionId; followingUserIds: Set<string>; language: Language; notification: AppNotification; onFollowBack: () => void; onOpen: () => void; text: NotificationText }) {
  if (actionId === "follows") {
    return <FollowNotificationRow followingUserIds={followingUserIds} language={language} notification={notification} onFollowBack={onFollowBack} onOpen={onOpen} text={text} />;
  }
  if (actionId === "comments") {
    return <CommentNotificationRow language={language} notification={notification} onOpen={onOpen} text={text} />;
  }
  return <ReactionNotificationRow language={language} notification={notification} onOpen={onOpen} text={text} />;
}

function ReactionNotificationRow({ language, notification, onOpen, text }: { language: Language; notification: AppNotification; onOpen: () => void; text: NotificationText }) {
  const actor = getNotificationActorName(notification, text);
  const action = notification.communityNotification?.type === "favorite" ? text.favoritePost : getReactionActionText(notification, text);
  return (
    <button className="grid w-full grid-cols-[58px_minmax(0,1fr)_54px] gap-3 border-b border-slate-100 px-4 py-5 text-left transition active:bg-slate-50" onClick={onOpen} type="button">
      <NotificationAvatar name={actor} tone={notification.tone} />
      <span className="min-w-0">
        <span className="block truncate text-[17px] font-black text-[#2b2d33]">{actor}</span>
        <span className="mt-1 block text-[14px] font-bold text-slate-500">{action} <span className="ml-2">{formatMessageTime(notification.createdAt, language, text)}</span></span>
        <span className="mt-3 inline-flex rounded-full bg-slate-50 px-3 py-2 text-xs font-black text-[#475569]">
          {text.thanks}
        </span>
      </span>
      <NotificationThumb notification={notification} />
    </button>
  );
}

function FollowNotificationRow({ followingUserIds, language, notification, onFollowBack, onOpen, text }: { followingUserIds: Set<string>; language: Language; notification: AppNotification; onFollowBack: () => void; onOpen: () => void; text: NotificationText }) {
  const actor = getNotificationActorName(notification, text);
  const actorId = getFollowActorId(notification);
  const followed = Boolean(actorId && followingUserIds.has(actorId));
  return (
    <div className="grid grid-cols-[58px_minmax(0,1fr)_auto] items-center gap-3 border-b border-slate-100 px-4 py-5">
      <button className="contents text-left" onClick={onOpen} type="button">
        <NotificationAvatar name={actor} tone="blue" />
        <span className="min-w-0">
          <span className="block truncate text-[17px] font-black text-[#2b2d33]">{actor}</span>
          <span className="mt-1 block text-[14px] font-bold text-slate-500">{text.followedYou} {formatMessageTime(notification.createdAt, language, text)}</span>
        </span>
      </button>
      <button className={`h-9 rounded-full px-5 text-sm font-black transition ${followed ? "border border-slate-200 bg-white text-slate-600 active:bg-slate-50" : "border border-[#ef4b74] bg-white text-[#e23462] active:bg-rose-50"}`} onClick={onFollowBack} type="button">
        {followed ? text.mutualFollow : text.followBack}
      </button>
    </div>
  );
}

function CommentNotificationRow({ language, notification, onOpen, text }: { language: Language; notification: AppNotification; onOpen: () => void; text: NotificationText }) {
  const actor = getNotificationActorName(notification, text);
  const comment = getNotificationCommentText(notification);
  return (
    <button className="grid w-full grid-cols-[58px_minmax(0,1fr)_54px] gap-3 border-b border-slate-100 px-4 py-5 text-left transition active:bg-slate-50" onClick={onOpen} type="button">
      <NotificationAvatar name={actor} tone="green" />
      <span className="min-w-0">
        <span className="block truncate text-[17px] font-black text-[#2b2d33]">{actor}</span>
        <span className="mt-1 block text-[14px] font-bold text-slate-500">{notification.communityNotification?.type === "reply" ? text.repliedComment : text.commentedPost} <span className="ml-2">{formatMessageTime(notification.createdAt, language, text)}</span></span>
        {comment ? <span className="mt-2 line-clamp-2 block text-[15px] font-black leading-6 text-[#2b2d33]">{comment}</span> : null}
        <span className="mt-2 line-clamp-1 block border-l-4 border-slate-100 pl-2 text-[14px] font-bold text-slate-400">{getQuotedNotificationText(notification, text)}</span>
        <span className="mt-3 flex gap-3">
          <span className="inline-flex h-9 items-center gap-1 rounded-full bg-slate-50 px-4 text-xs font-black text-[#334155]">
            <Heart className="h-4 w-4" /> {text.like}
          </span>
          <span className="inline-flex h-9 items-center gap-1 rounded-full bg-slate-50 px-4 text-xs font-black text-[#334155]">
            <MessageCircle className="h-4 w-4" /> {text.reply}
          </span>
        </span>
      </span>
      <NotificationThumb notification={notification} />
    </button>
  );
}

function NotificationAvatar({ name, tone }: { name: string; tone: AppNotificationTone }) {
  return (
    <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-base font-black ring-1 ${getToneClass(tone)}`}>
      {name.trim().slice(0, 1).toUpperCase() || <UserRound className="h-6 w-6" />}
    </span>
  );
}

function NotificationThumb({ notification }: { notification: AppNotification }) {
  const Icon = notification.icon;
  return (
    <span className="mt-1 flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-[8px] bg-slate-50 text-slate-300 ring-1 ring-slate-100">
      <Icon className="h-5 w-5" />
    </span>
  );
}

function isCommunityInteractionNotification(notification: CommunityNotification) {
  return (
    notification.type === "like"
    || notification.type === "favorite"
    || notification.type === "comment"
    || notification.type === "reply"
    || (notification.targetType === "user" && `${notification.title} ${notification.message}`.includes("关注"))
  );
}

function toAppCommunityNotification(notification: CommunityNotification): AppNotification {
  return {
    id: `community:${notification.id}`,
    communityNotification: notification,
    createdAt: notification.createdAt,
    detail: notification.message,
    href: getCommunityNotificationHref(notification),
    icon: getCommunityNotificationIcon(notification),
    isRead: notification.isRead,
    meta: notification.createdAt,
    source: "community",
    title: notification.title || communityNotificationTypeLabels[notification.type],
    tone: getCommunityNotificationTone(notification.type),
  };
}

function getCommunityNotificationIcon(notification: CommunityNotification) {
  if (notification.type === "like") return Heart;
  if (notification.type === "favorite") return Star;
  if (notification.targetType === "user") return UserPlus;
  if (notification.type === "comment" || notification.type === "reply") return MessageCircle;
  return Bell;
}

function getCommunityNotificationHref(notification: CommunityNotification) {
  if (notification.targetType === "user" && notification.targetId) return getCommunityUserHref(notification.targetId);
  if (notification.postId) return getCommunityPostHref({ id: notification.postId, communityLocale: notification.communityLocale });
  return getCommunitySelectionHref();
}

function getCommunityNotificationTone(type: CommunityNotificationType): AppNotificationTone {
  if (type === "like" || type === "favorite") return "rose";
  if (type === "comment" || type === "reply") return "green";
  return "blue";
}

function getCommunityQuickActionId(notification?: CommunityNotification) {
  if (!notification) return "";
  if (notification.type === "like" || notification.type === "favorite") return "reactions";
  if (notification.type === "comment" || notification.type === "reply") return "comments";
  if (notification.targetType === "user") return "follows";
  return "";
}

function getFollowActorId(notification: AppNotification) {
  const item = notification.communityNotification;
  return item?.targetType === "user" ? item.targetId || "" : "";
}

function getNotificationActorName(notification: AppNotification, text?: NotificationText) {
  const detail = notification.detail.trim();
  const colonName = detail.match(/^([^:：]{1,24})[:：]/)?.[1]?.trim();
  if (colonName) return colonName;
  const followName = detail.match(/^(.{1,24}?)(?:\s*)关注了你/)?.[1]?.trim();
  if (followName) return followName;
  const spaceFollowName = detail.match(/^(.{1,24}?)\s+关注了你/)?.[1]?.trim();
  if (spaceFollowName) return spaceFollowName;
  return text?.communityUser ?? "Community user";
}

function getNotificationCommentText(notification: AppNotification) {
  const detail = notification.detail.trim();
  const colonIndex = detail.search(/[:：]/);
  if (colonIndex >= 0) return detail.slice(colonIndex + 1).trim() || detail;
  return detail;
}

function getQuotedNotificationText(notification: AppNotification, text: NotificationText) {
  if (notification.communityNotification?.type === "reply") return text.priorComment;
  if (notification.communityNotification?.postId) return text.yourPost;
  return notification.title;
}

function getReactionActionText(notification: AppNotification, text: NotificationText) {
  const detail = notification.detail;
  if (detail.includes("评论")) return text.likedComment;
  return text.likedPost;
}

function buildLifeHelperNotifications(
  user: User | null,
  readIds: Set<string>,
  requests: LifeHelperRequest[],
  applications: LifeHelperApplication[],
  businessApplications: LifeHelperBusinessApplication[],
  personalApplications: LifeHelperPersonalApplication[],
  text: NotificationText,
  communityUserId?: string,
): AppNotification[] {
  const requestById = new Map(requests.map((request) => [request.id, request]));
  const currentUserIds = new Set([user?.id, communityUserId].filter((value): value is string => Boolean(value)));

  const received = applications
    .filter((application) => {
      const request = requestById.get(application.requestId);
      return request && currentUserIds.has(request.authorId);
    })
    .map((application): AppNotification => {
      const request = requestById.get(application.requestId);
      const id = `life-helper:received:${application.id}`;
      return {
        id,
        createdAt: application.createdAt,
        detail: `${application.applicantName}: ${application.message}`,
        href: "/life-helper/manage?tab=requests",
        icon: Inbox,
        isRead: readIds.has(id),
        meta: request ? getLifeHelperCategoryLabel(request.category) : application.createdAt,
        source: "life-helper",
        title: request ? text.receivedApplicationTitle(request.title) : text.receivedApplicationFallback,
        tone: "green",
      };
    });

  const sent = applications
    .filter((application) => currentUserIds.has(application.applicantId))
    .map((application): AppNotification => {
      const request = requestById.get(application.requestId);
      const id = `life-helper:sent:${application.id}:${application.status}`;
      return {
        id,
        createdAt: application.createdAt,
        detail: application.status === "sent" ? text.sentApplication : text.applicationStatus(application.status),
        href: "/life-helper/manage?tab=applications",
        icon: Handshake,
        isRead: readIds.has(id),
        meta: application.createdAt,
        source: "life-helper",
        title: request ? text.appliedTitle(request.title) : text.appliedFallback,
        tone: application.status === "sent" ? "blue" : "orange",
      };
    });

  const joins = [...businessApplications, ...personalApplications]
    .filter((application) => currentUserIds.has(application.userId))
    .map((application): AppNotification => {
      const id = `life-helper:join:${application.id}:${application.status}`;
      const name = application.type === "business" ? application.businessName : application.displayName;
      return {
        id,
        createdAt: application.createdAt,
        detail: getLifeHelperJoinMessage(application.status, text),
        href: "/life-helper/manage?tab=services",
        icon: UserRound,
        isRead: readIds.has(id),
        meta: application.createdAt,
        source: "life-helper",
        title: text.joinTitle(name),
        tone: application.status === "approved" ? "green" : application.status === "rejected" ? "rose" : "orange",
      };
    });

  return [...received, ...sent, ...joins];
}

function getLifeHelperJoinMessage(status: "approved" | "pending" | "rejected", text: NotificationText) {
  if (status === "approved") return text.joinApproved;
  if (status === "rejected") return text.joinRejected;
  return text.joinPending;
}

function formatMessageTime(value: string, language: Language = "zh-CN", text: NotificationText = notificationCopy["zh-CN"]) {
  const timestamp = notificationTime(value);
  if (!timestamp) return value || "";

  const date = new Date(timestamp);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfMessageDay = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const locale = language === "ja" ? "ja-JP" : language === "zh-TW" ? "zh-TW" : "zh-CN";
  const time = new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);

  if (startOfMessageDay === startOfToday) return time;
  if (startOfMessageDay === startOfToday - 24 * 60 * 60 * 1000) return `${text.yesterday} ${time}`;
  if (date.getFullYear() === now.getFullYear()) {
    return new Intl.DateTimeFormat(locale, {
      day: "2-digit",
      month: "2-digit",
    }).format(date);
  }
  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function notificationTime(value: string) {
  if (!value) return 0;
  const dateTime = new Date(value);
  if (!Number.isNaN(dateTime.getTime())) return dateTime.getTime();
  const monthDay = value.match(/^(\d{2})\/(\d{2})\s+(\d{2}):(\d{2})/);
  if (monthDay) {
    const [, month, day, hour, minute] = monthDay;
    return new Date(new Date().getFullYear(), Number(month) - 1, Number(day), Number(hour), Number(minute)).getTime();
  }
  const dateOnly = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (dateOnly) return new Date(value).getTime();
  return 0;
}

function readAppNotificationIds() {
  if (typeof window === "undefined") return new Set<string>();
  try {
    const raw = window.localStorage.getItem(appNotificationReadIdsKey);
    const parsed = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : []);
  } catch {
    return new Set<string>();
  }
}

function writeAppNotificationIds(ids: Set<string>) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(appNotificationReadIdsKey, JSON.stringify([...ids].slice(-500)));
}

function getQuickIconToneClass(tone: AppNotificationTone) {
  if (tone === "green") return "bg-emerald-50 text-emerald-500 shadow-[0_10px_22px_rgba(16,185,129,0.14)]";
  if (tone === "rose") return "bg-rose-50 text-[#ff4d5f] shadow-[0_10px_22px_rgba(244,63,94,0.14)]";
  if (tone === "orange") return "bg-orange-50 text-orange-500 shadow-[0_10px_22px_rgba(249,115,22,0.14)]";
  if (tone === "violet") return "bg-violet-50 text-violet-500 shadow-[0_10px_22px_rgba(139,92,246,0.14)]";
  return "bg-blue-50 text-[#2f7df6] shadow-[0_10px_22px_rgba(59,130,246,0.14)]";
}

function getToneClass(tone: AppNotificationTone) {
  if (tone === "green") return "bg-emerald-50 text-emerald-600 ring-emerald-100";
  if (tone === "orange") return "bg-orange-50 text-orange-600 ring-orange-100";
  if (tone === "rose") return "bg-rose-50 text-rose-600 ring-rose-100";
  if (tone === "violet") return "bg-violet-50 text-violet-600 ring-violet-100";
  return "bg-blue-50 text-[#2563EB] ring-blue-100";
}
