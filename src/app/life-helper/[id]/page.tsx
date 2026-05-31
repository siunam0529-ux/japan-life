"use client";

import type { User } from "@supabase/supabase-js";
import { ArrowLeft, CheckCircle2, Handshake, Info, LockKeyhole, MapPin, MessageCircle, Send, ShieldCheck, UserRoundCheck } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import { sampleLifeHelperRequests } from "@/lib/lifeHelper/data";
import { createLifeHelperId, readLifeHelperApplications, readLifeHelperRequests, writeLifeHelperApplications } from "@/lib/lifeHelper/storage";
import { getContactVisibilityLabel, getLifeHelperCategoryLabel, type LifeHelperApplication, type LifeHelperRequest } from "@/lib/lifeHelper/types";
import { supabase } from "@/lib/supabase";

const displayNameStorageKey = "japan-life:user-display-name";
const defaultApplicationMessage = "你好，我可以帮忙。时间和费用可以再商量。";

function getUserDisplayName(user: User | null) {
  const metadata = user?.user_metadata;
  const value = metadata?.display_name ?? metadata?.full_name ?? metadata?.name;
  if (typeof value === "string" && value.trim()) return value.trim();
  if (typeof window !== "undefined") {
    const saved = window.localStorage.getItem(displayNameStorageKey);
    if (saved?.trim()) return saved.trim();
  }
  return user?.email?.split("@")[0] || "Japan Life 用户";
}

function formatNow() {
  return new Intl.DateTimeFormat("zh-CN", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "2-digit",
  }).format(new Date());
}

