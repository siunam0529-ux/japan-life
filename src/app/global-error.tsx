"use client";

import { RefreshCcw } from "lucide-react";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="zh-CN">
      <body>
        <main className="min-h-screen bg-[#f5f0e7] text-stone-950">
          <div className="mx-auto flex min-h-screen max-w-[430px] flex-col justify-center bg-[#fbf8f2] px-4 py-5 shadow-2xl shadow-stone-300/40">
            <section className="rounded-[28px] bg-white p-6 text-center shadow-[0_12px_35px_rgba(32,38,34,0.08)]">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
                <RefreshCcw className="h-7 w-7" />
              </div>
              <h1 className="mt-5 text-2xl font-black">页面暂时无法打开</h1>
              <p className="mt-3 text-sm font-bold leading-6 text-stone-500">请刷新重试。如果问题持续出现，可以回到首页重新进入。</p>
              <button className="mt-5 rounded-2xl bg-emerald-800 px-5 py-3 text-sm font-black text-white" onClick={reset} type="button">
                重新加载
              </button>
            </section>
          </div>
        </main>
      </body>
    </html>
  );
}
