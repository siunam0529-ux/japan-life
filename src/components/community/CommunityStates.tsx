import Link from "next/link";
import type { ReactNode } from "react";
import { communityHomeHref } from "@/lib/community/routes";

export function CommunityEmptyState({
  action,
  actionHref,
  actionLabel,
  description,
  title = "这里还没有内容",
}: {
  action?: ReactNode;
  actionHref?: string;
  actionLabel?: string;
  description: string;
  title?: string;
}) {
  return (
    <section className="rounded-[22px] border border-[rgba(226,232,240,0.85)] bg-[rgba(255,255,255,0.82)] p-[14px] shadow-[0_10px_24px_rgba(15,76,129,0.07)]">
      <h2 className="text-[14px] font-[850] text-[#061a3a]">{title}</h2>
      <p className="mt-1 text-[12px] font-bold leading-[19px] text-[#40546f]">{description}</p>
      {action ?? (actionHref && actionLabel ? (
        <Link className="mt-3 inline-flex h-9 items-center justify-center rounded-full bg-[#2563EB] px-4 text-xs font-black text-white shadow-[0_10px_20px_rgba(37,99,235,0.18)]" href={actionHref}>
          {actionLabel}
        </Link>
      ) : null)}
    </section>
  );
}

export function CommunityErrorState({
  actionHref = communityHomeHref,
  actionLabel = "返回社区",
  description = "请返回社区重新打开，或稍后再试。",
  title = "内容不存在或已被删除",
}: {
  actionHref?: string;
  actionLabel?: string;
  description?: string;
  title?: string;
}) {
  return (
    <section className="rounded-[22px] border border-[rgba(226,232,240,0.85)] bg-[rgba(255,255,255,0.82)] p-[14px] shadow-[0_10px_24px_rgba(15,76,129,0.07)]">
      <h2 className="text-[14px] font-[850] text-[#061a3a]">{title}</h2>
      <p className="mt-1 text-[12px] font-bold leading-[19px] text-[#40546f]">{description}</p>
      <Link className="mt-3 inline-flex h-9 items-center justify-center rounded-full bg-[#2563EB] px-4 text-xs font-black text-white shadow-[0_10px_20px_rgba(37,99,235,0.18)]" href={actionHref}>
        {actionLabel}
      </Link>
    </section>
  );
}
