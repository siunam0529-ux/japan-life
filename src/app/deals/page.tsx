"use client";

import type { ComponentType } from "react";
import { BadgePercent, BriefcaseBusiness, ChevronRight, CreditCard, Home, Search, Send, ShoppingBag, Smartphone, Star, WalletCards, Wifi, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { BackButton } from "@/components/BackButton";
import { DataNotice } from "@/components/DataNotice";
import { type DealCategory, type DealItem } from "@/data/deals";
import { useFavorites } from "@/hooks/useFavorites";
import { useLanguage } from "@/hooks/useLanguage";

type Language = "zh-CN" | "zh-TW" | "ja";
type CategoryOption = { id: "all" | DealCategory; icon: ComponentType<{ className?: string }>; zhCN: string; zhTW: string; ja: string };

const categories: CategoryOption[] = [
  { id: "all", icon: BadgePercent, zhCN: "全部", zhTW: "全部", ja: "すべて" },
  { id: "mobile", icon: Smartphone, zhCN: "手机卡", zhTW: "手機卡", ja: "スマホ" },
  { id: "wifi", icon: Wifi, zhCN: "Wi-Fi", zhTW: "Wi-Fi", ja: "Wi-Fi" },
  { id: "creditCard", icon: CreditCard, zhCN: "信用卡", zhTW: "信用卡", ja: "クレジットカード" },
  { id: "remittance", icon: Send, zhCN: "汇款", zhTW: "匯款", ja: "送金" },
  { id: "payment", icon: WalletCards, zhCN: "支付", zhTW: "支付", ja: "支払い" },
  { id: "rentConsult", icon: Home, zhCN: "租房咨询", zhTW: "租屋諮詢", ja: "賃貸相談" },
  { id: "jobApply", icon: BriefcaseBusiness, zhCN: "打工报名", zhTW: "打工報名", ja: "アルバイト応募" },
  { id: "shopping", icon: ShoppingBag, zhCN: "购物", zhTW: "購物", ja: "買い物" },
];

const copy = {
  "zh-CN": {
    title: "生活优惠",
    bannerTitle: "新生活优惠",
    bannerSubtitle: "手机卡、Wi-Fi、汇款、租房等常用服务",
    searchPlaceholder: "搜索手机卡、Wi-Fi、汇款、信用卡",
    noResults: "没有找到相关优惠",
    loadError: "生活优惠暂时无法读取，请稍后再试。",
    emptyHint: "试试搜索“手机卡”“Wi-Fi”“汇款”“租房”",
    validUntil: "有效期",
  },
  "zh-TW": {
    title: "生活優惠",
    bannerTitle: "新生活優惠",
    bannerSubtitle: "手機卡、Wi-Fi、匯款、租屋等常用服務",
    searchPlaceholder: "搜尋手機卡、Wi-Fi、匯款、信用卡",
    noResults: "沒有找到相關優惠",
    loadError: "生活優惠暫時無法讀取，請稍後再試。",
    emptyHint: "試試搜尋「手機卡」「Wi-Fi」「匯款」「租屋」",
    validUntil: "有效期",
  },
  ja: {
    title: "お得な情報",
    bannerTitle: "新生活に便利なお得情報",
    bannerSubtitle: "スマホ、Wi-Fi、送金、賃貸などの便利なサービス",
    searchPlaceholder: "スマホ、Wi-Fi、送金、カードを検索",
    noResults: "関連するお得情報が見つかりません",
    loadError: "お得情報を読み込めません。しばらくしてから再度お試しください。",
    emptyHint: "「スマホ」「Wi-Fi」「送金」「賃貸」で検索してみてください",
    validUntil: "有効期限",
  },
} as const;

function categoryLabel(category: CategoryOption, language: Language) {
  if (language === "ja") return category.ja;
  if (language === "zh-TW") return category.zhTW;
  return category.zhCN;
}

function dealText(deal: DealItem, language: Language) {
  if (language === "ja") return { title: deal.titleJa, description: deal.descriptionJa, reward: deal.rewardTextJa, target: deal.targetUserJa };
  if (language === "zh-TW") return { title: deal.titleZhTW, description: deal.descriptionZhTW, reward: deal.rewardTextZhTW, target: deal.targetUserZhTW };
  return { title: deal.titleZhCN, description: deal.descriptionZhCN, reward: deal.rewardTextZhCN, target: deal.targetUserZhCN };
}

function validUntilText(value: string, language: Language) {
  if (value === "以官方页面为准") {
    if (language === "ja") return "公式ページをご確認ください";
    if (language === "zh-TW") return "以官方頁面為準";
  }
  return value;
}

function DealLogo({ deal }: { deal: DealItem }) {
  if (deal.logoUrl) return <img alt="" className="h-full w-full rounded-2xl object-cover" src={deal.logoUrl} />;
  const category = categories.find((item) => item.id === deal.category);
  const Icon = category?.icon ?? BadgePercent;
  return (
    <div className="flex h-full w-full items-center justify-center rounded-2xl border border-white/70 bg-white/85 text-[#2563EB] shadow-sm backdrop-blur-xl">
      <Icon className="h-6 w-6" />
    </div>
  );
}

type PromotionLinkRecord = Record<string, unknown> & {
  id?: string | number;
  title?: string;
  description?: string;
  image_url?: string;
  link_url?: string;
  coupon_code?: string;
  category?: string;
  created_at?: string;
  updated_at?: string;
  status?: string;
  is_pinned?: boolean;
};

function readRecordString(record: PromotionLinkRecord, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string") return value;
    if (typeof value === "number") return String(value);
  }
  return "";
}

