"use client";

import { Bell, ChevronRight, Database, FileText, HardDrive, Heart, Info, LockKeyhole, MessageCircle, Search, Settings, ShieldCheck, Smartphone, UserRound } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { BackButton } from "@/components/BackButton";
import { useLanguage } from "@/hooks/useLanguage";
import type { Language } from "@/lib/i18n/translations";
import { supabase } from "@/lib/supabase";

type SettingsItem = {
  description: string;
  href: string;
  icon: LucideIcon;
  title: string;
};

type SettingsGroup = {
  items: SettingsItem[];
  title: string;
};

const settingsCopy = {
  "zh-CN": {
    back: "返回",
    eyebrow: "我的功能都在这里",
    subtitle: "账号、收藏、消息、通知、权限和说明页面统一放在设置里。我的页面只保留个人主页。",
    title: "App 设置",
  },
  "zh-TW": {
    back: "返回",
    eyebrow: "我的功能都在這裡",
    subtitle: "帳號、收藏、訊息、通知、權限和說明頁面統一放在設定裡。我的頁面只保留個人主頁。",
    title: "App 設定",
  },
  ja: {
    back: "戻る",
    eyebrow: "機能はこちらにまとめました",
    subtitle: "アカウント、保存、メッセージ、通知、権限、説明ページを設定にまとめました。マイページにはプロフィールだけを残しています。",
    title: "App 設定",
  },
} as const;

