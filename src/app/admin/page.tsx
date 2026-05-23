"use client";

import { Edit3, ImagePlus, Plus, RefreshCw, Save, Search, Trash2 } from "lucide-react";
import { type ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { BackButton } from "@/components/BackButton";
import type { AdminTableName } from "@/lib/supabase";

type AdminRecord = Record<string, unknown> & {
  id?: string | number;
  is_pinned?: boolean;
  name?: string;
  status?: string;
  title?: string;
};

type AdminResponse = {
  error?: string;
  item?: AdminRecord;
  items?: AdminRecord[];
  publicUrl?: string;
};

type FieldConfig = {
  key: string;
  label: string;
  placeholder?: string;
  type?: "text" | "textarea" | "url";
};

const sessionKey = "japan-life-admin-auth";
const imageBucketName = "public-images";
const claimSourceMarker = "来源：店铺上架申请";

const modules: Array<{ table: AdminTableName; label: string; hint: string }> = [
  { table: "recommended_apps", label: "推荐 App", hint: "管理 iOS App 推荐内容" },
  { table: "promotion_links", label: "优惠链接", hint: "管理优惠、推广和合作链接" },
  { table: "friendly_shops", label: "友好店铺", hint: "管理店铺和商家申请审核" },
];

const formFields: Record<AdminTableName, FieldConfig[]> = {
  recommended_apps: [
    { key: "title", label: "标题", placeholder: "例如：Google Maps" },
    { key: "description", label: "推荐理由", placeholder: "写给用户看的简短推荐理由", type: "textarea" },
    { key: "image_url", label: "图片 URL", placeholder: "https://...", type: "url" },
    { key: "app_url", label: "App Store 链接", placeholder: "https://apps.apple.com/...", type: "url" },
    { key: "category", label: "分类", placeholder: "transport / payment / shopping ..." },
  ],
  promotion_links: [
    { key: "title", label: "标题" },
    { key: "description", label: "简介", type: "textarea" },
    { key: "image_url", label: "图片 URL", type: "url" },
    { key: "link_url", label: "链接 URL", type: "url" },
    { key: "coupon_code", label: "优惠码" },
  ],
  friendly_shops: [
    { key: "name", label: "店名" },
    { key: "description", label: "简介", type: "textarea" },
    { key: "image_url", label: "图片 URL", type: "url" },
    { key: "address", label: "地址" },
    { key: "area", label: "地区" },
    { key: "category", label: "分类" },
    { key: "phone", label: "电话" },
    { key: "website_url", label: "官网", type: "url" },
  ],
};

const defaultForms: Record<AdminTableName, AdminRecord> = {
  friendly_shops: { is_pinned: false, status: "draft" },
  promotion_links: { is_pinned: false, status: "draft" },
  recommended_apps: { category: "shopping", is_pinned: false, status: "draft" },
};

function readString(record: AdminRecord, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string") return value;
    if (typeof value === "number") return String(value);
    if (typeof value === "boolean") return value ? "true" : "false";
  }
  return "";
}

function getRecordTitle(record: AdminRecord, table: AdminTableName) {
  if (table === "friendly_shops") return readString(record, ["name", "title", "id"]) || "未命名店铺";
  return readString(record, ["title", "name", "id"]) || "未命名内容";
}

function getRecordMeta(record: AdminRecord) {
  const status = record.status === "published" ? "上架" : "下架";
  return `${status}${record.is_pinned ? " / 置顶" : ""}`;
}

function getImageUrl(record: AdminRecord) {
  return readString(record, ["image_url", "icon_url", "iconUrl"]);
}

function recordToForm(record: AdminRecord, table: AdminTableName): AdminRecord {
  if (table === "recommended_apps") {
    return {
      ...record,
      app_url: readString(record, ["app_url", "app_store_url", "appStoreUrl", "official_url", "officialUrl"]),
      category: readString(record, ["category"]),
      description: readString(record, ["description", "short_description", "shortDescriptionZhCN", "descriptionZhCN"]),
      image_url: readString(record, ["image_url", "icon_url", "iconUrl"]),
      is_pinned: Boolean(record.is_pinned),
      status: record.status === "published" ? "published" : "draft",
      title: readString(record, ["title", "name"]),
    };
  }

  return {
    ...defaultForms[table],
    ...record,
    is_pinned: Boolean(record.is_pinned),
    status: record.status === "published" ? "published" : "draft",
  };
}

