"use client";

import { ArrowLeft, Building2, ChevronLeft, ChevronRight, ExternalLink, Images, Phone, PlusCircle, Search, Store, X } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { placeItems } from "@/data/places";
import { placeText } from "@/components/PlaceCard";
import { useFavorites } from "@/hooks/useFavorites";
import { useLanguage } from "@/hooks/useLanguage";

const categoryKeys = ["all", "restaurant", "supermarket", "hospital", "realEstate", "scrivener", "mobile", "service", "claim"] as const;
const wardKeys = ["all", "chiyoda", "chuo", "minato", "shinjuku", "bunkyo", "taito", "sumida", "koto", "shinagawa", "meguro", "ota", "setagaya", "shibuya", "nakano", "suginami", "toshima", "kita", "arakawa", "itabashi", "nerima", "adachi", "katsushika", "edogawa"] as const;

const galleryCopy = {
  "zh-CN": {
    close: "关闭",
    galleryHint: "菜单 / 场地图片",
    galleryTitle: "图片预览",
    nextImage: "下一张",
    prevImage: "上一张",
  },
  "zh-TW": {
    close: "關閉",
    galleryHint: "菜單 / 場地圖片",
    galleryTitle: "圖片預覽",
    nextImage: "下一張",
    prevImage: "上一張",
  },
  ja: {
    close: "閉じる",
    galleryHint: "メニュー / 店内画像",
    galleryTitle: "画像プレビュー",
    nextImage: "次の画像",
    prevImage: "前の画像",
  },
} as const;

