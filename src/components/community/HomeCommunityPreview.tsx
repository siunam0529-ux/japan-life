"use client";

import { MessageCircle } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getCommunityPosts } from "@/lib/community/repository";
import { communitySelectionHref, getCommunityPostHref } from "@/lib/community/routes";
import { getCommunityPostTypeLabel, type CommunityPost, type CommunityPostType } from "@/lib/community/types";

type PreviewItem = {
  area: string;
  comments?: number;
  href: string;
  id: string;
  title: string;
  type: CommunityPostType;
};

const fallbackItems: PreviewItem[] = [
  { area: "池袋", href: "/community/all", id: "fallback-print", title: "池袋附近哪里可以便宜打印？", type: "help" },
  { area: "练马", href: "/community/all", id: "fallback-fridge", title: "搬家出清：小冰箱免费送", type: "secondhand" },
  { area: "上野", href: "/community/all", id: "fallback-ueno", title: "周末想找人一起去上野散步", type: "buddy" },
];

const entranceLinks = [
  { className: "bg-[linear-gradient(135deg,#2563eb,#8b5cf6)] text-white shadow-[0_8px_18px_rgba(37,99,235,0.18)]", href: communitySelectionHref, label: "社区" },
];

const typeTone: Record<CommunityPostType, string> = {
  buddy: "bg-pink-50 text-pink-700 ring-pink-100",
  help: "bg-orange-50 text-orange-700 ring-orange-100",
  helper: "bg-violet-50 text-violet-700 ring-violet-100",
  secondhand: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  share: "bg-blue-50 text-blue-700 ring-blue-100",
};

export function HomeCommunityPreview() {
  const [items, setItems] = useState<PreviewItem[]>(fallbackItems);

  useEffect(() => {
    let mounted = true;
    void getCommunityPosts({ limit: 3, locale: "all", status: "published" })
      .then((result) => {
        if (!mounted) return;
        if (!result.data.length) {
          if (result.error) console.warn("[home-community-preview] fallback mock", result.error);
          setItems(fallbackItems);
          return;
        }
        setItems(result.data.slice(0, 3).map(toPreviewItem));
      })
      .catch((error) => {
        console.warn("[home-community-preview] fallback mock", error);
        if (mounted) setItems(fallbackItems);
      });
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <section className="relative mt-3.5 overflow-hidden rounded-[28px] border border-white/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.88),rgba(239,248,255,0.78))] p-4 shadow-[0_14px_32px_rgba(15,76,129,0.10)]">
      <div className="pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full bg-pink-100/55 blur-2xl" />
      <div className="pointer-events-none absolute right-8 top-5 flex h-10 w-10 items-center justify-center rounded-full bg-white/55 text-pink-300 ring-1 ring-white/70">
        <MessageCircle className="h-5 w-5" />
      </div>

      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-[18px] font-[850] leading-6 text-[#061a3a]">东京生活社区</h2>
          <p className="mt-0.5 text-[12px] font-bold leading-[18px] text-[#40546f]">看看附近的人都在聊什么</p>
        </div>
        <Link className="shrink-0 rounded-full bg-white/85 px-3 py-1.5 text-[11px] font-black text-[#1D4ED8] shadow-sm ring-1 ring-blue-100" href={communitySelectionHref}>
          进入社区 →
        </Link>
      </div>

      <div className="relative mt-3 flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {entranceLinks.map((item) => (
          <Link className={`flex h-[30px] shrink-0 items-center rounded-full px-3 text-[12px] font-[800] ${item.className}`} href={item.href} key={item.href}>
            {item.label}
          </Link>
        ))}
      </div>

      <div className="relative mt-2.5 grid gap-2">
        {items.map((item) => (
          <Link className="min-w-0 rounded-2xl border border-slate-200/75 bg-white/72 px-[11px] py-2.5 transition active:scale-[0.99]" href={item.href} key={item.id}>
            <div className="flex min-w-0 items-center gap-2">
              <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-[850] ring-1 ${typeTone[item.type]}`}>{getCommunityPostTypeLabel(item.type)}</span>
              <p className="min-w-0 flex-1 truncate text-[12px] font-[800] text-[#263b59]">{item.title}</p>
            </div>
            <p className="mt-1 truncate text-[11px] font-bold text-[#64748B]">
              {item.area}{typeof item.comments === "number" ? ` · ${item.comments} 条评论` : ""}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}

function toPreviewItem(post: CommunityPost): PreviewItem {
  return {
    area: post.area,
    comments: post.comments,
    href: getCommunityPostHref(post, "all"),
    id: post.id,
    title: post.title,
    type: post.type,
  };
}
