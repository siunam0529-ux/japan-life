"use client";

import { LockKeyhole, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { BackButton } from "@/components/BackButton";
import { useLanguage } from "@/hooks/useLanguage";
import { getFriendlyAuthError } from "@/lib/authMessages";
import { supabase } from "@/lib/supabase";

const passwordCopy = {
  "zh-CN": {
    back: "返回",
    title: "修改密码",
    subtitle: "输入新密码，更新当前登录账号的密码。",
    newPassword: "新密码",
    newPlaceholder: "至少 6 位",
    confirmPassword: "确认新密码",
    confirmPlaceholder: "再输入一次",
    unavailable: "账号服务暂时不可用，请稍后再试。",
    loginRequired: "请先登录后再修改密码。",
    tooShort: "新密码至少需要 6 位。",
    mismatch: "两次输入的密码不一致。",
    success: "密码已更新，即将返回账号页。",
    checking: "检查登录状态中...",
    saving: "保存中...",
    submit: "更新密码",
  },
  "zh-TW": {
    back: "返回",
    title: "修改密碼",
    subtitle: "輸入新密碼，更新目前登入帳號的密碼。",
    newPassword: "新密碼",
    newPlaceholder: "至少 6 位",
    confirmPassword: "確認新密碼",
    confirmPlaceholder: "再輸入一次",
    unavailable: "帳號服務暫時不可用，請稍後再試。",
    loginRequired: "請先登入後再修改密碼。",
    tooShort: "新密碼至少需要 6 位。",
    mismatch: "兩次輸入的密碼不一致。",
    success: "密碼已更新，即將返回帳號頁。",
    checking: "檢查登入狀態中...",
    saving: "儲存中...",
    submit: "更新密碼",
  },
  ja: {
    back: "戻る",
    title: "パスワード変更",
    subtitle: "新しいパスワードを入力して、現在のアカウントを更新します。",
    newPassword: "新しいパスワード",
    newPlaceholder: "6文字以上",
    confirmPassword: "新しいパスワードを確認",
    confirmPlaceholder: "もう一度入力",
    unavailable: "アカウントサービスは一時的に利用できません。しばらくしてからもう一度お試しください。",
    loginRequired: "パスワードを変更するには、先にログインしてください。",
    tooShort: "新しいパスワードは6文字以上にしてください。",
    mismatch: "入力したパスワードが一致しません。",
    success: "パスワードを更新しました。アカウントページに戻ります。",
    checking: "ログイン状態を確認中...",
    saving: "保存中...",
    submit: "パスワードを更新",
  },
} as const;

export default function AccountPasswordPage() {
  const { language } = useLanguage();
  const text = passwordCopy[language];
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [checkingSession, setCheckingSession] = useState(true);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!supabase) {
      setCheckingSession(false);
      setMessage(text.unavailable);
      return;
    }

    let mounted = true;
    const requireSession = (hasSession: boolean) => {
      if (!mounted) return;
      setCheckingSession(false);
      if (!hasSession) {
        setMessage(text.loginRequired);
        router.replace("/login?next=/account/password");
      }
    };

    supabase.auth.getSession().then(({ data }) => {
      requireSession(Boolean(data.session?.user));
    });

    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") requireSession(false);
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, [router, text.loginRequired, text.unavailable]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!supabase) {
      setSuccess(false);
      setMessage(text.unavailable);
      return;
    }
    if (password.length < 6) {
      setSuccess(false);
      setMessage(text.tooShort);
      return;
    }
    if (password !== confirmPassword) {
      setSuccess(false);
      setMessage(text.mismatch);
      return;
    }

    setLoading(true);
    setMessage("");
    setSuccess(false);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      setMessage(getFriendlyAuthError(error.message, language));
      return;
    }

    setSuccess(true);
    setMessage(text.success);
    window.setTimeout(() => {
      router.replace("/account");
    }, 900);
  };

  return (
    <main className="min-h-screen bg-[#F6FAFF] px-4 py-5 text-[#0F172A]">
      <div className="mx-auto min-h-screen max-w-[430px] px-1 pb-10">
        <div className="mb-5">
          <BackButton fallbackHref="/account" label={text.back} />
        </div>

        <section className="rounded-[28px] border border-white/60 bg-white/75 p-5 shadow-[0_18px_45px_rgba(37,99,235,0.10)] backdrop-blur-xl">
          <p className="text-sm font-black text-[#2563EB]">Japan Life</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight">{text.title}</h1>
          <p className="mt-3 text-sm font-bold leading-6 text-[#64748B]">{text.subtitle}</p>
        </section>

        <form className="mt-5 grid gap-3 rounded-[28px] border border-white/60 bg-white/75 p-5 shadow-[0_10px_35px_rgba(37,99,235,0.08)] backdrop-blur-xl" onSubmit={handleSubmit}>
          <PasswordField label={text.newPassword} onChange={setPassword} placeholder={text.newPlaceholder} value={password} />
          <PasswordField label={text.confirmPassword} onChange={setConfirmPassword} placeholder={text.confirmPlaceholder} value={confirmPassword} />

          <button className="mt-2 flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#2563EB] text-sm font-black text-white shadow-sm disabled:opacity-50" disabled={loading || checkingSession} type="submit">
            <Save className="h-4 w-4" />
            {checkingSession ? text.checking : loading ? text.saving : text.submit}
          </button>

          {message && <p className={`rounded-2xl px-4 py-3 text-xs font-bold leading-5 ${success ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>{message}</p>}
        </form>
      </div>
    </main>
  );
}

function PasswordField({ label, onChange, placeholder, value }: { label: string; onChange: (value: string) => void; placeholder: string; value: string }) {
  return (
    <label className="grid gap-1.5">
      <span className="text-xs font-black text-[#64748B]">{label}</span>
      <div className="flex h-12 items-center gap-2 rounded-2xl border border-blue-100 bg-blue-50/70 px-4">
        <LockKeyhole className="h-4 w-4 text-[#2563EB]" />
        <input className="min-w-0 flex-1 bg-transparent text-sm font-bold outline-none" minLength={6} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} type="password" value={value} />
      </div>
    </label>
  );
}
