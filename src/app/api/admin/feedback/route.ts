import { NextResponse, type NextRequest } from "next/server";
import {
  adminErrorResponse,
  invalidAdminResponse,
  missingSupabaseAdminResponse,
  verifyAdminPassword,
} from "@/lib/supabaseAdmin";
import { supabaseAdmin } from "@/lib/supabase";
import { mapFeedbackFromDb, type UserFeedbackRow, type UserFeedbackStatus } from "@/lib/feedback/types";

const statuses: UserFeedbackStatus[] = ["ignored", "open", "resolved"];

function getPassword(request: NextRequest) {
  return request.headers.get("x-admin-password") ?? "";
}

function isFeedbackStatus(value: unknown): value is UserFeedbackStatus {
  return typeof value === "string" && statuses.includes(value as UserFeedbackStatus);
}

export async function GET(request: NextRequest) {
  if (!verifyAdminPassword(getPassword(request))) return invalidAdminResponse();
  if (!supabaseAdmin) return missingSupabaseAdminResponse();

  try {
    const { data, error } = await supabaseAdmin
      .from("user_feedback")
      .select("*")
      .order("created_at", { ascending: false })
      .returns<UserFeedbackRow[]>();

    if (error) return adminErrorResponse(error);
    return NextResponse.json({ items: (data ?? []).map(mapFeedbackFromDb) });
  } catch (error) {
    return adminErrorResponse(error);
  }
}

export async function PATCH(request: NextRequest) {
  if (!verifyAdminPassword(getPassword(request))) return invalidAdminResponse();
  if (!supabaseAdmin) return missingSupabaseAdminResponse();

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  if (typeof body.id !== "string" || !isFeedbackStatus(body.status)) {
    return NextResponse.json({ error: "Invalid feedback payload." }, { status: 400 });
  }

  try {
    const { data, error } = await supabaseAdmin
      .from("user_feedback")
      .update({ status: body.status, updated_at: new Date().toISOString() })
      .eq("id", body.id)
      .select("*")
      .single<UserFeedbackRow>();

    if (error) return adminErrorResponse(error);
    return NextResponse.json({ item: data ? mapFeedbackFromDb(data) : null });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
