import { CheckCircle2, KeyRound, LinkIcon, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { BackButton } from "@/components/BackButton";

const reviewItems = [
  "如果审核需要登录，请在 App Store Connect 的 Review Notes 填写测试账号邮箱和密码。",
  "不登录也可以使用首页、天气、汇率、东京交通、今天吃什么、随机散步、今天去哪玩、租房助手等主要功能。",
  "登录后可测试头像、云同步、收藏、提醒和账号删除。",
  "账号删除入口：我的 → 账号与密码 → 删除账号。",
  "数据来源说明入口：我的 → 数据来源与状态。",
  "反馈和支持入口：我的 → 联系 / 反馈。",
];

const routeItems = [
  { href: "/", label: "首页" },
  { href: "/tools/train-status", label: "东京交通" },
  { href: "/food", label: "今天吃什么" },
  { href: "/tools/rent", label: "租屋助手" },
  { href: "/me", label: "我的" },
  { href: "/account", label: "账号与密码" },
  { href: "/data-status", label: "数据来源与状态" },
  { href: "/privacy", label: "隐私政策" },
  { href: "/terms", label: "使用条款" },
  { href: "/disclaimer", label: "免责声明" },
];

export default function AppReviewPage() {
  return (
    <main className="min-h-screen bg-[#F6FAFF] px-4 py-5 text-[#0F172A]">
      <div className="mx-auto min-h-screen max-w-[430px] px-1 pb-10">
        <div className="mb-5">
          <BackButton fallbackHref="/me" label="返回" />
        </div>

        <section className="rounded-[28px] border border-white/60 bg-white/75 p-5 shadow-[0_18px_45px_rgba(37,99,235,0.10)] backdrop-blur-xl">
          <p className="text-sm font-black text-[#2563EB]">Japan Life</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight">审核说明</h1>
          <p className="mt-3 text-sm font-bold leading-6 text-[#64748B]">
            这里用于准备 App Store 审核和试运营自查，不展示敏感密码。测试账号请填写在 App Store Connect Review Notes。
          </p>
        </section>

        <section className="mt-5 rounded-[28px] border border-white/60 bg-white/80 p-4 shadow-[0_10px_35px_rgba(37,99,235,0.08)]">
          <h2 className="flex items-center gap-2 text-lg font-black">
            <KeyRound className="h-5 w-5 text-[#2563EB]" />
            审核账号与流程
          </h2>
          <div className="mt-3 grid gap-2">
            {reviewItems.map((item) => (
              <p className="flex items-start gap-2 rounded-2xl bg-blue-50/80 px-3 py-2 text-xs font-bold leading-5 text-[#475569]" key={item}>
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                {item}
              </p>
            ))}
          </div>
        </section>

        <section className="mt-5 rounded-[28px] border border-white/60 bg-white/80 p-4 shadow-[0_10px_35px_rgba(37,99,235,0.08)]">
          <h2 className="flex items-center gap-2 text-lg font-black">
            <LinkIcon className="h-5 w-5 text-[#2563EB]" />
            审核常用入口
          </h2>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {routeItems.map((item) => (
              <Link className="rounded-2xl border border-blue-100 bg-blue-50/70 px-3 py-3 text-center text-xs font-black text-[#2563EB]" href={item.href} key={item.href}>
                {item.label}
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-5 rounded-[24px] border border-amber-100 bg-amber-50/90 p-4">
          <h2 className="flex items-center gap-2 text-sm font-black text-amber-900">
            <ShieldCheck className="h-5 w-5" />
            提交前提醒
          </h2>
          <p className="mt-2 text-xs font-bold leading-5 text-amber-900/80">
            请确认生产环境变量、Supabase URL/Auth 回调、ODPT、HotPepper、隐私政策 URL、支持 URL 和测试账号都已在正式环境配置好。
          </p>
        </section>
      </div>
    </main>
  );
}
