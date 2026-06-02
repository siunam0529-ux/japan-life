import { NextResponse, type NextRequest } from "next/server";
import { authErrorResponse, cleanRequestStatus, lifeHelperDbError, mapRequestFromDb, requireLifeHelperUser, supabaseAdmin } from "@/lib/lifeHelper/server";

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const user = await requireLifeHelperUser(request);
  if (user.error) return authErrorResponse(user.error, user.status);

  const { id } = await context.params;
  const body = (await request.json().catch(() => null)) as { status?: unknown } | null;
  const status = cleanRequestStatus(body?.status);
  if (!status) return NextResponse.json({ error: "Invalid request status." }, { status: 400 });

  const { data, error } = await supabaseAdmin!
    .from("life_helper_requests")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("author_id", user.userId)
    .select("*")
    .single();

  if (error) return lifeHelperDbError(error);
  return NextResponse.json({ item: mapRequestFromDb(data) });
}
