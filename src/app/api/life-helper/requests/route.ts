import { NextResponse, type NextRequest } from "next/server";
import { authErrorResponse, cleanRequestPayload, lifeHelperDbError, loadLifeHelperProfiles, mapRequestFromDb, requireLifeHelperUser, supabaseAdmin } from "@/lib/lifeHelper/server";

export async function GET() {
  if (!supabaseAdmin) return NextResponse.json({ error: "Supabase admin is not configured." }, { status: 500 });
  const { data, error } = await supabaseAdmin.from("life_helper_requests").select("*").order("created_at", { ascending: false });
  if (error) return lifeHelperDbError(error);
  const rows = data ?? [];
  const profiles = await loadLifeHelperProfiles(rows.map((row) => String(row.author_id ?? "")));
  return NextResponse.json({ items: rows.map((row) => mapRequestFromDb(row, profiles[String(row.author_id ?? "")])) });
}

export async function POST(request: NextRequest) {
  const user = await requireLifeHelperUser(request);
  if (user.error) return authErrorResponse(user.error, user.status);

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: "Invalid request payload." }, { status: 400 });
  const payload = cleanRequestPayload(body, user.userId, user.userName);
  if (!payload) return NextResponse.json({ error: "请填写标题、地区、时间和有效分类。" }, { status: 400 });

  const { data, error } = await supabaseAdmin!.from("life_helper_requests").insert(payload).select("*").single();
  if (error) return lifeHelperDbError(error);
  const profiles = await loadLifeHelperProfiles([user.userId]);
  return NextResponse.json({ item: mapRequestFromDb(data, profiles[user.userId]) });
}
