import { Building2, ExternalLink, MapPin } from "lucide-react";
import Link from "next/link";
import { PlaceItem } from "@/data/places";
import { useLanguage } from "@/hooks/useLanguage";

export function placeText(place: PlaceItem, language: "zh-CN" | "zh-TW" | "ja") {
  if (language === "ja") {
    return { address: place.addressJa ?? place.address, area: place.areaJa ?? place.area, category: place.categoryJa ?? place.category, name: place.nameJa ?? place.name, subtitle: place.subtitleJa ?? place.subtitle, tags: place.tagsJa ?? place.tags };
  }
  if (language === "zh-TW") {
    return { address: place.addressZhTW ?? place.address, area: place.areaZhTW ?? place.area, category: place.categoryZhTW ?? place.category, name: place.nameZhTW ?? place.name, subtitle: place.subtitleZhTW ?? place.subtitle, tags: place.tagsZhTW ?? place.tags };
  }
  return { address: place.address, area: place.area, category: place.category, name: place.name, subtitle: place.subtitle, tags: place.tags };
}

const demoLabel = {
  "zh-CN": "示范",
  "zh-TW": "示範",
  ja: "サンプル",
} as const;

const spendLabel = {
  "zh-CN": "人均",
  "zh-TW": "人均",
  ja: "平均",
} as const;

export function PlaceCard({ place }: { place: PlaceItem }) {
  const { language } = useLanguage();
  const text = placeText(place, language);

  return (
    <Link href="/places" className="flex items-center gap-3 rounded-[18px] border border-stone-200/70 bg-white p-4 shadow-[0_8px_22px_rgba(32,38,34,0.07)]">
      <PlaceAvatar place={place} compact />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="truncate font-black">{text.name}</h3>
          {place.isDemo && <span className="shrink-0 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-black text-amber-700">{demoLabel[language]}</span>}
        </div>
        <p className="mt-1 flex items-center gap-1 text-xs font-bold text-stone-500">
          <MapPin className="h-3.5 w-3.5" />
          {text.area} / {text.category}
        </p>
        <p className="mt-1 text-xs font-bold text-stone-500">{text.subtitle}</p>
        {place.averageSpend && <p className="mt-1 text-xs font-black text-emerald-800">{spendLabel[language]} {place.averageSpend}</p>}
      </div>
      <ExternalLink className="h-4 w-4 shrink-0 text-stone-400" />
    </Link>
  );
}

function PlaceAvatar({ place, compact = false }: { place: PlaceItem; compact?: boolean }) {
  const sizeClass = compact ? "h-11 w-11 rounded-full" : "h-12 w-12 rounded-full";
  if (place.imageUrl) {
    return <img alt="" className={`${sizeClass} shrink-0 object-cover`} src={place.imageUrl} />;
  }

  return (
    <span className={`flex ${sizeClass} shrink-0 items-center justify-center bg-emerald-700 text-white`}>
      <Building2 className="h-6 w-6" />
    </span>
  );
}
