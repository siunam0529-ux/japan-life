"use client";

import { Bell, Home, MessageCircle, Store, UserRound } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/hooks/useLanguage";

export function BottomNav() {
  const { t } = useLanguage();
  const pathname = usePathname();
  const items = [
    { label: t.nav.home, icon: Home, href: "/" },
    { label: t.nav.places, icon: Store, href: "/places" },
    { label: t.nav.community, icon: MessageCircle, href: "/community/all" },
    { label: t.nav.notifications, icon: Bell, href: "/notifications" },
    { label: t.nav.mine, icon: UserRound, href: "/me" },
  ];

  return (
    <nav className="h-[70px] rounded-[28px] border border-white/75 bg-white/85 px-2 shadow-[0_16px_36px_rgba(15,76,129,0.14)] backdrop-blur-[18px]">
      <div className="grid h-full grid-cols-5">
        {items.map((item) => {
          const Icon = item.icon;
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link key={item.label} href={item.href} className={`m-auto flex min-w-0 flex-col items-center justify-center gap-1 rounded-[20px] px-2 py-2 text-[10.5px] font-extrabold leading-[13px] transition-all duration-300 min-[390px]:min-w-[62px] min-[390px]:text-[11px] ${active ? "bg-blue-100/70 text-[#1F6FFF] shadow-[0_8px_18px_rgba(37,99,235,0.12)]" : "text-[#64748B]"}`}>
              <Icon className={`h-[21px] w-[21px] stroke-[2.2] ${active ? "fill-blue-500/15 drop-shadow-sm" : ""}`} />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
