import { NextResponse, type NextRequest } from "next/server";
import { authErrorResponse, lifeHelperDbError, loadLifeHelperProfiles, mapApplicationFromDb, requireLifeHelperUser, supabaseAdmin, text } from "@/lib/lifeHelper/server";

export async function GET(request: NextRequest) {
  const user = await requireLifeHelperUser(request);
  if (user.error) return NextResponse.json({ items: [] });

  const { data: ownedRequests, error: ownedError } = await supabaseAdmin!
    .from("life_helper_requests")
    .select("id")
    .eq("author_id", user.userId);

  if (ownedError) return lifeHelperDbError(ownedError);

  const ownedIds = (ownedRequests ?? []).map((item) => item.id as string);
  const [sentResult, receivedResult] = await Promise.all([
    supabaseAdmin!.from("life_helper_applications").select("*").eq("applicant_id", user.userId).order("created_at", { ascending: false }),
    ownedIds.length
      ? supabaseAdmin!.from("life_helper_applications").select("*").in("request_id", ownedIds).order("created_at", { ascending: false })
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (sentResult.error) return lifeHelperDbError(sentResult.error);
  if (receivedResult.error) return lifeHelperDbError(receivedResult.error);

  type ApplicationRow = Parameters<typeof mapApplicationFromDb>[0];
  const merged = new Map<string, ApplicationRow>();
  [...(sentResult.data ?? []), ...(receivedResult.data ?? [])].forEach((item) => merged.set(String((item as { id: string }).id), item));
  const rows = Array.from(merged.values());
  const profiles = await loadLifeHelperProfiles(rows.map((row) => String(row.applicant_id ?? "")));
  return NextResponse.json({ items: rows.map((row) => mapApplicationFromDb(row, profiles[String(row.applicant_id ?? "")])) });
}

export async function POST(request: NextRequest) {
  const user = await requireLifeHelperUser(request);
  if (user.error) return authErrorResponse(user.error, user.status);

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const requestId = text(body?.requestId, 80);
  const contact = text(body?.contact, 240);
  const message = text(body?.message, 1000);
  const applicantName = text(body?.applicantName, 120, user.userName);
  if (!requestId || !contact || !message) return NextResponse.json({ error: "请填写留言和联系方式。" }, { status: 400 });

  const { data: helperRequest, error: requestError } = await supabaseAdmin!
    .from("life_helper_requests")
    .select("id,author_id,status")
    .eq("id", requestId)
    .maybeSingle();

  if (requestError) return lifeHelperDbError(requestError);
  if (!helperRequest) return NextResponse.json({ error: "需求不存在。" }, { status: 404 });
  if (helperRequest.author_id === user.userId) return NextResponse.json({ error: "不能申请自己发布的需求。" }, { status: 400 });
  if (helperRequest.status !== "open") return NextResponse.json({ error: "这个需求已经关闭。" }, { status: 400 });

  const { data, error } = await supabaseAdmin!
    .from("life_helper_applications")
    .insert({ applicant_id: user.userId, applicant_name: applicantName, contact, message, request_id: requestId, status: "sent" })
    .select("*")
    .single();

  if (error) return lifeHelperDbError(error);
  const profiles = await loadLifeHelperProfiles([user.userId]);
  return NextResponse.json({ item: mapApplicationFromDb(data, profiles[user.userId]) });
}