const settingsGroups: Record<Language, SettingsGroup[]> = {
  "zh-CN": [
    {
      title: "账号与主页",
      items: [
        { description: "登录、退出、密码和账号删除", href: "/account", icon: LockKeyhole, title: "账号与密码" },
        { description: "在日生活基础资料和地区设置", href: "/onboarding", icon: UserRound, title: "个人资料" },
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
        { description: "查看并清理缓存、最近记录和浏览器临时数据", href: "/me/settings/storage", icon: HardDrive, title: "存储空间" },
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
  ],
  "zh-TW": [
    {
      title: "帳號與主頁",
      items: [
        { description: "登入、登出、密碼和帳號刪除", href: "/account", icon: LockKeyhole, title: "帳號與密碼" },
        { description: "在日生活基礎資料和地區設定", href: "/onboarding", icon: UserRound, title: "個人資料" },
        { description: "公開收藏、讚過、關注粉絲和黑名單設定", href: "/me/settings/privacy", icon: ShieldCheck, title: "隱私設定" },
        { description: "定位、相機、通知等系統權限說明", href: "/me/settings/permissions", icon: Smartphone, title: "系統權限管理" },
      ],
    },
    {
      title: "收藏與訊息",
      items: [
        { description: "店鋪收藏也在這裡，進入後可按分類篩選", href: "/favorites", icon: Heart, title: "我的收藏" },
        { description: "我的貼文、收藏貼文和聯絡申請", href: "/community/me", icon: UserRound, title: "我的社群" },
        { description: "查看 1 對 1 私訊列表", href: "/messages", icon: MessageCircle, title: "私訊列表" },
        { description: "私訊、按讚、評論和系統通知", href: "/notifications", icon: Bell, title: "訊息通知" },
        { description: "明天垃圾、天氣和電車彈窗提醒", href: "/me/settings/notifications", icon: Bell, title: "手機彈窗通知" },
        { description: "待辦事項和生活提醒中心", href: "/reminders", icon: Bell, title: "待辦與提醒" },
        { description: "生活類提醒與通知彙總", href: "/life-alerts", icon: Bell, title: "生活通知" },
      ],
    },
    {
      title: "App 管理",
      items: [
        { description: "管理首頁顯示哪些常用工具", href: "/home-tools", icon: Settings, title: "首頁工具管理" },
        { description: "查看並清理快取、最近記錄和瀏覽器暫存資料", href: "/me/settings/storage", icon: HardDrive, title: "儲存空間" },
        { description: "搜尋 App 內頁面、工具和內容", href: "/search", icon: Search, title: "全域搜尋" },
        { description: "查看 Supabase、API 和本地資料狀態", href: "/data-status", icon: Database, title: "資料來源與狀態" },
        { description: "上線前檢查清單", href: "/app-review", icon: ShieldCheck, title: "上線檢查" },
      ],
    },
    {
      title: "幫助與說明",
      items: [
        { description: "回饋問題或聯絡 Japan Life", href: "/feedback", icon: MessageCircle, title: "聯絡 / 回饋" },
        { description: "App 介紹、版本和使用說明", href: "/about", icon: Info, title: "關於 Japan Life" },
        { description: "隱私、資料和權限說明", href: "/privacy", icon: ShieldCheck, title: "隱私政策" },
        { description: "使用規則和責任範圍", href: "/terms", icon: FileText, title: "使用條款" },
        { description: "外部資料和生活資訊免責聲明", href: "/disclaimer", icon: FileText, title: "免責聲明" },
      ],
    },
  ],
  ja: [
    {
      title: "アカウントとプロフィール",
      items: [
        { description: "ログイン、ログアウト、パスワード、アカウント削除", href: "/account", icon: LockKeyhole, title: "アカウントとパスワード" },
        { description: "日本生活の基本情報とエリア設定", href: "/onboarding", icon: UserRound, title: "プロフィール" },
        { description: "保存、いいね、フォロー、ブロックリストの公開設定", href: "/me/settings/privacy", icon: ShieldCheck, title: "プライバシー設定" },
        { description: "位置情報、カメラ、通知などの権限説明", href: "/me/settings/permissions", icon: Smartphone, title: "システム権限管理" },
      ],
    },
    {
      title: "保存とメッセージ",
      items: [
        { description: "お店の保存もここで分類して確認できます", href: "/favorites", icon: Heart, title: "保存したもの" },
        { description: "自分の投稿、保存投稿、連絡申請", href: "/community/me", icon: UserRound, title: "マイコミュニティ" },
        { description: "1対1 のメッセージ一覧を見る", href: "/messages", icon: MessageCircle, title: "メッセージ一覧" },
        { description: "メッセージ、いいね、コメント、システム通知", href: "/notifications", icon: Bell, title: "通知" },
        { description: "ごみ、天気、電車のポップアップ通知", href: "/me/settings/notifications", icon: Bell, title: "スマホ通知" },
        { description: "ToDo と生活リマインダー", href: "/reminders", icon: Bell, title: "ToDo・リマインダー" },
        { description: "生活系の通知をまとめて確認", href: "/life-alerts", icon: Bell, title: "生活通知" },
      ],
    },
    {
      title: "App 管理",
      items: [
        { description: "ホームに表示するよく使うツールを管理", href: "/home-tools", icon: Settings, title: "ホームツール管理" },
        { description: "キャッシュ、最近の記録、一時データを確認・削除", href: "/me/settings/storage", icon: HardDrive, title: "ストレージ" },
        { description: "App 内のページ、ツール、内容を検索", href: "/search", icon: Search, title: "全体検索" },
        { description: "Supabase、API、ローカルデータの状態を確認", href: "/data-status", icon: Database, title: "データソースと状態" },
        { description: "公開前チェックリスト", href: "/app-review", icon: ShieldCheck, title: "公開前チェック" },
      ],
    },
    {
      title: "ヘルプと説明",
      items: [
        { description: "問題を送信、または Japan Life に連絡", href: "/feedback", icon: MessageCircle, title: "連絡 / フィードバック" },
        { description: "App の紹介、バージョン、使い方", href: "/about", icon: Info, title: "Japan Life について" },
        { description: "プライバシー、データ、権限の説明", href: "/privacy", icon: ShieldCheck, title: "プライバシーポリシー" },
        { description: "利用ルールと責任範囲", href: "/terms", icon: FileText, title: "利用規約" },
        { description: "外部データと生活情報の免責事項", href: "/disclaimer", icon: FileText, title: "免責事項" },
      ],
    },
  ],
};

const adminSettingsCopy: Record<Language, SettingsGroup> = {
  "zh-CN": {
    title: "管理员",
    items: [
      { description: "内容、社区、生活帮手和系统管理", href: "/admin", icon: ShieldCheck, title: "管理后台" },
    ],
  },
  "zh-TW": {
    title: "管理員",
    items: [
      { description: "內容、社群、生活幫手和系統管理", href: "/admin", icon: ShieldCheck, title: "管理後台" },
    ],
  },
  ja: {
    title: "管理者",
    items: [
      { description: "コンテンツ、コミュニティ、生活サポート、システム管理", href: "/admin", icon: ShieldCheck, title: "管理画面" },
    ],
  },
};

export default function AppSettingsPage() {
  const { language } = useLanguage();
  const text = settingsCopy[language];
  const groups = settingsGroups[language];
  const [showAdminEntrance, setShowAdminEntrance] = useState(false);
  const visibleGroups = useMemo(() => (showAdminEntrance ? [...groups, adminSettingsCopy[language]] : groups), [groups, language, showAdminEntrance]);

  useEffect(() => {
    let cancelled = false;

    async function checkAdminAccess() {
      const { data } = supabase ? await supabase.auth.getSession() : { data: { session: null } };
      const token = data.session?.access_token;
      if (!token) {
        if (!cancelled) setShowAdminEntrance(false);
        return;
      }
      const response = await fetch("/api/admin/me", {
        headers: { authorization: `Bearer ${token}` },
      });
      const result = (await response.json().catch(() => null)) as { isAdmin?: unknown } | null;
      if (!cancelled) setShowAdminEntrance(result?.isAdmin === true);
    }

    void checkAdminAccess();
    const { data: listener } = supabase
      ? supabase.auth.onAuthStateChange(() => {
          void checkAdminAccess();
        })
      : { data: { subscription: null } };

    return () => {
      cancelled = true;
      listener.subscription?.unsubscribe();
    };
  }, []);

  return (
    <main className="min-h-screen bg-[#F6FAFF] text-[#0F172A]">
      <div className="mx-auto min-h-screen max-w-[430px] bg-[#F6FAFF] px-4 pb-24 pt-5">
        <header className="mb-4 flex items-center justify-between">
          <BackButton fallbackHref="/me" label={text.back} />
          <span className="rounded-full bg-white px-4 py-2 text-xs font-black text-[#2563EB] shadow-sm">Japan Life</span>
        </header>

        <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_18px_45px_rgba(37,99,235,0.10)]">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-[#2563EB]">
            <Settings className="h-7 w-7" />
          </span>
          <p className="mt-4 text-sm font-black text-[#2563EB]">{text.eyebrow}</p>
          <h1 className="mt-1 text-3xl font-black tracking-tight">{text.title}</h1>
          <p className="mt-3 text-sm font-bold leading-6 text-[#475569]">{text.subtitle}</p>
        </section>

        <div className="mt-4 grid gap-3">
          {visibleGroups.map((group) => (
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

function SettingsLink({ description, href, icon: Icon, title }: SettingsItem) {
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
