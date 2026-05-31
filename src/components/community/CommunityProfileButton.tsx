"use client";

import { UserRound } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { communityProfileHref } from "@/lib/community/routes";
import { readCommunityUserProfile } from "@/lib/community/repository";
import type { CommunityUserProfile } from "@/lib/community/types";

export function CommunityProfileButton({ href = communityProfileHref, label = "我的" }: { href?: string; label?: string }) {
  const [profile, setProfile] = useState<CommunityUserProfile | null>(null);

  useEffect(() => {
    setProfile(readCommunityUserProfile());
  }, []);

  return (
    <Link className="inline-flex h-9 items-center gap-2 rounded-full bg-white/85 px-3 text-xs font-black text-[#2563EB] shadow-sm ring-1 ring-blue-100" href={href}>
      <span className="flex h-6 w-6 items-center justify-center rounded-full text-white shadow-sm" style={{ background: profile?.avatar ?? "linear-gradient(135deg, #60a5fa, #f9a8d4)" }}>
        <UserRound className="h-3.5 w-3.5" />
      </span>
      {label}
    </Link>
  );
}
