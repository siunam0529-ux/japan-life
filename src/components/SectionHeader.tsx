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
    <div className="mb-2 mt-5 flex items-center justify-between">
      <h2 className="text-[16px] font-black text-stone-950">{title}</h2>
      {href && action ? (
        <Link className="flex items-center gap-1 text-xs font-bold text-stone-500" href={href}>
          {content}
        </Link>
      ) : null}
    </div>
  );
}
