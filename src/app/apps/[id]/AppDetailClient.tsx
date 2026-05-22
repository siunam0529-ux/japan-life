"use client";

import { ArrowLeft, ExternalLink, Globe2, Star } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { type RecommendedApp } from "@/data/recommendedApps";
import { useFavorites } from "@/hooks/useFavorites";
import { useLanguage } from "@/hooks/useLanguage";
import { fetchRecommendedApp } from "@/lib/api/recommendedApps";

const copy = {
  "zh-CN": {
    free: "免费",
    suitable: "适合谁使用",
    scene: "使用场景",
    intro: "简介",
    platforms: "支持平台",
    official: "官方网站",
    appStore: "App Store",
    googlePlay: "Google Play",
    developer: "开发者",
    price: "价格",
    favorite: "收藏 App",
    saved: "已收藏",
    relatedTools: "相关工具",
    updated: "更新日期",
  },
  "zh-TW": {
    free: "免費",
    suitable: "適合誰使用",
    scene: "使用場景",
    intro: "簡介",
    platforms: "支援平台",
    official: "官方網站",
    appStore: "App Store",
    googlePlay: "Google Play",
    developer: "開發者",
    price: "價格",
    favorite: "收藏 App",
    saved: "已收藏",
    relatedTools: "相關工具",
    updated: "更新日期",
  },
  ja: {
    free: "無料",
    suitable: "こんな人に便利",
    scene: "使う場面",
    intro: "紹介",
    platforms: "対応プラットフォーム",
    official: "公式サイト",
    appStore: "App Store",
    googlePlay: "Google Play",
    developer: "開発者",
    price: "価格",
    favorite: "保存する",
    saved: "保存済み",
    relatedTools: "関連ツール",
    updated: "更新日",
  },
} as const;

const relatedTools = {
  rent: { href: "/tools/rent", zhCN: "房租评估", zhTW: "房租評估", ja: "家賃チェック" },
  exchange: { href: "/tools/exchange", zhCN: "汇率换算", zhTW: "匯率換算", ja: "為替換算" },
  areas: { href: "/areas", zhCN: "地区数据", zhTW: "地區資料", ja: "エリア情報" },
  livingCost: { href: "/tools/living-cost", zhCN: "生活成本", zhTW: "生活成本", ja: "生活費" },
  resources: { href: "/resources", zhCN: "日本生活指南", zhTW: "日本生活指南", ja: "日本生活ガイド" },
  search: { href: "/search", zhCN: "文章搜索", zhTW: "文章搜尋", ja: "記事検索" },
} as const;

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

function toolLabel(tool: (typeof relatedTools)[keyof typeof relatedTools], language: "zh-CN" | "zh-TW" | "ja") {
  if (language === "ja") return tool.ja;
  if (language === "zh-TW") return tool.zhTW;
  return tool.zhCN;
}

function AppIcon({ iconUrl, name }: { iconUrl?: string; name: string }) {
  const [imageFailed, setImageFailed] = useState(false);

  if (iconUrl && !imageFailed) {
    return <img alt="" className="h-full w-full rounded-[28px] object-cover" onError={() => setImageFailed(true)} src={iconUrl} />;
  }

  const initials = name
    .replace(/[^A-Za-z0-9一-龥ぁ-んァ-ヶ]/g, "")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex h-full w-full items-center justify-center rounded-[28px] bg-gradient-to-br from-emerald-100 via-white to-teal-100 text-2xl font-black text-emerald-800">
      {initials}
    </div>
  );
}

function ExternalButton({ href, label }: { href?: string; label: string }) {
  if (!href) return null;

  return (
    <a className="flex h-11 items-center justify-center gap-2 rounded-2xl bg-emerald-800 px-4 text-sm font-black text-white shadow-sm" href={href} rel="noopener noreferrer" target="_blank">
      <ExternalLink className="h-4 w-4" />
      {label}
    </a>
  );
}

