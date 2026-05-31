"use client";

import { LockKeyhole, Save } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { BackButton } from "@/components/BackButton";
import { useLanguage } from "@/hooks/useLanguage";
import { supabase } from "@/lib/supabase";

const resetCopy = {
  "zh-CN": {
    back: "返回",
    title: "设置新密码",
    subtitle: "从邮件链接回来后，在这里输入新密码完成重置。",
    newPassword: "新密码",
    newPlaceholder: "至少 6 位",
    confirmPassword: "确认新密码",
    confirmPlaceholder: "再输入一次",
    unavailable: "账号服务暂时不可用，请稍后再试。",
    invalidLink: "重置链接无效或已过期，请重新发送重置邮件。",
    tooShort: "新密码至少需要 6 位。",
    mismatch: "两次输入的密码不一致。",
    success: "密码已更新，即将返回登录页。",
    checking: "检查链接中...",
    saving: "保存中...",
    submit: "更新密码",
    resend: "重新发送重置邮件",
  },
  "zh-TW": {
    back: "返回",
    title: "設定新密碼",
    subtitle: "從郵件連結回來後，在這裡輸入新密碼完成重置。",
    newPassword: "新密碼",
    newPlaceholder: "至少 6 位",
    confirmPassword: "確認新密碼",
    confirmPlaceholder: "再輸入一次",
    unavailable: "帳號服務暫時不可用，請稍後再試。",
    invalidLink: "重置連結無效或已過期，請重新發送重置郵件。",
    tooShort: "新密碼至少需要 6 位。",
    mismatch: "兩次輸入的密碼不一致。",
    success: "密碼已更新，即將返回登入頁。",
    checking: "檢查連結中...",
    saving: "儲存中...",
    submit: "更新密碼",
    resend: "重新發送重置郵件",
  },
  ja: {
    back: "戻る",
    title: "新しいパスワードを設定",
    subtitle: "メール内のリンクから戻った後、ここで新しいパスワードを入力してください。",
    newPassword: "新しいパスワード",
    newPlaceholder: "6文字以上",
    confirmPassword: "新しいパスワード確認",
    confirmPlaceholder: "もう一度入力",
    unavailable: "アカウントサービスは一時的に利用できません。後でもう一度お試しください。",
    invalidLink: "再設定リンクが無効、または期限切れです。再設定メールを再送してください。",
    tooShort: "新しいパスワードは6文字以上にしてください。",
    mismatch: "入力したパスワードが一致しません。",
    success: "パスワードを更新しました。ログインページへ戻ります。",
    checking: "リンクを確認中...",
    saving: "保存中...",
    submit: "パスワードを更新",
    resend: "再設定メールを再送",
  },
} as const;

export default function ResetPasswordPage() {
  const { language } = useLanguage();
  const text = resetCopy[language];
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
      setMessage(text.unavailable);
      return;
    }

    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setCheckingSession(false);
      if (!data.session) setMessage(text.invalidLink);
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
  }, [text.invalidLink, text.unavailable]);

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
      setMessage(error.message);
      return;
    }

    setSuccess(true);
    setMessage(text.success);
    window.setTimeout(() => {
      router.replace("/login");
    }, 900);
  };

  return (
    <main className="min-h-screen bg-[#F6FAFF] px-4 py-5 text-[#0F172A]">
      <div className="mx-auto min-h-screen max-w-[430px] px-1 pb-10">
        <div className="mb-5">
          <BackButton fallbackHref="/login" label={text.back} />
        </div>

        <section className="rounded-[28px] border border-white/60 bg-white/75 p-5 shadow-[0_18px_45px_rgba(37,99,235,0.10)] backdrop-blur-xl">
          <p className="text-sm font-black text-[#2563EB]">Japan Life</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight">{text.title}</h1>
          <p className="mt-3 text-sm font-bold leading-6 text-[#64748B]">{text.subtitle}</p>
        </section>

        <form className="mt-5 grid gap-3 rounded-[28px] border border-white/60 bg-white/75 p-5 shadow-[0_10px_35px_rgba(37,99,235,0.08)] backdrop-blur-xl" onSubmit={handleSubmit}>
          <label className="grid gap-1.5">
            <span className="text-xs font-black text-[#64748B]">{text.newPassword}</span>
            <div className="flex h-12 items-center gap-2 rounded-2xl border border-blue-100 bg-blue-50/70 px-4">
              <LockKeyhole className="h-4 w-4 text-[#2563EB]" />
              <input className="min-w-0 flex-1 bg-transparent text-sm font-bold outline-none" minLength={6} onChange={(event) => setPassword(event.target.value)} placeholder={text.newPlaceholder} type="password" value={password} />
            </div>
          </label>

          <label className="grid gap-1.5">
            <span className="text-xs font-black text-[#64748B]">{text.confirmPassword}</span>
            <div className="flex h-12 items-center gap-2 rounded-2xl border border-blue-100 bg-blue-50/70 px-4">
              <LockKeyhole className="h-4 w-4 text-[#2563EB]" />
              <input className="min-w-0 flex-1 bg-transparent text-sm font-bold outline-none" minLength={6} onChange={(event) => setConfirmPassword(event.target.value)} placeholder={text.confirmPlaceholder} type="password" value={confirmPassword} />
            </div>
          </label>

          <button className="mt-2 flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#2563EB] text-sm font-black text-white shadow-sm disabled:opacity-50" disabled={loading || checkingSession} type="submit">
            <Save className="h-4 w-4" />
            {checkingSession ? text.checking : loading ? text.saving : text.submit}
          </button>

          {message && <p className={`rounded-2xl px-4 py-3 text-xs font-bold leading-5 ${success ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>{message}</p>}

          <Link className="text-center text-xs font-black text-[#2563EB]" href="/forgot-password">
            {text.resend}
          </Link>
        </form>
      </div>
    </main>
  );
}
