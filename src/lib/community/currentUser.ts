import type { User } from "@supabase/supabase-js";
import { canUseCommunitySupabase, getCommunityDataMode, shouldUseCommunityLocalFallback } from "@/lib/community/dataMode";
import { supabase } from "@/lib/supabase";

export type CommunityUser = {
  avatarUrl: string;
  email: string;
  id: string;
  isMock: boolean;
  name: string;
};

export const MOCK_COMMUNITY_USER: CommunityUser = {
  avatarUrl: "",
  email: "",
  id: "current-user",
  isMock: true,
  name: "Nam",
};

export const CURRENT_USER_ID = MOCK_COMMUNITY_USER.id;
export const CURRENT_USER_NAME = MOCK_COMMUNITY_USER.name;

export async function getCurrentCommunityUser(): Promise<CommunityUser | null> {
  const mode = getCommunityDataMode();
  if (mode === "local") return MOCK_COMMUNITY_USER;
  if (!canUseCommunitySupabase() || !supabase) return shouldUseCommunityLocalFallback() ? MOCK_COMMUNITY_USER : null;

  try {
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      console.warn("[community:user] failed to get Supabase Auth session", sessionError);
      return shouldUseCommunityLocalFallback() ? MOCK_COMMUNITY_USER : null;
    }
    if (!sessionData.session?.user) return null;

    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) return null;
    return mapSupabaseUserToCommunityUser(data.user);
  } catch (error) {
    console.warn("[community:user] failed to get Supabase Auth user", error);
    return shouldUseCommunityLocalFallback() ? MOCK_COMMUNITY_USER : null;
  }
}

export async function requireCommunityUser(): Promise<CommunityUser> {
  const user = await getCurrentCommunityUser();
  if (!user) throw new Error("请先登录");
  return user;
}

export function mapSupabaseUserToCommunityUser(user: User): CommunityUser {
  const metadata = user.user_metadata as Record<string, unknown> | null;
  const name = [metadata?.full_name, metadata?.name, user.email?.split("@")[0]]
    .find((value): value is string => typeof value === "string" && Boolean(value.trim()))
    ?.trim() || "用户";
  const avatarUrl = typeof metadata?.avatar_url === "string" ? metadata.avatar_url : "";

  return {
    avatarUrl,
    email: user.email ?? "",
    id: user.id,
    isMock: false,
    name,
  };
}
