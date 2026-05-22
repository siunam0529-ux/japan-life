"use client";

import type { User } from "@supabase/supabase-js";
import { LogOut, Mail, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { BackButton } from "@/components/BackButton";
import { supabase } from "@/lib/supabase";

export default function AccountPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      setMessage("Supabase 环境变量未配置。");
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
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      if (!session?.user) {
        router.replace("/login?next=/account");
        return;
      }
      setUser(session.user);
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

  return (
    <main className="min-h-screen bg-[#F6FAFF] px-4 py-5 text-[#0F172A]">
      <div className="mx-auto min-h-screen max-w-[430px] px-1 pb-10">
        <div className="mb-5">
          <BackButton fallbackHref="/me" label="返回" />
        </div>

        <section className="rounded-[28px] border border-white/60 bg-white/75 p-5 shadow-[0_18px_45px_rgba(37,99,235,0.10)] backdrop-blur-xl">
          <p className="text-sm font-black text-[#2563EB]">Japan Life</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight">账号中心</h1>
          <p className="mt-3 text-sm font-bold leading-6 text-[#64748B]">普通用户登录已接入 Supabase Auth。之后可以继续接个人资料和云端同步。</p>
        </section>

        <section className="mt-5 rounded-[28px] border border-white/60 bg-white/75 p-5 shadow-[0_10px_35px_rgba(37,99,235,0.08)] backdrop-blur-xl">
          {loading ? (
            <p className="rounded-2xl bg-blue-50 px-4 py-5 text-center text-sm font-bold text-[#64748B]">读取账号中...</p>
          ) : user ? (
            <div className="grid gap-4">
              <div className="flex items-center gap-3 rounded-2xl border border-blue-100 bg-blue-50/70 p-4">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-[#2563EB] shadow-sm">
                  <UserRound className="h-6 w-6" />
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-black text-[#64748B]">当前登录用户</p>
                  <p className="mt-1 truncate text-sm font-black text-[#0F172A]">{user.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-2xl border border-blue-100 bg-blue-50/70 p-4">
                <Mail className="h-5 w-5 text-[#2563EB]" />
                <p className="text-sm font-bold text-[#64748B]">邮箱：{user.email}</p>
              </div>

              <button className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-slate-700 text-sm font-black text-white shadow-sm" onClick={logout} type="button">
                <LogOut className="h-4 w-4" />
                退出登录
              </button>
            </div>
          ) : (
            <p className="rounded-2xl bg-rose-50 px-4 py-5 text-center text-sm font-bold text-rose-700">{message || "未登录，正在跳转..."}</p>
          )}
        </section>
      </div>
    </main>
  );
}
