import { NextResponse, type NextRequest } from "next/server";
import {
  adminErrorResponse,
  invalidAdminResponse,
  missingSupabaseAdminResponse,
  verifyAdminPassword,
} from "@/lib/supabaseAdmin";
import { supabaseAdmin } from "@/lib/supabase";

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

export async function GET(request: NextRequest) {
  if (!verifyAdminPassword(getPassword(request))) return invalidAdminResponse();
  if (!supabaseAdmin) return missingSupabaseAdminResponse();

  try {
    const [posts, comments, reports] = await Promise.all([
      supabaseAdmin.from("community_posts").select("*").order("created_at", { ascending: false }),
      supabaseAdmin.from("community_comments").select("*").order("created_at", { ascending: false }),
      supabaseAdmin.from("community_reports").select("*").order("created_at", { ascending: false }),
    ]);
    const firstError = posts.error || comments.error || reports.error;
    if (firstError) return adminErrorResponse(firstError);
    return NextResponse.json({
      comments: comments.data ?? [],
      posts: posts.data ?? [],
      reports: reports.data ?? [],
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
