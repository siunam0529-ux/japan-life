"use client";

import { MessageCircle, Search } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { BackButton } from "@/components/BackButton";
import { MessageConversationRow } from "@/components/messages/MessageConversationRow";
import { getCurrentMessageUser, isJapanLifeOfficialUser, listMyConversations, shouldUseRealMessageAuth } from "@/lib/messages/api";
import { deleteMessageConversationLocally, hideMessageConversation, markMessageConversationUnread, readDeletedMessageConversationIds, readForcedUnreadMessageConversationIds, readHiddenMessageConversationIds, readMessageConversationRemarks, readMutedMessageConversationIds, readPinnedMessageConversationIds } from "@/lib/messages/listActions";
import type { ConversationListItem } from "@/lib/messages/types";

export default function MessagesPage() {
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
    async function load() {
      const user = await getCurrentMessageUser();
      if (shouldUseRealMessageAuth() && user.isMock) {
        if (mounted) {
          setAuthRequired(true);
          setLoading(false);
        }
        return;
      }
      const result = await listMyConversations();
      if (!mounted) return;
      setCurrentUserId(user.id);
      setConversations(result.data ?? []);
      setError(result.error);
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
    return conversations
      .filter((conversation) => isOfficialConversation(conversation) || !hiddenIds.has(conversation.id))
      .map((conversation) => isOfficialConversation(conversation) ? conversation : { ...conversation, otherUserName: remarks[conversation.id] || conversation.otherUserName })
      .map((conversation) => forcedUnreadIds.has(conversation.id) && conversation.unreadCount === 0 && conversation.lastMessageSenderId !== currentUserId ? { ...conversation, unreadCount: 1 } : conversation)
      .filter((conversation) => `${conversation.otherUserName} ${conversation.lastMessage}`.toLowerCase().includes(keyword))
      .sort((left, right) => {
        const leftOfficial = isOfficialConversation(left);
        const rightOfficial = isOfficialConversation(right);
        if (leftOfficial !== rightOfficial) return leftOfficial ? -1 : 1;
        const leftPinned = pinnedIds.has(left.id);
        const rightPinned = pinnedIds.has(right.id);
        if (leftPinned !== rightPinned) return leftPinned ? -1 : 1;
        return Date.parse(right.lastMessageAt || right.updatedAt) - Date.parse(left.lastMessageAt || left.updatedAt);
      });
  }, [conversations, currentUserId, forcedUnreadIds, hiddenIds, pinnedIds, query, remarks]);

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
          <h1 className="text-center text-[21px] font-black">私信</h1>
          <span className="h-10 w-10" />
        </header>

        <label className="mt-6 flex h-12 items-center gap-2 rounded-[20px] bg-white px-4 text-slate-400 shadow-[0_10px_26px_rgba(15,76,129,0.07)] ring-1 ring-blue-50">
          <Search className="h-4 w-4" />
          <input className="min-w-0 flex-1 bg-transparent text-sm font-bold text-[#061a3a] outline-none placeholder:text-slate-400" onChange={(event) => setQuery(event.target.value)} placeholder="搜索聊天" value={query} />
        </label>

        {loading ? (
          <div className="mt-8 grid gap-3">
            {[0, 1, 2].map((item) => <div className="h-20 animate-pulse rounded-[24px] bg-white/80" key={item} />)}
          </div>
        ) : authRequired ? (
          <LoginRequiredCard loginHref={loginHref} />
        ) : error ? (
          <EmptyState description={error} />
        ) : visibleConversations.length === 0 ? (
          <EmptyState description="还没有私信，去社区认识新朋友吧" />
        ) : (
          <section className="mt-6 grid gap-3">
            {visibleConversations.map((conversation) => (
              <MessageConversationRow conversation={conversation} fixed={isOfficialConversation(conversation)} formatTime={formatMessageTime} key={conversation.id} muted={mutedIds.has(conversation.id)} onDelete={handleDelete} onHide={handleHide} onMarkUnread={handleMarkUnread} pinned={isOfficialConversation(conversation) || pinnedIds.has(conversation.id)} />
            ))}
          </section>
        )}
      </div>
    </main>
  );
}

function LoginRequiredCard({ loginHref }: { loginHref: string }) {
  return (
    <section className="mt-10 rounded-[28px] bg-white p-8 text-center shadow-[0_14px_34px_rgba(15,76,129,0.08)] ring-1 ring-blue-50">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-[#2563eb]">
        <MessageCircle className="h-7 w-7" />
      </div>
      <h2 className="mt-4 text-lg font-black text-[#061a3a]">请先登录</h2>
      <p className="mt-2 text-sm font-bold leading-6 text-slate-500">登录后可以查看和发送 1 对 1 私信。</p>
      <Link className="mt-5 inline-flex h-11 items-center justify-center rounded-full bg-[#2563eb] px-6 text-sm font-black text-white" href={loginHref}>
        去登录
      </Link>
    </section>
  );
}

function EmptyState({ description }: { description: string }) {
  return (
    <section className="mt-10 rounded-[28px] bg-white p-8 text-center shadow-[0_14px_34px_rgba(15,76,129,0.08)] ring-1 ring-blue-50">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-[#2563eb]">
        <MessageCircle className="h-7 w-7" />
      </div>
      <p className="mt-4 text-sm font-black leading-6 text-slate-500">{description}</p>
      <Link className="mt-5 inline-flex h-11 items-center justify-center rounded-full bg-[#2563eb] px-5 text-sm font-black text-white" href="/community/all">
        去社区看看
      </Link>
    </section>
  );
}

function isOfficialConversation(conversation: ConversationListItem) {
  return conversation.isOfficial || isJapanLifeOfficialUser(conversation.otherUserId);
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
