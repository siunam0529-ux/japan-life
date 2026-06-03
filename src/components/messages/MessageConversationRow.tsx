"use client";

import { Bell, BellOff, Megaphone, Pin, UserRound } from "lucide-react";
import Link from "next/link";
import type { CSSProperties, PointerEvent } from "react";
import { useRef, useState } from "react";
import { useLanguage } from "@/hooks/useLanguage";
import type { ConversationListItem } from "@/lib/messages/types";

const actionWidth = 204;
const openThreshold = actionWidth * 0.38;

export function MessageConversationRow({
  actionLabels,
  conversation,
  compact = false,
  fixedIcon = "announcement",
  fixedLabel,
  formatTime,
  fixed = false,
  href,
  muted = false,
  onActivate,
  onDelete,
  onHide,
  onMarkUnread,
  pinned = false,
}: {
  actionLabels?: MessageActionLabels;
  compact?: boolean;
  conversation: ConversationListItem;
  fixed?: boolean;
  fixedIcon?: "announcement" | "notification";
  fixedLabel?: string;
  formatTime: (value: string) => string;
  href?: string;
  muted?: boolean;
  onActivate?: (conversationId: string) => void;
  onDelete: (conversationId: string) => void;
  onHide: (conversationId: string) => void;
  onMarkUnread: (conversationId: string) => void;
  pinned?: boolean;
}) {
  const { language } = useLanguage();
  const labels = actionLabels ?? defaultActionLabels[language];
  const displayFixedLabel = fixedLabel ?? labels.announcement ?? defaultActionLabels[language].announcement;
  const [open, setOpen] = useState(false);
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const draggingRef = useRef(false);
  const startXRef = useRef(0);

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (fixed) return;
    draggingRef.current = true;
    setIsDragging(true);
    startXRef.current = event.clientX;
    setDragX(open ? -actionWidth : 0);
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return;
    const baseX = open ? -actionWidth : 0;
    const rawX = baseX + event.clientX - startXRef.current;
    const nextX = rawX < -actionWidth ? -actionWidth + (rawX + actionWidth) * 0.18 : rawX > 0 ? rawX * 0.18 : rawX;
    setDragX(Math.max(-actionWidth - 18, Math.min(18, nextX)));
  };

  const handlePointerUp = (event: PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    setIsDragging(false);
    const deltaX = event.clientX - startXRef.current;
    const nextOpen = open ? !(deltaX > 24 || dragX > -actionWidth + openThreshold) : deltaX < -24 || dragX < -openThreshold;
    setOpen(nextOpen);
    setDragX(nextOpen ? -actionWidth : 0);
  };

  const closeAfterAction = (action: (conversationId: string) => void) => {
    if (fixed) return;
    action(conversation.id);
    setOpen(false);
    setDragX(0);
  };

  const unread = conversation.unreadCount > 0;
  const translateX = open ? -actionWidth : dragX;
  const actionsVisible = !fixed && (open || dragX < -4);
  const showMetaIcons = pinned || muted || unread;
  const AvatarIcon = fixed ? (fixedIcon === "notification" ? Bell : Megaphone) : UserRound;
  const hasImageAvatar = isImageAvatar(conversation.otherUserAvatar);
  const rowHeightClass = compact ? "min-h-[82px] px-4 py-3" : "min-h-[82px] px-4 py-3.5";
  const avatarSizeClass = compact ? "h-[54px] w-[54px]" : "h-[56px] w-[56px]";

  return (
    <div className="relative overflow-hidden rounded-[24px] bg-white shadow-[0_16px_34px_rgba(15,76,129,0.08)] ring-1 ring-blue-50/70">
      <div className={`absolute inset-y-0 right-0 grid w-[204px] grid-cols-3 overflow-hidden text-[13px] font-black text-white transition-opacity duration-150 ${actionsVisible ? "opacity-100" : "pointer-events-none opacity-0"}`}>
        <button className="bg-[#2563EB]" onClick={() => closeAfterAction(onMarkUnread)} type="button">
          {labels.markUnread}
        </button>
        <button className="bg-[#64748B]" onClick={() => closeAfterAction(onHide)} type="button">
          {labels.hidden}
        </button>
        <button className="bg-[#E11D48]" onClick={() => closeAfterAction(onDelete)} type="button">
          {labels.delete}
        </button>
      </div>

      <div
        className={`relative touch-pan-y bg-white will-change-transform ${isDragging ? "" : "transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"}`}
        onPointerDown={handlePointerDown}
        onPointerLeave={handlePointerUp}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        style={{ transform: `translateX(${translateX}px)` }}
      >
        <Link className={`flex items-center gap-3 ${rowHeightClass} transition active:scale-[0.99]`} href={href ?? `/messages/${conversation.id}`} onClick={() => { onActivate?.(conversation.id); setOpen(false); }}>
          <span className={`${avatarSizeClass} flex shrink-0 items-center justify-center overflow-hidden rounded-full text-[#2563EB] shadow-[0_8px_20px_rgba(37,99,235,0.10)] ring-1 ring-blue-100`} style={{ background: getAvatarBackground(conversation.otherUserAvatar) }}>
            {hasImageAvatar ? null : <AvatarIcon className="h-6 w-6" />}
          </span>
          <span className="min-w-0 flex-1">
            <span className="flex items-start justify-between gap-3">
              <span className="flex min-w-0 items-center gap-2">
                <span className="truncate text-[15px] font-black leading-5 text-[#1f2937]">{conversation.otherUserName || labels.userFallback}</span>
                {fixed ? <span className="shrink-0 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-black leading-4 text-[#2563eb] ring-1 ring-blue-100">{displayFixedLabel}</span> : null}
              </span>
              <span className="shrink-0 text-[11px] font-black leading-5 text-slate-400">{formatTime(conversation.lastMessageAt)}</span>
            </span>
            <span className="mt-1 flex items-start justify-between gap-3">
              <span className="min-w-0 truncate text-[13px] font-black leading-5 text-slate-500">{conversation.lastMessage || labels.startChat}</span>
              {showMetaIcons ? (
                <span className="flex min-h-5 shrink-0 items-center gap-1.5 text-slate-300">
                  {pinned ? <Pin className="h-3.5 w-3.5 fill-blue-100 stroke-blue-100" aria-label={labels.pinned} /> : null}
                  {muted ? <BellOff className="h-3.5 w-3.5 text-slate-300" aria-label={labels.muted} /> : null}
                  {unread ? <span className="flex h-2.5 w-2.5 rounded-full bg-rose-500 shadow-[0_0_0_3px_rgba(244,63,94,0.10)]" aria-label={labels.unread} /> : null}
                </span>
              ) : null}
            </span>
          </span>
        </Link>
      </div>
    </div>
  );
}

