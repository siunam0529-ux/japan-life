"use client";

import type { User } from "@supabase/supabase-js";
import { KeyRound, LogOut, Mail, Trash2, UserRound } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { BackButton } from "@/components/BackButton";
import { useLanguage } from "@/hooks/useLanguage";
import { clearJapanLifeData } from "@/lib/localDataBackup";
import { withBackFrom } from "@/lib/navigation/back";
import { supabase } from "@/lib/supabase";

const avatarStorageKey = "japan-life:user-avatar";

function getUserAvatarUrl(user: User | null) {
  const value = user?.user_metadata?.avatar_url;
  return typeof value === "string" ? value : "";
}

const accountCopy = {
  "zh-CN": {
    back: "返回",
    unavailable: "账号服务暂时不可用，请稍后再试。",
    confirmDelete: "再次点击可永久删除账号。此操作会删除云端账号和云同步数据，本机 Japan Life 数据也会清除。",
    expired: "登录状态已过期，请重新登录后再删除账号。",
    deleteFailed: "账号删除失败",
    title: "账号与密码",
    subtitle: "管理登录状态、邮箱和密码安全。登录后会自动同步 App 内设置。",
    loading: "读取账号中...",
    currentUser: "当前登录用户",
    email: (value: string) => `邮箱：${value}`,
    changePassword: "修改密码",
    logout: "退出登录",
    deleteTitle: "删除账号",
    deleteText: "删除后会移除云端账号和同步数据。本机保存的 Japan Life 设置、收藏和提醒也会一起清除。这个操作不能撤销。",
    deleting: "删除中...",
    confirmPermanent: "确认永久删除",
    deleteAccount: "删除账号",
    redirecting: "未登录，正在跳转...",
  },
  "zh-TW": {
    back: "返回",
    unavailable: "帳號服務暫時不可用，請稍後再試。",
    confirmDelete: "再次點擊可永久刪除帳號。此操作會刪除雲端帳號和雲同步資料，本機 Japan Life 資料也會清除。",
    expired: "登入狀態已過期，請重新登入後再刪除帳號。",
    deleteFailed: "帳號刪除失敗",
    title: "帳號與密碼",
    subtitle: "管理登入狀態、信箱和密碼安全。登入後會自動同步 App 內設定。",
    loading: "讀取帳號中...",
    currentUser: "目前登入使用者",
    email: (value: string) => `信箱：${value}`,
    changePassword: "修改密碼",
    logout: "登出",
    deleteTitle: "刪除帳號",
    deleteText: "刪除後會移除雲端帳號和同步資料。本機保存的 Japan Life 設定、收藏和提醒也會一起清除。此操作不能復原。",
    deleting: "刪除中...",
    confirmPermanent: "確認永久刪除",
    deleteAccount: "刪除帳號",
    redirecting: "未登入，正在跳轉...",
  },
  ja: {
    back: "戻る",
    unavailable: "アカウントサービスは一時的に利用できません。後でもう一度お試しください。",
    confirmDelete: "もう一度クリックするとアカウントを完全に削除します。クラウドアカウント、同期データ、この端末の Japan Life データも削除されます。",
    expired: "ログイン状態の期限が切れました。再ログインしてから削除してください。",
    deleteFailed: "アカウントの削除に失敗しました",
    title: "アカウントとパスワード",
    subtitle: "ログイン状態、メール、パスワードの安全性を管理します。ログイン後、アプリ内設定を同期できます。",
    loading: "アカウントを読み込み中...",
    currentUser: "現在のログインユーザー",
    email: (value: string) => `メール：${value}`,
    changePassword: "パスワードを変更",
    logout: "ログアウト",
    deleteTitle: "アカウント削除",
    deleteText: "削除するとクラウドアカウントと同期データが削除されます。この端末に保存された Japan Life の設定、保存項目、リマインダーも削除されます。この操作は元に戻せません。",
    deleting: "削除中...",
    confirmPermanent: "完全削除を確認",
    deleteAccount: "アカウント削除",
    redirecting: "未ログインです。移動しています...",
  },
} as const;

