import { NextResponse, type NextRequest } from "next/server";
import { supabase, supabaseAdmin, supabaseConfigError, supabaseServiceConfigError } from "@/lib/supabase";
import { formatAdminError } from "@/lib/supabaseAdmin";

type ReactionType = "favorite" | "like";

const reactionConfig: Record<ReactionType, { counter: "favorite_count" | "like_count"; table: "community_favorites" | "community_likes" }> = {
  favorite: { counter: "favorite_count", table: "community_favorites" },
  like: { counter: "like_count", table: "community_likes" },
};

function isUuid(value: unknown) {
  return typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function isReactionType(value: unknown): value is ReactionType {
  return value === "favorite" || value === "like";
}

async function requireCommunityApiUser(request: NextRequest) {
  if (!supabase) return { error: supabaseConfigError || "Supabase public client is not configured.", status: 500, userId: "" };
  if (!supabaseAdmin) return { error: supabaseServiceConfigError || "Supabase admin client is not configured.", status: 500, userId: "" };
  const token = (request.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "").trim();
  if (!token) return { error: "请先登录后再操作。", status: 401, userId: "" };
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return { error: error?.message || "登录已过期，请重新登录。", status: 401, userId: "" };
  return { error: "", status: 200, userId: data.user.id };
}

async function updatePostCounter(postId: string, counter: "favorite_count" | "like_count", delta: number) {
  void delta;
  const table = counter === "favorite_count" ? "community_favorites" : "community_likes";
  const { count, error: countError } = await supabaseAdmin!
    .from(table)
    .select("id", { count: "exact", head: true })
    .eq("post_id", postId);
  if (countError) throw countError;
  const nextCount = Math.max(0, Number(count ?? 0));
  const { error } = await supabaseAdmin!
    .from("community_posts")
    .update({ [counter]: nextCount })
    .eq("id", postId);
  if (error) throw error;
  return nextCount;
}

export async function POST(request: NextRequest) {
  const user = await requireCommunityApiUser(request);
  if (user.error) return NextResponse.json({ error: user.error }, { status: user.status });

  const body = (await request.json().catch(() => null)) as { postId?: unknown; type?: unknown } | null;
  const postId = typeof body?.postId === "string" ? body.postId.trim() : "";
  if (!isUuid(postId) || !isReactionType(body?.type)) return NextResponse.json({ error: "Invalid reaction payload." }, { status: 400 });
  const config = reactionConfig[body.type];

  try {
    const existing = await supabaseAdmin!
      .from(config.table)
      .select("id")
      .eq("post_id", postId)
      .eq("user_id", user.userId)
      .maybeSingle();
    if (existing.error) return NextResponse.json({ error: formatAdminError(existing.error) }, { status: 500 });

    const wasActive = Boolean(existing.data);
    if (wasActive) {
      const { error } = await supabaseAdmin!
        .from(config.table)
        .delete()
        .eq("post_id", postId)
        .eq("user_id", user.userId);
      if (error) return NextResponse.json({ error: formatAdminError(error) }, { status: 500 });
    } else {
      const { error } = await supabaseAdmin!
        .from(config.table)
        .insert({ post_id: postId, user_id: user.userId });
      if (error) return NextResponse.json({ error: formatAdminError(error) }, { status: 500 });
    }

    const count = await updatePostCounter(postId, config.counter, wasActive ? -1 : 1);
    return NextResponse.json({ active: !wasActive, count });
  } catch (error) {
    return NextResponse.json({ error: formatAdminError(error) }, { status: 500 });
  }
}
