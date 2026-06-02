"use client";

import { ArrowLeft, BarChart3, MessageCircle, RefreshCw, ShieldAlert, Star, Users } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  readCommunityComments,
  readCommunityNotifications,
  readCommunityPosts,
  readCommunityReports,
} from "@/lib/community/repository";
import type { CommunityPostStatus } from "@/lib/community/types";

const sessionKey = "japan-life-admin-auth";

const statusLabels: Record<CommunityPostStatus, string> = {
  deleted: "已删除",
  hidden: "已隐藏",
  pending: "待审核",
  published: "已发布",
  reported: "被举报",
};

export default function AdminCommunityStatsPage() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    setLoggedIn(Boolean(window.sessionStorage.getItem(sessionKey)));
  }, []);

  const stats = (() => {
    void refreshKey;
    const posts = readCommunityPosts();
    const comments = readCommunityComments();
    const reports = readCommunityReports();
    const notifications = readCommunityNotifications();
    const publishedPosts = posts.filter((post) => post.status === "published");
    const pendingPosts = posts.filter((post) => post.status === "pending");
    const reportedPosts = posts.filter((post) => post.status === "reported" || (post.reportCount ?? 0) > 0);
    const featuredPosts = posts.filter((post) => Boolean(post.isFeatured || post.isOfficialRecommended || post.isPinned));

    return {
      comments: comments.length,
      featuredPosts: featuredPosts.length,
      notifications: notifications.length,
      pendingPosts: pendingPosts.length,
      posts: posts.length,
      publishedPosts: publishedPosts.length,
      reportedPosts: reportedPosts.length + reports.length,
      statusRows: (["pending", "published", "reported", "hidden", "deleted"] as CommunityPostStatus[]).map((status) => ({
        count: posts.filter((post) => post.status === status).length,
        label: statusLabels[status],
      })),
    };
  })();

  async function handleLogin() {
    if (!password.trim()) return;
    setMessage("");
    const response = await fetch("/api/admin/community/check-auth", {
      body: JSON.stringify({ password: password.trim() }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });
    if (!response.ok) {
      setMessage("管理员密码不正确");
      return;
    }
    window.sessionStorage.setItem(sessionKey, password.trim());
    setLoggedIn(true);
    setPassword("");
  }

  if (!loggedIn) {
    return (
      <main className="admin-page min-h-screen bg-[#F6FAFF] px-4 py-5 text-[#0F172A]">
        <div className="mx-auto min-h-screen w-full max-w-[430px] pb-10">
          <Link className="inline-flex h-9 items-center gap-2 rounded-full bg-white px-4 text-sm font-black text-[#2563EB] shadow-sm ring-1 ring-blue-100" href="/admin">
            <ArrowLeft className="h-4 w-4" />
            返回后台
          </Link>
          <section className="mt-5 rounded-[28px] border border-white/70 bg-white/85 p-5 shadow-[0_18px_45px_rgba(37,99,235,0.10)]">
            <p className="text-sm font-black text-[#2563EB]">Community Stats</p>
            <h1 className="mt-2 text-3xl font-black">社区数据看板</h1>
            <p className="mt-2 text-sm font-bold leading-6 text-[#64748B]">请输入管理员密码查看社区统计。</p>
            <input className="mt-5 h-12 w-full rounded-2xl border border-blue-100 bg-blue-50/70 px-4 text-sm font-bold outline-none focus:border-[#2563EB]" onChange={(event) => setPassword(event.target.value)} placeholder="管理员密码" type="password" value={password} />
            <button className="admin-primary-button mt-3 h-12 w-full rounded-2xl text-sm font-black shadow-sm" onClick={handleLogin} type="button">进入看板</button>
            {message ? <p className="mt-3 rounded-2xl bg-rose-50 px-4 py-3 text-xs font-bold text-rose-700">{message}</p> : null}
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="admin-page min-h-screen bg-[#F6FAFF] px-4 py-5 text-[#0F172A]">
      <div className="mx-auto min-h-screen w-full max-w-[1080px] pb-10">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <Link className="inline-flex h-9 items-center gap-2 rounded-full bg-white px-4 text-sm font-black text-[#2563EB] shadow-sm ring-1 ring-blue-100" href="/admin/community">
            <ArrowLeft className="h-4 w-4" />
            返回社区后台
          </Link>
          <button className="inline-flex h-9 items-center gap-2 rounded-full bg-white px-4 text-xs font-black text-[#2563EB] shadow-sm ring-1 ring-blue-100" onClick={() => setRefreshKey((value) => value + 1)} type="button">
            <RefreshCw className="h-4 w-4" />
            刷新
          </button>
        </header>

        <section className="mt-5 rounded-[28px] border border-white/70 bg-white/85 p-5 shadow-[0_18px_45px_rgba(37,99,235,0.10)]">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-[#2563EB] ring-1 ring-blue-100">
            <BarChart3 className="h-6 w-6" />
          </span>
          <h1 className="mt-4 text-3xl font-black">社区数据看板</h1>
          <p className="mt-2 text-sm font-bold leading-6 text-[#64748B]">用于上线前快速查看帖子、评论、举报和通知数量。第一版只做轻量统计，不改数据库。</p>
        </section>

        <section className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={<MessageCircle className="h-5 w-5" />} label="帖子总数" value={stats.posts} />
          <StatCard icon={<Users className="h-5 w-5" />} label="评论总数" value={stats.comments} />
          <StatCard icon={<ShieldAlert className="h-5 w-5" />} label="待处理举报" value={stats.reportedPosts} />
          <StatCard icon={<Star className="h-5 w-5" />} label="精选 / 置顶" value={stats.featuredPosts} />
        </section>

        <section className="mt-4 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-[24px] border border-[rgba(226,232,240,0.9)] bg-white/86 p-[18px] shadow-[0_12px_28px_rgba(15,76,129,0.08)]">
            <h2 className="text-lg font-black text-[#061a3a]">帖子状态</h2>
            <div className="mt-3 grid gap-2">
              {stats.statusRows.map((row) => (
                <div className="flex items-center justify-between rounded-2xl bg-blue-50/60 px-4 py-3 text-sm font-black text-[#0F172A]" key={row.label}>
                  <span>{row.label}</span>
                  <span className="text-[#2563EB]">{row.count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[24px] border border-[rgba(226,232,240,0.9)] bg-white/86 p-[18px] shadow-[0_12px_28px_rgba(15,76,129,0.08)]">
            <h2 className="text-lg font-black text-[#061a3a]">运营信号</h2>
            <div className="mt-3 grid gap-2">
              <MiniRow label="已发布帖子" value={stats.publishedPosts} />
              <MiniRow label="待审核帖子" value={stats.pendingPosts} />
              <MiniRow label="消息通知" value={stats.notifications} />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <article className="rounded-[24px] border border-[rgba(226,232,240,0.9)] bg-white/86 p-[18px] shadow-[0_12px_28px_rgba(15,76,129,0.08)]">
      <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-[#2563EB] ring-1 ring-blue-100">{icon}</span>
      <p className="mt-4 text-[26px] font-[850] leading-none text-[#061a3a]">{value}</p>
      <p className="mt-2 text-xs font-black text-[#64748B]">{label}</p>
    </article>
  );
}

function MiniRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 text-sm font-black">
      <span className="text-[#64748B]">{label}</span>
      <span className="text-[#061a3a]">{value}</span>
    </div>
  );
}
