"use client";

import { MessageCircle, Search } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { BackButton } from "@/components/BackButton";
import { MessageConversationRow } from "@/components/messages/MessageConversationRow";
import { useLanguage } from "@/hooks/useLanguage";
import { getCachedNotifications, warmNotifications } from "@/lib/appPreload";
import { getCurrentMessageUser, isJapanLifeOfficialUser, japanLifeOfficialUserId, shouldUseRealMessageAuth } from "@/lib/messages/api";
import { deleteMessageConversationLocally, hideMessageConversation, markMessageConversationUnread, readDeletedMessageConversationIds, readForcedUnreadMessageConversationIds, readHiddenMessageConversationIds, readMessageConversationRemarks, readMutedMessageConversationIds, readPinnedMessageConversationIds } from "@/lib/messages/listActions";
import type { ConversationListItem } from "@/lib/messages/types";

const lifeHelperNotificationConversationId = "life-helper-notification-conversation";

const messagesCopy = {
  "zh-CN": {
    title: "私信",
    search: "搜索聊天",
    empty: "还没有私信，去社区认识新朋友吧。",
    fixedNotification: "通知",
    fixedAnnouncement: "公告",
    loginTitle: "请先登录",
    loginDesc: "登录后可以查看和发送 1 对 1 私信。",
    login: "去登录",
    community: "去社区看看",
    officialLast: "官方公告、重要更新和系统通知会显示在这里。",
    participantUser: "Japan Life 用户",
    lifeHelperLast: "需求申请、申请状态和入驻审核结果会显示在这里。",
    lifeHelperName: "生活帮手通知",
    actionLabels: { announcement: "公告", delete: "删除", hidden: "不显示", markUnread: "标为未读", muted: "静音", pinned: "置顶", startChat: "开始聊天吧", unread: "未读消息", userFallback: "Japan Life 用户" },
  },
  "zh-TW": {
    title: "私訊",
    search: "搜尋聊天",
    empty: "還沒有私訊，去社群認識新朋友吧。",
    fixedNotification: "通知",
    fixedAnnouncement: "公告",
    loginTitle: "請先登入",
    loginDesc: "登入後可以查看和發送 1 對 1 私訊。",
    login: "去登入",
    community: "去社群看看",
    officialLast: "官方公告、重要更新和系統通知會顯示在這裡。",
    participantUser: "Japan Life 用戶",
    lifeHelperLast: "需求申請、申請狀態和入駐審核結果會顯示在這裡。",
    lifeHelperName: "生活幫手通知",
    actionLabels: { announcement: "公告", delete: "刪除", hidden: "不顯示", markUnread: "標為未讀", muted: "靜音", pinned: "置頂", startChat: "開始聊天吧", unread: "未讀訊息", userFallback: "Japan Life 用戶" },
  },
  ja: {
    title: "メッセージ",
    search: "チャットを検索",
    empty: "まだメッセージはありません。コミュニティで新しい人とつながれます。",
    fixedNotification: "通知",
    fixedAnnouncement: "お知らせ",
    loginTitle: "ログインしてください",
    loginDesc: "ログインすると 1 対 1 のメッセージを確認・送信できます。",
    login: "ログイン",
    community: "コミュニティを見る",
    officialLast: "公式のお知らせ、重要な更新、システム通知がここに表示されます。",
    participantUser: "Japan Life ユーザー",
    lifeHelperLast: "依頼応募、応募ステータス、登録審査結果がここに表示されます。",
    lifeHelperName: "生活サポート通知",
    actionLabels: { announcement: "お知らせ", delete: "削除", hidden: "非表示", markUnread: "未読にする", muted: "ミュート", pinned: "固定", startChat: "チャットを始めましょう", unread: "未読メッセージ", userFallback: "Japan Life ユーザー" },
  },
} as const;

