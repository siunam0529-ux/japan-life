import { NextResponse, type NextRequest } from "next/server";
import { supabase, supabaseAdmin, supabaseConfigError, supabaseServiceConfigError } from "@/lib/supabase";
import { adminErrorResponse, missingSupabaseAdminResponse } from "@/lib/supabaseAdmin";
import { businessServiceCategories, encodeLifeHelperContactMethods, helperLanguageOptions, lifeHelperServiceLanguageTags, parseLifeHelperContactMethods, personalServiceOptions, type LifeHelperBusinessApplication, type LifeHelperBusinessCategory, type LifeHelperContactMethod, type LifeHelperContactType, type LifeHelperJoinStatus, type LifeHelperLanguage, type LifeHelperPersonalApplication, type LifeHelperPersonalService, type LifeHelperServiceLanguageTag } from "./join";
import { lifeHelperCategories, type LifeHelperApplication, type LifeHelperApplicationStatus, type LifeHelperCategory, type LifeHelperContactVisibility, type LifeHelperRequest, type LifeHelperRequestStatus } from "./types";

type RequestRow = {
  id: string;
  title: string;
  category: LifeHelperCategory;
  area: string;
  budget: string;
  preferred_time: string;
  description: string;
  contact: string;
  contact_visibility: LifeHelperContactVisibility;
  author_id: string;
  author_name: string;
  status: LifeHelperRequestStatus;
  source: "user";
  created_at: string;
};

type ApplicationRow = {
  id: string;
  request_id: string;
  applicant_id: string;
  applicant_name: string;
  message: string;
  contact: string;
  status: LifeHelperApplicationStatus;
  created_at: string;
};

type BusinessRow = {
  id: string;
  user_id: string;
  business_name: string;
  category: LifeHelperBusinessCategory;
  area: string;
  contact_name: string;
  phone: string;
  email: string;
  line_id: string;
  website: string;
  description: string;
  price_info: string;
  business_hours: string;
  languages: LifeHelperLanguage[];
  service_language_tag: LifeHelperServiceLanguageTag;
  notes: string;
  status: LifeHelperJoinStatus;
  created_at: string;
};

type PersonalRow = {
  id: string;
  user_id: string;
  display_name: string;
  services: LifeHelperPersonalService[];
  area: string;
  available_time: string;
  contact: string;
  contact_type: LifeHelperContactType;
  languages: LifeHelperLanguage[];
  service_language_tag: LifeHelperServiceLanguageTag;
  experience: string;
  price_expectation: string;
  self_intro: string;
  notes: string;
  status: LifeHelperJoinStatus;
  created_at: string;
};

export type LifeHelperProfile = {
  avatar: string;
  displayName: string;
  profileId: string;
  userId: string;
};

type LifeHelperProfileRow = {
  avatar: string | null;
  display_name: string | null;
  id: string;
  public_id?: string | null;
  user_id?: string | null;
};

type LifeHelperConversationRow = {
  id: string;
  participant_a_id: string;
  participant_b_id: string;
};

const categoryIds = new Set(lifeHelperCategories.map((item) => item.id));
const visibilityValues = new Set<LifeHelperContactVisibility>(["after_apply", "public", "private"]);
const requestStatusValues = new Set<LifeHelperRequestStatus>(["open", "closed"]);
const applicationStatusValues = new Set<LifeHelperApplicationStatus>(["sent", "accepted", "declined"]);
const joinStatusValues = new Set<LifeHelperJoinStatus>(["pending", "approved", "rejected"]);
const businessCategoryValues = new Set<string>(businessServiceCategories);
const personalServiceValues = new Set<string>(personalServiceOptions);
const languageValues = new Set<string>(helperLanguageOptions);
const serviceLanguageValues = new Set<string>(lifeHelperServiceLanguageTags);
const contactTypeValues = new Set<LifeHelperContactType>(["LINE", "邮箱", "电话", "其他"]);

export function text(value: unknown, maxLength: number, fallback = "") {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : fallback;
}

