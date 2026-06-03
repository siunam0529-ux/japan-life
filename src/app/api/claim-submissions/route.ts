import { NextResponse, type NextRequest } from "next/server";
import { isHotpepperOnlyCategory } from "@/lib/hotpepperRules";
import { normalizeHotpepperUrl } from "@/lib/hotpepper/import";
import { adminErrorResponse, getMissingColumnName, invalidAdminResponse, missingSupabaseAdminResponse, verifyAdminPassword } from "@/lib/supabaseAdmin";
import { supabaseAdmin } from "@/lib/supabase";

type ClaimPayload = {
  address?: string;
  area?: string;
  averageSpend?: string;
  contactTool?: string;
  contactValue?: string;
  descriptionZh?: string;
  features?: string[];
  galleryUrls?: string[];
  hotpepperUrl?: string;
  hours?: string;
  imageUrl?: string;
  mapUrl?: string;
  notes?: string;
  ownerName?: string;
  phone?: string;
  shopName?: string;
  smokingRule?: string;
  sourceType?: string;
  storeTypes?: string[];
  website?: string;
};

const claimSourceMarker = "Source: shop listing claim";

function readString(payload: ClaimPayload, key: keyof ClaimPayload) {
  const value = payload[key];
  return typeof value === "string" || typeof value === "number" ? String(value).trim() : "";
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
    readString(payload, "averageSpend") ? `Average spend: ${readString(payload, "averageSpend")}` : "",
    readString(payload, "hours") ? `Hours: ${readString(payload, "hours")}` : "",
    readString(payload, "mapUrl") ? `Google Maps: ${readString(payload, "mapUrl")}` : "",
    features.length ? `Tags: ${features.join(", ")}` : "",
    readString(payload, "smokingRule") ? `Smoking rule: ${readString(payload, "smokingRule")}` : "",
    contactTool || contactValue ? `Applicant contact: ${contactTool} ${contactValue}`.trim() : "",
    readString(payload, "ownerName") ? `Owner: ${readString(payload, "ownerName")}` : "",
    galleryUrls.length ? `Images:\n${galleryUrls.join("\n")}` : "",
  ].filter(Boolean);

  return {
    address,
    area: area || address.split(/[都道府県市区町村\s]/).filter(Boolean).slice(0, 2).join(" ") || "",
    category: storeTypes[0] ?? "service",
    contact_type: contactTool,
    contact_value: contactValue,
    description: descriptionParts.join("\n"),
    image_url: readString(payload, "imageUrl"),
    map_url: readString(payload, "mapUrl"),
    name: readString(payload, "shopName") || "未命名店铺",
    phone: readString(payload, "phone"),
    review_status: "pending",
    source_type: "japan_life",
    status: "draft",
    website_url: readString(payload, "website"),
  };
}

function toHotpepperBindingDraft(payload: ClaimPayload) {
  const contactType = readString(payload, "contactTool");
  const contactValue = readString(payload, "contactValue");
  const hotpepperUrl = normalizeHotpepperUrl(readString(payload, "hotpepperUrl"));
  if (!contactType || !contactValue || !hotpepperUrl) {
    return { error: "Missing contact info or valid HotPepper URL.", payload: null };
  }

  const name = readString(payload, "shopName");
  const descriptionZh = readString(payload, "descriptionZh");
  const notes = readString(payload, "notes");

  return {
    error: "",
    payload: {
      admin_note: ["HotPepper binding claim", notes ? `Notes: ${notes}` : ""].filter(Boolean).join("\n"),
      category: "restaurant",
      contact_type: contactType,
      contact_value: contactValue,
      description: "Source: HotPepper binding claim",
      description_zh: descriptionZh,
      hotpepper_url: hotpepperUrl,
      is_verified: false,
      name: name || "HotPepper binding claim",
      review_status: "pending",
      source_type: "hotpepper",
      status: "draft",
      website_url: hotpepperUrl,
    },
  };
}

async function insertWithSchemaRetry(payload: Record<string, unknown>) {
  const nextPayload = { ...payload };
  for (let attempt = 0; attempt < 12; attempt += 1) {
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
    let payload: Record<string, unknown>;

    if (readString(body, "sourceType") === "hotpepper") {
      const result = toHotpepperBindingDraft(body);
      if (result.error || !result.payload) return NextResponse.json({ error: result.error }, { status: 400 });
      payload = result.payload;
    } else {
      if (readArray(body, "storeTypes").some(isHotpepperOnlyCategory)) {
        return NextResponse.json({ error: "HotPepper covered categories should use the HotPepper binding or import flow." }, { status: 400 });
      }
      payload = toFriendlyShopDraft(body);
    }

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
