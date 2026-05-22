import { NextRequest, NextResponse } from "next/server";
import { supabase, supabaseAdmin, supabaseConfigError, supabaseServiceConfigError } from "@/lib/supabase";

const tableName = "user_app_data";

type UserAppDataPayload = {
  data?: unknown;
};

async function getUser(request: NextRequest) {
  if (!supabase) {
    return { error: supabaseConfigError || "Supabase is not configured.", status: 500, userId: "" };
  }

  const authorization = request.headers.get("authorization") ?? "";
  const token = authorization.replace(/^Bearer\s+/i, "").trim();
  if (!token) return { error: "AUTH_REQUIRED", status: 401, userId: "" };

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return { error: error?.message || "AUTH_EXPIRED", status: 401, userId: "" };

  return { userId: data.user.id, error: "", status: 200 };
}

export async function GET(request: NextRequest) {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: supabaseServiceConfigError }, { status: 500 });
  }

  const user = await getUser(request);
  if (user.error) return NextResponse.json({ error: user.error }, { status: user.status });

  const { data, error } = await supabaseAdmin
    .from(tableName)
    .select("data, updated_at")
    .eq("user_id", user.userId)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message, code: error.code, hint: getTableHint(error.message) }, { status: 500 });
  }

  return NextResponse.json({ data: data?.data ?? null, updatedAt: data?.updated_at ?? null });
}

export async function PUT(request: NextRequest) {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: supabaseServiceConfigError }, { status: 500 });
  }

  const user = await getUser(request);
  if (user.error) return NextResponse.json({ error: user.error }, { status: user.status });

  let body: UserAppDataPayload;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "INVALID_JSON" }, { status: 400 });
  }

  if (!body || typeof body !== "object" || !("data" in body)) {
    return NextResponse.json({ error: "DATA_REQUIRED" }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from(tableName)
    .upsert({
      user_id: user.userId,
      data: body.data,
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id" })
    .select("updated_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message, code: error.code, hint: getTableHint(error.message) }, { status: 500 });
  }

  return NextResponse.json({ ok: true, updatedAt: data.updated_at });
}

function getTableHint(message: string) {
  if (!/user_app_data/i.test(message)) return undefined;
  return [
    "Create this table in Supabase SQL Editor:",
    "create table if not exists public.user_app_data (",
    "  user_id uuid primary key references auth.users(id) on delete cascade,",
    "  data jsonb not null default '{}'::jsonb,",
    "  updated_at timestamptz not null default now()",
    ");",
  ].join("\n");
}
