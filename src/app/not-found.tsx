import { ArrowLeft, Search } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-[#f5f0e7] text-stone-950">
      <div className="mx-auto flex min-h-screen max-w-[430px] flex-col bg-[#fbf8f2] px-4 py-5 shadow-2xl shadow-stone-300/40">
        <header className="flex items-center justify-between">
          <Link className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-emerald-700 shadow-sm" href="/">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <span className="rounded-full bg-white px-4 py-2 text-sm font-black text-emerald-700 shadow-sm">Japan Life</span>
        </header>

        <section className="mt-8 rounded-[28px] bg-emerald-800 p-6 text-white shadow-[0_18px_45px_rgba(18,93,70,0.25)]">
          <Search className="h-10 w-10" />
          <p className="mt-8 text-sm font-black text-emerald-100">404</p>
          <h1 className="mt-2 text-3xl font-black">没有找到这个页面</h1>
          <p className="mt-3 text-sm font-semibold leading-6 text-emerald-50">
            这个入口可能已经移动。回到首页或搜索工具、地区、App 和生活指南。
          </p>
        </section>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <Link className="rounded-2xl bg-emerald-800 px-4 py-3 text-center text-sm font-black text-white" href="/">
            回到首页
          </Link>
          <Link className="rounded-2xl border border-stone-200 bg-white px-4 py-3 text-center text-sm font-black text-emerald-800" href="/search">
            搜索
          </Link>
        </div>
      </div>
    </main>
  );
}