export default function LifeHelperDetailPage() {
  const params = useParams<{ id: string }>();
  const requestId = decodeURIComponent(params.id);
  const [applications, setApplications] = useState<LifeHelperApplication[]>([]);
  const [applicationContact, setApplicationContact] = useState("");
  const [applicationMessage, setApplicationMessage] = useState(defaultApplicationMessage);
  const [applicationName, setApplicationName] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [requests, setRequests] = useState<LifeHelperRequest[]>([]);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    setRequests(readLifeHelperRequests());
    setApplications(readLifeHelperApplications());
    if (!supabase) return;

    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (mounted) setUser(data.session?.user ?? null);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) setUser(session?.user ?? null);
    });
    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const allRequests = useMemo(() => [...requests, ...sampleLifeHelperRequests], [requests]);
  const request = allRequests.find((item) => item.id === requestId);
  const requestApplications = applications.filter((application) => application.requestId === requestId);
  const mine = Boolean(user && request?.authorId === user.id);
  const myApplication = user ? applications.find((application) => application.requestId === requestId && application.applicantId === user.id) : undefined;
  const canSeeContact = Boolean(request && (request.contactVisibility === "public" || mine || (request.contactVisibility === "after_apply" && myApplication)));
  const canSubmit = applicationContact.trim() && applicationMessage.trim();

  function openApplicationForm() {
    if (!user) {
      setMessage("请先登录后再使用生活帮手功能。");
      return;
    }
    if (mine) {
      setMessage("这是你发布的需求，可以在本页查看收到的申请。");
      return;
    }
    if (myApplication) {
      setMessage("你已经发送过申请。");
      return;
    }
    setMessage("");
    setApplicationName(getUserDisplayName(user));
    setFormOpen(true);
  }

  function submitApplication(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user || !request || !canSubmit || mine || myApplication) return;
    const nextApplication: LifeHelperApplication = {
      id: createLifeHelperId("application"),
      applicantId: user.id,
      applicantName: applicationName.trim() || getUserDisplayName(user),
      contact: applicationContact.trim(),
      createdAt: formatNow(),
      message: applicationMessage.trim(),
      requestId: request.id,
      status: "sent",
    };
    const nextApplications = [nextApplication, ...applications].slice(0, 120);
    setApplications(nextApplications);
    writeLifeHelperApplications(nextApplications);
    setFormOpen(false);
    setMessage("已发送申请，发布者可以看到你的留言和联系方式。");
  }

  if (!request) {
    return (
      <main className="jl-tool-theme min-h-screen text-[#061a3a]">
        <div className="jl-tool-shell mx-auto flex min-h-screen w-full max-w-[430px] flex-col gap-4 px-4 pb-28 pt-5">
          <Header />
          <section className="rounded-[28px] border border-white/80 bg-white/85 p-5 shadow-[0_18px_40px_rgba(37,99,235,0.12)]">
            <h1 className="text-2xl font-black">没有找到这个需求</h1>
            <p className="mt-2 text-sm font-bold leading-6 text-slate-600">可能是本地数据被清理，或者这个需求已经不存在。</p>
            <Link className="mt-4 flex h-11 items-center justify-center rounded-2xl bg-[#2563EB] text-sm font-black text-white" href="/life-helper">回到生活帮手</Link>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="jl-tool-theme min-h-screen text-[#061a3a]">
      <div className="jl-tool-shell mx-auto flex min-h-screen w-full max-w-[430px] flex-col gap-4 px-4 pb-32 pt-5">
        <Header />

        <section className="rounded-[28px] border border-white/80 bg-white/90 p-5 shadow-[0_18px_40px_rgba(37,99,235,0.12)] backdrop-blur">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-[#1D4ED8] ring-1 ring-blue-100">{getLifeHelperCategoryLabel(request.category)}</span>
            <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-slate-600 ring-1 ring-blue-100">{request.status === "open" ? "募集中" : "已关闭"}</span>
            {request.source === "sample" ? <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-black text-amber-700 ring-1 ring-amber-100">本地示例</span> : null}
          </div>
          <h1 className="mt-4 break-words text-2xl font-black leading-tight">{request.title}</h1>
          <p className="mt-3 flex items-center gap-1 text-sm font-black text-[#2563EB]">
            <MapPin className="h-4 w-4" />
            {request.area}
          </p>
          <div className="mt-4 grid grid-cols-2 gap-2 text-xs font-black text-slate-700">
            <InfoPill label="预算" value={request.budget} />
            <InfoPill label="希望时间" value={request.preferredTime} />
            <InfoPill label="发布者" value={request.authorName} />
            <InfoPill label="发布时间" value={request.createdAt} />
          </div>
        </section>

        <section className="rounded-[26px] border border-white/80 bg-white/90 p-4 shadow-[0_14px_32px_rgba(37,99,235,0.09)]">
          <h2 className="text-lg font-black">详细说明</h2>
          <p className="mt-3 whitespace-pre-wrap text-sm font-bold leading-7 text-slate-600">{request.description}</p>
        </section>

        <section className="rounded-[26px] border border-white/80 bg-white/90 p-4 shadow-[0_14px_32px_rgba(37,99,235,0.09)]">
          <div className="flex items-center gap-2 text-sm font-black text-[#1D4ED8]">
            <LockKeyhole className="h-4 w-4" />
            联系方式
          </div>
          <p className="mt-2 text-xs font-bold leading-5 text-slate-500">可见规则：{getContactVisibilityLabel(request.contactVisibility)}</p>
          {canSeeContact && request.contact ? (
            <p className="mt-3 rounded-2xl bg-blue-50 px-3 py-2 text-sm font-black text-[#2563EB] ring-1 ring-blue-100">{request.contact}</p>
          ) : (
            <p className="mt-3 rounded-2xl bg-slate-50 px-3 py-2 text-xs font-bold leading-5 text-slate-500">联系方式暂不公开。发送申请后，发布者可以看到你的留言和联系方式。</p>
          )}
        </section>

        {message ? <p className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-xs font-black leading-5 text-[#1D4ED8]">{message} {!user ? <Link className="underline" href={`/login?next=/life-helper/${request.id}`}>去登录</Link> : null}</p> : null}

        {formOpen ? (
          <form className="rounded-[26px] border border-blue-100 bg-blue-50/80 p-4 shadow-sm" onSubmit={submitApplication}>
            <div className="flex items-center gap-2 text-sm font-black text-[#1D4ED8]">
              <MessageCircle className="h-4 w-4" />
              申请联系
            </div>
            <div className="mt-3 grid gap-3">
              <TextInput label="称呼（可选）" onChange={setApplicationName} placeholder="例如：小南" value={applicationName} />
              <label className="grid gap-1.5">
                <span className="text-xs font-black text-slate-500">留言</span>
                <textarea className="min-h-24 resize-none rounded-2xl border border-blue-100 bg-white px-4 py-3 text-sm font-bold outline-none focus:border-blue-400" onChange={(event) => setApplicationMessage(event.target.value)} placeholder={defaultApplicationMessage} value={applicationMessage} />
              </label>
              <TextInput label="我的联系方式" onChange={setApplicationContact} placeholder="LINE ID / 邮箱 / 电话 / 其他" value={applicationContact} />
              <SafetyNotice compact />
              <button className="flex h-11 items-center justify-center gap-2 rounded-2xl bg-[#2563EB] text-sm font-black text-white disabled:cursor-not-allowed disabled:bg-slate-300" disabled={!canSubmit} type="submit">
                <Send className="h-4 w-4" />
                发送申请
              </button>
            </div>
          </form>
        ) : null}

        {mine ? (
          <section className="rounded-[26px] border border-white/80 bg-white/90 p-4 shadow-[0_14px_32px_rgba(37,99,235,0.09)]">
            <h2 className="text-lg font-black">收到的申请</h2>
            <div className="mt-3 grid gap-2">
              {requestApplications.length === 0 ? (
                <p className="rounded-2xl bg-blue-50/70 p-3 text-xs font-bold text-slate-500 ring-1 ring-blue-100">还没有人申请这个需求。</p>
              ) : (
                requestApplications.map((application) => (
                  <article className="rounded-2xl bg-blue-50/70 p-3 text-xs font-bold leading-5 text-slate-600 ring-1 ring-blue-100" key={application.id}>
                    <p className="font-black text-slate-900">{application.applicantName} / {application.createdAt}</p>
                    <p className="mt-1">{application.message}</p>
                    <p className="mt-1 text-[#2563EB]">联系方式：{application.contact}</p>
                  </article>
                ))
              )}
            </div>
          </section>
        ) : null}

        <SafetyNotice />
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-[430px] bg-gradient-to-t from-[#f6faff] via-[#f6faff]/95 to-transparent px-4 pb-4 pt-6">
        <button className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#2563EB] text-sm font-black text-white shadow-[0_16px_30px_rgba(37,99,235,0.24)] disabled:bg-slate-300" disabled={mine || Boolean(myApplication)} onClick={openApplicationForm} type="button">
          <UserRoundCheck className="h-4 w-4" />
          {mine ? "这是你发布的需求" : myApplication ? "已发送申请" : "我可以帮忙"}
        </button>
      </div>
    </main>
  );
}

function Header() {
  return (
    <div className="flex items-center justify-between">
      <Link className="inline-flex h-9 items-center gap-2 rounded-full bg-white/85 px-4 text-sm font-black text-[#2563EB] shadow-sm ring-1 ring-blue-100" href="/life-helper">
        <ArrowLeft className="h-4 w-4" />
        返回
      </Link>
      <span className="inline-flex items-center gap-1 rounded-full bg-white/85 px-4 py-2 text-xs font-black text-[#2563EB] shadow-sm ring-1 ring-blue-100">
        <Handshake className="h-3.5 w-3.5" />
        生活帮手
      </span>
    </div>
  );
}

function InfoPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-2xl bg-blue-50/80 px-3 py-2 ring-1 ring-blue-100">
      <p className="text-[10px] text-slate-500">{label}</p>
      <p className="truncate">{value}</p>
    </div>
  );
}

function TextInput({ label, onChange, placeholder, value }: { label: string; onChange: (value: string) => void; placeholder: string; value: string }) {
  return (
    <label className="grid gap-1.5">
      <span className="text-xs font-black text-slate-500">{label}</span>
      <input className="h-11 min-w-0 rounded-2xl border border-blue-100 bg-white px-4 text-sm font-bold outline-none focus:border-blue-400" onChange={(event) => onChange(event.target.value)} placeholder={placeholder} value={value} />
    </label>
  );
}

function SafetyNotice({ compact = false }: { compact?: boolean }) {
  return (
    <section className={`${compact ? "rounded-2xl bg-white/85 p-3" : "rounded-[26px] border border-blue-100 bg-white/85 p-4 shadow-[0_14px_32px_rgba(37,99,235,0.08)]"} text-xs font-bold leading-5 text-slate-600`}>
      <div className="flex items-center gap-2 text-sm font-black text-[#1D4ED8]">
        <ShieldCheck className="h-5 w-5" />
        隐私和安全提示
      </div>
      <ul className="mt-3 space-y-2">
        <li className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#2563EB]" />请不要提前支付大额费用。</li>
        <li className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#2563EB]" />见面建议选择公共场所。</li>
        <li className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#2563EB]" />涉及宠物、钥匙、房间进入等事项，请提前确认身份和细节。</li>
        <li className="flex gap-2"><Info className="mt-0.5 h-4 w-4 shrink-0 text-[#2563EB]" />平台仅提供信息匹配，请自行判断风险。</li>
      </ul>
    </section>
  );
}
