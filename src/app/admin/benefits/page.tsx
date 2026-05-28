"use client";

import { ExternalLink, RefreshCw, Save, Search, Trash2 } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { BENEFIT_CATEGORIES, TOKYO_WARDS } from "@/lib/benefits/config";
import type { BenefitRecord, BenefitStatus, BenefitWritePayload } from "@/lib/benefits/types";

const sessionKey = "japan-life-admin-auth";
const tabs: Array<{ label: string; value: BenefitStatus }> = [
  { label: "待审核 draft", value: "draft" },
  { label: "已发布 published", value: "published" },
  { label: "已下架 archived", value: "archived" },
];
const allLabel = "全部";
type TranslationFilter = "all" | "translated" | "original" | "error";
type ReviewFilter = "all" | "hasDeadline" | "missingCategory" | "hasApplyUrl";
const translationFilters: Array<{ label: string; value: TranslationFilter }> = [
  { label: "全部翻译", value: "all" },
  { label: "已翻译", value: "translated" },
  { label: "原文/未翻译", value: "original" },
  { label: "翻译失败", value: "error" },
];
const reviewFilters: Array<{ label: string; value: ReviewFilter }> = [
  { label: "全部内容", value: "all" },
  { label: "有申请期限", value: "hasDeadline" },
  { label: "缺分类", value: "missingCategory" },
  { label: "有申请链接", value: "hasApplyUrl" },
];

type SyncResult = {
  added: number;
  skipped: number;
  matched: number;
  translated?: number;
  organized?: number;
  autoPublished?: boolean;
  sources: Array<{
    name: string;
    ward: string;
    mode: "rss" | "fallback" | "skipped";
    rssConfigured?: boolean;
    fallbackExecuted?: boolean;
    fetched: number;
    skippedNoSummary?: number;
    matched: number;
    added: number;
    skipped: number;
    error: string;
    note?: string;
  }>;
};

const emptyForm: BenefitWritePayload = {
  title: "",
  summary: "",
  area: "東京都",
  ward: "",
  category: "",
  target_people: "",
  deadline: "",
  apply_url: "",
  translated_title: "",
  translated_summary: "",
  status: "draft",
};

