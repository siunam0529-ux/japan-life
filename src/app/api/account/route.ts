import { NextResponse, type NextRequest } from "next/server";
import { supabaseAdmin, supabaseServiceConfigError } from "@/lib/supabase";

async function getAuthenticatedUserId(request: NextRequest) {
  const authorization = request.headers.get("authorization") ?? "";
  const token = authorization.replace(/^Bearer\s+/i, "").trim();
  if (!token) return { error: "AUTH_REQUIRED", status: 401, userId: "" };
  if (!supabaseAdmin) return { error: supabaseServiceConfigError || "Supabase admin is not configured.", status: 500, userId: "" };

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) return { error: error?.message || "AUTH_EXPIRED", status: 401, userId: "" };

  return { error: "", status: 200, userId: data.user.id };
}

export async function DELETE(request: NextRequest) {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: supabaseServiceConfigError || "Supabase admin is not configured." }, { status: 500 });
  }

  const user = await getAuthenticatedUserId(request);
  if (user.error) return NextResponse.json({ error: user.error }, { status: user.status });

  const { error: appDataError } = await supabaseAdmin.from("user_app_data").delete().eq("user_id", user.userId);
  if (appDataError && appDataError.code !== "42P01") {
    return NextResponse.json({ error: appDataError.message }, { status: 500 });
  }

  const { error } = await supabaseAdmin.auth.admin.deleteUser(user.userId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
