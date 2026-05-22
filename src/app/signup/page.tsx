"use client";

import { Globe2, LockKeyhole, Mail, UserPlus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { BackButton } from "@/components/BackButton";
import { supabase } from "@/lib/supabase";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.replace("/account");
    });
  }, [router]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!supabase) {
      setMessage("Supabase 环境变量未配置。");
      return;
    }
    setLoading(true);
    setMessage("");
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
    });
    setLoading(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    if (data.session) {
      router.replace("/account");
      return;
    }
    setMessage("注册成功。请根据 Supabase Auth 设置检查邮箱验证后再登录。");
  };

  const handleGoogleLogin = async () => {
    if (!supabase) {
      setMessage("Supabase 环境变量未配置。");
      return;
    }
    setLoading(true);
    setMessage("");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/account`,
      },
    });
    setLoading(false);
    if (error) setMessage(error.message);
  };

  return (
    <main className="min-h-screen bg-[#F6FAFF] px-4 py-5 text-[#0F172A]">
      <div className="mx-auto min-h-screen max-w-[430px] px-1 pb-10">
        <div className="mb-5">
          <BackButton fallbackHref="/" label="返回" />
        </div>

        <section className="rounded-[28px] border border-white/60 bg-white/75 p-5 shadow-[0_18px_45px_rgba(37,99,235,0.10)] backdrop-blur-xl">
          <p className="text-sm font-black text-[#2563EB]">Japan Life</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight">注册账号</h1>
          <p className="mt-3 text-sm font-bold leading-6 text-[#64748B]">先接入普通邮箱账号，之后可承载云端同步和个人资料。</p>
        </section>

        <form className="mt-5 grid gap-3 rounded-[28px] border border-white/60 bg-white/75 p-5 shadow-[0_10px_35px_rgba(37,99,235,0.08)] backdrop-blur-xl" onSubmit={handleSubmit}>
          <label className="grid gap-1.5">
            <span className="text-xs font-black text-[#64748B]">邮箱</span>
            <div className="flex h-12 items-center gap-2 rounded-2xl border border-blue-100 bg-blue-50/70 px-4">
              <Mail className="h-4 w-4 text-[#2563EB]" />
              <input className="min-w-0 flex-1 bg-transparent text-sm font-bold outline-none" onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" type="email" value={email} />
            </div>
          </label>

          <label className="grid gap-1.5">
            <span className="text-xs font-black text-[#64748B]">密码</span>
            <div className="flex h-12 items-center gap-2 rounded-2xl border border-blue-100 bg-blue-50/70 px-4">
              <LockKeyhole className="h-4 w-4 text-[#2563EB]" />
              <input className="min-w-0 flex-1 bg-transparent text-sm font-bold outline-none" minLength={6} onChange={(event) => setPassword(event.target.value)} placeholder="至少 6 位" type="password" value={password} />
            </div>
          </label>

          <button className="mt-2 flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#2563EB] text-sm font-black text-white shadow-sm disabled:opacity-50" disabled={loading} type="submit">
            <UserPlus className="h-4 w-4" />
            {loading ? "注册中..." : "注册"}
          </button>

          <button className="flex h-12 items-center justify-center gap-2 rounded-2xl border border-blue-100 bg-white/85 text-sm font-black text-[#0F172A] shadow-sm disabled:opacity-50" disabled={loading} onClick={handleGoogleLogin} type="button">
            <Globe2 className="h-4 w-4 text-[#2563EB]" />
            使用 Google 登录
          </button>

          {message && <p className="rounded-2xl bg-blue-50 px-4 py-3 text-xs font-bold leading-5 text-[#2563EB]">{message}</p>}

          <p className="text-center text-xs font-bold text-[#64748B]">
            已有账号？{" "}
            <Link className="font-black text-[#2563EB]" href="/login">
              去登录
            </Link>
          </p>
        </form>
      </div>
    </main>
  );
}