export default function AdminBenefitsPage() {
  const [password, setPassword] = useState("");
  const [items, setItems] = useState<BenefitRecord[]>([]);
  const [status, setStatus] = useState<BenefitStatus>("draft");
  const [selected, setSelected] = useState<BenefitRecord | null>(null);
  const [form, setForm] = useState<BenefitWritePayload>(emptyForm);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState("");
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);
  const [query, setQuery] = useState("");
  const [wardFilter, setWardFilter] = useState(allLabel);
  const [categoryFilter, setCategoryFilter] = useState(allLabel);
  const [sourceFilter, setSourceFilter] = useState(allLabel);
  const [translationFilter, setTranslationFilter] = useState<TranslationFilter>("all");
  const [reviewFilter, setReviewFilter] = useState<ReviewFilter>("all");
  const wardOptions = useMemo(() => Array.from(new Set(TOKYO_WARDS.map((item) => item.ward))), []);
  const sourceOptions = useMemo(() => Array.from(new Set(items.map((item) => item.source_name).filter((value): value is string => Boolean(value)))).sort(), [items]);

  const filtered = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return items.filter((item) => {
      const hasTranslation = Boolean(item.translated_title?.trim() || item.translated_summary?.trim());
      const matchesWard = wardFilter === allLabel || item.ward === wardFilter;
      const matchesCategory = categoryFilter === allLabel || item.category === categoryFilter;
      const matchesSource = sourceFilter === allLabel || item.source_name === sourceFilter;
      const matchesTranslation =
        translationFilter === "all" ||
        (translationFilter === "translated" && hasTranslation) ||
        (translationFilter === "original" && !hasTranslation) ||
        (translationFilter === "error" && Boolean(item.translation_error));
      const matchesReview =
        reviewFilter === "all" ||
        (reviewFilter === "hasDeadline" && Boolean(item.deadline?.trim())) ||
        (reviewFilter === "missingCategory" && !item.category?.trim()) ||
        (reviewFilter === "hasApplyUrl" && Boolean(item.apply_url?.trim()));
      const haystack = `${item.title} ${item.translated_title ?? ""} ${item.summary ?? ""} ${item.translated_summary ?? ""} ${item.source_name ?? ""} ${item.ward ?? ""} ${item.category ?? ""} ${item.target_people ?? ""} ${item.deadline ?? ""}`.toLowerCase();
      return matchesWard && matchesCategory && matchesSource && matchesTranslation && matchesReview && (!keyword || haystack.includes(keyword));
    });
  }, [categoryFilter, items, query, reviewFilter, sourceFilter, translationFilter, wardFilter]);

  const resetFilters = () => {
    setQuery("");
    setWardFilter(allLabel);
    setCategoryFilter(allLabel);
    setSourceFilter(allLabel);
    setTranslationFilter("all");
    setReviewFilter("all");
  };

  useEffect(() => {
    const stored = window.localStorage.getItem(sessionKey) ?? "";
    setPassword(stored);
  }, []);

  const adminFetch = useCallback(async (url: string, init?: RequestInit) => {
    const response = await fetch(url, {
      ...init,
      headers: {
        "content-type": "application/json",
        "x-admin-password": password,
        ...(init?.headers ?? {}),
      },
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || `API ${response.status}`);
    return data;
  }, [password]);

  const loadItems = useCallback(async (authPassword = password, nextStatus = status) => {
    if (!authPassword) return;
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/admin/benefits?status=${nextStatus}`, { headers: { "x-admin-password": authPassword } });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || `API ${response.status}`);
      setItems(data.items ?? []);
      window.localStorage.setItem(sessionKey, authPassword);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : String(nextError));
    } finally {
      setLoading(false);
    }
  }, [password, status]);

  useEffect(() => {
    if (!password) return;
    void loadItems(password, status);
  }, [loadItems, password, status]);

  const syncBenefits = async () => {
    setSyncing(true);
    setError("");
    try {
      const data = (await adminFetch("/api/admin/benefits/sync", { method: "POST" })) as SyncResult;
      setSyncResult(data);
      await loadItems(password, status);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : String(nextError));
    } finally {
      setSyncing(false);
    }
  };

  const editItem = (item: BenefitRecord) => {
    setSelected(item);
    setForm({
      title: item.title,
      summary: item.summary ?? "",
      area: item.area ?? "東京都",
      ward: item.ward ?? "",
      category: item.category ?? "",
      target_people: item.target_people ?? "",
      deadline: item.deadline ?? "",
      apply_url: item.apply_url ?? "",
      translated_title: item.translated_title ?? "",
      translated_summary: item.translated_summary ?? "",
      status: item.status,
    });
    document.getElementById("benefit-edit-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const patchItem = async (id: string, payload: BenefitWritePayload) => {
    setLoading(true);
    setError("");
    try {
      await adminFetch(`/api/admin/benefits/${id}`, { method: "PATCH", body: JSON.stringify(payload) });
      await loadItems(password, status);
      if (selected?.id === id) setSelected(null);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : String(nextError));
    } finally {
      setLoading(false);
    }
  };

  const deleteItem = async (id: string) => {
    if (!window.confirm("削除しますか？")) return;
    setLoading(true);
    setError("");
    try {
      await adminFetch(`/api/admin/benefits/${id}`, { method: "DELETE" });
      await loadItems(password, status);
      if (selected?.id === id) setSelected(null);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : String(nextError));
    } finally {
      setLoading(false);
    }
  };

  const translateItem = async (id: string) => {
    setLoading(true);
    setError("");
    try {
      await adminFetch(`/api/admin/benefits/${id}/translate`, { method: "POST" });
      await loadItems(password, status);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : String(nextError));
    } finally {
      setLoading(false);
    }
  };

  const saveForm = async () => {
    if (!selected) return;
    await patchItem(selected.id, form);
  };

  return (
    <main className="admin-page min-h-screen bg-[#F6FAFF] px-4 py-5 text-[#0F172A]">
      <div className="mx-auto max-w-[760px]">
        <div className="mb-4">
          <Link className="admin-secondary-button inline-flex items-center rounded-2xl border px-4 py-2 text-xs font-black shadow-sm" href="/admin">
            上一页
          </Link>
        </div>

        <section className="rounded-[28px] border border-white/60 bg-white/80 p-5 shadow-[0_10px_35px_rgba(37,99,235,0.08)]">
          <p className="text-xs font-black text-[#2563EB]">Japan Life Admin</p>
          <h1 className="mt-1 text-2xl font-black">福利・支援制度管理</h1>
          <p className="mt-2 text-sm font-bold leading-6 text-[#64748B]">東京都・東京23区の公式情報を手動取得し、草稿として保存します。</p>
          <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_auto]">
            <input className="h-11 rounded-2xl border border-blue-100 bg-white px-4 text-sm font-bold outline-none focus:border-[#2563EB]" onChange={(event) => setPassword(event.target.value)} placeholder="ADMIN_PASSWORD" type="password" value={password} />
            <button className="admin-primary-button rounded-2xl px-4 py-2 text-sm font-black disabled:opacity-50" disabled={!password || loading} onClick={() => loadItems(password, status)} type="button">读取</button>
          </div>
        </section>

        <section className="mt-4 rounded-[28px] border border-white/60 bg-white/80 p-5 shadow-[0_10px_35px_rgba(37,99,235,0.08)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-black">操作区</h2>
              <p className="mt-1 text-xs font-bold leading-5 text-[#64748B]">自動取得した情報は必ず公式サイトで確認してください。</p>
            </div>
            <button className="admin-primary-button inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-black disabled:opacity-50" disabled={!password || syncing} onClick={syncBenefits} type="button">
              <RefreshCw className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
              获取最新福利
            </button>
          </div>
          {syncResult && (
            <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50/70 p-3 text-xs font-black leading-6 text-[#2563EB]">
              <p>新增：{syncResult.added} 条 / 跳过：{syncResult.skipped} 条 / 命中：{syncResult.matched} 条 / 翻译：{syncResult.translated ?? 0} 条 / 整理：{syncResult.organized ?? 0} 条</p>
              <p>发布方式：{syncResult.autoPublished ? "自动发布 published" : "保存为草稿 draft"}</p>
              <p>成功来源：{syncResult.sources.filter((source) => source.fetched > 0 && !source.error).length} 个</p>
              <p>失败来源：{syncResult.sources.filter((source) => source.error).length} 个</p>
              <p>RSS 未配置来源：{syncResult.sources.filter((source) => source.rssConfigured === false).length} 个 / fallback 已执行：{syncResult.sources.filter((source) => source.fallbackExecuted).length} 个 / 无摘要跳过：{syncResult.sources.reduce((sum, source) => sum + (source.skippedNoSummary ?? 0), 0)} 条</p>
              <div className="mt-2 grid max-h-72 gap-2 overflow-y-auto pr-1">
                {syncResult.sources.map((source) => (
                  <div className="rounded-xl bg-white/80 px-3 py-2 text-[#334155]" key={`${source.name}-${source.ward}`}>
                    <p>{source.name} / {source.ward} / {source.mode}</p>
                    <p>fallback：{source.fallbackExecuted ? "已执行" : "未执行"} / RSS：{source.rssConfigured === false ? "未配置" : "已配置"}</p>
                    <p>抓到链接 {source.fetched} / 无摘要跳过 {source.skippedNoSummary ?? 0} / 命中关键词 {source.matched} / 新增福利 {source.added} / 跳过 {source.skipped}</p>
                    {source.note && <p className="text-[#64748B]">{source.note}</p>}
                    {source.error && <p className="text-red-600">错误：{source.error}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
          {error && <p className="mt-3 rounded-2xl bg-red-50 px-3 py-2 text-xs font-black text-red-700">{error}</p>}
        </section>

        <section className="mt-4 rounded-[28px] border border-white/60 bg-white/80 p-4 shadow-[0_10px_35px_rgba(37,99,235,0.08)]">
          <div className="mb-4 rounded-[22px] border border-blue-100 bg-blue-50/70 p-3 text-xs font-bold leading-5 text-[#475569]">
            <p className="font-black text-[#0F172A]">审核规则</p>
            <p className="mt-1">draft = 待审核，published = 前台展示，archived = 已下架。自动抓取、翻译和整理结果发布前仍建议打开官方链接确认。</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {tabs.map((tab) => (
              <button className={`rounded-2xl border px-3 py-2 text-xs font-black ${status === tab.value ? "admin-primary-button" : "admin-secondary-button"}`} key={tab.value} onClick={() => setStatus(tab.value)} type="button">{tab.label}</button>
            ))}
          </div>
          <label className="mt-3 flex h-11 items-center gap-2 rounded-2xl border border-blue-100 bg-white px-3">
            <Search className="h-4 w-4 text-[#2563EB]" />
            <input className="min-w-0 flex-1 bg-transparent text-sm font-bold outline-none" onChange={(event) => setQuery(event.target.value)} placeholder="标题、区名、分类、来源搜索" value={query} />
          </label>
          <div className="mt-4 rounded-[22px] border border-blue-100 bg-blue-50/40 p-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-black text-[#0F172A]">筛选标签</p>
                <p className="mt-1 text-xs font-bold text-[#64748B]">当前显示 {filtered.length} / {items.length} 条，点标签快速找到想发布的内容。</p>
              </div>
              <button className="admin-secondary-button shrink-0 rounded-2xl px-3 py-2 text-xs font-black" onClick={resetFilters} type="button">重置</button>
            </div>
            <FilterChipRow label="来源区" options={[allLabel, ...wardOptions]} value={wardFilter} onChange={setWardFilter} />
            <FilterChipRow label="分类" options={[allLabel, ...BENEFIT_CATEGORIES]} value={categoryFilter} onChange={setCategoryFilter} />
            <FilterChipRow label="官方来源" options={[allLabel, ...sourceOptions]} value={sourceFilter} onChange={setSourceFilter} />
            <div className="mt-3">
              <p className="text-xs font-black text-[#64748B]">翻译状态</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {translationFilters.map((filter) => (
                  <button className={`selection-chip shrink-0 rounded-full px-3 py-1.5 text-xs font-black ${translationFilter === filter.value ? "is-selected" : ""}`} key={filter.value} onClick={() => setTranslationFilter(filter.value)} type="button">{filter.label}</button>
                ))}
              </div>
            </div>
            <div className="mt-3">
              <p className="text-xs font-black text-[#64748B]">审核辅助</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {reviewFilters.map((filter) => (
                  <button className={`selection-chip shrink-0 rounded-full px-3 py-1.5 text-xs font-black ${reviewFilter === filter.value ? "is-selected" : ""}`} key={filter.value} onClick={() => setReviewFilter(filter.value)} type="button">{filter.label}</button>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-4 grid gap-3">
            {loading ? <p className="text-sm font-black text-[#64748B]">读取中...</p> : null}
            {!loading && filtered.length === 0 && <p className="rounded-2xl border border-blue-100 bg-white p-4 text-sm font-black text-[#64748B]">没有符合当前筛选的福利。可以重置筛选或换一个标签。</p>}
            {filtered.map((item) => (
              <article className="rounded-[24px] border border-blue-100 bg-white p-4 shadow-sm" key={item.id}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="text-base font-black">{item.title}</h3>
                    <p className="mt-1 text-xs font-bold leading-5 text-[#64748B]">来源区：{item.ward || "東京都"} / 官方来源：{item.source_name || "公式"}</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-slate-100 px-2 py-1 text-[10px] font-black text-slate-700">{item.status}</span>
                </div>
                <div className="mt-3 grid gap-2 text-xs font-bold text-[#475569]">
                  <p>地区：{item.area || "-"} / 分类：{item.category || "-"} / 对象：{item.target_people || "-"}</p>
                  <p>申请期限：{item.deadline || "-"}</p>
                  <p>翻译来源：{formatTranslationProvider(item.translation_provider)}{item.translated_at ? ` / ${new Date(item.translated_at).toLocaleString()}` : ""}</p>
                  {item.translation_error && <p className="text-red-600">翻译失败原因：{item.translation_error}</p>}
                  {item.translated_title && <p className="text-[#0F172A]">翻译标题：{item.translated_title}</p>}
                  {item.translated_summary && <p className="leading-5 text-[#0F172A]">翻译摘要：{item.translated_summary}</p>}
                  <p className="leading-5">{item.summary || "暂无摘要"}</p>
                  <a className="break-all text-[#2563EB]" href={item.source_url} rel="noreferrer" target="_blank">官方链接：{item.source_url}</a>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button className="admin-secondary-button rounded-2xl px-3 py-2 text-xs font-black" onClick={() => editItem(item)} type="button">编辑</button>
                  <button className="admin-primary-button rounded-2xl px-3 py-2 text-xs font-black" onClick={() => patchItem(item.id, { status: "published" })} type="button">发布</button>
                  <button className="admin-secondary-button rounded-2xl px-3 py-2 text-xs font-black" onClick={() => patchItem(item.id, { status: "archived" })} type="button">下架</button>
                  <button className="admin-secondary-button rounded-2xl px-3 py-2 text-xs font-black" onClick={() => translateItem(item.id)} type="button">重新翻译</button>
                  <a className="admin-secondary-button inline-flex items-center gap-1 rounded-2xl px-3 py-2 text-xs font-black" href={item.source_url} rel="noreferrer" target="_blank">打开官方链接 <ExternalLink className="h-3.5 w-3.5" /></a>
                  <button className="rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-black text-red-700" onClick={() => deleteItem(item.id)} type="button"><Trash2 className="mr-1 inline h-3.5 w-3.5" />删除</button>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-4 rounded-[28px] border border-white/60 bg-white/80 p-4 shadow-[0_10px_35px_rgba(37,99,235,0.08)]" id="benefit-edit-form">
          <h2 className="text-lg font-black">编辑区</h2>
          {selected ? (
            <div className="mt-3 grid gap-3">
              <AdminInput label="标题" value={form.title ?? ""} onChange={(value) => setForm({ ...form, title: value })} />
              <AdminInput label="摘要" textarea value={form.summary ?? ""} onChange={(value) => setForm({ ...form, summary: value })} />
              <AdminInput label="翻译标题" value={form.translated_title ?? ""} onChange={(value) => setForm({ ...form, translated_title: value })} />
              <AdminInput label="翻译摘要" textarea value={form.translated_summary ?? ""} onChange={(value) => setForm({ ...form, translated_summary: value })} />
              <div className="grid gap-3 sm:grid-cols-2">
                <AdminSelect label="来源区" value={form.ward ?? ""} onChange={(value) => setForm({ ...form, ward: value })} options={wardOptions} />
                <AdminSelect label="分类" value={form.category ?? ""} onChange={(value) => setForm({ ...form, category: value })} options={BENEFIT_CATEGORIES} />
              </div>
              <AdminInput label="对象人群" value={form.target_people ?? ""} onChange={(value) => setForm({ ...form, target_people: value })} />
              <AdminInput label="申请期限" value={form.deadline ?? ""} onChange={(value) => setForm({ ...form, deadline: value })} />
              <AdminInput label="申请链接" value={form.apply_url ?? ""} onChange={(value) => setForm({ ...form, apply_url: value })} />
              <AdminSelect label="状态" value={form.status ?? "draft"} onChange={(value) => setForm({ ...form, status: value as BenefitStatus })} options={["draft", "published", "archived"]} />
              <button className="admin-primary-button inline-flex h-11 items-center justify-center gap-2 rounded-2xl text-sm font-black" onClick={saveForm} type="button">
                <Save className="h-4 w-4" />
                保存
              </button>
            </div>
          ) : (
            <p className="mt-3 text-sm font-bold text-[#64748B]">请选择一条福利进行编辑。</p>
          )}
        </section>
      </div>
    </main>
  );
}

function AdminInput({ label, onChange, textarea, value }: { label: string; onChange: (value: string) => void; textarea?: boolean; value: string }) {
  return (
    <label className="grid gap-1 text-xs font-black text-[#64748B]">
      {label}
      {textarea ? (
        <textarea className="min-h-28 rounded-2xl border border-blue-100 bg-white px-3 py-2 text-sm font-bold text-[#0F172A] outline-none focus:border-[#2563EB]" onChange={(event) => onChange(event.target.value)} value={value} />
      ) : (
        <input className="h-11 rounded-2xl border border-blue-100 bg-white px-3 text-sm font-bold text-[#0F172A] outline-none focus:border-[#2563EB]" onChange={(event) => onChange(event.target.value)} value={value} />
      )}
    </label>
  );
}

function AdminSelect({ label, onChange, options, value }: { label: string; onChange: (value: string) => void; options: readonly string[]; value: string }) {
  return (
    <label className="grid gap-1 text-xs font-black text-[#64748B]">
      {label}
      <select className="h-11 rounded-2xl border border-blue-100 bg-white px-3 text-sm font-bold text-[#0F172A] outline-none focus:border-[#2563EB]" onChange={(event) => onChange(event.target.value)} value={value}>
        <option value="">未设置</option>
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    </label>
  );
}

function FilterChipRow({ label, onChange, options, value }: { label: string; onChange: (value: string) => void; options: readonly string[]; value: string }) {
  return (
    <div className="mt-3">
      <p className="text-xs font-black text-[#64748B]">{label}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {options.map((option) => (
          <button className={`selection-chip shrink-0 rounded-full px-3 py-1.5 text-xs font-black ${value === option ? "is-selected" : ""}`} key={`${label}-${option}`} onClick={() => onChange(option)} type="button">
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}

function formatTranslationProvider(provider: BenefitRecord["translation_provider"]) {
  if (provider === "deepl") return "DeepL";
  if (provider === "openai") return "OpenAI";
  return "原文";
}
