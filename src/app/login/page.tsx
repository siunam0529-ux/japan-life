"use client";

import { Globe2, LockKeyhole, LogIn, Mail } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { BackButton } from "@/components/BackButton";
import { useLanguage } from "@/hooks/useLanguage";
import { createAuthRedirectUrl, replaceAfterAuth } from "@/lib/authRedirect";
import { getFriendlyAuthError, normalizeAuthEmail } from "@/lib/authMessages";
import { supabase } from "@/lib/supabase";

const loginCopy = {
  "zh-CN": {
    back: "返回",
    title: "登录账号",
    subtitle: "使用邮箱和密码登录。登录后会自动同步你的设置和收藏。",
    email: "邮箱",
    password: "密码",
    passwordPlaceholder: "请输入密码",
    unavailable: "账号服务暂时不可用，请稍后再试。",
    loading: "登录中...",
    login: "登录",
    google: "使用 Google 登录",
    forgot: "忘记密码？",
    noAccount: "还没有账号？",
    signup: "注册",
  },
  "zh-TW": {
    back: "返回",
    title: "登入帳號",
    subtitle: "使用信箱和密碼登入。登入後會自動同步你的設定和收藏。",
    email: "信箱",
    password: "密碼",
    passwordPlaceholder: "請輸入密碼",
    unavailable: "帳號服務暫時不可用，請稍後再試。",
    loading: "登入中...",
    login: "登入",
    google: "使用 Google 登入",
    forgot: "忘記密碼？",
    noAccount: "還沒有帳號？",
    signup: "註冊",
  },
  ja: {
    back: "戻る",
    title: "アカウントにログイン",
    subtitle: "メールアドレスとパスワードでログインします。ログイン後、設定と保存データを同期できます。",
    email: "メール",
    password: "パスワード",
    passwordPlaceholder: "パスワードを入力",
    unavailable: "アカウントサービスは一時的に利用できません。後でもう一度お試しください。",
    loading: "ログイン中...",
    login: "ログイン",
    google: "Google でログイン",
    forgot: "パスワードを忘れた場合",
    noAccount: "アカウントをお持ちでないですか？",
    signup: "登録",
  },
} as const;

export default function LoginPage() {
  const { language } = useLanguage();
  const text = loginCopy[language];
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get("redirect") || searchParams.get("next");
  const fromParam = searchParams.get("from");
  const nextPath = resolveLoginRedirectPath(redirectParam, fromParam);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) void replaceAfterAuth(router, nextPath, data.session.access_token);
    });
  }, [nextPath, router]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!supabase) {
      setMessage(text.unavailable);
      return;
    }
    setLoading(true);
    setMessage("");
    const { data, error } = await supabase.auth.signInWithPassword({ email: normalizeAuthEmail(email), password });
    setLoading(false);

    if (error) {
      setMessage(getFriendlyAuthError(error.message));
      return;
    }
    await replaceAfterAuth(router, nextPath, data.session?.access_token);
  };

  const handleGoogleLogin = async () => {
    if (!supabase) {
      setMessage(text.unavailable);
      return;
    }
    setLoading(true);
    setMessage("");
    const { error } = await supabase.auth.signInWithOAuth({
      options: { redirectTo: createAuthRedirectUrl(`/login?redirect=${encodeURIComponent(nextPath)}`) },
      provider: "google",
    });
    setLoading(false);
    if (error) setMessage(getFriendlyAuthError(error.message));
  };

  return (
    <main className="min-h-screen bg-[#F6FAFF] px-4 py-5 text-[#0F172A]">
      <div className="mx-auto min-h-screen max-w-[430px] px-1 pb-10">
        <div className="mb-5">
          <BackButton fallbackHref="/" label={text.back} />
        </div>

        <section className="rounded-[28px] border border-white/60 bg-white/75 p-5 shadow-[0_18px_45px_rgba(37,99,235,0.10)] backdrop-blur-xl">
          <p className="text-sm font-black text-[#2563EB]">Japan Life</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight">{text.title}</h1>
          <p className="mt-3 text-sm font-bold leading-6 text-[#64748B]">{text.subtitle}</p>
        </section>

        <form className="mt-5 grid gap-3 rounded-[28px] border border-white/60 bg-white/75 p-5 shadow-[0_10px_35px_rgba(37,99,235,0.08)] backdrop-blur-xl" onSubmit={handleSubmit}>
          <AuthInput icon={<Mail className="h-4 w-4 text-[#2563EB]" />} label={text.email} onChange={setEmail} placeholder="you@example.com" type="email" value={email} />
          <AuthInput icon={<LockKeyhole className="h-4 w-4 text-[#2563EB]" />} label={text.password} onChange={setPassword} placeholder={text.passwordPlaceholder} type="password" value={password} />

          <button className="mt-2 flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#2563EB] text-sm font-black text-white shadow-sm disabled:opacity-50" disabled={loading} type="submit">
            <LogIn className="h-4 w-4" />
            {loading ? text.loading : text.login}
          </button>

          <button className="flex h-12 items-center justify-center gap-2 rounded-2xl border border-blue-100 bg-white/85 text-sm font-black text-[#0F172A] shadow-sm disabled:opacity-50" disabled={loading} onClick={handleGoogleLogin} type="button">
            <Globe2 className="h-4 w-4 text-[#2563EB]" />
            {text.google}
          </button>

          {message && <p className="rounded-2xl bg-rose-50 px-4 py-3 text-xs font-bold leading-5 text-rose-700">{message}</p>}

          <Link className="text-center text-xs font-black text-[#2563EB]" href="/forgot-password">
            {text.forgot}
          </Link>

          <p className="text-center text-xs font-bold text-[#64748B]">
            {text.noAccount}{" "}
            <Link className="font-black text-[#2563EB]" href="/signup">
              {text.signup}
            </Link>
          </p>
        </form>
      </div>
    </main>
  );
}

function normalizeRedirectPath(value: string | null) {
  if (!value) return "/community/all";
  if (!value.startsWith("/") || value.startsWith("//")) return "/community/all";
  return value;
}

function isAuthPath(value: string) {
  const path = value.split("?")[0] || "/";
  return path === "/login" || path === "/signup" || path === "/forgot-password" || path === "/reset-password";
}

function resolveLoginRedirectPath(redirectValue: string | null, fromValue: string | null) {
  const redirectPath = normalizeRedirectPath(redirectValue);
  const fromPath = normalizeRedirectPath(fromValue);

  if (redirectPath === "/me" && fromPath !== "/me" && !isAuthPath(fromPath)) {
    return fromPath;
  }

  return redirectPath;
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
