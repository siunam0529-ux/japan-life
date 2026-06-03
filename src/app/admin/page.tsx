"use client";

import { FileText, Home, LifeBuoy, MessageCircle, Settings } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { BackButton } from "@/components/BackButton";
import { getCachedLifeHelperData } from "@/lib/appPreload";
import { readCommunityComments, readCommunityPosts, readCommunityReports } from "@/lib/community/repository";

const sessionKey = "japan-life-admin-auth";

type AdminDashboardStats = {
  apps: number;
  benefits: number;
  communityPending: number;
  friendlyShops: number;
  helperPending: number;
  helperRequests: number;
  promotions: number;
  reports: number;
};

const emptyDashboardStats: AdminDashboardStats = {
  apps: 0,
  benefits: 0,
  communityPending: 0,
  friendlyShops: 0,
  helperPending: 0,
  helperRequests: 0,
  promotions: 0,
  reports: 0,
};

const moduleGroups = [
  {
    icon: FileText,
    items: [
      { description: "福利 / 支援制度内容", href: "/admin/benefits", label: "福利 / 支援制度" },
      { description: "搜索、预览并导入 HotPepper 店铺", href: "/admin/stores/hotpepper-import", label: "HotPepper 导入" },
      { description: "查看用户反馈和问题建议", href: "/admin/feedback", label: "用户反馈" },
    ],
    title: "内容管理",
  },
  {
    icon: MessageCircle,
    items: [
      { description: "帖子、评论、举报和申请联系", href: "/admin/community", label: "社区管理" },
      { description: "社区统计总览", href: "/admin/community/stats", label: "社区数据看板" },
      { description: "Supabase 表和写入检测", href: "/admin/community/check", label: "Supabase 检测" },
      { description: "部署与数据模式检查", href: "/admin/community/setup", label: "社区部署检查" },
    ],
    title: "社区管理",
  },
  {
    icon: LifeBuoy,
    items: [
      { description: "帮忙需求和申请联系", href: "/admin/life-helper", label: "生活帮手管理" },
      { description: "商家入驻审核", href: "/admin/life-helper?tab=business", label: "商家入驻" },
      { description: "个人帮手审核", href: "/admin/life-helper?tab=helpers", label: "个人帮手" },
      { description: "风险和待处理内容", href: "/admin/life-helper?tab=risk", label: "举报风险" },
    ],
    title: "生活帮手管理",
  },
  {
    icon: Settings,
    items: [
      { description: "社区连接检测和环境变量", href: "/admin/community/check", label: "环境检查" },
      { description: "Supabase 与本机兜底数据状态", href: "/admin/community/setup", label: "数据模式" },
      { description: "当前使用管理员密码保护", href: "#admin-login-status", label: "后台设置" },
    ],
    title: "系统工具",
  },
] as const;

