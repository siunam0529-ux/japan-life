import { NextResponse, type NextRequest } from "next/server";
import { invalidAdminResponse, verifyAdminPassword } from "@/lib/supabaseAdmin";
import { cleanApplicationStatus, cleanJoinStatus, cleanRequestStatus, lifeHelperDbError, mapApplicationFromDb, mapBusinessFromDb, mapPersonalFromDb, mapRequestFromDb, sendLifeHelperAcceptedMessage, supabaseAdmin } from "@/lib/lifeHelper/server";

export async function GET(request: NextRequest) {
  if (!verifyAdminPassword(request.headers.get("x-admin-password") ?? "")) return invalidAdminResponse();
  if (!supabaseAdmin) return NextResponse.json({ error: "Supabase admin is not configured." }, { status: 500 });

  const [requests, applications, business, helpers] = await Promise.all([
    supabaseAdmin.from("life_helper_requests").select("*").order("created_at", { ascending: false }),
    supabaseAdmin.from("life_helper_applications").select("*").order("created_at", { ascending: false }),
    supabaseAdmin.from("life_helper_business_applications").select("*").order("created_at", { ascending: false }),
    supabaseAdmin.from("life_helper_personal_applications").select("*").order("created_at", { ascending: false }),
  ]);
  for (const result of [requests, applications, business, helpers]) {
    if (result.error) return lifeHelperDbError(result.error);
  }
  return NextResponse.json({
    requests: (requests.data ?? []).map((row) => mapRequestFromDb(row)),
    applications: (applications.data ?? []).map((row) => mapApplicationFromDb(row)),
    business: (business.data ?? []).map((row) => mapBusinessFromDb(row)),
    helpers: (helpers.data ?? []).map((row) => mapPersonalFromDb(row)),
  });
}

export async function PATCH(request: NextRequest) {
  if (!verifyAdminPassword(request.headers.get("x-admin-password") ?? "")) return invalidAdminResponse();
  if (!supabaseAdmin) return NextResponse.json({ error: "Supabase admin is not configured." }, { status: 500 });

  const body = (await request.json().catch(() => null)) as { id?: unknown; kind?: unknown; status?: unknown } | null;
  const id = typeof body?.id === "string" ? body.id : "";
  const kind = typeof body?.kind === "string" ? body.kind : "";
  if (!id) return NextResponse.json({ error: "Missing item id." }, { status: 400 });

  if (kind === "request") {
    const status = cleanRequestStatus(body?.status);
    if (!status) return NextResponse.json({ error: "Invalid request status." }, { status: 400 });
    const { data, error } = await supabaseAdmin.from("life_helper_requests").update({ status, updated_at: new Date().toISOString() }).eq("id", id).select("*").single();
    if (error) return lifeHelperDbError(error);
    return NextResponse.json({ item: mapRequestFromDb(data) });
  }
  if (kind === "application") {
    const status = cleanApplicationStatus(body?.status);
    if (!status) return NextResponse.json({ error: "Invalid application status." }, { status: 400 });
    const { data: previous, error: readError } = await supabaseAdmin
      .from("life_helper_applications")
      .select("*, life_helper_requests!inner(author_id,title)")
      .eq("id", id)
      .maybeSingle();
    if (readError) return lifeHelperDbError(readError);
    if (!previous) return NextResponse.json({ error: "Application not found." }, { status: 404 });
    const { data, error } = await supabaseAdmin.from("life_helper_applications").update({ status, updated_at: new Date().toISOString() }).eq("id", id).select("*").single();
    if (error) return lifeHelperDbError(error);
    if (status === "accepted" && previous.status !== "accepted") {
      const helperRequest = previous.life_helper_requests as { author_id?: string; title?: string } | null;
      await sendLifeHelperAcceptedMessage({
        applicantId: String(previous.applicant_id ?? ""),
        applicantMessage: String(previous.message ?? ""),
        ownerId: String(helperRequest?.author_id ?? ""),
        requestTitle: helperRequest?.title ?? "",
      });
    }
    return NextResponse.json({ item: mapApplicationFromDb(data) });
  }
  if (kind === "business") {
    const status = cleanJoinStatus(body?.status);
    if (!status) return NextResponse.json({ error: "Invalid business status." }, { status: 400 });
    const { data, error } = await supabaseAdmin.from("life_helper_business_applications").update({ status, updated_at: new Date().toISOString() }).eq("id", id).select("*").single();
    if (error) return lifeHelperDbError(error);
    return NextResponse.json({ item: mapBusinessFromDb(data) });
  }
  if (kind === "helper") {
    const status = cleanJoinStatus(body?.status);
    if (!status) return NextResponse.json({ error: "Invalid helper status." }, { status: 400 });
    const { data, error } = await supabaseAdmin.from("life_helper_personal_applications").update({ status, updated_at: new Date().toISOString() }).eq("id", id).select("*").single();
    if (error) return lifeHelperDbError(error);
    return NextResponse.json({ item: mapPersonalFromDb(data) });
  }

  return NextResponse.json({ error: "Invalid life helper admin kind." }, { status: 400 });
}