const defaultActionLabels = {
  "zh-CN": {
    announcement: "\u516c\u544a",
    delete: "\u5220\u9664",
    hidden: "\u4e0d\u663e\u793a",
    markUnread: "\u6807\u4e3a\u672a\u8bfb",
    muted: "\u9759\u97f3",
    pinned: "\u7f6e\u9876",
    startChat: "\u5f00\u59cb\u804a\u5929\u5427",
    unread: "\u672a\u8bfb\u6d88\u606f",
    userFallback: "Japan Life \u7528\u6237",
  },
  "zh-TW": {
    announcement: "\u516c\u544a",
    delete: "\u522a\u9664",
    hidden: "\u4e0d\u986f\u793a",
    markUnread: "\u6a19\u70ba\u672a\u8b80",
    muted: "\u975c\u97f3",
    pinned: "\u7f6e\u9802",
    startChat: "\u958b\u59cb\u804a\u5929\u5427",
    unread: "\u672a\u8b80\u6d88\u606f",
    userFallback: "Japan Life \u7528\u6236",
  },
  ja: {
    announcement: "\u304a\u77e5\u3089\u305b",
    delete: "\u524a\u9664",
    hidden: "\u975e\u8868\u793a",
    markUnread: "\u672a\u8aad\u306b\u3059\u308b",
    muted: "\u30df\u30e5\u30fc\u30c8",
    pinned: "\u56fa\u5b9a",
    startChat: "\u30c1\u30e3\u30c3\u30c8\u3092\u59cb\u3081\u307e\u3057\u3087\u3046",
    unread: "\u672a\u8aad\u30e1\u30c3\u30bb\u30fc\u30b8",
    userFallback: "Japan Life \u30e6\u30fc\u30b6\u30fc",
  },
};

type MessageActionLabels = Omit<(typeof defaultActionLabels)["zh-CN"], "announcement"> & {
  announcement?: string;
};

function getAvatarBackground(avatar?: string): CSSProperties["background"] {
  if (!avatar) return "linear-gradient(135deg,#dbeafe,#ffffff,#e0f2fe)";
  if (avatar.startsWith("linear-gradient")) return avatar;
  return `center / cover no-repeat url("${avatar}")`;
}

function isImageAvatar(avatar?: string) {
  return Boolean(avatar && !avatar.startsWith("linear-gradient"));
}
