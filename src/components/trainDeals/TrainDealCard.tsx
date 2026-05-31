import { ExternalLink, Heart, Star, TrainFront } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import type { TrainDeal } from "@/lib/trainDeals/types";

function buildSearchUrl(query: string) {
  return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
}

export function TrainDealCard({
  deal,
  isFavorite,
  isFrequent,
  onToggleFavorite,
  onToggleFrequent,
}: {
  deal: TrainDeal;
  isFavorite: boolean;
  isFrequent: boolean;
  onToggleFavorite: (id: string) => void;
  onToggleFrequent: (id: string) => void;
}) {
  const { language } = useLanguage();
  const text = {
    "zh-CN": {
      price: "价格",
      validFor: "适用",
      bestFor: "适合",
      confidence: "信息确认度",
      good: "适合你吗",
      notGood: "不太适合",
      caution: "注意",
      official: "确认官方信息",
      favorited: "已收藏",
      favorite: "收藏",
      frequent: "已设为常用",
      setFrequent: "设为常用",
    },
    "zh-TW": {
      price: "價格",
      validFor: "適用",
      bestFor: "適合",
      confidence: "資訊確認度",
      good: "適合你嗎",
      notGood: "不太適合",
      caution: "注意",
      official: "確認官方資訊",
      favorited: "已收藏",
      favorite: "收藏",
      frequent: "已設為常用",
      setFrequent: "設為常用",
    },
    ja: {
      price: "価格",
      validFor: "対象",
      bestFor: "おすすめ",
      confidence: "情報確認度",
      good: "向いているケース",
      notGood: "向いていないケース",
      caution: "注意",
      official: "公式情報を確認",
      favorited: "保存済み",
      favorite: "保存",
      frequent: "よく使うに設定済み",
      setFrequent: "よく使うに設定",
    },
  }[language];

  return (
    <article className="rounded-[26px] border border-emerald-100 bg-white/92 p-4 shadow-[0_12px_30px_rgba(22,101,52,0.08)]">
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
          <TrainFront className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-black text-emerald-700">{deal.category}</p>
          <h3 className="mt-1 text-lg font-black leading-6 text-[#10231A]">{deal.name}</h3>
          <p className="mt-1 text-xs font-bold leading-5 text-[#64748B]">
            {deal.company} · {deal.area}
          </p>
        </div>
      </div>

      <div className="mt-3 grid gap-2 rounded-2xl bg-emerald-50/70 p-3 text-xs font-bold leading-5 text-[#475569]">
        <p>
          <span className="font-black text-[#10231A]">{text.price}：</span>
          {deal.priceLabel}
        </p>
        <p>
          <span className="font-black text-[#10231A]">{text.validFor}：</span>
          {deal.validFor}
        </p>
        <p>
          <span className="font-black text-[#10231A]">{text.bestFor}：</span>
          {deal.bestFor}
        </p>
        <p>
          <span className="font-black text-[#10231A]">{text.confidence}：</span>
          {deal.infoConfidence} · {deal.lastCheckedLabel}
        </p>
      </div>

      <p className="mt-3 text-sm font-bold leading-6 text-[#334155]">{deal.description}</p>
      <div className="mt-3 grid gap-2 rounded-2xl bg-white p-3 text-xs font-bold leading-5 text-[#475569] ring-1 ring-emerald-100">
        <div>
          <p className="font-black text-emerald-700">{text.good}</p>
          <ul className="mt-1 grid gap-1">
            {deal.goodFor.map((item) => (
              <li key={item}>· {item}</li>
            ))}
          </ul>
        </div>
        <div className="border-t border-emerald-100 pt-2">
          <p className="font-black text-amber-700">{text.notGood}</p>
          <ul className="mt-1 grid gap-1">
            {deal.notGoodFor.map((item) => (
              <li key={item}>· {item}</li>
            ))}
          </ul>
        </div>
      </div>
      <p className="mt-2 rounded-2xl bg-amber-50 px-3 py-2 text-xs font-bold leading-5 text-amber-900">
        {text.caution}：{deal.caution}
      </p>
      <div className="mt-2 grid gap-1 rounded-2xl bg-slate-50 px-3 py-2 text-[11px] font-bold leading-5 text-slate-600">
        <p>{deal.priceNote}</p>
        <p>{deal.purchaseNote}</p>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {deal.tags.map((tag) => (
          <span className="rounded-full bg-white px-3 py-1 text-[11px] font-black text-emerald-700 ring-1 ring-emerald-100" key={tag}>
            {tag}
          </span>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <a
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-emerald-700 px-3 text-xs font-black text-white transition focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 active:scale-[0.98]"
          href={buildSearchUrl(deal.officialSearchQuery)}
          rel="noopener noreferrer"
          target="_blank"
        >
          <ExternalLink className="h-4 w-4" />
          {text.official}
        </a>
        <button
          aria-pressed={isFavorite}
          className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl px-3 text-xs font-black transition focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 active:scale-[0.98] ${
            isFavorite ? "bg-rose-50 text-rose-700 ring-1 ring-rose-100" : "border border-emerald-100 bg-white text-emerald-800"
          }`}
          onClick={() => onToggleFavorite(deal.id)}
          type="button"
        >
          <Heart className={`h-4 w-4 ${isFavorite ? "fill-current" : ""}`} />
          {isFavorite ? text.favorited : text.favorite}
        </button>
        <button
          aria-pressed={isFrequent}
          className={`col-span-2 inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl px-3 text-xs font-black transition focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 active:scale-[0.98] ${
            isFrequent ? "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-100" : "border border-emerald-100 bg-white text-emerald-800"
          }`}
          onClick={() => onToggleFrequent(deal.id)}
          type="button"
        >
          <Star className={`h-4 w-4 ${isFrequent ? "fill-current" : ""}`} />
          {isFrequent ? text.frequent : text.setFrequent}
        </button>
      </div>
    </article>
  );
}
