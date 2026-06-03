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
    ?.trim() || "Japan Life User";
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
  if (!token) return { error: "Please sign in first.", status: 401, user: null };
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return { error: error?.message || "Session expired. Please sign in again.", status: 401, user: null };
  return { error: "", status: 200, user: data.user };
}

async function updatePostCommentCount(postId: string) {
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

export async function GET(request: NextRequest) {
  const userResult = await requireCommunityApiUser(request);
  if (!userResult.user) return NextResponse.json({ error: userResult.error }, { status: userResult.status });

  const authorIdParam = readString(request.nextUrl.searchParams.get("authorId"));
  const includeAllStatuses = request.nextUrl.searchParams.get("includeAllStatuses") === "1" || request.nextUrl.searchParams.get("includeAllStatuses") === "true";
  if (authorIdParam && !isUuid(authorIdParam)) return NextResponse.json({ items: [] });
  const authorId = authorIdParam || userResult.user.id;
  const isOwnAuthor = authorId === userResult.user.id;

  try {
    let query = supabaseAdmin!
      .from("community_comments")
      .select(communityCommentSelectColumns)
      .eq("user_id", authorId)
      .order("created_at", { ascending: false });
    if (!includeAllStatuses || !isOwnAuthor) query = query.eq("status", "published");

    const { data, error } = await query.returns<CommunityCommentRow[]>();
    if (error) return NextResponse.json({ error: formatAdminError(error) }, { status: 500 });
    return NextResponse.json({ items: (data ?? []).map(mapCommentFromDb) });
  } catch (error) {
    return NextResponse.json({ error: formatAdminError(error) }, { status: 500 });
  }
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
  if (!isUuid(postId) || !content) return NextResponse.json({ error: "Comment content is required." }, { status: 400 });

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
    const count = await updatePostCommentCount(postId);
    return NextResponse.json({ count, item: mapCommentFromDb(data as unknown as CommunityCommentRow) });
  } catch (error) {
    return NextResponse.json({ error: formatAdminError(error) }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const userResult = await requireCommunityApiUser(request);
  if (!userResult.user) return NextResponse.json({ error: userResult.error }, { status: userResult.status });

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const id = readString(body?.id);
  const requestedPostId = readString(body?.postId);
  if (!isUuid(id)) return NextResponse.json({ error: "Comment does not exist." }, { status: 400 });

  try {
    const { data: current, error: readError } = await supabaseAdmin!
      .from("community_comments")
      .select("id,post_id,user_id,status")
      .eq("id", id)
      .maybeSingle();
    if (readError) return NextResponse.json({ error: formatAdminError(readError) }, { status: 500 });
    if (!current || current.status === "deleted") return NextResponse.json({ ok: true });

    const postId = String((current as { post_id?: unknown }).post_id || requestedPostId || "");
    let postOwnerId = "";
    if (isUuid(postId)) {
      const { data: post, error: postError } = await supabaseAdmin!
        .from("community_posts")
        .select("user_id")
        .eq("id", postId)
        .maybeSingle();
      if (postError) return NextResponse.json({ error: formatAdminError(postError) }, { status: 500 });
      postOwnerId = typeof (post as { user_id?: unknown } | null)?.user_id === "string" ? (post as { user_id: string }).user_id : "";
    }

    const isCommentOwner = (current as { user_id?: string | null }).user_id === userResult.user.id;
    const isPostOwner = postOwnerId === userResult.user.id;
    if (!isCommentOwner && !isPostOwner) return NextResponse.json({ error: "You cannot delete this comment." }, { status: 403 });

    const { error } = await supabaseAdmin!
      .from("community_comments")
      .update({ status: "deleted" })
      .or(`id.eq.${id},parent_id.eq.${id}`);
    if (error) return NextResponse.json({ error: formatAdminError(error) }, { status: 500 });
    if (isUuid(postId)) await updatePostCommentCount(postId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: formatAdminError(error) }, { status: 500 });
  }
}
