"use client";

import { Bell, Home, MessageCircle, Plus, Store, UserRound } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/hooks/useLanguage";

export function BottomNav() {
  const { t } = useLanguage();
  const pathname = usePathname();
  const inCommunity = pathname === "/community" || pathname.startsWith("/community/");
  const communityPublishHref = getCommunityPublishHref();
  const items = [
    { label: t.nav.home, icon: Home, href: "/" },
    { label: t.nav.places, icon: Store, href: "/places" },
    { label: inCommunity ? "" : t.nav.community, icon: inCommunity ? Plus : MessageCircle, href: inCommunity ? communityPublishHref : "/community/all", isCommunity: true },
    { label: t.nav.notifications, icon: Bell, href: "/notifications" },
    { label: t.nav.mine, icon: UserRound, href: "/me" },
  ];

  return (
    <nav className="h-[70px] rounded-[28px] border border-white/75 bg-white/85 px-2 shadow-[0_16px_36px_rgba(15,76,129,0.14)] backdrop-blur-[18px]">
      <div className="grid h-full grid-cols-5">
        {items.map((item) => {
          const Icon = item.icon;
          const active = item.href === "/" ? pathname === "/" : item.isCommunity ? inCommunity : pathname.startsWith(item.href);
          const communityPublish = item.isCommunity && inCommunity;
          return (
            <Link
              aria-label={communityPublish ? "发布" : item.label}
              className={`m-auto flex min-w-0 flex-col items-center justify-center gap-1 rounded-[20px] text-[10.5px] font-extrabold leading-[13px] transition-all duration-300 active:scale-[0.96] min-[390px]:text-[11px] ${communityPublish ? "h-12 w-12 rounded-full bg-[linear-gradient(135deg,#2563eb,#38bdf8)] p-0 text-white shadow-[0_10px_24px_rgba(37,99,235,0.30)]" : `px-2 py-2 min-[390px]:min-w-[62px] ${active ? "bg-blue-100/70 text-[#1F6FFF] shadow-[0_8px_18px_rgba(37,99,235,0.12)]" : "text-[#64748B]"}`}`}
              href={item.href}
              key={`${item.href}-${item.label || "publish"}`}
              prefetch
            >
              <Icon className={`${communityPublish ? "h-7 w-7 stroke-[2.6] drop-shadow-sm" : `h-[21px] w-[21px] stroke-[2.2] ${active ? "fill-blue-500/15 drop-shadow-sm" : ""}`}`} />
              {communityPublish ? null : item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function getCommunityPublishHref() {
  return "/community/all/new";
}
