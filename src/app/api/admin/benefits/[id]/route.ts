import { NextResponse, type NextRequest } from "next/server";
import { adminErrorResponse, invalidAdminResponse, missingSupabaseAdminResponse, verifyAdminPassword } from "@/lib/supabaseAdmin";
import { supabaseAdmin } from "@/lib/supabase";
import type { BenefitStatus, BenefitWritePayload } from "@/lib/benefits/types";

type RouteContext = {
  params: Promise<{ id: string }>;
};

const allowedStatuses = new Set<BenefitStatus>(["draft", "published", "archived"]);
const allowedFields = ["title", "summary", "area", "ward", "category", "target_people", "deadline", "apply_url", "translated_title", "translated_summary", "translation_provider", "translation_error", "translated_at", "status"] as const;

export async function PATCH(request: NextRequest, context: RouteContext) {
  if (!verifyAdminPassword(request.headers.get("x-admin-password") ?? "")) return invalidAdminResponse();
  if (!supabaseAdmin) return missingSupabaseAdminResponse();

  const { id } = await context.params;
  const body = (await request.json()) as BenefitWritePayload;
  const payload: Record<string, unknown> = {};
  allowedFields.forEach((field) => {
    if (field in body) payload[field] = body[field] ?? "";
  });
  if (typeof payload.status === "string" && !allowedStatuses.has(payload.status as BenefitStatus)) {
    return NextResponse.json({ error: "Invalid benefit status." }, { status: 400 });
  }

  try {
    const { data, error } = await supabaseAdmin.from("benefits").update(payload).eq("id", id).select("*").single();
    if (error) return adminErrorResponse(error);
    return NextResponse.json({ item: data });
  } catch (error) {
    return adminErrorResponse(error);
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  if (!verifyAdminPassword(request.headers.get("x-admin-password") ?? "")) return invalidAdminResponse();
  if (!supabaseAdmin) return missingSupabaseAdminResponse();

  const { id } = await context.params;
  try {
    const { error } = await supabaseAdmin.from("benefits").delete().eq("id", id);
    if (error) return adminErrorResponse(error);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
