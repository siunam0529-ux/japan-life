"use client";

import { Globe2, LockKeyhole, LogIn, Mail } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { BackButton } from "@/components/BackButton";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") || "/account";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.replace(nextPath);
    });
  }, [nextPath, router]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!supabase) {
      setMessage("Supabase 环境变量未配置。");
      return;
    }
    setLoading(true);
    setMessage("");
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setLoading(false);

    if (error) {
      setMessage(error.message);
      return;
    }
    router.replace(nextPath);
  };

  const handleGoogleLogin = async () => {
    if (!supabase) {
      setMessage("Supabase 环境变量未配置。");
      return;
    }
    setLoading(true);
    setMessage("");
    const { error } = await supabase.auth.signInWithOAuth({
      options: { redirectTo: `${window.location.origin}/account` },
      provider: "google",
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
          <h1 className="mt-2 text-3xl font-black tracking-tight">登录账号</h1>
          <p className="mt-3 text-sm font-bold leading-6 text-[#64748B]">不登录也可以使用本机功能；登录后会自动同步你的设置和收藏。</p>
        </section>

        <form className="mt-5 grid gap-3 rounded-[28px] border border-white/60 bg-white/75 p-5 shadow-[0_10px_35px_rgba(37,99,235,0.08)] backdrop-blur-xl" onSubmit={handleSubmit}>
          <AuthInput icon={<Mail className="h-4 w-4 text-[#2563EB]" />} label="邮箱" onChange={setEmail} placeholder="you@example.com" type="email" value={email} />
          <AuthInput icon={<LockKeyhole className="h-4 w-4 text-[#2563EB]" />} label="密码" onChange={setPassword} placeholder="请输入密码" type="password" value={password} />

          <button className="mt-2 flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#2563EB] text-sm font-black text-white shadow-sm disabled:opacity-50" disabled={loading} type="submit">
            <LogIn className="h-4 w-4" />
            {loading ? "登录中..." : "登录"}
          </button>

          <button className="flex h-12 items-center justify-center gap-2 rounded-2xl border border-blue-100 bg-white/85 text-sm font-black text-[#0F172A] shadow-sm disabled:opacity-50" disabled={loading} onClick={handleGoogleLogin} type="button">
            <Globe2 className="h-4 w-4 text-[#2563EB]" />
            使用 Google 登录
          </button>

          {message && <p className="rounded-2xl bg-rose-50 px-4 py-3 text-xs font-bold leading-5 text-rose-700">{message}</p>}

          <Link className="text-center text-xs font-black text-[#2563EB]" href="/forgot-password">
            忘记密码？
          </Link>

          <p className="text-center text-xs font-bold text-[#64748B]">
            还没有账号？{" "}
            <Link className="font-black text-[#2563EB]" href="/signup">
              注册
            </Link>
          </p>
        </form>
      </div>
    </main>
  );
}

function AuthInput({ icon, label, onChange, placeholder, type, value }: { icon: React.ReactNode; label: string; onChange: (value: string) => void; placeholder: string; type: string; value: string }) {
  return (
    <label className="grid gap-1.5">
      <span className="text-xs font-black text-[#64748B]">{label}</span>
      <div className="flex h-12 items-center gap-2 rounded-2xl border border-blue-100 bg-blue-50/70 px-4">
        {icon}
        <input className="min-w-0 flex-1 bg-transparent text-sm font-bold outline-none" onChange={(event) => onChange(event.target.value)} placeholder={placeholder} type={type} value={value} />
      </div>
    </label>
  );
}
