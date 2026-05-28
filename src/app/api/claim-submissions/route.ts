import { NextResponse, type NextRequest } from "next/server";
import { isHotpepperOnlyCategory } from "@/lib/hotpepperRules";
import { adminErrorResponse, getMissingColumnName, invalidAdminResponse, missingSupabaseAdminResponse, verifyAdminPassword } from "@/lib/supabaseAdmin";
import { supabaseAdmin } from "@/lib/supabase";

type ClaimPayload = {
  address?: string;
  area?: string;
  averageSpend?: string;
  contactTool?: string;
  contactValue?: string;
  features?: string[];
  galleryUrls?: string[];
  hours?: string;
  imageUrl?: string;
  mapUrl?: string;
  ownerName?: string;
  phone?: string;
  shopName?: string;
  smokingRule?: string;
  storeTypes?: string[];
  website?: string;
};

const claimSourceMarker = "来源：店铺上架申请";

function readString(payload: ClaimPayload, key: keyof ClaimPayload) {
  const value = payload[key];
  return typeof value === "string" || typeof value === "number" ? String(value) : "";
}

function readArray(payload: ClaimPayload, key: keyof ClaimPayload) {
  const value = payload[key];
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function toFriendlyShopDraft(payload: ClaimPayload) {
  const address = readString(payload, "address");
  const area = readString(payload, "area");
  const contactTool = readString(payload, "contactTool");
  const contactValue = readString(payload, "contactValue");
  const features = readArray(payload, "features");
  const galleryUrls = readArray(payload, "galleryUrls");
  const storeTypes = readArray(payload, "storeTypes");
  const descriptionParts = [
    claimSourceMarker,
    readString(payload, "averageSpend") ? `人均消费：${readString(payload, "averageSpend")}` : "",
    readString(payload, "hours") ? `营业时间：${readString(payload, "hours")}` : "",
    readString(payload, "mapUrl") ? `Google Maps：${readString(payload, "mapUrl")}` : "",
    features.length ? `标签：${features.join(", ")}` : "",
    readString(payload, "smokingRule") ? `吸烟规则：${readString(payload, "smokingRule")}` : "",
    contactTool || contactValue ? `申请联系人：${contactTool} ${contactValue}`.trim() : "",
    readString(payload, "ownerName") ? `负责人：${readString(payload, "ownerName")}` : "",
    galleryUrls.length ? `图片：\n${galleryUrls.join("\n")}` : "",
  ].filter(Boolean);

  return {
    address,
    area: area || address.split(/[都道府県市区町村\s]/).filter(Boolean).slice(0, 2).join(" ") || "",
    category: storeTypes[0] ?? "service",
    description: descriptionParts.join("\n"),
    image_url: readString(payload, "imageUrl"),
    map_url: readString(payload, "mapUrl"),
    name: readString(payload, "shopName") || "未命名店铺",
    phone: readString(payload, "phone"),
    status: "draft",
    website_url: readString(payload, "website"),
  };
}

async function insertWithSchemaRetry(payload: Record<string, unknown>) {
  const nextPayload = { ...payload };
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const result = await supabaseAdmin!.from("friendly_shops").insert(nextPayload).select("*").single();
    const missingColumn = getMissingColumnName(result.error);
    if (!missingColumn) return result;
    delete nextPayload[missingColumn];
  }
  return { data: null, error: new Error("Too many missing columns while saving claim.") };
}

export async function POST(request: NextRequest) {
  if (!supabaseAdmin) return missingSupabaseAdminResponse();

  try {
    const body = (await request.json()) as ClaimPayload;
    if (readArray(body, "storeTypes").some(isHotpepperOnlyCategory)) {
      return NextResponse.json({ error: "HotPepper 已覆盖的类别不走店铺申请，请使用 HotPepper 结果。" }, { status: 400 });
    }
    const payload = toFriendlyShopDraft(body);
    const { data, error } = await insertWithSchemaRetry(payload);
    if (error) return adminErrorResponse(error);
    return NextResponse.json({ item: data });
  } catch (error) {
    return adminErrorResponse(error);
  }
}

export async function GET(request: NextRequest) {
  if (!verifyAdminPassword(request.headers.get("x-admin-password") ?? "")) return invalidAdminResponse();
  if (!supabaseAdmin) return missingSupabaseAdminResponse();

  try {
    const { data, error } = await supabaseAdmin.from("friendly_shops").select("*").eq("status", "draft").order("created_at", { ascending: true });
    if (error) return adminErrorResponse(error);
    return NextResponse.json({ items: data ?? [] });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