function normalizeDealCategory(value: string): DealCategory {
  const categories: DealCategory[] = ["mobile", "wifi", "creditCard", "remittance", "payment", "rentConsult", "jobApply", "shopping"];
  return categories.includes(value as DealCategory) ? (value as DealCategory) : "shopping";
}

export function normalizePromotionLink(record: PromotionLinkRecord): DealItem {
  const title = readRecordString(record, ["title", "name"]) || "优惠链接";
  const description = readRecordString(record, ["description"]) || "请以商家官方页面为准。";
  const couponCode = readRecordString(record, ["coupon_code"]);
  const reward = couponCode ? `优惠码：${couponCode}` : "优惠内容以官方页面为准";
  const url = readRecordString(record, ["link_url", "url", "app_url", "official_url"]) || "/deals";

  return {
    id: `promotion-${record.id ?? title}`,
    providerName: title,
    titleZhCN: title,
    titleZhTW: title,
    titleJa: title,
    category: normalizeDealCategory(readRecordString(record, ["category"])),
    descriptionZhCN: description,
    descriptionZhTW: description,
    descriptionJa: description,
    rewardTextZhCN: reward,
    rewardTextZhTW: reward,
    rewardTextJa: reward,
    conditionsZhCN: "优惠可能变化，请以官方页面为准。",
    conditionsZhTW: "優惠可能變化，請以官方頁面為準。",
    conditionsJa: "特典は変更される場合があります。公式ページをご確認ください。",
    targetUserZhCN: description,
    targetUserZhTW: description,
    targetUserJa: description,
    officialUrl: url,
    affiliateLinks: { a8: "", rakuten: "", valueCommerce: "", other: "" },
    activeAffiliateProvider: "",
    isAffiliate: true,
    validUntil: "以官方页面为准",
    updatedAt: readRecordString(record, ["updated_at", "created_at"]) || "2026-05-22",
    status: record.status === "published" ? "published" : "hidden",
    tags: [title, description, couponCode, readRecordString(record, ["category"])].filter(Boolean),
    logoUrl: readRecordString(record, ["image_url"]),
  };
}

async function fetchPromotionDeals() {
  const response = await fetch("/api/promotion-links/");
  const text = await response.text();
  const data = text ? (JSON.parse(text) as { items?: PromotionLinkRecord[]; error?: string }) : {};
  if (!response.ok) throw new Error(data.error ?? "Failed to load promotion links");
  return (data.items ?? []).map(normalizePromotionLink);
}

