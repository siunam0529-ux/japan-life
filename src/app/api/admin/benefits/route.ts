import { NextResponse, type NextRequest } from "next/server";
import { adminErrorResponse, invalidAdminResponse, missingSupabaseAdminResponse, verifyAdminPassword } from "@/lib/supabaseAdmin";
import { supabaseAdmin } from "@/lib/supabase";
import type { BenefitStatus } from "@/lib/benefits/types";

const statuses = new Set<BenefitStatus>(["draft", "published", "archived"]);

export async function GET(request: NextRequest) {
  if (!verifyAdminPassword(request.headers.get("x-admin-password") ?? "")) return invalidAdminResponse();
  if (!supabaseAdmin) return missingSupabaseAdminResponse();

  try {
    const status = request.nextUrl.searchParams.get("status");
    let query = supabaseAdmin.from("benefits").select("*").order("created_at", { ascending: false });
    if (status && statuses.has(status as BenefitStatus)) {
      query = query.eq("status", status);
    }
    const { data, error } = await query;
    if (error) return adminErrorResponse(error);
    return NextResponse.json({ items: data ?? [] });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
