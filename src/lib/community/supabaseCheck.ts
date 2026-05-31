import type { User } from "@supabase/supabase-js";
import { hasSupabaseConfig, supabase, supabaseConfigError } from "@/lib/supabase";
import { canUseCommunitySupabase, getCommunityDataMode } from "@/lib/community/dataMode";

export type CommunityCheckStatus = "idle" | "success" | "warning" | "error";

export type CommunityTableName =
  | "community_comments"
  | "community_contact_requests"
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
  "community_contact_requests",
  "community_reports",
  "community_notifications",
  "community_profiles",
];

export function getCommunitySupabaseMode() {
  return canUseCommunitySupabase() ? "Supabase" : "localStorage fallback";
}

export function getCommunitySupabaseEnvironmentCheck() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? "";
  const urlStatus: CommunityCheckStatus = !url ? "error" : isValidHttpUrl(url) ? "success" : "warning";
  const anonStatus: CommunityCheckStatus = !anonKey ? "error" : "success";

  return {
    anonKey: maskSecret(anonKey),
    anonStatus,
    clientError: supabaseConfigError,
    clientStatus: hasSupabaseConfig && Boolean(supabase) ? "success" as const : "error" as const,
    dataMode: getCommunityDataMode(),
    mode: getCommunitySupabaseMode(),
    url: maskUrl(url),
    urlStatus,
  };
}

export async function runCommunityTableChecks(): Promise<CommunityTableCheck[]> {
  if (!supabase) {
    return communityCheckTables.map((table) => ({
      count: 0,
      error: supabaseConfigError || "Supabase client is not initialized.",
      hint: "请先检查 NEXT_PUBLIC_SUPABASE_URL 和 NEXT_PUBLIC_SUPABASE_ANON_KEY。",
      status: "error",
      table,
    }));
  }

  const client = supabase;
  const checks = await Promise.all(communityCheckTables.map(async (table) => {
    try {
      const { data, error } = await client.from(table).select("*").limit(1);
      if (error) {
        return {
          count: 0,
          error: formatSupabaseCheckError(error),
          hint: explainSupabaseCheckError(error),
          status: "error" as const,
          table,
        };
      }
      return {
        count: Array.isArray(data) ? data.length : 0,
        error: "",
        hint: "",
        status: "success" as const,
        table,
      };
    } catch (error) {
      return {
        count: 0,
        error: formatSupabaseCheckError(error),
        hint: explainSupabaseCheckError(error),
        status: "error" as const,
        table,
      };
    }
  }));

  return checks;
}

export async function insertCommunityCheckPost(): Promise<CommunityWriteCheck> {
  if (!supabase) {
    return {
      error: supabaseConfigError || "Supabase client is not initialized.",
      hint: "请先配置 Supabase public 环境变量。",
      status: "error",
    };
  }

  const client = supabase;
  try {
    const user = await getCommunityCheckAuthUser();
    if (!user) return communityCheckLoginRequiredResult();
    const { data, error } = await client
      .from("community_posts")
      .insert({
        area: "东京",
        author_id: user.id,
        author_name: getCommunityCheckUserName(user),
        community_locale: "zh-cn",
        content: "这是一条测试数据，可以删除。",
        images: [],
        is_anonymous: false,
        status: "pending",
        tags: ["测试"],
        title: "Supabase 连接测试",
        type: "share",
      })
      .select("id")
      .single();

    if (error) {
      return {
        error: formatSupabaseCheckError(error),
        hint: explainSupabaseCheckError(error),
        status: "error",
      };
    }

    const postId = typeof data?.id === "string" ? data.id : "";
    return {
      error: "",
      hint: "",
      postId,
      status: postId ? "success" : "warning",
    };
  } catch (error) {
    return {
      error: formatSupabaseCheckError(error),
      hint: explainSupabaseCheckError(error),
      status: "error",
    };
  }
}

export async function softDeleteCommunityCheckPost(postId: string): Promise<CommunityWriteCheck> {
  if (!supabase) {
    return {
      error: supabaseConfigError || "Supabase client is not initialized.",
      hint: "请先配置 Supabase public 环境变量。",
      status: "error",
    };
  }

  const client = supabase;
  try {
    const { error } = await client.from("community_posts").update({ status: "deleted" }).eq("id", postId);
    if (error) {
      return {
        error: formatSupabaseCheckError(error),
        hint: explainSupabaseCheckError(error),
        postId,
        status: "error",
      };
    }
    return { error: "", hint: "", postId, status: "success" };
  } catch (error) {
    return {
      error: formatSupabaseCheckError(error),
      hint: explainSupabaseCheckError(error),
      postId,
      status: "error",
    };
  }
}

