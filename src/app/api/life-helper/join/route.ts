import { NextResponse, type NextRequest } from "next/server";
import { authErrorResponse, cleanBusinessPayload, cleanPersonalPayload, lifeHelperDbError, loadLifeHelperProfiles, mapBusinessFromDb, mapPersonalFromDb, requireLifeHelperUser, supabaseAdmin } from "@/lib/lifeHelper/server";

export async function GET(request: NextRequest) {
  const user = await requireLifeHelperUser(request);
  if (user.error) return NextResponse.json({ business: [], helpers: [] });

  const [businessResult, personalResult] = await Promise.all([
    supabaseAdmin!.from("life_helper_business_applications").select("*").eq("user_id", user.userId).order("created_at", { ascending: false }),
    supabaseAdmin!.from("life_helper_personal_applications").select("*").eq("user_id", user.userId).order("created_at", { ascending: false }),
  ]);

  if (businessResult.error) return lifeHelperDbError(businessResult.error);
  if (personalResult.error) return lifeHelperDbError(personalResult.error);
  const profiles = await loadLifeHelperProfiles([user.userId]);
  return NextResponse.json({
    business: (businessResult.data ?? []).map((row) => mapBusinessFromDb(row, profiles[String(row.user_id ?? "")])),
    helpers: (personalResult.data ?? []).map((row) => mapPersonalFromDb(row, profiles[String(row.user_id ?? "")])),
  });
}

export async function POST(request: NextRequest) {
  const user = await requireLifeHelperUser(request);
  if (user.error) return authErrorResponse(user.error, user.status);

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: "Invalid join payload." }, { status: 400 });

  if (body.type === "business") {
    const payload = cleanBusinessPayload(body, user.userId);
    if (!payload) return NextResponse.json({ error: "请完整填写商家名称、地区、联系人、服务说明和至少一种联系方式。" }, { status: 400 });
    const { data, error } = await supabaseAdmin!.from("life_helper_business_applications").insert(payload).select("*").single();
    if (error) return lifeHelperDbError(error);
    const profiles = await loadLifeHelperProfiles([user.userId]);
    return NextResponse.json({ item: mapBusinessFromDb(data, profiles[user.userId]) });
  }

  if (body.type === "helper") {
    const payload = cleanPersonalPayload(body, user.userId);
    if (!payload) return NextResponse.json({ error: "请完整填写昵称、服务、地区、联系方式和自我介绍。" }, { status: 400 });
    const { data, error } = await supabaseAdmin!.from("life_helper_personal_applications").insert(payload).select("*").single();
    if (error) return lifeHelperDbError(error);
    const profiles = await loadLifeHelperProfiles([user.userId]);
    return NextResponse.json({ item: mapPersonalFromDb(data, profiles[user.userId]) });
  }

  return NextResponse.json({ error: "Invalid join type." }, { status: 400 });
}
