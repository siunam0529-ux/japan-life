"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";
import type { ReactNode } from "react";

export function CollapsiblePanel({
  children,
  className = "",
  contentClassName = "",
  defaultOpen = false,
  eyebrow,
  summary,
  title,
}: {
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  defaultOpen?: boolean;
  eyebrow?: string;
  summary?: ReactNode;
  title: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <details
      className={`group rounded-[26px] border border-emerald-100 bg-white/90 p-4 shadow-[0_12px_30px_rgba(22,101,52,0.08)] ${className}`}
      onToggle={(event) => setOpen(event.currentTarget.open)}
      open={open}
    >
      <summary className="flex cursor-pointer list-none items-start justify-between gap-3 text-left [&::-webkit-details-marker]:hidden">
        <span className="min-w-0">
          {eyebrow ? <span className="block text-xs font-black text-emerald-700">{eyebrow}</span> : null}
          <span className="mt-1 block text-lg font-black text-[#10231A]">{title}</span>
          {summary ? <span className="mt-1 block text-xs font-bold leading-5 text-[#64748B]">{summary}</span> : null}
        </span>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-emerald-100 bg-white text-emerald-700 transition group-open:rotate-180">
          <ChevronDown className="h-4 w-4" />
        </span>
      </summary>
      <div className={contentClassName || "mt-3"}>{children}</div>
    </details>
  );
}
