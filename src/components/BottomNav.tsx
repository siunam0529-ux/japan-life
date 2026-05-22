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
    <nav className="sticky bottom-0 z-20 -mx-4 mt-8 border-t border-stone-200/80 bg-white/92 px-4 pb-[calc(env(safe-area-inset-bottom)+8px)] pt-2 shadow-[0_-10px_28px_rgba(32,38,34,0.06)] backdrop-blur-xl">
      <div className="grid grid-cols-5">
        {items.map((item) => {
          const Icon = item.icon;
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link key={item.label} href={item.href} className={`flex flex-col items-center gap-1 py-1 text-[11px] font-black ${active ? "text-emerald-700" : "text-stone-500"}`}>
              <Icon className={`h-6 w-6 ${active ? "fill-emerald-700/15" : ""}`} />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
