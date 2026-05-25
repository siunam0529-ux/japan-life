"use client";

import type { ComponentType } from "react";
import { BadgeDollarSign, BookOpen, BriefcaseBusiness, ChevronDown, ChevronRight, CreditCard, HeartPulse, Home, Languages, Package, Search, ShieldAlert, ShoppingBag, Sparkles, Star, TrainFront, Utensils, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { BackButton } from "@/components/BackButton";
import { DataNotice } from "@/components/DataNotice";
import { type RecommendedApp, type RecommendedAppCategory } from "@/data/recommendedApps";
import { useFavorites } from "@/hooks/useFavorites";
import { useLanguage } from "@/hooks/useLanguage";
import { isSupabaseRecommendedApp, normalizeSupabaseRecommendedApp } from "@/lib/recommendedAppNormalize";

type CategoryOption = {
  id: "all" | RecommendedAppCategory;
  icon: ComponentType<{ className?: string }>;
  zhCN: string;
  zhTW: string;
  ja: string;
};

const baseCategories: CategoryOption[] = [
  { id: "all", icon: Sparkles, zhCN: "全部", zhTW: "全部", ja: "すべて" },
  { id: "transport", icon: TrainFront, zhCN: "交通", zhTW: "交通", ja: "交通" },
  { id: "payment", icon: CreditCard, zhCN: "支付", zhTW: "支付", ja: "支払い" },
  { id: "remittance", icon: BadgeDollarSign, zhCN: "汇款", zhTW: "匯款", ja: "送金" },
  { id: "rent", icon: Home, zhCN: "租房", zhTW: "租屋", ja: "賃貸" },
];

const extraCategories: CategoryOption[] = [
  { id: "work", icon: BriefcaseBusiness, zhCN: "打工", zhTW: "打工", ja: "アルバイト" },
  { id: "secondhand", icon: Package, zhCN: "二手", zhTW: "二手", ja: "フリマ" },
  { id: "delivery", icon: Utensils, zhCN: "外卖", zhTW: "外送", ja: "デリバリー" },
  { id: "translation", icon: Languages, zhCN: "翻译", zhTW: "翻譯", ja: "翻訳" },
  { id: "japanese", icon: BookOpen, zhCN: "学习日语", zhTW: "學日文", ja: "日本語学習" },
  { id: "disaster", icon: ShieldAlert, zhCN: "防灾", zhTW: "防災", ja: "防災" },
  { id: "medical", icon: HeartPulse, zhCN: "医疗", zhTW: "醫療", ja: "医療" },
  { id: "shopping", icon: ShoppingBag, zhCN: "购物", zhTW: "購物", ja: "買い物" },
];

const copy = {
  "zh-CN": {
    title: "推荐 App",
    bannerTitle: "在日生活必备 App",
    bannerSubtitle: "精选实用工具，让生活更便利",
    searchPlaceholder: "搜索 App、分类、标签",
    free: "免费",
    more: "更多",
    noResults: "没有找到相关 App",
    loadError: "推荐 App 暂时无法读取，请稍后再试。",
    emptyHint: "试试搜索“交通”“汇款”“租房”",
    updated: "更新",
  },
  "zh-TW": {
    title: "推薦 App",
    bannerTitle: "日本生活必備 App",
    bannerSubtitle: "精選實用工具，讓生活更方便",
    searchPlaceholder: "搜尋 App、分類、標籤",
    free: "免費",
    more: "更多",
    noResults: "沒有找到相關 App",
    loadError: "推薦 App 暫時無法讀取，請稍後再試。",
    emptyHint: "試試搜尋「交通」「匯款」「租屋」",
    updated: "更新",
  },
  ja: {
    title: "おすすめアプリ",
    bannerTitle: "日本生活に便利なアプリ",
    bannerSubtitle: "日本生活をもっと便利にするアプリ",
    searchPlaceholder: "アプリ、カテゴリ、タグを検索",
    free: "無料",
    more: "もっと",
    noResults: "関連するアプリが見つかりません",
    loadError: "おすすめアプリを読み込めません。しばらくしてから再度お試しください。",
    emptyHint: "「交通」「送金」「賃貸」で検索してみてください",
    updated: "更新",
  },
} as const;

async function fetchSupabaseRecommendedApps() {
  const response = await fetch("/api/recommended-apps/");
  const text = await response.text();
  const data = text ? (JSON.parse(text) as { items?: unknown[]; error?: string }) : {};
  if (!response.ok) throw new Error(data.error ?? "Failed to load Supabase recommended apps");
  return (data.items ?? [])
    .filter(isSupabaseRecommendedApp)
    .filter((item) => item.status === "published")
    .sort((a, b) => Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0))
    .map(normalizeSupabaseRecommendedApp);
}

function categoryLabel(category: CategoryOption, language: "zh-CN" | "zh-TW" | "ja") {
  if (language === "ja") return category.ja;
  if (language === "zh-TW") return category.zhTW;
  return category.zhCN;
}