export default function MessagesPage() {
  const { language } = useLanguage();
  const text = messagesCopy[language];
  const pathname = usePathname();
  const loginHref = `/login?redirect=${encodeURIComponent(pathname || "/messages")}`;
  const [authRequired, setAuthRequired] = useState(false);
  const [conversations, setConversations] = useState<ConversationListItem[]>([]);
  const [currentUserId, setCurrentUserId] = useState("");
  const [error, setError] = useState("");
  const [forcedUnreadIds, setForcedUnreadIds] = useState<Set<string>>(new Set());
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [mutedIds, setMutedIds] = useState<Set<string>>(new Set());
  const [pinnedIds, setPinnedIds] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState("");
  const [remarks, setRemarks] = useState<Record<string, string>>({});

  useEffect(() => {
    let mounted = true;
    const cached = getCachedNotifications();
    if (cached) {
      setCurrentUserId(cached.communityUserId);
      setConversations(cached.conversations);
      setError(cached.conversationError);
      setForcedUnreadIds(readForcedUnreadMessageConversationIds());
      setHiddenIds(new Set([...readHiddenMessageConversationIds(), ...readDeletedMessageConversationIds()]));
      setMutedIds(readMutedMessageConversationIds());
      setPinnedIds(readPinnedMessageConversationIds());
      setRemarks(readMessageConversationRemarks());
      setLoading(false);
    }
    async function load() {
      const user = await getCurrentMessageUser();
      if (shouldUseRealMessageAuth() && user.isMock) {
        if (mounted) {
          setAuthRequired(true);
          setLoading(false);
        }
        return;
      }
      const result = await warmNotifications();
      if (!mounted) return;
      setCurrentUserId(user.id);
      setConversations(result.conversations);
      setError(result.conversationError);
      setForcedUnreadIds(readForcedUnreadMessageConversationIds());
      setHiddenIds(new Set([...readHiddenMessageConversationIds(), ...readDeletedMessageConversationIds()]));
      setMutedIds(readMutedMessageConversationIds());
      setPinnedIds(readPinnedMessageConversationIds());
      setRemarks(readMessageConversationRemarks());
      setLoading(false);
    }
    void load();
    return () => {
      mounted = false;
    };
  }, [pathname]);

  const visibleConversations = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    const hasOfficialConversation = conversations.some(isOfficialConversation);
    return [
      ...conversations,
      ...(hasOfficialConversation ? [] : [buildOfficialConversation(currentUserId, text)]),
      buildLifeHelperConversation(currentUserId, text),
    ]
      .filter((conversation) => isOfficialConversation(conversation) || !hiddenIds.has(conversation.id))
      .map((conversation) => isOfficialConversation(conversation) ? conversation : { ...conversation, otherUserName: remarks[conversation.id] || conversation.otherUserName })
      .map((conversation) => forcedUnreadIds.has(conversation.id) && conversation.unreadCount === 0 && conversation.lastMessageSenderId !== currentUserId ? { ...conversation, unreadCount: 1 } : conversation)
      .filter((conversation) => `${conversation.otherUserName} ${conversation.lastMessage}`.toLowerCase().includes(keyword))
      .sort((left, right) => {
        const leftOfficial = isOfficialConversation(left);
        const rightOfficial = isOfficialConversation(right);
        if (leftOfficial !== rightOfficial) return leftOfficial ? -1 : 1;
        const leftLifeHelper = isLifeHelperConversation(left);
        const rightLifeHelper = isLifeHelperConversation(right);
        if (leftLifeHelper !== rightLifeHelper) return leftLifeHelper ? -1 : 1;
        const leftPinned = pinnedIds.has(left.id);
        const rightPinned = pinnedIds.has(right.id);
        if (leftPinned !== rightPinned) return leftPinned ? -1 : 1;
        return Date.parse(right.lastMessageAt || right.updatedAt) - Date.parse(left.lastMessageAt || left.updatedAt);
      });
  }, [conversations, currentUserId, forcedUnreadIds, hiddenIds, pinnedIds, query, remarks, text]);

  const handleMarkUnread = (conversationId: string) => {
    markMessageConversationUnread(conversationId);
    setForcedUnreadIds(readForcedUnreadMessageConversationIds());
  };

  const handleHide = (conversationId: string) => {
    hideMessageConversation(conversationId);
    setHiddenIds(new Set([...readHiddenMessageConversationIds(), ...readDeletedMessageConversationIds()]));
  };

  const handleDelete = (conversationId: string) => {
    deleteMessageConversationLocally(conversationId);
    setHiddenIds(new Set([...readHiddenMessageConversationIds(), ...readDeletedMessageConversationIds()]));
  };

  return (
    <main className="min-h-screen bg-[#f5faff] text-[#061a3a]">
      <div className="mx-auto min-h-screen w-full max-w-[430px] px-4 pb-28 pt-5">
        <header className="grid grid-cols-[auto_1fr_auto] items-center">
          <BackButton fallbackHref="/community/all" label="" />
          <h1 className="text-center text-[21px] font-black">{text.title}</h1>
          <span className="h-10 w-10" />
        </header>

        <label className="mt-6 flex h-12 items-center gap-2 rounded-[20px] bg-white px-4 text-slate-400 shadow-[0_10px_26px_rgba(15,76,129,0.07)] ring-1 ring-blue-50">
          <Search className="h-4 w-4" />
          <input className="min-w-0 flex-1 bg-transparent text-sm font-bold text-[#061a3a] outline-none placeholder:text-slate-400" onChange={(event) => setQuery(event.target.value)} placeholder={text.search} value={query} />
        </label>

        {loading ? (
          <div className="mt-8 grid gap-3">
            {[0, 1, 2].map((item) => <div className="h-20 animate-pulse rounded-[24px] bg-white/80" key={item} />)}
          </div>
        ) : authRequired ? (
          <LoginRequiredCard loginHref={loginHref} text={text} />
        ) : error ? (
          <EmptyState actionLabel={text.community} description={error} />
        ) : visibleConversations.length === 0 ? (
          <EmptyState actionLabel={text.community} description={text.empty} />
        ) : (
          <section className="mt-6 grid gap-3">
            {visibleConversations.map((conversation) => (
              <MessageConversationRow
                actionLabels={text.actionLabels}
                conversation={conversation}
                fixed={isOfficialConversation(conversation) || isLifeHelperConversation(conversation)}
                fixedIcon={isLifeHelperConversation(conversation) ? "notification" : "announcement"}
                fixedLabel={isLifeHelperConversation(conversation) ? text.fixedNotification : text.fixedAnnouncement}
                formatTime={formatMessageTime}
                href={isLifeHelperConversation(conversation) ? "/notifications" : undefined}
                key={conversation.id}
                muted={mutedIds.has(conversation.id)}
                onDelete={handleDelete}
                onHide={handleHide}
                onMarkUnread={handleMarkUnread}
                pinned={isOfficialConversation(conversation) || isLifeHelperConversation(conversation) || pinnedIds.has(conversation.id)}
              />
            ))}
          </section>
        )}
      </div>
    </main>
  );
}

