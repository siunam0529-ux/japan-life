"use client";

import { ArrowLeft, CheckCircle2, EyeOff, MessageCircle, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { readLocalFeedback, updateLocalFeedbackStatus } from "@/lib/feedback/storage";
import type { UserFeedback, UserFeedbackStatus } from "@/lib/feedback/types";

const sessionKey = "japan-life-admin-auth";

const statusLabels: Record<UserFeedbackStatus, string> = {
  ignored: "已忽略",
  open: "待处理",
  resolved: "已处理",
};

const statusTone: Record<UserFeedbackStatus, string> = {
  ignored: "bg-slate-50 text-slate-600 ring-slate-200",
  open: "bg-amber-50 text-amber-700 ring-amber-100",
  resolved: "bg-emerald-50 text-emerald-700 ring-emerald-100",
};

export default function AdminFeedbackPage() {
  const [items, setItems] = useState<UserFeedback[]>([]);
  const [loading, setLoading] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [message, setMessage] = useState("");
  const [password, setPassword] = useState("");
  const [source, setSource] = useState<"local" | "supabase">("local");
  const [statusFilter, setStatusFilter] = useState<"all" | UserFeedbackStatus>("all");

  const loadFeedback = useCallback(async (adminPassword = window.sessionStorage.getItem(sessionKey) ?? "") => {
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/feedback", {
        headers: { "x-admin-password": adminPassword },
      });
      if (!response.ok) throw new Error("反馈后台接口不可用");
      const data = (await response.json()) as { items?: UserFeedback[] };
      setItems(data.items ?? []);
      setSource("supabase");
    } catch {
      setItems(readLocalFeedback());
      setSource("local");
      setMessage("当前显示本机保存的反馈。要看所有用户反馈，请先创建 Supabase 表并配置 SUPABASE_SERVICE_ROLE_KEY。");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const saved = window.sessionStorage.getItem(sessionKey);
    if (saved) {
      setLoggedIn(true);
      void loadFeedback(saved);
    }
  }, [loadFeedback]);

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
    setLoggedIn(true);
    setPassword("");
    await loadFeedback(password.trim());
  }

  async function patchStatus(id: string, status: UserFeedbackStatus) {
    const adminPassword = window.sessionStorage.getItem(sessionKey) ?? "";
    if (source === "local") {
      const updated = updateLocalFeedbackStatus(id, status);
      if (updated) setItems((current) => current.map((item) => item.id === id ? updated : item));
      return;
    }
    try {
      const response = await fetch("/api/admin/feedback", {
        body: JSON.stringify({ id, status }),
        headers: {
          "Content-Type": "application/json",
          "x-admin-password": adminPassword,
        },
        method: "PATCH",
      });
      if (!response.ok) throw new Error("反馈状态更新失败");
      const data = (await response.json()) as { item?: UserFeedback };
      if (data.item) setItems((current) => current.map((item) => item.id === id ? data.item! : item));
    } catch {
      setMessage("更新失败，请检查 Supabase 表和后台环境变量。");
    }
  }

  const filteredItems = useMemo(
    () => items.filter((item) => statusFilter === "all" || item.status === statusFilter),
    [items, statusFilter],
  );

  if (!loggedIn) {
    return (
      <main className="min-h-screen bg-[#F6FAFF] px-4 py-5 text-[#0F172A]">
        <div className="mx-auto min-h-screen max-w-[430px] px-1 pb-10">
          <Link className="inline-flex h-10 items-center gap-2 rounded-full bg-white/85 px-4 text-sm font-black text-[#2563EB] shadow-sm ring-1 ring-blue-100" href="/admin">
            <ArrowLeft className="h-4 w-4" />
            返回后台
          </Link>
          <section className="mt-5 rounded-[28px] border border-white/70 bg-white/86 p-5 shadow-[0_18px_45px_rgba(37,99,235,0.10)]">
            <p className="text-xs font-black text-[#2563EB]">后台</p>
            <h1 className="mt-1 text-2xl font-black">反馈管理</h1>
            <p className="mt-2 text-sm font-bold leading-6 text-slate-600">输入管理员密码查看用户提交的反馈。</p>
            <div className="mt-4 grid gap-3">
              <input className="h-12 rounded-2xl border border-blue-100 bg-blue-50/70 px-4 text-sm font-bold outline-none focus:border-[#2563EB]" onChange={(event) => setPassword(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") void handleLogin(); }} placeholder="管理员密码" type="password" value={password} />
              <button className="h-12 rounded-full bg-[#2563EB] text-sm font-black text-white shadow-[0_14px_28px_rgba(37,99,235,0.22)] disabled:opacity-60" disabled={loading} onClick={handleLogin} type="button">
                {loading ? "验证中..." : "进入反馈管理"}
              </button>
              {message ? <p className="rounded-2xl bg-rose-50 px-4 py-3 text-xs font-bold text-rose-700">{message}</p> : null}
            </div>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F6FAFF] px-4 py-5 text-[#0F172A]">
      <div className="mx-auto min-h-screen w-full max-w-[960px] px-1 pb-10">
        <div className="flex items-center justify-between gap-3">
          <Link className="inline-flex h-10 items-center gap-2 rounded-full bg-white/85 px-4 text-sm font-black text-[#2563EB] shadow-sm ring-1 ring-blue-100" href="/admin">
            <ArrowLeft className="h-4 w-4" />
            返回后台
          </Link>
          <button className="inline-flex h-10 items-center gap-2 rounded-full bg-white/85 px-4 text-xs font-black text-slate-600 shadow-sm ring-1 ring-blue-100" disabled={loading} onClick={() => void loadFeedback()} type="button">
            <RefreshCw className="h-4 w-4" />
            刷新
          </button>
        </div>

        <section className="mt-5 rounded-[30px] border border-white/80 bg-white/86 p-5 shadow-[0_18px_45px_rgba(37,99,235,0.10)]">
          <p className="text-xs font-black text-[#2563EB]">反馈后台</p>
          <h1 className="mt-1 text-[28px] font-[850] leading-9">反馈管理</h1>
          <p className="mt-2 text-sm font-bold leading-6 text-slate-600">查看用户通过「联系反馈」提交的问题，支持标记已处理或忽略。</p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {(["all", "open", "resolved", "ignored"] as const).map((status) => (
              <button className={`h-9 rounded-full px-4 text-xs font-black ${statusFilter === status ? "bg-[#2563EB] text-white" : "bg-blue-50 text-[#1D4ED8] ring-1 ring-blue-100"}`} key={status} onClick={() => setStatusFilter(status)} type="button">
                {status === "all" ? "全部" : statusLabels[status]}
              </button>
            ))}
            <span className="ml-auto rounded-full bg-white px-3 py-1.5 text-xs font-black text-slate-500 ring-1 ring-slate-200">
              {source === "supabase" ? "Supabase 数据" : "本机反馈"}
            </span>
          </div>
          {message ? <p className="mt-4 rounded-2xl bg-amber-50 px-4 py-3 text-xs font-black leading-5 text-amber-700 ring-1 ring-amber-100">{message}</p> : null}
        </section>

        <section className="mt-4 grid gap-3">
          {filteredItems.length ? filteredItems.map((item) => (
            <FeedbackCard item={item} key={item.id} onStatus={(status) => void patchStatus(item.id, status)} />
          )) : (
            <div className="rounded-[24px] border border-blue-100 bg-white/86 p-8 text-center shadow-[0_12px_28px_rgba(15,76,129,0.08)]">
              <MessageCircle className="mx-auto h-8 w-8 text-[#2563EB]" />
              <p className="mt-3 text-sm font-black text-slate-600">当前没有反馈</p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function FeedbackCard({ item, onStatus }: { item: UserFeedback; onStatus: (status: UserFeedbackStatus) => void }) {
  return (
    <article className="rounded-[24px] border border-white/80 bg-white/86 p-4 shadow-[0_12px_28px_rgba(15,76,129,0.08)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap gap-2">
            <Badge>{item.type || "其他"}</Badge>
            <span className={`rounded-full px-3 py-1 text-xs font-black ring-1 ${statusTone[item.status]}`}>{statusLabels[item.status]}</span>
          </div>
          <h2 className="mt-3 text-lg font-black leading-7 text-[#061a3a]">{item.page || "未填写页面"}</h2>
          <p className="mt-1 whitespace-pre-wrap text-sm font-bold leading-6 text-slate-700">{item.message}</p>
        </div>
      </div>
      <div className="mt-3 grid gap-2 text-xs font-bold text-slate-500 sm:grid-cols-2">
        <span>提交时间：{formatDate(item.createdAt)}</span>
        <span className="truncate">页面链接：{item.pageUrl || "-"}</span>
        <span className="sm:col-span-2 break-all">设备：{item.userAgent || "-"}</span>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <button className="inline-flex h-9 items-center gap-1 rounded-xl bg-emerald-50 px-3 text-xs font-black text-emerald-700 ring-1 ring-emerald-100" onClick={() => onStatus("resolved")} type="button">
          <CheckCircle2 className="h-3.5 w-3.5" />
          标记已处理
        </button>
        <button className="inline-flex h-9 items-center gap-1 rounded-xl bg-slate-50 px-3 text-xs font-black text-slate-600 ring-1 ring-slate-200" onClick={() => onStatus("ignored")} type="button">
          <EyeOff className="h-3.5 w-3.5" />
          忽略
        </button>
        <button className="inline-flex h-9 items-center rounded-xl bg-blue-50 px-3 text-xs font-black text-[#1D4ED8] ring-1 ring-blue-100" onClick={() => onStatus("open")} type="button">
          重新打开
        </button>
      </div>
    </article>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-[#1D4ED8] ring-1 ring-blue-100">{children}</span>;
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("zh-CN", { dateStyle: "short", timeStyle: "short" });
}
