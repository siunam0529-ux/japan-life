"use client";

import { UserRound } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { readMeProfile } from "@/lib/account/profile";
import { communityProfileHref } from "@/lib/community/routes";
import { readCommunityUserProfile } from "@/lib/community/repository";
import type { CommunityUserProfile } from "@/lib/community/types";

export function CommunityProfileButton({ href = communityProfileHref, label = "我的" }: { href?: string; label?: string }) {
  const [profile, setProfile] = useState<CommunityUserProfile | null>(null);

  useEffect(() => {
    const loadProfile = () => {
      const communityProfile = readCommunityUserProfile();
      const meProfile = readMeProfile(null);
      setProfile({ ...communityProfile, avatar: meProfile.avatar || communityProfile.avatar, displayName: meProfile.displayName || communityProfile.displayName });
    };
    loadProfile();
    window.addEventListener("japan-life:me-profile-change", loadProfile);
    window.addEventListener("storage", loadProfile);
    return () => {
      window.removeEventListener("japan-life:me-profile-change", loadProfile);
      window.removeEventListener("storage", loadProfile);
    };
  }, []);

  const imageAvatar = isImageAvatar(profile?.avatar);

  return (
    <Link className="inline-flex h-9 items-center gap-2 rounded-full bg-white/85 px-3 text-xs font-black text-[#2563EB] shadow-sm ring-1 ring-blue-100" href={href} prefetch={false}>
      <span className="flex h-6 w-6 items-center justify-center overflow-hidden rounded-full bg-[linear-gradient(135deg,#60a5fa,#f9a8d4)] text-white shadow-sm" style={!imageAvatar && profile?.avatar ? { background: profile.avatar } : undefined}>
        {imageAvatar ? <img alt={profile?.displayName || label} className="h-full w-full object-cover" src={profile?.avatar} /> : <UserRound className="h-3.5 w-3.5" />}
      </span>
      {label}
    </Link>
  );
}

function isImageAvatar(value?: string) {
  return Boolean(value && !value.startsWith("linear-gradient"));
}
