"use client";

import { Edit3, ImagePlus, Plus, RefreshCw, Save, Search, Trash2 } from "lucide-react";
import { type ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
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

type AdminOption = { id: string; label: string };

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
    { key: "map_url", label: "Google Maps 店铺链接", type: "url" },
  ],
};

const defaultForms: Record<AdminTableName, AdminRecord> = {
  friendly_shops: { is_pinned: false, status: "draft" },
  promotion_links: { is_pinned: false, status: "draft" },
  recommended_apps: { category: "shopping", is_pinned: false, status: "draft" },
};

const addressRegions: Array<AdminOption & { children: AdminOption[]; prefix: string }> = [
  { id: "tokyo-23", label: "东京 23 区", prefix: "東京都", children: ["千代田区", "中央区", "港区", "新宿区", "文京区", "台东区", "墨田区", "江东区", "品川区", "目黑区", "大田区", "世田谷区", "涩谷区", "中野区", "杉并区", "丰岛区", "北区", "荒川区", "板桥区", "练马区", "足立区", "葛饰区", "江户川区"].map((label) => ({ id: label, label })) },
  { id: "tokyo-west", label: "东京周边市部", prefix: "東京都", children: ["武藏野市", "三鹰市", "调布市", "府中市", "立川市", "八王子市", "町田市"].map((label) => ({ id: label, label })) },
  { id: "kanagawa", label: "神奈川", prefix: "神奈川県", children: ["横滨市", "川崎市", "相模原市", "藤泽市", "镰仓市"].map((label) => ({ id: label, label })) },
  { id: "chiba", label: "千叶", prefix: "千葉県", children: ["千叶市", "船桥市", "市川市", "松户市", "柏市", "浦安市"].map((label) => ({ id: label, label })) },
  { id: "saitama", label: "埼玉", prefix: "埼玉県", children: ["埼玉市", "川口市", "川越市", "所泽市", "越谷市", "蕨市"].map((label) => ({ id: label, label })) },
];

const shopTypeOptions: AdminOption[] = [
  { id: "restaurant", label: "餐厅" },
  { id: "cafe", label: "咖啡店" },
  { id: "supermarket", label: "超市" },
  { id: "hospital", label: "医院 / 诊所" },
  { id: "realEstate", label: "不动产" },
  { id: "scrivener", label: "行政书士" },
  { id: "mobile", label: "手机卡" },
  { id: "beauty", label: "美容 / 美发" },
  { id: "education", label: "语言 / 教育" },
  { id: "service", label: "生活服务" },
];

const smokingOptions: AdminOption[] = [
  { id: "nonSmoking", label: "禁烟" },
  { id: "smokingAllowed", label: "可吸烟" },
  { id: "smokingArea", label: "有吸烟区" },
];

const closedDayOptions: AdminOption[] = [
  { id: "none", label: "无固定" },
  { id: "mon", label: "周一" },
  { id: "tue", label: "周二" },
  { id: "wed", label: "周三" },
  { id: "thu", label: "周四" },
  { id: "fri", label: "周五" },
  { id: "sat", label: "周六" },
  { id: "sun", label: "周日" },
];

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

  if (table === "friendly_shops") {
    const description = readString(record, ["description"]);
    const address = readString(record, ["address"]);
    const parsedAddress = parseAdminAddress(address);
    const region = addressRegions.find((item) => item.id === parsedAddress.regionId) ?? addressRegions[0];
    const spend = parseAverageSpend(description);
    const hours = parseHours(description);
    const smokingRule = parseDescriptionValue(description, ["吸烟规则", "吸菸規則", "喫煙ルール"]);
    return {
      ...defaultForms[table],
      ...record,
      address_detail: parsedAddress.detail,
      admin_area: parsedAddress.area || readString(record, ["area"]),
      admin_region: region.id,
      admin_region_prefix: region.prefix,
      average_spend_from: spend.from ? formatAdminYen(spend.from) : "",
      average_spend_to: spend.to ? formatAdminYen(spend.to) : "",
      closed_days: hours.closedDays.join("、"),
      description: cleanShopDescription(description),
      hours_close: hours.close,
      hours_open: hours.open,
      is_pinned: Boolean(record.is_pinned),
      map_url: readString(record, ["map_url", "mapUrl"]) || extractGoogleMapsUrl(description),
      phone: readString(record, ["phone"]),
      shop_type: readString(record, ["category"]),
      smoking_rule: smokingRule,
      status: record.status === "published" ? "published" : "draft",
    };
  }

  return {
    ...defaultForms[table],
    ...record,
    is_pinned: Boolean(record.is_pinned),
    map_url: readString(record, ["map_url", "mapUrl"]),
    status: record.status === "published" ? "published" : "draft",
  };
}

