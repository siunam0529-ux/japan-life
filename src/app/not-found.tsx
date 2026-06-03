import { ArrowLeft, Search } from "lucide-react";
import Link from "next/link";

const notFoundCopy = {
  title: "ページが見つかりません / 沒有找到頁面 / 没有找到页面",
  desc: "入口が移動した可能性があります。首頁或搜尋からもう一度探してください。",
  home: "ホーム / 首頁 / 首页",
  search: "検索 / 搜尋 / 搜索",
};

export default function NotFound() {
  return (
    <main className="jl-tool-theme min-h-screen text-stone-950">
      <div className="jl-tool-shell mx-auto flex min-h-screen max-w-[430px] flex-col px-4 py-5">
        <header className="flex items-center justify-between">
          <Link className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-emerald-700 shadow-sm" href="/">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <span className="rounded-full bg-white px-4 py-2 text-sm font-black text-emerald-700 shadow-sm">Japan Life</span>
        </header>

        <section className="mt-8 rounded-[28px] bg-emerald-800 p-6 text-white shadow-[0_18px_45px_rgba(18,93,70,0.25)]">
          <Search className="h-10 w-10" />
          <p className="mt-8 text-sm font-black text-emerald-100">404</p>
          <h1 className="mt-2 text-3xl font-black">{notFoundCopy.title}</h1>
          <p className="mt-3 text-sm font-semibold leading-6 text-emerald-50">
            {notFoundCopy.desc}
          </p>
        </section>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <Link className="rounded-2xl bg-emerald-800 px-4 py-3 text-center text-sm font-black text-white" href="/">
            {notFoundCopy.home}
          </Link>
          <Link className="rounded-2xl border border-stone-200 bg-white px-4 py-3 text-center text-sm font-black text-emerald-800" href="/search">
            {notFoundCopy.search}
          </Link>
        </div>
      </div>
    </main>
  );
}
