"use client";

import { RefreshCcw } from "lucide-react";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="ja">
      <body>
        <main className="jl-tool-theme min-h-screen text-stone-950">
          <div className="jl-tool-shell mx-auto flex min-h-screen max-w-[430px] flex-col justify-center px-4 py-5">
            <section className="rounded-[28px] bg-white p-6 text-center shadow-[0_12px_35px_rgba(32,38,34,0.08)]">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
                <RefreshCcw className="h-7 w-7" />
              </div>
              <h1 className="mt-5 text-2xl font-black">ページを開けません / 页面无法打开</h1>
              <p className="mt-3 text-sm font-bold leading-6 text-stone-500">再読み込みしてください。請重新整理再試。请刷新重试。</p>
              <button className="mt-5 rounded-2xl bg-emerald-800 px-5 py-3 text-sm font-black text-white" onClick={reset} type="button">
                再読み込み / 重新載入 / 重新加载
              </button>
            </section>
          </div>
        </main>
      </body>
    </html>
  );
}