function formToPayload(form: AdminRecord, table: AdminTableName, selected: AdminRecord | null) {
  const payload: AdminRecord = { ...form };
  if (selected?.id) payload.id = selected.id;
  payload.is_pinned = Boolean(form.is_pinned);
  payload.status = form.status === "published" ? "published" : "draft";
  delete payload.sort_order;
  if (table === "recommended_apps") payload.name = readString(payload, ["title"]);
  return payload;
}

async function parseJsonResponse(response: Response, url: string): Promise<AdminResponse> {
  const text = await response.text();
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    throw new Error(`API 返回的不是 JSON。URL: ${url}，状态：${response.status} ${response.statusText}`);
  }
  const data = text ? (JSON.parse(text) as AdminResponse) : {};
  if (!response.ok) throw new Error(`API 错误 ${response.status}: ${data.error ?? "Unknown error"}`);
  return data;
}

export default function AdminPage() {
  const [activeTable, setActiveTable] = useState<AdminTableName>("recommended_apps");
  const [appStoreQuery, setAppStoreQuery] = useState("");
  const [fetchingAppStore, setFetchingAppStore] = useState(false);
  const [form, setForm] = useState<AdminRecord>(defaultForms.recommended_apps);
  const [items, setItems] = useState<AdminRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [message, setMessage] = useState("");
  const [password, setPassword] = useState("");
  const [selected, setSelected] = useState<AdminRecord | null>(null);
  const [storedPassword, setStoredPassword] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const imageInputRef = useRef<HTMLInputElement | null>(null);

  const activeModule = useMemo(() => modules.find((item) => item.table === activeTable) ?? modules[0], [activeTable]);
  const activeFields = formFields[activeTable];
  const previewImage = getImageUrl(form);
  const pendingClaims = useMemo(() => (activeTable === "friendly_shops" ? items.filter((item) => item.status !== "published" && readString(item, ["description"]).includes(claimSourceMarker)) : []), [activeTable, items]);

  useEffect(() => {
    const saved = window.sessionStorage.getItem(sessionKey);
    if (saved) {
      setStoredPassword(saved);
      setLoggedIn(true);
    }
  }, []);

  useEffect(() => {
    if (!loggedIn || !storedPassword) return;
    void loadItems(activeTable, storedPassword);
  }, [activeTable, loggedIn, storedPassword]);

  const adminFetch = async (table: AdminTableName, authPassword: string, init?: RequestInit) => {
    const url = `/api/admin/${table}/`;
    const response = await fetch(url, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        "x-admin-password": authPassword,
        ...(init?.headers ?? {}),
      },
    });
    return parseJsonResponse(response, url);
  };

  const loadItems = async (table = activeTable, authPassword = storedPassword) => {
    if (!authPassword) return;
    setLoading(true);
    setMessage("");
    try {
      const data = await adminFetch(table, authPassword);
      setItems(data.items ?? []);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "读取失败");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!password.trim()) return;
    setLoading(true);
    setMessage("");
    try {
      const data = await adminFetch(activeTable, password);
      window.sessionStorage.setItem(sessionKey, password);
      setStoredPassword(password);
      setLoggedIn(true);
      setItems(data.items ?? []);
    } catch (error) {
      setStoredPassword("");
      setMessage(error instanceof Error ? error.message : "登录失败");
    } finally {
      setLoading(false);
    }
  };

  const fetchAppStoreInfo = async () => {
    if (!appStoreQuery.trim()) return;
    setFetchingAppStore(true);
    setMessage("");
    try {
      const url = "/api/admin/app-store/";
      const response = await fetch(url, {
        body: JSON.stringify({ query: appStoreQuery }),
        headers: {
          "Content-Type": "application/json",
          "x-admin-password": storedPassword,
        },
        method: "POST",
      });
      const data = await parseJsonResponse(response, url);
      if (!data.item) throw new Error("没有找到 App Store 信息");
      setActiveTable("recommended_apps");
      setSelected(null);
      setForm((current) => ({ ...defaultForms.recommended_apps, ...current, ...data.item, status: "draft" }));
      setMessage("已从 App Store 自动填充，请确认后保存。");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "抓取失败");
    } finally {
      setFetchingAppStore(false);
    }
  };

  const startCreate = () => {
    setSelected(null);
    setForm(defaultForms[activeTable]);
  };

  const startEdit = (record: AdminRecord) => {
    setSelected(record);
    setForm(recordToForm(record, activeTable));
  };

  const updateForm = (key: string, value: string | boolean) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const uploadImage = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (event.target) event.target.value = "";
    if (!file) return;
    setUploadingImage(true);
    setMessage("");
    try {
      const body = new FormData();
      body.append("file", file);
      const url = "/api/admin/upload-image/";
      const response = await fetch(url, {
        body,
        headers: { "x-admin-password": storedPassword },
        method: "POST",
      });
      const data = await parseJsonResponse(response, url);
      if (!data.publicUrl) throw new Error("上传成功，但没有返回图片 URL。");
      updateForm("image_url", data.publicUrl);
      setMessage(`图片已上传到 ${imageBucketName}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "图片上传失败");
    } finally {
      setUploadingImage(false);
    }
  };

  const saveRecord = async () => {
    setLoading(true);
    setMessage("");
    try {
      await adminFetch(activeTable, storedPassword, {
        body: JSON.stringify(formToPayload(form, activeTable, selected)),
        method: selected?.id ? "PATCH" : "POST",
      });
      setMessage("已保存");
      setSelected(null);
      setForm(defaultForms[activeTable]);
      await loadItems();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "保存失败");
    } finally {
      setLoading(false);
    }
  };

  const patchRecord = async (record: AdminRecord, patch: AdminRecord) => {
    if (!record.id) return;
    setLoading(true);
    setMessage("");
    try {
      await adminFetch(activeTable, storedPassword, {
        body: JSON.stringify({ id: record.id, ...patch }),
        method: "PATCH",
      });
      setMessage("已更新");
      await loadItems();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "更新失败");
    } finally {
      setLoading(false);
    }
  };

  const deleteRecord = async (record: AdminRecord) => {
    if (!record.id || !window.confirm(`确定删除「${getRecordTitle(record, activeTable)}」吗？`)) return;
    setLoading(true);
    setMessage("");
    try {
      await adminFetch(activeTable, storedPassword, {
        body: JSON.stringify({ id: record.id }),
        method: "DELETE",
      });
      setMessage("已删除");
      await loadItems();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "删除失败");
    } finally {
      setLoading(false);
    }
  };

  const approveClaim = async (record: AdminRecord) => {
    if (!record.id) return;
    await patchRecord(record, { status: "published" });
  };

  const logout = () => {
    window.sessionStorage.removeItem(sessionKey);
    setLoggedIn(false);
    setStoredPassword("");
    setPassword("");
    setItems([]);
  };

  if (!loggedIn) {
    return (
      <main className="min-h-screen bg-[#F6FAFF] px-4 py-5 text-[#0F172A]">
        <div className="mx-auto min-h-screen max-w-[430px] px-1 pb-10">
          <div className="mb-5">
            <BackButton label="返回" />
          </div>
          <section className="rounded-[28px] border border-white/60 bg-white/75 p-5 shadow-[0_18px_45px_rgba(37,99,235,0.10)] backdrop-blur-xl">
            <p className="text-sm font-black text-[#2563EB]">Japan Life Admin</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight">管理后台</h1>
            <p className="mt-3 text-sm font-bold leading-6 text-[#64748B]">输入 ADMIN_PASSWORD 后管理推荐 App、优惠链接和友好店铺。</p>
            <input className="mt-5 h-12 w-full rounded-2xl border border-blue-100 bg-blue-50/70 px-4 text-sm font-bold outline-none focus:border-[#2563EB]" onChange={(event) => setPassword(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") void handleLogin(); }} placeholder="ADMIN_PASSWORD" type="password" value={password} />
            <button className="mt-3 h-12 w-full rounded-2xl bg-[#2563EB] text-sm font-black text-white shadow-sm disabled:opacity-50" disabled={loading} onClick={handleLogin} type="button">
              {loading ? "验证中..." : "进入后台"}
            </button>
            {message && <p className="mt-3 rounded-2xl bg-rose-50 px-4 py-3 text-xs font-bold leading-5 text-rose-700">{message}</p>}
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F6FAFF] px-4 py-5 text-[#0F172A]">
      <div className="mx-auto min-h-screen max-w-[430px] px-1 pb-10">
        <div className="mb-5 flex items-center justify-between">
          <BackButton label="返回" />
          <button className="rounded-full border border-white/70 bg-white/75 px-4 py-2 text-xs font-black text-[#64748B] shadow-sm" onClick={logout} type="button">退出</button>
        </div>

        <section className="rounded-[28px] border border-white/60 bg-white/75 p-5 shadow-[0_18px_45px_rgba(37,99,235,0.10)] backdrop-blur-xl">
          <p className="text-sm font-black text-[#2563EB]">Japan Life Admin</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight">表单版 CMS</h1>
          <p className="mt-3 text-sm font-bold leading-6 text-[#64748B]">当前模块：{activeModule.hint}</p>
        </section>

        <section className="mt-5 grid grid-cols-3 gap-2">
          {modules.map((item) => (
            <button className={`rounded-2xl px-3 py-3 text-xs font-black shadow-sm transition-all ${activeTable === item.table ? "bg-[#2563EB] text-white" : "border border-white/70 bg-white/75 text-[#0F172A]"}`} key={item.table} onClick={() => { setActiveTable(item.table); setSelected(null); setForm(defaultForms[item.table]); }} type="button">
              {item.label}
            </button>
          ))}
        </section>

        {activeTable === "recommended_apps" && (
          <section className="mt-5 rounded-[28px] border border-white/60 bg-white/75 p-4 shadow-[0_10px_35px_rgba(37,99,235,0.08)] backdrop-blur-xl">
            <h2 className="text-lg font-black">从 App Store 自动抓取</h2>
            <p className="mt-1 text-xs font-bold leading-5 text-[#64748B]">输入 App Store 链接、App ID 或名称，自动填充图标和下载链接，推荐理由仍由你手动填写。</p>
            <div className="mt-3 flex gap-2">
              <input className="h-12 min-w-0 flex-1 rounded-2xl border border-blue-100 bg-blue-50/70 px-4 text-sm font-bold outline-none focus:border-[#2563EB]" onChange={(event) => setAppStoreQuery(event.target.value)} placeholder="https://apps.apple.com/.../id123" value={appStoreQuery} />
              <button className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#2563EB] text-white disabled:opacity-50" disabled={fetchingAppStore} onClick={fetchAppStoreInfo} type="button">
                <Search className="h-5 w-5" />
              </button>
            </div>
          </section>
        )}

        {activeTable === "friendly_shops" && (
          <section className="mt-5 rounded-[28px] border border-white/60 bg-white/75 p-4 shadow-[0_10px_35px_rgba(37,99,235,0.08)] backdrop-blur-xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-black">待审核申请</h2>
                <p className="mt-1 text-xs font-bold leading-5 text-[#64748B]">商家在“店铺上架申请”提交后会出现在这里，确认后直接上架。</p>
              </div>
              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-[#2563EB]">{pendingClaims.length}</span>
            </div>
            <div className="mt-4 grid gap-3">
              {pendingClaims.map((record) => (
                <article className="rounded-2xl border border-blue-100 bg-blue-50/70 p-3" key={`claim-${record.id}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate text-sm font-black">{getRecordTitle(record, "friendly_shops")}</h3>
                      <p className="mt-1 text-xs font-bold leading-5 text-[#64748B]">{readString(record, ["address"]) || "未填写地址"}</p>
                      <p className="mt-1 line-clamp-3 text-xs font-bold leading-5 text-[#64748B]">{readString(record, ["description"]) || "暂无简介"}</p>
                    </div>
                    <button className="shrink-0 rounded-2xl bg-emerald-500 px-3 py-2 text-xs font-black text-white disabled:opacity-50" disabled={loading} onClick={() => approveClaim(record)} type="button">确认上架</button>
                  </div>
                </article>
              ))}
              {!pendingClaims.length && <p className="rounded-2xl bg-blue-50 px-4 py-6 text-center text-sm font-bold text-[#64748B]">暂无待审核申请</p>}
            </div>
          </section>
        )}

        <section className="mt-5 rounded-[28px] border border-white/60 bg-white/75 p-4 shadow-[0_10px_35px_rgba(37,99,235,0.08)] backdrop-blur-xl">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-black">{selected ? "编辑内容" : "新增内容"}</h2>
            <button className="flex items-center gap-2 rounded-2xl bg-[#2563EB] px-4 py-2 text-xs font-black text-white disabled:opacity-50" disabled={loading} onClick={saveRecord} type="button">
              <Save className="h-4 w-4" />
              保存
            </button>
          </div>

          <div className="mt-4 grid gap-3">
            {activeFields.map((field) => (
              <div className="grid gap-1.5" key={field.key}>
                <label className="grid gap-1.5">
                  <span className="text-xs font-black text-[#64748B]">{field.label}</span>
                  {field.type === "textarea" ? (
                    <textarea className="min-h-24 rounded-2xl border border-blue-100 bg-blue-50/70 px-4 py-3 text-sm font-bold outline-none focus:border-[#2563EB]" onChange={(event) => updateForm(field.key, event.target.value)} placeholder={field.placeholder} value={readString(form, [field.key])} />
                  ) : (
                    <input className="h-12 rounded-2xl border border-blue-100 bg-blue-50/70 px-4 text-sm font-bold outline-none focus:border-[#2563EB]" onChange={(event) => updateForm(field.key, event.target.value)} placeholder={field.placeholder} type={field.type === "url" ? "url" : "text"} value={readString(form, [field.key])} />
                  )}
                </label>

                {field.key === "image_url" && (
                  <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-3">
                    <input ref={imageInputRef} accept="image/gif,image/jpeg,image/png,image/webp" className="hidden" onChange={uploadImage} type="file" />
                    <button className="flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-[#2563EB] text-sm font-black text-white shadow-sm disabled:opacity-50" disabled={uploadingImage} onClick={() => imageInputRef.current?.click()} type="button">
                      <ImagePlus className="h-4 w-4" />
                      {uploadingImage ? "上传中..." : "上传图片并填入 URL"}
                    </button>
                    <p className="mt-2 text-xs font-bold leading-5 text-[#64748B]">使用 Supabase Storage / public-images，也可以继续手动输入图片 URL。</p>
                  </div>
                )}
              </div>
            ))}

            {previewImage && (
              <div className="overflow-hidden rounded-2xl border border-blue-100 bg-blue-50/70 p-3">
                <p className="mb-2 text-xs font-black text-[#64748B]">图片预览</p>
                <img alt="" className="h-40 w-full rounded-2xl object-cover" src={previewImage} />
              </div>
            )}
          </div>

          {message && <p className="mt-3 rounded-2xl bg-white px-4 py-3 text-xs font-bold leading-5 text-[#2563EB]">{message}</p>}
        </section>

        <section className="mt-5 rounded-[28px] border border-white/60 bg-white/75 p-4 shadow-[0_10px_35px_rgba(37,99,235,0.08)] backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black">{activeModule.label}</h2>
            <div className="flex gap-2">
              <button className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-[#2563EB]" onClick={() => loadItems()} type="button"><RefreshCw className="h-4 w-4" /></button>
              <button className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700" onClick={startCreate} type="button"><Plus className="h-4 w-4" /></button>
            </div>
          </div>

          <div className="mt-4 grid gap-3">
            {items.map((item) => (
              <article className={`rounded-2xl border p-3 transition-all ${item.status === "published" ? "border-blue-100 bg-blue-50/70 shadow-sm" : "border-slate-200 bg-slate-100/80 opacity-75"}`} key={`${activeTable}-${item.id}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-black">{getRecordTitle(item, activeTable)}</h3>
                    <p className="mt-1 text-xs font-bold text-[#64748B]">{getRecordMeta(item)}</p>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-[11px] font-black ${item.status === "published" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>{item.is_pinned ? "置顶" : item.status === "published" ? "上架" : "下架"}</span>
                </div>
                <div className="mt-3 grid grid-cols-5 gap-2">
                  <button className="rounded-xl bg-white px-2 py-2 text-xs font-black text-[#2563EB]" onClick={() => startEdit(item)} type="button"><Edit3 className="mx-auto h-4 w-4" /></button>
                  <button className={`rounded-xl px-2 py-2 text-xs font-black shadow-sm ${item.status === "published" ? "bg-emerald-100 text-emerald-700" : "bg-white text-emerald-700"}`} disabled={loading || item.status === "published"} onClick={() => patchRecord(item, { status: "published" })} type="button">上架</button>
                  <button className={`rounded-xl px-2 py-2 text-xs font-black shadow-sm ${item.status === "published" ? "bg-white text-slate-600" : "bg-slate-500 text-white"}`} disabled={loading || item.status !== "published"} onClick={() => patchRecord(item, { status: "draft" })} type="button">下架</button>
                  <button className="rounded-xl bg-white px-2 py-2 text-xs font-black text-[#2563EB] shadow-sm disabled:opacity-45" disabled={loading || item.status !== "published"} onClick={() => patchRecord(item, { is_pinned: !item.is_pinned })} type="button">{item.is_pinned ? "取消" : "置顶"}</button>
                  <button className="rounded-xl bg-white px-2 py-2 text-xs font-black text-rose-600" onClick={() => deleteRecord(item)} type="button"><Trash2 className="mx-auto h-4 w-4" /></button>
                </div>
              </article>
            ))}
            {!items.length && <p className="rounded-2xl bg-blue-50 px-4 py-6 text-center text-sm font-bold text-[#64748B]">{loading ? "读取中..." : "暂无数据"}</p>}
          </div>
        </section>
      </div>
    </main>
  );
}
