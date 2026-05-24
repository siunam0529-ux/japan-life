import { NextResponse, type NextRequest } from "next/server";
import { translateBenefitText } from "@/lib/benefits/translate";
import { adminErrorResponse, invalidAdminResponse, missingSupabaseAdminResponse, verifyAdminPassword } from "@/lib/supabaseAdmin";
import { supabaseAdmin } from "@/lib/supabase";
import type { BenefitRecord } from "@/lib/benefits/types";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: NextRequest, context: RouteContext) {
  if (!verifyAdminPassword(request.headers.get("x-admin-password") ?? "")) return invalidAdminResponse();
  if (!supabaseAdmin) return missingSupabaseAdminResponse();

  const { id } = await context.params;
  try {
    const { data, error } = await supabaseAdmin.from("benefits").select("*").eq("id", id).single<BenefitRecord>();
    if (error) return adminErrorResponse(error);
    const translation = await translateBenefitText({ title: data.title, summary: data.summary ?? "" });
    const update = await supabaseAdmin.from("benefits").update(translation).eq("id", id).select("*").single();
    if (update.error) return adminErrorResponse(update.error);
    return NextResponse.json({ item: update.data });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