export function AppDetailClient({ app }: { app: RecommendedApp }) {
  const { language, t } = useLanguage();
  const { isFavorite, toggleFavorite } = useFavorites();
  const [liveApp, setLiveApp] = useState(app);
  const labels = copy[language];
  const text = appText(liveApp, language);
  const favorite = isFavorite("app", liveApp.id);
  const displayName = liveApp.name;
  const displayIcon = liveApp.iconUrl;
  const appStoreUrl = liveApp.appStoreUrl;
  const displayPrice = liveApp.priceText ?? (liveApp.isFree ? labels.free : "");

  useEffect(() => {
    let active = true;
    fetchRecommendedApp(app.id)
      .then((next) => {
        if (active && next) setLiveApp(next);
      })
      .catch(() => {
        if (active) setLiveApp(app);
      });

    return () => {
      active = false;
    };
  }, [app]);

  return (
    <main className="min-h-screen bg-[#f5f0e7] text-stone-950">
      <div className="mx-auto min-h-screen max-w-[430px] bg-[#fbf8f2] px-4 pb-8 pt-4 shadow-2xl shadow-stone-300/40">
        <header className="flex items-center justify-between py-2">
          <Link aria-label={t.common.back} className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-stone-900 shadow-sm" href="/apps">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <span className="rounded-full bg-white px-4 py-2 text-sm font-black text-emerald-700 shadow-sm">Japan Life</span>
        </header>

        <section className="mt-4 rounded-[30px] bg-white p-5 text-center shadow-[0_12px_35px_rgba(32,38,34,0.08)]">
          <div className="mx-auto h-24 w-24 overflow-hidden rounded-[28px] border border-stone-100 bg-white shadow-sm">
            <AppIcon iconUrl={displayIcon} name={displayName} />
          </div>
          <h1 className="mt-4 text-[28px] font-black leading-tight">{displayName}</h1>
          <div className="mt-3 flex justify-center gap-2">
            {displayPrice && <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">{displayPrice}</span>}
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">{text.category}</span>
          </div>
          <button
            className={`mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-2xl border text-sm font-black ${favorite ? "border-amber-200 bg-amber-50 text-amber-700" : "border-emerald-200 bg-emerald-50 text-emerald-800"}`}
            onClick={() => toggleFavorite({ id: liveApp.id, type: "app", title: displayName, subtitle: `${text.category} / ${text.shortDescription}` })}
            type="button"
          >
            <Star className={`h-5 w-5 ${favorite ? "fill-amber-300" : ""}`} />
            {favorite ? labels.saved : labels.favorite}
          </button>
        </section>

        <section className="mt-4 grid gap-3">
          {liveApp.developerName && <InfoBlock title={labels.developer} text={liveApp.developerName} />}
          {displayPrice && <InfoBlock title={labels.price} text={displayPrice} />}
          <InfoBlock title={labels.suitable} text={text.usefulFor} />
          <InfoBlock title={labels.scene} text={text.shortDescription} />
          <InfoBlock title={labels.intro} text={text.description} />
        </section>

        <section className="mt-4 rounded-[24px] bg-white p-4 shadow-[0_10px_28px_rgba(32,38,34,0.06)]">
          <h2 className="text-base font-black">{labels.platforms}</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {liveApp.platforms.map((platform) => (
              <span className="rounded-full border border-stone-200 bg-stone-50 px-3 py-1 text-xs font-black text-stone-600" key={platform}>
                {platform}
              </span>
            ))}
          </div>
        </section>

        <section className="mt-4 grid gap-2">
          <ExternalButton href={liveApp.officialUrl} label={labels.official} />
          <ExternalButton href={appStoreUrl} label={labels.appStore} />
          <ExternalButton href={liveApp.googlePlayUrl} label={labels.googlePlay} />
        </section>

        <section className="mt-4 rounded-[24px] bg-white p-4 shadow-[0_10px_28px_rgba(32,38,34,0.06)]">
          <h2 className="text-base font-black">{labels.relatedTools}</h2>
          <div className="mt-3 grid grid-cols-1 gap-2 min-[360px]:grid-cols-2">
            {liveApp.relatedToolIds.map((id) => {
              const tool = relatedTools[id as keyof typeof relatedTools];
              if (!tool) return null;
              return (
                <Link className="flex items-center justify-between rounded-2xl bg-emerald-50 px-3 py-3 text-sm font-black text-emerald-800" href={tool.href} key={id}>
                  {toolLabel(tool, language)}
                  <Globe2 className="h-4 w-4" />
                </Link>
              );
            })}
          </div>
        </section>

        <p className="mt-5 text-center text-xs font-bold leading-6 text-stone-500">
          {labels.updated}: {liveApp.updatedAt}
          <br />
          {t.common.referenceOnly}
        </p>
      </div>
    </main>
  );
}

function InfoBlock({ title, text }: { title: string; text: string }) {
  return (
    <article className="rounded-[24px] bg-white p-4 shadow-[0_10px_28px_rgba(32,38,34,0.06)]">
      <h2 className="text-sm font-black text-emerald-800">{title}</h2>
      <p className="mt-2 text-sm font-bold leading-6 text-stone-600">{text}</p>
    </article>
  );
}
