import { NextResponse, type NextRequest } from "next/server";
import { communityPostSelectColumns, mapPostFromDb, type CommunityPostRow } from "@/lib/community/supabase";
import { isCommunityPostStatus, type CommunityPostStatus } from "@/lib/community/types";
import { supabase, supabaseAdmin, supabaseConfigError, supabaseServiceConfigError } from "@/lib/supabase";
import { formatAdminError } from "@/lib/supabaseAdmin";

type RouteContext = {
  params: Promise<{ id: string }>;
};

const editableStatuses: CommunityPostStatus[] = ["hidden", "published"];

function getToken(request: NextRequest) {
  return (request.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "").trim();
}

async function getCommunityApiUser(request: NextRequest) {
  if (!supabase) return { error: supabaseConfigError || "Supabase public client is not configured.", status: 500, userId: "" };
  if (!supabaseAdmin) return { error: supabaseServiceConfigError || "Supabase admin client is not configured.", status: 500, userId: "" };

  const token = getToken(request);
  if (!token) return { error: "", status: 200, userId: "" };

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return { error: error?.message || "登录已过期，请重新登录。", status: 401, userId: "" };
  return { error: "", status: 200, userId: data.user.id };
}

async function requireCommunityApiUser(request: NextRequest) {
  const result = await getCommunityApiUser(request);
  if (!result.userId) return { ...result, error: result.error || "请先登录后再操作。", status: result.status === 200 ? 401 : result.status };
  return result;
}

function getPostOwnerId(row: CommunityPostRow) {
  return row.user_id || "";
}

async function readPost(id: string) {
  if (!supabaseAdmin) return { data: null, error: supabaseServiceConfigError || "Supabase admin client is not configured." };
  const { data, error } = await supabaseAdmin.from("community_posts").select(communityPostSelectColumns).eq("id", id).maybeSingle();
  return { data: data as unknown as CommunityPostRow | null, error };
}

function parseTags(value: unknown) {
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === "string").map((item) => item.trim()).filter(Boolean).slice(0, 8);
  if (typeof value !== "string") return undefined;
  return value.split(/[\s,，#]+/).map((item) => item.trim()).filter(Boolean).slice(0, 8);
}

export async function GET(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const userResult = await getCommunityApiUser(request);
  if (userResult.error) return NextResponse.json({ error: userResult.error }, { status: userResult.status });

  try {
    const { data, error } = await readPost(id);
    if (error) return NextResponse.json({ error: formatAdminError(error) }, { status: 500 });
    if (!data || data.status === "deleted") return NextResponse.json({ error: "帖子不存在。", item: null }, { status: 404 });

    const ownerId = getPostOwnerId(data);
    const canRead = data.status === "published" || (data.status === "hidden" && ownerId === userResult.userId);
    if (!canRead) return NextResponse.json({ error: "没有权限查看这个帖子。", item: null }, { status: 403 });
    return NextResponse.json({ item: mapPostFromDb(data) });
  } catch (error) {
    return NextResponse.json({ error: formatAdminError(error) }, { status: 500 });
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const userResult = await getCommunityApiUser(request);
  if (userResult.error) return NextResponse.json({ error: userResult.error }, { status: userResult.status });

  try {
    const { data, error } = await readPost(id);
    if (error) return NextResponse.json({ error: formatAdminError(error) }, { status: 500 });
    if (!data || data.status === "deleted") return NextResponse.json({ error: "帖子不存在。", item: null }, { status: 404 });

    const ownerId = getPostOwnerId(data);
    const canRead = data.status === "published" || (data.status === "hidden" && ownerId === userResult.userId);
    if (!canRead) return NextResponse.json({ error: "没有权限查看这个帖子。", item: null }, { status: 403 });
    if (ownerId && ownerId === userResult.userId) return NextResponse.json({ item: mapPostFromDb(data) });

    const nextViewCount = Math.max(0, Number(data.view_count ?? 0)) + 1;
    const { data: updated, error: updateError } = await supabaseAdmin!
      .from("community_posts")
      .update({ view_count: nextViewCount })
      .eq("id", id)
      .select(communityPostSelectColumns)
      .single();
    if (updateError) return NextResponse.json({ error: formatAdminError(updateError) }, { status: 500 });
    return NextResponse.json({ item: mapPostFromDb(updated as unknown as CommunityPostRow) });
  } catch (error) {
    return NextResponse.json({ error: formatAdminError(error) }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const userResult = await requireCommunityApiUser(request);
  if (!userResult.userId) return NextResponse.json({ error: userResult.error }, { status: userResult.status });

  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  if (!body || typeof body !== "object") return NextResponse.json({ error: "Invalid community post payload." }, { status: 400 });

  try {
    const current = await readPost(id);
    if (current.error) return NextResponse.json({ error: formatAdminError(current.error) }, { status: 500 });
    if (!current.data || current.data.status === "deleted") return NextResponse.json({ error: "帖子不存在。" }, { status: 404 });
    if (getPostOwnerId(current.data) !== userResult.userId) return NextResponse.json({ error: "只能编辑自己的帖子。" }, { status: 403 });

    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (typeof body.title === "string") patch.title = body.title.trim();
    if (typeof body.content === "string") patch.content = body.content.trim();
    if (typeof body.area === "string") patch.area = body.area.trim();
    const tags = parseTags(body.tags);
    if (tags) patch.tags = tags;
    if (typeof body.status === "string" && isCommunityPostStatus(body.status) && editableStatuses.includes(body.status)) patch.status = body.status;

    if ("title" in patch && !String(patch.title).trim()) return NextResponse.json({ error: "标题不能为空。" }, { status: 400 });
    if ("content" in patch && !String(patch.content).trim()) return NextResponse.json({ error: "内容不能为空。" }, { status: 400 });
    if ("area" in patch && !String(patch.area).trim()) return NextResponse.json({ error: "地区不能为空。" }, { status: 400 });

    const { data, error } = await supabaseAdmin!
      .from("community_posts")
      .update(patch)
      .eq("id", id)
      .select(communityPostSelectColumns)
      .single();
    if (error) return NextResponse.json({ error: formatAdminError(error) }, { status: 500 });
    return NextResponse.json({ item: mapPostFromDb(data as unknown as CommunityPostRow) });
  } catch (error) {
    return NextResponse.json({ error: formatAdminError(error) }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const userResult = await requireCommunityApiUser(request);
  if (!userResult.userId) return NextResponse.json({ error: userResult.error }, { status: userResult.status });

  try {
    const current = await readPost(id);
    if (current.error) return NextResponse.json({ error: formatAdminError(current.error) }, { status: 500 });
    if (!current.data || current.data.status === "deleted") return NextResponse.json({ ok: true });
    if (getPostOwnerId(current.data) !== userResult.userId) return NextResponse.json({ error: "只能删除自己的帖子。" }, { status: 403 });

    const { error } = await supabaseAdmin!
      .from("community_posts")
      .update({ status: "deleted", updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) return NextResponse.json({ error: formatAdminError(error) }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: formatAdminError(error) }, { status: 500 });
  }
}
