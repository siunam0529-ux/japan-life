"use client";

import type { User } from "@supabase/supabase-js";
import { KeyRound, LogOut, Mail, Trash2, UserRound } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { BackButton } from "@/components/BackButton";
import { supabase } from "@/lib/supabase";
import { clearJapanLifeData } from "@/lib/localDataBackup";

const avatarStorageKey = "japan-life:user-avatar";

function getUserAvatarUrl(user: User | null) {
  const value = user?.user_metadata?.avatar_url;
  return typeof value === "string" ? value : "";
}

export default function AccountPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

  useEffect(() => {
    setAvatarUrl(window.localStorage.getItem(avatarStorageKey) ?? "");
    if (!supabase) {
      setLoading(false);
      setMessage("账号服务暂时不可用，请稍后再试。");
      return;
    }

    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      if (!data.session?.user) {
        router.replace("/login?next=/account");
        return;
      }
      setUser(data.session.user);
      setAvatarUrl(getUserAvatarUrl(data.session.user) || window.localStorage.getItem(avatarStorageKey) || "");
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      if (!session?.user) {
        router.replace("/login?next=/account");
        return;
      }
      setUser(session.user);
      setAvatarUrl(getUserAvatarUrl(session.user) || window.localStorage.getItem(avatarStorageKey) || "");
      setLoading(false);
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, [router]);

  const logout = async () => {
    if (!supabase) return;
    setLoading(true);
    await supabase.auth.signOut();
    router.replace("/login");
  };

  const deleteAccount = async () => {
    if (!supabase || !user) return;
    if (!confirmingDelete) {
      setConfirmingDelete(true);
      setMessage("再次点击可永久删除账号。此操作会删除云端账号和云同步数据，本机 Japan Life 数据也会清除。");
      return;
    }

    setDeletingAccount(true);
    setMessage("");
    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) throw new Error("登录状态已过期，请重新登录后再删除账号。");
      const response = await fetch("/api/account", {
        headers: { authorization: `Bearer ${token}` },
        method: "DELETE",
      });
      const result = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) throw new Error(result?.error || "账号删除失败");
      clearJapanLifeData();
      await supabase.auth.signOut();
      router.replace("/");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "账号删除失败");
      setConfirmingDelete(false);
    } finally {
      setDeletingAccount(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#F6FAFF] px-4 py-5 text-[#0F172A]">
      <div className="mx-auto min-h-screen max-w-[430px] px-1 pb-10">
        <div className="mb-5">
          <BackButton fallbackHref="/me" label="返回" />
        </div>

        <section className="rounded-[28px] border border-white/60 bg-white/75 p-5 shadow-[0_18px_45px_rgba(37,99,235,0.10)] backdrop-blur-xl">
          <p className="text-sm font-black text-[#2563EB]">Japan Life</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight">账号与密码</h1>
          <p className="mt-3 text-sm font-bold leading-6 text-[#64748B]">管理登录状态、邮箱和密码安全。登录后会自动同步 App 内设置。</p>
        </section>

        <section className="mt-5 rounded-[28px] border border-white/60 bg-white/75 p-5 shadow-[0_10px_35px_rgba(37,99,235,0.08)] backdrop-blur-xl">
          {loading ? (
            <p className="rounded-2xl bg-blue-50 px-4 py-5 text-center text-sm font-bold text-[#64748B]">读取账号中...</p>
          ) : user ? (
            <div className="grid gap-4">
              <div className="flex items-center gap-3 rounded-2xl border border-blue-100 bg-blue-50/70 p-4">
                <span className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl bg-white text-[#2563EB] shadow-sm">
                  {avatarUrl ? <img alt="" className="h-full w-full object-cover" src={avatarUrl} /> : <UserRound className="h-7 w-7" />}
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-black text-[#64748B]">当前登录用户</p>
                  <p className="mt-1 truncate text-sm font-black text-[#0F172A]">{user.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-2xl border border-blue-100 bg-blue-50/70 p-4">
                <Mail className="h-5 w-5 text-[#2563EB]" />
                <p className="truncate text-sm font-bold text-[#64748B]">邮箱：{user.email}</p>
              </div>

              <Link className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#2563EB] text-sm font-black text-white shadow-sm" href="/forgot-password">
                <KeyRound className="h-4 w-4" />
                修改密码
              </Link>

              <button className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-slate-700 text-sm font-black text-white shadow-sm" onClick={logout} type="button">
                <LogOut className="h-4 w-4" />
                退出登录
              </button>

              <section className="rounded-2xl border border-rose-100 bg-rose-50/80 p-4">
                <h2 className="text-sm font-black text-rose-700">删除账号</h2>
                <p className="mt-2 text-xs font-bold leading-5 text-rose-700/80">
                  删除后会移除云端账号和同步数据。本机保存的 Japan Life 设置、收藏和提醒也会一起清除。这个操作不能撤销。
                </p>
                <button
                  className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-white text-sm font-black text-rose-700 shadow-sm disabled:opacity-50"
                  disabled={deletingAccount}
                  onClick={deleteAccount}
                  type="button"
                >
                  <Trash2 className="h-4 w-4" />
                  {deletingAccount ? "删除中..." : confirmingDelete ? "确认永久删除" : "删除账号"}
                </button>
              </section>
            </div>
          ) : (
            <p className="rounded-2xl bg-rose-50 px-4 py-5 text-center text-sm font-bold text-rose-700">{message || "未登录，正在跳转..."}</p>
          )}
        </section>
      </div>
    </main>
  );
}