function extractGoogleMapsUrl(description: string) {
  const match = description.match(/Google Maps：(\S+)/);
  return match?.[1] ?? "";
}

function parseDescriptionValue(description: string, labels: string[]) {
  const escaped = labels.map((label) => label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
  const match = description.match(new RegExp(`^(?:${escaped})[:：]\\s*(.+)$`, "im"));
  return match?.[1]?.trim() ?? "";
}

function parseAverageSpend(description: string) {
  const raw = parseDescriptionValue(description, ["人均消费", "人均消費", "平均予算", "人均"]);
  const numbers = raw.match(/\d[\d,]*/g) ?? [];
  return {
    from: numbers[0] ?? "",
    to: numbers[1] ?? "",
  };
}

function parseHours(description: string) {
  const raw = parseDescriptionValue(description, ["营业时间", "營業時間", "営業時間"]);
  const times = raw.match(/\d{1,2}:\d{2}/g) ?? [];
  const closedRaw = raw.match(/(?:每周定休日|每週定休日|定休日)[:：]\s*(.+)$/)?.[1]?.trim() ?? "";
  return {
    close: times[1] ?? "22:00",
    closedDays: closedRaw ? closedRaw.split(/[、,，/]/).map((item) => item.trim()).filter(Boolean) : ["无固定"],
    open: times[0] ?? "11:00",
  };
}

function parseAdminAddress(address: string) {
  const region = addressRegions.find((item) => address.startsWith(item.prefix)) ?? addressRegions[0];
  const rest = address.startsWith(region.prefix) ? address.slice(region.prefix.length) : address;
  const area = region.children.find((item) => rest.startsWith(item.label)) ?? region.children[0];
  const detail = area && rest.startsWith(area.label) ? rest.slice(area.label.length).trim() : rest.trim();
  return { area: area?.label ?? "", detail, regionId: region.id };
}

function formatAdminPhone(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.startsWith("03") || digits.startsWith("06")) return [digits.slice(0, 2), digits.slice(2, 6), digits.slice(6, 10)].filter(Boolean).join("-");
  if (digits.length <= 3) return digits;
  if (digits.length <= 7) return [digits.slice(0, 3), digits.slice(3)].filter(Boolean).join("-");
  return [digits.slice(0, 3), digits.slice(3, 7), digits.slice(7, 11)].filter(Boolean).join("-");
}

function formatAdminYen(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  if (!digits) return "";
  return `¥${Number(digits).toLocaleString("ja-JP")}`;
}

function normalizeDigits(value: string, maxLength = 16) {
  return value.replace(/\D/g, "").slice(0, maxLength);
}

function cleanShopDescription(description: string) {
  return description
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !/^(?:来源|來源|标签|標籤|人均消费|人均消費|平均予算|营业时间|營業時間|営業時間|吸烟规则|吸菸規則|喫煙ルール|Google Maps|Google Map|地图|地圖)[:：]/i.test(line))
    .join("\n");
}

