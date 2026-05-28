"use client";

import { LockKeyhole, Save } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { BackButton } from "@/components/BackButton";
import { supabase } from "@/lib/supabase";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!supabase) {
      setCheckingSession(false);
      setMessage("账号服务暂时不可用，请稍后再试。");
      return;
    }

    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setCheckingSession(false);
      if (!data.session) setMessage("重置链接无效或已过期，请重新发送重置邮件。");
    });

    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (!mounted) return;
      if (event === "PASSWORD_RECOVERY") {
        setCheckingSession(false);
        setMessage("");
      }
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!supabase) {
      setSuccess(false);
      setMessage("账号服务暂时不可用，请稍后再试。");
      return;
    }
    if (password.length < 6) {
      setSuccess(false);
      setMessage("新密码至少需要 6 位。");
      return;
    }
    if (password !== confirmPassword) {
      setSuccess(false);
      setMessage("两次输入的密码不一致。");
      return;
    }

    setLoading(true);
    setMessage("");
    setSuccess(false);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    setSuccess(true);
    setMessage("密码已更新，即将返回登录页。");
    window.setTimeout(() => {
      router.replace("/login");
    }, 900);
  };

  return (
    <main className="min-h-screen bg-[#F6FAFF] px-4 py-5 text-[#0F172A]">
      <div className="mx-auto min-h-screen max-w-[430px] px-1 pb-10">
        <div className="mb-5">
          <BackButton fallbackHref="/login" label="返回" />
        </div>

        <section className="rounded-[28px] border border-white/60 bg-white/75 p-5 shadow-[0_18px_45px_rgba(37,99,235,0.10)] backdrop-blur-xl">
          <p className="text-sm font-black text-[#2563EB]">Japan Life</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight">设置新密码</h1>
          <p className="mt-3 text-sm font-bold leading-6 text-[#64748B]">从邮件链接回来后，在这里输入新密码完成重置。</p>
        </section>

        <form className="mt-5 grid gap-3 rounded-[28px] border border-white/60 bg-white/75 p-5 shadow-[0_10px_35px_rgba(37,99,235,0.08)] backdrop-blur-xl" onSubmit={handleSubmit}>
          <label className="grid gap-1.5">
            <span className="text-xs font-black text-[#64748B]">新密码</span>
            <div className="flex h-12 items-center gap-2 rounded-2xl border border-blue-100 bg-blue-50/70 px-4">
              <LockKeyhole className="h-4 w-4 text-[#2563EB]" />
              <input className="min-w-0 flex-1 bg-transparent text-sm font-bold outline-none" minLength={6} onChange={(event) => setPassword(event.target.value)} placeholder="至少 6 位" type="password" value={password} />
            </div>
          </label>

          <label className="grid gap-1.5">
            <span className="text-xs font-black text-[#64748B]">确认新密码</span>
            <div className="flex h-12 items-center gap-2 rounded-2xl border border-blue-100 bg-blue-50/70 px-4">
              <LockKeyhole className="h-4 w-4 text-[#2563EB]" />
              <input className="min-w-0 flex-1 bg-transparent text-sm font-bold outline-none" minLength={6} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="再输入一次" type="password" value={confirmPassword} />
            </div>
          </label>

          <button className="mt-2 flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#2563EB] text-sm font-black text-white shadow-sm disabled:opacity-50" disabled={loading || checkingSession} type="submit">
            <Save className="h-4 w-4" />
            {checkingSession ? "检查链接中..." : loading ? "保存中..." : "更新密码"}
          </button>

          {message && <p className={`rounded-2xl px-4 py-3 text-xs font-bold leading-5 ${success ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>{message}</p>}

          <Link className="text-center text-xs font-black text-[#2563EB]" href="/forgot-password">
            重新发送重置邮件
          </Link>
        </form>
      </div>
    </main>
  );
}
