import { NextResponse } from "next/server";
import { adminErrorResponse, missingSupabaseResponse } from "@/lib/supabaseAdmin";
import { supabase } from "@/lib/supabase";

export async function GET() {
  if (!supabase) return missingSupabaseResponse();

  try {
    const { data, error } = await supabase.from("benefits").select("*").eq("status", "published").order("created_at", { ascending: false });
    if (error) return adminErrorResponse(error);
    return NextResponse.json({ items: data ?? [] });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
