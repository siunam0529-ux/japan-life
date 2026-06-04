import { createClient, type SupabaseClient } from "@supabase/supabase-js";

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
  ? createBrowserSupabaseClient()
  : null;

function createBrowserSupabaseClient() {
  const client = createClient(supabaseUrl as string, supabaseAnonKey as string, {
      auth: {
        autoRefreshToken: isBrowser,
        persistSession: isBrowser,
      },
    })
  if (isBrowser) attachInvalidRefreshTokenRecovery(client);
  return client;
}

function attachInvalidRefreshTokenRecovery(client: SupabaseClient) {
  const getSession = client.auth.getSession.bind(client.auth);
  client.auth.getSession = (async (...args: Parameters<typeof getSession>) => {
    try {
      return await getSession(...args);
    } catch (error) {
      if (!isInvalidRefreshTokenError(error)) throw error;
      clearSupabaseAuthStorage();
      return { data: { session: null }, error: null };
    }
  }) as typeof client.auth.getSession;

  const getUser = client.auth.getUser.bind(client.auth);
  client.auth.getUser = (async (...args: Parameters<typeof getUser>) => {
    try {
      return await getUser(...args);
    } catch (error) {
      if (!isInvalidRefreshTokenError(error)) throw error;
      clearSupabaseAuthStorage();
      return { data: { user: null }, error: null };
    }
  }) as typeof client.auth.getUser;
}

function isInvalidRefreshTokenError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return /Invalid Refresh Token|Refresh Token Not Found/i.test(message);
}

function clearSupabaseAuthStorage() {
  clearSupabaseAuthStorageArea(window.localStorage);
  clearSupabaseAuthStorageArea(window.sessionStorage);
}

function clearSupabaseAuthStorageArea(storage: Storage) {
  for (let index = storage.length - 1; index >= 0; index -= 1) {
    const key = storage.key(index);
    if (key?.startsWith("sb-") && key.endsWith("-auth-token")) {
      storage.removeItem(key);
    }
  }
}

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

export type AdminTableName = "recommended_apps" | "friendly_shops";

export const adminTableNames: AdminTableName[] = ["recommended_apps", "friendly_shops"];

export function isAdminTableName(value: string): value is AdminTableName {
  return adminTableNames.includes(value as AdminTableName);
}
