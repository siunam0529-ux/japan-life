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
      className="rounded-[28px] border border-white/60 bg-white/75 p-3 text-left shadow-[0_10px_40px_rgba(37,99,235,0.08)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:bg-white"
    >
      {iconSlot ?? (
        <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-50 to-sky-100 text-[#2563EB] shadow-inner ring-1 ring-white/80">
          <Icon className="h-5 w-5" />
        </span>
      )}
      <span className="block text-[13px] font-black leading-tight text-[#0F172A]">{title}</span>
      <span className="mt-1 block text-[10px] font-bold leading-tight text-[#64748B]">{subtitle}</span>
    </Link>
  );
}
