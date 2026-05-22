"use client";

import { Bell, MapPin, Settings } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useLanguage } from "@/hooks/useLanguage";

export function AppHeader() {
  const { language, setLanguage, t } = useLanguage();

  return (
    <header className="flex items-start justify-between gap-3">
      <div className="flex min-w-0 items-center gap-3">
        <span className="relative block h-12 w-12 shrink-0 overflow-hidden rounded-[18px] shadow-[0_12px_28px_rgba(37,99,235,0.14)]">
          <Image src="/icon-512.png" alt="Japan Life" fill sizes="48px" priority className="object-cover" />
        </span>
        <div className="min-w-0">
        <div className="flex items-center gap-2">
          <h1 className="truncate text-[28px] font-black leading-none tracking-tight text-[#0F172A] min-[390px]:text-[32px]">Japan Life</h1>
          <span className="brand-status-dot mt-0.5 h-2.5 w-2.5 rounded-full" />
        </div>
        <p className="mt-2 text-[14px] font-black text-[#64748B]">在日生活助手</p>
        </div>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-2">
        <div className="flex items-center gap-2">
          <Link className="relative flex h-10 w-10 items-center justify-center rounded-full border border-white/70 bg-white/75 text-[#0F172A] shadow-[0_12px_28px_rgba(37,99,235,0.12)] backdrop-blur-xl" href="/reminders" aria-label="reminders">
            <Bell className="h-5 w-5" />
            <span className="brand-status-dot absolute right-2 top-2 h-2 w-2 rounded-full" />
          </Link>
          <Link className="flex h-10 w-10 items-center justify-center rounded-full border border-white/70 bg-white/75 text-[#64748B] shadow-[0_12px_28px_rgba(37,99,235,0.1)] backdrop-blur-xl" href="/me/settings" aria-label="settings">
            <Settings className="h-5 w-5" />
          </Link>
        </div>
        <p className="whitespace-nowrap rounded-full bg-white/60 px-2.5 py-1 text-[11px] font-black text-[#64748B] backdrop-blur-xl min-[390px]:text-xs">
          <button className={language === "zh-CN" ? "text-emerald-800" : "text-stone-500"} onClick={() => setLanguage("zh-CN")} type="button">
            简体
          </button>
          <span className="mx-1.5 text-stone-300">|</span>
          <button className={language === "zh-TW" ? "text-emerald-800" : "text-stone-500"} onClick={() => setLanguage("zh-TW")} type="button">
            繁體
          </button>
          <span className="mx-1.5 text-stone-300">|</span>
          <button className={language === "ja" ? "text-emerald-800" : "text-stone-500"} onClick={() => setLanguage("ja")} type="button">
            日本語
          </button>
        </p>
        <Link className="flex items-center gap-1.5 rounded-full border border-white/70 bg-white/75 px-3 py-1.5 text-[12px] font-black text-[#2563EB] shadow-sm backdrop-blur-xl" href="/onboarding">
          <MapPin className="h-4 w-4" />
          Tokyo
        </Link>
      </div>
    </header>
  );
}
