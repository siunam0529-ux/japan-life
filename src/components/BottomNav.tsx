"use client";

import { Heart, Home, Store, UserRound } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/hooks/useLanguage";

export function BottomNav() {
  const { t } = useLanguage();
  const pathname = usePathname();
  const items = [
    { label: t.nav.home, icon: Home, href: "/" },
    { label: t.nav.places, icon: Store, href: "/places" },
    { label: t.nav.favorites, icon: Heart, href: "/favorites" },
    { label: t.nav.mine, icon: UserRound, href: "/me" },
  ];

  return (
    <nav className="h-[70px] rounded-[28px] border border-white/75 bg-white/85 px-2 shadow-[0_16px_36px_rgba(15,76,129,0.14)] backdrop-blur-[18px]">
      <div className="grid h-full grid-cols-4">
        {items.map((item) => {
          const Icon = item.icon;
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link key={item.label} href={item.href} className={`m-auto flex min-w-[68px] flex-col items-center justify-center gap-1 rounded-[22px] px-3 py-2 text-[11px] font-extrabold leading-[14px] transition-all duration-300 ${active ? "bg-blue-100/70 text-[#1F6FFF] shadow-[0_8px_18px_rgba(37,99,235,0.12)]" : "text-[#64748B]"}`}>
              <Icon className={`h-[22px] w-[22px] stroke-[2.2] ${active ? "fill-blue-500/15 drop-shadow-sm" : ""}`} />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
