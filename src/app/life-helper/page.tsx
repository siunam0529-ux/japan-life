"use client";

import type { User } from "@supabase/supabase-js";
import { ArrowLeft, CheckCircle2, ClipboardList, Copy, Eye, Handshake, Info, MapPin, MessageCircle, Plus, ShieldCheck, Sparkles, UserRoundCheck, XCircle } from "lucide-react";
import Link from "next/link";
import type { CSSProperties, FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import { createLifeHelperRequest, fetchLifeHelperApplications, fetchLifeHelperProviders, fetchLifeHelperRequests, updateLifeHelperApplicationStatus, updateLifeHelperRequestStatus, type LifeHelperProvider } from "@/lib/lifeHelper/api";
import { lifeHelperServiceLanguageTags, type LifeHelperServiceLanguageTag } from "@/lib/lifeHelper/join";
import { getLifeHelperApplicationStatusLabel, getLifeHelperCategoryLabel, lifeHelperCategories, type LifeHelperApplication, type LifeHelperApplicationStatus, type LifeHelperCategory, type LifeHelperContactVisibility, type LifeHelperRequest, type LifeHelperRequestStatus } from "@/lib/lifeHelper/types";
import { withBackFrom } from "@/lib/navigation/back";
import { supabase } from "@/lib/supabase";

type LifeHelperTab = "all" | "mine" | "applied";
type CategoryFilter = "all" | LifeHelperCategory;
type ProviderFilter = "all" | "business" | "helper";
type ProviderLanguageFilter = "all" | LifeHelperServiceLanguageTag;
type LifeHelperList = "requests" | "providers";

const initialForm = {
  area: "",
  budget: "",
  category: "cleaning" as LifeHelperCategory,
  contact: "",
  contactVisibility: "after_apply" as LifeHelperContactVisibility,
  description: "",
  preferredTime: "",
  title: "",
};

function requestMatchesCategory(request: LifeHelperRequest, category: CategoryFilter) {
  return category === "all" || request.category === category;
}

export default function LifeHelperPage() {
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>("all");
  const [activeList, setActiveList] = useState<LifeHelperList>("requests");
  const [activeTab, setActiveTab] = useState<LifeHelperTab>("all");
  const [applications, setApplications] = useState<LifeHelperApplication[]>([]);
  const [expandedRequestId, setExpandedRequestId] = useState("");
  const [form, setForm] = useState(initialForm);
  const [formOpen, setFormOpen] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [message, setMessage] = useState("");
  const [requests, setRequests] = useState<LifeHelperRequest[]>([]);
  const [providers, setProviders] = useState<LifeHelperProvider[]>([]);
  const [providerFilter, setProviderFilter] = useState<ProviderFilter>("all");
  const [providerLanguageFilter, setProviderLanguageFilter] = useState<ProviderLanguageFilter>("all");
  const [providerMessage, setProviderMessage] = useState("");
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    void loadLifeHelperData();
    if (!supabase) return;

    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (mounted) setUser(data.session?.user ?? null);
      if (mounted && data.session?.user) void loadLifeHelperApplications();
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setUser(session?.user ?? null);
      void loadLifeHelperApplications();
    });
    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  async function loadLifeHelperData() {
    setLoadingData(true);
    setMessage("");
    try {
      const [nextRequests, nextApplications, nextProviders] = await Promise.all([
        fetchLifeHelperRequests(),
        fetchLifeHelperApplications(),
        fetchLifeHelperProviders(),
      ]);
      setRequests(nextRequests);
      setApplications(nextApplications);
      setProviders(nextProviders);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "生活帮手数据读取失败。");
    } finally {
      setLoadingData(false);
    }
  }

  async function loadLifeHelperApplications() {
    try {
      setApplications(await fetchLifeHelperApplications());
    } catch {
      setApplications([]);
    }
  }

  const allRequests = requests;
  const userId = user?.id ?? "";
  const appliedRequestIds = useMemo(() => new Set(applications.filter((application) => application.applicantId === userId).map((application) => application.requestId)), [applications, userId]);

  const visibleProviders = useMemo(() => {
    return providers.filter((item) => {
      const matchesType = providerFilter === "all" || item.kind === providerFilter;
      const matchesLanguage = providerLanguageFilter === "all" || item.serviceLanguageTag === providerLanguageFilter;
      return matchesType && matchesLanguage;
    });
  }, [providerFilter, providerLanguageFilter, providers]);

  const visibleRequests = useMemo(() => {
    let list = allRequests;
    if (activeTab === "mine") list = userId ? list.filter((request) => request.authorId === userId) : [];
    if (activeTab === "applied") list = userId ? list.filter((request) => appliedRequestIds.has(request.id)) : [];
    return list.filter((request) => requestMatchesCategory(request, activeCategory));
  }, [activeCategory, activeTab, allRequests, appliedRequestIds, userId]);

  const canSubmit =
    form.title.trim() &&
    form.area.trim() &&
    form.preferredTime.trim() &&
    (form.contactVisibility === "private" || form.contact.trim());

  function openPublishForm() {
    if (!user) {
      setMessage("请先登录后再使用生活帮手功能。");
      return;
    }
    setMessage("");
    setFormOpen((value) => !value);
  }

  async function submitRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) {
      setMessage("请先登录后再使用生活帮手功能。");
      return;
    }
    if (!canSubmit) return;

    try {
      const nextRequest = await createLifeHelperRequest({
        area: form.area.trim(),
        budget: form.budget.trim(),
        category: form.category,
        contact: form.contact.trim(),
        contactVisibility: form.contactVisibility,
        description: form.description.trim(),
        preferredTime: form.preferredTime.trim(),
        title: form.title.trim(),
      });
      setRequests((current) => [nextRequest, ...current.filter((request) => request.id !== nextRequest.id)]);
      setActiveList("requests");
      setActiveTab("mine");
      setForm(initialForm);
      setFormOpen(false);
      setMessage("需求已发布。");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "需求发布失败。");
    }
  }

  async function updateApplicationStatus(applicationId: string, status: LifeHelperApplicationStatus) {
    try {
      const updated = await updateLifeHelperApplicationStatus(applicationId, status);
      setApplications((current) => current.map((application) => application.id === updated.id ? updated : application));
      setMessage(status === "accepted" ? "已接受这条申请，系统已自动发送 App 私信。" : "已拒绝这条申请。");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "申请状态更新失败。");
    }
  }

  async function updateRequestStatus(requestId: string, status: LifeHelperRequestStatus) {
    try {
      const updated = await updateLifeHelperRequestStatus(requestId, status);
      setRequests((current) => current.map((request) => request.id === updated.id ? updated : request));
      setMessage(status === "closed" ? "需求已关闭。" : "需求已重新开放。");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "需求状态更新失败。");
    }
  }

  async function copyProviderContact(contact: string) {
    try {
      await navigator.clipboard.writeText(contact);
      setProviderMessage("联系方式已复制。");
    } catch {
      setProviderMessage(`联系方式：${contact}`);
    }
  }

  return (
    <main className="jl-tool-theme min-h-screen text-[#061a3a]">
      <div className="jl-tool-shell mx-auto flex min-h-screen w-full max-w-[430px] flex-col gap-4 px-4 pb-28 pt-5">
        <div className="flex items-center justify-between">
          <Link className="inline-flex h-9 items-center gap-2 rounded-full bg-white/85 px-4 text-sm font-black text-[#2563EB] shadow-sm ring-1 ring-blue-100" href="/">
            <ArrowLeft className="h-4 w-4" />
            返回
          </Link>
          <span className="rounded-full bg-white/85 px-4 py-2 text-xs font-black text-[#2563EB] shadow-sm ring-1 ring-blue-100">Japan Life</span>
        </div>

        <section className="rounded-[28px] border border-white/80 bg-white/85 p-5 shadow-[0_18px_40px_rgba(37,99,235,0.12)] backdrop-blur">
          <div className="flex items-start gap-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/80 text-[#2563EB] shadow-sm ring-1 ring-blue-100">
              <Handshake className="h-6 w-6" />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-black text-[#2563EB]">暮らしサポート</p>
              <h1 className="mt-1 text-2xl font-black leading-tight">生活帮手</h1>
              <p className="mt-2 text-sm font-bold leading-6 text-slate-600">找附近的人帮你处理生活小事</p>
            </div>
          </div>
          <div className="mt-4 rounded-2xl bg-blue-50/80 p-3 text-xs font-bold leading-5 text-slate-700 ring-1 ring-blue-100">
            这是附近个人生活服务匹配，不是店铺功能。发布、申请和入驻数据会同步到线上，接受申请后会自动进入 App 私信。
          </div>
        </section>

        <section className="rounded-[26px] border border-white/80 bg-white/88 p-4 shadow-[0_14px_32px_rgba(37,99,235,0.1)] backdrop-blur">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-black text-[#2563EB]">Provider Join</p>
              <h2 className="text-lg font-black">成为帮手</h2>
              <p className="mt-1 text-xs font-bold leading-5 text-slate-600">商家和个人都可以申请提供生活服务。</p>
            </div>
            <Link className="flex h-10 shrink-0 items-center justify-center rounded-full bg-[#2563EB] px-4 text-sm font-black text-white shadow-[0_10px_20px_rgba(37,99,235,0.22)]" href="/life-helper/join">
              去申请
            </Link>
          </div>
        </section>

        <Link className="flex items-center justify-between gap-3 rounded-[26px] border border-blue-100 bg-white/90 p-4 shadow-[0_14px_32px_rgba(37,99,235,0.1)] backdrop-blur transition active:scale-[0.99]" href="/life-helper/manage">
          <span className="flex min-w-0 items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-50 text-[#2563EB] ring-1 ring-blue-100">
              <ClipboardList className="h-5 w-5" />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-black text-[#2563EB]">Manage</span>
              <span className="mt-1 block text-lg font-black text-[#061a3a]">管理发布需求和服务</span>
              <span className="mt-1 block text-xs font-bold leading-5 text-slate-600">查看我的需求、申请记录和服务入驻状态。</span>
            </span>
          </span>
          <span className="shrink-0 rounded-full bg-blue-50 px-3 py-2 text-xs font-black text-[#2563EB] ring-1 ring-blue-200">进入</span>
        </Link>

        <section className="rounded-[26px] border border-white/80 bg-white/88 p-2 shadow-[0_14px_32px_rgba(37,99,235,0.09)] backdrop-blur">
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: "requests" as const, label: "需求列表", hint: "找人帮忙 / 我来帮忙" },
              { id: "providers" as const, label: "商家 / 帮手", hint: "已入驻服务者" },
            ].map((item) => (
              <button
                className={`rounded-[22px] px-3 py-3 text-left transition ${activeList === item.id ? "bg-[#2563EB] text-white shadow-[0_12px_24px_rgba(37,99,235,0.22)]" : "bg-white/80 text-slate-700 ring-1 ring-blue-100"}`}
                key={item.id}
                onClick={() => setActiveList(item.id)}
                type="button"
              >
                <span className="block text-sm font-black">{item.label}</span>
                <span className={`mt-1 block text-[11px] font-bold leading-4 ${activeList === item.id ? "text-blue-50" : "text-slate-500"}`}>{item.hint}</span>
              </button>
            ))}
          </div>
        </section>

        {activeList === "requests" ? (
          <>
        <section className="rounded-[26px] border border-white/80 bg-white/85 p-4 shadow-[0_14px_32px_rgba(37,99,235,0.1)] backdrop-blur">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black text-[#2563EB]">Life Helper</p>
              <h2 className="text-lg font-black">需求列表</h2>
            </div>
            <button className="inline-flex h-10 items-center gap-2 rounded-full bg-[#2563EB] px-4 text-sm font-black text-white shadow-[0_10px_20px_rgba(37,99,235,0.22)]" onClick={openPublishForm} type="button">
              <Plus className="h-4 w-4" />
              发布需求
            </button>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2 rounded-2xl bg-blue-50/70 p-1">
            {[
              { id: "all" as const, label: "全部需求" },
              { id: "mine" as const, label: "我发布的" },
              { id: "applied" as const, label: "我申请的" },
            ].map((tab) => (
              <button className={`rounded-xl px-2 py-2 text-xs font-black ${activeTab === tab.id ? "bg-[#2563EB] text-white shadow-sm" : "text-slate-600"}`} key={tab.id} onClick={() => setActiveTab(tab.id)} type="button">
                {tab.label}
              </button>
            ))}
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2">
            <CategoryButton active={activeCategory === "all"} label="全部" onClick={() => setActiveCategory("all")} />
            {lifeHelperCategories.map((category) => (
              <CategoryButton active={activeCategory === category.id} key={category.id} label={category.label} onClick={() => setActiveCategory(category.id)} />
            ))}
          </div>

          {message ? (
            <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50 px-3 py-2 text-xs font-black leading-5 text-[#1D4ED8]">
              {message} {!user ? <Link className="underline" href={withBackFrom("/login?next=/life-helper")}>去登录</Link> : null}
            </div>
          ) : null}

          {formOpen ? (
            <form className="mt-4 rounded-3xl border border-blue-100 bg-blue-50/75 p-4" onSubmit={submitRequest}>
              <div className="flex items-center gap-2 text-sm font-black text-[#1D4ED8]">
                <ClipboardList className="h-4 w-4" />
                发布一个生活帮忙需求
              </div>
              <div className="mt-3 grid gap-3">
                <TextInput label="标题" onChange={(value) => setForm((current) => ({ ...current, title: value }))} placeholder="例如：帮忙搬两个纸箱" value={form.title} />
                <label className="grid gap-1.5">
                  <span className="text-xs font-black text-slate-500">分类</span>
                  <select className="h-11 rounded-2xl border border-blue-100 bg-white px-4 text-sm font-bold outline-none focus:border-blue-400" onChange={(event) => setForm((current) => ({ ...current, category: event.target.value as LifeHelperCategory }))} value={form.category}>
                    {lifeHelperCategories.map((category) => <option key={category.id} value={category.id}>{category.label}</option>)}
                  </select>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <TextInput label="地区" onChange={(value) => setForm((current) => ({ ...current, area: value }))} placeholder="地区 / 车站" value={form.area} />
                  <TextInput label="希望时间" onChange={(value) => setForm((current) => ({ ...current, preferredTime: value }))} placeholder="今天傍晚" value={form.preferredTime} />
                </div>
                <TextInput label="预算" onChange={(value) => setForm((current) => ({ ...current, budget: value }))} placeholder="2,000円 / 面议" value={form.budget} />
                <label className="grid gap-1.5">
                  <span className="text-xs font-black text-slate-500">详细说明</span>
                  <textarea className="min-h-24 resize-none rounded-2xl border border-blue-100 bg-white px-4 py-3 text-sm font-bold outline-none focus:border-blue-400" onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} placeholder="要做什么、多久、有没有注意事项" value={form.description} />
                </label>
                <label className="grid gap-1.5">
                  <span className="text-xs font-black text-slate-500">联系方式可见范围</span>
                  <select className="h-11 rounded-2xl border border-blue-100 bg-white px-4 text-sm font-bold outline-none focus:border-blue-400" onChange={(event) => setForm((current) => ({ ...current, contactVisibility: event.target.value as LifeHelperContactVisibility }))} value={form.contactVisibility}>
                    <option value="after_apply">仅申请后可见</option>
                    <option value="public">公开显示</option>
                    <option value="private">不公开，仅站内申请</option>
                  </select>
                </label>
                <TextInput label="联系方式" onChange={(value) => setForm((current) => ({ ...current, contact: value }))} placeholder="LINE ID / 邮箱 / 电话 / 其他" value={form.contact} />
                <SafetyNotice compact />
                <button className="h-11 rounded-2xl bg-[#2563EB] text-sm font-black text-white disabled:cursor-not-allowed disabled:bg-slate-300" disabled={!canSubmit} type="submit">
                  发布需求
                </button>
              </div>
            </form>
          ) : null}
        </section>

        {loadingData ? (
          <EmptyState body="正在读取生活帮手数据..." />
        ) : (activeTab === "mine" || activeTab === "applied") && !user ? (
          <EmptyState body="请先登录后再查看自己的发布和申请。" />
        ) : visibleRequests.length === 0 ? (
          <EmptyState body="这里暂时没有符合条件的需求，可以换个分类看看，或发布一个新的需求。" />
        ) : (
          <section className="grid gap-3">
            {visibleRequests.map((request) => {
              const requestApplications = applications.filter((application) => application.requestId === request.id);
              const mine = request.authorId === userId;
              const applied = appliedRequestIds.has(request.id);
              return (
                <article className="rounded-[26px] border border-white/80 bg-white/90 p-4 shadow-[0_14px_32px_rgba(37,99,235,0.09)] backdrop-blur" key={request.id}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-[#1D4ED8] ring-1 ring-blue-100">{getLifeHelperCategoryLabel(request.category)}</span>
                        <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-slate-600 ring-1 ring-blue-100">{request.status === "open" ? "募集中" : "已关闭"}</span>
                      </div>
                      <h3 className="mt-3 break-words text-lg font-black leading-6">{request.title}</h3>
                      <p className="mt-2 flex items-center gap-1 text-sm font-black text-[#2563EB]">
                        <MapPin className="h-4 w-4" />
                        {request.area}
                      </p>
                    </div>
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/80 text-[#2563EB] shadow-sm ring-1 ring-blue-100">
                      <Sparkles className="h-5 w-5" />
                    </span>
                  </div>

                  <div className="mt-3">
                    <AccountBadge avatar={request.authorAvatar} id={request.authorProfileId || request.authorId} label="发布者" name={request.authorName} />
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs font-black text-slate-700">
                    <InfoPill label="时间" value={request.preferredTime} />
                    <InfoPill label="预算" value={request.budget} />
                    <InfoPill label="发布时间" value={request.createdAt} />
                  </div>
                  <p className="mt-3 line-clamp-3 text-sm font-bold leading-6 text-slate-600">{request.description}</p>

                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <Link className="flex h-11 items-center justify-center gap-2 rounded-2xl bg-[#2563EB] text-sm font-black text-white" href={`/life-helper/${request.id}`}>
                      <Eye className="h-4 w-4" />
                      查看详情
                    </Link>
                    {mine ? (
                      <button className="flex h-11 items-center justify-center gap-2 rounded-2xl border border-blue-200 bg-white text-sm font-black text-[#2563EB]" onClick={() => setExpandedRequestId((current) => (current === request.id ? "" : request.id))} type="button">
                        <MessageCircle className="h-4 w-4" />
                        查看申请
                      </button>
                    ) : (
                      <Link className="flex h-11 items-center justify-center gap-2 rounded-2xl border border-blue-200 bg-white text-sm font-black text-[#2563EB]" href={`/life-helper/${request.id}`}>
                        <UserRoundCheck className="h-4 w-4" />
                        {applied ? "已申请" : "我可以帮忙"}
                      </Link>
                    )}
                  </div>

                  {mine ? (
                    <button className="mt-3 h-10 w-full rounded-2xl border border-blue-200 bg-white text-xs font-black text-[#2563EB]" onClick={() => updateRequestStatus(request.id, request.status === "open" ? "closed" : "open")} type="button">
                      {request.status === "open" ? "关闭需求" : "重新开放"}
                    </button>
                  ) : null}
                  {mine ? <p className="mt-3 text-xs font-black text-[#2563EB]">收到 {requestApplications.length} 个申请</p> : null}
                  {mine && expandedRequestId === request.id ? (
                    <div className="mt-3 grid gap-2 rounded-2xl bg-blue-50/70 p-3 ring-1 ring-blue-100">
                      {requestApplications.length === 0 ? (
                        <p className="text-xs font-bold text-slate-500">还没有人申请这个需求。</p>
                      ) : (
                        requestApplications.map((application) => (
                          <div className="rounded-2xl bg-white p-3 text-xs font-bold leading-5 text-slate-600 ring-1 ring-blue-100" key={application.id}>
                            <AccountBadge avatar={application.applicantAvatar} id={application.applicantProfileId || application.applicantId} label={application.createdAt} name={application.applicantName} />
                            <p className="mt-1 text-[#2563EB]">状态：{getLifeHelperApplicationStatusLabel(application.status)}</p>
                            <p className="mt-1">{application.message}</p>
                            <p className="mt-1 text-[#2563EB]">联系方式：{application.contact}</p>
                            <div className="mt-3 grid grid-cols-2 gap-2">
                              <button className="inline-flex h-9 items-center justify-center gap-1 rounded-full bg-[#2563EB] px-3 text-xs font-black text-white disabled:bg-slate-300" disabled={application.status === "accepted"} onClick={() => updateApplicationStatus(application.id, "accepted")} type="button">
                                <CheckCircle2 className="h-4 w-4" />
                                接受
                              </button>
                              <button className="inline-flex h-9 items-center justify-center gap-1 rounded-full border border-rose-200 bg-white px-3 text-xs font-black text-rose-700 disabled:text-slate-400" disabled={application.status === "declined"} onClick={() => updateApplicationStatus(application.id, "declined")} type="button">
                                <XCircle className="h-4 w-4" />
                                拒绝
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  ) : null}
                </article>
              );
            })}
          </section>
        )}
          </>
        ) : null}

        {activeList === "providers" ? (
        <section className="rounded-[26px] border border-white/80 bg-white/88 p-4 shadow-[0_14px_32px_rgba(37,99,235,0.09)] backdrop-blur">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black text-[#2563EB]">Approved Providers</p>
              <h2 className="text-lg font-black">已入驻服务者</h2>
            </div>
            <Link className="rounded-full border border-blue-200 bg-white px-3 py-2 text-xs font-black text-[#2563EB]" href="/life-helper/join">
              成为帮手
            </Link>
          </div>
          {providerMessage ? <p className="mt-3 rounded-2xl bg-blue-50/80 px-3 py-2 text-xs font-black text-[#2563EB] ring-1 ring-blue-100">{providerMessage}</p> : null}
          <div className="mt-3 grid grid-cols-3 gap-2 rounded-2xl bg-blue-50/70 p-1">
            {[
              { id: "all" as const, label: "全部" },
              { id: "business" as const, label: "商家" },
              { id: "helper" as const, label: "个人帮手" },
            ].map((item) => (
              <button className={`rounded-xl px-2 py-2 text-xs font-black ${providerFilter === item.id ? "bg-[#2563EB] text-white shadow-sm" : "text-slate-600"}`} key={item.id} onClick={() => setProviderFilter(item.id)} type="button">
                {item.label}
              </button>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-2 rounded-2xl bg-blue-50/60 p-2">
            <button className={`rounded-full border px-3 py-2 text-xs font-black ${providerLanguageFilter === "all" ? "border-[#2563EB] bg-[#2563EB] text-white" : "border-blue-100 bg-white text-slate-600"}`} onClick={() => setProviderLanguageFilter("all")} type="button">
              全部语言
            </button>
            {lifeHelperServiceLanguageTags.map((tag) => (
              <button className={`rounded-full border px-3 py-2 text-xs font-black ${providerLanguageFilter === tag ? "border-[#2563EB] bg-[#2563EB] text-white" : "border-blue-100 bg-white text-slate-600"}`} key={tag} onClick={() => setProviderLanguageFilter(tag)} type="button">
                {tag}
              </button>
            ))}
          </div>
          <div className="mt-3 grid gap-3">
            {visibleProviders.length === 0 ? (
              <p className="rounded-2xl bg-blue-50/80 p-3 text-xs font-bold leading-5 text-slate-500 ring-1 ring-blue-100">暂时没有已通过的服务者。待审核和已拒绝申请不会公开展示。</p>
            ) : (
              visibleProviders.map((provider) => (
                <article className="rounded-[22px] border border-blue-100 bg-white/90 p-4 shadow-sm" key={`${provider.kind}-${provider.id}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap gap-2">
                        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-[#1D4ED8] ring-1 ring-blue-100">{provider.kind === "business" ? "商家" : "个人帮手"}</span>
                        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-[#1D4ED8] ring-1 ring-blue-100">{provider.serviceLanguageTag}</span>
                        <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-slate-600 ring-1 ring-blue-100">已通过</span>
                      </div>
                      <h3 className="mt-3 text-lg font-black">{provider.name}</h3>
                      <p className="mt-1 text-xs font-bold text-slate-500">{provider.area}</p>
                    </div>
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/80 text-[#2563EB] shadow-sm ring-1 ring-blue-100">
                      <UserRoundCheck className="h-5 w-5" />
                    </span>
                  </div>
                  <div className="mt-3">
                    <AccountBadge avatar={provider.avatar} id={provider.userProfileId || provider.userId} label="入驻账号" name={provider.name} />
                  </div>
                  <p className="mt-3 line-clamp-3 text-sm font-bold leading-6 text-slate-600">{provider.description}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {provider.services.slice(0, 4).map((service) => <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-[#1D4ED8]" key={service}>{service}</span>)}
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs font-black text-slate-700">
                    <InfoPill label="语言" value={provider.languages.join(" / ") || "需确认"} />
                    <InfoPill label="价格" value={provider.price} />
                  </div>
                  <button className="mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl bg-blue-50/80 px-3 py-2 text-xs font-black text-[#2563EB] ring-1 ring-blue-100" onClick={() => copyProviderContact(provider.contact)} type="button">
                    <Copy className="h-4 w-4" />
                    联系：{provider.contact}
                  </button>
                </article>
              ))
            )}
          </div>
        </section>
        ) : null}

        <SafetyNotice />
      </div>
    </main>
  );
}

function CategoryButton({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button aria-pressed={active} className={`min-h-9 rounded-full border px-2 text-xs font-black transition ${active ? "border-[#2563EB] bg-[#2563EB] text-white shadow-[0_8px_18px_rgba(37,99,235,0.18)]" : "border-blue-100 bg-white/80 text-slate-700"}`} onClick={onClick} type="button">
      {label}
    </button>
  );
}

function EmptyState({ body }: { body: string }) {
  return <div className="rounded-[26px] border border-blue-100 bg-white/85 p-5 text-sm font-bold leading-6 text-slate-600 shadow-sm">{body}</div>;
}

function InfoPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-2xl bg-blue-50/80 px-3 py-2 ring-1 ring-blue-100">
      <p className="text-[10px] text-slate-500">{label}</p>
      <p className="truncate">{value}</p>
    </div>
  );
}

function AccountBadge({ avatar, id, label, name }: { avatar?: string; id: string; label: string; name: string }) {
  return (
    <div className="flex min-w-0 items-center gap-3 rounded-2xl bg-blue-50/70 px-3 py-2 ring-1 ring-blue-100">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-[#2563EB] ring-1 ring-blue-100" style={{ background: getAvatarBackground(avatar) }}>
        {isImageAvatar(avatar) ? null : <UserRoundCheck className="h-5 w-5" />}
      </span>
      <span className="min-w-0">
        <span className="block text-[10px] font-black text-slate-500">{label}</span>
        <span className="block truncate text-sm font-black text-slate-900">{name}</span>
        <span className="block truncate text-[11px] font-bold text-[#2563EB]">ID：{id}</span>
      </span>
    </div>
  );
}

function getAvatarBackground(avatar?: string): CSSProperties["background"] {
  if (!avatar) return "linear-gradient(135deg,#dbeafe,#ffffff,#e0f2fe)";
  if (avatar.startsWith("linear-gradient")) return avatar;
  return `center / cover no-repeat url("${avatar}")`;
}

function isImageAvatar(avatar?: string) {
  return Boolean(avatar && !avatar.startsWith("linear-gradient"));
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
