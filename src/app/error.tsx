"use client";

import { RefreshCcw } from "lucide-react";
import Link from "next/link";
import { useLanguage } from "@/hooks/useLanguage";

const errorCopy = {
  "zh-CN": {
    title: "页面暂时无法打开",
    desc: "请刷新重试，或回到首页重新进入。",
    reload: "重新加载",
    home: "回到首页",
  },
  "zh-TW": {
    title: "頁面暫時無法打開",
    desc: "請重新整理再試，或回到首頁重新進入。",
    reload: "重新載入",
    home: "回到首頁",
  },
  ja: {
    title: "ページを一時的に開けません",
    desc: "再読み込みするか、ホームに戻ってもう一度開いてください。",
    reload: "再読み込み",
    home: "ホームへ",
  },
} as const;

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const { language } = useLanguage();
  const text = errorCopy[language];

  return (
    <main className="jl-tool-theme min-h-screen text-stone-950">
      <div className="jl-tool-shell mx-auto flex min-h-screen max-w-[430px] flex-col justify-center px-4 py-5">
        <section className="rounded-[28px] bg-white p-6 text-center shadow-[0_12px_35px_rgba(32,38,34,0.08)]">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
            <RefreshCcw className="h-7 w-7" />
          </div>
          <h1 className="mt-5 text-2xl font-black">{text.title}</h1>
          <p className="mt-3 text-sm font-bold leading-6 text-stone-500">{text.desc}</p>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <button className="rounded-2xl bg-emerald-800 px-4 py-3 text-sm font-black text-white" onClick={reset} type="button">
              {text.reload}
            </button>
            <Link className="rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm font-black text-emerald-800" href="/">
              {text.home}
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