function formToPayload(form: AdminRecord, table: AdminTableName, selected: AdminRecord | null) {
  const payload: AdminRecord = { ...form };
  if (selected?.id) payload.id = selected.id;
  payload.is_pinned = Boolean(form.is_pinned);
  payload.status = form.status === "published" ? "published" : "draft";
  delete payload.sort_order;
  if (table === "recommended_apps") payload.name = readString(payload, ["title"]);
  if (table === "friendly_shops") {
    const averageSpend = [readString(payload, ["average_spend_from"]), readString(payload, ["average_spend_to"])].filter(Boolean).join(" - ");
    const closedDays = readString(payload, ["closed_days"]) || "无固定";
    const baseDescription = readString(payload, ["description"]);
    const extraLines = [
      averageSpend ? `人均消费：${averageSpend}` : "",
      readString(payload, ["hours_open"]) && readString(payload, ["hours_close"]) ? `营业时间：${readString(payload, ["hours_open"])} - ${readString(payload, ["hours_close"])} / 每周定休日: ${closedDays}` : "",
      readString(payload, ["smoking_rule"]) ? `吸烟规则：${readString(payload, ["smoking_rule"])}` : "",
    ].filter(Boolean);
    payload.description = [baseDescription, ...extraLines].filter(Boolean).join("\n");
    payload.area = readString(payload, ["admin_area"]) || readString(payload, ["area"]);
    payload.address = `${readString(payload, ["admin_region_prefix"])}${readString(payload, ["admin_area"])}${readString(payload, ["address_detail"])}`.trim() || readString(payload, ["address"]);
    payload.category = readString(payload, ["shop_type"]) || readString(payload, ["category"]);
    payload.phone = formatAdminPhone(readString(payload, ["phone"]));
    delete payload.admin_region;
    delete payload.admin_region_prefix;
    delete payload.admin_area;
    delete payload.address_detail;
    delete payload.average_spend_from;
    delete payload.average_spend_to;
    delete payload.hours_open;
    delete payload.hours_close;
    delete payload.closed_days;
    delete payload.shop_type;
    delete payload.smoking_rule;
  }
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
    window.setTimeout(() => {
      document.getElementById("admin-edit-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
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

  const rejectClaim = async (record: AdminRecord) => {
    if (!record.id || !window.confirm(`确定不通过「${getRecordTitle(record, "friendly_shops")}」这条申请吗？不通过后会删除这条待审核申请。`)) return;
    setLoading(true);
    setMessage("");
    try {
      await adminFetch("friendly_shops", storedPassword, {
        body: JSON.stringify({ id: record.id }),
        method: "DELETE",
      });
      if (selected?.id === record.id) {
        setSelected(null);
        setForm(defaultForms.friendly_shops);
      }
      setMessage("已标记为不通过，并删除这条申请");
      await loadItems("friendly_shops", storedPassword);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "不通过操作失败");
    } finally {
      setLoading(false);
    }
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
      <main className="admin-page min-h-screen bg-[#F6FAFF] px-4 py-5 text-[#0F172A]">
        <div className="mx-auto min-h-screen max-w-[430px] px-1 pb-10">
          <div className="mb-5">
            <BackButton label="返回" />
          </div>
          <section className="rounded-[28px] border border-white/60 bg-white/75 p-5 shadow-[0_18px_45px_rgba(37,99,235,0.10)] backdrop-blur-xl">
            <p className="text-sm font-black text-[#2563EB]">Japan Life Admin</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight">管理后台</h1>
            <p className="mt-3 text-sm font-bold leading-6 text-[#64748B]">输入 ADMIN_PASSWORD 后管理推荐 App、优惠链接和友好店铺。</p>
            <input className="mt-5 h-12 w-full rounded-2xl border border-blue-100 bg-blue-50/70 px-4 text-sm font-bold outline-none focus:border-[#2563EB]" onChange={(event) => setPassword(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") void handleLogin(); }} placeholder="ADMIN_PASSWORD" type="password" value={password} />
            <button className="admin-primary-button mt-3 h-12 w-full rounded-2xl text-sm font-black shadow-sm disabled:opacity-50" disabled={loading} onClick={handleLogin} type="button">
              {loading ? "验证中..." : "进入后台"}
            </button>
            {message && <p className="mt-3 rounded-2xl bg-rose-50 px-4 py-3 text-xs font-bold leading-5 text-rose-700">{message}</p>}
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="admin-page min-h-screen bg-[#F6FAFF] px-4 py-5 text-[#0F172A]">
      <div className="mx-auto min-h-screen max-w-[430px] px-1 pb-10">
        <div className="mb-5 flex items-center justify-between">
          <BackButton label="返回" />
          <button className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-black text-[#334155] shadow-sm" onClick={logout} type="button">退出</button>
        </div>

        <section className="rounded-[28px] border border-white/60 bg-white/75 p-5 shadow-[0_18px_45px_rgba(37,99,235,0.10)] backdrop-blur-xl">
          <p className="text-sm font-black text-[#2563EB]">Japan Life Admin</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight">表单版 CMS</h1>
          <p className="mt-3 text-sm font-bold leading-6 text-[#64748B]">当前模块：{activeModule.hint}</p>
        </section>

        <section className="mt-5 grid grid-cols-3 gap-2">
          {modules.map((item) => (
            <button className={`rounded-2xl border px-3 py-3 text-xs font-black shadow-sm transition-all ${activeTable === item.table ? "admin-primary-button" : "admin-secondary-button"}`} key={item.table} onClick={() => { setActiveTable(item.table); setSelected(null); setForm(defaultForms[item.table]); }} type="button">
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
              <button className="admin-primary-button flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl shadow-sm disabled:opacity-50" disabled={fetchingAppStore} onClick={fetchAppStoreInfo} type="button">
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
                      <p className="mt-1 truncate text-xs font-bold leading-5 text-[#2563EB]">{readString(record, ["map_url", "mapUrl"]) || extractGoogleMapsUrl(readString(record, ["description"])) || "未保存 Google Maps 链接"}</p>
                      <p className="mt-1 line-clamp-3 text-xs font-bold leading-5 text-[#64748B]">{readString(record, ["description"]) || "暂无简介"}</p>
                    </div>
                    <div className="grid shrink-0 gap-2">
                      <button className="admin-primary-button rounded-2xl px-3 py-2 text-xs font-black shadow-sm disabled:opacity-50" disabled={loading} onClick={() => approveClaim(record)} type="button">确认上架</button>
                      <button className="admin-secondary-button rounded-2xl px-3 py-2 text-xs font-black shadow-sm disabled:opacity-50" disabled={loading} onClick={() => startEdit(record)} type="button">编辑</button>
                      <button className="admin-secondary-button rounded-2xl px-3 py-2 text-xs font-black shadow-sm disabled:opacity-50" disabled={loading} onClick={() => rejectClaim(record)} type="button">不通过</button>
                    </div>
                  </div>
                </article>
              ))}
              {!pendingClaims.length && <p className="rounded-2xl bg-blue-50 px-4 py-6 text-center text-sm font-bold text-[#64748B]">暂无待审核申请</p>}
            </div>
          </section>
        )}

        <section id="admin-edit-form" className="mt-5 scroll-mt-4 rounded-[28px] border border-white/60 bg-white/75 p-4 shadow-[0_10px_35px_rgba(37,99,235,0.08)] backdrop-blur-xl">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-black">{selected ? "编辑内容" : "新增内容"}</h2>
            <button className="admin-primary-button flex items-center gap-2 rounded-2xl px-4 py-2 text-xs font-black shadow-sm disabled:opacity-50" disabled={loading} onClick={saveRecord} type="button">
              <Save className="h-4 w-4" />
              保存
            </button>
          </div>

          <div className="mt-4 grid gap-3">
            {activeTable === "friendly_shops" ? (
              <FriendlyShopAdminForm form={form} imageInputRef={imageInputRef} uploadingImage={uploadingImage} updateForm={updateForm} uploadImage={uploadImage} />
            ) : (
              activeFields.map((field) => (
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
                    <AdminImageUpload imageInputRef={imageInputRef} uploadingImage={uploadingImage} uploadImage={uploadImage} />
                  )}
                </div>
              ))
            )}

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
              <button className="flex h-10 w-10 items-center justify-center rounded-2xl border border-blue-200 bg-white text-[#2563EB] shadow-sm" onClick={() => loadItems()} type="button"><RefreshCw className="h-4 w-4" /></button>
              <button className="flex h-10 w-10 items-center justify-center rounded-2xl border border-blue-200 bg-blue-50 text-[#2563EB] shadow-sm" onClick={startCreate} type="button"><Plus className="h-4 w-4" /></button>
            </div>
          </div>

          <div className="mt-4 grid gap-3">
            {items.map((item) => (
              <article className={`rounded-2xl border p-3 transition-all ${item.status === "published" ? "border-blue-100 bg-blue-50/70 shadow-sm" : "border-slate-200 bg-white shadow-sm"}`} key={`${activeTable}-${item.id}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-black">{getRecordTitle(item, activeTable)}</h3>
                    <p className="mt-1 text-xs font-bold text-[#64748B]">{getRecordMeta(item)}</p>
                  </div>
                  <span className={`rounded-full border px-2.5 py-1 text-[11px] font-black ${item.status === "published" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-slate-50 text-slate-700"}`}>{item.is_pinned ? "置顶" : item.status === "published" ? "上架" : "下架"}</span>
                </div>
                <div className="mt-3 grid grid-cols-5 gap-2">
                  <button className="rounded-xl border border-blue-200 bg-white px-2 py-2 text-xs font-black text-[#2563EB] shadow-sm" onClick={() => startEdit(item)} type="button"><Edit3 className="mx-auto h-4 w-4" /></button>
                  <button className={`rounded-xl border px-2 py-2 text-xs font-black shadow-sm ${item.status === "published" ? "border-slate-200 bg-slate-50 text-slate-600" : "border-blue-200 bg-blue-50 text-[#2563EB]"}`} disabled={loading || item.status === "published"} onClick={() => patchRecord(item, { status: "published" })} type="button">上架</button>
                  <button className={`rounded-xl border px-2 py-2 text-xs font-black shadow-sm ${item.status === "published" ? "border-blue-200 bg-white text-[#2563EB]" : "border-slate-200 bg-slate-50 text-slate-600"}`} disabled={loading || item.status !== "published"} onClick={() => patchRecord(item, { status: "draft" })} type="button">下架</button>
                  <button className={`rounded-xl border px-2 py-2 text-xs font-black shadow-sm disabled:opacity-50 ${item.is_pinned ? "border-amber-200 bg-amber-50 text-amber-700" : "border-blue-200 bg-white text-[#2563EB]"}`} disabled={loading || item.status !== "published"} onClick={() => patchRecord(item, { is_pinned: !item.is_pinned })} type="button">{item.is_pinned ? "取消" : "置顶"}</button>
                  <button className="rounded-xl border border-rose-200 bg-rose-50 px-2 py-2 text-xs font-black text-rose-700 shadow-sm" onClick={() => deleteRecord(item)} type="button"><Trash2 className="mx-auto h-4 w-4" /></button>
                </div>
              </article>
            ))}
            {!items.length && <p className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-6 text-center text-sm font-bold text-[#475569]">{loading ? "读取中..." : "暂无数据"}</p>}
          </div>
        </section>
      </div>
    </main>
  );
}

function FriendlyShopAdminForm({
  form,
  imageInputRef,
  updateForm,
  uploadingImage,
  uploadImage,
}: {
  form: AdminRecord;
  imageInputRef: React.RefObject<HTMLInputElement | null>;
  updateForm: (key: string, value: string | boolean) => void;
  uploadingImage: boolean;
  uploadImage: (event: ChangeEvent<HTMLInputElement>) => Promise<void>;
}) {
  const regionId = readString(form, ["admin_region"]) || addressRegions[0].id;
  const region = addressRegions.find((item) => item.id === regionId) ?? addressRegions[0];
  const area = readString(form, ["admin_area"]) || region.children[0]?.label || "";
  const closedDays = (readString(form, ["closed_days"]) || "无固定").split(/[、,，/]/).map((item) => item.trim()).filter(Boolean);

  const toggleClosedDay = (id: string) => {
    const option = closedDayOptions.find((item) => item.id === id);
    if (!option) return;
    if (id === "none") {
      updateForm("closed_days", option.label);
      return;
    }
    const withoutNone = closedDays.filter((item) => item !== "无固定");
    const next = withoutNone.includes(option.label) ? withoutNone.filter((item) => item !== option.label) : [...withoutNone, option.label];
    updateForm("closed_days", next.length ? next.join("、") : "无固定");
  };

  return (
    <>
      <AdminTextInput label="店铺名称" onChange={(value) => updateForm("name", value)} placeholder="例如：池袋中华料理 Sakura" value={readString(form, ["name"])} />
      <AdminTextInput as="textarea" label="简介" onChange={(value) => updateForm("description", value)} placeholder="写给用户看的店铺介绍，不要写系统字段" value={readString(form, ["description"])} />
      <AdminTextInput label="图片 URL" onChange={(value) => updateForm("image_url", value)} placeholder="https://..." value={readString(form, ["image_url"])} />
      <AdminImageUpload imageInputRef={imageInputRef} uploadingImage={uploadingImage} uploadImage={uploadImage} />

      <AdminOptionSection hint="和申请上架一样，先选大区域，再选区 / 市，最后填详细地址。" title="店铺地址">
        <label className="grid min-w-0 gap-1.5">
          <span className="text-xs font-black text-[#64748B]">大区域</span>
          <select
            className="h-10 w-full rounded-2xl border border-blue-100 bg-white/90 px-3 text-sm font-bold text-[#0F172A] outline-none focus:border-[#2563EB]"
            onChange={(event) => {
              const nextRegion = addressRegions.find((item) => item.id === event.target.value) ?? addressRegions[0];
              updateForm("admin_region", nextRegion.id);
              updateForm("admin_region_prefix", nextRegion.prefix);
              updateForm("admin_area", nextRegion.children[0]?.label ?? "");
            }}
            value={region.id}
          >
            {addressRegions.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
          </select>
        </label>
        <label className="grid min-w-0 gap-1.5">
          <span className="text-xs font-black text-[#64748B]">区 / 市</span>
          <select className="h-10 w-full rounded-2xl border border-blue-100 bg-white/90 px-3 text-sm font-bold text-[#0F172A] outline-none focus:border-[#2563EB]" onChange={(event) => updateForm("admin_area", event.target.value)} value={area}>
            {region.children.map((item) => <option key={item.id} value={item.label}>{item.label}</option>)}
          </select>
        </label>
        <AdminTextInput label="详细地址" onChange={(value) => updateForm("address_detail", value)} placeholder="1-2-3 Japan Life ビル 2F" value={readString(form, ["address_detail"])} />
      </AdminOptionSection>

      <AdminOptionSection hint="人均和营业时间会自动写进简介，并在前台店铺卡片的信息格里显示。" title="展示信息">
        <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2">
          <AdminTextInput label="人均最低" onChange={(value) => updateForm("average_spend_from", formatAdminYen(value))} placeholder="¥1,000" value={readString(form, ["average_spend_from"])} />
          <span className="pt-6 text-xs font-black text-[#64748B]">-</span>
          <AdminTextInput label="人均最高" onChange={(value) => updateForm("average_spend_to", formatAdminYen(value))} placeholder="¥2,000" value={readString(form, ["average_spend_to"])} />
        </div>
        <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2">
          <AdminTextInput label="开始" onChange={(value) => updateForm("hours_open", value)} type="time" value={readString(form, ["hours_open"]) || "11:00"} />
          <span className="pt-6 text-xs font-black text-[#64748B]">-</span>
          <AdminTextInput label="结束" onChange={(value) => updateForm("hours_close", value)} type="time" value={readString(form, ["hours_close"]) || "22:00"} />
        </div>
        <div className="rounded-[20px] border border-blue-100 bg-white p-3">
          <p className="text-xs font-black text-[#0F172A]">每周定休日</p>
          <div className="mt-3 grid grid-cols-4 gap-2">
            {closedDayOptions.map((option) => (
              <AdminTagButton active={closedDays.includes(option.label)} key={option.id} onClick={() => toggleClosedDay(option.id)}>
                {option.label}
              </AdminTagButton>
            ))}
          </div>
        </div>
      </AdminOptionSection>

      <AdminTextInput label="店铺电话" onChange={(value) => updateForm("phone", formatAdminPhone(value))} placeholder="0312345678" value={readString(form, ["phone"])} />
      <AdminTextInput label="官网（可选）" onChange={(value) => updateForm("website_url", value)} placeholder="https://example.com" value={readString(form, ["website_url"])} />
      <AdminTextInput label="Google Maps 店铺链接" onChange={(value) => updateForm("map_url", value)} placeholder="https://maps.app.goo.gl/..." value={readString(form, ["map_url"])} />

      <AdminOptionSection hint="选择一个店铺类型，用于前台分类和筛选。" title="店铺类型">
        <div className="flex flex-wrap gap-2">
          {shopTypeOptions.map((option) => (
            <AdminTagButton active={readString(form, ["shop_type", "category"]) === option.id || readString(form, ["shop_type", "category"]) === option.label} key={option.id} onClick={() => updateForm("shop_type", option.id)}>
              {option.label}
            </AdminTagButton>
          ))}
        </div>
      </AdminOptionSection>

      <AdminOptionSection hint="请选择明确规则，提交后会显示给用户参考。" title="吸烟规则">
        <div className="flex flex-wrap gap-2">
          {smokingOptions.map((option) => (
            <AdminTagButton active={readString(form, ["smoking_rule"]) === option.label || readString(form, ["smoking_rule"]) === option.id} key={option.id} onClick={() => updateForm("smoking_rule", option.label)}>
              {option.label}
            </AdminTagButton>
          ))}
        </div>
      </AdminOptionSection>
    </>
  );
}

function AdminImageUpload({ imageInputRef, uploadingImage, uploadImage }: { imageInputRef: React.RefObject<HTMLInputElement | null>; uploadingImage: boolean; uploadImage: (event: ChangeEvent<HTMLInputElement>) => Promise<void> }) {
  return (
    <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-3">
      <input ref={imageInputRef} accept="image/gif,image/jpeg,image/png,image/webp" className="hidden" onChange={uploadImage} type="file" />
      <button className="admin-primary-button admin-upload-button flex h-11 w-full items-center justify-center gap-2 rounded-2xl text-sm font-black shadow-sm disabled:opacity-50" disabled={uploadingImage} onClick={() => imageInputRef.current?.click()} type="button">
        <ImagePlus className="h-4 w-4" />
        {uploadingImage ? "上传中..." : "上传图片并填入 URL"}
      </button>
      <p className="mt-2 text-xs font-bold leading-5 text-[#64748B]">使用 Supabase Storage / public-images，也可以继续手动输入图片 URL。</p>
    </div>
  );
}

function AdminTextInput({ as, label, onChange, placeholder, type = "text", value }: { as?: "textarea"; label: string; onChange: (value: string) => void; placeholder?: string; type?: string; value: string }) {
  return (
    <label className="grid min-w-0 gap-1.5">
      <span className="text-xs font-black text-[#64748B]">{label}</span>
      {as === "textarea" ? (
        <textarea className="min-h-24 rounded-2xl border border-blue-100 bg-white/90 px-4 py-3 text-sm font-bold text-[#0F172A] outline-none placeholder:text-slate-400 focus:border-[#2563EB]" onChange={(event) => onChange(event.target.value)} placeholder={placeholder} value={value} />
      ) : (
        <input className="h-10 rounded-2xl border border-blue-100 bg-white/90 px-3 text-sm font-bold text-[#0F172A] outline-none placeholder:text-slate-400 focus:border-[#2563EB]" onChange={(event) => onChange(event.target.value)} placeholder={placeholder} type={type} value={value} />
      )}
    </label>
  );
}

function AdminOptionSection({ children, hint, title }: { children: ReactNode; hint: string; title: string }) {
  return (
    <section className="grid gap-3 rounded-[22px] border border-blue-100 bg-sky-50/70 p-3">
      <div>
        <p className="text-xs font-black text-[#0F172A]">{title}</p>
        <p className="mt-1 text-xs font-bold leading-5 text-[#64748B]">{hint}</p>
      </div>
      {children}
    </section>
  );
}

function AdminTagButton({ active, children, onClick }: { active: boolean; children: ReactNode; onClick: () => void }) {
  return (
    <button className={`claim-tag-button rounded-full border px-3 py-1.5 text-xs font-black transition-all duration-300 active:scale-[0.98] ${active ? "is-active border-[#2563EB] bg-blue-50 text-[#1D4ED8] shadow-sm" : "border-white/70 bg-white/80 text-[#64748B] shadow-sm"}`} onClick={onClick} type="button">
      {children}
    </button>
  );
}
