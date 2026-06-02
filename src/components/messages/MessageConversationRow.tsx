"use client";

import { Bell, BellOff, Megaphone, Pin, UserRound } from "lucide-react";
import Link from "next/link";
import type { CSSProperties, PointerEvent } from "react";
import { useRef, useState } from "react";
import type { ConversationListItem } from "@/lib/messages/types";

const actionWidth = 204;
const openThreshold = actionWidth * 0.38;

export function MessageConversationRow({
  conversation,
  compact = false,
  fixedIcon = "announcement",
  fixedLabel = "公告",
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

  return (
    <div className={`${compact ? "rounded-none shadow-none ring-0" : "rounded-[24px] shadow-[0_14px_34px_rgba(15,76,129,0.08)] ring-1 ring-blue-50"} relative overflow-hidden bg-white`}>
      <div className={`absolute inset-y-0 right-0 grid w-[204px] grid-cols-3 overflow-hidden text-[13px] font-black text-white transition-opacity duration-150 ${actionsVisible ? "opacity-100" : "pointer-events-none opacity-0"}`}>
        <button className="bg-[#2563EB]" onClick={() => closeAfterAction(onMarkUnread)} type="button">
          标为未读
        </button>
        <button className="bg-[#64748B]" onClick={() => closeAfterAction(onHide)} type="button">
          不显示
        </button>
        <button className="bg-[#E11D48]" onClick={() => closeAfterAction(onDelete)} type="button">
          删除
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
        <Link className={`flex items-center gap-3 ${compact ? "min-h-[74px] px-2 py-2" : "p-4"} transition active:scale-[0.99]`} href={href ?? `/messages/${conversation.id}`} onClick={() => { onActivate?.(conversation.id); setOpen(false); }}>
          <span className={`${compact ? "h-[54px] w-[54px]" : "h-12 w-12"} flex shrink-0 items-center justify-center rounded-full text-[#2563EB] ring-1 ring-blue-100`} style={{ background: getAvatarBackground(conversation.otherUserAvatar) }}>
            {hasImageAvatar ? null : <AvatarIcon className="h-6 w-6" />}
          </span>
          <span className={`min-w-0 flex-1 ${compact ? "pb-3" : ""}`}>
            <span className="flex items-center justify-between gap-3">
              <span className="flex min-w-0 items-center gap-2">
                <span className={`${compact ? "text-[16px]" : "text-[15px]"} truncate font-black text-[#1f2937]`}>{conversation.otherUserName || "Japan Life 用户"}</span>
                {fixed ? <span className="shrink-0 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-black text-[#2563eb] ring-1 ring-blue-100">{fixedLabel}</span> : null}
              </span>
              <span className="shrink-0 text-[11px] font-bold text-slate-400">{formatTime(conversation.lastMessageAt)}</span>
            </span>
            <span className="mt-1 flex items-center justify-between gap-3">
              <span className={`${compact ? "text-[13px]" : "text-sm"} truncate font-bold text-slate-500`}>{conversation.lastMessage || "开始聊天吧"}</span>
              {showMetaIcons ? (
                <span className="flex shrink-0 items-center gap-1.5 text-slate-300">
                  {pinned ? <Pin className="h-3.5 w-3.5 fill-slate-300 stroke-slate-300" aria-label="置顶" /> : null}
                  {muted ? <BellOff className="h-3.5 w-3.5" aria-label="静音" /> : null}
                  {unread ? <span className="flex h-2.5 w-2.5 rounded-full bg-rose-500 shadow-[0_0_0_3px_rgba(244,63,94,0.10)]" aria-label="未读消息" /> : null}
                </span>
              ) : null}
            </span>
          </span>
        </Link>
      </div>
    </div>
  );
}

function getAvatarBackground(avatar?: string): CSSProperties["background"] {
  if (!avatar) return "linear-gradient(135deg,#dbeafe,#ffffff,#e0f2fe)";
  if (avatar.startsWith("linear-gradient")) return avatar;
  return `center / cover no-repeat url("${avatar}")`;
}

function isImageAvatar(avatar?: string) {
  return Boolean(avatar && !avatar.startsWith("linear-gradient"));
}
