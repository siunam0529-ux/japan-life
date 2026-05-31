import { getCommunityCurationBadges } from "@/lib/community/curation";
import type { CommunityPost, CommunityViewLocale } from "@/lib/community/types";

const curationBadgeTone = {
  featured: "bg-[rgba(99,102,241,0.14)] text-[#4f46e5]",
  official: "bg-[rgba(20,184,166,0.14)] text-[#0f766e]",
  pinned: "bg-[rgba(251,146,60,0.16)] text-[#ea580c]",
} as const;

export function CommunityCurationBadges({
  className = "",
  locale = "zh-cn",
  post,
}: {
  className?: string;
  locale?: CommunityViewLocale;
  post: CommunityPost;
}) {
  const badges = getCommunityCurationBadges(post, locale);
  if (!badges.length) return null;
  return (
    <span className={`flex flex-wrap gap-1.5 ${className}`}>
      {badges.map((badge) => (
        <span className={`inline-flex h-[22px] items-center rounded-full px-2 text-[10.5px] font-[850] ${curationBadgeTone[badge.key]}`} key={badge.key}>
          {badge.label}
        </span>
      ))}
    </span>
  );
}