export async function insertCommunityCheckComment(postId: string): Promise<CommunityWriteCheck> {
  if (!supabase) {
    return {
      error: supabaseConfigError || "Supabase client is not initialized.",
      hint: "请先配置 Supabase public 环境变量。",
      status: "error",
    };
  }

  const client = supabase;
  try {
    const user = await getCommunityCheckAuthUser();
    if (!user) return communityCheckLoginRequiredResult(postId);
    const { data, error } = await client
      .from("community_comments")
      .insert({
        author_id: user.id,
        author_name: getCommunityCheckUserName(user),
        community_locale: "zh-cn",
        content: "测试评论",
        is_anonymous: false,
        post_id: postId,
        status: "published",
      })
      .select("id")
      .single();

    if (error) {
      return {
        error: formatSupabaseCheckError(error),
        hint: explainSupabaseCheckError(error),
        postId,
        status: "error",
      };
    }

    return {
      commentId: typeof data?.id === "string" ? data.id : undefined,
      error: "",
      hint: "",
      postId,
      status: "success",
    };
  } catch (error) {
    return {
      error: formatSupabaseCheckError(error),
      hint: explainSupabaseCheckError(error),
      postId,
      status: "error",
    };
  }
}

async function getCommunityCheckAuthUser() {
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return data.user;
}

function communityCheckLoginRequiredResult(postId?: string): CommunityWriteCheck {
  return {
    error: "请先登录 Supabase Auth 用户后再测试写入。",
    hint: "写入测试不会使用 current-user/Nam。请用真实登录用户测试 RLS 和字段权限。",
    postId,
    status: "error",
  };
}

function getCommunityCheckUserName(user: User) {
  const metadata = user.user_metadata as Record<string, unknown> | null;
  return [metadata?.full_name, metadata?.name, user.email?.split("@")[0]]
    .find((value): value is string => typeof value === "string" && Boolean(value.trim()))
    ?.trim() || "用户";
}

export function explainSupabaseCheckError(error: unknown) {
  const text = formatSupabaseCheckError(error).toLowerCase();
  if (text.includes("relation") && text.includes("does not exist")) {
    return "表不存在或表名不一致，需要检查你已经执行过的社区 SQL。";
  }
  if (text.includes("column") && text.includes("does not exist")) {
    return "字段缺失或字段名不一致，需要补字段或调整 repository 映射。";
  }
  if (text.includes("row-level security") || text.includes("rls")) {
    return "RLS 策略挡住了写入，需要检查 Supabase RLS policy。";
  }
  if (text.includes("permission denied")) {
    return "权限不足，需要检查 RLS 或 anon key 权限。";
  }
  if (text.includes("invalid api key") || text.includes("jwt")) {
    return "anon key 可能无效，请检查 NEXT_PUBLIC_SUPABASE_ANON_KEY。";
  }
  return "";
}

export function formatSupabaseCheckError(error: unknown) {
  if (!error) return "Unknown error.";
  if (error instanceof Error) return `${error.name}: ${error.message}`;
  if (typeof error === "object") {
    const record = error as Record<string, unknown>;
    const parts = [
      typeof record.message === "string" ? record.message : null,
      typeof record.code === "string" ? `code: ${record.code}` : null,
      typeof record.details === "string" ? `details: ${record.details}` : null,
      typeof record.hint === "string" ? `hint: ${record.hint}` : null,
    ].filter(Boolean);
    return parts.length ? parts.join(" / ") : JSON.stringify(record);
  }
  return String(error);
}

function isValidHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function maskSecret(value: string) {
  if (!value) return "未配置";
  if (value.length <= 8) return "已配置：****";
  return `已配置：${value.slice(0, 4)}...${value.slice(-4)}`;
}

function maskUrl(value: string) {
  if (!value) return "未配置";
  try {
    const url = new URL(value);
    return `${url.origin.replace(url.hostname, maskHost(url.hostname))}`;
  } catch {
    return value.length > 16 ? `${value.slice(0, 8)}...${value.slice(-4)}` : value;
  }
}

function maskHost(hostname: string) {
  if (hostname.length <= 10) return hostname;
  return `${hostname.slice(0, 6)}...${hostname.slice(-8)}`;
}
