import { NextResponse, type NextRequest } from "next/server";
import { isHotpepperOnlyShopRecord } from "@/lib/hotpepperRules";
import {
  adminErrorResponse,
  cleanRecordForWrite,
  getMissingColumnName,
  invalidAdminResponse,
  invalidTableResponse,
  missingSupabaseAdminResponse,
  missingSupabaseResponse,
  parseTableName,
  verifyAdminPassword,
} from "@/lib/supabaseAdmin";
import { supabase, supabaseAdmin } from "@/lib/supabase";

type RouteContext = {
  params: Promise<{ table: string }>;
};

function getPassword(request: NextRequest) {
  return request.headers.get("x-admin-password") ?? "";
}

async function insertRecord(table: string, payload: Record<string, unknown>) {
  const query = table === "recommended_apps" && typeof payload.id === "string"
    ? supabaseAdmin?.from(table).upsert(payload, { onConflict: "id" }).select("*").single()
    : supabaseAdmin?.from(table).insert(payload).select("*").single();
  return query;
}

async function insertWithSchemaRetry(table: string, payload: Record<string, unknown>) {
  const nextPayload = { ...payload };
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const query = await insertRecord(table, nextPayload);
    if (!query) return { data: null, error: new Error("Supabase is not configured.") };
    const result = await query;
    const missingColumn = getMissingColumnName(result.error);
    if (!missingColumn) return result;
    delete nextPayload[missingColumn];
  }
  return { data: null, error: new Error("Too many missing columns while saving record.") };
}

async function updateWithSchemaRetry(table: string, id: string | number, payload: Record<string, unknown>) {
  const nextPayload = { ...payload };
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const result = await supabaseAdmin!.from(table).update(nextPayload).eq("id", id).select("*").single();
    const missingColumn = getMissingColumnName(result.error);
    if (!missingColumn) return result;
    delete nextPayload[missingColumn];
  }
  return { data: null, error: new Error("Too many missing columns while updating record.") };
}

export async function GET(request: NextRequest, context: RouteContext) {
  if (!verifyAdminPassword(getPassword(request))) return invalidAdminResponse();
  if (!supabaseAdmin && !supabase) return missingSupabaseResponse();

  const { table: rawTable } = await context.params;
  const table = parseTableName(rawTable);
  if (!table) return invalidTableResponse();

  try {
    const client = supabaseAdmin ?? supabase!;
    const { data, error } = await client.from(table).select("*").order("is_pinned", { ascending: false }).order("created_at", { ascending: true });
    if (error) return adminErrorResponse(error);
    return NextResponse.json({ items: data ?? [] });
  } catch (error) {
    return adminErrorResponse(error);
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  if (!verifyAdminPassword(getPassword(request))) return invalidAdminResponse();
  if (!supabaseAdmin) return missingSupabaseAdminResponse();

  const { table: rawTable } = await context.params;
  const table = parseTableName(rawTable);
  if (!table) return invalidTableResponse();

  const body = (await request.json()) as Record<string, unknown>;
  const payload = cleanRecordForWrite(body);
  if (table === "friendly_shops" && isHotpepperOnlyShopRecord(payload)) {
    return NextResponse.json({ error: "HotPepper 已覆盖的类别不能手工上架，请使用 HotPepper 数据源。" }, { status: 400 });
  }
  try {
    const { data, error } = await insertWithSchemaRetry(table, payload);
    if (error) return adminErrorResponse(error);
    return NextResponse.json({ item: data });
  } catch (error) {
    return adminErrorResponse(error);
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  if (!verifyAdminPassword(getPassword(request))) return invalidAdminResponse();
  if (!supabaseAdmin) return missingSupabaseAdminResponse();

  const { table: rawTable } = await context.params;
  const table = parseTableName(rawTable);
  if (!table) return invalidTableResponse();

  const body = (await request.json()) as Record<string, unknown>;
  const id = body.id;
  if (typeof id !== "string" && typeof id !== "number") {
    return NextResponse.json({ error: "Missing record id." }, { status: 400 });
  }

  const payload = cleanRecordForWrite(body);
  delete payload.id;
  if (table === "friendly_shops" && isHotpepperOnlyShopRecord(payload)) {
    return NextResponse.json({ error: "HotPepper 已覆盖的类别不能手工上架，请使用 HotPepper 数据源。" }, { status: 400 });
  }

  try {
    const { data, error } = await updateWithSchemaRetry(table, id, payload);
    if (error) return adminErrorResponse(error);
    return NextResponse.json({ item: data });
  } catch (error) {
    return adminErrorResponse(error);
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  if (!verifyAdminPassword(getPassword(request))) return invalidAdminResponse();
  if (!supabaseAdmin) return missingSupabaseAdminResponse();

  const { table: rawTable } = await context.params;
  const table = parseTableName(rawTable);
  if (!table) return invalidTableResponse();

  const { id } = (await request.json()) as { id?: string | number };
  if (typeof id !== "string" && typeof id !== "number") {
    return NextResponse.json({ error: "Missing record id." }, { status: 400 });
  }

  try {
    const { error } = await supabaseAdmin.from(table).delete().eq("id", id);
    if (error) return adminErrorResponse(error);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