export function textArray<T extends string>(value: unknown, validValues: Set<string>, fallback: T[] = []) {
  return Array.isArray(value) ? value.filter((item): item is T => typeof item === "string" && validValues.has(item)) : fallback;
}

export function formatCreatedAt(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("zh-CN", { day: "2-digit", hour: "2-digit", minute: "2-digit", month: "2-digit" }).format(date);
}

export async function requireLifeHelperAdmin() {
  if (!supabaseAdmin) return { error: supabaseServiceConfigError, status: 500, userId: "" };
  return { error: "", status: 200, userId: "" };
}

export async function requireLifeHelperUser(request: NextRequest) {
  if (!supabase) return { error: supabaseConfigError || "Supabase is not configured.", status: 500, userId: "", userName: "" };
  if (!supabaseAdmin) return { error: supabaseServiceConfigError || "Supabase admin is not configured.", status: 500, userId: "", userName: "" };

  const authorization = request.headers.get("authorization") ?? "";
  const token = authorization.replace(/^Bearer\s+/i, "").trim();
  if (!token) return { error: "请先登录后再使用生活帮手。", status: 401, userId: "", userName: "" };

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return { error: error?.message || "登录已过期，请重新登录。", status: 401, userId: "", userName: "" };

  const metadata = data.user.user_metadata;
  const name = [metadata?.display_name, metadata?.full_name, metadata?.name].find((value) => typeof value === "string" && value.trim());
  return { error: "", status: 200, userId: data.user.id, userName: typeof name === "string" ? name.trim() : data.user.email?.split("@")[0] || "Japan Life 用户" };
}

export function authErrorResponse(error: string, status: number) {
  return NextResponse.json({ error }, { status });
}

export async function loadLifeHelperProfiles(userIds: string[]) {
  const ids = [...new Set(userIds.map((id) => id.trim()).filter(Boolean))];
  const profiles: Record<string, LifeHelperProfile> = {};
  if (!ids.length || !supabaseAdmin) return profiles;

  try {
    const filters = ids.flatMap((id) => ["id.eq." + id, "user_id.eq." + id, "public_id.eq." + id]).join(",");
    const { data, error } = await supabaseAdmin
      .from("community_profiles")
      .select("id,user_id,public_id,display_name,avatar")
      .or(filters)
      .returns<LifeHelperProfileRow[]>();
    if (error) {
      if (isMissingColumnError(error)) return loadLegacyLifeHelperProfiles(ids);
      throw error;
    }
    for (const row of data ?? []) {
      const profile = mapLifeHelperProfile(row);
      for (const key of [row.id, row.user_id, row.public_id].filter((value): value is string => typeof value === "string" && Boolean(value.trim()))) {
        profiles[key] = profile;
      }
    }
  } catch (error) {
    console.warn("[life-helper] failed to load profiles", getLifeHelperErrorMessage(error));
  }

  return profiles;
}

async function loadLegacyLifeHelperProfiles(ids: string[]) {
  const profiles: Record<string, LifeHelperProfile> = {};
  if (!ids.length || !supabaseAdmin) return profiles;
  try {
    const { data, error } = await supabaseAdmin
      .from("community_profiles")
      .select("id,display_name,avatar")
      .in("id", ids)
      .returns<LifeHelperProfileRow[]>();
    if (error) throw error;
    for (const row of data ?? []) {
      const profile = mapLifeHelperProfile(row);
      profiles[row.id] = profile;
    }
  } catch (error) {
    console.warn("[life-helper] failed to load legacy profiles", getLifeHelperErrorMessage(error));
  }
  return profiles;
}

export function mapRequestFromDb(row: RequestRow, profile?: LifeHelperProfile): LifeHelperRequest {
  return {
    id: row.id,
    area: row.area,
    authorAvatar: profile?.avatar,
    authorId: row.author_id,
    authorName: profile?.displayName || row.author_name,
    authorProfileId: profile?.profileId || row.author_id,
    budget: row.budget,
    category: row.category,
    contact: row.contact,
    contactVisibility: row.contact_visibility,
    createdAt: formatCreatedAt(row.created_at),
    description: row.description,
    preferredTime: row.preferred_time,
    source: "user",
    status: row.status,
    title: row.title,
  };
}

