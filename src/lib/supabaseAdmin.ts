import { NextResponse } from "next/server";
import { isAdminTableName, supabase, supabaseConfigError, supabaseServiceConfigError, type AdminTableName } from "@/lib/supabase";

export type AdminRecord = Record<string, unknown> & {
  id?: string | number;
  status?: string;
  is_pinned?: boolean;
  created_at?: string;
  updated_at?: string;
};

export function verifyAdminPassword(value: unknown) {
  const password = process.env.ADMIN_PASSWORD;
  return Boolean(password && typeof value === "string" && value === password);
}

export function missingSupabaseResponse() {
  return NextResponse.json({ error: supabaseConfigError || "Supabase environment variables are not configured." }, { status: 500 });
}

export function missingSupabaseAdminResponse() {
  return NextResponse.json({ error: supabaseServiceConfigError || "Supabase admin environment variables are not configured." }, { status: 500 });
}

export function invalidAdminResponse() {
  return NextResponse.json({ error: "Invalid admin password." }, { status: 401 });
}

export function invalidTableResponse() {
  return NextResponse.json({ error: "Invalid admin table." }, { status: 400 });
}

export function formatAdminError(error: unknown) {
  if (!error) return "Unknown error.";
  if (error instanceof Error) {
    if (error.message === "fetch failed") {
      return [
        "Supabase request failed: fetch failed.",
        "Please check NEXT_PUBLIC_SUPABASE_URL. Supabase project URLs usually look like https://<project-ref>.supabase.co.",
        "If the URL is correct, check DNS/network access from this environment.",
      ].join(" ");
    }
    return `${error.name}: ${error.message}`;
  }

  if (typeof error === "object") {
    const record = error as Record<string, unknown>;
    const parts = [
      typeof record.message === "string" ? record.message : null,
      typeof record.code === "string" ? `code: ${record.code}` : null,
      typeof record.details === "string" ? `details: ${record.details}` : null,
      typeof record.hint === "string" ? `hint: ${record.hint}` : null,
    ].filter(Boolean);
    return parts.length > 0 ? parts.join(" / ") : JSON.stringify(record);
  }

  return String(error);
}

export function adminErrorResponse(error: unknown, status = 500) {
  return NextResponse.json({ error: formatAdminError(error) }, { status });
}

export function cleanRecordForWrite(input: Record<string, unknown>) {
  const next: Record<string, unknown> = { ...input };
  delete next.created_at;
  delete next.updated_at;
  return next;
}

export function getMissingColumnName(error: unknown) {
  if (!error || typeof error !== "object") return "";
  const record = error as Record<string, unknown>;
  if (record.code !== "PGRST204" || typeof record.message !== "string") return "";
  const match = record.message.match(/'([^']+)' column/);
  return match?.[1] ?? "";
}

export async function listPublished(table: AdminTableName) {
  if (!supabase) return { data: null, error: new Error("Supabase is not configured.") };
  const result = await supabase.from(table).select("*").eq("status", "published").order("is_pinned", { ascending: false }).order("created_at", { ascending: true });
  if (!result.error || getMissingColumnName(result.error) !== "is_pinned") return result;
  return supabase.from(table).select("*").eq("status", "published").order("created_at", { ascending: true });
}

export function parseTableName(table: string) {
  return isAdminTableName(table) ? table : null;
}
