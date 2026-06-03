"use client";

import { Building2, ChevronLeft, ChevronRight, ExternalLink, Images, Phone, PlusCircle, Search, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { BackButton } from "@/components/BackButton";
import { CollapsiblePanel } from "@/components/CollapsiblePanel";
import { StationSearchPicker } from "@/components/stations/StationSearchPicker";
import { placeText } from "@/components/PlaceCard";
import type { PlaceItem } from "@/data/places";
import { useFavorites } from "@/hooks/useFavorites";
import { useLanguage } from "@/hooks/useLanguage";
import { useTokyoStations } from "@/hooks/useTokyoStations";
import { getCachedFriendlyShopsData, warmFriendlyShopsData } from "@/lib/appPreload";
import { getStationDisplayName } from "@/lib/stations/stationSearch";
import type { TokyoStation } from "@/lib/stations/types";

type FriendlyShopRecord = {
  address?: string;
  affiliate_url?: string;
  area?: string;
  budget?: string;
  category?: string;
  close_time?: string;
  closed_days?: string;
  description?: string;
  description_zh?: string;
  hotpepper_url?: string;
  id?: string;
  image_url?: string;
  is_verified?: boolean;
  map_url?: string;
  name?: string;
  open_time?: string;
  phone?: string;
  review_status?: string;
  source_type?: string;
  station?: string;
  updated_at?: string;
  website_url?: string;
};

type ExtractedShopInfo = {
  averageSpend: string;
  cleanDescription: string;
  hours: string;
};

const categoryKeys = ["all", "restaurant", "supermarket", "hospital", "realEstate", "scrivener", "mobile", "service", "claim"] as const;

const copy = {
  "zh-CN": {
    addressPreview: "头像 / 图片预览",
    all: "全部",
    apply: "申请上架",
    applyCta: "店铺想进入 Japan Life？提交资料申请上架",
    categoryLabels: {
      all: "全部",
      claim: "申请入口",
      hospital: "医院",
      mobile: "手机卡",
      realEstate: "不动产",
      restaurant: "餐厅",
      scrivener: "行政书士",
      service: "生活服务",
      supermarket: "超市",
    },
    categoryTitle: "分类",
    clearStation: "清除车站筛选：",
    demo: "参考",
    favorite: "收藏",
    favorited: "已收藏",
    hotpepperAction: "HotPepperで予約する",
    hotpepperBadge: "HotPepper预约",
    hotpepperNotice: "已审核通过的 HotPepper 店铺会显示预约按钮；预约、优惠券、积分等以后跳转后的外部页面为准。",
    hours: "营业时间",
    official: "官网",
    perPerson: "人均",
    phone: "电话",
    remoteError: "后台店铺暂时无法读取，当前不显示远程店铺。",
    reservationNote: "预约、优惠券、积分等以后跳转后的外部页面为准。",
    searchPlaceholder: "搜索店名 / 分类 / 车站",
    subtitle: "这里汇总适合外国人在日本生活时使用的店铺与服务。HotPepper 来源店铺会在审核通过后显示预约入口。",
    title: "外国人友好店铺",
    verifiedBadge: "审查済み",
  },
  "zh-TW": {
    addressPreview: "頭像 / 圖片預覽",
    all: "全部",
    apply: "申請上架",
    applyCta: "店鋪想進入 Japan Life？提交資料申請上架",
    categoryLabels: {
      all: "全部",
      claim: "申請入口",
      hospital: "醫院",
      mobile: "手機卡",
      realEstate: "不動產",
      restaurant: "餐廳",
      scrivener: "行政書士",
      service: "生活服務",
      supermarket: "超市",
    },
    categoryTitle: "分類",
    clearStation: "清除車站篩選：",
    demo: "參考",
    favorite: "收藏",
    favorited: "已收藏",
    hotpepperAction: "HotPepperで予約する",
    hotpepperBadge: "HotPepper預約",
    hotpepperNotice: "已審核通過的 HotPepper 店鋪會顯示預約按鈕；預約、優惠券、積分等以跳轉後的外部頁面為準。",
    hours: "營業時間",
    official: "官網",
    perPerson: "人均",
    phone: "電話",
    remoteError: "後台店鋪暫時無法讀取，當前不顯示遠端店鋪。",
    reservationNote: "預約、優惠券、積分等以跳轉後的外部頁面為準。",
    searchPlaceholder: "搜尋店名 / 分類 / 車站",
    subtitle: "這裡匯總適合外國人在日本生活時使用的店鋪與服務。HotPepper 來源店鋪會在審核通過後顯示預約入口。",
    title: "外國人友好店鋪",
    verifiedBadge: "審査済み",
  },
  ja: {
    addressPreview: "アイコン / 画像プレビュー",
    all: "すべて",
    apply: "掲載申請",
    applyCta: "お店を Japan Life に掲載したい場合は資料を送ってください",
    categoryLabels: {
      all: "すべて",
      claim: "申請入口",
      hospital: "病院",
      mobile: "携帯 / SIM",
      realEstate: "不動産",
      restaurant: "飲食店",
      scrivener: "行政書士",
      service: "生活サービス",
      supermarket: "スーパー",
    },
    categoryTitle: "カテゴリ",
    clearStation: "駅フィルターを解除：",
    demo: "参考",
    favorite: "保存",
    favorited: "保存済み",
    hotpepperAction: "HotPepperで予約する",
    hotpepperBadge: "HotPepper予約",
    hotpepperNotice: "審査を通過した HotPepper 店舗のみ予約ボタンを表示します。予約、クーポン、ポイント等は遷移先の外部ページに従います。",
    hours: "営業時間",
    official: "公式サイト",
    perPerson: "平均",
    phone: "電話",
    remoteError: "管理側の店舗データを読み込めません。現在は遠隔店舗を表示していません。",
    reservationNote: "予約、クーポン、ポイント等は遷移先の外部ページに従います。",
    searchPlaceholder: "店名 / カテゴリ / 駅で検索",
    subtitle: "外国人が日本で生活する時に使いやすいお店とサービスをまとめています。HotPepper 店舗は審査通過後に予約導線が表示されます。",
    title: "外国人にやさしいお店",
    verifiedBadge: "審査済み",
  },
} as const;

const galleryCopy = {
  "zh-CN": { close: "关闭", galleryHint: "菜单 / 场地图片", galleryTitle: "图片预览", nextImage: "下一张", prevImage: "上一张" },
  "zh-TW": { close: "關閉", galleryHint: "菜單 / 場地圖片", galleryTitle: "圖片預覽", nextImage: "下一張", prevImage: "上一張" },
  ja: { close: "閉じる", galleryHint: "メニュー / 店内画像", galleryTitle: "画像プレビュー", nextImage: "次の画像", prevImage: "前の画像" },
} as const;

export default function PlacesPage() {
  const { language } = useLanguage();
  const { error: stationError, loading: stationsLoading, stations } = useTokyoStations(language);
  const text = copy[language];
  const galleryText = galleryCopy[language];
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<(typeof categoryKeys)[number]>("all");
  const [galleryState, setGalleryState] = useState<{ placeId: string; index: number } | null>(null);
  const [remotePlaces, setRemotePlaces] = useState<PlaceItem[]>([]);
  const [remoteError, setRemoteError] = useState(false);
  const [selectedStation, setSelectedStation] = useState<TokyoStation | null>(null);
  const { isFavorite, toggleFavorite } = useFavorites();

  const selectedGalleryPlace = galleryState ? remotePlaces.find((place) => place.id === galleryState.placeId) : undefined;
  const selectedGallery = selectedGalleryPlace ? getPlaceGallery(selectedGalleryPlace) : [];
  const selectedGalleryIndex = selectedGallery.length > 0 && galleryState ? clampIndex(galleryState.index, selectedGallery.length) : 0;
  const selectedGalleryImage = selectedGallery[selectedGalleryIndex];
  const selectedGalleryTitle = selectedGalleryImage ? getGalleryTitle(selectedGalleryImage, language) : "";
  const selectedPlaceTitle = selectedGalleryPlace ? placeText(selectedGalleryPlace, language).name : "";

  const filtered = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return remotePlaces.filter((place) => {
      const localized = placeText(place, language);
      const haystack = [
        place.name,
        place.nameZhTW,
        place.nameJa,
        place.subtitle,
        place.subtitleZhTW,
        place.subtitleJa,
        place.category,
        place.categoryZhTW,
        place.categoryJa,
        place.area,
        place.areaZhTW,
        place.areaJa,
        place.address,
        place.addressZhTW,
        place.addressJa,
        place.averageSpend,
        place.hours,
        place.phone,
        place.website,
        place.hotpepperUrl,
        ...place.tags,
        ...(place.tagsZhTW ?? []),
        ...(place.tagsJa ?? []),
      ].filter(Boolean).join(" ").toLowerCase();

      const selectedStationKeyword = selectedStation ? selectedStation.nameJa.replace(/駅/g, "").toLowerCase() : "";
      const matchCategory =
        category === "all" ||
        localized.category === text.categoryLabels[category] ||
        place.category === text.categoryLabels[category] ||
        place.categoryZhTW === text.categoryLabels[category] ||
        place.categoryJa === text.categoryLabels[category];
      const matchStation = !selectedStation || haystack.includes(selectedStationKeyword);

      return matchCategory && matchStation && (!keyword || haystack.includes(keyword));
    });
  }, [category, language, query, remotePlaces, selectedStation, text.categoryLabels]);

  useEffect(() => {
    let cancelled = false;
    const cached = getCachedFriendlyShopsData();
    if (cached) {
      setRemotePlaces(toFriendlyShopRecords(cached.items).map(shopRecordToPlaceItem));
      setRemoteError(false);
    }

    warmFriendlyShopsData()
      .then((data) => {
        if (cancelled) return;
        setRemotePlaces(toFriendlyShopRecords(data.items).map(shopRecordToPlaceItem));
        setRemoteError(false);
      })
      .catch(() => {
        if (cancelled) return;
        setRemotePlaces([]);
        setRemoteError(true);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="jl-tool-theme min-h-screen text-stone-950">
      <div className="jl-tool-shell mx-auto min-h-screen max-w-[430px] px-4 py-5">
        <div className="mb-4 flex items-center justify-between">
          <BackButton />
          <Link className="selection-chip inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-black is-selected" href="/claim">
            <PlusCircle className="h-4 w-4" />
            {text.apply}
          </Link>
        </div>

        <section className="rounded-[24px] border border-slate-200 bg-white p-5 text-[#0F172A] shadow-sm">
          <h1 className="text-2xl font-black">{text.title}</h1>
          <p className="mt-2 text-xs font-bold leading-5 text-[#64748B]">{text.subtitle}</p>
        </section>

        <section className="mt-4 rounded-[18px] bg-white p-3 shadow-sm">
          <label className="flex h-10 min-w-0 flex-1 items-center gap-2 rounded-xl bg-stone-50 px-3">
            <Search className="h-4 w-4 text-blue-700" />
            <input className="w-full bg-transparent text-sm font-black outline-none" placeholder={text.searchPlaceholder} value={query} onChange={(event) => setQuery(event.target.value)} />
          </label>

          <CollapsiblePanel className="mt-2 rounded-[18px] border-blue-100 bg-white p-4 shadow-none" contentClassName="mt-3" title={text.categoryTitle}>
            <div className="flex flex-wrap gap-2">
              {categoryKeys.map((item) => (
                <button className={`selection-chip min-h-10 min-w-12 rounded-full px-3 py-1.5 text-[11px] font-black leading-tight ${category === item ? "is-selected" : ""}`} key={item} onClick={() => setCategory(item)} type="button">
                  {text.categoryLabels[item]}
                </button>
              ))}
            </div>
          </CollapsiblePanel>

          <div className="mt-3">
            <StationSearchPicker appLocation={null} error={stationError} loading={stationsLoading} onSelect={setSelectedStation} selectedStation={selectedStation} stations={stations} />
            {selectedStation ? (
              <button className="mt-2 min-h-10 w-full rounded-2xl border border-blue-100 bg-white px-3 text-xs font-black text-blue-800" onClick={() => setSelectedStation(null)} type="button">
                {text.clearStation}
                {getStationDisplayName(selectedStation)}
              </button>
            ) : null}
          </div>
        </section>

        {remoteError ? <p className="mt-3 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-black text-red-700">{text.remoteError}</p> : null}
        <p className="mt-3 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-xs font-bold leading-5 text-blue-900">{text.hotpepperNotice}</p>

        <section className="mt-4 grid gap-3">
          {filtered.map((place) => {
            const localized = placeText(place, language);
            const favorite = isFavorite("place", place.id);
            const gallery = getPlaceGallery(place);
            const reservationUrl = getReservationUrl(place);
            const hotpepper = place.sourceType === "hotpepper";

            return (
              <article className="rounded-[26px] border border-[#BFDBFE] bg-white p-4 shadow-[0_12px_30px_rgba(37,99,235,0.08)]" key={place.id}>
                <div className="flex items-start gap-3">
                  <PlaceAvatar galleryCount={gallery.length} onOpen={() => gallery.length > 0 && setGalleryState({ placeId: place.id, index: 0 })} place={place} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-black text-slate-950">{localized.name}</h2>
                      {place.isDemo ? <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-black text-amber-700">{text.demo}</span> : null}
                      {hotpepper ? <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-black text-rose-700">{text.hotpepperBadge}</span> : null}
                      {place.isVerified ? <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-black text-emerald-700">{text.verifiedBadge}</span> : null}
                    </div>
                    <p className="mt-1 text-xs font-bold text-slate-500">{localized.area} / {localized.category}</p>
                    <p className="mt-2 text-sm font-bold leading-6 text-slate-600">{localized.subtitle}</p>
                  </div>
                  <button className={`place-favorite-button rounded-full px-3 py-1 text-xs font-black ${favorite ? "is-active" : ""}`} onClick={() => toggleFavorite({ id: place.id, type: "place", title: localized.name, subtitle: `${localized.area} / ${localized.category}` })} type="button">
                    {favorite ? text.favorited : text.favorite}
                  </button>
                </div>

                <div className="mt-4 grid gap-2 text-xs font-black text-slate-800">
                  {place.averageSpend ? <Info label={text.perPerson} value={place.averageSpend} /> : null}
                  {place.hours ? <Info label={text.hours} value={place.hours} /> : null}
                  {place.phone ? <Info label={text.phone} value={place.phone} /> : null}
                  {place.website ? <Info label={text.official} value={place.website.replace(/^https?:\/\//, "")} /> : null}
                </div>

                {(place.phone || place.website || reservationUrl) ? (
                  <div className="mt-3 grid gap-2">
                    {place.phone ? (
                      <a className="place-action-button flex items-center justify-center gap-2 rounded-2xl px-3 py-2.5 text-xs font-black" href={`tel:${place.phone.replace(/[^\d+]/g, "")}`}>
                        <Phone className="h-4 w-4" />
                        {place.phone}
                      </a>
                    ) : null}
                    {place.website ? (
                      <a className="place-action-button flex items-center justify-center gap-2 rounded-2xl px-3 py-2.5 text-xs font-black" href={place.website} rel="noreferrer" target="_blank">
                        <ExternalLink className="h-4 w-4" />
                        {text.official}
                      </a>
                    ) : null}
                    {hotpepper && reservationUrl ? (
                      <a className="flex items-center justify-center gap-2 rounded-2xl bg-[#E11D48] px-3 py-3 text-xs font-black text-white shadow-sm" href={reservationUrl} rel="noreferrer" target="_blank">
                        <ExternalLink className="h-4 w-4" />
                        {text.hotpepperAction}
                      </a>
                    ) : null}
                  </div>
                ) : null}

                {hotpepper && reservationUrl ? (
                  <p className="mt-2 text-[11px] font-bold leading-5 text-slate-500">{place.reservationNote ?? text.reservationNote}</p>
                ) : null}

                {localized.address ? (
                  <a className="place-address-button mt-3 flex items-center justify-between rounded-2xl px-3 py-2 text-xs font-black" href={getPlaceMapUrl(place, localized.address)} rel="noreferrer" target="_blank">
                    {localized.address}
                    <ExternalLink className="h-4 w-4" />
                  </a>
                ) : null}

                <div className="mt-3 flex flex-wrap gap-2">
                  {localized.tags.map((tag) => (
                    <span className="place-tag rounded-full px-2 py-1 text-[11px] font-black" key={tag}>
                      {tag}
                    </span>
                  ))}
                </div>
              </article>
            );
          })}
        </section>

        <Link className="mt-4 flex items-center justify-center gap-2 rounded-[18px] border border-blue-100 bg-white p-4 text-sm font-black text-blue-800 shadow-sm" href="/claim">
          <PlusCircle className="h-5 w-5" />
          {text.applyCta}
        </Link>
      </div>

      {galleryState && selectedGalleryPlace && selectedGalleryImage ? (
        <div aria-label={galleryText.galleryTitle} aria-modal="true" className="fixed inset-0 z-50 flex items-end justify-center bg-stone-950/55 px-3 pb-4 pt-12 backdrop-blur-sm min-[520px]:items-center min-[520px]:p-6" role="dialog">
          <div className="w-full max-w-[430px] overflow-hidden rounded-[26px] bg-[#f6faff] shadow-[0_24px_70px_rgba(37,99,235,0.22)]">
            <div className="flex items-center justify-between gap-3 border-b border-stone-100 bg-white px-4 py-3">
              <div className="min-w-0">
                <p className="text-[11px] font-black text-blue-800">{galleryText.galleryTitle}</p>
                <h2 className="truncate text-sm font-black text-stone-950">{selectedPlaceTitle}</h2>
              </div>
              <button aria-label={galleryText.close} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-stone-100 text-stone-700" onClick={() => setGalleryState(null)} type="button">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="relative bg-stone-900">
              <img alt={selectedGalleryTitle || selectedPlaceTitle} className="aspect-[4/3] w-full object-cover" src={selectedGalleryImage.url} />
              {selectedGallery.length > 1 ? (
                <>
                  <button aria-label={galleryText.prevImage} className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-stone-900 shadow-sm" onClick={() => setGalleryState({ placeId: selectedGalleryPlace.id, index: (selectedGalleryIndex - 1 + selectedGallery.length) % selectedGallery.length })} type="button">
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button aria-label={galleryText.nextImage} className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-stone-900 shadow-sm" onClick={() => setGalleryState({ placeId: selectedGalleryPlace.id, index: (selectedGalleryIndex + 1) % selectedGallery.length })} type="button">
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </>
              ) : null}
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
                {selectedGallery.length > 1 ? (
                  <div className="flex shrink-0 gap-1 pt-1">
                    {selectedGallery.map((item, index) => (
                      <button aria-label={`${index + 1} / ${selectedGallery.length}`} className={`h-2 rounded-full transition-all ${index === selectedGalleryIndex ? "w-5 bg-blue-700" : "w-2 bg-stone-300"}`} key={`${selectedGalleryPlace.id}-${item.url}-${index}`} onClick={() => setGalleryState({ placeId: selectedGalleryPlace.id, index })} type="button" />
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}

function toFriendlyShopRecords(items: unknown[] | undefined): FriendlyShopRecord[] {
  return (items ?? []).filter((item): item is FriendlyShopRecord => Boolean(item) && typeof item === "object");
}

function shopRecordToPlaceItem(record: FriendlyShopRecord): PlaceItem {
  const sourceType = record.source_type ?? "japan_life";
  const description = record.description ?? "";
  const extractedInfo = extractShopInfo(description);
  const descriptionZh = record.description_zh?.trim() ?? "";
  const subtitle = descriptionZh || extractedInfo.cleanDescription || record.station || record.address || "";
  const hours = [record.open_time, record.close_time].filter(Boolean).join(" - ") || extractedInfo.hours;
  const budget = record.budget?.trim() || extractedInfo.averageSpend;
  const area = record.area?.trim() || "";
  const category = normalizeShopCategory(record.category);
  const station = record.station?.trim() || "";
  const tags = [category, area, station].filter(Boolean);
  const hotpepperUrl = record.hotpepper_url?.trim() || "";
  const affiliateUrl = record.affiliate_url?.trim() || "";

  return {
    address: record.address ?? "",
    affiliateUrl,
    area,
    category,
    foreignerFriendly: true,
    hotpepperUrl,
    id: `remote-${record.id ?? record.name ?? record.address ?? "shop"}`,
    imageUrl: record.image_url ?? "",
    isVerified: record.is_verified === true,
    mapUrl: record.map_url ?? "",
    name: record.name ?? "",
    phone: record.phone ?? "",
    averageSpend: budget,
    hours,
    reservationNote: "预约、优惠券、积分等以后跳转后的外部页面为准。",
    sourceType,
    subtitle,
    supportsChinese: Boolean(descriptionZh),
    supportsJapanese: true,
    tags,
    tagsJa: tags,
    tagsZhTW: tags,
    updatedAt: record.updated_at ?? "",
    website: sourceType === "hotpepper" ? "" : record.website_url ?? "",
  };
}

function extractShopInfo(description: string): ExtractedShopInfo {
  const lines = description.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  let averageSpend = "";
  let hours = "";
  const cleanLines: string[] = [];

  for (const line of lines) {
    if (/^(?:source|access|budget|open|closed)\s*:/i.test(line)) {
      if (!averageSpend && /^budget\s*:/i.test(line)) averageSpend = line.replace(/^budget\s*:/i, "").trim();
      if (!hours && /^open\s*:/i.test(line)) hours = line.replace(/^open\s*:/i, "").trim();
      continue;
    }
    if (/^https?:\/\//i.test(line)) continue;
    cleanLines.push(line);
  }

  return {
    averageSpend,
    cleanDescription: cleanLines.join("\n"),
    hours,
  };
}

function normalizeShopCategory(value: string | undefined) {
  const categories: Record<string, string> = {
    beauty: "生活服务",
    cafe: "餐厅",
    education: "生活服务",
    hospital: "医院",
    mobile: "手机卡",
    realEstate: "不动产",
    restaurant: "餐厅",
    scrivener: "行政书士",
    service: "生活服务",
    supermarket: "超市",
  };
  return categories[value ?? ""] ?? value ?? "生活服务";
}

function getReservationUrl(place: PlaceItem) {
  return place.affiliateUrl || place.hotpepperUrl || "";
}

function getPlaceMapUrl(place: PlaceItem, address: string) {
  const directUrl = place.mapUrl ?? place.map_url;
  if (directUrl) return directUrl;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-w-0 items-start justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2.5 shadow-sm">
      <p className="shrink-0 text-[11px] font-black text-slate-500">{label}</p>
      <p className="min-w-0 flex-1 break-words text-right text-sm font-black leading-5 text-slate-950">{value}</p>
    </div>
  );
}

function PlaceAvatar({ galleryCount, onOpen, place }: { galleryCount: number; onOpen: () => void; place: PlaceItem }) {
  if (place.imageUrl) {
    return (
      <div className="relative shrink-0 overflow-visible pb-1 pr-1">
        <button aria-label="open gallery" className="relative h-11 w-11 overflow-hidden rounded-full border border-blue-100 bg-white shadow-sm" onClick={onOpen} type="button">
          <img alt="" className="h-full w-full object-cover" src={place.imageUrl} />
        </button>
        {galleryCount > 1 ? (
          <span className="pointer-events-none absolute -bottom-0.5 -right-0.5 z-10 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#2563EB] px-1 text-[10px] font-black leading-none text-white ring-2 ring-white shadow-sm">
            {galleryCount}
          </span>
        ) : null}
      </div>
    );
  }

  return (
    <button aria-label="open gallery" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-800 disabled:opacity-60" disabled={galleryCount === 0} onClick={onOpen} type="button">
      {galleryCount > 0 ? <Images className="h-6 w-6" /> : <Building2 className="h-6 w-6" />}
    </button>
  );
}

function getPlaceGallery(place: PlaceItem) {
  if (place.gallery?.length) return place.gallery;
  if (place.imageUrl) {
    return [{ url: place.imageUrl, title: place.name, titleZhTW: place.nameZhTW, titleJa: place.nameJa }];
  }
  return [];
}

function getGalleryTitle(image: ReturnType<typeof getPlaceGallery>[number], language: "zh-CN" | "zh-TW" | "ja") {
  if (language === "zh-TW") return image.titleZhTW ?? image.title;
  if (language === "ja") return image.titleJa ?? image.title;
  return image.title;
}

function clampIndex(index: number, length: number) {
  return Math.min(Math.max(index, 0), length - 1);
}
