"use client";

import { Heart, Home, ShoppingBag, Store, UserRound } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/hooks/useLanguage";

export function BottomNav() {
  const { language, t } = useLanguage();
  const pathname = usePathname();
  const appLabel = language === "ja" ? "アプリ" : language === "zh-TW" ? "推薦App" : "推荐App";
  const items = [
    { label: t.nav.home, icon: Home, href: "/" },
    { label: appLabel, icon: ShoppingBag, href: "/apps" },
    { label: t.nav.places, icon: Store, href: "/places" },
    { label: t.nav.favorites, icon: Heart, href: "/favorites" },
    { label: t.nav.mine, icon: UserRound, href: "/me" },
  ];

  return (
    <nav className="rounded-[28px] border border-white/70 bg-white/78 px-3 pb-[calc(env(safe-area-inset-bottom)+8px)] pt-2 shadow-[0_16px_40px_rgba(37,99,235,0.14)] backdrop-blur-xl">
      <div className="grid grid-cols-5">
        {items.map((item) => {
          const Icon = item.icon;
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link key={item.label} href={item.href} className={`flex flex-col items-center gap-1 rounded-2xl py-1.5 text-[10px] font-black transition-all duration-300 ${active ? "bg-blue-50 text-[#2563EB] shadow-[0_8px_18px_rgba(37,99,235,0.12)]" : "text-[#64748B]"}`}>
              <Icon className={`h-5 w-5 ${active ? "fill-blue-500/15 drop-shadow-sm" : ""}`} />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
