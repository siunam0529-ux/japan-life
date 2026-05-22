"use client";

import { MapPin } from "lucide-react";
import Link from "next/link";
import { useLanguage } from "@/hooks/useLanguage";

export function AppHeader() {
  const { language, setLanguage, t } = useLanguage();

  return (
    <header className="flex items-start justify-between gap-2.5">
      <div className="min-w-0">
        <h1 className="truncate text-[31px] font-black leading-none tracking-normal text-emerald-800 min-[390px]:text-[34px]">Japan Life</h1>
        <p className="mt-2 text-[15px] font-bold text-stone-500">{t.home.subtitle}</p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-2">
        <p className="whitespace-nowrap text-[12px] font-black text-stone-500 min-[390px]:text-sm">
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
        <Link className="flex items-center gap-1.5 rounded-full border border-stone-200/80 bg-white px-2.5 py-2 text-[13px] font-black text-emerald-800 shadow-sm min-[390px]:px-3 min-[390px]:text-[15px]" href="/onboarding">
          <MapPin className="h-4 w-4" />
          Tokyo
        </Link>
      </div>
    </header>
  );
}
