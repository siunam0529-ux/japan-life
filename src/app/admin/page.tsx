import { MessageSquare, ShieldCheck, Settings } from "lucide-react";
import Link from "next/link";

const adminLinks = [
  { href: "/admin/community", icon: MessageSquare, title: "Community", description: "Posts, comments, reports, and official messages" },
  { href: "/admin/community/check", icon: ShieldCheck, title: "Community Check", description: "Supabase tables and write checks" },
  { href: "/admin/content", icon: Settings, title: "Content", description: "Content operation shortcuts" },
];

export default function AdminPage() {
  return (
    <main className="min-h-screen bg-[#f6f8fb] px-4 py-6 text-[#061a3a]">
      <div className="mx-auto w-full max-w-4xl">
        <p className="text-xs font-black text-[#2563EB]">Japan Life Admin</p>
        <h1 className="mt-2 text-3xl font-black">Admin</h1>
        <section className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {adminLinks.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href} className="rounded-[20px] border border-slate-200 bg-white p-4 shadow-sm transition hover:border-blue-200 hover:shadow-md">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-[#2563EB]">
                  <Icon className="h-5 w-5" />
                </span>
                <h2 className="mt-4 text-base font-black">{item.title}</h2>
                <p className="mt-1 text-sm font-bold leading-6 text-slate-500">{item.description}</p>
              </Link>
            );
          })}
        </section>
      </div>
    </main>
  );
}
