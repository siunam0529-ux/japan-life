"use client";

import { Eye, EyeOff, Globe2, LockKeyhole, Mail, UserRound, UserPlus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { BackButton } from "@/components/BackButton";
import { useLanguage } from "@/hooks/useLanguage";
import { defaultUserSettings, type LifeStatus, type UserSettings } from "@/hooks/useUserSettings";
import { getFriendlyAuthError, normalizeAuthEmail } from "@/lib/authMessages";
import { supabase } from "@/lib/supabase";

const signupCopy = {
  "zh-CN": {
    back: "返回",
    title: "注册账号",
    subtitle: "创建你的 Japan Life 账号。昵称会显示在「我的」页面，个人资料以后也可以再调整。",
    name: "昵称",
    namePlaceholder: "例如：小南",
    email: "邮箱",
    password: "密码",
    passwordPlaceholder: "至少 6 位",
    confirmPassword: "确认密码",
    confirmPlaceholder: "再输入一次密码",
    status: "身份 / 在留状态",
    statusHint: "和「我的 → 个人资料」一致，用于首页提醒和工具排序，之后可以再修改。",
    hidePassword: "隐藏密码",
    showPassword: "显示密码",
    mismatch: "两次输入的密码不一致。",
    unavailable: "账号服务暂时不可用，请稍后再试。",
    nameRequired: "请输入昵称。",
    success: "注册成功。可以先回到首页继续使用；如果后台开启了邮箱确认，请记得打开邮箱完成验证。",
    loading: "注册中...",
    signup: "注册",
    google: "使用 Google 登录",
    home: "回到首页",
    hasAccount: "已有账号？",
    login: "去登录",
    statusOptions: {
      student: "留学生",
      work: "工作签",
      family: "家族滞在",
      permanent: "永驻",
      highlySkilled: "高度人才",
      japanese: "日本人",
      other: "其他",
    },
  },
  "zh-TW": {
    back: "返回",
    title: "註冊帳號",
    subtitle: "建立你的 Japan Life 帳號。暱稱會顯示在「我的」頁面，個人資料之後也可以再調整。",
    name: "暱稱",
    namePlaceholder: "例如：小南",
    email: "信箱",
    password: "密碼",
    passwordPlaceholder: "至少 6 位",
    confirmPassword: "確認密碼",
    confirmPlaceholder: "再輸入一次密碼",
    status: "身份 / 在留狀態",
    statusHint: "和「我的 → 個人資料」一致，用於首頁提醒和工具排序，之後可以再修改。",
    hidePassword: "隱藏密碼",
    showPassword: "顯示密碼",
    mismatch: "兩次輸入的密碼不一致。",
    unavailable: "帳號服務暫時不可用，請稍後再試。",
    nameRequired: "請輸入暱稱。",
    success: "註冊成功。可以先回到首頁繼續使用；如果後台開啟了信箱確認，請記得打開信箱完成驗證。",
    loading: "註冊中...",
    signup: "註冊",
    google: "使用 Google 登入",
    home: "回到首頁",
    hasAccount: "已有帳號？",
    login: "去登入",
    statusOptions: {
      student: "留學生",
      work: "工作簽",
      family: "家族滯在",
      permanent: "永住",
      highlySkilled: "高度人才",
      japanese: "日本人",
      other: "其他",
    },
  },
  ja: {
    back: "戻る",
    title: "アカウント登録",
    subtitle: "Japan Life アカウントを作成します。ニックネームは「マイページ」に表示され、プロフィールは後から変更できます。",
    name: "ニックネーム",
    namePlaceholder: "例：ミナミ",
    email: "メール",
    password: "パスワード",
    passwordPlaceholder: "6文字以上",
    confirmPassword: "パスワード確認",
    confirmPlaceholder: "もう一度入力",
    status: "身分 / 在留資格",
    statusHint: "「マイページ → プロフィール」と同じ内容で、ホームの表示やツールの並び替えに使います。後から変更できます。",
    hidePassword: "パスワードを隠す",
    showPassword: "パスワードを表示",
    mismatch: "入力したパスワードが一致しません。",
    unavailable: "アカウントサービスは一時的に利用できません。後でもう一度お試しください。",
    nameRequired: "ニックネームを入力してください。",
    success: "登録しました。ホームに戻って利用できます。メール確認が有効な場合は、受信メールから確認を完了してください。",
    loading: "登録中...",
    signup: "登録",
    google: "Google でログイン",
    home: "ホームに戻る",
    hasAccount: "すでにアカウントがありますか？",
    login: "ログインへ",
    statusOptions: {
      student: "留学生",
      work: "就労ビザ",
      family: "家族滞在",
      permanent: "永住者",
      highlySkilled: "高度人材",
      japanese: "日本人",
      other: "その他",
    },
  },
} as const;

const statusValues: LifeStatus[] = ["student", "work", "family", "permanent", "highlySkilled", "japanese", "other"];

export default function SignupPage() {
  const { language } = useLanguage();
  const text = signupCopy[language];
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
      setMessage(text.unavailable);
      return;
    }

    if (passwordMismatch) {
      setMessage(text.mismatch);
      return;
    }

    const normalizedName = displayName.trim();
    if (!normalizedName) {
      setMessage(text.nameRequired);
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
    setMessage(text.success);
  };

  const handleGoogleLogin = async () => {
    if (!supabase) {
      setMessage(text.unavailable);
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
          <BackButton fallbackHref="/" label={text.back} />
        </div>

        <section className="rounded-[28px] border border-white/60 bg-white/75 p-5 shadow-[0_18px_45px_rgba(37,99,235,0.10)] backdrop-blur-xl">
          <p className="text-sm font-black text-[#2563EB]">Japan Life</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight">{text.title}</h1>
          <p className="mt-3 text-sm font-bold leading-6 text-[#64748B]">{text.subtitle}</p>
        </section>

        <form className="mt-5 grid gap-3 rounded-[28px] border border-white/60 bg-white/75 p-5 shadow-[0_10px_35px_rgba(37,99,235,0.08)] backdrop-blur-xl" onSubmit={handleSubmit}>
          <AuthInput icon={<UserRound className="h-4 w-4 text-[#2563EB]" />} label={text.name} maxLength={24} onChange={setDisplayName} placeholder={text.namePlaceholder} type="text" value={displayName} />
          <AuthInput icon={<Mail className="h-4 w-4 text-[#2563EB]" />} label={text.email} onChange={setEmail} placeholder="you@example.com" type="email" value={email} />
          <AuthInput icon={<LockKeyhole className="h-4 w-4 text-[#2563EB]" />} label={text.password} minLength={6} onChange={setPassword} onToggleVisible={() => setShowPassword((current) => !current)} placeholder={text.passwordPlaceholder} showValue={showPassword} toggleLabel={showPassword ? text.hidePassword : text.showPassword} type={showPassword ? "text" : "password"} value={password} />
          <AuthInput icon={<LockKeyhole className="h-4 w-4 text-[#2563EB]" />} label={text.confirmPassword} minLength={6} onChange={setConfirmPassword} onToggleVisible={() => setShowConfirmPassword((current) => !current)} placeholder={text.confirmPlaceholder} showValue={showConfirmPassword} toggleLabel={showConfirmPassword ? text.hidePassword : text.showPassword} type={showConfirmPassword ? "text" : "password"} value={confirmPassword} />
          {passwordMismatch && <p className="-mt-1 rounded-2xl bg-rose-50 px-3 py-2 text-xs font-black text-rose-700">{text.mismatch}</p>}
          <StatusSelect labels={text.statusOptions} title={text.status} hint={text.statusHint} value={status} onChange={setStatus} />

          <button className="mt-2 flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#2563EB] text-sm font-black text-white shadow-sm disabled:opacity-50" disabled={loading} type="submit">
            <UserPlus className="h-4 w-4" />
            {loading ? text.loading : text.signup}
          </button>

          <button className="flex h-12 items-center justify-center gap-2 rounded-2xl border border-blue-100 bg-white/85 text-sm font-black text-[#0F172A] shadow-sm disabled:opacity-50" disabled={loading} onClick={handleGoogleLogin} type="button">
            <Globe2 className="h-4 w-4 text-[#2563EB]" />
            {text.google}
          </button>

          {message && <p className="rounded-2xl bg-blue-50 px-4 py-3 text-xs font-bold leading-5 text-[#2563EB]">{message}</p>}
          {message === text.success && (
            <Link className="flex h-11 items-center justify-center rounded-2xl bg-blue-50 text-sm font-black text-[#2563EB]" href="/">
              {text.home}
            </Link>
          )}

          <p className="text-center text-xs font-bold text-[#64748B]">
            {text.hasAccount}{" "}
            <Link className="font-black text-[#2563EB]" href="/login">
              {text.login}
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
  toggleLabel,
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
  toggleLabel?: string;
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
          <button aria-label={toggleLabel} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[#2563EB]" onClick={onToggleVisible} type="button">
            {showValue ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}
      </div>
    </label>
  );
}

function StatusSelect({ hint, labels, onChange, title, value }: { hint: string; labels: Record<LifeStatus, string>; onChange: (value: LifeStatus) => void; title: string; value: LifeStatus }) {
  return (
    <label className="grid gap-1.5">
      <span className="text-xs font-black text-[#64748B]">{title}</span>
      <div className="flex h-12 items-center gap-2 rounded-2xl border border-blue-100 bg-blue-50/70 px-4">
        <UserRound className="h-4 w-4 text-[#2563EB]" />
        <select className="min-w-0 flex-1 bg-transparent text-sm font-bold outline-none" onChange={(event) => onChange(event.target.value as LifeStatus)} value={value}>
          {statusValues.map((option) => (
            <option key={option} value={option}>
              {labels[option]}
            </option>
          ))}
        </select>
      </div>
      <span className="text-[11px] font-bold leading-5 text-[#64748B]">{hint}</span>
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
