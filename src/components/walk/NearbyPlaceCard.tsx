import { BookOpen, Cat, Coffee, ExternalLink, Landmark, MapPin, ShoppingBag, Soup, Store, Trees, Waves } from "lucide-react";
import type { NearbyPlace, NearbyPlaceType } from "@/lib/walk/spots";

const typeIconMap: Record<NearbyPlaceType, typeof Coffee> = {
  便利店: Store,
  公园: Trees,
  咖啡店: Coffee,
  旧书店: BookOpen,
  河边: Waves,
  猫咖: Cat,
  商店街: ShoppingBag,
  甜品店: Store,
  拉面店: Soup,
  书店: BookOpen,
  神社: Landmark,
  小巷: MapPin,
};

function buildGoogleMapsUrl(place: NearbyPlace) {
  const hasCoordinate = Number.isFinite(place.latitude) && Number.isFinite(place.longitude);
  const query = place.mapQuery || (hasCoordinate ? `${place.name} ${place.latitude},${place.longitude}` : place.name);
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

export function NearbyPlaceCard({ place }: { place: NearbyPlace }) {
  const Icon = typeIconMap[place.type] ?? MapPin;

  return (
    <article className="rounded-[22px] border border-slate-200 bg-white p-3 shadow-sm">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="break-words text-sm font-black leading-5 text-[#10231A]">{place.name}</h3>
              <p className="mt-1 text-xs font-black text-emerald-700">
                {place.type} · {place.distance}
              </p>
            </div>
            <span className="shrink-0 rounded-full bg-lime-50 px-2 py-1 text-[11px] font-black text-emerald-800">{place.budget}</span>
          </div>
          <p className="mt-2 text-xs font-bold leading-5 text-[#64748B]">{place.description}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {place.bestFor.slice(0, 3).map((tag) => (
              <span className="rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-black text-emerald-700" key={tag}>
                {tag}
              </span>
            ))}
          </div>
          <p className="mt-2 text-[11px] font-bold leading-5 text-[#94A3B8]">{place.note}</p>
          <a
            aria-label={`${place.name}をGoogle Mapsで開く`}
            className="mt-3 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-2xl border border-emerald-100 bg-white px-4 text-xs font-black text-emerald-800 shadow-sm transition active:scale-[0.98]"
            href={buildGoogleMapsUrl(place)}
            rel="noreferrer"
            target="_blank"
          >
            <ExternalLink className="h-4 w-4" />
            打开地图
          </a>
          {place.detailUrl ? (
            <a
              className="mt-2 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-2xl border border-emerald-100 bg-white px-4 text-xs font-black text-emerald-800 shadow-sm transition active:scale-[0.98]"
              href={place.detailUrl}
              rel="noreferrer"
              target="_blank"
            >
              <ExternalLink className="h-4 w-4" />
              查看店铺详情
            </a>
          ) : null}
        </div>
      </div>
    </article>
  );
}
