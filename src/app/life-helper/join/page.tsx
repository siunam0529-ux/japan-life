"use client";

import type { User } from "@supabase/supabase-js";
import { ArrowLeft, BriefcaseBusiness, CheckCircle2, Handshake, ShieldCheck, UserRoundCheck } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useLanguage } from "@/hooks/useLanguage";
import { fetchLifeHelperJoinApplications } from "@/lib/lifeHelper/api";
import { getLifeHelperJoinStatusLabel, type LifeHelperBusinessApplication, type LifeHelperPersonalApplication } from "@/lib/lifeHelper/join";
import { withBackFrom } from "@/lib/navigation/back";
import { supabase } from "@/lib/supabase";

const zhCnJoinCopy = {
  back: "返回",
  badge: "生活帮手",
  title: "成为生活帮手",
  subtitle: "选择你的服务类型，提交后进入审核。通过后会展示在生活帮手列表中。",
  businessType: "商家入驻",
  helperType: "个人帮手",
  businessTitle: "商家 / 公司入驻",
  businessBody: "适合清洁公司、搬家公司、宠物服务、维修店、翻译公司等正式服务商。",
  businessButton: "申请商家入驻",
  helperTitle: "个人帮手入驻",
  helperBody: "适合附近个人、兼职、留学生、自由职业者，提供跑腿、陪同、宠物照顾等服务。",
  helperButton: "申请成为帮手",
  myTitle: "我的生活帮手申请",
  loginHint: "请先登录后再提交入驻申请。",
  login: "去登录",
  empty: "你还没有提交过入驻申请。",
  status: "审核状态",
  noteTitle: "入驻说明",
  notes: ["请填写真实服务信息。", "平台会对入驻信息进行审核。", "请勿发布违法、虚假、骚扰或高风险服务。"],
} as const;

const joinCopy = { "zh-CN": zhCnJoinCopy, "zh-TW": zhCnJoinCopy, ja: zhCnJoinCopy } as const;

export default function LifeHelperJoinPage() {
  const { language } = useLanguage();
  const text = joinCopy[language];
  const [user, setUser] = useState<User | null>(null);
  const [businessApplications, setBusinessApplications] = useState<LifeHelperBusinessApplication[]>([]);
  const [personalApplications, setPersonalApplications] = useState<LifeHelperPersonalApplication[]>([]);

  useEffect(() => {
    if (!supabase) return;
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setUser(data.session?.user ?? null);
      if (data.session?.user) void loadJoinApplications();
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setUser(session?.user ?? null);
      if (session?.user) void loadJoinApplications();
      else {
        setBusinessApplications([]);
        setPersonalApplications([]);
      }
    });
    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  async function loadJoinApplications() {
    const data = await fetchLifeHelperJoinApplications().catch(() => ({ business: [], helpers: [] }));
    setBusinessApplications(data.business);
    setPersonalApplications(data.helpers);
  }

  const myApplications = useMemo(() => {
    if (!user) return [];
    return [
      ...businessApplications.filter((item) => item.userId === user.id).map((item) => ({ id: item.id, name: item.businessName, status: item.status, type: text.businessType })),
      ...personalApplications.filter((item) => item.userId === user.id).map((item) => ({ id: item.id, name: item.displayName, status: item.status, type: text.helperType })),
    ];
  }, [businessApplications, personalApplications, text.businessType, text.helperType, user]);

  return (
    <main className="jl-tool-theme min-h-screen text-[#061a3a]">
      <div className="jl-tool-shell mx-auto flex min-h-screen w-full max-w-[430px] flex-col gap-4 px-4 pb-24 pt-5">
        <Header />

        <section className="rounded-[28px] border border-white/80 bg-white/88 p-5 shadow-[0_18px_40px_rgba(37,99,235,0.12)] backdrop-blur">
          <p className="text-xs font-black text-[#2563EB]">Provider Join</p>
          <h1 className="mt-1 text-2xl font-black leading-tight">{text.title}</h1>
          <p className="mt-2 text-sm font-bold leading-6 text-slate-600">{text.subtitle}</p>
        </section>

        <section className="grid gap-3">
          <JoinCard body={text.businessBody} button={text.businessButton} href="/life-helper/join/business" icon={<BriefcaseBusiness className="h-6 w-6" />} title={text.businessTitle} />
          <JoinCard body={text.helperBody} button={text.helperButton} href="/life-helper/join/helper" icon={<UserRoundCheck className="h-6 w-6" />} title={text.helperTitle} />
        </section>

        <section className="rounded-[26px] border border-white/80 bg-white/88 p-4 shadow-[0_14px_32px_rgba(37,99,235,0.09)]">
          <div className="flex items-center gap-2 text-sm font-black text-[#1D4ED8]">
            <Handshake className="h-5 w-5" />
            {text.myTitle}
          </div>
          {!user ? (
            <p className="mt-3 rounded-2xl bg-blue-50/80 p-3 text-xs font-bold leading-5 text-slate-600 ring-1 ring-blue-100">
              {text.loginHint}
              <Link className="font-black text-[#2563EB] underline" href={withBackFrom("/login?next=/life-helper/join")}>{text.login}</Link>
            </p>
          ) : myApplications.length === 0 ? (
            <p className="mt-3 rounded-2xl bg-blue-50/80 p-3 text-xs font-bold leading-5 text-slate-600 ring-1 ring-blue-100">{text.empty}</p>
          ) : (
            <div className="mt-3 grid gap-2">
              {myApplications.map((item) => (
                <div className="rounded-2xl bg-blue-50/80 p-3 text-xs font-bold leading-5 text-slate-600 ring-1 ring-blue-100" key={item.id}>
                  <p className="font-black text-slate-900">{item.type} / {item.name}</p>
                  <p className="mt-1 text-[#2563EB]">{text.status}: {getLifeHelperJoinStatusLabel(item.status, language)}</p>
                </div>
              ))}
            </div>
          )}
        </section>

        <SafetyNotice noteTitle={text.noteTitle} notes={text.notes} />
      </div>
    </main>
  );
}

