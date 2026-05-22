import { MapPin } from "lucide-react";
import Link from "next/link";
import { AreaItem } from "@/data/areas";
import { formatCurrency } from "@/lib/formatCurrency";

type AreaCardProps = {
  area: AreaItem;
  labels: {
    rent: string;
    wage: string;
  };
};

export function AreaCard({ area, labels }: AreaCardProps) {
  return (
    <Link href="/areas" className="block rounded-[16px] border border-stone-200/70 bg-white p-3 shadow-[0_7px_18px_rgba(32,38,34,0.06)]">
      <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
          <MapPin className="h-4 w-4" />
        </span>
        <div>
          <h3 className="text-sm font-black">{area.name}</h3>
          <p className="text-[10px] font-bold text-stone-500">{area.subtitle}</p>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <div>
          <p className="text-[10px] font-bold text-stone-500">{labels.rent}</p>
          <p className="text-[15px] font-black">{formatCurrency(area.rent, "JPY")}</p>
        </div>
        <div>
          <p className="text-[10px] font-bold text-stone-500">{labels.wage}</p>
          <p className="text-[15px] font-black">{formatCurrency(area.wage, "JPY")}</p>
        </div>
      </div>
    </Link>
  );
}
