import { NextResponse, type NextRequest } from "next/server";
import { supabase, supabaseAdmin, supabaseConfigError, supabaseServiceConfigError } from "@/lib/supabase";
import { formatAdminError } from "@/lib/supabaseAdmin";

function isUuid(value: unknown) {
  return typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

async function requireCommunityApiUser(request: NextRequest) {
  if (!supabase) return { error: supabaseConfigError || "Supabase public client is not configured.", status: 500, userId: "" };
  if (!supabaseAdmin) return { error: supabaseServiceConfigError || "Supabase admin client is not configured.", status: 500, userId: "" };
  const token = (request.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "").trim();
  if (!token) return { error: "Please sign in first.", status: 401, userId: "" };
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return { error: error?.message || "Session expired. Please sign in again.", status: 401, userId: "" };
  return { error: "", status: 200, userId: data.user.id };
}

async function updateCommentLikeCount(commentId: string) {
  const { count, error: countError } = await supabaseAdmin!
    .from("community_comment_likes")
    .select("id", { count: "exact", head: true })
    .eq("comment_id", commentId);
  if (countError) throw countError;
  const nextCount = Math.max(0, Number(count ?? 0));
  const { error } = await supabaseAdmin!
    .from("community_comments")
    .update({ like_count: nextCount })
    .eq("id", commentId);
  if (error) throw error;
  return nextCount;
}

export async function GET(request: NextRequest) {
  const user = await requireCommunityApiUser(request);
  if (user.error) return NextResponse.json({ error: user.error }, { status: user.status });

  try {
    let query = supabaseAdmin!
      .from("community_comment_likes")
      .select("comment_id")
      .eq("user_id", user.userId);
    const postId = request.nextUrl.searchParams.get("postId");
    if (isUuid(postId)) {
      const { data: comments, error: commentError } = await supabaseAdmin!
        .from("community_comments")
        .select("id")
        .eq("post_id", postId);
      if (commentError) return NextResponse.json({ error: formatAdminError(commentError) }, { status: 500 });
      const commentIds = (comments ?? []).map((item) => String((item as { id?: unknown }).id || "")).filter(Boolean);
      if (!commentIds.length) return NextResponse.json({ ids: [] });
      query = query.in("comment_id", commentIds);
    }

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: formatAdminError(error) }, { status: 500 });
    const ids = (data ?? [])
      .map((item) => typeof (item as { comment_id?: unknown }).comment_id === "string" ? (item as { comment_id: string }).comment_id : "")
      .filter(Boolean);
    return NextResponse.json({ ids });
  } catch (error) {
    return NextResponse.json({ error: formatAdminError(error) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const user = await requireCommunityApiUser(request);
  if (user.error) return NextResponse.json({ error: user.error }, { status: user.status });

  const body = (await request.json().catch(() => null)) as { commentId?: unknown } | null;
  const commentId = typeof body?.commentId === "string" ? body.commentId.trim() : "";
  if (!isUuid(commentId)) return NextResponse.json({ error: "Invalid comment reaction payload." }, { status: 400 });

  try {
    const existing = await supabaseAdmin!
      .from("community_comment_likes")
      .select("id")
      .eq("comment_id", commentId)
      .eq("user_id", user.userId)
      .maybeSingle();
    if (existing.error) return NextResponse.json({ error: formatAdminError(existing.error) }, { status: 500 });

    const wasActive = Boolean(existing.data);
    if (wasActive) {
      const { error } = await supabaseAdmin!
        .from("community_comment_likes")
        .delete()
        .eq("comment_id", commentId)
        .eq("user_id", user.userId);
      if (error) return NextResponse.json({ error: formatAdminError(error) }, { status: 500 });
    } else {
      const { error } = await supabaseAdmin!
        .from("community_comment_likes")
        .insert({ comment_id: commentId, user_id: user.userId });
      if (error) return NextResponse.json({ error: formatAdminError(error) }, { status: 500 });
    }

    const count = await updateCommentLikeCount(commentId);
    return NextResponse.json({ active: !wasActive, count });
  } catch (error) {
    return NextResponse.json({ error: formatAdminError(error) }, { status: 500 });
  }
}