const allPageEntranceGroups = [
  {
    title: "主页面",
    items: [
      { href: "/", label: "首页" },
      { href: "/home-tools", label: "常用工具" },
      { href: "/search", label: "搜索" },
      { href: "/notifications", label: "全站通知" },
      { href: "/favorites", label: "收藏" },
      { href: "/me", label: "我的" },
      { href: "/me/settings", label: "我的设置" },
      { href: "/me/settings/storage", label: "存储管理" },
      { href: "/data-status", label: "数据状态" },
    ],
  },
  {
    title: "账号",
    items: [
      { href: "/login", label: "登录" },
      { href: "/signup", label: "注册" },
      { href: "/forgot-password", label: "忘记密码" },
      { href: "/reset-password", label: "重设密码" },
      { href: "/account", label: "账号" },
      { href: "/onboarding", label: "初始设置" },
    ],
  },
  {
    title: "社区",
    items: [
      { href: "/community", label: "社区入口" },
      { href: "/community/new", label: "发布社区内容" },
      { href: "/community/me", label: "我的社区" },
    ],
  },
  {
    title: "生活帮手",
    items: [
      { href: "/life-helper", label: "生活帮手" },
      { href: "/life-helper/join", label: "入驻选择" },
      { href: "/life-helper/join/business", label: "商家入驻" },
      { href: "/life-helper/join/helper", label: "个人帮手入驻" },
    ],
  },
  {
    title: "后台",
    items: [
      { href: "/admin", label: "后台总览" },
      { href: "/admin/benefits", label: "福利管理" },
      { href: "/admin/community", label: "社区管理" },
      { href: "/admin/community/check", label: "社区 Supabase 检测" },
      { href: "/admin/community/stats", label: "社区数据看板" },
      { href: "/admin/community/setup", label: "社区部署检查" },
      { href: "/admin/life-helper", label: "生活帮手后台" },
      { href: "/admin/feedback", label: "反馈后台" },
      { href: "/admin/stores/hotpepper-import", label: "HotPepper 导入" },
    ],
  },
  {
    title: "工具与内容",
    items: [
      { href: "/apps", label: "推荐应用" },
      { href: "/deals", label: "优惠" },
      { href: "/places", label: "店铺" },
      { href: "/benefits", label: "福利制度" },
      { href: "/claim", label: "店铺上架申请" },
      { href: "/claim/hotpepper", label: "HotPepper 店铺申请" },
      { href: "/areas", label: "区域" },
      { href: "/resources", label: "资源" },
      { href: "/life-alerts", label: "今天注意什么" },
      { href: "/reminders", label: "提醒" },
      { href: "/tools/weather", label: "天气" },
      { href: "/tools/exchange", label: "汇率" },
      { href: "/tools/train-status", label: "路线状态" },
      { href: "/tools/holidays", label: "假期" },
      { href: "/tools/rent", label: "租金" },
      { href: "/tools/salary", label: "工资" },
      { href: "/tools/living-cost", label: "生活费" },
      { href: "/tools/procedure-navigator", label: "手续导航" },
      { href: "/tools/life-checklist", label: "生活清单" },
      { href: "/tools/visa-reminder", label: "签证提醒" },
      { href: "/walk", label: "散步" },
      { href: "/food", label: "吃什么" },
      { href: "/play", label: "去哪玩" },
      { href: "/train-deals", label: "交通优惠" },
    ],
  },
] as const;

