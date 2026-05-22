import { ShieldCheck } from "lucide-react";
import Link from "next/link";
import { PolicyItem } from "@/data/policies";

export function PolicyCard({ policy }: { policy: PolicyItem }) {
  return (
    <Link href={policy.href} className="block rounded-[18px] border border-stone-200/70 bg-white p-4 shadow-[0_8px_22px_rgba(32,38,34,0.07)]">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
          <ShieldCheck className="h-5 w-5" />
        </span>
        <div>
          <span className="rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-black text-emerald-700">{policy.tag}</span>
          <h3 className="mt-2 font-black">{policy.title}</h3>
          <p className="mt-1 text-xs font-bold leading-5 text-stone-500">{policy.subtitle}</p>
        </div>
      </div>
    </Link>
  );
}
