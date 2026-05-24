"use client";

import type { User } from "@supabase/supabase-js";
import { Bell, Camera, ChevronRight, FileText, Heart, Info, LogIn, LogOut, MessageCircle, Settings, ShieldCheck, UserRound } from "lucide-react";
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

const actionIconTones = [
  "bg-sky-50 text-[#2563EB]",
  "bg-pink-50 text-[#F472B6]",
  "bg-emerald-50 text-[#22C55E]",
  "bg-violet-50 text-[#8B5CF6]",
  "bg-orange-50 text-[#F97316]",
  "bg-cyan-50 text-cyan-600",
] as const;

const meCopy = {
  "zh-CN": {
    accountCenter: "账号中心",
    accountPassword: "账号与密码",
    accountNote: "账号说明",
    accountNoteBody: "不登录也能继续使用本机记录；登录后会自动同步收藏、提醒、设置、日历备注和头像。",
    avatarUpdated: "头像已更新",
    avatarUploadFailed: "头像上传失败",
    avatarUploading: "头像上传中...",
    footerNote: "不登录也可以继续使用本机功能；登录后会自动同步设置、收藏、日历备注和提醒数据。",
    login: "登录 / 注册",
    loginHint: "登录后可管理头像、账号安全和云同步",
    logout: "退出登录",
    title: "我的",
    mainLinks: [
      { title: "个人资料", subtitle: "语言、地区、货币、身份和在留到期日", icon: UserRound, iconClass: "bg-blue-50 text-[#2563EB]", href: "/onboarding" },
      { title: "我的收藏", subtitle: "查看收藏的店铺、地区、App 和文章", icon: Heart, iconClass: "bg-rose-50 text-rose-600", href: "/favorites" },
      { title: "待办中心", subtitle: "查看垃圾日、缴费、节日和自定义待办", icon: Bell, iconClass: "bg-sky-50 text-sky-700", href: "/reminders" },
      { title: "App 设置", subtitle: "通知设置、数据备份、导入导出和本机数据管理", icon: Settings, iconClass: "bg-blue-50 text-[#2563EB]", href: "/me/settings" },
    ],
    actions: [
      { title: "关于 Japan Life", subtitle: "运营主体、产品说明和联系方式", icon: Info, href: "/about" },
      { title: "联系 / 反馈", subtitle: "店铺上架、合作、问题反馈", icon: MessageCircle, href: "/feedback" },
      { title: "隐私政策", subtitle: "localStorage、数据收集、通知和定位说明", icon: ShieldCheck, href: "/privacy" },
      { title: "使用条款", subtitle: "使用本服务前需要了解的规则", icon: FileText, href: "/terms" },
      { title: "免责声明", subtitle: "税金、签证、医疗、房租等信息仅供参考", icon: FileText, href: "/disclaimer" },
    ],
  },
  "zh-TW": {
    accountCenter: "帳號中心",
    accountPassword: "帳號與密碼",
    accountNote: "帳號說明",
    accountNoteBody: "不登入也能繼續使用本機記錄；登入後會自動同步收藏、提醒、設定、日曆備註和頭像。",
    avatarUpdated: "頭像已更新",
    avatarUploadFailed: "頭像上傳失敗",
    avatarUploading: "頭像上傳中...",
    footerNote: "不登入也可以繼續使用本機功能；登入後會自動同步設定、收藏、日曆備註和提醒資料。",
    login: "登入 / 註冊",
    loginHint: "登入後可管理頭像、帳號安全和雲端同步",
    logout: "登出",
    title: "我的",
    mainLinks: [
      { title: "個人資料", subtitle: "語言、地區、貨幣、身份和在留到期日", icon: UserRound, iconClass: "bg-blue-50 text-[#2563EB]", href: "/onboarding" },
      { title: "我的收藏", subtitle: "查看收藏的店鋪、地區、App 和文章", icon: Heart, iconClass: "bg-rose-50 text-rose-600", href: "/favorites" },
      { title: "待辦中心", subtitle: "查看垃圾日、繳費、節日和自訂待辦", icon: Bell, iconClass: "bg-sky-50 text-sky-700", href: "/reminders" },
      { title: "App 設定", subtitle: "通知設定、資料備份、匯入匯出和本機資料管理", icon: Settings, iconClass: "bg-blue-50 text-[#2563EB]", href: "/me/settings" },
    ],
    actions: [
      { title: "關於 Japan Life", subtitle: "營運主體、產品說明和聯絡方式", icon: Info, href: "/about" },
      { title: "聯絡 / 回饋", subtitle: "店鋪上架、合作、問題回饋", icon: MessageCircle, href: "/feedback" },
      { title: "隱私政策", subtitle: "localStorage、資料收集、通知和定位說明", icon: ShieldCheck, href: "/privacy" },
      { title: "使用條款", subtitle: "使用本服務前需要了解的規則", icon: FileText, href: "/terms" },
      { title: "免責聲明", subtitle: "稅金、簽證、醫療、房租等資訊僅供參考", icon: FileText, href: "/disclaimer" },
    ],
  },
  ja: {
    accountCenter: "アカウント",
    accountPassword: "アカウントとパスワード",
    accountNote: "アカウントについて",
    accountNoteBody: "ログインしなくても端末内の記録は使えます。ログイン後は保存、リマインダー、設定、カレンダーメモ、アイコンを自動同期します。",
    avatarUpdated: "アイコンを更新しました",
    avatarUploadFailed: "アイコンのアップロードに失敗しました",
    avatarUploading: "アイコンをアップロード中...",
    footerNote: "ログインしなくても端末内の機能は使えます。ログイン後は設定、保存、カレンダーメモ、リマインダーを自動同期します。",
    login: "ログイン / 登録",
    loginHint: "ログインするとアイコン、アカウント安全、クラウド同期を管理できます",
    logout: "ログアウト",
    title: "マイページ",
    mainLinks: [
      { title: "個人情報", subtitle: "言語、地域、通貨、在留状況、在留期限", icon: UserRound, iconClass: "bg-blue-50 text-[#2563EB]", href: "/onboarding" },
      { title: "保存したもの", subtitle: "保存したお店、エリア、アプリ、記事を見る", icon: Heart, iconClass: "bg-rose-50 text-rose-600", href: "/favorites" },
      { title: "リマインダー", subtitle: "ごみの日、支払い、祝日、自分の予定を見る", icon: Bell, iconClass: "bg-sky-50 text-sky-700", href: "/reminders" },
      { title: "アプリ設定", subtitle: "通知、データバックアップ、インポート、端末データ管理", icon: Settings, iconClass: "bg-blue-50 text-[#2563EB]", href: "/me/settings" },
    ],
    actions: [
      { title: "Japan Life について", subtitle: "運営者、サービス説明、お問い合わせ", icon: Info, href: "/about" },
      { title: "連絡 / フィードバック", subtitle: "店舗掲載、提携、問題の連絡", icon: MessageCircle, href: "/feedback" },
      { title: "プライバシーポリシー", subtitle: "localStorage、データ収集、通知、位置情報について", icon: ShieldCheck, href: "/privacy" },
      { title: "利用規約", subtitle: "サービス利用前に確認するルール", icon: FileText, href: "/terms" },
      { title: "免責事項", subtitle: "税金、ビザ、医療、家賃などの情報は参考用です", icon: FileText, href: "/disclaimer" },
    ],
  },
} as const;

