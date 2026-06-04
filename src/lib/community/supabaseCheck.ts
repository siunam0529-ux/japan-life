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
  return canUseCommunitySupabase() ? "Supabase" : "Supabase 不可用";
}

export function getCommunitySupabaseEnvironmentCheck() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  const urlStatus: CommunityCheckStatus = url.startsWith("http") ? "success" : url ? "warning" : "error";
  const anonStatus: CommunityCheckStatus = anonKey ? "success" : "error";
  const clientStatus: CommunityCheckStatus = hasSupabaseConfig && supabase ? "success" : "warning";

  return {
    anonKey: anonKey ? `${anonKey.slice(0, 8)}...` : "未配置",
    anonStatus,
    clientError: supabaseConfigError || "",
    clientStatus,
    dataMode: getCommunityDataMode(),
    mode: getCommunitySupabaseMode(),
    url: url || "未配置",
    urlStatus,
  };
}

export async function checkCommunitySupabaseTables(): Promise<CommunityTableCheck[]> {
  const client = supabase;
  if (!hasSupabaseConfig || !client) {
    return communityCheckTables.map((table) => ({
      count: 0,
      error: supabaseConfigError || "Supabase 尚未配置。",
      hint: "请配置 Supabase 环境变量后启用远程社区数据。",
      status: "warning",
      table,
    }));
  }

  const checks = await Promise.all(communityCheckTables.map(async (table) => {
    const { count, error } = await client.from(table).select("*", { count: "exact", head: true });
    return {
      count: count ?? 0,
      error: error?.message ?? "",
      hint: error ? "请检查表结构和 RLS 策略。" : "",
      status: error ? "error" as const : "success" as const,
      table,
    };
  }));
  return checks;
}

export const runCommunityTableChecks = checkCommunitySupabaseTables;

async function runAdminCommunityWriteCheck(action: string, adminPassword: string, payload: Record<string, unknown> = {}) {
  if (!adminPassword) throw new Error("请先输入管理员密码。");
  const response = await fetch("/api/admin/community", {
    body: JSON.stringify({ action, ...payload }),
    headers: {
      "Content-Type": "application/json",
      "x-admin-password": adminPassword,
    },
    method: "POST",
  });
  const data = (await response.json().catch(() => ({}))) as Record<string, unknown>;
  if (!response.ok) throw new Error(typeof data.error === "string" ? data.error : `后台检测接口错误 ${response.status}`);
  return data;
}

export async function insertCommunityCheckPost(adminPassword: string): Promise<CommunityWriteCheck> {
  try {
    const data = await runAdminCommunityWriteCheck("check-post", adminPassword);
    return { error: "", hint: "已通过后台 service role 写入测试帖子，检测的是实际上线后台写入链路。", postId: typeof data.postId === "string" ? data.postId : undefined, status: "success" };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : String(error),
      hint: "请检查 SUPABASE_SERVICE_ROLE_KEY、community_posts 表结构和 user_id 外键。这个检测不再使用浏览器 anon key。",
      status: "error",
    };
  }
}

export async function insertCommunityCheckComment(postId: string, adminPassword: string): Promise<CommunityWriteCheck> {
  try {
    const data = await runAdminCommunityWriteCheck("check-comment", adminPassword, { postId });
    return {
      commentId: typeof data.commentId === "string" ? data.commentId : undefined,
      error: "",
      hint: "已通过后台 service role 写入测试评论。",
      postId,
      status: "success",
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : String(error),
      hint: "请检查 SUPABASE_SERVICE_ROLE_KEY、community_comments 表结构、post_id 关联和 user_id 外键。",
      postId,
      status: "error",
    };
  }
}

export async function softDeleteCommunityCheckPost(postId: string, adminPassword: string): Promise<CommunityWriteCheck> {
  try {
    await runAdminCommunityWriteCheck("delete-check-post", adminPassword, { postId });
    return { error: "", hint: "测试帖子和它下面的测试评论已清理。", postId, status: "success" };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : String(error),
      hint: "请检查后台 service role 删除权限，或手动清理 tags 包含 admin-check 的测试帖子。",
      postId,
      status: "error",
    };
  }
}

export async function checkCommunityWriteFlow(): Promise<CommunityWriteCheck> {
  return {
    error: "",
    hint: `当前社区数据模式：${getCommunityDataMode()}。`,
    status: canUseCommunitySupabase() ? "success" : "warning",
  };
}

