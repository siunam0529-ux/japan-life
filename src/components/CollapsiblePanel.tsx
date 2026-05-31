"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";
import type { ReactNode } from "react";

export function CollapsiblePanel({
  children,
  className = "",
  closeOnSelect = false,
  contentClassName = "",
  defaultOpen = false,
  eyebrow,
  lazyMount = false,
  title,
}: {
  children: ReactNode;
  className?: string;
  closeOnSelect?: boolean;
  contentClassName?: string;
  defaultOpen?: boolean;
  eyebrow?: string;
  lazyMount?: boolean;
  summary?: ReactNode;
  title: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const shouldRenderContent = !lazyMount || open;

  return (
    <details
      className={`group rounded-[26px] border border-blue-100 bg-white/90 p-4 shadow-[0_12px_30px_rgba(37,99,235,0.08)] ${className}`}
      onToggle={(event) => {
        if (event.target !== event.currentTarget) return;
        setOpen(event.currentTarget.open);
      }}
      open={open}
    >
      <summary className="flex cursor-pointer list-none items-start justify-between gap-3 text-left [&::-webkit-details-marker]:hidden">
        <span className="min-w-0">
          {eyebrow ? <span className="block text-xs font-black text-blue-700">{eyebrow}</span> : null}
          <span className="mt-1 block text-lg font-black text-[#10231A]">{title}</span>
        </span>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-blue-100 bg-white text-blue-700 transition group-open:rotate-180">
          <ChevronDown className="h-4 w-4" />
        </span>
      </summary>
      <div
        className={contentClassName || "mt-3"}
        onClick={(event) => {
          if (!closeOnSelect) return;
          const target = event.target instanceof HTMLElement ? event.target : null;
          if (!target?.closest("button,a,[role='button']")) return;
          window.requestAnimationFrame(() => setOpen(false));
        }}
      >
        {shouldRenderContent ? children : null}
      </div>
    </details>
  );
}