const copy = {
  "zh-CN": {
    addressPreview: "头像 / 菜单预览入口",
    all: "全部",
    apply: "申请上架",
    applyCta: "店铺想进入 Japan Life？提交资料申请上架",
    categoryLabels: { all: "全部", restaurant: "餐厅", supermarket: "超市", hospital: "医院", realEstate: "不动产", scrivener: "行政书士", mobile: "手机卡", service: "生活服务", claim: "申请入口" },
    demo: "示范",
    favorite: "收藏",
    favorited: "已收藏",
    filterTitle: "更多选项：东京 23 区筛选",
    foreignerFriendly: "外国人友好",
    official: "官网",
    perPerson: "人均",
    phone: "电话",
    searchPlaceholder: "搜索店名 / 分类 / 地区",
    subtitle: "店铺会经过人工核实后上架。当前保留一个示范店铺，方便你确认录入格式和展示效果。",
    supportsChinese: "中文",
    supportsChineseValue: "支持",
    title: "外国人友好店铺",
    hours: "营业时间",
    wardLabels: { all: "全部", chiyoda: "千代田区", chuo: "中央区", minato: "港区", shinjuku: "新宿区", bunkyo: "文京区", taito: "台东区", sumida: "墨田区", koto: "江东区", shinagawa: "品川区", meguro: "目黑区", ota: "大田区", setagaya: "世田谷区", shibuya: "涩谷区", nakano: "中野区", suginami: "杉并区", toshima: "丰岛区", kita: "北区", arakawa: "荒川区", itabashi: "板桥区", nerima: "练马区", adachi: "足立区", katsushika: "葛饰区", edogawa: "江户川区" },
    yes: "是",
  },
  "zh-TW": {
    addressPreview: "頭像 / 菜單預覽入口",
    all: "全部",
    apply: "申請上架",
    applyCta: "店鋪想進入 Japan Life？提交資料申請上架",
    categoryLabels: { all: "全部", restaurant: "餐廳", supermarket: "超市", hospital: "醫院", realEstate: "不動產", scrivener: "行政書士", mobile: "手機卡", service: "生活服務", claim: "申請入口" },
    demo: "示範",
    favorite: "收藏",
    favorited: "已收藏",
    filterTitle: "更多選項：東京 23 區篩選",
    foreignerFriendly: "外國人友好",
    official: "官網",
    perPerson: "人均",
    phone: "電話",
    searchPlaceholder: "搜尋店名 / 分類 / 地區",
    subtitle: "店鋪會經過人工核實後上架。目前保留一個示範店鋪，方便你確認錄入格式和展示效果。",
    supportsChinese: "中文",
    supportsChineseValue: "支援",
    title: "外國人友好店鋪",
    hours: "營業時間",
    wardLabels: { all: "全部", chiyoda: "千代田區", chuo: "中央區", minato: "港區", shinjuku: "新宿區", bunkyo: "文京區", taito: "台東區", sumida: "墨田區", koto: "江東區", shinagawa: "品川區", meguro: "目黑區", ota: "大田區", setagaya: "世田谷區", shibuya: "澀谷區", nakano: "中野區", suginami: "杉並區", toshima: "豐島區", kita: "北區", arakawa: "荒川區", itabashi: "板橋區", nerima: "練馬區", adachi: "足立區", katsushika: "葛飾區", edogawa: "江戶川區" },
    yes: "是",
  },
  ja: {
    addressPreview: "アイコン / メニュー確認入口",
    all: "すべて",
    apply: "掲載申請",
    applyCta: "店舗を Japan Life に掲載したい場合は、資料を送信してください",
    categoryLabels: { all: "すべて", restaurant: "飲食店", supermarket: "スーパー", hospital: "病院", realEstate: "不動産", scrivener: "行政書士", mobile: "スマホ", service: "生活サービス", claim: "申請入口" },
    demo: "サンプル",
    favorite: "保存",
    favorited: "保存済み",
    filterTitle: "その他：東京23区で絞り込み",
    foreignerFriendly: "外国人にやさしい",
    official: "公式サイト",
    perPerson: "平均",
    phone: "電話",
    searchPlaceholder: "店名 / カテゴリ / エリアを検索",
    subtitle: "店舗は運営確認後に掲載されます。現在は入力形式と表示確認用のサンプル店舗を表示しています。",
    supportsChinese: "中国語",
    supportsChineseValue: "対応",
    title: "外国人にやさしい店舗",
    hours: "営業時間",
    wardLabels: { all: "すべて", chiyoda: "千代田区", chuo: "中央区", minato: "港区", shinjuku: "新宿区", bunkyo: "文京区", taito: "台東区", sumida: "墨田区", koto: "江東区", shinagawa: "品川区", meguro: "目黒区", ota: "大田区", setagaya: "世田谷区", shibuya: "渋谷区", nakano: "中野区", suginami: "杉並区", toshima: "豊島区", kita: "北区", arakawa: "荒川区", itabashi: "板橋区", nerima: "練馬区", adachi: "足立区", katsushika: "葛飾区", edogawa: "江戸川区" },
    yes: "はい",
  },
} as const;

