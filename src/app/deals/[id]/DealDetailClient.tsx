"use client";

import { ArrowLeft, BadgePercent, ExternalLink, Star } from "lucide-react";
import Link from "next/link";
import { dealItems, type DealItem } from "@/data/deals";
import { useFavorites } from "@/hooks/useFavorites";
import { useLanguage } from "@/hooks/useLanguage";

type Language = "zh-CN" | "zh-TW" | "ja";

const categoryLabels = {
  mobile: { "zh-CN": "手机卡", "zh-TW": "手機卡", ja: "スマホ" },
  wifi: { "zh-CN": "Wi-Fi", "zh-TW": "Wi-Fi", ja: "Wi-Fi" },
  creditCard: { "zh-CN": "信用卡", "zh-TW": "信用卡", ja: "クレジットカード" },
  remittance: { "zh-CN": "汇款", "zh-TW": "匯款", ja: "送金" },
  payment: { "zh-CN": "支付", "zh-TW": "支付", ja: "支払い" },
  rentConsult: { "zh-CN": "租房咨询", "zh-TW": "租屋諮詢", ja: "賃貸相談" },
  jobApply: { "zh-CN": "打工报名", "zh-TW": "打工報名", ja: "アルバイト応募" },
  shopping: { "zh-CN": "购物", "zh-TW": "購物", ja: "買い物" },
} as const;

const copy = {
  "zh-CN": {
    reward: "优惠内容",
    target: "适合人群",
    conditions: "活动条件",
    validUntil: "有效期",
    updatedAt: "更新时间",
    apply: "通过专属链接申请",
    official: "查看官方网站",
    disabled: "专属链接准备中",
    caution: "活动可能变动，请以官方页面为准。",
    affiliateNote: "部分链接可能为推广链接。活动条件请以官方页面为准。",
    favorite: "收藏优惠",
    saved: "已收藏",
  },
  "zh-TW": {
    reward: "優惠內容",
    target: "適合人群",
    conditions: "活動條件",
    validUntil: "有效期",
    updatedAt: "更新時間",
    apply: "透過專屬連結申請",
    official: "查看官方網站",
    disabled: "專屬連結準備中",
    caution: "活動可能變動，請以官方頁面為準。",
    affiliateNote: "部分連結可能為推廣連結。活動條件請以官方頁面為準。",
    favorite: "收藏優惠",
    saved: "已收藏",
  },
  ja: {
    reward: "特典内容",
    target: "おすすめの人",
    conditions: "条件",
    validUntil: "有効期限",
    updatedAt: "更新日",
    apply: "専用リンクから申し込む",
    official: "公式ページを見る",
    disabled: "専用リンク準備中",
    caution: "キャンペーン内容は変更される場合があります。必ず公式ページをご確認ください。",
    affiliateNote: "一部リンクには広告リンクが含まれる場合があります。条件は公式ページをご確認ください。",
    favorite: "保存する",
    saved: "保存済み",
  },
} as const;

function dealText(deal: DealItem, language: Language) {
  if (language === "ja") return { title: deal.titleJa, description: deal.descriptionJa, reward: deal.rewardTextJa, target: deal.targetUserJa, conditions: deal.conditionsJa };
  if (language === "zh-TW") return { title: deal.titleZhTW, description: deal.descriptionZhTW, reward: deal.rewardTextZhTW, target: deal.targetUserZhTW, conditions: deal.conditionsZhTW };
  return { title: deal.titleZhCN, description: deal.descriptionZhCN, reward: deal.rewardTextZhCN, target: deal.targetUserZhCN, conditions: deal.conditionsZhCN };
}

function validUntilText(value: string, language: Language) {
  if (value === "以官方页面为准") {
    if (language === "ja") return "公式ページをご確認ください";
    if (language === "zh-TW") return "以官方頁面為準";
  }
  return value;
}

function DealLogo({ deal }: { deal: DealItem }) {
  if (deal.logoUrl) return <img alt="" className="h-full w-full rounded-[28px] object-cover" src={deal.logoUrl} />;
  return (
    <div className="flex h-full w-full items-center justify-center rounded-[28px] bg-gradient-to-br from-emerald-100 via-white to-teal-100 text-2xl font-black text-emerald-800">
      {deal.providerName.slice(0, 2).toUpperCase()}
    </div>
  );
}

