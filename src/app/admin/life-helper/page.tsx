"use client";

import { ArrowLeft, CheckCircle2, LifeBuoy, RefreshCw, ShieldCheck, XCircle } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  getLifeHelperJoinStatusLabel,
  type LifeHelperBusinessApplication,
  type LifeHelperJoinStatus,
  type LifeHelperPersonalApplication,
} from "@/lib/lifeHelper/join";
import { getLifeHelperCategoryLabel, type LifeHelperApplication, type LifeHelperApplicationStatus, type LifeHelperRequest, type LifeHelperRequestStatus } from "@/lib/lifeHelper/types";

type AdminTab = "requests" | "applications" | "business" | "helpers" | "risk";

const sessionKey = "japan-life-admin-auth";
const tabs: { id: AdminTab; label: string }[] = [
  { id: "requests", label: "帮忙需求" },
  { id: "applications", label: "申请联系" },
  { id: "business", label: "商家入驻" },
  { id: "helpers", label: "个人帮手" },
  { id: "risk", label: "举报风险" },
];

const riskWords = ["银行卡", "在留卡", "换汇", "黑工", "代收包裹", "高薪日结", "援交", "陪睡", "赌博", "毒品", "贷款", "信用卡套现", "出售账号", "假证"];

export default function AdminLifeHelperPage() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<AdminTab>("requests");
  const [applications, setApplications] = useState<LifeHelperApplication[]>([]);
  const [businessApplications, setBusinessApplications] = useState<LifeHelperBusinessApplication[]>([]);
  const [helperApplications, setHelperApplications] = useState<LifeHelperPersonalApplication[]>([]);
  const [loggedIn, setLoggedIn] = useState(false);
  const [message, setMessage] = useState("");
  const [password, setPassword] = useState("");
  const [requests, setRequests] = useState<LifeHelperRequest[]>([]);

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (isAdminTab(tab)) setActiveTab(tab);
  }, [searchParams]);

  useEffect(() => {
    const saved = window.sessionStorage.getItem(sessionKey);
    setLoggedIn(Boolean(saved));
    if (saved) void loadData(saved);
  }, []);

  async function loadData(authPassword = window.sessionStorage.getItem(sessionKey) ?? "") {
    if (!authPassword) return;
    setMessage("");
    const response = await fetch("/api/admin/life-helper", { headers: { "x-admin-password": authPassword } });
    const data = (await response.json().catch(() => null)) as {
      applications?: LifeHelperApplication[];
      business?: LifeHelperBusinessApplication[];
      error?: string;
      helpers?: LifeHelperPersonalApplication[];
      requests?: LifeHelperRequest[];
    } | null;
    if (!response.ok) {
      setMessage(data?.error || "生活帮手后台数据读取失败");
      return;
    }
    setRequests(data?.requests ?? []);
    setApplications(data?.applications ?? []);
    setBusinessApplications(data?.business ?? []);
    setHelperApplications(data?.helpers ?? []);
  }

  async function handleLogin() {
    if (!password.trim()) return;
    setMessage("");
    const response = await fetch("/api/admin/community/check-auth", {
      body: JSON.stringify({ password: password.trim() }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });
    if (!response.ok) {
      setMessage("管理员密码不正确");
      return;
    }
    window.sessionStorage.setItem(sessionKey, password.trim());
    setLoggedIn(true);
    await loadData(password.trim());
    setPassword("");
  }

  async function updateAdminItem(kind: "application" | "business" | "helper" | "request", id: string, status: LifeHelperApplicationStatus | LifeHelperJoinStatus | LifeHelperRequestStatus) {
    const authPassword = window.sessionStorage.getItem(sessionKey) ?? "";
    const response = await fetch("/api/admin/life-helper", {
      body: JSON.stringify({ id, kind, status }),
      headers: { "Content-Type": "application/json", "x-admin-password": authPassword },
      method: "PATCH",
    });
    const data = (await response.json().catch(() => null)) as { error?: string } | null;
    if (!response.ok) {
      setMessage(data?.error || "状态更新失败");
      return;
    }
    await loadData(authPassword);
    setMessage("状态已更新");
  }

  function updateRequest(id: string, status: LifeHelperRequestStatus) {
    void updateAdminItem("request", id, status);
  }

  function updateApplication(id: string, status: LifeHelperApplicationStatus) {
    void updateAdminItem("application", id, status);
  }

  function updateBusiness(id: string, status: LifeHelperJoinStatus) {
    void updateAdminItem("business", id, status);
  }

  function updateHelper(id: string, status: LifeHelperJoinStatus) {
    void updateAdminItem("helper", id, status);
  }

  const riskItems = useMemo(() => {
    const requestItems = requests
      .filter((item) => riskWords.some((word) => `${item.title} ${item.description} ${item.contact}`.includes(word)))
      .map((item) => ({ id: item.id, text: `${item.title} / ${item.description}`, type: "帮忙需求" }));
    const businessItems = businessApplications
      .filter((item) => riskWords.some((word) => `${item.businessName} ${item.description} ${item.notes}`.includes(word)))
      .map((item) => ({ id: item.id, text: `${item.businessName} / ${item.description}`, type: "商家入驻" }));
    const helperItems = helperApplications
      .filter((item) => riskWords.some((word) => `${item.displayName} ${item.selfIntro} ${item.notes}`.includes(word)))
      .map((item) => ({ id: item.id, text: `${item.displayName} / ${item.selfIntro}`, type: "个人帮手" }));
    return [...requestItems, ...businessItems, ...helperItems];
  }, [businessApplications, helperApplications, requests]);

  if (!loggedIn) {
    return (
      <main className="admin-page min-h-screen bg-[#F6FAFF] px-4 py-5 text-[#0F172A]">
        <div className="mx-auto min-h-screen w-full max-w-[430px] pb-10">
          <Link className="inline-flex h-9 items-center gap-2 rounded-full bg-white px-4 text-sm font-black text-[#2563EB] shadow-sm ring-1 ring-blue-100" href="/admin">
            <ArrowLeft className="h-4 w-4" />
            返回后台
          </Link>
          <section className="mt-5 rounded-[28px] border border-white/70 bg-white/85 p-5 shadow-[0_18px_45px_rgba(37,99,235,0.10)]">
            <p className="text-sm font-black text-[#2563EB]">生活帮手后台</p>
            <h1 className="mt-2 text-3xl font-black">生活帮手后台</h1>
            <p className="mt-2 text-sm font-bold leading-6 text-[#64748B]">请输入管理员密码后管理需求、入驻和申请联系。</p>
            <input className="mt-5 h-12 w-full rounded-2xl border border-blue-100 bg-blue-50/70 px-4 text-sm font-bold outline-none focus:border-[#2563EB]" onChange={(event) => setPassword(event.target.value)} placeholder="管理员密码" type="password" value={password} />
            <button className="admin-primary-button mt-3 h-12 w-full rounded-2xl text-sm font-black shadow-sm" onClick={handleLogin} type="button">进入后台</button>
            {message ? <p className="mt-3 rounded-2xl bg-rose-50 px-4 py-3 text-xs font-bold text-rose-700">{message}</p> : null}
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="admin-page min-h-screen bg-[#F6FAFF] px-4 py-5 text-[#0F172A]">
      <div className="mx-auto min-h-screen w-full max-w-[1080px] pb-10">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <Link className="inline-flex h-9 items-center gap-2 rounded-full bg-white px-4 text-sm font-black text-[#2563EB] shadow-sm ring-1 ring-blue-100" href="/admin">
            <ArrowLeft className="h-4 w-4" />
            返回后台
          </Link>
          <button className="inline-flex h-9 items-center gap-2 rounded-full bg-white px-4 text-xs font-black text-[#2563EB] shadow-sm ring-1 ring-blue-100" onClick={() => void loadData()} type="button">
            <RefreshCw className="h-4 w-4" />
            刷新
          </button>
        </header>

        <section className="mt-5 rounded-[28px] border border-white/70 bg-white/85 p-5 shadow-[0_18px_45px_rgba(37,99,235,0.10)]">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-[#2563EB] ring-1 ring-blue-100">
            <LifeBuoy className="h-6 w-6" />
          </span>
          <h1 className="mt-4 text-3xl font-black">生活帮手管理</h1>
          <p className="mt-2 text-sm font-bold leading-6 text-[#64748B]">管理帮忙需求、商家入驻、个人帮手和申请联系。数据来自 Supabase 线上表。</p>
        </section>

        {message ? <p className="mt-4 rounded-2xl bg-blue-50 px-4 py-3 text-xs font-black text-[#1D4ED8] ring-1 ring-blue-100">{message}</p> : null}

        <nav className="mt-4 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {tabs.map((tab) => (
            <button className={`h-10 shrink-0 rounded-full px-4 text-xs font-black ${activeTab === tab.id ? "admin-primary-button" : "admin-secondary-button border"}`} key={tab.id} onClick={() => setActiveTab(tab.id)} type="button">
              {tab.label}
            </button>
          ))}
        </nav>

        <section className="mt-4 grid gap-3">
          {activeTab === "requests" ? requests.map((item) => (
            <AdminCard key={item.id} meta={`${getLifeHelperCategoryLabel(item.category)} / ${item.area} / ${item.createdAt}`} status={item.status === "open" ? "募集中" : "已关闭"} title={item.title}>
              <p className="text-sm font-bold leading-6 text-slate-600">{item.description}</p>
              <ActionRow>
                <AdminAction label="恢复开放" onClick={() => updateRequest(item.id, "open")} />
                <AdminAction danger label="关闭" onClick={() => updateRequest(item.id, "closed")} />
              </ActionRow>
            </AdminCard>
          )) : null}

          {activeTab === "applications" ? applications.map((item) => (
            <AdminCard key={item.id} meta={`${item.applicantName} / ${item.createdAt}`} status={item.status} title={`申请联系：${item.requestId}`}>
              <p className="text-sm font-bold leading-6 text-slate-600">{item.message}</p>
              <p className="mt-1 text-xs font-black text-[#2563EB]">{item.contact}</p>
              <ActionRow>
                <AdminAction label="接受" onClick={() => updateApplication(item.id, "accepted")} />
                <AdminAction danger label="拒绝" onClick={() => updateApplication(item.id, "declined")} />
                <AdminAction label="恢复待处理" onClick={() => updateApplication(item.id, "sent")} />
              </ActionRow>
            </AdminCard>
          )) : null}

          {activeTab === "business" ? businessApplications.map((item) => (
            <AdminCard key={item.id} meta={`${item.category} / ${item.area} / ${item.createdAt}`} status={getLifeHelperJoinStatusLabel(item.status)} title={item.businessName}>
              <p className="text-sm font-bold leading-6 text-slate-600">{item.description}</p>
              <ActionRow>
                <AdminAction label="通过" onClick={() => updateBusiness(item.id, "approved")} />
                <AdminAction danger label="拒绝" onClick={() => updateBusiness(item.id, "rejected")} />
                <AdminAction label="恢复待审" onClick={() => updateBusiness(item.id, "pending")} />
              </ActionRow>
            </AdminCard>
          )) : null}

          {activeTab === "helpers" ? helperApplications.map((item) => (
            <AdminCard key={item.id} meta={`${item.services.join("、")} / ${item.area} / ${item.createdAt}`} status={getLifeHelperJoinStatusLabel(item.status)} title={item.displayName}>
              <p className="text-sm font-bold leading-6 text-slate-600">{item.selfIntro}</p>
              <ActionRow>
                <AdminAction label="通过" onClick={() => updateHelper(item.id, "approved")} />
                <AdminAction danger label="拒绝" onClick={() => updateHelper(item.id, "rejected")} />
                <AdminAction label="恢复待审" onClick={() => updateHelper(item.id, "pending")} />
              </ActionRow>
            </AdminCard>
          )) : null}

          {activeTab === "risk" ? riskItems.map((item) => (
            <AdminCard key={`${item.type}-${item.id}`} meta={item.type} status="需确认" title={item.id}>
              <p className="text-sm font-bold leading-6 text-slate-600">{item.text}</p>
            </AdminCard>
          )) : null}

          {getVisibleCount(activeTab, requests, applications, businessApplications, helperApplications, riskItems) === 0 ? (
            <div className="rounded-[24px] border border-blue-100 bg-white/85 p-8 text-center shadow-[0_12px_28px_rgba(15,76,129,0.08)]">
              <ShieldCheck className="mx-auto h-8 w-8 text-[#2563EB]" />
              <p className="mt-3 text-sm font-black text-[#061a3a]">暂无内容</p>
              <p className="mt-1 text-xs font-bold text-[#64748B]">当前分类没有需要处理的数据。</p>
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}

function AdminCard({ children, meta, status, title }: { children: React.ReactNode; meta: string; status: string; title: string }) {
  return (
    <article className="rounded-[24px] border border-[rgba(226,232,240,0.9)] bg-white/86 p-[18px] shadow-[0_12px_28px_rgba(15,76,129,0.08)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="line-clamp-2 text-base font-black text-[#061a3a]">{title}</h2>
          <p className="mt-1 text-xs font-bold text-[#64748B]">{meta}</p>
        </div>
        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-[#2563EB] ring-1 ring-blue-100">{status}</span>
      </div>
      <div className="mt-3">{children}</div>
    </article>
  );
}

function ActionRow({ children }: { children: React.ReactNode }) {
  return <div className="mt-3 flex flex-wrap gap-2">{children}</div>;
}

function AdminAction({ danger = false, label, onClick }: { danger?: boolean; label: string; onClick: () => void }) {
  return (
    <button className={`inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-xs font-black shadow-sm ${danger ? "bg-rose-50 text-rose-700 ring-1 ring-rose-100" : "bg-blue-50 text-[#2563EB] ring-1 ring-blue-100"}`} onClick={onClick} type="button">
      {danger ? <XCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
      {label}
    </button>
  );
}

function isAdminTab(value: string | null): value is AdminTab {
  return value === "requests" || value === "applications" || value === "business" || value === "helpers" || value === "risk";
}

function getVisibleCount(
  tab: AdminTab,
  requests: LifeHelperRequest[],
  applications: LifeHelperApplication[],
  businessApplications: LifeHelperBusinessApplication[],
  helperApplications: LifeHelperPersonalApplication[],
  riskItems: unknown[],
) {
  if (tab === "requests") return requests.length;
  if (tab === "applications") return applications.length;
  if (tab === "business") return businessApplications.length;
  if (tab === "helpers") return helperApplications.length;
  return riskItems.length;
}
