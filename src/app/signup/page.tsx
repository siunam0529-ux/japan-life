"use client";

import { Eye, EyeOff, Globe2, LockKeyhole, Mail, UserRound, UserPlus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { BackButton } from "@/components/BackButton";
import { defaultUserSettings, type LifeStatus, type UserSettings } from "@/hooks/useUserSettings";
import { getFriendlyAuthError, normalizeAuthEmail } from "@/lib/authMessages";
import { supabase } from "@/lib/supabase";

const statusOptions: Array<{ label: string; value: LifeStatus }> = [
  { label: "留学生", value: "student" },
  { label: "工作签", value: "work" },
  { label: "家族滞在", value: "family" },
  { label: "永驻", value: "permanent" },
  { label: "高度人才", value: "highlySkilled" },
  { label: "日本人", value: "japanese" },
  { label: "其他", value: "other" },
];

export default function SignupPage() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<LifeStatus>("student");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const passwordMismatch = Boolean(confirmPassword) && password !== confirmPassword;

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.replace("/account");
    });
  }, [router]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!supabase) {
      setMessage("账号服务暂时不可用，请稍后再试。");
      return;
    }

    if (passwordMismatch) {
      setMessage("两次输入的密码不一致，请重新确认。");
      return;
    }

    const normalizedName = displayName.trim();
    if (!normalizedName) {
      setMessage("请输入昵称。");
      return;
    }

    setLoading(true);
    setMessage("");
    const normalizedEmail = normalizeAuthEmail(email);
    const { data, error } = await supabase.auth.signUp({
      email: normalizedEmail,
      options: {
        data: {
          display_name: normalizedName,
          full_name: normalizedName,
          life_status: status,
          name: normalizedName,
        },
      },
      password,
    });
    setLoading(false);

    if (error) {
      setMessage(getFriendlyAuthError(error.message));
      return;
    }

    if (data.session) {
      saveSignupProfile({ displayName: normalizedName, status });
      router.replace("/");
      return;
    }
    saveSignupProfile({ displayName: normalizedName, status });
    setMessage("注册成功。可以先回到首页继续使用；如果后台开启了邮箱确认，请记得打开邮箱完成验证。");
  };

  const handleGoogleLogin = async () => {
    if (!supabase) {
      setMessage("账号服务暂时不可用，请稍后再试。");
      return;
    }
    setLoading(true);
    setMessage("");
    const { error } = await supabase.auth.signInWithOAuth({
      options: { redirectTo: `${window.location.origin}/account` },
      provider: "google",
    });
    setLoading(false);
    if (error) setMessage(getFriendlyAuthError(error.message));
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
          <p className="mt-3 text-sm font-bold leading-6 text-[#64748B]">创建你的 Japan Life 账号。昵称会显示在「我的」页面，个人资料以后也可以再调整。</p>
        </section>

        <form className="mt-5 grid gap-3 rounded-[28px] border border-white/60 bg-white/75 p-5 shadow-[0_10px_35px_rgba(37,99,235,0.08)] backdrop-blur-xl" onSubmit={handleSubmit}>
          <AuthInput icon={<UserRound className="h-4 w-4 text-[#2563EB]" />} label="昵称" maxLength={24} onChange={setDisplayName} placeholder="例如：小南" type="text" value={displayName} />
          <AuthInput icon={<Mail className="h-4 w-4 text-[#2563EB]" />} label="邮箱" onChange={setEmail} placeholder="you@example.com" type="email" value={email} />
          <AuthInput icon={<LockKeyhole className="h-4 w-4 text-[#2563EB]" />} label="密码" minLength={6} onChange={setPassword} onToggleVisible={() => setShowPassword((current) => !current)} placeholder="至少 6 位" showValue={showPassword} type={showPassword ? "text" : "password"} value={password} />
          <AuthInput icon={<LockKeyhole className="h-4 w-4 text-[#2563EB]" />} label="确认密码" minLength={6} onChange={setConfirmPassword} onToggleVisible={() => setShowConfirmPassword((current) => !current)} placeholder="再输入一次密码" showValue={showConfirmPassword} type={showConfirmPassword ? "text" : "password"} value={confirmPassword} />
          {passwordMismatch && <p className="-mt-1 rounded-2xl bg-rose-50 px-3 py-2 text-xs font-black text-rose-700">两次输入的密码不一致。</p>}
          <StatusSelect value={status} onChange={setStatus} />

          <button className="mt-2 flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#2563EB] text-sm font-black text-white shadow-sm disabled:opacity-50" disabled={loading} type="submit">
            <UserPlus className="h-4 w-4" />
            {loading ? "注册中..." : "注册"}
          </button>

          <button className="flex h-12 items-center justify-center gap-2 rounded-2xl border border-blue-100 bg-white/85 text-sm font-black text-[#0F172A] shadow-sm disabled:opacity-50" disabled={loading} onClick={handleGoogleLogin} type="button">
            <Globe2 className="h-4 w-4 text-[#2563EB]" />
            使用 Google 登录
          </button>

          {message && <p className="rounded-2xl bg-blue-50 px-4 py-3 text-xs font-bold leading-5 text-[#2563EB]">{message}</p>}
          {message.includes("注册成功") && (
            <Link className="flex h-11 items-center justify-center rounded-2xl bg-blue-50 text-sm font-black text-[#2563EB]" href="/">
              回到首页
            </Link>
          )}

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

function AuthInput({
  icon,
  label,
  maxLength,
  minLength,
  onChange,
  onToggleVisible,
  placeholder,
  showValue,
  type,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  maxLength?: number;
  minLength?: number;
  onChange: (value: string) => void;
  onToggleVisible?: () => void;
  placeholder: string;
  showValue?: boolean;
  type: string;
  value: string;
}) {
  return (
    <label className="grid gap-1.5">
      <span className="text-xs font-black text-[#64748B]">{label}</span>
      <div className="flex h-12 items-center gap-2 rounded-2xl border border-blue-100 bg-blue-50/70 px-4">
        {icon}
        <input className="min-w-0 flex-1 bg-transparent text-sm font-bold outline-none" maxLength={maxLength} minLength={minLength} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} type={type} value={value} />
        {onToggleVisible && (
          <button aria-label={showValue ? "隐藏密码" : "显示密码"} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[#2563EB]" onClick={onToggleVisible} type="button">
            {showValue ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}
      </div>
    </label>
  );
}

function StatusSelect({ onChange, value }: { onChange: (value: LifeStatus) => void; value: LifeStatus }) {
  return (
    <label className="grid gap-1.5">
      <span className="text-xs font-black text-[#64748B]">身份 / 在留状态</span>
      <div className="flex h-12 items-center gap-2 rounded-2xl border border-blue-100 bg-blue-50/70 px-4">
        <UserRound className="h-4 w-4 text-[#2563EB]" />
        <select className="min-w-0 flex-1 bg-transparent text-sm font-bold outline-none" onChange={(event) => onChange(event.target.value as LifeStatus)} value={value}>
          {statusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      <span className="text-[11px] font-bold leading-5 text-[#64748B]">和「我的 → 个人资料」一致，用于首页提醒和工具排序，之后可以再修改。</span>
    </label>
  );
}

function saveSignupProfile({ displayName, status }: { displayName: string; status: LifeStatus }) {
  if (typeof window === "undefined") return;

  try {
    const existing = readLocalUserSettings();
    window.localStorage.setItem("japan-life:user-display-name", displayName);
    window.localStorage.setItem(
      "japan-life:user-settings",
      JSON.stringify({
        ...defaultUserSettings,
        ...existing,
        status,
        onboardingCompleted: existing?.onboardingCompleted ?? false,
        updatedAt: new Date().toISOString(),
      }),
    );
    window.dispatchEvent(new Event("japan-life:user-settings-change"));
  } catch {
    // localStorage failure should not block account registration.
  }
}

function readLocalUserSettings(): Partial<UserSettings> | null {
  try {
    const raw = window.localStorage.getItem("japan-life:user-settings");
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? (parsed as Partial<UserSettings>) : null;
  } catch {
    return null;
  }
}