export default function AccountPage() {
  const { language } = useLanguage();
  const text = accountCopy[language];
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

  useEffect(() => {
    setAvatarUrl(window.localStorage.getItem(avatarStorageKey) ?? "");
    if (!supabase) {
      setLoading(false);
      setMessage(text.unavailable);
      return;
    }

    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      if (!data.session?.user) {
        router.replace(withBackFrom("/login?next=/account"));
        return;
      }
      setUser(data.session.user);
      setAvatarUrl(getUserAvatarUrl(data.session.user) || window.localStorage.getItem(avatarStorageKey) || "");
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      if (!session?.user) {
        router.replace(withBackFrom("/login?next=/account"));
        return;
      }
      setUser(session.user);
      setAvatarUrl(getUserAvatarUrl(session.user) || window.localStorage.getItem(avatarStorageKey) || "");
      setLoading(false);
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, [router, text.unavailable]);

  const logout = async () => {
    if (!supabase) return;
    setLoading(true);
    await supabase.auth.signOut();
    router.replace("/login");
  };

  const deleteAccount = async () => {
    if (!supabase || !user) return;
    if (!confirmingDelete) {
      setConfirmingDelete(true);
      setMessage(text.confirmDelete);
      return;
    }

    setDeletingAccount(true);
    setMessage("");
    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) throw new Error(text.expired);
      const response = await fetch("/api/account", {
        headers: { authorization: `Bearer ${token}` },
        method: "DELETE",
      });
      const result = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) throw new Error(result?.error || text.deleteFailed);
      clearJapanLifeData();
      await supabase.auth.signOut();
      router.replace("/");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : text.deleteFailed);
      setConfirmingDelete(false);
    } finally {
      setDeletingAccount(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#F6FAFF] px-4 py-5 text-[#0F172A]">
      <div className="mx-auto min-h-screen max-w-[430px] px-1 pb-10">
        <div className="mb-5">
          <BackButton fallbackHref="/me" label={text.back} />
        </div>

        <section className="rounded-[28px] border border-white/60 bg-white/75 p-5 shadow-[0_18px_45px_rgba(37,99,235,0.10)] backdrop-blur-xl">
          <p className="text-sm font-black text-[#2563EB]">Japan Life</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight">{text.title}</h1>
          <p className="mt-3 text-sm font-bold leading-6 text-[#64748B]">{text.subtitle}</p>
        </section>

        <section className="mt-5 rounded-[28px] border border-white/60 bg-white/75 p-5 shadow-[0_10px_35px_rgba(37,99,235,0.08)] backdrop-blur-xl">
          {loading ? (
            <p className="rounded-2xl bg-blue-50 px-4 py-5 text-center text-sm font-bold text-[#64748B]">{text.loading}</p>
          ) : user ? (
            <div className="grid gap-4">
              <div className="flex items-center gap-3 rounded-2xl border border-blue-100 bg-blue-50/70 p-4">
                <span className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl bg-white text-[#2563EB] shadow-sm">
                  {avatarUrl ? <img alt="" className="h-full w-full object-cover" src={avatarUrl} /> : <UserRound className="h-7 w-7" />}
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-black text-[#64748B]">{text.currentUser}</p>
                  <p className="mt-1 truncate text-sm font-black text-[#0F172A]">{user.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-2xl border border-blue-100 bg-blue-50/70 p-4">
                <Mail className="h-5 w-5 text-[#2563EB]" />
                <p className="truncate text-sm font-bold text-[#64748B]">{text.email(user.email ?? "")}</p>
              </div>

              <Link className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#2563EB] text-sm font-black text-white shadow-sm" href="/forgot-password">
                <KeyRound className="h-4 w-4" />
                {text.changePassword}
              </Link>

              <button className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-slate-700 text-sm font-black text-white shadow-sm" onClick={logout} type="button">
                <LogOut className="h-4 w-4" />
                {text.logout}
              </button>

              <section className="rounded-2xl border border-rose-100 bg-rose-50/80 p-4">
                <h2 className="text-sm font-black text-rose-700">{text.deleteTitle}</h2>
                <p className="mt-2 text-xs font-bold leading-5 text-rose-700/80">
                  {text.deleteText}
                </p>
                <button
                  className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-white text-sm font-black text-rose-700 shadow-sm disabled:opacity-50"
                  disabled={deletingAccount}
                  onClick={deleteAccount}
                  type="button"
                >
                  <Trash2 className="h-4 w-4" />
                  {deletingAccount ? text.deleting : confirmingDelete ? text.confirmPermanent : text.deleteAccount}
                </button>
              </section>
            </div>
          ) : (
            <p className="rounded-2xl bg-rose-50 px-4 py-5 text-center text-sm font-bold text-rose-700">{message || text.redirecting}</p>
          )}
        </section>
      </div>
    </main>
  );
}