function ExternalButton({ href, label, sponsored = false }: { href: string; label: string; sponsored?: boolean }) {
  return (
    <a className="flex h-11 items-center justify-center gap-2 rounded-2xl bg-emerald-800 px-4 text-sm font-black text-white shadow-sm" href={href} rel={sponsored ? "noopener noreferrer sponsored" : "noopener noreferrer"} target="_blank">
      <ExternalLink className="h-4 w-4" />
      {label}
    </a>
  );
}

export function DealDetailClient({ deal }: { deal: DealItem }) {
  const { language, t } = useLanguage();
  const { isFavorite, toggleFavorite } = useFavorites();
  const labels = copy[language];
  const text = dealText(deal, language);
  const favorite = isFavorite("deal", deal.id);
  const activeAffiliateUrl = deal.activeAffiliateProvider ? deal.affiliateLinks[deal.activeAffiliateProvider] : "";
  const canApply = deal.isAffiliate && Boolean(activeAffiliateUrl);
  const categoryLabel = categoryLabels[deal.category][language];

  return (
    <main className="min-h-screen bg-[#f5f0e7] text-stone-950">
      <div className="mx-auto min-h-screen max-w-[430px] bg-[#fbf8f2] px-4 pb-8 pt-4 shadow-2xl shadow-stone-300/40">
        <header className="flex items-center justify-between py-2">
          <Link aria-label={t.common.back} className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-stone-900 shadow-sm" href="/deals">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <span className="rounded-full bg-white px-4 py-2 text-sm font-black text-emerald-700 shadow-sm">Japan Life</span>
        </header>

        <section className="mt-4 rounded-[30px] bg-white p-5 text-center shadow-[0_12px_35px_rgba(32,38,34,0.08)]">
          <div className="mx-auto h-24 w-24 overflow-hidden rounded-[28px] border border-stone-100 bg-white shadow-sm">
            <DealLogo deal={deal} />
          </div>
          <h1 className="mt-4 text-[28px] font-black leading-tight">{deal.providerName}</h1>
          <p className="mt-2 text-sm font-bold leading-6 text-stone-600">{text.title}</p>
          <div className="mt-3 flex justify-center gap-2">
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">{categoryLabel}</span>
            {deal.isAffiliate && <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-black text-amber-700">Affiliate</span>}
          </div>
          <button className={`mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-2xl border text-sm font-black ${favorite ? "border-amber-200 bg-amber-50 text-amber-700" : "border-emerald-200 bg-emerald-50 text-emerald-800"}`} onClick={() => toggleFavorite({ id: deal.id, type: "deal", title: deal.providerName, subtitle: text.reward })} type="button">
            <Star className={`h-5 w-5 ${favorite ? "fill-amber-300" : ""}`} />
            {favorite ? labels.saved : labels.favorite}
          </button>
        </section>

        <section className="mt-4 grid gap-3">
          <InfoBlock title={labels.reward} text={text.reward} highlight />
          <InfoBlock title={labels.target} text={text.target} />
          <InfoBlock title={labels.conditions} text={text.conditions} />
          <InfoBlock title={labels.validUntil} text={validUntilText(deal.validUntil, language)} />
          <InfoBlock title={labels.updatedAt} text={deal.updatedAt} />
          <InfoBlock title="Memo" text={text.description} />
        </section>

        <section className="mt-4 grid gap-2">
          {canApply ? (
            <ExternalButton href={activeAffiliateUrl} label={labels.apply} sponsored />
          ) : (
            <button className="flex h-11 items-center justify-center rounded-2xl bg-stone-200 px-4 text-sm font-black text-stone-500" disabled type="button">
              {labels.disabled}
            </button>
          )}
          <ExternalButton href={deal.officialUrl} label={labels.official} />
        </section>

        <section className="mt-4 rounded-[24px] bg-amber-50 p-4 text-xs font-bold leading-6 text-amber-900">
          <BadgePercent className="mb-2 h-5 w-5" />
          <p>{labels.caution}</p>
          <p className="mt-1">{labels.affiliateNote}</p>
        </section>
      </div>
    </main>
  );
}

function InfoBlock({ title, text, highlight = false }: { title: string; text: string; highlight?: boolean }) {
  return (
    <article className={`rounded-[24px] p-4 shadow-[0_10px_28px_rgba(32,38,34,0.06)] ${highlight ? "bg-emerald-50 text-emerald-900" : "bg-white"}`}>
      <h2 className="text-sm font-black text-emerald-800">{title}</h2>
      <p className="mt-2 text-sm font-bold leading-6 text-stone-600">{text}</p>
    </article>
  );
}

export { dealItems };
