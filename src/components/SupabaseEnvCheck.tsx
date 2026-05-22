"use client";

import { useEffect } from "react";

export function SupabaseEnvCheck() {
  useEffect(() => {
    console.log("NEXT_PUBLIC_SUPABASE_URL exists:", Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL));
  }, []);

  return null;
}
