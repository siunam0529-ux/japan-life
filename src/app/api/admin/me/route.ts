import { NextResponse, type NextRequest } from "next/server";
import { isAdminUser } from "@/lib/adminAccess";
import { supabaseAdmin, supabaseServiceConfigError } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const authorization = request.headers.get("authorization") ?? "";
  const token = authorization.replace(/^Bearer\s+/i, "").trim();
  if (!token) return NextResponse.json({ isAdmin: false });
  if (!supabaseAdmin) {
    return NextResponse.json({ error: supabaseServiceConfigError || "Supabase admin is not configured.", isAdmin: false }, { status: 500 });
  }

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) return NextResponse.json({ isAdmin: false });

  return NextResponse.json({ isAdmin: isAdminUser(data.user) });
}
