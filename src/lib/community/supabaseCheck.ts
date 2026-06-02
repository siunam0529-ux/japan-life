import { canUseCommunitySupabase, getCommunityDataMode } from "@/lib/community/dataMode";
import { hasSupabaseConfig, supabase, supabaseConfigError } from "@/lib/supabase";

export type CommunityCheckStatus = "idle" | "success" | "warning" | "error";

export type CommunityTableName =
  | "community_comments"
  | "community_favorites"
  | "community_likes"
  | "community_notifications"
  | "community_posts"
  | "community_profiles"
  | "community_reports";

export type CommunityTableCheck = {
  count: number;
  error: string;
  hint: string;
  status: CommunityCheckStatus;
  table: CommunityTableName;
};

export type CommunityWriteCheck = {
  commentId?: string;
  error: string;
  hint: string;
  postId?: string;
  status: CommunityCheckStatus;
};

export const communityCheckTables: CommunityTableName[] = [
  "community_posts",
  "community_comments",
  "community_likes",
  "community_favorites",
  "community_reports",
  "community_notifications",
  "community_profiles",
];

export function getCommunitySupabaseMode() {
  return canUseCommunitySupabase() ? "Supabase" : "Supabase unavailable";
}

export function getCommunitySupabaseEnvironmentCheck() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  const urlStatus: CommunityCheckStatus = url.startsWith("http") ? "success" : url ? "warning" : "error";
  const anonStatus: CommunityCheckStatus = anonKey ? "success" : "error";
  const clientStatus: CommunityCheckStatus = hasSupabaseConfig && supabase ? "success" : "warning";

  return {
    anonKey: anonKey ? `${anonKey.slice(0, 8)}...` : "missing",
    anonStatus,
    clientError: supabaseConfigError || "",
    clientStatus,
    dataMode: getCommunityDataMode(),
    mode: getCommunitySupabaseMode(),
    url: url || "missing",
    urlStatus,
  };
}

export async function checkCommunitySupabaseTables(): Promise<CommunityTableCheck[]> {
  const client = supabase;
  if (!hasSupabaseConfig || !client) {
    return communityCheckTables.map((table) => ({
      count: 0,
      error: supabaseConfigError || "Supabase is not configured.",
      hint: "Configure Supabase environment variables to enable remote community data.",
      status: "warning",
      table,
    }));
  }

  const checks = await Promise.all(communityCheckTables.map(async (table) => {
    const { count, error } = await client.from(table).select("*", { count: "exact", head: true });
    return {
      count: count ?? 0,
      error: error?.message ?? "",
      hint: error ? "Check table schema and RLS policies." : "",
      status: error ? "error" as const : "success" as const,
      table,
    };
  }));
  return checks;
}

export const runCommunityTableChecks = checkCommunitySupabaseTables;

export async function insertCommunityCheckPost(): Promise<CommunityWriteCheck> {
  const client = supabase;
  if (!hasSupabaseConfig || !client) {
    return {
      error: supabaseConfigError || "Supabase is not configured.",
      hint: `Current community data mode: ${getCommunityDataMode()}.`,
      status: "warning",
    };
  }

  const now = new Date().toISOString();
  const { data, error } = await client
    .from("community_posts")
    .insert({
      area: "日本",
      author_name: "Japan Life Admin Check",
      community_locale: "zh-cn",
      content: "Community write check",
      images: [],
      is_anonymous: false,
      status: "hidden",
      tags: ["admin-check"],
      title: "Community admin check",
      type: "share",
      updated_at: now,
    })
    .select("id")
    .single();

  if (error) {
    return { error: error.message, hint: "Check community_posts schema, insert policy, and anon/admin permissions.", status: "error" };
  }
  return { error: "", hint: "", postId: data?.id, status: "success" };
}

export async function insertCommunityCheckComment(postId: string): Promise<CommunityWriteCheck> {
  const client = supabase;
  if (!hasSupabaseConfig || !client) {
    return {
      error: supabaseConfigError || "Supabase is not configured.",
      hint: `Current community data mode: ${getCommunityDataMode()}.`,
      postId,
      status: "warning",
    };
  }

  const { data, error } = await client
    .from("community_comments")
    .insert({
      author_name: "Japan Life Admin Check",
      community_locale: "zh-cn",
      content: "Community comment write check",
      is_anonymous: false,
      post_id: postId,
      status: "hidden",
    })
    .select("id")
    .single();

  if (error) {
    return { error: error.message, hint: "Check community_comments schema, insert policy, and post_id relation.", postId, status: "error" };
  }
  return { commentId: data?.id, error: "", hint: "", postId, status: "success" };
}

export async function softDeleteCommunityCheckPost(postId: string): Promise<CommunityWriteCheck> {
  const client = supabase;
  if (!hasSupabaseConfig || !client) {
    return {
      error: supabaseConfigError || "Supabase is not configured.",
      hint: `Current community data mode: ${getCommunityDataMode()}.`,
      postId,
      status: "warning",
    };
  }

  const { error } = await client.from("community_posts").update({ status: "deleted" }).eq("id", postId);
  if (error) {
    return { error: error.message, hint: "Check update policy for community_posts.", postId, status: "error" };
  }
  return { error: "", hint: "", postId, status: "success" };
}

export async function checkCommunityWriteFlow(): Promise<CommunityWriteCheck> {
  return {
    error: "",
    hint: `Current community data mode: ${getCommunityDataMode()}.`,
    status: canUseCommunitySupabase() ? "success" : "warning",
  };
}

