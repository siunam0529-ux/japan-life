import { NextResponse, type NextRequest } from "next/server";
import { invalidAdminResponse, verifyAdminPassword } from "@/lib/supabaseAdmin";

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as { password?: unknown } | null;
  if (!verifyAdminPassword(body?.password)) return invalidAdminResponse();
  return NextResponse.json({ ok: true });
}
