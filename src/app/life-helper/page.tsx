"use client";

import type { User } from "@supabase/supabase-js";
import { ArrowLeft, CheckCircle2, ClipboardList, Eye, Handshake, Info, MapPin, MessageCircle, Plus, ShieldCheck, Sparkles, UserRoundCheck } from "lucide-react";
import Link from "next/link";
import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import { sampleLifeHelperRequests } from "@/lib/lifeHelper/data";
import { lifeHelperServiceLanguageTags, readLifeHelperBusinessApplications, readLifeHelperPersonalApplications, sampleApprovedBusinessApplications, sampleApprovedPersonalApplications, type LifeHelperBusinessApplication, type LifeHelperPersonalApplication, type LifeHelperServiceLanguageTag } from "@/lib/lifeHelper/join";
import { createLifeHelperId, readLifeHelperApplications, readLifeHelperRequests, writeLifeHelperRequests } from "@/lib/lifeHelper/storage";
import { getLifeHelperCategoryLabel, lifeHelperCategories, type LifeHelperApplication, type LifeHelperCategory, type LifeHelperContactVisibility, type LifeHelperRequest } from "@/lib/lifeHelper/types";
import { withBackFrom } from "@/lib/navigation/back";
import { supabase } from "@/lib/supabase";

type LifeHelperTab = "all" | "mine" | "applied";
type CategoryFilter = "all" | LifeHelperCategory;
type ProviderFilter = "all" | "business" | "helper";
type ProviderLanguageFilter = "all" | LifeHelperServiceLanguageTag;
type LifeHelperList = "requests" | "providers";

const displayNameStorageKey = "japan-life:user-display-name";

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

function requestMatchesCategory(request: LifeHelperRequest, category: CategoryFilter) {
  return category === "all" || request.category === category;
}

export default function LifeHelperPage() {
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>("all");
  const [activeList, setActiveList] = useState<LifeHelperList>("requests");
  const [activeTab, setActiveTab] = useState<LifeHelperTab>("all");
  const [applications, setApplications] = useState<LifeHelperApplication[]>([]);
  const [businessApplications, setBusinessApplications] = useState<LifeHelperBusinessApplication[]>([]);
  const [expandedRequestId, setExpandedRequestId] = useState("");
  const [form, setForm] = useState(initialForm);
  const [formOpen, setFormOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [requests, setRequests] = useState<LifeHelperRequest[]>([]);
  const [personalApplications, setPersonalApplications] = useState<LifeHelperPersonalApplication[]>([]);
  const [providerFilter, setProviderFilter] = useState<ProviderFilter>("all");
  const [providerLanguageFilter, setProviderLanguageFilter] = useState<ProviderLanguageFilter>("all");
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    setRequests(readLifeHelperRequests());
    setApplications(readLifeHelperApplications());
    setBusinessApplications(readLifeHelperBusinessApplications());
    setPersonalApplications(readLifeHelperPersonalApplications());
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
  const currentUserName = getUserDisplayName(user);
  const userId = user?.id ?? "";
  const appliedRequestIds = useMemo(() => new Set(applications.filter((application) => application.applicantId === userId).map((application) => application.requestId)), [applications, userId]);

  const visibleProviders = useMemo(() => {
    const business = [...businessApplications, ...sampleApprovedBusinessApplications]
      .filter((item) => item.status === "approved")
      .map((item) => ({
        id: item.id,
        area: item.area,
        contact: item.lineId || item.email || item.phone || item.website || "联系前请先确认服务范围",
        description: item.description,
        kind: "business" as const,
        languages: item.languages,
        name: item.businessName,
        price: item.priceInfo || "价格需确认",
        serviceLanguageTag: item.serviceLanguageTag,
        services: [item.category],
      }));
    const helpers = [...personalApplications, ...sampleApprovedPersonalApplications]
      .filter((item) => item.status === "approved")
      .map((item) => ({
        id: item.id,
        area: item.area,
        contact: item.contact,
        description: item.selfIntro,
        kind: "helper" as const,
        languages: item.languages,
        name: item.displayName,
        price: item.priceExpectation || "报酬可商量",
        serviceLanguageTag: item.serviceLanguageTag,
        services: item.services,
      }));
    return [...business, ...helpers].filter((item) => {
      const matchesType = providerFilter === "all" || item.kind === providerFilter;
      const matchesLanguage = providerLanguageFilter === "all" || item.serviceLanguageTag === providerLanguageFilter;
      return matchesType && matchesLanguage;
    });
  }, [businessApplications, personalApplications, providerFilter, providerLanguageFilter]);

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

  function submitRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) {
      setMessage("请先登录后再使用生活帮手功能。");
      return;
    }
    if (!canSubmit) return;

    const nextRequest: LifeHelperRequest = {
      id: createLifeHelperId("request"),
      area: form.area.trim(),
      authorId: user.id,
      authorName: currentUserName,
      budget: form.budget.trim() || "报酬和条件需双方确认",
      category: form.category,
      contact: form.contact.trim(),
      contactVisibility: form.contactVisibility,
      createdAt: formatNow(),
      description: form.description.trim() || "发布者还没有补充详细说明。",
      preferredTime: form.preferredTime.trim(),
      source: "user",
      status: "open",
      title: form.title.trim(),
    };
    const nextRequests = [nextRequest, ...requests].slice(0, 80);
    setRequests(nextRequests);
    writeLifeHelperRequests(nextRequests);
    setActiveList("requests");
    setActiveTab("mine");
    setForm(initialForm);
    setFormOpen(false);
    setMessage("需求已发布。");
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
            这是附近个人生活服务匹配，不是店铺功能。第一版使用需求帖子、申请联系和本地保存，不做实时聊天。
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

        {(activeTab === "mine" || activeTab === "applied") && !user ? (
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
                        {request.source === "sample" ? <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-black text-amber-700 ring-1 ring-amber-100">本地示例</span> : null}
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

                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs font-black text-slate-700">
                    <InfoPill label="时间" value={request.preferredTime} />
                    <InfoPill label="预算" value={request.budget} />
                    <InfoPill label="发布者" value={request.authorName} />
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

                  {mine ? <p className="mt-3 text-xs font-black text-[#2563EB]">收到 {requestApplications.length} 个申请</p> : null}
                  {mine && expandedRequestId === request.id ? (
                    <div className="mt-3 grid gap-2 rounded-2xl bg-blue-50/70 p-3 ring-1 ring-blue-100">
                      {requestApplications.length === 0 ? (
                        <p className="text-xs font-bold text-slate-500">还没有人申请这个需求。</p>
                      ) : (
                        requestApplications.map((application) => (
                          <div className="rounded-2xl bg-white p-3 text-xs font-bold leading-5 text-slate-600 ring-1 ring-blue-100" key={application.id}>
                            <p className="font-black text-slate-900">{application.applicantName} / {application.createdAt}</p>
                            <p className="mt-1">{application.message}</p>
                            <p className="mt-1 text-[#2563EB]">联系方式：{application.contact}</p>
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
                  <p className="mt-3 line-clamp-3 text-sm font-bold leading-6 text-slate-600">{provider.description}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {provider.services.slice(0, 4).map((service) => <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-[#1D4ED8]" key={service}>{service}</span>)}
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs font-black text-slate-700">
                    <InfoPill label="语言" value={provider.languages.join(" / ") || "需确认"} />
                    <InfoPill label="价格" value={provider.price} />
                  </div>
                  <p className="mt-3 rounded-2xl bg-blue-50/80 px-3 py-2 text-xs font-black text-[#2563EB] ring-1 ring-blue-100">联系：{provider.contact}</p>
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
