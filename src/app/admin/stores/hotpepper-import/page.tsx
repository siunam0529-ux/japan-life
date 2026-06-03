"use client";

import { AlertCircle, ArrowLeft, CheckCircle2, Download, ExternalLink, Loader2, Search, Upload } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { HotpepperPreviewShop } from "@/lib/hotpepper/import";

const sessionKey = "japan-life-admin-auth";

const genreOptions = [
  { code: "", label: "全部", hint: "不限类型" },
  { code: "G001", label: "居酒屋", hint: "居酒屋・酒场" },
  { code: "G008", label: "焼肉", hint: "烤肉・ホルモン" },
  { code: "G013", label: "ラーメン", hint: "拉面" },
  { code: "G014", label: "カフェ", hint: "咖啡・甜点" },
  { code: "G003", label: "創作料理", hint: "创作料理" },
  { code: "G004", label: "和食", hint: "寿司・日料" },
  { code: "G005", label: "洋食", hint: "西餐" },
  { code: "G007", label: "中華", hint: "中华料理" },
  { code: "G002", label: "ダイニング", hint: "餐酒馆" },
  { code: "G011", label: "カラオケ", hint: "卡拉 OK" },
  { code: "G012", label: "バー", hint: "Bar" },
] as const;

type HotpepperArea = {
  code: string;
  name: string;
};

type SearchItem = HotpepperPreviewShop & {
  selected: boolean;
};

function formatAdminFetchError(error: unknown) {
  if (error instanceof TypeError && error.message === "Failed to fetch") {
    return "后台接口没有响应。请确认当前页面对应的本地/线上服务正在运行，端口没有换，网络没有被中断。";
  }
  return error instanceof Error ? error.message : String(error);
}