export default function MePage() {
  const { language } = useLanguage();
  const text = meCopy[language];
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
      setAvatarMessage(text.avatarUpdated);
    } catch (error) {
      setAvatarMessage(error instanceof Error ? error.message : text.avatarUploadFailed);
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
    <main className="me-page min-h-screen bg-[#F6FAFF] text-[#0F172A]">
      <div className="mx-auto flex min-h-screen w-full max-w-[430px] flex-col gap-5 bg-[#F6FAFF] px-4 pb-10 pt-5">
        <header className="flex items-center justify-between">
          <BackButton variant="icon" />
          <span className="rounded-full bg-white px-4 py-2 text-sm font-black text-[#2563EB] shadow-sm">Japan Life</span>
        </header>

        <section className="me-profile-card rounded-[30px] border border-slate-200 bg-white p-5 text-[#0F172A] shadow-[0_18px_45px_rgba(37,99,235,0.10)]">
          <div className="flex items-start gap-4">
            <button className="me-avatar-button relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-[28px] bg-white text-[#2563EB] ring-1 ring-white/80" disabled={!user} onClick={() => avatarInputRef.current?.click()} type="button">
              {avatarUrl ? <img alt="" className="h-full w-full object-cover" src={avatarUrl} /> : <UserRound className="h-9 w-9 text-[#2563EB]" />}
              {user && (
                <span className="absolute bottom-1 right-1 flex h-7 w-7 items-center justify-center rounded-full bg-white text-[#2563EB] shadow-sm">
                  <Camera className="h-3.5 w-3.5" />
                </span>
              )}
            </button>
            <input ref={avatarInputRef} accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleAvatarChange} type="file" />

            <div className="min-w-0 flex-1">
              <p className="text-sm font-black text-[#2563EB]">{text.accountCenter}</p>
              <h1 className="mt-1 text-3xl font-black tracking-tight text-[#0F172A]">{text.title}</h1>
              <p className="mt-2 truncate text-sm font-semibold text-[#475569]">{user ? user.email : text.loginHint}</p>
            </div>
          </div>

          <div className="me-profile-note mt-4 rounded-[22px] border border-blue-100 bg-blue-50 px-4 py-3">
            <p className="text-sm font-black leading-6 text-[#1D4ED8]">{text.accountNote}</p>
            <p className="mt-1 text-xs font-bold leading-5 text-[#475569]">{text.accountNoteBody}</p>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            {user ? (
              <>
                <Link className="rounded-2xl bg-white px-3 py-3 text-center text-xs font-black text-[#2563EB]" href="/account">
                  {text.accountPassword}
                </Link>
                <button className="rounded-2xl border border-slate-200 bg-white px-3 py-3 text-xs font-black text-[#334155] shadow-sm" onClick={logout} type="button">
                  <LogOut className="mr-1 inline h-4 w-4" />
                  {text.logout}
                </button>
              </>
            ) : (
              <Link className="col-span-2 flex items-center justify-center gap-2 rounded-2xl bg-white px-3 py-3 text-sm font-black text-[#2563EB]" href="/login?next=/me">
                <LogIn className="h-4 w-4" />
                {text.login}
              </Link>
            )}
          </div>
          {uploadingAvatar && <p className="mt-2 rounded-2xl border border-blue-100 bg-blue-50 px-3 py-2 text-xs font-black text-[#1D4ED8]">{text.avatarUploading}</p>}
          {avatarMessage && <p className="mt-2 rounded-2xl border border-blue-100 bg-blue-50 px-3 py-2 text-xs font-black text-[#1D4ED8]">{avatarMessage}</p>}
        </section>

        <section className="grid gap-2 rounded-[28px] border border-white/70 bg-white/80 p-2 shadow-[0_14px_40px_rgba(37,99,235,0.10)] backdrop-blur-xl">
          {text.mainLinks.map((item) => {
            const Icon = item.icon;
            return <MenuLink href={item.href} icon={<Icon className="h-5 w-5" />} iconClass={item.iconClass} key={item.href} subtitle={item.subtitle} title={item.title} />;
          })}

          {text.actions.map((item, index) => {
            const Icon = item.icon;
            return <MenuLink href={item.href} icon={<Icon className="h-5 w-5" />} iconClass={actionIconTones[index % actionIconTones.length]} key={item.title} subtitle={item.subtitle} title={item.title} />;
          })}
        </section>

        <section className="rounded-[24px] bg-white/70 p-4 text-xs font-bold leading-5 text-[#64748B]">
          <Settings className="mb-2 h-4 w-4 text-[#2563EB]" />
          {text.footerNote}
        </section>
      </div>
    </main>
  );
}

function MenuLink({ href, icon, iconClass, subtitle, title }: { href: string; icon: React.ReactNode; iconClass: string; subtitle: string; title: string }) {
  return (
    <Link href={href} className="me-menu-link flex items-center gap-3 rounded-3xl bg-white p-4 transition">
      <span className={`me-menu-icon flex h-11 w-11 items-center justify-center rounded-2xl ${iconClass}`}>{icon}</span>
      <div className="min-w-0 flex-1">
        <h2 className="font-black">{title}</h2>
        <p className="text-sm font-bold text-[#64748B]">{subtitle}</p>
      </div>
      <ChevronRight className="h-5 w-5 text-[#64748B]" />
    </Link>
  );
}
