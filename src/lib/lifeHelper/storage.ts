import type { LifeHelperApplication, LifeHelperCategory, LifeHelperContactVisibility, LifeHelperRequest, LifeHelperRequestStatus } from "./types";

export const lifeHelperRequestsStorageKey = "japan-life-life-helper-requests";
export const lifeHelperApplicationsStorageKey = "japan-life-life-helper-applications";

const validCategories = new Set<LifeHelperCategory>(["cleaning", "moving", "pet", "errand", "procedure", "translate", "furniture", "hospital", "other"]);
const validVisibility = new Set<LifeHelperContactVisibility>(["after_apply", "public", "private"]);
const validRequestStatus = new Set<LifeHelperRequestStatus>(["open", "closed"]);

export function createLifeHelperId(prefix: string) {
  const randomPart = Math.random().toString(36).slice(2, 8);
  return `${prefix}-${Date.now()}-${randomPart}`;
}

function safeParseArray(key: string) {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function text(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function normalizeRequest(value: unknown): LifeHelperRequest | null {
  if (!value || typeof value !== "object") return null;
  const item = value as Partial<LifeHelperRequest> & {
    note?: unknown;
    time?: unknown;
  };
  const category = text(item.category);
  if (!item.id || !item.title || !item.area || !validCategories.has(category as LifeHelperCategory)) return null;
  return {
    id: text(item.id),
    area: text(item.area),
    authorId: text(item.authorId, "local-user"),
    authorName: text(item.authorName, "Japan Life 用户"),
    budget: text(item.budget, "报酬和条件需双方确认"),
    category: category as LifeHelperCategory,
    contact: text(item.contact),
    contactVisibility: validVisibility.has(item.contactVisibility as LifeHelperContactVisibility) ? (item.contactVisibility as LifeHelperContactVisibility) : "after_apply",
    createdAt: text(item.createdAt, "本地保存"),
    description: text(item.description, text(item.note, "发布者还没有补充说明。")),
    preferredTime: text(item.preferredTime, text(item.time, "时间可商量")),
    source: item.source === "sample" ? "sample" : "user",
    status: validRequestStatus.has(item.status as LifeHelperRequestStatus) ? (item.status as LifeHelperRequestStatus) : "open",
    title: text(item.title),
  };
}

function normalizeApplication(value: unknown): LifeHelperApplication | null {
  if (!value || typeof value !== "object") return null;
  const item = value as Partial<LifeHelperApplication>;
  if (!item.id || !item.requestId || !item.applicantId || !item.contact) return null;
  return {
    id: text(item.id),
    applicantId: text(item.applicantId),
    applicantName: text(item.applicantName, "Japan Life 用户"),
    contact: text(item.contact),
    createdAt: text(item.createdAt, "本地保存"),
    message: text(item.message, "你好，我可以帮忙。时间和费用可以再商量。"),
    requestId: text(item.requestId),
    status: item.status === "accepted" || item.status === "declined" ? item.status : "sent",
  };
}

export function readLifeHelperRequests() {
  return safeParseArray(lifeHelperRequestsStorageKey).map(normalizeRequest).filter((item): item is LifeHelperRequest => Boolean(item));
}

export function writeLifeHelperRequests(requests: LifeHelperRequest[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(lifeHelperRequestsStorageKey, JSON.stringify(requests));
}

export function readLifeHelperApplications() {
  return safeParseArray(lifeHelperApplicationsStorageKey).map(normalizeApplication).filter((item): item is LifeHelperApplication => Boolean(item));
}

export function writeLifeHelperApplications(applications: LifeHelperApplication[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(lifeHelperApplicationsStorageKey, JSON.stringify(applications));
}