export default function AdminHotpepperImportPage() {
  const [password, setPassword] = useState("");
  const [keyword, setKeyword] = useState("");
  const [middleArea, setMiddleArea] = useState("");
  const [smallArea, setSmallArea] = useState("");
  const [middleAreas, setMiddleAreas] = useState<HotpepperArea[]>([]);
  const [smallAreas, setSmallAreas] = useState<HotpepperArea[]>([]);
  const [areaLoading, setAreaLoading] = useState(false);
  const [genre, setGenre] = useState<string>(genreOptions[0].code);
  const [count, setCount] = useState("20");
  const [items, setItems] = useState<SearchItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const sessionPassword = window.sessionStorage.getItem(sessionKey) ?? "";
    const localPassword = window.localStorage.getItem(sessionKey) ?? "";
    setPassword(sessionPassword || localPassword);
  }, []);

  useEffect(() => {
    if (!password) return;
    void loadMiddleAreas(password);
  }, [password]);

  useEffect(() => {
    if (!password || !middleArea) {
      setSmallAreas([]);
      setSmallArea("");
      return;
    }
    void loadSmallAreas(password, middleArea);
  }, [middleArea, password]);

  const stats = useMemo(() => {
    const total = items.length;
    const exists = items.filter((item) => item.exists).length;
    const warnings = items.filter((item) => item.warnings.length > 0).length;
    const selectable = items.filter((item) => !item.exists).length;
    const selected = items.filter((item) => item.selected && !item.exists).length;
    return { exists, selectable, selected, total, warnings };
  }, [items]);

  const adminFetch = async <T,>(url: string, init?: RequestInit): Promise<T> => {
    let response: Response;
    try {
      response = await fetch(url, {
        ...init,
        headers: {
          "Content-Type": "application/json",
          "x-admin-password": password,
          ...(init?.headers ?? {}),
        },
      });
    } catch (error) {
      throw new Error(formatAdminFetchError(error));
    }
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(typeof data.error === "string" ? data.error : `接口错误 ${response.status}`);
    window.sessionStorage.setItem(sessionKey, password);
    window.localStorage.setItem(sessionKey, password);
    return data as T;
  };

  async function loadMiddleAreas(authPassword: string) {
    setAreaLoading(true);
    setError("");
    try {
      const data = await fetchAreaOptions("/api/admin/hotpepper/areas/", authPassword);
      setMiddleAreas(data);
      setMiddleArea((current) => current || data[0]?.code || "");
    } catch (nextError) {
      setError(formatAdminFetchError(nextError));
      setMiddleAreas([]);
      setSmallAreas([]);
    } finally {
      setAreaLoading(false);
    }
  }

  async function loadSmallAreas(authPassword: string, nextMiddleArea: string) {
    setAreaLoading(true);
    setError("");
    try {
      const data = await fetchAreaOptions(`/api/admin/hotpepper/areas/?middle_area=${encodeURIComponent(nextMiddleArea)}`, authPassword);
      setSmallAreas(data);
      setSmallArea((current) => (data.some((area) => area.code === current) ? current : ""));
    } catch (nextError) {
      setError(formatAdminFetchError(nextError));
      setSmallAreas([]);
      setSmallArea("");
    } finally {
      setAreaLoading(false);
    }
  }

  async function fetchAreaOptions(url: string, authPassword: string) {
    let response: Response;
    try {
      response = await fetch(url, { headers: { "x-admin-password": authPassword } });
    } catch (error) {
      throw new Error(formatAdminFetchError(error));
    }
    const data = (await response.json().catch(() => ({}))) as { areas?: HotpepperArea[]; error?: string };
    if (!response.ok) throw new Error(data.error || `HotPepper 地区接口错误 ${response.status}`);
    return data.areas ?? [];
  }

  const runSearch = async (targetCount: number) => {
    if (!password) {
      setError("请先输入管理员密码。");
      return;
    }
    if (!middleArea) {
      setError("请先选择 HotPepper 官方中エリア。");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");
    try {
      const collected: SearchItem[] = [];
      let start = 1;

      while (collected.length < targetCount) {
        const stepCount = Math.min(100, targetCount - collected.length);
        const params = new URLSearchParams({
          count: String(stepCount),
          genre,
          keyword,
          middle_area: middleArea,
          small_area: smallArea,
          start: String(start),
        });
        const data = await adminFetch<{ items?: HotpepperPreviewShop[] }>(`/api/admin/hotpepper/search/?${params.toString()}`);
        const pageItems = (data.items ?? []).map((item) => ({ ...item, selected: !item.exists }));
        const before = collected.length;
        for (const item of pageItems) {
          if (!collected.some((current) => current.hotpepperShopId === item.hotpepperShopId || (item.hotpepperUrl && current.hotpepperUrl === item.hotpepperUrl))) {
            collected.push(item);
          }
        }
        if (pageItems.length === 0 || collected.length === before) break;
        start += stepCount;
      }

      setItems(collected.slice(0, targetCount));
      setMessage(`已抓取 ${Math.min(collected.length, targetCount)} 条 HotPepper 店铺，未直接入库。`);
    } catch (nextError) {
      setError(formatAdminFetchError(nextError));
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const importSelected = async () => {
    const selected = items.filter((item) => item.selected && !item.exists);
    if (selected.length === 0) {
      setError("没有可导入的店铺。");
      return;
    }

    setImporting(true);
    setError("");
    setMessage("");
    try {
      const data = await adminFetch<{ imported: number; message: string; skipped: number }>("/api/admin/hotpepper/import/", {
        body: JSON.stringify({
          shops: selected.map((item) => {
            const { selected: selectedFlag, ...shop } = item;
            void selectedFlag;
            return {
              ...shop,
              middleAreaCode: middleArea,
              middleAreaName: middleAreas.find((area) => area.code === middleArea)?.name ?? "",
              smallAreaCode: smallArea,
              smallAreaName: smallAreas.find((area) => area.code === smallArea)?.name ?? "",
            };
          }),
        }),
        method: "POST",
      });
      setItems((current) => current.map((item) => (selected.some((target) => target.hotpepperShopId === item.hotpepperShopId) ? { ...item, exists: true, selected: false } : item)));
      setMessage(data.message || `已导入 ${data.imported} 家店铺。`);
    } catch (nextError) {
      setError(formatAdminFetchError(nextError));
    } finally {
      setImporting(false);
    }
  };

  const toggleItem = (hotpepperShopId: string) => {
    setItems((current) => current.map((item) => (item.hotpepperShopId === hotpepperShopId && !item.exists ? { ...item, selected: !item.selected } : item)));
  };

  const toggleAll = (checked: boolean) => {
    setItems((current) => current.map((item) => (item.exists ? item : { ...item, selected: checked })));
  };

  return (
    <main className="min-h-screen bg-[#F6FAFF] px-4 py-6 text-[#0F172A]">
      <div className="mx-auto max-w-[920px]">
        <Link href="/admin" className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-black text-[#2563EB] shadow-sm ring-1 ring-blue-100">
          <ArrowLeft className="h-4 w-4" />
          返回后台
        </Link>

        <section className="mt-4 rounded-[28px] border border-white/70 bg-white/90 p-5 shadow-[0_10px_35px_rgba(37,99,235,0.08)]">
          <p className="text-xs font-black text-[#2563EB]">Japan Life 后台</p>
          <h1 className="mt-2 text-2xl font-black">HotPepper 店铺导入</h1>
          <p className="mt-2 text-sm font-bold leading-6 text-slate-500">
            地区从 HotPepper 官方 area master API 读取，先选中エリア，再选小エリア，导入后默认待审核。
          </p>

          <div className="mt-4 grid gap-3 md:grid-cols-[1.1fr_1fr_1fr_0.65fr]">
            <label className="grid gap-1 text-xs font-black text-slate-500">
              管理员密码
              <input className="h-11 rounded-2xl border border-blue-100 bg-white px-4 text-sm font-bold outline-none focus:border-[#2563EB]" onChange={(event) => setPassword(event.target.value)} placeholder="请输入管理员密码" type="password" value={password} />
            </label>
            <label className="grid gap-1 text-xs font-black text-slate-500">
              中エリア
              <select className="h-11 rounded-2xl border border-blue-100 bg-white px-4 text-sm font-bold outline-none focus:border-[#2563EB]" disabled={areaLoading || middleAreas.length === 0} onChange={(event) => setMiddleArea(event.target.value)} value={middleArea}>
                {middleAreas.length === 0 ? <option value="">输入密码后读取</option> : null}
                {middleAreas.map((option) => (
                  <option key={option.code} value={option.code}>{option.name}</option>
                ))}
              </select>
            </label>
            <label className="grid gap-1 text-xs font-black text-slate-500">
              小エリア
              <select className="h-11 rounded-2xl border border-blue-100 bg-white px-4 text-sm font-bold outline-none focus:border-[#2563EB]" disabled={areaLoading || smallAreas.length === 0} onChange={(event) => setSmallArea(event.target.value)} value={smallArea}>
                <option value="">{smallAreas.length === 0 ? "先选择中エリア" : "全部小エリア"}</option>
                {smallAreas.map((option) => (
                  <option key={option.code} value={option.code}>{option.name}</option>
                ))}
              </select>
            </label>
            <label className="grid gap-1 text-xs font-black text-slate-500">
              数量
              <select className="h-11 rounded-2xl border border-blue-100 bg-white px-4 text-sm font-bold outline-none focus:border-[#2563EB]" onChange={(event) => setCount(event.target.value)} value={count}>
                <option value="20">20</option>
                <option value="50">50</option>
                <option value="100">100</option>
              </select>
            </label>
          </div>

          <label className="mt-3 flex h-11 items-center gap-2 rounded-2xl border border-blue-100 bg-white px-3">
            <Search className="h-4 w-4 text-[#2563EB]" />
            <input className="min-w-0 flex-1 bg-transparent text-sm font-bold outline-none" onChange={(event) => setKeyword(event.target.value)} placeholder="可追加关键词：個室 / 深夜 / 駅近 / 食べ放題" value={keyword} />
          </label>

          <div className="mt-3">
            <div className="mb-2 flex items-center justify-between gap-3">
              <p className="text-xs font-black text-slate-500">HotPepper 官方类型标签</p>
              <p className="text-[11px] font-bold text-slate-400">标签会作为 genre 参数传给 API</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {genreOptions.map((option) => {
                const active = genre === option.code;
                return (
                  <button className={`inline-flex min-h-9 items-center gap-1.5 rounded-full border px-3 py-2 text-xs font-black transition ${active ? "border-[#2563EB] bg-[#2563EB] text-white shadow-[0_10px_18px_rgba(37,99,235,0.18)]" : "border-blue-100 bg-white text-[#2563EB] hover:bg-blue-50"}`} key={option.code || "all"} onClick={() => setGenre(option.code)} title={option.hint} type="button">
                    <span>{option.label}</span>
                    {option.code ? <span className={`text-[10px] ${active ? "text-blue-100" : "text-slate-400"}`}>{option.code}</span> : null}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button className="inline-flex h-11 items-center gap-2 rounded-2xl bg-[#2563EB] px-4 text-sm font-black text-white disabled:opacity-50" disabled={loading || !password || !middleArea} onClick={() => runSearch(Number(count))} type="button">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              抓取 HotPepper 店铺
            </button>
            <button className="inline-flex h-11 items-center gap-2 rounded-2xl border border-blue-100 bg-white px-4 text-sm font-black text-[#2563EB] disabled:opacity-50" disabled={loading || !password || !middleArea} onClick={() => runSearch(100)} type="button">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              自动抓取100个
            </button>
            <button className="inline-flex h-11 items-center gap-2 rounded-2xl border border-blue-100 bg-white px-4 text-sm font-black text-[#2563EB] disabled:opacity-50" disabled={importing || stats.selected === 0} onClick={importSelected} type="button">
              {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              导入选中店铺
            </button>
          </div>

          {error ? <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-black text-red-700">{error}</div> : null}
          {message ? <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-700">{message}</div> : null}
        </section>

        <section className="mt-4 rounded-[28px] border border-white/70 bg-white/90 p-5 shadow-[0_10px_35px_rgba(37,99,235,0.08)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-black">预览结果</h2>
              <p className="mt-1 text-xs font-bold text-slate-500">
                共 {stats.total} 条，可导入 {stats.selectable} 条，已存在 {stats.exists} 条，有提醒 {stats.warnings} 条，当前选中 {stats.selected} 条。
              </p>
            </div>
            <div className="flex gap-2">
              <button className="rounded-2xl border border-blue-100 bg-white px-3 py-2 text-xs font-black text-[#2563EB]" onClick={() => toggleAll(true)} type="button">全选可导入</button>
              <button className="rounded-2xl border border-blue-100 bg-white px-3 py-2 text-xs font-black text-[#2563EB]" onClick={() => toggleAll(false)} type="button">清空选择</button>
            </div>
          </div>

          {items.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-dashed border-blue-100 bg-[#F8FBFF] px-4 py-8 text-center text-sm font-bold text-slate-500">
              还没有搜索结果。没有配置 HotPepper API key 时，这一页会明确报错，但不会影响其他页面。
            </div>
          ) : (
            <div className="mt-4 grid gap-3">
              {items.map((item) => (
                <article className={`rounded-[24px] border p-4 shadow-sm ${item.exists ? "border-slate-200 bg-slate-50/70" : "border-blue-100 bg-white"}`} key={item.hotpepperShopId}>
                  <div className="flex items-start gap-3">
                    <label className="pt-1">
                      <input checked={item.exists ? false : item.selected} disabled={item.exists} onChange={() => toggleItem(item.hotpepperShopId)} type="checkbox" />
                    </label>

                    {item.photoUrl ? <img alt="" className="h-20 w-20 rounded-2xl object-cover" src={item.photoUrl} /> : <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-blue-50 text-xs font-black text-[#2563EB]">无图片</div>}

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-black text-[#0F172A]">{item.name}</h3>
                        {item.exists ? <span className="rounded-full bg-slate-200 px-2 py-1 text-[10px] font-black text-slate-700">已存在</span> : null}
                        {!item.exists ? <span className="rounded-full bg-blue-50 px-2 py-1 text-[10px] font-black text-[#2563EB]">待导入</span> : null}
                        {item.warnings.length > 0 ? <span className="rounded-full bg-amber-50 px-2 py-1 text-[10px] font-black text-amber-700">提醒</span> : null}
                      </div>
                      <p className="mt-1 text-xs font-bold leading-5 text-slate-500">{item.genreName || "餐厅"} / {item.budget || "预算待确认"}</p>
                      <p className="mt-2 text-sm font-bold leading-6 text-slate-700">{item.address || "地址待确认"}</p>
                      <div className="mt-2 grid gap-1 text-xs font-bold text-slate-600">
                        <p>最近车站 / 交通：{item.station || item.access || "-"}</p>
                        <p>营业时间: {item.open || "-"}</p>
                        <p>店铺 ID: {item.hotpepperShopId}</p>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {item.hotpepperUrl ? (
                          <a className="inline-flex items-center gap-1 rounded-2xl border border-blue-100 bg-white px-3 py-2 text-xs font-black text-[#2563EB]" href={item.hotpepperUrl} rel="noreferrer" target="_blank">
                            打开 HotPepper
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        ) : null}
                        {item.exists ? <span className="inline-flex items-center gap-1 rounded-2xl bg-slate-200 px-3 py-2 text-xs font-black text-slate-700"><CheckCircle2 className="h-3.5 w-3.5" />已在库中</span> : null}
                        {item.warnings.length > 0 ? <span className="inline-flex items-center gap-1 rounded-2xl bg-amber-50 px-3 py-2 text-xs font-black text-amber-700"><AlertCircle className="h-3.5 w-3.5" />{item.warnings[0]}</span> : null}
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
