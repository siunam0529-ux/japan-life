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
    <Link href="/areas" className="block rounded-3xl border border-white/50 bg-white/75 p-4 shadow-[0_18px_45px_rgba(37,99,235,0.08)] backdrop-blur-xl">
      <div className="flex items-center gap-2">
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-50 to-sky-100 text-[#2563EB] shadow-sm">
          <MapPin className="h-4 w-4" />
        </span>
        <div>
          <h3 className="text-sm font-black">{area.name}</h3>
          <p className="text-[10px] font-bold text-[#64748B]">{area.subtitle}</p>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <div>
          <p className="text-[10px] font-bold text-[#64748B]">{labels.rent}</p>
          <p className="text-[15px] font-black">{formatCurrency(area.rent, "JPY")}</p>
        </div>
        <div>
          <p className="text-[10px] font-bold text-[#64748B]">{labels.wage}</p>
          <p className="text-[15px] font-black">{formatCurrency(area.wage, "JPY")}</p>
        </div>
      </div>
    </Link>
  );
}
