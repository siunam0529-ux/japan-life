"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useLanguage } from "@/hooks/useLanguage";
import { communityHomeHref } from "@/lib/community/routes";

const stateCopy = {
  "zh-CN": {
    emptyTitle: "\u8fd9\u91cc\u8fd8\u6ca1\u6709\u5185\u5bb9",
    errorAction: "\u8fd4\u56de\u793e\u533a",
    errorDescription: "\u8bf7\u8fd4\u56de\u793e\u533a\u91cd\u65b0\u6253\u5f00\uff0c\u6216\u7a0d\u540e\u518d\u8bd5\u3002",
    errorTitle: "\u5185\u5bb9\u4e0d\u5b58\u5728\u6216\u5df2\u88ab\u5220\u9664",
  },
  "zh-TW": {
    emptyTitle: "\u9019\u88e1\u9084\u6c92\u6709\u5167\u5bb9",
    errorAction: "\u8fd4\u56de\u793e\u7fa4",
    errorDescription: "\u8acb\u8fd4\u56de\u793e\u7fa4\u91cd\u65b0\u6253\u958b\uff0c\u6216\u7a0d\u5f8c\u518d\u8a66\u3002",
    errorTitle: "\u5167\u5bb9\u4e0d\u5b58\u5728\u6216\u5df2\u88ab\u522a\u9664",
  },
  ja: {
    emptyTitle: "\u307e\u3060\u5185\u5bb9\u304c\u3042\u308a\u307e\u305b\u3093",
    errorAction: "\u30b3\u30df\u30e5\u30cb\u30c6\u30a3\u306b\u623b\u308b",
    errorDescription: "\u30b3\u30df\u30e5\u30cb\u30c6\u30a3\u306b\u623b\u3063\u3066\u958b\u304d\u76f4\u3059\u304b\u3001\u5c11\u3057\u6642\u9593\u3092\u304a\u3044\u3066\u304a\u8a66\u3057\u304f\u3060\u3055\u3044\u3002",
    errorTitle: "\u5185\u5bb9\u304c\u898b\u3064\u304b\u3089\u306a\u3044\u304b\u524a\u9664\u3055\u308c\u307e\u3057\u305f",
  },
};

export function CommunityEmptyState({
  action,
  actionHref,
  actionLabel,
  description,
  title,
}: {
  action?: ReactNode;
  actionHref?: string;
  actionLabel?: string;
  description: string;
  title?: string;
}) {
  const { language } = useLanguage();
  const text = stateCopy[language];
  return (
    <section className="rounded-[22px] border border-[rgba(226,232,240,0.85)] bg-[rgba(255,255,255,0.82)] p-[14px] shadow-[0_10px_24px_rgba(15,76,129,0.07)]">
      <h2 className="text-[14px] font-[850] text-[#061a3a]">{title ?? text.emptyTitle}</h2>
      <p className="mt-1 text-[12px] font-bold leading-[19px] text-[#40546f]">{description}</p>
      {action ?? (actionHref && actionLabel ? (
        <Link className="mt-3 inline-flex h-9 items-center justify-center rounded-full bg-[#2563EB] px-4 text-xs font-black text-white shadow-[0_10px_20px_rgba(37,99,235,0.18)]" href={actionHref} prefetch={false}>
          {actionLabel}
        </Link>
      ) : null)}
    </section>
  );
}

export function CommunityErrorState({
  actionHref = communityHomeHref,
  actionLabel,
  description,
  title,
}: {
  actionHref?: string;
  actionLabel?: string;
  description?: string;
  title?: string;
}) {
  const { language } = useLanguage();
  const text = stateCopy[language];
  return (
    <section className="rounded-[22px] border border-[rgba(226,232,240,0.85)] bg-[rgba(255,255,255,0.82)] p-[14px] shadow-[0_10px_24px_rgba(15,76,129,0.07)]">
      <h2 className="text-[14px] font-[850] text-[#061a3a]">{title ?? text.errorTitle}</h2>
      <p className="mt-1 text-[12px] font-bold leading-[19px] text-[#40546f]">{description ?? text.errorDescription}</p>
      <Link className="mt-3 inline-flex h-9 items-center justify-center rounded-full bg-[#2563EB] px-4 text-xs font-black text-white shadow-[0_10px_20px_rgba(37,99,235,0.18)]" href={actionHref} prefetch={false}>
        {actionLabel ?? text.errorAction}
      </Link>
    </section>
  );
}
