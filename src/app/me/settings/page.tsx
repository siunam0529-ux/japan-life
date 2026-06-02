"use client";

import { Bell, ChevronRight, Database, FileText, Heart, Info, LockKeyhole, MessageCircle, Search, Settings, ShieldCheck, Smartphone, UserRound } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { BackButton } from "@/components/BackButton";

const settingsGroups = [
  {
    title: "账号与主页",
    items: [
      { description: "登录、退出、密码和账号删除", href: "/account", icon: LockKeyhole, title: "账号与密码" },
      { description: "在日生活基础资料和地区设置", href: "/onboarding", icon: UserRound, title: "个人资料" },
      { description: "社区头像、名字、ID 和简介", href: "/community/profile", icon: UserRound, title: "社区资料" },
      { description: "公开收藏、赞过、关注粉丝和黑名单设置", href: "/me/settings/privacy", icon: ShieldCheck, title: "隐私设置" },
      { description: "定位、相机、通知等系统权限说明", href: "/me/settings/permissions", icon: Smartphone, title: "系统权限管理" },
    ],
  },
  {
    title: "收藏与消息",
    items: [
      { description: "店铺收藏也在这里，进去后可按分类筛选", href: "/favorites", icon: Heart, title: "我的收藏" },
      { description: "我的帖子、收藏帖子和联系申请", href: "/community/me", icon: UserRound, title: "我的社区" },
      { description: "查看 1 对 1 私信列表", href: "/messages", icon: MessageCircle, title: "私信列表" },
      { description: "私信、点赞、评论和系统通知", href: "/notifications", icon: Bell, title: "消息通知" },
      { description: "明天垃圾、天气和电车弹窗提醒", href: "/me/settings/notifications", icon: Bell, title: "手机弹窗通知" },
      { description: "待办事项和生活提醒中心", href: "/reminders", icon: Bell, title: "待办与提醒" },
      { description: "生活类提醒与通知汇总", href: "/life-alerts", icon: Bell, title: "生活通知" },
    ],
  },
  {
    title: "App 管理",
    items: [
      { description: "管理首页显示哪些常用工具", href: "/home-tools", icon: Settings, title: "首页工具管理" },
      { description: "搜索 App 内页面、工具和内容", href: "/search", icon: Search, title: "全局搜索" },
      { description: "查看 Supabase、API 和本地数据状态", href: "/data-status", icon: Database, title: "数据来源与状态" },
      { description: "上线前检查清单", href: "/app-review", icon: ShieldCheck, title: "上线检查" },
    ],
  },
  {
    title: "帮助与说明",
    items: [
      { description: "反馈问题或联系 Japan Life", href: "/feedback", icon: MessageCircle, title: "联系 / 反馈" },
      { description: "App 介绍、版本和使用说明", href: "/about", icon: Info, title: "关于 Japan Life" },
      { description: "隐私、数据和权限说明", href: "/privacy", icon: ShieldCheck, title: "隐私政策" },
      { description: "使用规则和责任范围", href: "/terms", icon: FileText, title: "使用条款" },
      { description: "外部数据和生活信息免责声明", href: "/disclaimer", icon: FileText, title: "免责声明" },
    ],
  },
] as const;

export default function AppSettingsPage() {
  return (
    <main className="min-h-screen bg-[#F6FAFF] text-[#0F172A]">
      <div className="mx-auto min-h-screen max-w-[430px] bg-[#F6FAFF] px-4 pb-24 pt-5">
        <header className="mb-4 flex items-center justify-between">
          <BackButton fallbackHref="/me" label="返回" />
          <span className="rounded-full bg-white px-4 py-2 text-xs font-black text-[#2563EB] shadow-sm">Japan Life</span>
        </header>

        <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_18px_45px_rgba(37,99,235,0.10)]">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-[#2563EB]">
            <Settings className="h-7 w-7" />
          </span>
          <p className="mt-4 text-sm font-black text-[#2563EB]">我的功能都在这里</p>
          <h1 className="mt-1 text-3xl font-black tracking-tight">App 设置</h1>
          <p className="mt-3 text-sm font-bold leading-6 text-[#475569]">账号、收藏、消息、通知、权限和说明页面统一放在设置里。我的页面只保留社区个人主页。</p>
        </section>

        <div className="mt-4 grid gap-3">
          {settingsGroups.map((group) => (
            <SettingsSection key={group.title} title={group.title}>
              {group.items.map((item) => (
                <SettingsLink description={item.description} href={item.href} icon={item.icon} key={item.href} title={item.title} />
              ))}
            </SettingsSection>
          ))}
        </div>
      </div>
    </main>
  );
}

function SettingsSection({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <section className="rounded-[24px] border border-slate-200 bg-white p-2 shadow-sm">
      <h2 className="px-3 pb-1 pt-2 text-[13px] font-black text-[#2563EB]">{title}</h2>
      <div className="grid gap-1">{children}</div>
    </section>
  );
}

function SettingsLink({ description, href, icon: Icon, title }: { description: string; href: string; icon: LucideIcon; title: string }) {
  return (
    <Link className="flex items-center gap-3 rounded-2xl bg-white px-3 py-3 text-left transition active:scale-[0.99]" href={href}>
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-[#2563eb]">
        <Icon className="h-4.5 w-4.5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-black text-[#0f172a]">{title}</span>
        <span className="mt-0.5 block truncate text-[11px] font-bold text-[#64748B]">{description}</span>
      </span>
      <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
    </Link>
  );
}