export default function PlacesPage() {
  const { language, t } = useLanguage();
  const text = copy[language];
  const galleryText = galleryCopy[language];
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<(typeof categoryKeys)[number]>("all");
  const [ward, setWard] = useState<(typeof wardKeys)[number]>("all");
  const [galleryState, setGalleryState] = useState<{ placeId: string; index: number } | null>(null);
  const { isFavorite, toggleFavorite } = useFavorites();

  const selectedGalleryPlace = galleryState ? placeItems.find((place) => place.id === galleryState.placeId) : undefined;
  const selectedGallery = selectedGalleryPlace ? getPlaceGallery(selectedGalleryPlace) : [];
  const selectedGalleryIndex = selectedGallery.length > 0 && galleryState ? clampIndex(galleryState.index, selectedGallery.length) : 0;
  const selectedGalleryImage = selectedGallery[selectedGalleryIndex];
  const selectedGalleryTitle = selectedGalleryImage ? getGalleryTitle(selectedGalleryImage, language) : "";
  const selectedPlaceTitle = selectedGalleryPlace ? placeText(selectedGalleryPlace, language).name : "";

  const filtered = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return placeItems.filter((place) => {
      const localized = placeText(place, language);
      const haystack = [place.name, place.nameZhTW, place.nameJa, place.subtitle, place.subtitleZhTW, place.subtitleJa, place.category, place.categoryZhTW, place.categoryJa, place.area, place.areaZhTW, place.areaJa, place.address, place.addressZhTW, place.addressJa, place.averageSpend, place.hours, ...place.tags, ...(place.tagsZhTW ?? []), ...(place.tagsJa ?? [])].join(" ").toLowerCase();
      const matchCategory = category === "all" || localized.category === text.categoryLabels[category] || place.category === text.categoryLabels[category] || place.categoryZhTW === text.categoryLabels[category] || place.categoryJa === text.categoryLabels[category];
      const matchWard = ward === "all" || localized.area.includes(text.wardLabels[ward]) || place.area.includes(text.wardLabels[ward]) || place.areaZhTW?.includes(text.wardLabels[ward]) || place.areaJa?.includes(text.wardLabels[ward]);
      return matchCategory && matchWard && (!keyword || haystack.includes(keyword));
    });
  }, [category, language, query, text.categoryLabels, text.wardLabels, ward]);

  return (
    <main className="min-h-screen bg-[#f5f0e7] text-stone-950">
      <div className="mx-auto min-h-screen max-w-[430px] bg-[#fbf8f2] px-4 py-5 shadow-2xl shadow-stone-300/40">
        <div className="mb-4 flex items-center justify-between">
          <Link className="flex items-center gap-2 rounded-full bg-white px-3 py-2 text-xs font-black text-stone-600 shadow-sm" href="/">
            <ArrowLeft className="h-4 w-4" />
            {t.common.back}
          </Link>
          <Link className="inline-flex items-center gap-2 rounded-full bg-emerald-800 px-3 py-2 text-xs font-black text-white shadow-sm" href="/claim">
            <PlusCircle className="h-4 w-4" />
            {text.apply}
          </Link>
        </div>

        <section className="rounded-[24px] bg-emerald-800 p-5 text-white shadow-[0_16px_35px_rgba(20,108,92,0.22)]">
          <Store className="mb-4 h-8 w-8" />
          <h1 className="text-2xl font-black">{text.title}</h1>
          <p className="mt-2 text-xs font-bold leading-5 text-emerald-50">{text.subtitle}</p>
        </section>

        <section className="mt-4 rounded-[18px] bg-white p-3 shadow-sm">
          <label className="flex h-10 min-w-0 flex-1 items-center gap-2 rounded-xl bg-stone-50 px-3">
            <Search className="h-4 w-4 text-emerald-800" />
            <input className="w-full bg-transparent text-sm font-black outline-none" placeholder={text.searchPlaceholder} value={query} onChange={(event) => setQuery(event.target.value)} />
          </label>

          <div className="mt-2 flex gap-2 overflow-x-auto">
            {categoryKeys.map((item) => (
              <button className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-black ${category === item ? "bg-emerald-800 text-white" : "bg-emerald-50 text-emerald-800"}`} key={item} onClick={() => setCategory(item)} type="button">
                {text.categoryLabels[item]}
              </button>
            ))}
          </div>

          <details className="mt-2 rounded-xl bg-stone-50 p-3">
            <summary className="cursor-pointer text-sm font-black text-stone-800">{text.filterTitle}</summary>
            <div className="mt-2 grid grid-cols-2 gap-2 min-[360px]:grid-cols-3">
              {wardKeys.map((item) => (
                <button className={`rounded-lg px-2 py-1.5 text-xs font-black ${ward === item ? "bg-emerald-800 text-white" : "bg-white text-stone-600"}`} key={item} onClick={() => setWard(item)} type="button">
                  {text.wardLabels[item]}
                </button>
              ))}
            </div>
          </details>
        </section>

        <section className="mt-4 grid gap-3">
          {filtered.map((place) => {
            const localized = placeText(place, language);
            const favorite = isFavorite("place", place.id);
            const gallery = getPlaceGallery(place);
            return (
              <article className="rounded-[22px] bg-white p-4 shadow-sm" key={place.id}>
                <div className="flex items-start gap-3">
                  <PlaceAvatar galleryCount={gallery.length} onOpen={() => gallery.length > 0 && setGalleryState({ placeId: place.id, index: 0 })} place={place} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-black">{localized.name}</h2>
                      {place.isDemo && <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-black text-amber-700">{text.demo}</span>}
                    </div>
                    <p className="mt-1 text-xs font-bold text-stone-500">{localized.area} / {localized.category}</p>
                    <p className="mt-2 text-sm font-bold leading-6 text-stone-600">{localized.subtitle}</p>
                  </div>
                  <button className={`rounded-full px-3 py-1 text-xs font-black ${favorite ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-800"}`} onClick={() => toggleFavorite({ id: place.id, type: "place", title: localized.name, subtitle: `${localized.area} / ${localized.category}` })} type="button">
                    {favorite ? text.favorited : text.favorite}
                  </button>
                </div>

                <div className="mt-3 grid grid-cols-1 gap-2 text-xs font-black text-stone-700 min-[360px]:grid-cols-2">
                  {place.averageSpend && <Info label={text.perPerson} value={place.averageSpend} />}
                  {place.hours && <Info label={text.hours} value={place.hours} />}
                  {place.phone && <Info label={text.phone} value={place.phone} />}
                  {place.website && <Info label={text.official} value={place.website.replace(/^https?:\/\//, "")} />}
                  {place.supportsChinese && <Info label={text.supportsChinese} value={text.supportsChineseValue} />}
                  {place.foreignerFriendly && <Info label={text.foreignerFriendly} value={text.yes} />}
                </div>

                {(place.phone || place.website) && (
                  <div className="mt-3 grid grid-cols-1 gap-2 min-[360px]:grid-cols-2">
                    {place.phone && (
                      <a className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-800 px-3 py-2 text-xs font-black text-white" href={`tel:${place.phone.replace(/[^\d+]/g, "")}`}>
                        <Phone className="h-4 w-4" />
                        {place.phone}
                      </a>
                    )}
                    {place.website && (
                      <a className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-800" href={place.website} rel="noreferrer" target="_blank">
                        <ExternalLink className="h-4 w-4" />
                        {text.official}
                      </a>
                    )}
                  </div>
                )}

                {localized.address && (
                  <a className="mt-3 flex items-center justify-between rounded-2xl bg-stone-50 px-3 py-2 text-xs font-black text-stone-700" href={place.mapUrl} rel="noreferrer" target="_blank">
                    {localized.address}
                    <ExternalLink className="h-4 w-4 text-emerald-800" />
                  </a>
                )}

                <div className="mt-3 flex flex-wrap gap-2">
                  {localized.tags.map((tag) => (
                    <span className="rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-black text-emerald-800" key={tag}>
                      {tag}
                    </span>
                  ))}
                </div>
              </article>
            );
          })}
        </section>

        <Link className="mt-4 flex items-center justify-center gap-2 rounded-[18px] border border-emerald-100 bg-white p-4 text-sm font-black text-emerald-800 shadow-sm" href="/claim">
          <PlusCircle className="h-5 w-5" />
          {text.applyCta}
        </Link>
      </div>

      {galleryState && selectedGalleryPlace && selectedGalleryImage && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-stone-950/55 px-3 pb-4 pt-12 backdrop-blur-sm min-[520px]:items-center min-[520px]:p-6" role="dialog" aria-modal="true" aria-label={galleryText.galleryTitle}>
          <div className="w-full max-w-[430px] overflow-hidden rounded-[26px] bg-[#fbf8f2] shadow-[0_24px_70px_rgba(0,0,0,0.28)]">
            <div className="flex items-center justify-between gap-3 border-b border-stone-100 bg-white px-4 py-3">
              <div className="min-w-0">
                <p className="text-[11px] font-black text-emerald-800">{galleryText.galleryTitle}</p>
                <h2 className="truncate text-sm font-black text-stone-950">{selectedPlaceTitle}</h2>
              </div>
              <button className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-stone-100 text-stone-700" onClick={() => setGalleryState(null)} type="button" aria-label={galleryText.close}>
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="relative bg-stone-900">
              <img alt={selectedGalleryTitle || selectedPlaceTitle} className="aspect-[4/3] w-full object-cover" src={selectedGalleryImage.url} />
              {selectedGallery.length > 1 && (
                <>
                  <button className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-stone-900 shadow-sm" onClick={() => setGalleryState({ placeId: selectedGalleryPlace.id, index: (selectedGalleryIndex - 1 + selectedGallery.length) % selectedGallery.length })} type="button" aria-label={galleryText.prevImage}>
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-stone-900 shadow-sm" onClick={() => setGalleryState({ placeId: selectedGalleryPlace.id, index: (selectedGalleryIndex + 1) % selectedGallery.length })} type="button" aria-label={galleryText.nextImage}>
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </>
              )}
              <div className="absolute bottom-3 right-3 rounded-full bg-stone-950/70 px-2.5 py-1 text-xs font-black text-white">
                {selectedGalleryIndex + 1} / {selectedGallery.length}
              </div>
            </div>

            <div className="bg-white px-4 py-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-black text-stone-950">{selectedGalleryTitle || galleryText.galleryHint}</p>
                  <p className="mt-1 text-xs font-bold text-stone-500">{galleryText.galleryHint}</p>
                </div>
                {selectedGallery.length > 1 && (
                  <div className="flex shrink-0 gap-1 pt-1">
                    {selectedGallery.map((item, index) => (
                      <button className={`h-2 rounded-full transition-all ${index === selectedGalleryIndex ? "w-5 bg-emerald-800" : "w-2 bg-stone-300"}`} key={`${selectedGalleryPlace.id}-${item.url}-${index}`} onClick={() => setGalleryState({ placeId: selectedGalleryPlace.id, index })} type="button" aria-label={`${index + 1} / ${selectedGallery.length}`} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-stone-50 px-3 py-2">
      <p className="text-[10px] text-stone-400">{label}</p>
      <p className="mt-0.5 truncate">{value}</p>
    </div>
  );
}

function PlaceAvatar({ galleryCount, onOpen, place }: { galleryCount: number; onOpen: () => void; place: (typeof placeItems)[number] }) {
  if (place.imageUrl) {
    return (
      <div className="relative shrink-0">
        <button className="relative h-11 w-11 overflow-hidden rounded-full border border-emerald-100 bg-white shadow-sm" onClick={onOpen} type="button" aria-label="open gallery">
          <img alt="" className="h-full w-full object-cover" src={place.imageUrl} />
          {galleryCount > 1 && (
            <span className="absolute bottom-0 right-0 flex h-5 min-w-5 items-center justify-center rounded-full bg-emerald-800 px-1 text-[10px] font-black text-white ring-2 ring-white">
              {galleryCount}
            </span>
          )}
        </button>
      </div>
    );
  }

  return (
    <button className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-800 disabled:opacity-60" onClick={onOpen} type="button" disabled={galleryCount === 0} aria-label="open gallery">
      {galleryCount > 0 ? <Images className="h-6 w-6" /> : <Building2 className="h-6 w-6" />}
    </button>
  );
}

function getPlaceGallery(place: (typeof placeItems)[number]) {
  if (place.gallery?.length) {
    return place.gallery;
  }

  if (place.imageUrl) {
    return [{ url: place.imageUrl, title: place.name, titleZhTW: place.nameZhTW, titleJa: place.nameJa }];
  }

  return [];
}

function getGalleryTitle(image: ReturnType<typeof getPlaceGallery>[number], language: "zh-CN" | "zh-TW" | "ja") {
  if (language === "zh-TW") {
    return image.titleZhTW ?? image.title;
  }

  if (language === "ja") {
    return image.titleJa ?? image.title;
  }

  return image.title;
}

function clampIndex(index: number, length: number) {
  return Math.min(Math.max(index, 0), length - 1);
}
