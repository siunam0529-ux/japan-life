"use client";

import type { User } from "@supabase/supabase-js";
import { Bell, Camera, ChevronRight, FileText, Heart, Info, Languages, LogIn, LogOut, MessageCircle, Settings, ShieldCheck, UserRound } from "lucide-react";
import Link from "next/link";
import { ChangeEvent, useEffect, useRef, useState } from "react";
import { BackButton } from "@/components/BackButton";
import { useLanguage } from "@/hooks/useLanguage";
import { supabase } from "@/lib/supabase";

const avatarStorageKey = "japan-life:user-avatar";

function getUserAvatarUrl(user: User | null) {
  const value = user?.user_metadata?.avatar_url;
  return typeof value === "string" ? value : "";
}

async function uploadAvatar(file: File) {
  const body = new FormData();
  body.append("file", file);
  body.append("folder", "avatars");
  const response = await fetch("/api/upload-public-image", { body, method: "POST" });
  const result = (await response.json().catch(() => null)) as { error?: string; publicUrl?: string } | null;
  if (!response.ok || !result?.publicUrl) throw new Error(result?.error || "头像上传失败");
  return result.publicUrl;
}

const copy = {
  "zh-CN": {
    accountCenter: "账号中心",
    accountLoggedIn: "已登录",
    accountLoggedOut: "登录后可管理头像和账号安全",
    favoriteSubtitle: "查看收藏的店铺、地区、App 和文章。",
    favoriteTitle: "我的收藏",
    footer: "生活设置、收藏、日历备注和提醒数据仍保存在当前浏览器本地。账号登录用于后续同步和个人化功能。",
    intro: "集中管理收藏、提醒中心、手机通知、本机数据和账号登录。",
    login: "登录 / 注册",
    logout: "退出登录",
    manageAccount: "账号与密码",
    title: "我的",
    uploadAvatar: "更换头像",
    actions: [
      { title: "关于 Japan Life", subtitle: "运营主体、产品说明和联系方式", icon: Info, href: "/about" },
      { title: "联系我们 / 反馈", subtitle: "店铺上架、合作、问题反馈", icon: MessageCircle, href: "/feedback" },
      { title: "隐私政策", subtitle: "localStorage、数据收集、通知和定位说明", icon: ShieldCheck, href: "/privacy" },
      { title: "使用条款", subtitle: "使用本服务前需要了解的规则", icon: FileText, href: "/terms" },
      { title: "免责声明", subtitle: "税金、签证、医疗、房租等信息仅供参考", icon: FileText, href: "/disclaimer" },
      { title: "语言与货币", subtitle: "在生活设置中调整语言、地区和默认货币", icon: Languages, href: "/onboarding" },
    ],
  },
  "zh-TW": {
    accountCenter: "帳號中心",
    accountLoggedIn: "已登入",
    accountLoggedOut: "登入後可管理頭像和帳號安全",
    favoriteSubtitle: "查看收藏的店鋪、地區、App 和文章。",
    favoriteTitle: "我的收藏",
    footer: "生活設定、收藏、日曆備註和提醒資料仍保存在目前瀏覽器本機。帳號登入用於後續同步和個人化功能。",
    intro: "集中管理收藏、提醒中心、手機通知、本機資料和帳號登入。",
    login: "登入 / 註冊",
    logout: "登出",
    manageAccount: "帳號與密碼",
    title: "我的",
    uploadAvatar: "更換頭像",
    actions: [
      { title: "關於 Japan Life", subtitle: "營運主體、產品說明和聯絡方式", icon: Info, href: "/about" },
      { title: "聯絡我們 / 回饋", subtitle: "店鋪上架、合作、問題回饋", icon: MessageCircle, href: "/feedback" },
      { title: "隱私政策", subtitle: "localStorage、資料收集、通知和定位說明", icon: ShieldCheck, href: "/privacy" },
      { title: "使用條款", subtitle: "使用本服務前需要了解的規則", icon: FileText, href: "/terms" },
      { title: "免責聲明", subtitle: "稅金、簽證、醫療、房租等資訊僅供參考", icon: FileText, href: "/disclaimer" },
      { title: "語言與貨幣", subtitle: "在生活設定中調整語言、地區和預設貨幣", icon: Languages, href: "/onboarding" },
    ],
  },
  ja: {
    accountCenter: "アカウント",
    accountLoggedIn: "ログイン中",
    accountLoggedOut: "ログインするとアイコンと安全設定を管理できます",
    favoriteSubtitle: "保存した店舗、エリア、アプリ、記事を確認できます。",
    favoriteTitle: "お気に入り",
    footer: "生活設定、保存項目、カレンダーメモ、リマインダーは引き続きこのブラウザに保存されます。ログインは今後の同期と個人化機能に使います。",
    intro: "お気に入り、リマインダー、通知、端末内データ、ログインを管理できます。",
    login: "ログイン / 登録",
    logout: "ログアウト",
    manageAccount: "アカウントとパスワード",
    title: "マイページ",
    uploadAvatar: "アイコン変更",
    actions: [
      { title: "Japan Life について", subtitle: "運営、サービス説明、連絡先", icon: Info, href: "/about" },
      { title: "お問い合わせ / フィードバック", subtitle: "店舗掲載、提携、問題報告", icon: MessageCircle, href: "/feedback" },
      { title: "プライバシーポリシー", subtitle: "localStorage、データ収集、通知、位置情報について", icon: ShieldCheck, href: "/privacy" },
      { title: "利用規約", subtitle: "サービス利用前に確認するルール", icon: FileText, href: "/terms" },
      { title: "免責事項", subtitle: "税金、ビザ、医療、家賃などは参考情報です", icon: FileText, href: "/disclaimer" },
      { title: "言語と通貨", subtitle: "生活設定で言語、地域、通貨を調整します", icon: Languages, href: "/onboarding" },
    ],
  },
} as const;

