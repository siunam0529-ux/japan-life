import { supabase } from "@/lib/supabase";
import type { LifeHelperBusinessApplication, LifeHelperContactMethod, LifeHelperPersonalApplication } from "./join";
import type { LifeHelperApplication, LifeHelperApplicationStatus, LifeHelperRequest, LifeHelperRequestStatus } from "./types";

export type LifeHelperProvider = {
  id: string;
  area: string;
  avatar?: string;
  contact: string;
  contactMethods?: LifeHelperContactMethod[];
  description: string;
  kind: "business" | "helper";
  languages: string[];
  name: string;
  price: string;
  serviceLanguageTag: string;
  services: string[];
  userId: string;
  userProfileId?: string;
};

type ApiErrorBody = {
  error?: string;
};

async function authHeaders() {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const { data } = supabase ? await supabase.auth.getSession() : { data: { session: null } };
  const token = data.session?.access_token;
  if (token) headers.authorization = `Bearer ${token}`;
  return headers;
}

function getUnavailableMessage() {
  if (typeof window === "undefined") return "生活帮手服务暂时不可用。";
  const language = window.localStorage.getItem("japan-life:language");
  if (language === "ja") return "生活サポートは一時的に利用できません。";
  if (language === "zh-TW") return "生活幫手服務暫時不可用。";
  return "生活帮手服务暂时不可用。";
}

async function parseResponse<T>(response: Response): Promise<T> {
  const data = (await response.json().catch(() => ({}))) as T & ApiErrorBody;
  if (!response.ok) throw new Error(data.error || getUnavailableMessage());
  return data;
}

export async function fetchLifeHelperRequests() {
  const data = await parseResponse<{ items: LifeHelperRequest[] }>(await fetch("/api/life-helper/requests"));
  return data.items;
}

export async function createLifeHelperRequest(payload: {
  area: string;
  budget: string;
  category: string;
  contact: string;
  contactVisibility: string;
  description: string;
  preferredTime: string;
  title: string;
}) {
  const data = await parseResponse<{ item: LifeHelperRequest }>(await fetch("/api/life-helper/requests", {
    body: JSON.stringify(payload),
    headers: await authHeaders(),
    method: "POST",
  }));
  return data.item;
}

export async function updateLifeHelperRequestStatus(id: string, status: LifeHelperRequestStatus) {
  const data = await parseResponse<{ item: LifeHelperRequest }>(await fetch(`/api/life-helper/requests/${encodeURIComponent(id)}`, {
    body: JSON.stringify({ status }),
    headers: await authHeaders(),
    method: "PATCH",
  }));
  return data.item;
}

export async function fetchLifeHelperApplications() {
  const data = await parseResponse<{ items: LifeHelperApplication[] }>(await fetch("/api/life-helper/applications", { headers: await authHeaders() }));
  return data.items;
}

export async function createLifeHelperApplication(payload: { applicantName: string; contact: string; message: string; requestId: string }) {
  const data = await parseResponse<{ item: LifeHelperApplication }>(await fetch("/api/life-helper/applications", {
    body: JSON.stringify(payload),
    headers: await authHeaders(),
    method: "POST",
  }));
  return data.item;
}

export async function updateLifeHelperApplicationStatus(id: string, status: LifeHelperApplicationStatus) {
  const data = await parseResponse<{ item: LifeHelperApplication }>(await fetch(`/api/life-helper/applications/${encodeURIComponent(id)}`, {
    body: JSON.stringify({ status }),
    headers: await authHeaders(),
    method: "PATCH",
  }));
  return data.item;
}

export async function fetchLifeHelperProviders() {
  const data = await parseResponse<{ items: LifeHelperProvider[] }>(await fetch("/api/life-helper/providers"));
  return data.items;
}

export async function fetchLifeHelperJoinApplications() {
  const data = await parseResponse<{ business: LifeHelperBusinessApplication[]; helpers: LifeHelperPersonalApplication[] }>(await fetch("/api/life-helper/join", { headers: await authHeaders() }));
  return data;
}

export async function createLifeHelperBusinessApplication(payload: Record<string, unknown>) {
  const data = await parseResponse<{ item: LifeHelperBusinessApplication }>(await fetch("/api/life-helper/join", {
    body: JSON.stringify({ ...payload, type: "business" }),
    headers: await authHeaders(),
    method: "POST",
  }));
  return data.item;
}

export async function createLifeHelperPersonalApplication(payload: Record<string, unknown>) {
  const data = await parseResponse<{ item: LifeHelperPersonalApplication }>(await fetch("/api/life-helper/join", {
    body: JSON.stringify({ ...payload, type: "helper" }),
    headers: await authHeaders(),
    method: "POST",
  }));
  return data.item;
}