export default function AdminPage() {
  const [dashboardStats, setDashboardStats] = useState<AdminDashboardStats>(emptyDashboardStats);
  const [loading, setLoading] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [message, setMessage] = useState("");
  const [password, setPassword] = useState("");
  const [storedPassword, setStoredPassword] = useState("");

  const loadDashboardStats = useCallback(async (authPassword = storedPassword) => {
    const communityPosts = readCommunityPosts();
    const communityComments = readCommunityComments();
    const communityReports = readCommunityReports();
    const lifeHelperData = getCachedLifeHelperData();
    const helperRequests = lifeHelperData?.requests ?? [];
    const helperApplications = lifeHelperData?.applications ?? [];
    const businessApplications = lifeHelperData?.businessApplications ?? [];
    const personalApplications = lifeHelperData?.helpers ?? [];

    const baseStats: AdminDashboardStats = {
      ...emptyDashboardStats,
      communityPending: communityPosts.filter((post) => post.status === "pending" || post.status === "reported").length,
      helperPending: businessApplications.filter((item) => item.status === "pending").length + personalApplications.filter((item) => item.status === "pending").length,
      helperRequests: helperRequests.filter((item) => item.status === "open").length,
      reports: communityReports.length + communityComments.filter((comment) => comment.status === "reported").length + helperApplications.length,
    };

    if (!authPassword) {
      setDashboardStats(baseStats);
      return;
    }

    const [apps, promotions, friendlyShops, benefits] = await Promise.all([
      fetchAdminCount("recommended_apps", authPassword),
      fetchAdminCount("promotion_links", authPassword),
      fetchAdminCount("friendly_shops", authPassword),
      fetchBenefitsCount(authPassword),
    ]);

    setDashboardStats({
      ...baseStats,
      apps,
      benefits,
      friendlyShops,
      promotions,
    });
  }, [storedPassword]);

  useEffect(() => {
    const saved = window.sessionStorage.getItem(sessionKey);
    if (saved) {
      setStoredPassword(saved);
      setLoggedIn(true);
      void loadDashboardStats(saved);
    } else {
      void loadDashboardStats("");
    }
  }, [loadDashboardStats]);

  async function handleLogin() {
    if (!password.trim()) return;
    setLoading(true);
    setMessage("");
    const response = await fetch("/api/admin/community/check-auth", {
      body: JSON.stringify({ password: password.trim() }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });
    setLoading(false);
    if (!response.ok) {
      setMessage("管理员密码不正确");
      return;
    }
    window.sessionStorage.setItem(sessionKey, password.trim());
    setStoredPassword(password.trim());
    setLoggedIn(true);
    setPassword("");
    await loadDashboardStats(password.trim());
  }

  function logout() {
    window.sessionStorage.removeItem(sessionKey);
    setLoggedIn(false);
    setStoredPassword("");
    setPassword("");
  }

  if (!loggedIn) {
    return (
      <main className="admin-page min-h-screen bg-[#F6FAFF] px-4 py-5 text-[#0F172A]">
        <div className="mx-auto min-h-screen max-w-[430px] px-1 pb-10">
          <div className="mb-5">
            <BackButton label="返回" />
          </div>
          <section className="rounded-[28px] border border-white/60 bg-white/75 p-5 shadow-[0_18px_45px_rgba(37,99,235,0.10)] backdrop-blur-xl">
            <p className="text-sm font-black text-[#2563EB]">Japan Life 后台</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight">后台总览</h1>
            <p className="mt-3 text-sm font-bold leading-6 text-[#64748B]">输入管理员密码后进入后台总览。</p>
            <input className="mt-5 h-12 w-full rounded-2xl border border-blue-100 bg-blue-50/70 px-4 text-sm font-bold outline-none focus:border-[#2563EB]" onChange={(event) => setPassword(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") void handleLogin(); }} placeholder="管理员密码" type="password" value={password} />
            <button className="admin-primary-button mt-3 h-12 w-full rounded-2xl text-sm font-black shadow-sm disabled:opacity-50" disabled={loading} onClick={handleLogin} type="button">
              {loading ? "验证中..." : "进入后台"}
            </button>
            {message ? <p className="mt-3 rounded-2xl bg-rose-50 px-4 py-3 text-xs font-bold leading-5 text-rose-700">{message}</p> : null}
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="admin-page min-h-screen bg-[#F6FAFF] px-4 py-5 text-[#0F172A]">
      <div className="mx-auto min-h-screen w-full max-w-[1080px] px-1 pb-10">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <BackButton label="返回" />
            <Link className="inline-flex h-9 items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 text-xs font-black text-[#334155] shadow-sm" href="/">
              <Home className="h-4 w-4" />
              返回首页
            </Link>
          </div>
          <button className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-black text-[#334155] shadow-sm" onClick={logout} type="button">退出</button>
        </div>

        <section id="overview" className="rounded-[28px] border border-white/60 bg-white/75 p-5 shadow-[0_18px_45px_rgba(37,99,235,0.10)] backdrop-blur-xl">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm font-black text-[#2563EB]">Japan Life 后台</p>
              <h1 className="mt-2 text-3xl font-black tracking-tight">后台总览</h1>
              <p className="mt-3 text-sm font-bold leading-6 text-[#64748B]">内容、社区、生活帮手与系统管理入口</p>
            </div>
            <span id="admin-login-status" className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-black text-emerald-700 ring-1 ring-emerald-100">
              已通过管理员密码
            </span>
          </div>
        </section>

        <section className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <DashboardStatCard label="推荐应用数量" value={dashboardStats.apps} />
          <DashboardStatCard label="优惠链接数量" value={dashboardStats.promotions} />
          <DashboardStatCard label="友好店铺数量" value={dashboardStats.friendlyShops} />
          <DashboardStatCard label="福利制度数量" value={dashboardStats.benefits} />
          <DashboardStatCard label="社区待审核数量" value={dashboardStats.communityPending} />
          <DashboardStatCard label="生活帮手待审核数量" value={dashboardStats.helperRequests} />
          <DashboardStatCard label="商家入驻待审核数量" value={dashboardStats.helperPending} />
          <DashboardStatCard label="举报内容数量" value={dashboardStats.reports} />
        </section>

        <section className="mt-5 grid gap-4 lg:grid-cols-2">
          {moduleGroups.map((group) => {
            const Icon = group.icon;
            return (
              <article className="rounded-[24px] border border-[rgba(226,232,240,0.9)] bg-white/86 p-[18px] shadow-[0_12px_28px_rgba(15,76,129,0.08)]" key={group.title}>
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-[#2563EB] ring-1 ring-blue-100">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h2 className="text-[18px] font-[850] text-[#061a3a]">{group.title}</h2>
                </div>
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  {group.items.map((entry) => (
                    <Link className="rounded-[18px] border border-blue-100 bg-blue-50/50 p-3 transition hover:bg-blue-50" href={entry.href} key={entry.label}>
                      <p className="text-sm font-black text-[#061a3a]">{entry.label}</p>
                      <p className="mt-1 text-[11px] font-bold leading-4 text-[#64748B]">{entry.description}</p>
                    </Link>
                  ))}
                </div>
              </article>
            );
          })}
        </section>

        <section id="all-page-entrances" className="mt-5 rounded-[28px] border border-white/60 bg-white/75 p-4 shadow-[0_10px_35px_rgba(37,99,235,0.08)] backdrop-blur-xl">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-xl font-black">全部页面入口</h2>
              <p className="mt-1 text-xs font-bold leading-5 text-[#64748B]">把 App 里不容易点到的页面集中放在这里，方便上线前逐个打开检查。</p>
            </div>
            <span className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-black text-[#2563EB] ring-1 ring-blue-100">
              {allPageEntranceGroups.reduce((total, group) => total + group.items.length, 0)} 个入口
            </span>
          </div>
          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            {allPageEntranceGroups.map((group) => (
              <article className="rounded-[22px] border border-blue-100 bg-blue-50/45 p-3" key={group.title}>
                <h3 className="text-sm font-black text-[#061a3a]">{group.title}</h3>
                <div className="mt-3 flex flex-wrap gap-2">
                  {group.items.map((item) => (
                    <Link className="inline-flex min-h-9 items-center rounded-full border border-white/80 bg-white/90 px-3 py-2 text-xs font-black text-[#2563EB] shadow-sm transition hover:bg-white" href={item.href} key={`${group.title}-${item.href}`}>
                      {item.label}
                    </Link>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

async function fetchAdminCount(table: string, password: string) {
  try {
    const response = await fetch(`/api/admin/${table}`, { headers: { "x-admin-password": password } });
    if (!response.ok) return 0;
    const data = (await response.json()) as { items?: unknown[] };
    return data.items?.length ?? 0;
  } catch {
    return 0;
  }
}

async function fetchBenefitsCount(password: string) {
  try {
    const response = await fetch("/api/admin/benefits", { headers: { "x-admin-password": password } });
    if (!response.ok) return 0;
    const data = (await response.json()) as { items?: unknown[] };
    return data.items?.length ?? 0;
  } catch {
    return 0;
  }
}

function DashboardStatCard({ label, value }: { label: string; value: number }) {
  return (
    <article className="rounded-[24px] border border-[rgba(226,232,240,0.9)] bg-white/86 p-[18px] shadow-[0_12px_28px_rgba(15,76,129,0.08)]">
      <p className="text-[26px] font-[850] leading-8 text-[#061a3a]">{value}</p>
      <p className="mt-2 text-xs font-bold leading-5 text-[#64748B]">{label}</p>
    </article>
  );
}
