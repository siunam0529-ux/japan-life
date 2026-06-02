import { NextResponse, type NextRequest } from "next/server";
import { communityCommentSelectColumns, mapCommentFromDb, type CommunityCommentRow } from "@/lib/community/supabase";
import { hasCommunityRiskKeyword, isCommunityLocale } from "@/lib/community/types";
import { supabase, supabaseAdmin, supabaseConfigError, supabaseServiceConfigError } from "@/lib/supabase";
import { formatAdminError } from "@/lib/supabaseAdmin";

function isUuid(value: unknown) {
  return typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function readString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function getUserDisplayName(user: { email?: string; user_metadata?: Record<string, unknown> }) {
  const metadata = user.user_metadata ?? {};
  return [metadata.display_name, metadata.full_name, metadata.name, user.email?.split("@")[0]]
    .find((value): value is string => typeof value === "string" && Boolean(value.trim()))
    ?.trim() || "Japan Life 用户";
}

async function getCommunityDisplayName(user: { email?: string; id: string; user_metadata?: Record<string, unknown> }) {
  const { data, error } = await supabaseAdmin!
    .from("community_profiles")
    .select("display_name")
    .eq("id", user.id)
    .limit(1)
    .maybeSingle();
  if (error) console.warn("[community-comments] profile name lookup failed", error);
  const name = typeof (data as { display_name?: unknown } | null)?.display_name === "string" ? (data as { display_name: string }).display_name.trim() : "";
  return name || getUserDisplayName(user);
}

async function requireCommunityApiUser(request: NextRequest) {
  if (!supabase) return { error: supabaseConfigError || "Supabase public client is not configured.", status: 500, user: null };
  if (!supabaseAdmin) return { error: supabaseServiceConfigError || "Supabase admin client is not configured.", status: 500, user: null };
  const token = (request.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "").trim();
  if (!token) return { error: "请先登录后再留言。", status: 401, user: null };
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return { error: error?.message || "登录已过期，请重新登录。", status: 401, user: null };
  return { error: "", status: 200, user: data.user };
}

async function updatePostCommentCount(postId: string, delta: number) {
  void delta;
  const { count, error: countError } = await supabaseAdmin!
    .from("community_comments")
    .select("id", { count: "exact", head: true })
    .eq("post_id", postId)
    .eq("status", "published");
  if (countError) throw countError;
  const nextCount = Math.max(0, Number(count ?? 0));
  const { error } = await supabaseAdmin!
    .from("community_posts")
    .update({ comment_count: nextCount })
    .eq("id", postId);
  if (error) throw error;
  return nextCount;
}

export async function POST(request: NextRequest) {
  const userResult = await requireCommunityApiUser(request);
  if (!userResult.user) return NextResponse.json({ error: userResult.error }, { status: userResult.status });

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const postId = readString(body?.postId);
  const content = readString(body?.content);
  const parentId = readString(body?.parentId);
  const rawCommunityLocale = readString(body?.communityLocale);
  const communityLocale = isCommunityLocale(rawCommunityLocale) ? rawCommunityLocale : "zh-cn";
  if (!isUuid(postId) || !content) return NextResponse.json({ error: "请填写留言内容。" }, { status: 400 });

  try {
    const authorName = await getCommunityDisplayName(userResult.user);
    const payload = {
      author_name: authorName,
      community_locale: communityLocale,
      content,
      is_anonymous: false,
      parent_id: isUuid(parentId) ? parentId : null,
      post_id: postId,
      status: hasCommunityRiskKeyword(content) ? "reported" : "published",
      user_id: userResult.user.id,
    };
    const { data, error } = await supabaseAdmin!
      .from("community_comments")
      .insert(payload)
      .select(communityCommentSelectColumns)
      .single();
    if (error) return NextResponse.json({ error: formatAdminError(error) }, { status: 500 });
    const count = await updatePostCommentCount(postId, 1);
    return NextResponse.json({ count, item: mapCommentFromDb(data as unknown as CommunityCommentRow) });
  } catch (error) {
    return NextResponse.json({ error: formatAdminError(error) }, { status: 500 });
  }
}
