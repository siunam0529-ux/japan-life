"use client";

import { Bell } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useLanguage } from "@/hooks/useLanguage";
import { readCommunityNotifications } from "@/lib/community/repository";

const notificationButtonCopy = {
  "zh-CN": "\u6d88\u606f",
  "zh-TW": "\u6d88\u606f",
  ja: "\u901a\u77e5",
};

export function CommunityNotificationButton() {
  const { language } = useLanguage();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    setUnreadCount(readCommunityNotifications().filter((notification) => !notification.isRead).length);
  }, []);

  return (
    <Link className="relative inline-flex h-9 items-center gap-2 rounded-full bg-white/85 px-4 text-xs font-black text-[#2563EB] shadow-sm ring-1 ring-blue-100" href="/notifications" prefetch={false}>
      <Bell className="h-4 w-4" />
      {notificationButtonCopy[language]}
      {unreadCount > 0 ? (
        <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1.5 text-[10px] font-black leading-none text-white ring-2 ring-white">
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      ) : null}
    </Link>
  );
}