const settingsEntryCopy = {
  "zh-CN": { subtitle: "通知设置、数据备份、导入导出和本机数据管理", title: "App 设置" },
  "zh-TW": { subtitle: "通知設定、資料備份、匯入匯出和本機資料管理", title: "App 設定" },
  ja: { subtitle: "通知設定、データバックアップ、読み込み、端末内データ管理", title: "App 設定" },
} as const;

const remindersEntryCopy = {
  "zh-CN": { subtitle: "查看垃圾日、缴费、节日和自定义提醒", title: "提醒中心" },
  "zh-TW": { subtitle: "查看垃圾日、繳費、節日和自訂提醒", title: "提醒中心" },
  ja: { subtitle: "ごみ、支払い、祝日、カスタム通知を確認", title: "リマインダー" },
} as const;

const actionIconTones = [
  "bg-sky-50 text-[#2563EB]",
  "bg-pink-50 text-[#F472B6]",
  "bg-emerald-50 text-[#22C55E]",
  "bg-violet-50 text-[#8B5CF6]",
  "bg-orange-50 text-[#F97316]",
  "bg-cyan-50 text-cyan-600",
] as const;

export default function MePage() {
  const { language } = useLanguage();
  const text = copy[language];
  const settingsEntry = settingsEntryCopy[language];
  const remindersEntry = remindersEntryCopy[language];
  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [avatarUrl, setAvatarUrl] = useState("");
  const [avatarMessage, setAvatarMessage] = useState("");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  useEffect(() => {
    setAvatarUrl(window.localStorage.getItem(avatarStorageKey) ?? "");
    if (!supabase) return;

    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      const nextUser = data.session?.user ?? null;
      setUser(nextUser);
      setAvatarUrl(getUserAvatarUrl(nextUser) || window.localStorage.getItem(avatarStorageKey) || "");
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      const nextUser = session?.user ?? null;
      setUser(nextUser);
      setAvatarUrl(getUserAvatarUrl(nextUser) || window.localStorage.getItem(avatarStorageKey) || "");
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const handleAvatarChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (event.target) event.target.value = "";
    if (!file || !supabase || !user) return;
    setUploadingAvatar(true);
    setAvatarMessage("");
    try {
      const publicUrl = await uploadAvatar(file);
      const { data, error } = await supabase.auth.updateUser({ data: { avatar_url: publicUrl } });
      if (error) throw error;
      window.localStorage.setItem(avatarStorageKey, publicUrl);
      setAvatarUrl(publicUrl);
      setUser(data.user);
      setAvatarMessage("头像已更新");
    } catch (error) {
      setAvatarMessage(error instanceof Error ? error.message : "头像上传失败");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const logout = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <main className="min-h-screen bg-[#F6FAFF] text-[#0F172A]">
      <div className="mx-auto flex min-h-screen w-full max-w-[430px] flex-col gap-5 bg-[#F6FAFF] px-4 pb-10 pt-5">
        <header className="flex items-center justify-between">
          <BackButton variant="icon" />
          <span className="rounded-full bg-white px-4 py-2 text-sm font-black text-emerald-700 shadow-sm">Japan Life</span>
        </header>

        <section className="rounded-[30px] bg-emerald-800 p-5 text-white shadow-[0_18px_45px_rgba(18,93,70,0.25)]">
          <div className="flex items-start gap-4">
            <button className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-[28px] bg-white/15 ring-1 ring-white/30" disabled={!user} onClick={() => avatarInputRef.current?.click()} type="button">
              {avatarUrl ? <img alt="" className="h-full w-full object-cover" src={avatarUrl} /> : <UserRound className="h-9 w-9 text-emerald-50" />}
              {user && (
                <span className="absolute bottom-1 right-1 flex h-7 w-7 items-center justify-center rounded-full bg-white text-emerald-800 shadow-sm">
                  <Camera className="h-3.5 w-3.5" />
                </span>
              )}
            </button>
            <input ref={avatarInputRef} accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleAvatarChange} type="file" />

            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-emerald-100">{text.accountCenter}</p>
              <h1 className="mt-1 text-3xl font-black tracking-tight">{text.title}</h1>
              <p className="mt-2 truncate text-sm font-semibold text-emerald-50">{user ? user.email : text.accountLoggedOut}</p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            {user ? (
              <>
                <Link className="rounded-2xl bg-white px-3 py-3 text-center text-xs font-black text-emerald-800" href="/account">
                  {text.manageAccount}
                </Link>
                <button className="rounded-2xl bg-white/15 px-3 py-3 text-xs font-black text-white ring-1 ring-white/25" onClick={logout} type="button">
                  {text.logout}
                </button>
              </>
            ) : (
              <Link className="col-span-2 flex items-center justify-center gap-2 rounded-2xl bg-white px-3 py-3 text-sm font-black text-emerald-800" href="/login?next=/me">
                <LogIn className="h-4 w-4" />
                {text.login}
              </Link>
            )}
          </div>
          <p className="mt-3 text-xs font-semibold leading-5 text-emerald-50">{text.intro}</p>
          {uploadingAvatar && <p className="mt-2 rounded-2xl bg-white/15 px-3 py-2 text-xs font-black text-white">头像上传中...</p>}
          {avatarMessage && <p className="mt-2 rounded-2xl bg-white/15 px-3 py-2 text-xs font-black text-white">{avatarMessage}</p>}
        </section>

        <section className="grid gap-2 rounded-[28px] border border-white/70 bg-white/80 p-2 shadow-[0_14px_40px_rgba(37,99,235,0.10)] backdrop-blur-xl">
          <Link href="/favorites" className="flex items-center gap-3 rounded-3xl bg-white p-4 shadow-[0_8px_24px_rgba(37,99,235,0.06)] transition hover:bg-sky-50/60">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
              <Heart className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="font-black">{text.favoriteTitle}</h2>
              <p className="text-sm font-bold text-stone-500">{text.favoriteSubtitle}</p>
            </div>
            <ChevronRight className="h-5 w-5 text-stone-400" />
          </Link>

          <Link href="/reminders" className="flex items-center gap-3 rounded-3xl bg-white p-4 shadow-[0_8px_24px_rgba(37,99,235,0.06)] transition hover:bg-sky-50/60">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-50 text-sky-700">
              <Bell className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="font-black">{remindersEntry.title}</h2>
              <p className="text-sm font-bold text-stone-500">{remindersEntry.subtitle}</p>
            </div>
            <ChevronRight className="h-5 w-5 text-stone-400" />
          </Link>

          <Link href="/me/settings" className="flex items-center gap-3 rounded-3xl bg-white p-4 shadow-[0_8px_24px_rgba(37,99,235,0.06)] transition hover:bg-sky-50/60">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-[#2563EB]">
              <Settings className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="font-black">{settingsEntry.title}</h2>
              <p className="text-sm font-bold text-stone-500">{settingsEntry.subtitle}</p>
            </div>
            <ChevronRight className="h-5 w-5 text-stone-400" />
          </Link>

          {text.actions.map((item, index) => {
            const Icon = item.icon;
            return (
              <Link key={item.title} href={item.href} className="flex items-center gap-3 rounded-3xl bg-white p-4 shadow-[0_8px_24px_rgba(37,99,235,0.06)] transition hover:bg-sky-50/60">
                <span className={`flex h-11 w-11 items-center justify-center rounded-2xl ${actionIconTones[index % actionIconTones.length]}`}>
                  <Icon className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <h2 className="font-black">{item.title}</h2>
                  <p className="text-sm font-bold text-stone-500">{item.subtitle}</p>
                </div>
                <ChevronRight className="h-5 w-5 text-stone-400" />
              </Link>
            );
          })}
        </section>

        <section className="rounded-[24px] bg-white/70 p-4 text-xs font-bold leading-5 text-stone-500">
          <Settings className="mb-2 h-4 w-4 text-emerald-700" />
          {text.footer}
        </section>
      </div>
    </main>
  );
}
