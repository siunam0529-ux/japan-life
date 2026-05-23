"use client";

import type { ComponentType } from "react";
import { useState } from "react";
import { BadgePercent, BookOpenText, Heart, MapPin, Pin, Smartphone, Store, Trash2 } from "lucide-react";
import Link from "next/link";
import { BackButton } from "@/components/BackButton";
import { FavoriteType, useFavorites } from "@/hooks/useFavorites";
import { useLanguage } from "@/hooks/useLanguage";

const copy = {
  "zh-CN": {
    all: "全部",
    article: "文章/工具",
    deal: "优惠",
    emptyText: "先去店铺、地区、推荐 App 或工具页面看看，点收藏后就能在这里管理。",
    emptyTitle: "暂无收藏",
    local: "本地保存，不需要登录",
    notePlaceholder: "添加备注：比如常用医院、区役所窗口、超市营业时间、打工工具...",
    pinned: "置顶",
    pin: "置顶",
    subtitle: "给常用医院、区役所、超市、打工工具加备注和置顶，之后可以更快找回来。",
    title: "收藏夹",
    unpin: "取消置顶",
    area: "地区",
    place: "店铺",
  },
  "zh-TW": {
    all: "全部",
    article: "文章/工具",
    deal: "優惠",
    emptyText: "先去店鋪、地區、推薦 App 或工具頁面看看，點收藏後就能在這裡管理。",
    emptyTitle: "暫無收藏",
    local: "本地保存，不需要登入",
    notePlaceholder: "新增備註：例如常用醫院、區役所窗口、超市營業時間、打工工具...",
    pinned: "置頂",
    pin: "置頂",
    subtitle: "給常用醫院、區役所、超市、打工工具加備註和置頂，之後可以更快找回來。",
    title: "收藏夾",
    unpin: "取消置頂",
    area: "地區",
    place: "店鋪",
  },
  ja: {
    all: "すべて",
    article: "記事/ツール",
    deal: "お得",
    emptyText: "店舗、エリア、アプリ、ツールでお気に入りを追加すると、ここで管理できます。",
    emptyTitle: "お気に入りはまだありません",
    local: "端末内に保存されます",
    notePlaceholder: "メモを追加：よく使う病院、役所窓口、スーパー営業時間、仕事ツールなど...",
    pinned: "固定",
    pin: "固定",
    subtitle: "よく使う病院、役所、スーパー、仕事ツールにメモや固定を付けられます。",
    title: "お気に入り",
    unpin: "固定を解除",
    area: "エリア",
    place: "店舗",
  },
} as const;

const filters: Array<"all" | FavoriteType> = ["all", "place", "area", "app", "deal", "article"];

function formatSavedAt(value: string, locale: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(locale, { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }).format(date);
}

