"use client";

import type { User } from "@supabase/supabase-js";
import { ArrowLeft, Bell, Handshake, Heart, Inbox, MessageCircle, Star, UserPlus, UserRound } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { CommunityLoginRequiredCard } from "@/components/community/CommunityLoginRequiredCard";
import { MessageConversationRow } from "@/components/messages/MessageConversationRow";
import { getCurrentCommunityUser, type CommunityUser } from "@/lib/community/currentUser";
import { readCommunityFollowingUsers, writeCommunityFollowingUsers } from "@/lib/community/follow";
import { getCommunityPostHref, getCommunitySelectionHref, getCommunityUserHref } from "@/lib/community/routes";
import { getNotifications, markNotificationRead, readCommunityNotifications, writeCommunityNotifications } from "@/lib/community/repository";
import { communityNotificationTypeLabels, type CommunityNotification, type CommunityNotificationType } from "@/lib/community/types";
import { fetchLifeHelperApplications, fetchLifeHelperJoinApplications, fetchLifeHelperRequests } from "@/lib/lifeHelper/api";
import type { LifeHelperBusinessApplication, LifeHelperPersonalApplication } from "@/lib/lifeHelper/join";
import { getLifeHelperCategoryLabel, type LifeHelperApplication, type LifeHelperRequest } from "@/lib/lifeHelper/types";
import { isJapanLifeOfficialUser, japanLifeOfficialUserId, listMyConversations } from "@/lib/messages/api";
import { deleteMessageConversationLocally, hideMessageConversation, markMessageConversationUnread, readDeletedMessageConversationIds, readForcedUnreadMessageConversationIds, readHiddenMessageConversationIds, readMessageConversationRemarks, readMutedMessageConversationIds, readPinnedMessageConversationIds } from "@/lib/messages/listActions";
import type { ConversationListItem } from "@/lib/messages/types";
import { supabase } from "@/lib/supabase";

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
  { id: "reactions", label: "赞和收藏", icon: Heart, tone: "rose" as const },
  { id: "follows", label: "新增关注", icon: UserPlus, tone: "blue" as const },
  { id: "comments", label: "评论和 @", icon: MessageCircle, tone: "green" as const },
] satisfies { id: CommunityQuickActionId; label: string; icon: LucideIcon; tone: AppNotificationTone }[];