function LoginRequiredCard({ loginHref, text }: { loginHref: string; text: typeof messagesCopy[keyof typeof messagesCopy] }) {
  return (
    <section className="mt-10 rounded-[28px] bg-white p-8 text-center shadow-[0_14px_34px_rgba(15,76,129,0.08)] ring-1 ring-blue-50">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-[#2563eb]">
        <MessageCircle className="h-7 w-7" />
      </div>
      <h2 className="mt-4 text-lg font-black text-[#061a3a]">{text.loginTitle}</h2>
      <p className="mt-2 text-sm font-bold leading-6 text-slate-500">{text.loginDesc}</p>
      <Link className="mt-5 inline-flex h-11 items-center justify-center rounded-full bg-[#2563eb] px-6 text-sm font-black text-white" href={loginHref}>
        {text.login}
      </Link>
    </section>
  );
}

function EmptyState({ actionLabel, description }: { actionLabel: string; description: string }) {
  return (
    <section className="mt-10 rounded-[28px] bg-white p-8 text-center shadow-[0_14px_34px_rgba(15,76,129,0.08)] ring-1 ring-blue-50">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-[#2563eb]">
        <MessageCircle className="h-7 w-7" />
      </div>
      <p className="mt-4 text-sm font-black leading-6 text-slate-500">{description}</p>
      <Link className="mt-5 inline-flex h-11 items-center justify-center rounded-full bg-[#2563eb] px-5 text-sm font-black text-white" href="/community/all">
        {actionLabel}
      </Link>
    </section>
  );
}

function isOfficialConversation(conversation: ConversationListItem) {
  return conversation.isOfficial || isJapanLifeOfficialUser(conversation.otherUserId);
}

function isLifeHelperConversation(conversation: ConversationListItem) {
  return conversation.id === lifeHelperNotificationConversationId;
}

function buildOfficialConversation(currentUserId: string, text: typeof messagesCopy[keyof typeof messagesCopy]): ConversationListItem {
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

function buildLifeHelperConversation(currentUserId: string, text: typeof messagesCopy[keyof typeof messagesCopy]): ConversationListItem {
  const now = new Date().toISOString();
  return {
    createdAt: now,
    id: lifeHelperNotificationConversationId,
    lastMessage: text.lifeHelperLast,
    lastMessageAt: now,
    lastMessageSenderId: "life-helper-system",
    otherUserAvatar: "linear-gradient(135deg,#dbeafe,#ffffff,#bfdbfe)",
    otherUserId: "life-helper-system",
    otherUserName: text.lifeHelperName,
    participantAId: "life-helper-system",
    participantAName: text.lifeHelperName,
    participantBId: currentUserId || "life-helper-viewer",
    participantBName: text.participantUser,
    unreadCount: 0,
    updatedAt: now,
  };
}

function formatMessageTime(value: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const now = new Date();
  if (now.getTime() - date.getTime() < 1000 * 60 * 10) return "刚刚";
  if (date.toDateString() === new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1).toDateString()) return "昨天";
  if (date.toDateString() === now.toDateString()) return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
  return `${String(date.getMonth() + 1).padStart(2, "0")}/${String(date.getDate()).padStart(2, "0")} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}
