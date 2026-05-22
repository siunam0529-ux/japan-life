import { ShieldCheck } from "lucide-react";
import Link from "next/link";
import { PolicyItem } from "@/data/policies";

export function PolicyCard({ policy }: { policy: PolicyItem }) {
  return (
    <Link href={policy.href} className="block rounded-3xl border border-white/50 bg-white/75 p-4 shadow-[0_18px_45px_rgba(37,99,235,0.08)] backdrop-blur-xl">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-50 to-sky-100 text-[#2563EB] shadow-sm">
          <ShieldCheck className="h-5 w-5" />
        </span>
        <div>
          <span className="rounded-full bg-blue-50 px-2 py-1 text-[11px] font-black text-[#2563EB]">{policy.tag}</span>
          <h3 className="mt-2 font-black">{policy.title}</h3>
          <p className="mt-1 text-xs font-bold leading-5 text-[#64748B]">{policy.subtitle}</p>
        </div>
      </div>
    </Link>
  );
}
