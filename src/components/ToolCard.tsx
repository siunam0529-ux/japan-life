import type { ComponentType, ReactNode } from "react";
import Link from "next/link";

type ToolCardProps = {
  href: string;
  title: string;
  subtitle: string;
  icon: ComponentType<{ className?: string }>;
  iconSlot?: ReactNode;
};

export function ToolCard({ href, title, subtitle, icon: Icon, iconSlot }: ToolCardProps) {
  return (
    <Link
      href={href}
      className="rounded-[16px] border border-stone-200/70 bg-white p-2.5 text-left shadow-[0_7px_18px_rgba(32,38,34,0.06)] transition hover:-translate-y-0.5"
    >
      {iconSlot ?? (
        <span className="mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-[#e9f4ef] text-emerald-800 ring-1 ring-emerald-100/80">
          <Icon className="h-5 w-5" />
        </span>
      )}
      <span className="block text-[13px] font-black leading-tight">{title}</span>
      <span className="mt-0.5 block text-[10px] font-bold leading-tight text-stone-500">{subtitle}</span>
    </Link>
  );
}
