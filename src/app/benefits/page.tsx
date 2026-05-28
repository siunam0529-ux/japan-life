"use client";

import { ExternalLink, Landmark, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { BackButton } from "@/components/BackButton";
import { CollapsiblePanel } from "@/components/CollapsiblePanel";
import { BENEFIT_CATEGORIES, TOKYO_WARDS } from "@/lib/benefits/config";
import type { BenefitRecord } from "@/lib/benefits/types";

const allLabel = "全部";

export default function BenefitsPage() {
  const [items, setItems] = useState<BenefitRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [ward, setWard] = useState(allLabel);
  const [category, setCategory] = useState(allLabel);
  const wardOptions = useMemo(() => Array.from(new Set(TOKYO_WARDS.map((item) => item.ward))), []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch("/api/benefits")
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || `API ${response.status}`);
        if (!cancelled) setItems(data.items ?? []);
      })
      .catch((nextError) => {
        if (!cancelled) setError(nextError instanceof Error ? nextError.message : String(nextError));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return items.filter((item) => {
      const matchesWard = ward === allLabel || item.ward === ward;
      const matchesCategory = category === allLabel || item.category === category;
      const haystack = `${item.title} ${item.translated_title ?? ""} ${item.summary ?? ""} ${item.translated_summary ?? ""} ${item.ward ?? ""} ${item.category ?? ""} ${item.target_people ?? ""} ${item.source_name ?? ""}`.toLowerCase();
      return matchesWard && matchesCategory && (!keyword || haystack.includes(keyword));
    });
  }, [category, items, query, ward]);

  return (
    <main className="min-h-screen bg-[#F5F5F7] text-[#0F172A]">
      <div className="mx-auto min-h-screen max-w-[430px] bg-[#F5F5F7] px-4 pb-28 pt-5">
        <div className="mb-5">
          <BackButton />
        </div>

        <section className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-blue-100 bg-blue-50 text-[#2563EB]">
              <Landmark className="h-6 w-6" />
            </span>
            <div>
              <p className="text-xs font-black text-[#2563EB]">東京都・東京23区</p>
              <h1 className="text-2xl font-black">福利资讯</h1>
            </div>
          </div>
          <p className="mt-3 text-sm font-bold leading-6 text-[#64748B]">給付金、補助金、助成金、子育て、医療、家賃、外国人・留学生向け支援を公式情報から整理します。</p>
        </section>

        <section className="mt-4 rounded-[24px] border border-slate-200 bg-white p-3 shadow-sm">
          <label className="flex h-11 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3">
            <Search className="h-4 w-4 text-[#2563EB]" />
            <input className="min-w-0 flex-1 bg-transparent text-sm font-bold outline-none placeholder:text-slate-400" onChange={(event) => setQuery(event.target.value)} placeholder="区名・制度名・対象で検索" value={query} />
          </label>
          <CollapsiblePanel className="mt-3 rounded-2xl border-slate-200 p-3 shadow-none" contentClassName="mt-2" summary={`${ward} / ${category}`} title="筛选">
            <p className="text-xs font-black text-slate-600">东京23区地图式筛选</p>
            <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
              {[allLabel, ...wardOptions].map((item) => (
                <button className={`selection-chip shrink-0 rounded-full px-3 py-1.5 text-xs font-black ${ward === item ? "is-selected" : ""}`} key={item} onClick={() => setWard(item)} type="button">{item}</button>
              ))}
            </div>
            <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
              {[allLabel, ...BENEFIT_CATEGORIES].map((item) => (
                <button className={`selection-chip shrink-0 rounded-full px-3 py-1.5 text-xs font-black ${category === item ? "is-selected" : ""}`} key={item} onClick={() => setCategory(item)} type="button">{item}</button>
              ))}
            </div>
          </CollapsiblePanel>
        </section>

        <section className="mt-4 grid gap-3">
          {loading && <p className="rounded-2xl bg-white p-4 text-sm font-black text-[#64748B]">読み込み中...</p>}
          {error && <p className="rounded-2xl bg-red-50 p-4 text-sm font-black text-red-700">{error}</p>}
          {!loading && !error && filtered.length === 0 && <p className="rounded-2xl bg-white p-4 text-sm font-black text-[#64748B]">現在公開中の制度はありません。</p>}
          {filtered.map((item) => (
            <article className="rounded-[26px] border border-slate-200 bg-white p-4 shadow-[0_10px_24px_rgba(15,23,42,0.06)]" key={item.id}>
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full border border-blue-100 bg-blue-50 px-2 py-1 text-[11px] font-black text-[#2563EB]">{item.ward || "東京都"}</span>
                {item.category && <span className="rounded-full border border-slate-200 bg-white px-2 py-1 text-[11px] font-black text-slate-600">{item.category}</span>}
              </div>
              <h2 className="mt-3 text-lg font-black leading-6">{item.translated_title || item.title}</h2>
              <p className="mt-2 text-sm font-bold leading-6 text-[#64748B]">{item.translated_summary || item.summary || "概要は公式サイトで確認してください。"}</p>
              <div className="mt-3 grid gap-1 text-xs font-bold text-slate-600">
                <p>対象：{item.target_people || "公式サイトで確認"}</p>
                <p>申請期限：{item.deadline || "公式サイトで確認"}</p>
                <p>公式来源：{item.source_name || "公式サイト"}</p>
                <p>翻译：{item.translation_provider === "deepl" ? "DeepL" : item.translation_provider === "openai" ? "OpenAI" : "原文"}</p>
              </div>
              <a className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-black text-[#2563EB]" href={item.apply_url || item.source_url} rel="noreferrer" target="_blank">
                官方链接
                <ExternalLink className="h-4 w-4" />
              </a>
            </article>
          ))}
        </section>

        <section className="mt-5 rounded-[22px] border border-amber-100 bg-amber-50 p-4 text-xs font-bold leading-6 text-amber-900">
          翻译内容仅供参考，最新情報・申請条件は必ず公式サイトをご確認ください。
        </section>
      </div>
    </main>
  );
}
