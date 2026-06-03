import { ArrowLeft, FileText, MessageSquare, Store } from "lucide-react";
import Link from "next/link";

export default function AdminContentPage() {
  return (
    <main className="min-h-screen bg-[#f6f8fb] px-4 py-6 text-[#061a3a]">
      <div className="mx-auto w-full max-w-4xl">
        <Link href="/admin" className="inline-flex h-10 items-center gap-2 rounded-full bg-white px-4 text-sm font-black text-[#2563EB] shadow-sm ring-1 ring-blue-100">
          <ArrowLeft className="h-4 w-4" />
          返回
        </Link>
        <h1 className="mt-6 text-3xl font-black">内容管理</h1>
        <p className="mt-2 text-sm font-bold leading-6 text-slate-500">当前内容运营入口集中在社区管理、社区检测和店铺导入里。</p>
        <section className="mt-6 grid gap-3 sm:grid-cols-2">
          <Link href="/admin/community" className="rounded-[20px] border border-slate-200 bg-white p-4 shadow-sm">
            <MessageSquare className="h-6 w-6 text-[#2563EB]" />
            <h2 className="mt-3 text-base font-black">社区管理</h2>
            <p className="mt-1 text-sm font-bold text-slate-500">处理帖子、评论、举报和官方私信。</p>
          </Link>
          <Link href="/admin/community/check" className="rounded-[20px] border border-slate-200 bg-white p-4 shadow-sm">
            <FileText className="h-6 w-6 text-[#2563EB]" />
            <h2 className="mt-3 text-base font-black">社区检测</h2>
            <p className="mt-1 text-sm font-bold text-slate-500">检查远程表结构和写入权限。</p>
          </Link>
          <Link href="/admin/stores/hotpepper-import" className="rounded-[20px] border border-slate-200 bg-white p-4 shadow-sm">
            <Store className="h-6 w-6 text-[#2563EB]" />
            <h2 className="mt-3 text-base font-black">HotPepper 导入</h2>
            <p className="mt-1 text-sm font-bold text-slate-500">搜索、预览并导入确认可用的店铺。</p>
          </Link>
        </section>
      </div>
    </main>
  );
}
