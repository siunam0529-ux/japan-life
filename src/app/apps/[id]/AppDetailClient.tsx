"use client";

import { ExternalLink, Star } from "lucide-react";
import { useState } from "react";
import { BackButton } from "@/components/BackButton";
import { type RecommendedApp } from "@/data/recommendedApps";
import { useFavorites } from "@/hooks/useFavorites";
import { useLanguage } from "@/hooks/useLanguage";

const copy = {
  "zh-CN": {
    free: "免费",
    reason: "推荐理由",
    appStore: "在 App Store 下载",
    favorite: "收藏 App",
    saved: "已收藏",
    updated: "更新时间",
  },
  "zh-TW": {
    free: "免費",
    reason: "推薦理由",
    appStore: "在 App Store 下載",
    favorite: "收藏 App",
    saved: "已收藏",
    updated: "更新日期",
  },
  ja: {
    free: "無料",
    reason: "おすすめ理由",
    appStore: "App Store で開く",
    favorite: "App を保存",
    saved: "保存済み",
    updated: "更新日",
  },
} as const;

function appText(app: RecommendedApp, language: "zh-CN" | "zh-TW" | "ja") {
  if (language === "ja") return app.shortDescriptionJa || app.descriptionJa;
  if (language === "zh-TW") return app.shortDescriptionZhTW || app.descriptionZhTW;
  return app.shortDescriptionZhCN || app.descriptionZhCN;
}

function categoryText(app: RecommendedApp, language: "zh-CN" | "zh-TW" | "ja") {
  if (language === "ja") return app.categoryJa;
  if (language === "zh-TW") return app.categoryZhTW;
  return app.categoryZhCN;
}

function AppIcon({ iconUrl, name }: { iconUrl?: string; name: string }) {
  const [imageFailed, setImageFailed] = useState(false);

  if (iconUrl && !imageFailed) {
    return <img alt="" className="h-full w-full rounded-[28px] object-cover" onError={() => setImageFailed(true)} src={iconUrl} />;
  }

  const initials = name
    .replace(/[^A-Za-z0-9\u4e00-\u9fa5\u3040-\u30ff]/g, "")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex h-full w-full items-center justify-center rounded-[28px] bg-gradient-to-br from-emerald-100 via-white to-teal-100 text-2xl font-black text-emerald-800">
      {initials || "JL"}
    </div>
  );
}

function AppStoreButton({ href, label }: { href?: string; label: string }) {
  if (!href) return null;

  return (
    <a className="mt-3 flex h-12 items-center justify-center gap-2 rounded-2xl bg-emerald-800 px-4 text-sm font-black text-white shadow-sm transition hover:scale-[1.01] active:scale-[0.99]" href={href} rel="noopener noreferrer" target="_blank">
      <ExternalLink className="h-4 w-4" />
      {label}
    </a>
  );
}

export function AppDetailClient({ app }: { app: RecommendedApp }) {
  const { language, t } = useLanguage();
  const { isFavorite, toggleFavorite } = useFavorites();
  const labels = copy[language];
  const favorite = isFavorite("app", app.id);
  const reason = appText(app, language);
  const category = categoryText(app, language);
  const displayPrice = app.priceText ?? (app.isFree ? labels.free : "");

  return (
    <main className="min-h-screen bg-[#f5f0e7] text-stone-950">
      <div className="mx-auto min-h-screen max-w-[430px] bg-[#fbf8f2] px-4 pb-8 pt-4 shadow-2xl shadow-stone-300/40">
        <header className="flex items-center justify-between py-2">
          <BackButton fallbackHref="/apps" label={t.common.back} variant="icon" />
          <span className="rounded-full bg-white px-4 py-2 text-sm font-black text-emerald-700 shadow-sm">Japan Life</span>
        </header>

        <section className="mt-4 rounded-[30px] bg-white p-5 text-center shadow-[0_12px_35px_rgba(32,38,34,0.08)]">
          <div className="mx-auto h-24 w-24 overflow-hidden rounded-[28px] border border-stone-100 bg-white shadow-sm">
            <AppIcon iconUrl={app.iconUrl} name={app.name} />
          </div>
          <h1 className="mt-4 text-[28px] font-black leading-tight">{app.name}</h1>
          <div className="mt-3 flex justify-center gap-2">
            {displayPrice && <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">{displayPrice}</span>}
            {category && <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-700">{category}</span>}
          </div>
          <button
            className={`mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-2xl border text-sm font-black ${favorite ? "border-amber-200 bg-amber-50 text-amber-700" : "border-emerald-200 bg-emerald-50 text-emerald-800"}`}
            onClick={() => toggleFavorite({ id: app.id, type: "app", title: app.name, subtitle: reason })}
            type="button"
          >
            <Star className={`h-5 w-5 ${favorite ? "fill-amber-300" : ""}`} />
            {favorite ? labels.saved : labels.favorite}
          </button>
          <AppStoreButton href={app.appStoreUrl} label={labels.appStore} />
        </section>

        {reason && (
          <section className="mt-4 rounded-[24px] bg-white p-4 shadow-[0_10px_28px_rgba(32,38,34,0.06)]">
            <h2 className="text-sm font-black text-emerald-800">{labels.reason}</h2>
            <p className="mt-2 whitespace-pre-line text-sm font-bold leading-6 text-stone-600">{reason}</p>
          </section>
        )}

        <p className="mt-5 text-center text-xs font-bold leading-6 text-stone-500">
          {labels.updated}: {app.updatedAt || "-"}
          <br />
          {t.common.referenceOnly}
        </p>
      </div>
    </main>
  );
}