function Header() {
  const { language } = useLanguage();
  const text = joinCopy[language];
  return (
    <div className="flex items-center justify-between">
      <Link className="inline-flex h-9 items-center gap-2 rounded-full bg-white/85 px-4 text-sm font-black text-[#2563EB] shadow-sm ring-1 ring-blue-100" href="/life-helper">
        <ArrowLeft className="h-4 w-4" />
        {text.back}
      </Link>
      <span className="rounded-full bg-white/85 px-4 py-2 text-xs font-black text-[#2563EB] shadow-sm ring-1 ring-blue-100">{text.badge}</span>
    </div>
  );
}

function JoinCard({ body, button, href, icon, title }: { body: string; button: string; href: string; icon: React.ReactNode; title: string }) {
  return (
    <article className="rounded-[28px] border border-white/80 bg-white/88 p-5 shadow-[0_18px_40px_rgba(37,99,235,0.1)] backdrop-blur">
      <div className="flex items-start gap-3">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/80 text-[#2563EB] shadow-sm ring-1 ring-blue-100">{icon}</span>
        <div className="min-w-0">
          <h2 className="text-xl font-black">{title}</h2>
          <p className="mt-2 text-sm font-bold leading-6 text-slate-600">{body}</p>
        </div>
      </div>
      <Link className="mt-4 flex h-12 items-center justify-center rounded-full bg-[linear-gradient(135deg,#2563eb,#38bdf8)] text-sm font-black text-white shadow-[0_14px_26px_rgba(37,99,235,0.2)]" href={href}>
        {button}
      </Link>
    </article>
  );
}

function SafetyNotice({ noteTitle, notes }: { noteTitle: string; notes: readonly string[] }) {
  return (
    <section className="rounded-[26px] border border-blue-100 bg-white/85 p-4 text-xs font-bold leading-5 text-slate-600 shadow-[0_14px_32px_rgba(37,99,235,0.08)]">
      <div className="flex items-center gap-2 text-sm font-black text-[#1D4ED8]">
        <ShieldCheck className="h-5 w-5" />
        {noteTitle}
      </div>
      <ul className="mt-3 space-y-2">
        {notes.map((note) => <li className="flex gap-2" key={note}><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#2563EB]" />{note}</li>)}
      </ul>
    </section>
  );
}