function appText(app: RecommendedApp, language: "zh-CN" | "zh-TW" | "ja") {
  if (language === "ja") {
    return {
      category: app.categoryJa,
      description: app.descriptionJa,
      shortDescription: app.shortDescriptionJa,
      usefulFor: app.usefulForJa,
    };
  }
  if (language === "zh-TW") {
    return {
      category: app.categoryZhTW,
      description: app.descriptionZhTW,
      shortDescription: app.shortDescriptionZhTW,
      usefulFor: app.usefulForZhTW,
    };
  }
  return {
    category: app.categoryZhCN,
    description: app.descriptionZhCN,
    shortDescription: app.shortDescriptionZhCN,
    usefulFor: app.usefulForZhCN,
  };
}

function AppIcon({ iconUrl, name }: { iconUrl?: string; name: string }) {
  const [imageFailed, setImageFailed] = useState(false);

  if (iconUrl && !imageFailed) {
    return <img alt="" className="h-full w-full rounded-[24px] object-cover" onError={() => setImageFailed(true)} src={iconUrl} />;
  }

  const initials = name
    .replace(/[^A-Za-z0-9一-龥ぁ-んァ-ヶ]/g, "")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex h-full w-full items-center justify-center rounded-[24px] bg-gradient-to-br from-emerald-100 via-white to-teal-100 text-xl font-black text-emerald-800">
      {initials}
    </div>
  );
}

