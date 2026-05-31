"use client";

import Link from "next/link";
import { getCommunityTopicHref, getHotCommunityTopics } from "@/lib/community/topics";
import type { CommunityViewLocale } from "@/lib/community/types";

export function CommunityTopicStrip({ locale }: { locale: CommunityViewLocale }) {
  const topics = getHotCommunityTopics(locale);

  return (
    <section className="mt-4">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-sm font-black text-[#061a3a]">热门话题</h2>
        <Link className="text-xs font-black text-[#2563EB]" href={getCommunityTopicHref(topics[0], locale)}>
          看话题
        </Link>
      </div>
      <div className="mt-2 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {topics.map((topic) => (
          <Link className="h-8 shrink-0 rounded-full bg-[rgba(219,234,254,0.72)] px-3 py-1.5 text-[11px] font-bold text-[#2563eb] ring-1 ring-blue-100" href={getCommunityTopicHref(topic, locale)} key={topic}>
            #{topic}
          </Link>
        ))}
      </div>
    </section>
  );
}
