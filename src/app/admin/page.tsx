import { ArrowLeft, FileText, Map, Newspaper, ShieldCheck, Store } from "lucide-react";
import Link from "next/link";

const modules = [
  { title: "管理店铺", subtitle: "Manage places / 店舗管理", icon: Store },
  { title: "管理政策", subtitle: "Manage policies / 制度管理", icon: ShieldCheck },
  { title: "管理文章", subtitle: "Manage articles / 記事管理", icon: Newspaper },
  { title: "管理地区", subtitle: "Manage areas / エリア管理", icon: Map },
  { title: "管理认领申请", subtitle: "Manage claims / 申請管理", icon: FileText },
];

export default function AdminPage() {
  return (
    <main className="min-h-screen bg-[#f5f0e7] px-4 py-5 text-stone-950">
      <div className="mx-auto min-h-screen max-w-[430px] bg-[#fbf8f2] px-4 py-5 shadow-2xl shadow-stone-300/40">
        <Link className="mb-5 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-black shadow-sm" href="/">
          <ArrowLeft className="h-4 w-4" />
          返回
        </Link>
        <section className="rounded-[30px] bg-emerald-800 p-6 text-white shadow-[0_18px_45px_rgba(18,93,70,0.22)]">
          <p className="text-sm font-bold text-emerald-100">Coming soon</p>
          <h1 className="mt-2 text-3xl font-black">Admin Preview</h1>
          <p className="mt-3 text-sm font-bold leading-6 text-emerald-50">
            后台功能预览。第一版不含真实登录、数据库或权限系统。
          </p>
        </section>
        <section className="mt-5 grid gap-4">
          {modules.map((item) => {
            const Icon = item.icon;
            return (
              <article className="rounded-[24px] bg-white p-5 shadow-[0_12px_35px_rgba(32,38,34,0.08)]" key={item.title}>
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-800">
                  <Icon className="h-6 w-6" />
                </span>
                <h2 className="mt-4 text-xl font-black">{item.title}</h2>
                <p className="mt-2 text-sm font-bold text-stone-500">{item.subtitle}</p>
                <p className="mt-3 inline-flex rounded-full bg-stone-100 px-3 py-1 text-xs font-black text-stone-500">Coming soon</p>
              </article>
            );
          })}
        </section>
      </div>
    </main>
  );
}