export default function AppsPage() {
  const { language, t } = useLanguage();
  const { isFavorite, toggleFavorite } = useFavorites();
  const [apps, setApps] = useState<RecommendedApp[]>([]);
  const [query, setQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<"all" | RecommendedAppCategory>("all");
  const [loadError, setLoadError] = useState("");
  const labels = copy[language];

  useEffect(() => {
    let active = true;
    fetchSupabaseRecommendedApps()
      .then((items) => {
        if (active) {
          setApps(items);
          setLoadError("");
        }
      })
      .catch(() => {
        if (active) {
          setApps([]);
          setLoadError(labels.loadError);
        }
      });

    return () => {
      active = false;
    };
  }, [labels.loadError]);

  const visibleCategories = showMore ? [...baseCategories, ...extraCategories] : baseCategories;

  const filteredApps = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return apps.filter((app) => {
      if (app.status !== "published") return false;
      const matchesCategory = selectedCategory === "all" || app.category === selectedCategory;
      const haystack = [
        app.name,
        app.category,
        app.categoryZhCN,
        app.categoryZhTW,
        app.categoryJa,
        app.descriptionZhCN,
        app.descriptionZhTW,
        app.descriptionJa,
        app.shortDescriptionZhCN,
        app.shortDescriptionZhTW,
        app.shortDescriptionJa,
        app.usefulForZhCN,
        app.usefulForZhTW,
        app.usefulForJa,
        ...app.tags,
      ]
        .join(" ")
        .toLowerCase();
      return matchesCategory && (!keyword || haystack.includes(keyword));
    });
  }, [apps, query, selectedCategory]);

  return (
    <main className="min-h-screen bg-[#f5f0e7] text-stone-950">
      <div className="mx-auto min-h-screen max-w-[430px] bg-[#fbf8f2] px-4 pb-4 pt-4 shadow-2xl shadow-stone-300/40">
        <header className="flex items-center justify-between py-2">
          <BackButton label={t.common.back} variant="icon" />
          <h1 className="text-[24px] font-black">{labels.title}</h1>
          <button
            aria-label={t.common.search}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-stone-900 shadow-sm"
            onClick={() => setShowSearch((current) => !current)}
            type="button"
          >
            {showSearch ? <X className="h-5 w-5" /> : <Search className="h-5 w-5" />}
          </button>
        </header>

        {showSearch && (
          <label className="mt-3 flex h-10 items-center gap-2 rounded-2xl border border-stone-200 bg-white px-3 shadow-sm">
            <Search className="h-4 w-4 text-stone-400" />
            <input className="min-w-0 flex-1 bg-transparent text-sm font-black outline-none placeholder:text-stone-400" onChange={(event) => setQuery(event.target.value)} placeholder={labels.searchPlaceholder} value={query} />
          </label>
        )}

        <section className="mt-4 overflow-hidden rounded-[28px] border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-teal-50 p-5 shadow-[0_10px_28px_rgba(32,38,34,0.06)]">
          <div className="flex items-center gap-4">
            <div className="min-w-0 flex-1">
              <h2 className="text-[25px] font-black leading-tight">{labels.bannerTitle}</h2>
              <p className="mt-2 text-sm font-bold leading-6 text-stone-600">{labels.bannerSubtitle}</p>
            </div>
            <div className="relative h-24 w-24 shrink-0 rounded-[28px] bg-emerald-700/10">
              <div className="absolute left-5 top-3 h-20 w-14 rotate-[-8deg] rounded-[18px] border-4 border-emerald-700/20 bg-white shadow-lg" />
              <div className="absolute right-1 top-6 flex h-11 w-11 items-center justify-center rounded-full bg-emerald-700 text-white shadow-lg">
                <ShoppingBag className="h-6 w-6" />
              </div>
              <div className="absolute bottom-4 left-2 flex h-9 w-9 items-center justify-center rounded-2xl bg-white text-emerald-700 shadow">
                <Sparkles className="h-5 w-5" />
              </div>
            </div>
          </div>
        </section>

        <section className="-mx-4 mt-4 overflow-x-auto px-4 pb-1">
          <div className="flex gap-2">
            {visibleCategories.map((category) => {
              const Icon = category.icon;
              const active = selectedCategory === category.id;
              return (
                <button
                  className={`selection-chip flex h-10 shrink-0 items-center gap-1.5 rounded-full border px-4 text-sm font-black shadow-sm transition ${active ? "is-selected" : ""}`}
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  type="button"
                >
                  <Icon className="h-4 w-4" />
                  {categoryLabel(category, language)}
                </button>
              );
            })}
            <button className="flex h-10 shrink-0 items-center gap-1.5 rounded-full border border-stone-200 bg-white px-4 text-sm font-black text-stone-800 shadow-sm" onClick={() => setShowMore((current) => !current)} type="button">
              {labels.more}
              <ChevronDown className={`h-4 w-4 transition ${showMore ? "rotate-180" : ""}`} />
            </button>
          </div>
        </section>

        <section className="mt-4 grid gap-3">
          {loadError && <p className="rounded-[22px] border border-red-100 bg-red-50 px-4 py-3 text-sm font-black text-red-700">{loadError}</p>}
          {filteredApps.length === 0 ? (
            <div className="rounded-[26px] bg-white p-7 text-center shadow-[0_10px_28px_rgba(32,38,34,0.06)]">
              <Search className="mx-auto h-9 w-9 text-emerald-700" />
              <h2 className="mt-3 text-lg font-black">{labels.noResults}</h2>
              <p className="mt-2 text-sm font-bold leading-6 text-stone-500">{labels.emptyHint}</p>
            </div>
          ) : (
            filteredApps.map((app) => {
              const text = appText(app, language);
              const favorite = isFavorite("app", app.id);
              const displayName = app.name;
              const displayIcon = app.iconUrl;
              const displayPrice = app.priceText ?? (app.isFree ? labels.free : "");
              return (
                <article className="overflow-hidden rounded-[22px] bg-white p-3 shadow-[0_10px_24px_rgba(32,38,34,0.06)]" key={app.id}>
                  <div className="grid grid-cols-[56px_minmax(0,1fr)_32px] items-center gap-2.5">
                    <Link className="h-14 w-14 overflow-hidden rounded-[18px] border border-stone-100 bg-white" href={`/apps/${app.id}`}>
                      <AppIcon iconUrl={displayIcon} name={displayName} />
                    </Link>
                    <Link className="min-w-0 flex-1" href={`/apps/${app.id}`}>
                      <div className="flex min-w-0 items-center gap-1.5">
                        <h2 className="min-w-0 flex-1 truncate text-[17px] font-black leading-tight">{displayName}</h2>
                        {displayPrice && <span className="max-w-[48px] shrink-0 truncate rounded-full bg-emerald-50 px-1.5 py-0.5 text-[10px] font-black text-emerald-700">{displayPrice}</span>}
                        <span className="max-w-[44px] shrink-0 truncate rounded-full bg-emerald-50 px-1.5 py-0.5 text-[10px] font-black text-emerald-700">{text.category}</span>
                      </div>
                      <p className="mt-1 truncate text-[13px] font-bold text-stone-600">{text.shortDescription}</p>
                      <p className="mt-1 line-clamp-1 text-xs font-bold text-stone-500">{text.usefulFor}</p>
                      <div className="mt-1.5 flex max-w-full gap-1 overflow-hidden">
                        {app.platforms.filter((platform) => platform !== "Android").map((platform) => (
                          <span className="shrink-0 rounded-full border border-stone-200 bg-white px-2 py-0.5 text-[11px] font-bold text-stone-600" key={platform}>
                            {platform}
                          </span>
                        ))}
                      </div>
                    </Link>
                    <div className="flex w-8 shrink-0 flex-col items-center gap-1">
                      <button
                        aria-label={favorite ? "remove favorite" : "add favorite"}
                        className="flex h-8 w-8 items-center justify-center rounded-full text-stone-400"
                        onClick={() => toggleFavorite({ id: app.id, type: "app", title: displayName, subtitle: `${text.category} / ${text.shortDescription}` })}
                        type="button"
                      >
                        <Star className={`h-5 w-5 ${favorite ? "fill-amber-300 text-amber-400" : ""}`} />
                      </button>
                      <Link aria-label={displayName} className="text-stone-400" href={`/apps/${app.id}`}>
                        <ChevronRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </section>

        <DataNotice
          source="Supabase recommended_apps + iTunes Search API"
          sourceZhTW="Supabase recommended_apps + iTunes Search API"
          updatedAt="2026-05-22"
          note="App 信息、价格、可用地区和外部链接可能变化；下载或付费前请以 App Store / 官方页面为准。"
          noteZhTW="App 資訊、價格、可用地區和外部連結可能變化；下載或付費前請以 App Store / 官方頁面為準。"
        />
      </div>
    </main>
  );
}
