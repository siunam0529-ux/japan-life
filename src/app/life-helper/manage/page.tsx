"use client";

import type { User } from "@supabase/supabase-js";
import { ArrowLeft, BriefcaseBusiness, CheckCircle2, ExternalLink, Handshake, Inbox, Plus, UserRoundCheck } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useLanguage } from "@/hooks/useLanguage";
import { clearLifeHelperPreloadCache, getCachedLifeHelperData, warmLifeHelperData } from "@/lib/appPreload";
import { updateLifeHelperRequestStatus } from "@/lib/lifeHelper/api";
import { getLifeHelperJoinStatusLabel, type LifeHelperBusinessApplication, type LifeHelperPersonalApplication } from "@/lib/lifeHelper/join";
import { getLifeHelperApplicationStatusLabel, getLifeHelperCategoryLabel, type LifeHelperApplication, type LifeHelperRequest, type LifeHelperRequestStatus } from "@/lib/lifeHelper/types";
import type { Language } from "@/lib/i18n/translations";
import { withBackFrom } from "@/lib/navigation/back";
import { supabase } from "@/lib/supabase";

type ManageTab = "requests" | "applications" | "services";

const zhCnManageCopy = {
  back: "返回",
  badge: "生活帮手",
  loading: "正在读取你的生活帮手管理数据...",
  loadFail: "管理数据读取失败。",
  loginTitle: "管理发布需求和服务",
  loginDesc: "登录后可以管理你发布的需求、申请记录和服务入驻状态。",
  login: "去登录",
  eyebrow: "Manage",
  title: "管理发布需求和服务",
  desc: "集中查看你的需求、申请和服务入驻状态。",
  statRequests: "发布需求",
  statReceived: "收到申请",
  statServices: "服务申请",
  publishRequest: "发布需求",
  manageServices: "管理服务",
  requestClosed: "需求已关闭。",
  requestReopened: "需求已重新开放。",
  requestUpdateFail: "需求状态更新失败。",
  tabRequests: "我的需求",
  tabApplications: "我的申请",
  tabServices: "服务入驻",
  emptyRequests: "你还没有发布过需求。",
  emptyApplications: "你还没有申请过别人的需求。",
  emptyServices: "你还没有提交服务入驻申请。",
  recruiting: "招募中",
  closed: "已关闭",
  receivedCount: (count: number) => "收到 " + count + " 个申请",
  viewDetail: "查看详情",
  closeRequest: "关闭需求",
  reopenRequest: "重新开放",
  deletedRequest: "需求可能已经删除",
  viewRequest: "查看需求",
  businessService: "商家服务",
  personalHelper: "个人帮手",
} as const;

const manageCopy = { "zh-CN": zhCnManageCopy, "zh-TW": zhCnManageCopy, ja: zhCnManageCopy } as const;

type ManageText = (typeof manageCopy)[Language];

