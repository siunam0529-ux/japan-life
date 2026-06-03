import { NextResponse } from "next/server";
import { lifeHelperDbError, loadLifeHelperProfiles, mapBusinessFromDb, mapPersonalFromDb, supabaseAdmin } from "@/lib/lifeHelper/server";

export async function GET() {
  if (!supabaseAdmin) return NextResponse.json({ error: "Supabase admin is not configured." }, { status: 500 });

  const [businessResult, personalResult] = await Promise.all([
    supabaseAdmin.from("life_helper_business_applications").select("*").eq("status", "approved").order("created_at", { ascending: false }),
    supabaseAdmin.from("life_helper_personal_applications").select("*").eq("status", "approved").order("created_at", { ascending: false }),
  ]);

  if (businessResult.error) return lifeHelperDbError(businessResult.error);
  if (personalResult.error) return lifeHelperDbError(personalResult.error);

  const businessRows = businessResult.data ?? [];
  const personalRows = personalResult.data ?? [];
  const profiles = await loadLifeHelperProfiles([...businessRows, ...personalRows].map((row) => String(row.user_id ?? "")));

  const business = businessRows.map((row) => mapBusinessFromDb(row, profiles[String(row.user_id ?? "")])).map((item) => ({
    id: item.id,
    area: item.area,
    avatar: item.userAvatar,
    contact: item.lineId || item.email || item.phone || item.website || "联系前请先确认服务范围",
    contactMethods: [
      item.lineId ? { id: `${item.id}-line`, type: "LINE", value: item.lineId } : null,
      item.email ? { id: `${item.id}-email`, type: "邮箱", value: item.email } : null,
      item.phone ? { id: `${item.id}-phone`, type: "电话", value: item.phone } : null,
      item.website ? { id: `${item.id}-website`, type: "其他", value: item.website } : null,
    ].filter((method): method is { id: string; type: "LINE" | "邮箱" | "电话" | "其他"; value: string } => Boolean(method)),
    description: item.description,
    kind: "business" as const,
    languages: item.languages,
    name: item.businessName,
    price: item.priceInfo || "价格需确认",
    serviceLanguageTag: item.serviceLanguageTag,
    services: [item.category],
    userId: item.userId,
    userProfileId: item.userProfileId,
  }));

  const helpers = personalRows.map((row) => mapPersonalFromDb(row, profiles[String(row.user_id ?? "")])).map((item) => ({
    id: item.id,
    area: item.area,
    avatar: item.userAvatar,
    contact: item.contact,
    contactMethods: item.contactMethods,
    description: item.selfIntro,
    kind: "helper" as const,
    languages: item.languages,
    name: item.displayName,
    price: item.priceExpectation || "报酬可商量",
    serviceLanguageTag: item.serviceLanguageTag,
    services: item.services,
    userId: item.userId,
    userProfileId: item.userProfileId,
  }));

  return NextResponse.json({ items: [...business, ...helpers] });
}
