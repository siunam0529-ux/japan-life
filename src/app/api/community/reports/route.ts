import { NextResponse, type NextRequest } from "next/server";
import { mapReportFromDb, type CommunityReportRow } from "@/lib/community/supabase";
import { type CommunityReportTargetType } from "@/lib/community/types";
import { supabase, supabaseAdmin, supabaseConfigError, supabaseServiceConfigError } from "@/lib/supabase";
import { formatAdminError } from "@/lib/supabaseAdmin";

const reportSelectColumns = "id,user_id,target_type,target_id,reason,detail,status,created_at";

function readString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function isTargetType(value: string): value is CommunityReportTargetType {
  return value === "post" || value === "comment" || value === "user";
}

async function requireCommunityApiUser(request: NextRequest) {
  if (!supabase) return { error: supabaseConfigError || "Supabase public client is not configured.", status: 500, userId: "" };
  if (!supabaseAdmin) return { error: supabaseServiceConfigError || "Supabase admin client is not configured.", status: 500, userId: "" };
  const token = (request.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "").trim();
  if (!token) return { error: "请先登录后再举报。", status: 401, userId: "" };
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return { error: error?.message || "登录已过期，请重新登录。", status: 401, userId: "" };
  return { error: "", status: 200, userId: data.user.id };
}

async function syncTargetReportCount(targetType: CommunityReportTargetType, targetId: string) {
  const { count, error: countError } = await supabaseAdmin!
    .from("community_reports")
    .select("id", { count: "exact", head: true })
    .eq("target_type", targetType)
    .eq("target_id", targetId);
  if (countError) throw countError;

  const reportCount = Math.max(0, Number(count ?? 0));
  if (targetType === "post") {
    const patch: Record<string, unknown> = { report_count: reportCount };
    if (reportCount >= 3) patch.status = "reported";
    const { error } = await supabaseAdmin!.from("community_posts").update(patch).eq("id", targetId).neq("status", "hidden").neq("status", "deleted");
    if (error) throw error;
  }
  if (targetType === "comment") {
    const patch: Record<string, unknown> = { report_count: reportCount };
    if (reportCount >= 3) patch.status = "reported";
    const { error } = await supabaseAdmin!.from("community_comments").update(patch).eq("id", targetId).neq("status", "hidden").neq("status", "deleted");
    if (error) throw error;
  }
  return reportCount;
}

export async function POST(request: NextRequest) {
  const user = await requireCommunityApiUser(request);
  if (!user.userId) return NextResponse.json({ error: user.error }, { status: user.status });

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const targetType = readString(body?.targetType);
  const targetId = readString(body?.targetId);
  const reason = readString(body?.reason) || "其他";
  const detail = readString(body?.detail);

  if (!isTargetType(targetType) || !targetId) {
    return NextResponse.json({ error: "举报对象无效。" }, { status: 400 });
  }

  try {
    const { data, error } = await supabaseAdmin!
      .from("community_reports")
      .insert({
        detail,
        reason,
        status: "pending",
        target_id: targetId,
        target_type: targetType,
        user_id: user.userId,
      })
      .select(reportSelectColumns)
      .single();
    if (error) return NextResponse.json({ error: formatAdminError(error) }, { status: 500 });
    const reportCount = await syncTargetReportCount(targetType, targetId);
    return NextResponse.json({ item: mapReportFromDb(data as unknown as CommunityReportRow), reportCount });
  } catch (error) {
    return NextResponse.json({ error: formatAdminError(error) }, { status: 500 });
  }
}
