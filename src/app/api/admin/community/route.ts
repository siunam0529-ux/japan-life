import { NextResponse, type NextRequest } from "next/server";
import {
  adminErrorResponse,
  invalidAdminResponse,
  missingSupabaseAdminResponse,
  verifyAdminPassword,
} from "@/lib/supabaseAdmin";
import { supabaseAdmin } from "@/lib/supabase";
import {
  communityCommentSelectColumns,
  communityPostSelectColumns,
  mapCommentFromDb,
  mapPostFromDb,
  mapReportFromDb,
  type CommunityCommentRow,
  type CommunityPostRow,
  type CommunityReportRow,
} from "@/lib/community/supabase";

type CommunityAdminTable =
  | "community_comments"
  | "community_notifications"
  | "community_posts"
  | "community_reports";

const communityAdminTables: CommunityAdminTable[] = [
  "community_comments",
  "community_notifications",
  "community_posts",
  "community_reports",
];

const reportSelectColumns = "id,user_id,target_type,target_id,reason,detail,status,created_at";

function getPassword(request: NextRequest) {
  return request.headers.get("x-admin-password") ?? "";
}

function isCommunityAdminTable(value: unknown): value is CommunityAdminTable {
  return typeof value === "string" && communityAdminTables.includes(value as CommunityAdminTable);
}

function cleanPayload(input: Record<string, unknown>) {
  const next = { ...input };
  delete next.id;
  delete next.created_at;
  delete next.updated_at;
  return next;
}

async function getCommunityCheckUserId() {
  if (!supabaseAdmin) return "";
  const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1 });
  if (error) throw error;
  return data.users[0]?.id ?? "";
}

export async function POST(request: NextRequest) {
  if (!verifyAdminPassword(getPassword(request))) return invalidAdminResponse();
  if (!supabaseAdmin) return missingSupabaseAdminResponse();

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const action = body.action;

  try {
    if (action === "check-post") {
      const userId = await getCommunityCheckUserId();
      if (!userId) {
        return NextResponse.json({ error: "当前 Supabase 项目还没有用户，无法测试 community_posts 的 user_id 外键写入。请先注册一个测试账号后再检测。" }, { status: 409 });
      }
      const now = new Date().toISOString();
      const { data, error } = await supabaseAdmin
        .from("community_posts")
        .insert({
          area: "日本",
          author_name: "Japan Life 后台检测",
          community_locale: "zh-cn",
          content: "社区写入检测",
          images: [],
          is_anonymous: false,
          status: "hidden",
          tags: ["admin-check"],
          title: "社区后台检测",
          type: "share",
          updated_at: now,
          user_id: userId,
        })
        .select("id")
        .single();
      if (error) return adminErrorResponse(error);
      return NextResponse.json({ postId: data?.id });
    }

    if (action === "check-comment") {
      const postId = typeof body.postId === "string" ? body.postId : "";
      if (!postId) return NextResponse.json({ error: "缺少测试帖子 ID。" }, { status: 400 });
      const userId = await getCommunityCheckUserId();
      if (!userId) {
        return NextResponse.json({ error: "当前 Supabase 项目还没有用户，无法测试 community_comments 的 user_id 外键写入。请先注册一个测试账号后再检测。" }, { status: 409 });
      }
      const { data, error } = await supabaseAdmin
        .from("community_comments")
        .insert({
          author_name: "Japan Life 后台检测",
          community_locale: "zh-cn",
          content: "社区评论写入检测",
          is_anonymous: false,
          post_id: postId,
          status: "hidden",
          user_id: userId,
        })
        .select("id")
        .single();
      if (error) return adminErrorResponse(error);
      return NextResponse.json({ commentId: data?.id, postId });
    }

    if (action === "delete-check-post") {
      const postId = typeof body.postId === "string" ? body.postId : "";
      if (!postId) return NextResponse.json({ error: "缺少测试帖子 ID。" }, { status: 400 });
      const { error } = await supabaseAdmin.from("community_posts").delete().eq("id", postId).contains("tags", ["admin-check"]);
      if (error) return adminErrorResponse(error);
      return NextResponse.json({ ok: true, postId });
    }

    return NextResponse.json({ error: "Invalid community admin action." }, { status: 400 });
  } catch (error) {
    return adminErrorResponse(error);
  }
}

export async function GET(request: NextRequest) {
  if (!verifyAdminPassword(getPassword(request))) return invalidAdminResponse();
  if (!supabaseAdmin) return missingSupabaseAdminResponse();

  try {
    const [posts, comments, reports] = await Promise.all([
      supabaseAdmin.from("community_posts").select(communityPostSelectColumns).order("created_at", { ascending: false }),
      supabaseAdmin.from("community_comments").select(communityCommentSelectColumns).order("created_at", { ascending: false }),
      supabaseAdmin.from("community_reports").select(reportSelectColumns).order("created_at", { ascending: false }),
    ]);
    const firstError = posts.error || comments.error || reports.error;
    if (firstError) return adminErrorResponse(firstError);
    return NextResponse.json({
      comments: ((comments.data ?? []) as unknown as CommunityCommentRow[]).map(mapCommentFromDb),
      posts: ((posts.data ?? []) as unknown as CommunityPostRow[]).map(mapPostFromDb),
      reports: ((reports.data ?? []) as unknown as CommunityReportRow[]).map(mapReportFromDb),
    });
  } catch (error) {
    return adminErrorResponse(error);
  }
}

export async function PATCH(request: NextRequest) {
  if (!verifyAdminPassword(getPassword(request))) return invalidAdminResponse();
  if (!supabaseAdmin) return missingSupabaseAdminResponse();

  const body = (await request.json()) as Record<string, unknown>;
  const table = body.table;
  const id = body.id;
  const patch = body.patch;
  if (!isCommunityAdminTable(table) || typeof id !== "string" || !patch || typeof patch !== "object") {
    return NextResponse.json({ error: "Invalid community admin payload." }, { status: 400 });
  }

  try {
    const { data, error } = await supabaseAdmin.from(table).update(cleanPayload(patch as Record<string, unknown>)).eq("id", id).select("*").single();
    if (error) return adminErrorResponse(error);
    return NextResponse.json({ item: data });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