export default function DealsPage() {
  const { language, t } = useLanguage();
  const labels = copy[language];
  const { isFavorite, toggleFavorite } = useFavorites();
  const [deals, setDeals] = useState<DealItem[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<"all" | DealCategory>("all");
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let active = true;
    fetchPromotionDeals()
      .then((items) => {
        if (active) {
          setDeals(items);
          setLoadError("");
        }
      })
      .catch(() => {
        if (active) {
          setDeals([]);
          setLoadError(labels.loadError);
        }
      });

    return () => {
      active = false;
    };
  }, [labels.loadError]);

  const filteredDeals = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return deals.filter((deal) => {
      if (deal.status !== "published") return false;
      const text = dealText(deal, language);
      const matchesCategory = selectedCategory === "all" || deal.category === selectedCategory;
      const haystack = [
        deal.providerName,
        deal.category,
        text.title,
        text.description,
        text.reward,
        text.target,
        deal.titleZhCN,
        deal.titleZhTW,
        deal.titleJa,
        ...deal.tags,
      ].join(" ").toLowerCase();
      return matchesCategory && (!keyword || haystack.includes(keyword));
    });
  }, [deals, language, query, selectedCategory]);

  return (
    <main className="min-h-screen bg-[#f5f0e7] text-stone-950">
      <div className="mx-auto min-h-screen max-w-[430px] bg-[#fbf8f2] px-4 pb-4 pt-4 shadow-2xl shadow-stone-300/40">
        <header className="flex items-center justify-between py-2">
          <BackButton label={t.common.back} variant="icon" />
          <h1 className="text-[24px] font-black">{labels.title}</h1>
          <button aria-label={t.common.search} className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-stone-900 shadow-sm" onClick={() => setShowSearch((current) => !current)} type="button">
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
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-[28px] border border-white/70 bg-white/85 text-[#2563EB] shadow-lg shadow-blue-200/40 backdrop-blur-xl">
              <BadgePercent className="h-10 w-10" />
            </div>
          </div>
        </section>

        <section className="-mx-4 mt-4 overflow-x-auto px-4 pb-1">
          <div className="flex gap-2">
            {categories.map((category) => {
              const Icon = category.icon;
              const active = selectedCategory === category.id;
              return (
                <button className={`selection-chip flex h-10 shrink-0 items-center gap-1.5 rounded-full border px-4 text-sm font-black shadow-sm ${active ? "is-selected" : ""}`} key={category.id} onClick={() => setSelectedCategory(category.id)} type="button">
                  <Icon className="h-4 w-4" />
                  {categoryLabel(category, language)}
                </button>
              );
            })}
          </div>
        </section>

        <section className="mt-4 grid gap-3">
          {loadError && <p className="rounded-[22px] border border-red-100 bg-red-50 px-4 py-3 text-sm font-black text-red-700">{loadError}</p>}
          {filteredDeals.length === 0 ? (
            <div className="rounded-[26px] bg-white p-7 text-center shadow-[0_10px_28px_rgba(32,38,34,0.06)]">
              <Search className="mx-auto h-9 w-9 text-emerald-700" />
              <h2 className="mt-3 text-lg font-black">{labels.noResults}</h2>
              <p className="mt-2 text-sm font-bold leading-6 text-stone-500">{labels.emptyHint}</p>
            </div>
          ) : (
            filteredDeals.map((deal) => {
              const text = dealText(deal, language);
              const category = categories.find((item) => item.id === deal.category);
              const favorite = isFavorite("deal", deal.id);
              return (
                <article className="overflow-hidden rounded-[22px] bg-white p-3 shadow-[0_10px_24px_rgba(32,38,34,0.06)]" key={deal.id}>
                  <div className="grid grid-cols-[56px_minmax(0,1fr)_32px] items-center gap-2.5">
                    <Link className="h-14 w-14 overflow-hidden rounded-[18px] border border-stone-100 bg-white" href={`/deals/${deal.id}`}>
                      <DealLogo deal={deal} />
                    </Link>
                    <Link className="min-w-0 flex-1" href={`/deals/${deal.id}`}>
                      <div className="flex min-w-0 items-center gap-1.5">
                        <h2 className="min-w-0 flex-1 truncate text-[17px] font-black leading-tight">{deal.providerName}</h2>
                        {category && <span className="max-w-[72px] shrink-0 truncate rounded-full bg-emerald-50 px-1.5 py-0.5 text-[10px] font-black text-emerald-700">{categoryLabel(category, language)}</span>}
                      </div>
                      <p className="mt-1 truncate text-[13px] font-black text-emerald-800">{text.reward}</p>
                      <p className="mt-1 line-clamp-1 text-xs font-bold text-stone-500">{text.target}</p>
                      <p className="mt-1 text-[11px] font-bold text-stone-400">{labels.validUntil}: {validUntilText(deal.validUntil, language)}</p>
                    </Link>
                    <div className="flex w-8 shrink-0 flex-col items-center gap-1">
                      <button className="flex h-8 w-8 items-center justify-center rounded-full text-stone-400" onClick={() => toggleFavorite({ id: deal.id, type: "deal", title: deal.providerName, subtitle: text.reward })} type="button">
                        <Star className={`h-5 w-5 ${favorite ? "fill-amber-300 text-amber-400" : ""}`} />
                      </button>
                      <Link aria-label={deal.providerName} className="text-stone-400" href={`/deals/${deal.id}`}>
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
          source="Supabase 后台优惠链接 / 推广资料"
          sourceZhTW="Supabase 後台優惠連結 / 推廣資料"
          sourceJa="Supabase 管理画面の特典リンク / プロモーション資料"
          updatedAt="2026-05-22"
          note="优惠、佣金、推广关系和有效期可能变化；申请、付款或签约前请以商家官方页面为准。"
          noteZhTW="優惠、佣金、推廣關係和有效期可能變化；申請、付款或簽約前請以商家官方頁面為準。"
          noteJa="特典、報酬、プロモーション条件、有効期限は変更される場合があります。申込、支払い、契約前に公式ページをご確認ください。"
        />
      </div>
    </main>
  );
}
