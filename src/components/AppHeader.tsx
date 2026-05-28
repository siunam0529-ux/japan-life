"use client";

import { Bell, MapPin, Settings } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useLanguage } from "@/hooks/useLanguage";

const headerCopy = {
  "zh-CN": {
    subtitle: "在日生活助手",
    zhCN: "简体",
    zhTW: "繁體",
    ja: "日本語",
  },
  "zh-TW": {
    subtitle: "在日生活助手",
    zhCN: "簡體",
    zhTW: "繁體",
    ja: "日本語",
  },
  ja: {
    subtitle: "日本生活サポート",
    zhCN: "簡体",
    zhTW: "繁体",
    ja: "日本語",
  },
} as const;

export function AppHeader() {
  const { language, setLanguage } = useLanguage();
  const copy = headerCopy[language];

  return (
    <header className="mb-3 grid gap-3 pb-[14px] pt-[18px]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="relative block h-[44px] w-[44px] shrink-0 overflow-hidden rounded-[14px] shadow-[0_8px_18px_rgba(37,99,235,0.12)]">
            <Image src="/icon-512.png" alt="Japan Life" fill sizes="44px" priority className="object-cover" />
          </span>
          <div className="min-w-0">
            <h1 className="truncate text-[30px] font-[800] leading-[34px] tracking-[-0.6px] text-[#061A3A]">Japan Life</h1>
            <p className="text-[13px] font-semibold leading-[18px] text-[#37506F]">{copy.subtitle}</p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Link className="relative flex h-[42px] w-[42px] items-center justify-center rounded-full border border-white/70 bg-white/75 text-[#0F172A] shadow-[0_8px_20px_rgba(15,76,129,0.10)] backdrop-blur-xl" href="/reminders" aria-label="reminders">
            <Bell className="h-[18px] w-[18px]" />
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full border-2 border-white bg-[#FF5AA5]" />
          </Link>
          <Link className="flex h-[42px] w-[42px] items-center justify-center rounded-full border border-white/70 bg-white/75 text-[#64748B] shadow-[0_8px_20px_rgba(15,76,129,0.10)] backdrop-blur-xl" href="/me/settings" aria-label="settings">
            <Settings className="h-[18px] w-[18px]" />
          </Link>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <Link className="flex h-[34px] items-center gap-1.5 rounded-full border border-white/70 bg-white/75 px-[14px] text-[14px] font-bold text-[#1F6FFF] shadow-sm backdrop-blur-xl" href="/onboarding">
          <MapPin className="h-3.5 w-3.5" />
          Tokyo
        </Link>
        <p className="flex h-8 items-center whitespace-nowrap rounded-full bg-white/70 px-3 text-[12px] font-bold text-[#64748B] backdrop-blur-xl">
          <button className={language === "zh-CN" ? "font-extrabold text-[#087F7A]" : "text-[#64748B]"} onClick={() => setLanguage("zh-CN")} type="button">
            {copy.zhCN}
          </button>
          <span className="mx-1.5 text-stone-300">|</span>
          <button className={language === "zh-TW" ? "font-extrabold text-[#087F7A]" : "text-[#64748B]"} onClick={() => setLanguage("zh-TW")} type="button">
            {copy.zhTW}
          </button>
          <span className="mx-1.5 text-stone-300">|</span>
          <button className={language === "ja" ? "font-extrabold text-[#087F7A]" : "text-[#64748B]"} onClick={() => setLanguage("ja")} type="button">
            {copy.ja}
          </button>
        </p>
      </div>
    </header>
  );
}
