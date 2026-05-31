"use client";

import { ArrowLeft, CheckCircle2, Database, RefreshCw, ShieldAlert, Trash2, XCircle } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  getCommunitySupabaseEnvironmentCheck,
  insertCommunityCheckComment,
  insertCommunityCheckPost,
  runCommunityTableChecks,
  softDeleteCommunityCheckPost,
  type CommunityCheckStatus,
  type CommunityTableCheck,
  type CommunityWriteCheck,
} from "@/lib/community/supabaseCheck";

const idleWrite: CommunityWriteCheck = { error: "", hint: "", status: "idle" };
const sessionKey = "japan-life-admin-auth";

export default function AdminCommunityCheckPage() {
  const [checking, setChecking] = useState(false);
  const [commentWrite, setCommentWrite] = useState<CommunityWriteCheck>(idleWrite);
  const [loggedIn, setLoggedIn] = useState(false);
  const [loginMessage, setLoginMessage] = useState("");
  const [password, setPassword] = useState("");
  const [postWrite, setPostWrite] = useState<CommunityWriteCheck>(idleWrite);
  const [tableChecks, setTableChecks] = useState<CommunityTableCheck[]>([]);
  const env = useMemo(() => getCommunitySupabaseEnvironmentCheck(), []);

  async function runChecks() {
    setChecking(true);
    try {
      setTableChecks(await runCommunityTableChecks());
    } finally {
      setChecking(false);
    }
  }

  async function testPostWrite() {
    setPostWrite({ error: "", hint: "", status: "idle" });
    setCommentWrite(idleWrite);
    setPostWrite(await insertCommunityCheckPost());
  }

  async function softDeletePost() {
    if (!postWrite.postId) return;
    setPostWrite(await softDeleteCommunityCheckPost(postWrite.postId));
  }

  async function testCommentWrite() {
    if (!postWrite.postId) return;
    setCommentWrite(await insertCommunityCheckComment(postWrite.postId));
  }

  useEffect(() => {
    const storedPassword = window.sessionStorage.getItem(sessionKey);
    setLoggedIn(Boolean(storedPassword));
  }, []);

  useEffect(() => {
    if (loggedIn) void runChecks();
  }, [loggedIn]);

  async function handleLogin() {
    if (!password.trim()) return;
    setLoginMessage("");
    try {
      const response = await fetch("/api/admin/community/check-auth", {
        body: JSON.stringify({ password: password.trim() }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      if (!response.ok) throw new Error("管理员密码不正确");
      window.sessionStorage.setItem(sessionKey, password.trim());
      setLoggedIn(true);
      setPassword("");
    } catch (error) {
      setLoginMessage(error instanceof Error ? error.message : "登录失败");
    }
  }

  const hasTableFailure = tableChecks.some((item) => item.status === "error");
  const hasWriteFailure = postWrite.status === "error" || commentWrite.status === "error";
  const allPassed = env.clientStatus === "success" && tableChecks.length > 0 && !hasTableFailure && !hasWriteFailure;

  if (!loggedIn) {
    return (
      <main className="min-h-screen bg-[linear-gradient(180deg,#eaf6ff_0%,#f7fbff_48%,#ffffff_100%)] px-4 py-5 text-[#061a3a]">
        <div className="mx-auto max-w-[430px]">
          <Link className="inline-flex h-10 items-center gap-2 rounded-full bg-white/85 px-4 text-sm font-black text-[#2563EB] shadow-sm ring-1 ring-blue-100" href="/admin/community">
            <ArrowLeft className="h-4 w-4" />
            返回社区管理
          </Link>
          <section className="mt-5 rounded-[28px] border border-white/70 bg-white/86 p-5 shadow-[0_18px_45px_rgba(37,99,235,0.10)]">
            <p className="text-xs font-black text-[#2563EB]">Admin Check</p>
            <h1 className="mt-1 text-2xl font-black">社区连接检测</h1>
            <p className="mt-2 text-sm font-bold leading-6 text-slate-600">请输入管理员密码后查看 Supabase 连接状态。</p>
            <div className="mt-4 grid gap-3">
              <input className="h-12 rounded-2xl border border-blue-100 bg-blue-50/70 px-4 text-sm font-bold outline-none focus:border-[#2563EB]" onChange={(event) => setPassword(event.target.value)} placeholder="管理员密码" type="password" value={password} />
              <button className="h-12 rounded-full bg-[#2563EB] text-sm font-black text-white shadow-[0_14px_28px_rgba(37,99,235,0.22)]" onClick={() => void handleLogin()} type="button">进入检测页</button>
              {loginMessage ? <p className="rounded-2xl bg-rose-50 px-4 py-3 text-xs font-bold text-rose-700">{loginMessage}</p> : null}
            </div>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#eaf6ff_0%,#f7fbff_48%,#ffffff_100%)] px-4 py-5 text-[#061a3a]">
      <div className="mx-auto min-h-screen w-full max-w-[960px] pb-12">
        <div className="flex items-center justify-between gap-3">
          <Link className="inline-flex h-10 items-center gap-2 rounded-full bg-white/85 px-4 text-sm font-black text-[#2563EB] shadow-sm ring-1 ring-blue-100" href="/admin/community">
            <ArrowLeft className="h-4 w-4" />
            返回社区管理
          </Link>
          <button className="inline-flex h-10 items-center gap-2 rounded-full bg-white/85 px-4 text-xs font-black text-slate-600 shadow-sm ring-1 ring-blue-100 disabled:opacity-60" disabled={checking} onClick={() => void runChecks()} type="button">
            <RefreshCw className={`h-4 w-4 ${checking ? "animate-spin" : ""}`} />
            重新检测
          </button>
        </div>

        <section className="mt-5 rounded-[30px] border border-white/80 bg-white/86 p-5 shadow-[0_18px_45px_rgba(37,99,235,0.10)]">
          <p className="text-xs font-black text-[#2563EB]">Community Supabase Check</p>
          <h1 className="mt-1 text-[28px] font-[850] leading-9">社区连接检测</h1>
          <p className="mt-2 text-sm font-bold leading-6 text-slate-600">检查 Supabase 环境变量、表读取、写入权限和字段映射</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <StatusPill status={env.clientStatus}>当前模式：{env.mode}</StatusPill>
            <StatusPill status="idle">环境变量模式：{env.dataMode}</StatusPill>
            <StatusPill status={env.urlStatus}>URL {env.urlStatus === "success" ? "正常" : env.urlStatus === "warning" ? "格式异常" : "缺失"}</StatusPill>
            <StatusPill status={env.anonStatus}>Anon Key {env.anonStatus === "success" ? "正常" : "缺失"}</StatusPill>
          </div>
        </section>

        <section className="mt-4 grid gap-4 lg:grid-cols-2">
          <CheckCard icon={<ShieldAlert className="h-5 w-5" />} title="Supabase 环境变量检测">
            <InfoRow label="NEXT_PUBLIC_SUPABASE_URL" status={env.urlStatus} value={env.url} />
            <InfoRow label="NEXT_PUBLIC_SUPABASE_ANON_KEY" status={env.anonStatus} value={env.anonKey} />
            <InfoRow label="Supabase client 初始化" status={env.clientStatus} value={env.clientStatus === "success" ? "成功" : "失败"} />
            {env.clientError ? <HintBox tone="error">{env.clientError}</HintBox> : null}
          </CheckCard>

          <CheckCard icon={<Database className="h-5 w-5" />} title="写入权限检测">
            <div className="flex flex-wrap gap-2">
              <button className="h-10 rounded-full bg-[#2563EB] px-4 text-xs font-black text-white shadow-[0_10px_20px_rgba(37,99,235,0.18)]" onClick={() => void testPostWrite()} type="button">
                测试写入帖子
              </button>
              {postWrite.postId ? (
                <>
                  <button className="h-10 rounded-full bg-emerald-50 px-4 text-xs font-black text-emerald-700 ring-1 ring-emerald-100" onClick={() => void testCommentWrite()} type="button">
                    测试写入评论
                  </button>
                  <button className="inline-flex h-10 items-center gap-1.5 rounded-full bg-rose-50 px-4 text-xs font-black text-rose-700 ring-1 ring-rose-100" onClick={() => void softDeletePost()} type="button">
                    <Trash2 className="h-3.5 w-3.5" />
                    删除这条测试数据
                  </button>
                </>
              ) : null}
            </div>
            <WriteResult label="帖子写入" result={postWrite} />
            {postWrite.postId ? <p className="mt-2 text-[11px] font-bold text-slate-500">测试帖子 ID：{postWrite.postId}</p> : null}
            <WriteResult label="评论写入" result={commentWrite} />
          </CheckCard>
        </section>

        <CheckCard className="mt-4" icon={<Database className="h-5 w-5" />} title="表读取检测">
          <div className="overflow-hidden rounded-[20px] border border-blue-100 bg-white/80">
            {tableChecks.length === 0 ? (
              <div className="p-4 text-sm font-bold text-slate-500">未检测</div>
            ) : tableChecks.map((item) => (
              <TableCheckRow item={item} key={item.table} />
            ))}
          </div>
        </CheckCard>

        <section className={`mt-4 rounded-[24px] border p-4 shadow-[0_12px_28px_rgba(15,76,129,0.08)] ${allPassed ? "border-emerald-100 bg-emerald-50/80 text-emerald-800" : "border-amber-100 bg-amber-50/85 text-amber-800"}`}>
          <p className="text-sm font-black">检测总结</p>
          <p className="mt-1 text-sm font-bold leading-6">
            {allPassed ? "社区 Supabase 连接正常，可以继续切换真实数据模式。" : "请先修复失败项，再继续上线。读取或写入失败时优先检查字段名、RLS policy 和 anon key 权限。"}
          </p>
        </section>
      </div>
    </main>
  );
}

function CheckCard({ children, className = "", icon, title }: { children: React.ReactNode; className?: string; icon: React.ReactNode; title: string }) {
  return (
    <section className={`${className} rounded-[24px] border border-white/80 bg-white/86 p-4 shadow-[0_12px_28px_rgba(15,76,129,0.08)]`}>
      <div className="mb-3 flex items-center gap-2 text-base font-black text-[#061a3a]">
        <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-blue-50 text-[#2563EB] ring-1 ring-blue-100">{icon}</span>
        {title}
      </div>
      {children}
    </section>
  );
}

function InfoRow({ label, status, value }: { label: string; status: CommunityCheckStatus; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-t border-blue-50 py-3 first:border-t-0">
      <div className="min-w-0">
        <p className="text-xs font-black text-slate-500">{label}</p>
        <p className="mt-1 truncate text-sm font-bold text-[#061a3a]">{value}</p>
      </div>
      <StatusPill status={status}>{getStatusText(status)}</StatusPill>
    </div>
  );
}

function TableCheckRow({ item }: { item: CommunityTableCheck }) {
  return (
    <div className="border-t border-blue-50 px-4 py-3 first:border-t-0">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-mono text-xs font-black text-[#061a3a]">{item.table}</p>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-500">返回 {item.count} 条</span>
          <StatusPill status={item.status}>{getStatusText(item.status)}</StatusPill>
        </div>
      </div>
      {item.error ? <p className="mt-2 rounded-2xl bg-rose-50 px-3 py-2 text-xs font-bold leading-5 text-rose-700 ring-1 ring-rose-100">{item.error}</p> : null}
      {item.hint ? <HintBox tone="warning">{item.hint}</HintBox> : null}
    </div>
  );
}

function WriteResult({ label, result }: { label: string; result: CommunityWriteCheck }) {
  return (
    <div className="mt-3 rounded-2xl bg-blue-50/60 p-3 ring-1 ring-blue-100">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-black text-slate-500">{label}</p>
        <StatusPill status={result.status}>{getStatusText(result.status)}</StatusPill>
      </div>
      {result.status === "success" ? <p className="mt-2 text-sm font-black text-emerald-700">写入成功</p> : null}
      {result.error ? <p className="mt-2 rounded-2xl bg-rose-50 px-3 py-2 text-xs font-bold leading-5 text-rose-700 ring-1 ring-rose-100">{result.error}</p> : null}
      {result.hint ? <HintBox tone="warning">{result.hint}</HintBox> : null}
    </div>
  );
}

function StatusPill({ children, status }: { children: React.ReactNode; status: CommunityCheckStatus }) {
  const tone = {
    error: "bg-rose-50 text-rose-700 ring-rose-100",
    idle: "bg-slate-50 text-slate-500 ring-slate-200",
    success: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    warning: "bg-amber-50 text-amber-700 ring-amber-100",
  }[status];
  const Icon = status === "success" ? CheckCircle2 : status === "error" ? XCircle : null;
  return (
    <span className={`inline-flex h-7 shrink-0 items-center gap-1 rounded-full px-3 text-[11px] font-black ring-1 ${tone}`}>
      {Icon ? <Icon className="h-3.5 w-3.5" /> : null}
      {children}
    </span>
  );
}

function HintBox({ children, tone }: { children: React.ReactNode; tone: "error" | "warning" }) {
  const className = tone === "error" ? "bg-rose-50 text-rose-700 ring-rose-100" : "bg-amber-50 text-amber-700 ring-amber-100";
  return <p className={`mt-2 rounded-2xl px-3 py-2 text-xs font-bold leading-5 ring-1 ${className}`}>{children}</p>;
}

function getStatusText(status: CommunityCheckStatus) {
  if (status === "success") return "正常";
  if (status === "warning") return "格式异常";
  if (status === "error") return "失败";
  return "未检测";
}
