import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
const isBrowser = typeof window !== "undefined";

function isValidHttpUrl(value: string | undefined) {
  if (!value) return false;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export const supabaseConfigError = !supabaseUrl
  ? "NEXT_PUBLIC_SUPABASE_URL is missing."
  : !isValidHttpUrl(supabaseUrl)
    ? "NEXT_PUBLIC_SUPABASE_URL must be a valid HTTP or HTTPS URL."
    : !supabaseAnonKey
      ? "NEXT_PUBLIC_SUPABASE_ANON_KEY is missing."
      : "";

export const hasSupabaseConfig = !supabaseConfigError;

export const supabase = hasSupabaseConfig
  ? createClient(supabaseUrl as string, supabaseAnonKey as string, {
      auth: {
        autoRefreshToken: isBrowser,
        persistSession: isBrowser,
      },
    })
  : null;

export const supabaseServiceConfigError = !supabaseUrl
  ? "NEXT_PUBLIC_SUPABASE_URL is missing."
  : !isValidHttpUrl(supabaseUrl)
    ? "NEXT_PUBLIC_SUPABASE_URL must be a valid HTTP or HTTPS URL."
    : !supabaseServiceRoleKey
      ? "SUPABASE_SERVICE_ROLE_KEY is missing. Admin write APIs need the Supabase service role key because RLS is enabled."
      : "";

export const hasSupabaseServiceConfig = !supabaseServiceConfigError;

export const supabaseAdmin = hasSupabaseServiceConfig
  ? createClient(supabaseUrl as string, supabaseServiceRoleKey as string, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null;

export type AdminTableName = "recommended_apps" | "promotion_links" | "friendly_shops";

export const adminTableNames: AdminTableName[] = ["recommended_apps", "promotion_links", "friendly_shops"];

export function isAdminTableName(value: string): value is AdminTableName {
  return adminTableNames.includes(value as AdminTableName);
}