export function GlobalNotificationsCenter() {
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
      const [notificationResult, conversationResult] = await Promise.all([
        getNotifications(currentUser.id),
        withNotificationTimeout(listMyConversations(), { data: [], error: "私信加载超时，请稍后再试。", source: "fallback" as const }),
      ]);

      if (!mounted) return;
      if (notificationResult.source === "supabase") {
        setSupabaseCommunityEnabled(true);
        setCommunityNotifications(notificationResult.data);
      } else {
        setCommunityNotifications(readCommunityNotifications().filter((notification) => notification.userId === currentUser.id));
      }
      setConversations(conversationResult.data ?? []);
      setForcedUnreadConversationIds(readForcedUnreadMessageConversationIds());
      setHiddenConversationIds(new Set([...readHiddenMessageConversationIds(), ...readDeletedMessageConversationIds()]));
      setMessageRemarks(readMessageConversationRemarks());
      setMutedConversationIds(readMutedMessageConversationIds());
      setPinnedConversationIds(readPinnedMessageConversationIds());
      setConversationError(conversationResult.error);
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
    return buildLifeHelperNotifications(user, readIds, lifeHelperRequests, lifeHelperApplications, lifeHelperBusinessApplications, lifeHelperPersonalApplications, communityUser?.id)
      .sort((left, right) => notificationTime(right.createdAt) - notificationTime(left.createdAt));
  }, [communityUser?.id, lifeHelperApplications, lifeHelperBusinessApplications, lifeHelperPersonalApplications, lifeHelperRequests, readIds, user]);
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
        ...(hasOfficialConversation ? [] : [buildOfficialConversation(communityUser?.id || user?.id || "")]),
        buildLifeHelperConversation(notifications, unreadCount, communityUser?.id || user?.id || ""),
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
    [communityUser?.id, conversations, forcedUnreadConversationIds, hiddenConversationIds, messageRemarks, notifications, pinnedConversationIds, unreadCount, user?.id],
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
          <div className="rounded-[24px] border border-white/80 bg-white/86 p-4 text-sm font-black text-[#2563EB] shadow-[0_12px_28px_rgba(15,76,129,0.08)]">加载中...</div>
        </div>
      </main>
    );
  }

  if (!communityUser) {
    return (
      <main className="jl-tool-theme min-h-screen text-[#061a3a]">
        <div className="jl-tool-shell mx-auto min-h-screen w-full max-w-[430px] px-4 pb-32 pt-5">
          <CommunityLoginRequiredCard description="登录后可以查看消息和私信。" title="请先登录" />
        </div>
      </main>
    );
  }

  if (selectedCommunityQuickAction) {
    return (
      <CommunityQuickDetailPage
        actionId={selectedCommunityQuickAction}
        followingUserIds={followingUserIds}
        notifications={selectedCommunityNotifications}
        onBack={() => setSelectedCommunityQuickAction(null)}
        onFollowBack={followBack}
        onOpen={openCommunityNotification}
      />
    );
  }

  if (showLifeHelperThread) {
    return (
      <LifeHelperNotificationThread
        notifications={notifications}
        onBack={() => setShowLifeHelperThread(false)}
      />
    );
  }

  return (
    <main className="jl-tool-theme min-h-screen text-[#061a3a]">
      <div className="jl-tool-shell mx-auto min-h-screen w-full max-w-[430px] px-4 pb-32 pt-5">
        <section className="mb-5 grid grid-cols-3 gap-3">
          {communityQuickItems.map((item) => (
            <TopIconButton
              icon={item.icon}
              key={item.id}
              label={item.label}
              onClick={() => openCommunityQuickAction(item)}
              tone={item.tone}
              unreadCount={item.unreadCount}
            />
          ))}
        </section>

        <section>
          {conversationsLoading ? (
            <div className="h-[74px]" aria-hidden />
          ) : conversationError ? (
            <EmptyState description={conversationError} />
          ) : visibleConversations.length === 0 ? (
            <EmptyState description="还没有私信，去社区认识新朋友吧" />
          ) : (
            <div className="grid gap-1">
              {visibleConversations.map((conversation) => (
                <MessageConversationRow
                  compact
                  conversation={conversation}
                  fixed={isOfficialConversation(conversation) || isLifeHelperConversation(conversation)}
                  fixedIcon={isLifeHelperConversation(conversation) ? "notification" : "announcement"}
                  fixedLabel={isLifeHelperConversation(conversation) ? "通知" : "公告"}
                  formatTime={formatMessageTime}
                  href={isLifeHelperConversation(conversation) ? "/notifications" : undefined}
                  key={conversation.id}
                  muted={mutedConversationIds.has(conversation.id)}
                  onActivate={handleConversationActivate}
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

function EmptyState({ description }: { description: string }) {
  return (
    <section className="rounded-[26px] bg-white/85 p-7 text-center shadow-[0_14px_34px_rgba(15,76,129,0.08)] ring-1 ring-blue-50">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-[#2563EB]">
        <MessageCircle className="h-7 w-7" />
      </div>
      <p className="mt-4 text-sm font-black leading-6 text-slate-500">{description}</p>
      <Link className="mt-5 inline-flex h-10 items-center justify-center rounded-full bg-[#2563EB] px-5 text-sm font-black text-white" href="/community/all" prefetch={false}>
        去社区看看
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

function buildOfficialConversation(currentUserId: string): ConversationListItem {
  const now = new Date().toISOString();
  return {
    createdAt: now,
    id: japanLifeOfficialUserId,
    isOfficial: true,
    lastMessage: "官方公告、重要更新和系统通知会显示在这里。",
    lastMessageAt: now,
    lastMessageSenderId: japanLifeOfficialUserId,
    otherUserAvatar: "/images/app-icon.png",
    otherUserId: japanLifeOfficialUserId,
    otherUserName: "Japan Life Official",
    participantAId: japanLifeOfficialUserId,
    participantAName: "Japan Life Official",
    participantBId: currentUserId || "japan-life-viewer",
    participantBName: "Japan Life 用户",
    unreadCount: 0,
    updatedAt: now,
  };
}

function buildLifeHelperConversation(notifications: AppNotification[], unreadCount: number, currentUserId: string): ConversationListItem {
  const latest = notifications[0];
  const createdAt = latest?.createdAt || "";
  return {
    createdAt,
    id: lifeHelperNotificationConversationId,
    lastMessage: latest?.detail || "需求申请、申请状态和入驻审核结果会显示在这里。",
    lastMessageAt: createdAt,
    lastMessageSenderId: "life-helper-system",
    otherUserAvatar: "linear-gradient(135deg,#dbeafe,#ffffff,#bfdbfe)",
    otherUserId: "life-helper-system",
    otherUserName: "生活帮手通知",
    participantAId: "life-helper-system",
    participantAName: "生活帮手通知",
    participantBId: currentUserId || "life-helper-viewer",
    participantBName: "Japan Life 用户",
    unreadCount,
    updatedAt: createdAt,
  };
}

function LifeHelperNotificationThread({ notifications, onBack }: { notifications: AppNotification[]; onBack: () => void }) {
  return (
    <main className="min-h-screen bg-[#f5faff] text-[#061a3a]">
      <div className="mx-auto min-h-screen w-full max-w-[430px] bg-[#f5faff] pb-24">
        <header className="sticky top-0 z-30 grid h-[58px] grid-cols-[52px_1fr_52px] items-center border-b border-blue-50 bg-white/95 px-2 backdrop-blur">
          <button className="flex h-11 w-11 items-center justify-center rounded-full text-[#202124] transition active:bg-slate-100" onClick={onBack} type="button" aria-label="返回">
            <ArrowLeft className="h-7 w-7" />
          </button>
          <div className="min-w-0 text-center">
            <h1 className="truncate text-[18px] font-black">生活帮手通知</h1>
            <p className="truncate text-[11px] font-bold text-slate-400">申请、状态和审核结果</p>
          </div>
          <span aria-hidden />
        </header>

        {notifications.length === 0 ? (
          <section className="px-6 py-16 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-[#2563EB] ring-1 ring-blue-100">
              <Bell className="h-8 w-8" />
            </div>
            <p className="mt-4 text-sm font-black text-slate-500">暂无生活帮手通知</p>
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
                    <span className="shrink-0 text-[11px] font-bold text-slate-400">{formatMessageTime(notification.createdAt)}</span>
                  </div>
                  <p className="mt-2 text-sm font-bold leading-6 text-slate-600">{notification.detail}</p>
                  {notification.meta ? <p className="mt-2 text-xs font-bold text-slate-400">{notification.meta}</p> : null}
                  <Link className="mt-3 inline-flex h-9 items-center justify-center rounded-full bg-[#2563EB] px-4 text-xs font-black text-white shadow-[0_8px_18px_rgba(37,99,235,0.18)]" href={notification.href} prefetch={false}>
                    查看详情
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
      className="relative flex min-w-0 flex-col items-center gap-2 text-center transition active:scale-[0.98]"
      onClick={onClick}
      type="button"
    >
      <span className={`relative flex h-[62px] w-[62px] items-center justify-center rounded-[22px] ${getQuickIconToneClass(tone)}`}>
        <Icon className={`h-8 w-8 stroke-[2.6] ${tone === "rose" ? "fill-current" : ""}`} />
        {unreadCount > 0 ? (
          <span className="absolute -right-2 -top-2 flex h-6 min-w-6 items-center justify-center rounded-full bg-[#ff2d55] px-1.5 text-[11px] font-black leading-none text-white shadow-[0_4px_12px_rgba(255,45,85,0.28)] ring-2 ring-white">
            {badgeText}
          </span>
        ) : null}
      </span>
      <span className="truncate text-[15px] font-black text-[#30323a]">{label}</span>
    </button>
  );
}

function CommunityQuickDetailPage({
  actionId,
  followingUserIds,
  notifications,
  onBack,
  onFollowBack,
  onOpen,
}: {
  actionId: CommunityQuickActionId;
  followingUserIds: Set<string>;
  notifications: AppNotification[];
  onBack: () => void;
  onFollowBack: (notification: AppNotification) => void;
  onOpen: (notification: AppNotification) => void;
}) {
  const action = communityQuickActions.find((item) => item.id === actionId) ?? communityQuickActions[0];
  const EmptyIcon = action.icon;
  return (
    <main className="min-h-screen bg-white text-[#202124]">
      <div className="mx-auto min-h-screen w-full max-w-[430px] bg-white pb-20">
        <header className="sticky top-0 z-30 grid h-[58px] grid-cols-[52px_1fr_52px] items-center border-b border-slate-100 bg-white/96 px-2 backdrop-blur">
          <button className="flex h-11 w-11 items-center justify-center rounded-full text-[#202124] transition active:bg-slate-100" onClick={onBack} type="button" aria-label="返回">
            <ArrowLeft className="h-7 w-7" />
          </button>
          <h1 className="truncate text-center text-[18px] font-black">{getCommunityQuickDetailTitle(actionId)}</h1>
          <span aria-hidden />
        </header>

        <section>
          {notifications.length === 0 ? (
            <section className="px-6 py-16 text-center">
              <div className={`mx-auto flex h-14 w-14 items-center justify-center rounded-[20px] ${getQuickIconToneClass(action.tone)}`}>
                <EmptyIcon className={`h-7 w-7 ${action.tone === "rose" ? "fill-current" : ""}`} />
              </div>
              <p className="mt-4 text-sm font-black text-slate-500">暂时没有这类消息</p>
            </section>
          ) : notifications.map((notification) => (
            <CommunityQuickRow
              actionId={actionId}
              followingUserIds={followingUserIds}
              key={notification.id}
              notification={notification}
              onFollowBack={() => onFollowBack(notification)}
              onOpen={() => onOpen(notification)}
            />
          ))}
        </section>
      </div>
    </main>
  );
}

function CommunityQuickRow({ actionId, followingUserIds, notification, onFollowBack, onOpen }: { actionId: CommunityQuickActionId; followingUserIds: Set<string>; notification: AppNotification; onFollowBack: () => void; onOpen: () => void }) {
  if (actionId === "follows") {
    return <FollowNotificationRow followingUserIds={followingUserIds} notification={notification} onFollowBack={onFollowBack} onOpen={onOpen} />;
  }
  if (actionId === "comments") {
    return <CommentNotificationRow notification={notification} onOpen={onOpen} />;
  }
  return <ReactionNotificationRow notification={notification} onOpen={onOpen} />;
}

function ReactionNotificationRow({ notification, onOpen }: { notification: AppNotification; onOpen: () => void }) {
  const actor = getNotificationActorName(notification);
  const action = notification.communityNotification?.type === "favorite" ? "收藏了你的笔记" : getReactionActionText(notification);
  return (
    <button className="grid w-full grid-cols-[58px_minmax(0,1fr)_54px] gap-3 border-b border-slate-100 px-4 py-5 text-left transition active:bg-slate-50" onClick={onOpen} type="button">
      <NotificationAvatar name={actor} tone={notification.tone} />
      <span className="min-w-0">
        <span className="block truncate text-[17px] font-black text-[#2b2d33]">{actor}</span>
        <span className="mt-1 block text-[14px] font-bold text-slate-500">{action} <span className="ml-2">{formatMessageTime(notification.createdAt)}</span></span>
        <span className="mt-3 inline-flex rounded-full bg-slate-50 px-3 py-2 text-xs font-black text-[#475569]">
          私信感谢
        </span>
      </span>
      <NotificationThumb notification={notification} />
    </button>
  );
}

function FollowNotificationRow({ followingUserIds, notification, onFollowBack, onOpen }: { followingUserIds: Set<string>; notification: AppNotification; onFollowBack: () => void; onOpen: () => void }) {
  const actor = getNotificationActorName(notification);
  const actorId = getFollowActorId(notification);
  const followed = Boolean(actorId && followingUserIds.has(actorId));
  return (
    <div className="grid grid-cols-[58px_minmax(0,1fr)_auto] items-center gap-3 border-b border-slate-100 px-4 py-5">
      <button className="contents text-left" onClick={onOpen} type="button">
        <NotificationAvatar name={actor} tone="blue" />
        <span className="min-w-0">
          <span className="block truncate text-[17px] font-black text-[#2b2d33]">{actor}</span>
          <span className="mt-1 block text-[14px] font-bold text-slate-500">开始关注你了 {formatMessageTime(notification.createdAt)}</span>
        </span>
      </button>
      <button className={`h-9 rounded-full px-5 text-sm font-black transition ${followed ? "border border-slate-200 bg-white text-slate-600 active:bg-slate-50" : "border border-[#ef4b74] bg-white text-[#e23462] active:bg-rose-50"}`} onClick={onFollowBack} type="button">
        {followed ? "互相关注" : "回关"}
      </button>
    </div>
  );
}

function CommentNotificationRow({ notification, onOpen }: { notification: AppNotification; onOpen: () => void }) {
  const actor = getNotificationActorName(notification);
  const comment = getNotificationCommentText(notification);
  return (
    <button className="grid w-full grid-cols-[58px_minmax(0,1fr)_54px] gap-3 border-b border-slate-100 px-4 py-5 text-left transition active:bg-slate-50" onClick={onOpen} type="button">
      <NotificationAvatar name={actor} tone="green" />
      <span className="min-w-0">
        <span className="block truncate text-[17px] font-black text-[#2b2d33]">{actor}</span>
        <span className="mt-1 block text-[14px] font-bold text-slate-500">{notification.communityNotification?.type === "reply" ? "回复了你的评论" : "评论了你的笔记"} <span className="ml-2">{formatMessageTime(notification.createdAt)}</span></span>
        {comment ? <span className="mt-2 line-clamp-2 block text-[15px] font-black leading-6 text-[#2b2d33]">{comment}</span> : null}
        <span className="mt-2 line-clamp-1 block border-l-4 border-slate-100 pl-2 text-[14px] font-bold text-slate-400">{getQuotedNotificationText(notification)}</span>
        <span className="mt-3 flex gap-3">
          <span className="inline-flex h-9 items-center gap-1 rounded-full bg-slate-50 px-4 text-xs font-black text-[#334155]">
            <Heart className="h-4 w-4" /> 赞
          </span>
          <span className="inline-flex h-9 items-center gap-1 rounded-full bg-slate-50 px-4 text-xs font-black text-[#334155]">
            <MessageCircle className="h-4 w-4" /> 回复
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

function getCommunityQuickDetailTitle(actionId: CommunityQuickActionId) {
  if (actionId === "reactions") return "收到的赞和收藏";
  if (actionId === "follows") return "新增关注";
  return "收到的评论和 @";
}

function getNotificationActorName(notification: AppNotification) {
  const detail = notification.detail.trim();
  const colonName = detail.match(/^([^:：]{1,24})[:：]/)?.[1]?.trim();
  if (colonName) return colonName;
  const followName = detail.match(/^(.{1,24}?)(?:\s*)关注了你/)?.[1]?.trim();
  if (followName) return followName;
  const spaceFollowName = detail.match(/^(.{1,24}?)\s+关注了你/)?.[1]?.trim();
  if (spaceFollowName) return spaceFollowName;
  return "社区用户";
}

function getNotificationCommentText(notification: AppNotification) {
  const detail = notification.detail.trim();
  const colonIndex = detail.search(/[:：]/);
  if (colonIndex >= 0) return detail.slice(colonIndex + 1).trim() || detail;
  return detail;
}

function getQuotedNotificationText(notification: AppNotification) {
  if (notification.communityNotification?.type === "reply") return "你之前的评论";
  if (notification.communityNotification?.postId) return "你的社区笔记";
  return notification.title;
}

function getReactionActionText(notification: AppNotification) {
  const detail = notification.detail;
  if (detail.includes("评论")) return "赞了你的评论";
  return "赞了你的笔记";
}

function buildLifeHelperNotifications(
  user: User | null,
  readIds: Set<string>,
  requests: LifeHelperRequest[],
  applications: LifeHelperApplication[],
  businessApplications: LifeHelperBusinessApplication[],
  personalApplications: LifeHelperPersonalApplication[],
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
        title: request ? `收到「${request.title}」的申请` : "收到生活帮手申请",
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
        detail: application.status === "sent" ? "申请已发送，等待发布者确认。" : `申请状态：${application.status}`,
        href: "/life-helper/manage?tab=applications",
        icon: Handshake,
        isRead: readIds.has(id),
        meta: application.createdAt,
        source: "life-helper",
        title: request ? `你申请了「${request.title}」` : "生活帮手申请状态",
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
        detail: getLifeHelperJoinMessage(application.status),
        href: "/life-helper/manage?tab=services",
        icon: UserRound,
        isRead: readIds.has(id),
        meta: application.createdAt,
        source: "life-helper",
        title: `入驻申请：${name}`,
        tone: application.status === "approved" ? "green" : application.status === "rejected" ? "rose" : "orange",
      };
    });

  return [...received, ...sent, ...joins];
}

function getLifeHelperJoinMessage(status: "approved" | "pending" | "rejected") {
  if (status === "approved") return "你的生活帮手入驻申请已通过。";
  if (status === "rejected") return "你的生活帮手入驻申请暂未通过，可以检查资料后再提交。";
  return "你的生活帮手入驻申请正在审核中。";
}

function formatMessageTime(value: string) {
  const timestamp = notificationTime(value);
  if (!timestamp) return value || "";

  const date = new Date(timestamp);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfMessageDay = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const time = new Intl.DateTimeFormat("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);

  if (startOfMessageDay === startOfToday) return time;
  if (startOfMessageDay === startOfToday - 24 * 60 * 60 * 1000) return `昨天 ${time}`;
  if (date.getFullYear() === now.getFullYear()) {
    return new Intl.DateTimeFormat("zh-CN", {
      day: "2-digit",
      month: "2-digit",
    }).format(date);
  }
  return new Intl.DateTimeFormat("zh-CN", {
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
