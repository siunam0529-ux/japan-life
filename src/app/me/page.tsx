"use client";

import type { User } from "@supabase/supabase-js";
import { Bell, Camera, ChevronRight, FileText, Heart, Info, Languages, LogIn, LogOut, MessageCircle, Settings, ShieldCheck, UserRound } from "lucide-react";
import Link from "next/link";
import { ChangeEvent, useEffect, useRef, useState } from "react";
import { BackButton } from "@/components/BackButton";
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

const actions = [
  { title: "关于 Japan Life", subtitle: "运营主体、产品说明和联系方式", icon: Info, href: "/about" },
  { title: "联系 / 反馈", subtitle: "店铺上架、合作、问题反馈", icon: MessageCircle, href: "/feedback" },
  { title: "隐私政策", subtitle: "localStorage、数据收集、通知和定位说明", icon: ShieldCheck, href: "/privacy" },
  { title: "使用条款", subtitle: "使用本服务前需要了解的规则", icon: FileText, href: "/terms" },
  { title: "免责声明", subtitle: "税金、签证、医疗、房租等信息仅供参考", icon: FileText, href: "/disclaimer" },
  { title: "语言与货币", subtitle: "调整语言、地区和默认货币", icon: Languages, href: "/onboarding" },
];

export default function MePage() {
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
    <main className="me-page min-h-screen bg-[#F6FAFF] text-[#0F172A]">
      <div className="mx-auto flex min-h-screen w-full max-w-[430px] flex-col gap-5 bg-[#F6FAFF] px-4 pb-10 pt-5">
        <header className="flex items-center justify-between">
          <BackButton variant="icon" />
          <span className="rounded-full bg-white px-4 py-2 text-sm font-black text-[#2563EB] shadow-sm">Japan Life</span>
        </header>

        <section className="me-profile-card rounded-[30px] bg-[#2563EB] p-5 text-white shadow-[0_18px_45px_rgba(37,99,235,0.25)]">
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
              <p className="text-sm font-bold text-[#DBEAFE]">账号中心</p>
              <h1 className="mt-1 text-3xl font-black tracking-tight text-white">我的</h1>
              <p className="mt-2 truncate text-sm font-semibold text-[#EFF6FF]">{user ? user.email : "登录后可管理头像、账号安全和云同步"}</p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            {user ? (
              <>
                <Link className="rounded-2xl bg-white px-3 py-3 text-center text-xs font-black text-[#2563EB]" href="/account">
                  账号与密码
                </Link>
                <button className="rounded-2xl bg-white/15 px-3 py-3 text-xs font-black text-white ring-1 ring-white/25" onClick={logout} type="button">
                  <LogOut className="mr-1 inline h-4 w-4" />
                  退出登录
                </button>
              </>
            ) : (
              <Link className="col-span-2 flex items-center justify-center gap-2 rounded-2xl bg-white px-3 py-3 text-sm font-black text-[#2563EB]" href="/login?next=/me">
                <LogIn className="h-4 w-4" />
                登录 / 注册
              </Link>
            )}
          </div>
          <p className="mt-3 text-xs font-semibold leading-5 text-[#EFF6FF]">集中管理收藏、提醒、通知、本机数据、账号登录和云同步。</p>
          {uploadingAvatar && <p className="mt-2 rounded-2xl bg-white/15 px-3 py-2 text-xs font-black text-white">头像上传中...</p>}
          {avatarMessage && <p className="mt-2 rounded-2xl bg-white/15 px-3 py-2 text-xs font-black text-white">{avatarMessage}</p>}
        </section>

        <section className="grid gap-2 rounded-[28px] border border-white/70 bg-white/80 p-2 shadow-[0_14px_40px_rgba(37,99,235,0.10)] backdrop-blur-xl">
          <MenuLink href="/favorites" icon={<Heart className="h-5 w-5" />} iconClass="bg-rose-50 text-rose-600" subtitle="查看收藏的店铺、地区、App 和文章" title="我的收藏" />
          <MenuLink href="/reminders" icon={<Bell className="h-5 w-5" />} iconClass="bg-sky-50 text-sky-700" subtitle="查看垃圾日、缴费、节日和自定义待办" title="待办中心" />
          <MenuLink href="/me/settings" icon={<Settings className="h-5 w-5" />} iconClass="bg-blue-50 text-[#2563EB]" subtitle="通知设置、数据备份、导入导出和本机数据管理" title="App 设置" />

          {actions.map((item, index) => {
            const Icon = item.icon;
            return <MenuLink href={item.href} icon={<Icon className="h-5 w-5" />} iconClass={actionIconTones[index % actionIconTones.length]} key={item.title} subtitle={item.subtitle} title={item.title} />;
          })}
        </section>

        <section className="rounded-[24px] bg-white/70 p-4 text-xs font-bold leading-5 text-[#64748B]">
          <Settings className="mb-2 h-4 w-4 text-[#2563EB]" />
          不登录也可以继续使用本机功能；登录后会自动同步设置、收藏、日历备注和提醒数据。
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
