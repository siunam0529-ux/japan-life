import { CheckCircle2, FileText, Info, TriangleAlert, XCircle } from "lucide-react";
import Link from "next/link";
import { adminCommunityHref } from "@/lib/community/routes";
import { hasSupabaseConfig, hasSupabaseServiceConfig, supabaseConfigError, supabaseServiceConfigError } from "@/lib/supabase";

const checks = [
  {
    description: "社区前台读取 Supabase 需要 NEXT_PUBLIC_SUPABASE_URL 和 NEXT_PUBLIC_SUPABASE_ANON_KEY。",
    ok: hasSupabaseConfig,
    title: "Supabase URL / Anon Key",
    value: hasSupabaseConfig ? "已检测到" : supabaseConfigError,
  },
  {
    description: "后台服务端管理 API 如需绕过 RLS，需要 service role key。不要暴露到前端。",
    ok: hasSupabaseServiceConfig,
    title: "Supabase Service Role Key",
    value: hasSupabaseServiceConfig ? "已检测到" : supabaseServiceConfigError,
  },
  {
    description: "当前项目使用 ADMIN_PASSWORD 进入后台管理。",
    ok: Boolean(process.env.ADMIN_PASSWORD?.trim()),
    title: "ADMIN_PASSWORD",
    value: process.env.ADMIN_PASSWORD?.trim() ? "已检测到" : "未检测到 ADMIN_PASSWORD",
  },
  {
    description: "用于 SEO、分享链接、canonical、sitemap 和部署域名相关功能。",
    ok: Boolean(process.env.NEXT_PUBLIC_SITE_URL?.trim()),
    title: "NEXT_PUBLIC_SITE_URL",
    value: process.env.NEXT_PUBLIC_SITE_URL?.trim() ? "已检测到" : "未检测到，可上线前补充",
  },
];

const manualItems = [
  "已确认现有 Supabase 社区表存在，不需要重复创建表。",
  "已确认不需要重新跑 SQL；如发现缺字段，先单独列出后再手动补。",
  "已在 Vercel 配置 NEXT_PUBLIC_SUPABASE_URL 和 NEXT_PUBLIC_SUPABASE_ANON_KEY。",
  "已在 Vercel 配置 ADMIN_PASSWORD。",
  "如使用服务端后台管理 API，已在 Vercel 配置 SUPABASE_SERVICE_ROLE_KEY。",
  "当前第一版未接社区真实图片上传，暂时不需要创建 community-images bucket。",
];

export default function AdminCommunitySetupPage() {
  return (
    <main className="jl-tool-theme min-h-screen text-[#061a3a]">
      <div className="jl-tool-shell mx-auto min-h-screen w-full max-w-[960px] px-5 py-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link className="inline-flex h-10 items-center rounded-full bg-white/85 px-4 text-sm font-black text-[#2563EB] shadow-sm ring-1 ring-blue-100" href={adminCommunityHref}>
            返回社区管理
          </Link>
          <span className="rounded-full bg-white/85 px-4 py-2 text-xs font-black text-[#2563EB] shadow-sm ring-1 ring-blue-100">
            {process.env.NODE_ENV}
          </span>
        </div>

        <section className="mt-5 rounded-[28px] border border-white/80 bg-white/85 p-5 shadow-[0_18px_40px_rgba(37,99,235,0.12)] backdrop-blur">
          <p className="text-xs font-black text-[#2563EB]">Community Setup</p>
          <h1 className="mt-2 text-[28px] font-[850] leading-9">社区配置检查</h1>
          <p className="mt-3 max-w-2xl text-sm font-bold leading-6 text-slate-600">
            这个页面只做轻量提示。当前第一版不接社区 Storage，不新增 SQL，也不自动确认 Supabase Dashboard 内部状态。
          </p>
          <div className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-sm font-black text-[#1D4ED8] ring-1 ring-blue-100">
            <FileText className="h-4 w-4" />
            文档路径：docs/community-setup.md
          </div>
        </section>

        <section className="mt-5 grid gap-3 md:grid-cols-2">
          {checks.map((item) => (
            <article className="rounded-[22px] border border-[rgba(226,232,240,0.85)] bg-[rgba(255,255,255,0.82)] p-[14px] shadow-[0_10px_24px_rgba(15,76,129,0.07)]" key={item.title}>
              <div className="flex items-start gap-3">
                <span className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl ${item.ok ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
                  {item.ok ? <CheckCircle2 className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
                </span>
                <div className="min-w-0">
                  <h2 className="text-[14px] font-[850] text-[#061a3a]">{item.title}</h2>
                  <p className="mt-1 text-[12px] font-bold leading-[19px] text-[#40546f]">{item.description}</p>
                  <p className="mt-2 rounded-2xl bg-blue-50/80 px-3 py-2 text-[11px] font-black leading-4 text-[#1D4ED8] ring-1 ring-blue-100">{item.value}</p>
                </div>
              </div>
            </article>
          ))}
        </section>

        <section className="mt-5 rounded-[22px] border border-[rgba(226,232,240,0.85)] bg-[rgba(255,255,255,0.82)] p-[14px] shadow-[0_10px_24px_rgba(15,76,129,0.07)]">
          <div className="flex items-center gap-2 text-[14px] font-[850] text-[#061a3a]">
            <TriangleAlert className="h-5 w-5 text-amber-600" />
            仍需手动确认
          </div>
          <div className="mt-3 grid gap-2">
            {manualItems.map((item) => (
              <div className="flex items-start gap-2 rounded-2xl bg-white/70 px-3 py-2 text-[12px] font-bold leading-[19px] text-[#40546f] ring-1 ring-blue-100" key={item}>
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#2563EB]" />
                {item}
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
