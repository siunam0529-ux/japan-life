import { hasSupabaseConfig, supabase } from "@/lib/supabase";

export type CommunityDataMode = "auto" | "local" | "supabase";

export function getCommunityDataMode(): CommunityDataMode {
  const value = process.env.NEXT_PUBLIC_COMMUNITY_DATA_MODE?.trim().toLowerCase();
  if (value === "local" || value === "supabase" || value === "auto") return value;
  return "auto";
}

export function canUseCommunitySupabase() {
  return getCommunityDataMode() !== "local" && hasSupabaseConfig && Boolean(supabase);
}

export function shouldUseCommunityLocalFallback() {
  return getCommunityDataMode() !== "supabase";
}

export function isCommunityLocalMode() {
  return getCommunityDataMode() === "local";
}

export function isCommunitySupabaseMode() {
  return getCommunityDataMode() === "supabase";
}
