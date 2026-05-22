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
    <div className="rounded-[18px] border border-stone-200/70 bg-white p-5 text-center shadow-[0_8px_22px_rgba(32,38,34,0.07)]">
      <Icon className="mx-auto h-8 w-8 text-emerald-700" />
      <h3 className="mt-3 font-black">{title}</h3>
      <p className="mt-1 text-sm font-bold leading-6 text-stone-500">{text}</p>
      {action && <span className="mt-3 inline-flex rounded-full bg-emerald-50 px-4 py-2 text-sm font-black text-emerald-800">{action}</span>}
    </div>
  );

  return href ? <Link href={href}>{body}</Link> : body;
}