export function mapApplicationFromDb(row: ApplicationRow, profile?: LifeHelperProfile): LifeHelperApplication {
  return {
    id: row.id,
    applicantAvatar: profile?.avatar,
    applicantId: row.applicant_id,
    applicantName: profile?.displayName || row.applicant_name,
    applicantProfileId: profile?.profileId || row.applicant_id,
    contact: row.contact,
    createdAt: formatCreatedAt(row.created_at),
    message: row.message,
    requestId: row.request_id,
    status: row.status,
  };
}

export function mapBusinessFromDb(row: BusinessRow, profile?: LifeHelperProfile): LifeHelperBusinessApplication {
  return {
    id: row.id,
    area: row.area,
    businessHours: row.business_hours,
    businessName: row.business_name,
    category: row.category,
    contactName: row.contact_name,
    createdAt: formatCreatedAt(row.created_at),
    description: row.description,
    email: row.email,
    languages: row.languages ?? [],
    lineId: row.line_id,
    notes: row.notes,
    phone: row.phone,
    priceInfo: row.price_info,
    serviceLanguageTag: row.service_language_tag,
    status: row.status,
    type: "business",
    userAvatar: profile?.avatar,
    userId: row.user_id,
    userProfileId: profile?.profileId || row.user_id,
    website: row.website,
  };
}

export function mapPersonalFromDb(row: PersonalRow, profile?: LifeHelperProfile): LifeHelperPersonalApplication {
  return {
    id: row.id,
    area: row.area,
    availableTime: row.available_time,
    contact: row.contact,
    contactMethods: parseLifeHelperContactMethods(row.contact, row.contact_type),
    contactType: row.contact_type,
    createdAt: formatCreatedAt(row.created_at),
    displayName: profile?.displayName || row.display_name,
    experience: row.experience,
    languages: row.languages ?? [],
    notes: row.notes,
    priceExpectation: row.price_expectation,
    serviceLanguageTag: row.service_language_tag,
    selfIntro: row.self_intro,
    services: row.services ?? [],
    status: row.status,
    type: "helper",
    userAvatar: profile?.avatar,
    userId: row.user_id,
    userProfileId: profile?.profileId || row.user_id,
  };
}

export function cleanRequestPayload(body: Record<string, unknown>, userId: string, userName: string) {
  const category = text(body.category, 40) as LifeHelperCategory;
  const contactVisibility = text(body.contactVisibility, 40, "after_apply") as LifeHelperContactVisibility;
  const title = text(body.title, 120);
  const area = text(body.area, 120);
  const preferredTime = text(body.preferredTime, 120);
  if (!title || !area || !preferredTime || !categoryIds.has(category)) return null;
  if (!visibilityValues.has(contactVisibility)) return null;
  return {
    title,
    area,
    author_id: userId,
    author_name: userName,
    budget: text(body.budget, 120) || "报酬和条件需双方确认",
    category,
    contact: text(body.contact, 240),
    contact_visibility: contactVisibility,
    description: text(body.description, 1200) || "发布者还没有补充详细说明。",
    preferred_time: preferredTime,
    source: "user",
    status: "open",
  };
}

export function cleanRequestStatus(value: unknown) {
  return requestStatusValues.has(value as LifeHelperRequestStatus) ? (value as LifeHelperRequestStatus) : null;
}

export function cleanApplicationStatus(value: unknown) {
  return applicationStatusValues.has(value as LifeHelperApplicationStatus) ? (value as LifeHelperApplicationStatus) : null;
}

export function cleanJoinStatus(value: unknown) {
  return joinStatusValues.has(value as LifeHelperJoinStatus) ? (value as LifeHelperJoinStatus) : null;
}

