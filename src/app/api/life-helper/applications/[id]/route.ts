import { NextResponse, type NextRequest } from "next/server";
import { authErrorResponse, cleanApplicationStatus, lifeHelperDbError, loadLifeHelperProfiles, mapApplicationFromDb, requireLifeHelperUser, sendLifeHelperAcceptedMessage, supabaseAdmin } from "@/lib/lifeHelper/server";

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const user = await requireLifeHelperUser(request);
  if (user.error) return authErrorResponse(user.error, user.status);

  const { id } = await context.params;
  const body = (await request.json().catch(() => null)) as { status?: unknown } | null;
  const status = cleanApplicationStatus(body?.status);
  if (!status || status === "sent") return NextResponse.json({ error: "Invalid application status." }, { status: 400 });

  const { data: application, error: readError } = await supabaseAdmin!
    .from("life_helper_applications")
    .select("*, life_helper_requests!inner(author_id,title)")
    .eq("id", id)
    .maybeSingle();

  if (readError) return lifeHelperDbError(readError);
  if (!application) return NextResponse.json({ error: "申请不存在。" }, { status: 404 });

  const helperRequest = application.life_helper_requests as { author_id?: string; title?: string } | null;
  const ownerId = helperRequest?.author_id;
  if (ownerId !== user.userId) return NextResponse.json({ error: "只有发布者可以处理申请。" }, { status: 403 });

  const shouldSendPrivateMessage = status === "accepted" && application.status !== "accepted";
  const { data, error } = await supabaseAdmin!
    .from("life_helper_applications")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("*")
    .single();

  if (error) return lifeHelperDbError(error);

  if (shouldSendPrivateMessage) {
    await sendLifeHelperAcceptedMessage({
      applicantId: String(application.applicant_id ?? ""),
      applicantMessage: String(application.message ?? ""),
      ownerId: user.userId,
      requestTitle: helperRequest?.title ?? "",
    });
  }

  const profiles = await loadLifeHelperProfiles([String(data.applicant_id ?? "")]);
  return NextResponse.json({ item: mapApplicationFromDb(data, profiles[String(data.applicant_id ?? "")]) });
}
