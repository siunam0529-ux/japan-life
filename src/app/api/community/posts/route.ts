import { NextResponse, type NextRequest } from "next/server";
import { communityPostSelectColumns, mapPostFromDb, mapPostToDb, type CommunityPostRow } from "@/lib/community/supabase";
import { isCommunityLocale, type CommunityPost, type CommunityUserProfile } from "@/lib/community/types";
import { supabase, supabaseAdmin, supabaseConfigError, supabaseServiceConfigError } from "@/lib/supabase";
import { formatAdminError } from "@/lib/supabaseAdmin";

function getUserDisplayName(user: { email?: string; user_metadata?: Record<string, unknown> }) {
  const metadata = user.user_metadata ?? {};
  return [metadata.display_name, metadata.full_name, metadata.name, user.email?.split("@")[0]]
    .find((value): value is string => typeof value === "string" && Boolean(value.trim()))
    ?.trim() || "Japan Life 用户";
}

async function requireCommunityApiUser(request: NextRequest) {
  if (!supabase) return { error: supabaseConfigError || "Supabase public client is not configured.", status: 500, user: null };
  if (!supabaseAdmin) return { error: supabaseServiceConfigError || "Supabase admin client is not configured.", status: 500, user: null };

  const authorization = request.headers.get("authorization") ?? "";
  const token = authorization.replace(/^Bearer\s+/i, "").trim();
  if (!token) return { error: "请先登录后再发布。", status: 401, user: null };

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return { error: error?.message || "登录已过期，请重新登录。", status: 401, user: null };
  return { error: "", status: 200, user: data.user };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function getPostInput(body: unknown): Partial<CommunityPost> | null {
  if (!isRecord(body)) return null;
  const post = isRecord(body.post) ? body.post : body;
  return isRecord(post) ? post as Partial<CommunityPost> : null;
}

function getProfileInput(body: unknown): Partial<CommunityUserProfile> | null {
  if (!isRecord(body) || !isRecord(body.profile)) return null;
  return body.profile as Partial<CommunityUserProfile>;
}

function readProfileDisplayName(profile: Partial<CommunityUserProfile> | null) {
  return typeof profile?.displayName === "string" && profile.displayName.trim() ? profile.displayName.trim().slice(0, 80) : "";
}

export async function POST(request: NextRequest) {
  const userResult = await requireCommunityApiUser(request);
  if (!userResult.user) return NextResponse.json({ error: userResult.error }, { status: userResult.status });

  const body = await request.json().catch(() => null);
  const input = getPostInput(body);
  if (!input) return NextResponse.json({ error: "Invalid community post payload." }, { status: 400 });
  const communityLocale = typeof input.communityLocale === "string" ? input.communityLocale : "";
  if (!isCommunityLocale(communityLocale)) return NextResponse.json({ error: "Invalid community locale." }, { status: 400 });
  if (!input.title?.trim() || !input.content?.trim() || !input.area?.trim() || !input.type) {
    return NextResponse.json({ error: "请填写标题、内容、地区和分类。" }, { status: 400 });
  }

  const profile = getProfileInput(body);
  const authorName = readProfileDisplayName(profile) || getUserDisplayName(userResult.user);
  const payload = mapPostToDb({
    ...input,
    communityLocale,
    authorId: userResult.user.id,
    authorName,
  }, userResult.user.id);

  try {
    if (profile) {
      const profilePayload = {
        id: userResult.user.id,
        area: typeof profile.area === "string" ? profile.area : "",
        avatar: typeof profile.avatar === "string" ? profile.avatar : "",
        bio: typeof profile.bio === "string" ? profile.bio : "",
        display_name: authorName,
        interests: Array.isArray(profile.interests) ? profile.interests.filter((item): item is string => typeof item === "string") : [],
        is_anonymous_default: Boolean(profile.isAnonymousDefault),
        languages: Array.isArray(profile.languages) ? profile.languages.filter((item): item is string => typeof item === "string") : [],
      };
      const { error: profileError } = await supabaseAdmin!
        .from("community_profiles")
        .upsert(profilePayload, { onConflict: "id" });
      if (profileError) console.warn("[community-posts] profile upsert skipped", formatAdminError(profileError));
    }

    const { data, error } = await supabaseAdmin!
      .from("community_posts")
      .insert(payload)
      .select(communityPostSelectColumns)
      .single();
    if (error) return NextResponse.json({ error: formatAdminError(error) }, { status: 500 });
    return NextResponse.json({ item: mapPostFromDb(data as unknown as CommunityPostRow) });
  } catch (error) {
    return NextResponse.json({ error: formatAdminError(error) }, { status: 500 });
  }
}
