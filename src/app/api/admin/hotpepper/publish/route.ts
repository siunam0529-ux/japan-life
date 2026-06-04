import { NextResponse, type NextRequest } from "next/server";
import { adminErrorResponse, invalidAdminResponse, missingSupabaseAdminResponse, verifyAdminPassword } from "@/lib/supabaseAdmin";
import { supabaseAdmin } from "@/lib/supabase";

function getPassword(request: NextRequest) {
  return request.headers.get("x-admin-password") ?? "";
}

export async function POST(request: NextRequest) {
  if (!verifyAdminPassword(getPassword(request))) return invalidAdminResponse();
  if (!supabaseAdmin) return missingSupabaseAdminResponse();

  try {
    const { data, error } = await supabaseAdmin
      .from("friendly_shops")
      .update({
        is_verified: true,
        review_status: "approved",
        status: "published",
      })
      .eq("source_type", "hotpepper")
      .select("id");

    if (error) return adminErrorResponse(error);

    return NextResponse.json({
      published: data?.length ?? 0,
      message: `Published ${data?.length ?? 0} HotPepper shops.`,
    });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