export function cleanBusinessPayload(body: Record<string, unknown>, userId: string) {
  const category = text(body.category, 80) as LifeHelperBusinessCategory;
  const businessName = text(body.businessName, 160);
  const area = text(body.area, 160);
  const contactName = text(body.contactName, 120);
  const description = text(body.description, 1500);
  const phone = text(body.phone, 120);
  const email = text(body.email, 160);
  const lineId = text(body.lineId, 120);
  if (!businessName || !area || !contactName || !description || !businessCategoryValues.has(category) || (!phone && !email && !lineId)) return null;
  const languages = textArray<LifeHelperLanguage>(body.languages, languageValues, ["中文", "日语"]);
  const serviceLanguageTag = serviceLanguageValues.has(text(body.serviceLanguageTag, 80)) ? text(body.serviceLanguageTag, 80) as LifeHelperServiceLanguageTag : "中日双语";
  return {
    user_id: userId,
    area,
    business_hours: text(body.businessHours, 160),
    business_name: businessName,
    category,
    contact_name: contactName,
    description,
    email,
    languages,
    line_id: lineId,
    notes: text(body.notes, 1000),
    phone,
    price_info: text(body.priceInfo, 200),
    service_language_tag: serviceLanguageTag,
    status: "pending",
    website: text(body.website, 240),
  };
}

export function cleanPersonalPayload(body: Record<string, unknown>, userId: string) {
  const displayName = text(body.displayName, 120);
  const area = text(body.area, 160);
  const contactMethods = cleanContactMethods(body.contactMethods);
  const contact = encodeLifeHelperContactMethods(contactMethods) || text(body.contact, 160);
  const selfIntro = text(body.selfIntro, 1500);
  const services = textArray<LifeHelperPersonalService>(body.services, personalServiceValues);
  if (!displayName || !area || !contact || !selfIntro || services.length === 0) return null;
  const firstContactType = contactMethods[0]?.type;
  const contactType = contactTypeValues.has(firstContactType as LifeHelperContactType) ? firstContactType as LifeHelperContactType : contactTypeValues.has(body.contactType as LifeHelperContactType) ? (body.contactType as LifeHelperContactType) : "其他";
  const languages = textArray<LifeHelperLanguage>(body.languages, languageValues, ["中文", "日语"]);
  const serviceLanguageTag = serviceLanguageValues.has(text(body.serviceLanguageTag, 80)) ? text(body.serviceLanguageTag, 80) as LifeHelperServiceLanguageTag : "中日双语";
  return {
    user_id: userId,
    area,
    available_time: text(body.availableTime, 160),
    contact,
    contact_type: contactType,
    display_name: displayName,
    experience: text(body.experience, 1000),
    languages,
    notes: text(body.notes, 1000),
    price_expectation: text(body.priceExpectation, 200),
    self_intro: selfIntro,
    service_language_tag: serviceLanguageTag,
    services,
    status: "pending",
  };
}

export function cleanContactMethods(value: unknown): LifeHelperContactMethod[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const record = item as Record<string, unknown>;
      const type = contactTypeValues.has(record.type as LifeHelperContactType) ? record.type as LifeHelperContactType : "其他";
      const contactValue = text(record.value, 180);
      if (!contactValue) return null;
      return { id: text(record.id, 80) || "contact-" + Math.random().toString(36).slice(2, 8), type, value: contactValue };
    })
    .filter((item): item is LifeHelperContactMethod => Boolean(item));
}

export async function sendLifeHelperAcceptedMessage(input: {
  applicantId: string;
  applicantMessage: string;
  ownerId: string;
  requestTitle: string;
}) {
  if (!supabaseAdmin) throw new Error("Supabase admin client is not configured.");
  const applicantId = input.applicantId.trim();
  const ownerId = input.ownerId.trim();
  if (!applicantId || !ownerId || applicantId === ownerId) return null;

  const body = `你申请的「${input.requestTitle || "生活帮手需求"}」已被发布者接受，可以在这里继续沟通细节。${input.applicantMessage ? `\n\n你的申请留言：${input.applicantMessage}` : ""}`;
  return sendLifeHelperMessage({
    body,
    receiverId: applicantId,
    senderId: ownerId,
  });
}

