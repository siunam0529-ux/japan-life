import type { User } from "@supabase/supabase-js";
import type { CommunityUserProfile } from "@/lib/community/types";

export const meProfileNameKey = "japan-life:me-profile-name";
export const meProfileIdKey = "japan-life:me-profile-id";
export const meProfileBioKey = "japan-life:me-profile-bio";
export const meProfileAvatarKey = "japan-life:me-profile-avatar";
export const meProfileIdChangedKey = "japan-life:me-profile-id-changed";
export const meProfileNameUpdatedAtKey = "japan-life:me-profile-name-updated-at";
export const meProfileBioUpdatedAtKey = "japan-life:me-profile-bio-updated-at";
export const meProfileChangeEvent = "japan-life:me-profile-change";
export const defaultMeProfileBio = "分享在日生活，记录每一个美好瞬间";

type AccountLike = {
  email?: string;
  id?: string;
  user_metadata?: Record<string, unknown> | null;
};

export type MeProfile = {
  accountId: string;
  avatar: string;
  bio: string;
  displayName: string;
  publicId: string;
};

export function getDefaultProfileName(user: AccountLike | User | null | undefined) {
  const metadata = user?.user_metadata as Record<string, unknown> | null | undefined;
  const metadataName = [metadata?.display_name, metadata?.full_name, metadata?.name]
    .find((value): value is string => typeof value === "string" && Boolean(value.trim()));
  return metadataName?.trim() || user?.email?.split("@")[0] || "Japan Life 用户";
}

export function getDefaultProfilePublicId(user: AccountLike | User | null | undefined) {
  return user?.id ? `jl-${user.id.slice(0, 8)}` : "local-user";
}

export function normalizeProfileId(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9_-]/g, "").slice(0, 24);
}

export function readMeProfile(user: AccountLike | User | null | undefined): MeProfile {
  const defaultName = getDefaultProfileName(user);
  const defaultPublicId = getDefaultProfilePublicId(user);
  const metadata = user?.user_metadata as Record<string, unknown> | null | undefined;
  const metadataAvatar = typeof metadata?.avatar_url === "string" ? metadata.avatar_url : "";
  if (typeof window === "undefined") {
    return {
      accountId: user?.id || "",
      avatar: metadataAvatar,
      bio: defaultMeProfileBio,
      displayName: defaultName,
      publicId: defaultPublicId,
    };
  }

  const rawSavedProfileId = window.localStorage.getItem(meProfileIdKey);
  const savedProfileId = rawSavedProfileId || defaultPublicId;
  return {
    accountId: user?.id || "",
    avatar: window.localStorage.getItem(meProfileAvatarKey) || window.localStorage.getItem("japan-life:user-avatar") || metadataAvatar,
    bio: window.localStorage.getItem(meProfileBioKey) || defaultMeProfileBio,
    displayName: window.localStorage.getItem(meProfileNameKey) || defaultName,
    publicId: savedProfileId === "local-user" ? defaultPublicId : savedProfileId,
  };
}

export function isOwnAccountProfile(targetId: string, user: AccountLike | User | null | undefined) {
  const profile = readMeProfile(user);
  return [profile.accountId, profile.publicId, "local-user"].filter(Boolean).includes(targetId);
}

export function createCommunityProfileFromMeProfile(meProfile: MeProfile, fallback: CommunityUserProfile): CommunityUserProfile {
  return {
    ...fallback,
    accountId: meProfile.accountId || fallback.accountId,
    avatar: meProfile.avatar || fallback.avatar,
    bio: meProfile.bio || fallback.bio,
    displayName: meProfile.displayName || fallback.displayName,
    id: meProfile.publicId || fallback.id,
  };
}

export function dispatchMeProfileChange() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(meProfileChangeEvent));
}
