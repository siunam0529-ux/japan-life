import { ArrowRight } from "lucide-react";
import Link from "next/link";

export function SectionHeader({ title, action, href }: { title: string; action?: string; href?: string }) {
  const content = (
    <>
      {action}
      {action && <ArrowRight className="h-4 w-4" />}
    </>
  );

  return (
    <div className="mb-3 mt-6 flex items-center justify-between">
      <h2 className="text-[17px] font-black tracking-normal text-[#0F172A]">{title}</h2>
      {href && action ? (
        <Link className="flex items-center gap-1 rounded-full bg-white/65 px-3 py-1.5 text-xs font-black text-[#2563EB] shadow-sm backdrop-blur-xl transition hover:bg-white" href={href}>
          {content}
        </Link>
      ) : null}
    </div>
  );
}