export function lifeHelperDbError(error: unknown) {
  if (isMissingLifeHelperTableError(error)) {
    return NextResponse.json({
      error: "生活帮手云端数据表还没初始化。请在 Supabase SQL Editor 执行项目根目录的 supabase-life-helper.sql。",
      hint: "需要创建 life_helper_requests、life_helper_applications、life_helper_business_applications、life_helper_personal_applications 四张表。",
    }, { status: 500 });
  }
  return adminErrorResponse(error);
}

function isMissingLifeHelperTableError(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const record = error as Record<string, unknown>;
  const message = typeof record.message === "string" ? record.message : "";
  const code = typeof record.code === "string" ? record.code : "";
  return (
    code === "PGRST205"
    && message.includes("public.life_helper_")
    && message.includes("schema cache")
  );
}

function mapLifeHelperProfile(row: LifeHelperProfileRow): LifeHelperProfile {
  return {
    avatar: row.avatar ?? "",
    displayName: row.display_name?.trim() || "Japan Life 用户",
    profileId: row.id,
    userId: row.id,
  };
}

async function sendLifeHelperMessage(input: { body: string; receiverId: string; senderId: string }) {
  if (!supabaseAdmin) throw new Error("Supabase admin client is not configured.");
  const [participantAId, participantBId] = sortLifeHelperParticipants(input.senderId, input.receiverId);
  const now = new Date().toISOString();
  const conversation = await getOrCreateLifeHelperConversation(participantAId, participantBId, now);
  if (!conversation) throw new Error("Failed to create life helper private message conversation.");

  const inserted = await supabaseAdmin
    .from("messages")
    .insert({
      body: input.body,
      conversation_id: conversation.id,
      receiver_id: input.receiverId,
      sender_id: input.senderId,
    })
    .select("id,conversation_id,sender_id,receiver_id,body,created_at,read_at")
    .single();
  if (inserted.error) throw inserted.error;

  const messageTime = String((inserted.data as { created_at?: unknown }).created_at || now);
  const updated = await supabaseAdmin
    .from("conversations")
    .update({
      last_message: input.body,
      last_message_at: messageTime,
      last_message_sender_id: input.senderId,
      updated_at: messageTime,
    })
    .eq("id", conversation.id);
  if (updated.error) throw updated.error;
  return inserted.data;
}

async function getOrCreateLifeHelperConversation(participantAId: string, participantBId: string, now: string) {
  if (!supabaseAdmin) return null;
  const existing = await supabaseAdmin
    .from("conversations")
    .select("id,participant_a_id,participant_b_id")
    .eq("participant_a_id", participantAId)
    .eq("participant_b_id", participantBId)
    .maybeSingle<LifeHelperConversationRow>();
  if (existing.error) throw existing.error;
  if (existing.data) return existing.data;

  const inserted = await supabaseAdmin
    .from("conversations")
    .insert({
      last_message: "",
      last_message_at: now,
      last_message_sender_id: null,
      participant_a_id: participantAId,
      participant_b_id: participantBId,
      updated_at: now,
    })
    .select("id,participant_a_id,participant_b_id")
    .single<LifeHelperConversationRow>();
  if (!inserted.error) return inserted.data;

  const retry = await supabaseAdmin
    .from("conversations")
    .select("id,participant_a_id,participant_b_id")
    .eq("participant_a_id", participantAId)
    .eq("participant_b_id", participantBId)
    .maybeSingle<LifeHelperConversationRow>();
  if (retry.error) throw retry.error;
  return retry.data;
}

function sortLifeHelperParticipants(left: string, right: string) {
  return [left, right].sort((a, b) => a.localeCompare(b)) as [string, string];
}

function isMissingColumnError(error: unknown) {
  return Boolean(error && typeof error === "object" && "code" in error && (error as { code?: unknown }).code === "42703");
}

function getLifeHelperErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error && "message" in error) return String((error as { message?: unknown }).message ?? "");
  return String(error);
}

export { missingSupabaseAdminResponse, supabaseAdmin };
