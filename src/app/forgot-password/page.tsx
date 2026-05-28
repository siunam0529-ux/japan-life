"use client";

import { Mail, Send } from "lucide-react";
import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { BackButton } from "@/components/BackButton";
import { getFriendlyAuthError, normalizeAuthEmail } from "@/lib/authMessages";
import { supabase } from "@/lib/supabase";

function getResetRedirectUrl() {
  if (typeof window !== "undefined") return `${window.location.origin}/reset-password`;
  return undefined;
}

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const redirectTo = useMemo(getResetRedirectUrl, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!supabase) {
      setSuccess(false);
      setMessage("账号服务暂时不可用，请稍后再试。");
      return;
    }

    setLoading(true);
    setMessage("");
    setSuccess(false);
    const { error } = await supabase.auth.resetPasswordForEmail(normalizeAuthEmail(email), { redirectTo });
    setLoading(false);

    if (error) {
      setMessage(getFriendlyAuthError(error.message));
      return;
    }

    setSuccess(true);
    setMessage("重置密码邮件已发送，请打开邮箱中的链接继续设置新密码。");
  };

  return (
    <main className="min-h-screen bg-[#F6FAFF] px-4 py-5 text-[#0F172A]">
      <div className="mx-auto min-h-screen max-w-[430px] px-1 pb-10">
        <div className="mb-5">
          <BackButton fallbackHref="/login" label="返回" />
        </div>

        <section className="rounded-[28px] border border-white/60 bg-white/75 p-5 shadow-[0_18px_45px_rgba(37,99,235,0.10)] backdrop-blur-xl">
          <p className="text-sm font-black text-[#2563EB]">Japan Life</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight">忘记密码</h1>
          <p className="mt-3 text-sm font-bold leading-6 text-[#64748B]">输入注册邮箱，我们会发送密码重置链接。</p>
        </section>

        <form className="mt-5 grid gap-3 rounded-[28px] border border-white/60 bg-white/75 p-5 shadow-[0_10px_35px_rgba(37,99,235,0.08)] backdrop-blur-xl" onSubmit={handleSubmit}>
          <label className="grid gap-1.5">
            <span className="text-xs font-black text-[#64748B]">邮箱</span>
            <div className="flex h-12 items-center gap-2 rounded-2xl border border-blue-100 bg-blue-50/70 px-4">
              <Mail className="h-4 w-4 text-[#2563EB]" />
              <input className="min-w-0 flex-1 bg-transparent text-sm font-bold outline-none" onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" type="email" value={email} />
            </div>
          </label>

          <button className="mt-2 flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#2563EB] text-sm font-black text-white shadow-sm disabled:opacity-50" disabled={loading} type="submit">
            <Send className="h-4 w-4" />
            {loading ? "发送中..." : "发送重置邮件"}
          </button>

          {message && <p className={`rounded-2xl px-4 py-3 text-xs font-bold leading-5 ${success ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>{message}</p>}

          <Link className="text-center text-xs font-black text-[#2563EB]" href="/login">
            返回登录
          </Link>
        </form>
      </div>
    </main>
  );
}