export default function LifeHelperManagePage() {
  const { language } = useLanguage();
  const text = manageCopy[language];
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<ManageTab>("requests");
  const [applications, setApplications] = useState<LifeHelperApplication[]>([]);
  const [authChecked, setAuthChecked] = useState(false);
  const [businessApplications, setBusinessApplications] = useState<LifeHelperBusinessApplication[]>([]);
  const [helperApplications, setHelperApplications] = useState<LifeHelperPersonalApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [requests, setRequests] = useState<LifeHelperRequest[]>([]);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    setActiveTab(normalizeManageTab(searchParams.get("tab")));
  }, [searchParams]);

  const applyCachedLifeHelperData = useCallback(() => {
    const cached = getCachedLifeHelperData();
    if (!cached) return;
    setRequests(cached.requests);
    setApplications(cached.applications);
    setBusinessApplications(cached.businessApplications);
    setHelperApplications(cached.helpers);
    setLoading(false);
  }, []);

  const loadData = useCallback(async () => {
    if (!getCachedLifeHelperData()) setLoading(true);
    setMessage("");
    try {
      const nextData = await warmLifeHelperData();
      setRequests(nextData.requests);
      setApplications(nextData.applications);
      setBusinessApplications(nextData.businessApplications);
      setHelperApplications(nextData.helpers);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : text.loadFail);
    } finally {
      setLoading(false);
    }
  }, [text.loadFail]);

  useEffect(() => {
    if (!supabase) {
      setAuthChecked(true);
      setLoading(false);
      return;
    }

    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      const nextUser = data.session?.user ?? null;
      setUser(nextUser);
      setAuthChecked(true);
      if (nextUser) {
        applyCachedLifeHelperData();
        void loadData();
      }
      else setLoading(false);
    }).catch(() => {
      if (!mounted) return;
      setAuthChecked(true);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      const nextUser = session?.user ?? null;
      setUser(nextUser);
      setAuthChecked(true);
      if (nextUser) {
        applyCachedLifeHelperData();
        void loadData();
      }
      else {
        setRequests([]);
        setApplications([]);
        setBusinessApplications([]);
        setHelperApplications([]);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, [applyCachedLifeHelperData, loadData]);

  const userId = user?.id ?? "";
  const myRequests = useMemo(() => requests.filter((request) => request.authorId === userId), [requests, userId]);
  const myApplications = useMemo(() => applications.filter((application) => application.applicantId === userId), [applications, userId]);
  const myBusinessApplications = useMemo(() => businessApplications.filter((item) => item.userId === userId), [businessApplications, userId]);
  const myHelperApplications = useMemo(() => helperApplications.filter((item) => item.userId === userId), [helperApplications, userId]);
  const receivedApplicationCount = useMemo(() => {
    const myRequestIds = new Set(myRequests.map((request) => request.id));
    return applications.filter((application) => myRequestIds.has(application.requestId)).length;
  }, [applications, myRequests]);

  async function patchRequestStatus(requestId: string, status: LifeHelperRequestStatus) {
    try {
      const updated = await updateLifeHelperRequestStatus(requestId, status);
      setRequests((current) => current.map((request) => request.id === updated.id ? updated : request));
      clearLifeHelperPreloadCache();
      setMessage(status === "closed" ? text.requestClosed : text.requestReopened);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : text.requestUpdateFail);
    }
  }

  if (!authChecked || loading) {
    return (
      <main className="jl-tool-theme min-h-screen text-[#061a3a]">
        <Shell>
          <Header text={text} />
          <EmptyPanel text={text.loading} />
        </Shell>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="jl-tool-theme min-h-screen text-[#061a3a]">
        <Shell>
          <Header text={text} />
          <section className="rounded-[28px] border border-white/80 bg-white/88 p-5 shadow-[0_18px_40px_rgba(37,99,235,0.12)]">
            <h1 className="text-2xl font-black">{text.loginTitle}</h1>
            <p className="mt-2 text-sm font-bold leading-6 text-slate-600">{text.loginDesc}</p>
            <Link className="mt-4 flex h-11 items-center justify-center rounded-2xl bg-[#2563EB] text-sm font-black text-white" href={withBackFrom("/login?next=/life-helper/manage")}>
              {text.login}
            </Link>
          </section>
        </Shell>
      </main>
    );
  }

  return (
    <main className="jl-tool-theme min-h-screen text-[#061a3a]">
      <Shell>
        <Header text={text} />

        <section className="rounded-[28px] border border-white/80 bg-white/88 p-5 shadow-[0_18px_40px_rgba(37,99,235,0.12)] backdrop-blur">
          <p className="text-xs font-black text-[#2563EB]">{text.eyebrow}</p>
          <h1 className="mt-1 text-2xl font-black leading-tight">{text.title}</h1>
          <p className="mt-2 text-sm font-bold leading-6 text-slate-600">{text.desc}</p>
          <div className="mt-4 grid grid-cols-3 gap-2">
            <Stat label={text.statRequests} value={myRequests.length} />
            <Stat label={text.statReceived} value={receivedApplicationCount} />
            <Stat label={text.statServices} value={myBusinessApplications.length + myHelperApplications.length} />
          </div>
        </section>

        <section className="grid grid-cols-2 gap-2">
          <Link className="flex h-11 items-center justify-center gap-2 rounded-2xl bg-[#2563EB] text-sm font-black text-white shadow-[0_12px_24px_rgba(37,99,235,0.22)]" href="/life-helper">
            <Plus className="h-4 w-4" />
            {text.publishRequest}
          </Link>
          <Link className="flex h-11 items-center justify-center gap-2 rounded-2xl bg-white/88 text-sm font-black text-[#2563EB] shadow-sm ring-1 ring-blue-100" href="/life-helper/join">
            <Handshake className="h-4 w-4" />
            {text.manageServices}
          </Link>
        </section>

        {message ? <p className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-xs font-black text-[#1D4ED8]">{message}</p> : null}

        <section className="rounded-[24px] bg-white/88 p-1 shadow-[0_12px_28px_rgba(37,99,235,0.08)] ring-1 ring-white/80">
          <div className="grid grid-cols-3 gap-1">
            <TabButton active={activeTab === "requests"} label={text.tabRequests} onClick={() => setActiveTab("requests")} />
            <TabButton active={activeTab === "applications"} label={text.tabApplications} onClick={() => setActiveTab("applications")} />
            <TabButton active={activeTab === "services"} label={text.tabServices} onClick={() => setActiveTab("services")} />
          </div>
        </section>

        {activeTab === "requests" ? (
          <section className="grid gap-3">
            {myRequests.length === 0 ? <EmptyPanel text={text.emptyRequests} /> : null}
            {myRequests.map((request) => {
              const received = applications.filter((application) => application.requestId === request.id);
              return (
                <article className="rounded-[26px] border border-white/80 bg-white/90 p-4 shadow-[0_14px_32px_rgba(37,99,235,0.09)]" key={request.id}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-[#1D4ED8] ring-1 ring-blue-100">{getLifeHelperCategoryLabel(request.category, language)}</span>
                      <h2 className="mt-3 break-words text-lg font-black leading-6">{request.title}</h2>
                      <p className="mt-1 text-xs font-bold text-slate-500">{request.area} / {request.createdAt}</p>
                    </div>
                    <StatusPill active={request.status === "open"} label={request.status === "open" ? text.recruiting : text.closed} />
                  </div>
                  <p className="mt-3 text-sm font-bold leading-6 text-slate-600 line-clamp-2">{request.description}</p>
                  <p className="mt-3 text-xs font-black text-[#2563EB]">{text.receivedCount(received.length)}</p>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <Link className="flex h-10 items-center justify-center gap-2 rounded-2xl bg-[#2563EB] text-xs font-black text-white" href={`/life-helper/${request.id}`}>
                      <ExternalLink className="h-4 w-4" />
                      {text.viewDetail}
                    </Link>
                    <button className="h-10 rounded-2xl border border-blue-200 bg-white text-xs font-black text-[#2563EB]" onClick={() => void patchRequestStatus(request.id, request.status === "open" ? "closed" : "open")} type="button">
                      {request.status === "open" ? text.closeRequest : text.reopenRequest}
                    </button>
                  </div>
                </article>
              );
            })}
          </section>
        ) : null}

        {activeTab === "applications" ? (
          <section className="grid gap-3">
            {myApplications.length === 0 ? <EmptyPanel text={text.emptyApplications} /> : null}
            {myApplications.map((application) => {
              const request = requests.find((item) => item.id === application.requestId);
              return (
                <article className="rounded-[26px] border border-white/80 bg-white/90 p-4 shadow-[0_14px_32px_rgba(37,99,235,0.09)]" key={application.id}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="break-words text-lg font-black leading-6">{request?.title ?? text.deletedRequest}</h2>
                      <p className="mt-1 text-xs font-bold text-slate-500">{application.createdAt}</p>
                    </div>
                    <StatusPill active={application.status === "accepted"} label={getLifeHelperApplicationStatusLabel(application.status, language)} />
                  </div>
                  <p className="mt-3 text-sm font-bold leading-6 text-slate-600 line-clamp-2">{application.message}</p>
                  {request ? (
                    <Link className="mt-3 flex h-10 items-center justify-center rounded-2xl bg-[#2563EB] text-xs font-black text-white" href={`/life-helper/${request.id}`}>
                      {text.viewRequest}
                    </Link>
                  ) : null}
                </article>
              );
            })}
          </section>
        ) : null}

        {activeTab === "services" ? (
          <section className="grid gap-3">
            {myBusinessApplications.length + myHelperApplications.length === 0 ? <EmptyPanel text={text.emptyServices} /> : null}
            {myBusinessApplications.map((application) => (
              <ServiceCard
                createdAt={application.createdAt}
                icon={<BriefcaseBusiness className="h-5 w-5" />}
                key={application.id}
                name={application.businessName}
                status={getLifeHelperJoinStatusLabel(application.status, language)}
                type={text.businessService}
              />
            ))}
            {myHelperApplications.map((application) => (
              <ServiceCard
                createdAt={application.createdAt}
                icon={<UserRoundCheck className="h-5 w-5" />}
                key={application.id}
                name={application.displayName}
                status={getLifeHelperJoinStatusLabel(application.status, language)}
                type={text.personalHelper}
              />
            ))}
          </section>
        ) : null}
      </Shell>
    </main>
  );
}

function normalizeManageTab(value: string | null): ManageTab {
  return value === "applications" || value === "services" ? value : "requests";
}

function Header({ text }: { text: ManageText }) {
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

function Shell({ children }: { children: ReactNode }) {
  return <div className="jl-tool-shell mx-auto flex min-h-screen w-full max-w-[430px] flex-col gap-4 px-4 pb-28 pt-5">{children}</div>;
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-blue-50/80 px-2 py-3 text-center ring-1 ring-blue-100">
      <p className="text-lg font-black text-[#061a3a]">{value}</p>
      <p className="mt-0.5 text-[11px] font-bold text-slate-500">{label}</p>
    </div>
  );
}

function TabButton({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button className={`h-10 rounded-[20px] text-xs font-black ${active ? "bg-[#2563EB] text-white shadow-[0_10px_20px_rgba(37,99,235,0.18)]" : "text-slate-600"}`} onClick={onClick} type="button">
      {label}
    </button>
  );
}

function StatusPill({ active, label }: { active: boolean; label: string }) {
  return <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-black ring-1 ${active ? "bg-emerald-50 text-emerald-700 ring-emerald-100" : "bg-slate-50 text-slate-600 ring-slate-200"}`}>{label}</span>;
}

function ServiceCard({ createdAt, icon, name, status, type }: { createdAt: string; icon: ReactNode; name: string; status: string; type: string }) {
  return (
    <article className="rounded-[26px] border border-white/80 bg-white/90 p-4 shadow-[0_14px_32px_rgba(37,99,235,0.09)]">
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-50 text-[#2563EB] ring-1 ring-blue-100">{icon}</span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-black text-[#2563EB]">{type}</p>
          <h2 className="mt-1 break-words text-lg font-black leading-6">{name}</h2>
          <p className="mt-1 text-xs font-bold text-slate-500">{createdAt}</p>
          <p className="mt-3 inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-[#1D4ED8] ring-1 ring-blue-100">
            <CheckCircle2 className="h-3.5 w-3.5" />
            {status}
          </p>
        </div>
      </div>
    </article>
  );
}

function EmptyPanel({ text }: { text: string }) {
  return (
    <section className="rounded-[26px] border border-white/80 bg-white/88 p-5 text-center text-sm font-bold leading-6 text-slate-500 shadow-[0_14px_32px_rgba(37,99,235,0.09)]">
      <Inbox className="mx-auto h-8 w-8 text-[#2563EB]" />
      <p className="mt-3">{text}</p>
    </section>
  );
}
