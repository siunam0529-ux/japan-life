import { NextResponse, type NextRequest } from "next/server";
import { adminErrorResponse, missingSupabaseAdminResponse } from "@/lib/supabaseAdmin";
import { supabaseAdmin } from "@/lib/supabase";
import { mapFeedbackFromDb, mapFeedbackToDb, type UserFeedbackRow } from "@/lib/feedback/types";

type FeedbackBody = {
  message?: unknown;
  page?: unknown;
  pageUrl?: unknown;
  type?: unknown;
  userAgent?: unknown;
};

function text(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

export async function POST(request: NextRequest) {
  if (!supabaseAdmin) return missingSupabaseAdminResponse();

  const body = (await request.json().catch(() => ({}))) as FeedbackBody;
  const message = text(body.message, 1000);
  const page = text(body.page, 120);
  const type = text(body.type, 60) || "其他";
  const pageUrl = text(body.pageUrl, 500);
  const userAgent = text(body.userAgent, 500) || request.headers.get("user-agent")?.slice(0, 500) || "";

  if (!message) {
    return NextResponse.json({ error: "请填写问题说明。" }, { status: 400 });
  }

  try {
    const { data, error } = await supabaseAdmin
      .from("user_feedback")
      .insert(mapFeedbackToDb({ message, page, pageUrl, type, userAgent }))
      .select("*")
      .single<UserFeedbackRow>();

    if (error) return adminErrorResponse(error);
    return NextResponse.json({ item: data ? mapFeedbackFromDb(data) : null });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
