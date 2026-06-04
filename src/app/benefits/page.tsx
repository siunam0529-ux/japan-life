"use client";

import { ExternalLink, Landmark, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { BackButton } from "@/components/BackButton";
import { CollapsiblePanel } from "@/components/CollapsiblePanel";
import { useLanguage } from "@/hooks/useLanguage";
import { getCachedBenefitsData } from "@/lib/appPreload";
import { BENEFIT_CATEGORIES, TOKYO_WARDS } from "@/lib/benefits/config";
import type { BenefitRecord } from "@/lib/benefits/types";

const allFilterValue = "__all__";

const benefitsCopy = {
  "zh-CN": {
    all: "全部",
    eyebrow: "東京都・东京23区",
    title: "福利资讯",
    subtitle: "整理给付金、补助金、助成金、育儿、医疗、房租、外国人和留学生向支援等官方信息。",
    searchPlaceholder: "按区名、制度名、对象搜索",
    filterTitle: "筛选",
    wardFilter: "东京23区地图式筛选",
    loading: "读取中...",
    empty: "当前没有公开中的制度。",
    loadError: "福利资讯暂时无法读取，请稍后再试。",
    defaultWard: "東京都",
    defaultSummary: "概要请在官方网站确认。",
    target: "对象",
    deadline: "申请期限",
    source: "官方来源",
    official: "官方网站",
    translation: "翻译",
    original: "原文",
    officialLink: "官方链接",
    note: "翻译内容仅供参考，最新信息和申请条件请务必以官方网站为准。",
  },
  "zh-TW": {
    all: "全部",
    eyebrow: "東京都・東京23區",
    title: "福利資訊",
    subtitle: "整理給付金、補助金、助成金、育兒、醫療、房租、外國人與留學生支援等官方資訊。",
    searchPlaceholder: "按區名、制度名、對象搜尋",
    filterTitle: "篩選",
    wardFilter: "東京23區地圖式篩選",
    loading: "讀取中...",
    empty: "目前沒有公開中的制度。",
    loadError: "福利資訊暫時無法讀取，請稍後再試。",
    defaultWard: "東京都",
    defaultSummary: "概要請在官方網站確認。",
    target: "對象",
    deadline: "申請期限",
    source: "官方來源",
    official: "官方網站",
    translation: "翻譯",
    original: "原文",
    officialLink: "官方連結",
    note: "翻譯內容僅供參考，最新資訊與申請條件請務必以官方網站為準。",
  },
  ja: {
    all: "すべて",
    eyebrow: "東京都・東京23区",
    title: "支援情報",
    subtitle: "給付金、補助金、助成金、子育て、医療、家賃、外国人・留学生向け支援を公式情報から整理します。",
    searchPlaceholder: "区名・制度名・対象で検索",
    filterTitle: "絞り込み",
    wardFilter: "東京23区で絞り込み",
    loading: "読み込み中...",
    empty: "現在公開中の制度はありません。",
    loadError: "支援情報を読み込めません。しばらくしてから再度お試しください。",
    defaultWard: "東京都",
    defaultSummary: "概要は公式サイトで確認してください。",
    target: "対象",
    deadline: "申請期限",
    source: "公式来源",
    official: "公式サイト",
    translation: "翻訳",
    original: "原文",
    officialLink: "公式リンク",
    note: "翻訳内容は参考用です。最新情報・申請条件は必ず公式サイトをご確認ください。",
  },
} as const;

export default function BenefitsPage() {
  const { language } = useLanguage();
  const text = benefitsCopy[language];
  const [items, setItems] = useState<BenefitRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [ward, setWard] = useState(allFilterValue);
  const [category, setCategory] = useState(allFilterValue);
  const wardOptions = useMemo(() => Array.from(new Set(TOKYO_WARDS.map((item) => item.ward))), []);

  useEffect(() => {
    let cancelled = false;
    const cached = getCachedBenefitsData();
    if (cached) {
      setItems(cached.items ?? []);
      setLoading(false);
    } else {
      setLoading(true);
    }
    fetch(`/api/benefits/?nonce=${Date.now()}`)
      .then(async (response) => {
        if (!response.ok) throw new Error("benefits api unavailable");
        return (await response.json()) as { items?: BenefitRecord[] };
      })
      .then((data) => {
        if (!cancelled) {
          setItems(data.items ?? []);
          setError("");
        }
      })
      .catch(() => {
        if (!cancelled) setError(text.loadError);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [text.loadError]);

  const filtered = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return items.filter((item) => {
      const matchesWard = ward === allFilterValue || item.ward === ward;
      const matchesCategory = category === allFilterValue || item.category === category;
      const haystack = `${item.title} ${item.translated_title ?? ""} ${item.summary ?? ""} ${item.translated_summary ?? ""} ${item.ward ?? ""} ${item.category ?? ""} ${item.target_people ?? ""} ${item.source_name ?? ""}`.toLowerCase();
      return matchesWard && matchesCategory && (!keyword || haystack.includes(keyword));
    });
  }, [category, items, query, ward]);
  const displayTitle = (item: BenefitRecord) => (language === "ja" ? item.title : item.translated_title || item.title);
  const displaySummary = (item: BenefitRecord) => (language === "ja" ? item.summary || text.defaultSummary : item.translated_summary || item.summary || text.defaultSummary);

  return (
    <main className="jl-tool-theme min-h-screen text-[#0F172A]">
      <div className="jl-tool-shell mx-auto min-h-screen max-w-[430px] px-4 pb-28 pt-5">
        <div className="mb-5">
          <BackButton />
        </div>

        <section className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-blue-100 bg-blue-50 text-[#2563EB]">
              <Landmark className="h-6 w-6" />
            </span>
            <div>
              <p className="text-xs font-black text-[#2563EB]">{text.eyebrow}</p>
              <h1 className="text-2xl font-black">{text.title}</h1>
            </div>
          </div>
          <p className="mt-3 text-sm font-bold leading-6 text-[#64748B]">{text.subtitle}</p>
        </section>

        <section className="mt-4 rounded-[24px] border border-slate-200 bg-white p-3 shadow-sm">
          <label className="flex h-11 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3">
            <Search className="h-4 w-4 text-[#2563EB]" />
            <input className="min-w-0 flex-1 bg-transparent text-sm font-bold outline-none placeholder:text-slate-400" onChange={(event) => setQuery(event.target.value)} placeholder={text.searchPlaceholder} value={query} />
          </label>
          <CollapsiblePanel closeOnSelect className="mt-3 rounded-2xl border-slate-200 p-3 shadow-none" contentClassName="mt-2" summary={`${ward === allFilterValue ? text.all : ward} / ${category === allFilterValue ? text.all : category}`} title={text.filterTitle}>
            <p className="text-xs font-black text-slate-600">{text.wardFilter}</p>
            <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
              {[allFilterValue, ...wardOptions].map((item) => (
                <button className={`selection-chip shrink-0 rounded-full px-3 py-1.5 text-xs font-black ${ward === item ? "is-selected" : ""}`} key={item} onClick={() => setWard(item)} type="button">{item === allFilterValue ? text.all : item}</button>
              ))}
            </div>
            <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
              {[allFilterValue, ...BENEFIT_CATEGORIES].map((item) => (
                <button className={`selection-chip shrink-0 rounded-full px-3 py-1.5 text-xs font-black ${category === item ? "is-selected" : ""}`} key={item} onClick={() => setCategory(item)} type="button">{item === allFilterValue ? text.all : item}</button>
              ))}
            </div>
          </CollapsiblePanel>
        </section>

        <section className="mt-4 grid gap-3">
          {loading && <p className="rounded-2xl bg-white p-4 text-sm font-black text-[#64748B]">{text.loading}</p>}
          {error && <p className="rounded-2xl bg-red-50 p-4 text-sm font-black text-red-700">{error}</p>}
          {!loading && !error && filtered.length === 0 && <p className="rounded-2xl bg-white p-4 text-sm font-black text-[#64748B]">{text.empty}</p>}
          {filtered.map((item) => (
            <article className="rounded-[26px] border border-slate-200 bg-white p-4 shadow-[0_10px_24px_rgba(15,23,42,0.06)]" key={item.id}>
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full border border-blue-100 bg-blue-50 px-2 py-1 text-[11px] font-black text-[#2563EB]">{item.ward || text.defaultWard}</span>
                {item.category && <span className="rounded-full border border-slate-200 bg-white px-2 py-1 text-[11px] font-black text-slate-600">{item.category}</span>}
              </div>
              <h2 className="mt-3 text-lg font-black leading-6">{displayTitle(item)}</h2>
              <p className="mt-2 text-sm font-bold leading-6 text-[#64748B]">{displaySummary(item)}</p>
              <div className="mt-3 grid gap-1 text-xs font-bold text-slate-600">
                <p>{text.target}：{item.target_people || text.official}</p>
                <p>{text.deadline}：{item.deadline || text.official}</p>
                <p>{text.source}：{item.source_name || text.official}</p>
                <p>{text.translation}：{item.translation_provider === "deepl" ? "DeepL" : item.translation_provider === "openai" ? "OpenAI" : text.original}</p>
              </div>
              <a className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-black text-[#2563EB]" href={item.apply_url || item.source_url} rel="noreferrer" target="_blank">
                {text.officialLink}
                <ExternalLink className="h-4 w-4" />
              </a>
            </article>
          ))}
        </section>

        <section className="mt-5 rounded-[22px] border border-amber-100 bg-amber-50 p-4 text-xs font-bold leading-6 text-amber-900">
          {text.note}
        </section>
      </div>
    </main>
  );
}
