import type { ComponentType } from "react";
import Link from "next/link";

type EmptyStateProps = {
  icon: ComponentType<{ className?: string }>;
  title: string;
  text: string;
  href?: string;
  action?: string;
};

export function EmptyState({ icon: Icon, title, text, href, action }: EmptyStateProps) {
  const body = (
    <div className="rounded-3xl border border-white/50 bg-white/75 p-6 text-center shadow-[0_18px_45px_rgba(37,99,235,0.08)] backdrop-blur-xl">
      <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-50 to-sky-100 text-[#2563EB] shadow-sm">
        <Icon className="h-7 w-7" />
      </span>
      <h3 className="mt-4 font-black tracking-tight text-[#0F172A]">{title}</h3>
      <p className="mt-2 text-sm font-bold leading-6 text-[#64748B]">{text}</p>
      {action && <span className="mt-4 inline-flex rounded-2xl bg-blue-50 px-4 py-2 text-sm font-black text-[#2563EB]">{action}</span>}
    </div>
  );

  return href ? <Link href={href}>{body}</Link> : body;
}
