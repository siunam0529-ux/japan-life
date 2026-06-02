"use client";

import { ArrowLeft, Megaphone, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { readCommunityComments, readCommunityPosts, readCommunityReports } from "@/lib/community/repository";
import type { CommunityComment, CommunityPost, CommunityReport } from "@/lib/community/types";

const sessionKey = "japan-life-admin-auth";

type AdminData = {
  comments: CommunityComment[];
  posts: CommunityPost[];
  reports: CommunityReport[];
};

export default function AdminCommunityPage() {
  const [broadcastBody, setBroadcastBody] = useState("");
  const [broadcastSending, setBroadcastSending] = useState(false);
  const [data, setData] = useState<AdminData>({ comments: [], posts: [], reports: [] });
  const [loggedIn, setLoggedIn] = useState(false);
  const [message, setMessage] = useState("");
  const [password, setPassword] = useState("");

  const stats = useMemo(() => ({
    comments: data.comments.length,
    pendingPosts: data.posts.filter((post) => post.status === "pending" || post.status === "reported").length,
    posts: data.posts.length,
    reports: data.reports.filter((report) => report.status === "pending").length,
  }), [data]);

  const loadLocalData = useCallback(async () => {
    const [posts, comments, reports] = await Promise.all([readCommunityPosts(), readCommunityComments(), readCommunityReports()]);
    setData({ comments, posts, reports });
  }, []);

  const loadData = useCallback(async (nextPassword = window.sessionStorage.getItem(sessionKey) || "") => {
    setMessage("");
    try {
      const response = await fetch("/api/admin/community", { headers: { "x-admin-password": nextPassword } });
      if (!response.ok) throw new Error("Remote community data failed. Showing local data.");
      const body = await response.json() as Partial<AdminData>;
      setData({ comments: body.comments || [], posts: body.posts || [], reports: body.reports || [] });
    } catch (error) {
      await loadLocalData();
      setMessage(error instanceof Error ? error.message : "Showing local data.");
    }
  }, [loadLocalData]);

  useEffect(() => {
    const stored = window.sessionStorage.getItem(sessionKey);
    if (stored) {
      setLoggedIn(true);
      void loadData(stored);
    } else {
      void loadLocalData();
    }
  }, [loadData, loadLocalData]);

  async function handleLogin() {
    if (!password.trim()) return;
    window.sessionStorage.setItem(sessionKey, password.trim());
    setLoggedIn(true);
    await loadData(password.trim());
    setPassword("");
  }

  async function sendBroadcast() {
    const body = broadcastBody.trim();
    if (!body) return;
    setBroadcastSending(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/official-message", {
        body: JSON.stringify({ body, broadcast: true }),
        headers: { "Content-Type": "application/json", "x-admin-password": window.sessionStorage.getItem(sessionKey) || "" },
        method: "POST",
      });
      if (!response.ok) throw new Error("Official message failed. Check admin password and Supabase Admin config.");
      const result = await response.json() as { count?: number };
      setBroadcastBody("");
      setMessage("Official message sent to " + String(result.count || 0) + " users.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Official message failed.");
    } finally {
      setBroadcastSending(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f6f8fb] px-4 py-5 text-[#061a3a]">
      <div className="mx-auto w-full max-w-5xl pb-12">
        <div className="flex items-center justify-between gap-3">
          <Link className="inline-flex h-10 items-center gap-2 rounded-full bg-white px-4 text-sm font-black text-[#2563EB] shadow-sm ring-1 ring-blue-100" href="/admin">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
          <button className="inline-flex h-10 items-center gap-2 rounded-full bg-white px-4 text-xs font-black text-slate-600 shadow-sm ring-1 ring-blue-100" onClick={() => void loadData()} type="button">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>

        <section className="mt-5 rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-black text-[#2563EB]">Community Admin</p>
          <h1 className="mt-1 text-3xl font-black">Community Admin</h1>
          <p className="mt-2 text-sm font-bold leading-6 text-slate-500">Announcements, report reviews, and audit results are sent by Japan Life official messages.</p>
          {!loggedIn ? (
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <input className="h-11 flex-1 rounded-2xl border border-blue-100 bg-blue-50/60 px-4 text-sm font-bold outline-none" onChange={(event) => setPassword(event.target.value)} placeholder="Admin password" type="password" value={password} />
              <button className="h-11 rounded-full bg-[#2563EB] px-5 text-sm font-black text-white" onClick={() => void handleLogin()} type="button">Enter</button>
            </div>
          ) : null}
        </section>

        <section className="mt-4 grid gap-3 sm:grid-cols-4">
          <StatCard label="Posts" value={stats.posts} />
          <StatCard label="Pending posts" value={stats.pendingPosts} />
          <StatCard label="Comments" value={stats.comments} />
          <StatCard label="Pending reports" value={stats.reports} />
        </section>

        <section className="mt-4 rounded-[24px] border border-blue-100 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-[#2563EB]" />
            <h2 className="text-base font-black">Japan Life official broadcast</h2>
          </div>
          <textarea className="mt-3 min-h-28 w-full resize-none rounded-2xl border border-blue-100 bg-blue-50/50 px-4 py-3 text-sm font-bold leading-6 outline-none" maxLength={500} onChange={(event) => setBroadcastBody(event.target.value)} placeholder="Message to all users" value={broadcastBody} />
          <div className="mt-3 flex items-center justify-between gap-3">
            <span className="text-xs font-bold text-slate-400">{broadcastBody.trim().length}/500</span>
            <button className="h-10 rounded-full bg-[#2563EB] px-5 text-sm font-black text-white disabled:bg-slate-200 disabled:text-slate-400" disabled={broadcastSending || !broadcastBody.trim() || !loggedIn} onClick={() => void sendBroadcast()} type="button">
              {broadcastSending ? "Sending" : "Send"}
            </button>
          </div>
        </section>

        {message ? <p className="mt-4 rounded-2xl bg-blue-50 px-4 py-3 text-sm font-black text-[#1D4ED8] ring-1 ring-blue-100">{message}</p> : null}

        <section className="mt-4 grid gap-3 lg:grid-cols-3">
          <ListPanel title="Latest posts" items={data.posts.slice(0, 8).map((post) => post.title + " / " + post.status)} />
          <ListPanel title="Latest comments" items={data.comments.slice(0, 8).map((comment) => comment.authorName + ": " + comment.content)} />
          <ListPanel title="Latest reports" items={data.reports.slice(0, 8).map((report) => report.targetType + ": " + report.reason + " / " + report.status)} />
        </section>
      </div>
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return <div className="rounded-[18px] border border-slate-200 bg-white p-4 shadow-sm"><p className="text-xs font-black text-slate-500">{label}</p><p className="mt-2 text-2xl font-black">{value}</p></div>;
}

function ListPanel({ items, title }: { items: string[]; title: string }) {
  return (
    <section className="rounded-[20px] border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="text-sm font-black">{title}</h2>
      <div className="mt-3 grid gap-2">
        {items.length ? items.map((item, index) => <p className="line-clamp-2 rounded-2xl bg-slate-50 px-3 py-2 text-xs font-bold leading-5 text-slate-600" key={title + "-" + index}>{item}</p>) : <p className="text-xs font-bold text-slate-400">No data</p>}
      </div>
    </section>
  );
}
