import type { User } from "@supabase/supabase-js";

function parseList(value: string | undefined) {
  return new Set(
    (value || "")
      .split(/[,\n;]/)
      .map((item) => item.trim())
      .filter(Boolean),
  );
}

export function isAdminUser(user: Pick<User, "email" | "id"> | null | undefined) {
  if (!user) return false;
  const adminIds = parseList(process.env.ADMIN_USER_IDS);
  const adminEmails = parseList(process.env.ADMIN_USER_EMAILS?.toLowerCase());
  const email = user.email?.trim().toLowerCase() || "";
  return adminIds.has(user.id) || Boolean(email && adminEmails.has(email));
}