export default function FavoritesPage() {
  const { language } = useLanguage();
  const text = copy[language];
  const typeMeta: Record<FavoriteType, { label: string; href: string; icon: ComponentType<{ className?: string }>; className: string }> = {
    area: { label: text.area, href: "/areas", icon: MapPin, className: "bg-emerald-50 text-emerald-700" },
    place: { label: text.place, href: "/places", icon: Store, className: "bg-teal-50 text-teal-700" },
    article: { label: text.article, href: "/search", icon: BookOpenText, className: "bg-amber-50 text-amber-700" },
    app: { label: "App", href: "/apps", icon: Smartphone, className: "bg-sky-50 text-sky-700" },
    deal: { label: text.deal, href: "/deals", icon: BadgePercent, className: "bg-orange-50 text-orange-700" },
  };
  const { favorites, removeFavorite, updateFavorite } = useFavorites();
  const [filter, setFilter] = useState<"all" | FavoriteType>("all");
  const visibleFavorites = filter === "all" ? favorites : favorites.filter((item) => item.type === filter);
  const locale = language === "zh-TW" ? "zh-TW" : language === "ja" ? "ja-JP" : "zh-CN";

  return (
    <main className="min-h-screen bg-[#f5f0e7] text-stone-950">
      <div className="mx-auto flex min-h-screen w-full max-w-[430px] flex-col gap-5 bg-[#fbf8f2] px-4 pb-10 pt-5 shadow-2xl shadow-stone-300/40">
        <header className="flex items-center justify-between">
          <BackButton variant="icon" />
          <span className="rounded-full bg-white px-4 py-2 text-sm font-black text-emerald-700 shadow-sm">Japan Life</span>
        </header>

        <section className="rounded-[30px] bg-emerald-800 p-5 text-white shadow-[0_18px_45px_rgba(18,93,70,0.25)]">
          <p className="text-sm font-bold text-emerald-100">{text.local}</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight">{text.title}</h1>
          <p className="mt-3 text-sm font-semibold leading-6 text-emerald-50">{text.subtitle}</p>
        </section>

        <section className="-mx-4 overflow-x-auto px-4">
          <div className="flex gap-2">
            {filters.map((item) => (
              <button className={`selection-chip h-9 shrink-0 rounded-full px-4 text-xs font-black ${filter === item ? "is-selected" : ""}`} key={item} onClick={() => setFilter(item)} type="button">
                {item === "all" ? text.all : typeMeta[item].label}
              </button>
            ))}
          </div>
        </section>

        <section className="grid gap-3">
          {visibleFavorites.length === 0 ? (
            <div className="rounded-[28px] bg-white p-8 text-center shadow-[0_12px_35px_rgba(32,38,34,0.08)]">
              <Heart className="mx-auto h-10 w-10 text-emerald-700" />
              <h2 className="mt-4 text-xl font-black">{text.emptyTitle}</h2>
              <p className="mt-2 text-sm font-semibold text-stone-500">{text.emptyText}</p>
            </div>
          ) : (
            visibleFavorites.map((item) => {
              const meta = typeMeta[item.type];
              const Icon = meta.icon;
              return (
                <article key={`${item.type}-${item.id}`} className="rounded-[28px] bg-white p-4 shadow-[0_12px_35px_rgba(32,38,34,0.08)]">
                  <div className="flex items-start gap-3">
                    <Link href={meta.href} className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${meta.className}`}>
                      <Icon className="h-6 w-6" />
                    </Link>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-black ${meta.className}`}>{meta.label}</span>
                        {item.pinned && <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-black text-amber-700">{text.pinned}</span>}
                        <span className="text-xs font-bold text-stone-400">{formatSavedAt(item.savedAt, locale)}</span>
                      </div>
                      <h2 className="mt-2 text-lg font-black leading-tight">{item.title}</h2>
                      <p className="mt-1 text-sm font-semibold leading-6 text-stone-500">{item.subtitle}</p>
                    </div>
                  </div>
                  <textarea className="mt-3 min-h-20 w-full rounded-2xl border border-stone-200 bg-stone-50 p-3 text-sm font-bold leading-6 outline-none focus:border-emerald-700" onChange={(event) => updateFavorite(item.type, item.id, { note: event.target.value })} placeholder={text.notePlaceholder} value={item.note ?? ""} />
                  <div className="mt-3 grid grid-cols-[1fr_auto] gap-2">
                    <button className={`inline-flex h-10 items-center justify-center gap-2 rounded-2xl text-sm font-black ${item.pinned ? "bg-amber-50 text-amber-700" : "bg-stone-100 text-stone-600"}`} onClick={() => updateFavorite(item.type, item.id, { pinned: !item.pinned })} type="button">
                      <Pin className="h-4 w-4" />
                      {item.pinned ? text.unpin : text.pin}
                    </button>
                    <button className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-50 text-rose-600" onClick={() => removeFavorite(item.type, item.id)} type="button">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </article>
              );
            })
          )}
        </section>
      </div>
    </main>
  );
}
