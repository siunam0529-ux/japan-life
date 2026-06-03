import type { Language } from "@/lib/i18n/translations";

export type LifeHelperJoinStatus = "pending" | "approved" | "rejected";
export type LifeHelperJoinType = "business" | "helper";
export type LifeHelperContactType = "微信" | "LINE" | "邮箱" | "电话" | "其他";

export type LifeHelperContactMethod = {
  id: string;
  type: LifeHelperContactType;
  value: string;
};

export const businessServiceCategories = [
  "清洁打扫",
  "搬家搬运",
  "宠物服务",
  "维修安装",
  "翻译陪同",
  "手续代办",
  "美容护理",
  "餐饮外卖",
  "其他服务",
] as const;

export const personalServiceOptions = [
  "清洁打扫",
  "搬运帮忙",
  "宠物照顾",
  "跑腿代办",
  "手续陪同",
  "翻译陪同",
  "家具组装",
  "陪去医院",
  "买东西代办",
  "其他帮忙",
] as const;

export const helperLanguageOptions = ["中文", "日语", "英语", "繁体中文", "韩语", "其他"] as const;
export const lifeHelperServiceLanguageTags = ["只支持中文", "只支持日语", "中日双语", "中文为主", "日语为主", "英语可沟通", "其他语言"] as const;
export const lifeHelperContactTypes = ["微信", "LINE", "邮箱", "电话", "其他"] as const satisfies readonly LifeHelperContactType[];

export type LifeHelperBusinessCategory = (typeof businessServiceCategories)[number];
export type LifeHelperPersonalService = (typeof personalServiceOptions)[number];
export type LifeHelperLanguage = (typeof helperLanguageOptions)[number];
export type LifeHelperServiceLanguageTag = (typeof lifeHelperServiceLanguageTags)[number];

export type LifeHelperBusinessApplication = {
  id: string;
  type: "business";
  businessName: string;
  category: LifeHelperBusinessCategory;
  area: string;
  contactName: string;
  phone: string;
  email: string;
  lineId: string;
  website: string;
  description: string;
  priceInfo: string;
  businessHours: string;
  languages: LifeHelperLanguage[];
  serviceLanguageTag: LifeHelperServiceLanguageTag;
  notes: string;
  status: LifeHelperJoinStatus;
  createdAt: string;
  userId: string;
  userAvatar?: string;
  userProfileId?: string;
};

export type LifeHelperPersonalApplication = {
  id: string;
  type: "helper";
  displayName: string;
  services: LifeHelperPersonalService[];
  area: string;
  availableTime: string;
  contact: string;
  contactMethods?: LifeHelperContactMethod[];
  contactType: LifeHelperContactType;
  languages: LifeHelperLanguage[];
  serviceLanguageTag: LifeHelperServiceLanguageTag;
  experience: string;
  priceExpectation: string;
  selfIntro: string;
  notes: string;
  status: LifeHelperJoinStatus;
  createdAt: string;
  userId: string;
  userAvatar?: string;
  userProfileId?: string;
};

export function createLifeHelperContactMethod(type: LifeHelperContactType = "微信", value = ""): LifeHelperContactMethod {
  return { id: "contact-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8), type, value };
}

export function encodeLifeHelperContactMethods(methods: LifeHelperContactMethod[]) {
  const normalized = methods
    .map((method) => ({ type: method.type, value: method.value.trim() }))
    .filter((method) => method.value);
  if (normalized.length === 0) return "";
  return "JL_CONTACTS:" + JSON.stringify(normalized);
}

export function parseLifeHelperContactMethods(contact: string, fallbackType: LifeHelperContactType = "其他"): LifeHelperContactMethod[] {
  const raw = contact.trim();
  if (!raw) return [];
  if (raw.startsWith("JL_CONTACTS:")) {
    try {
      const parsed = JSON.parse(raw.slice("JL_CONTACTS:".length)) as Array<{ type?: unknown; value?: unknown }>;
      return parsed
        .map((item) => ({
          id: createLifeHelperContactMethod().id,
          type: lifeHelperContactTypes.includes(item.type as LifeHelperContactType) ? item.type as LifeHelperContactType : fallbackType,
          value: typeof item.value === "string" ? item.value.trim() : "",
        }))
        .filter((item) => item.value);
    } catch {
      return [];
    }
  }
  return [{ id: createLifeHelperContactMethod().id, type: fallbackType, value: raw }];
}

export function formatLifeHelperContactMethods(contact: string, fallbackType: LifeHelperContactType = "其他") {
  return parseLifeHelperContactMethods(contact, fallbackType)
    .map((method) => method.type + ": " + method.value)
    .join(" / ");
}

export function getLifeHelperJoinStatusLabel(status: LifeHelperJoinStatus, language: Language = "zh-CN") {
  const labels = {
    "zh-CN": { approved: "已通过", pending: "待审核", rejected: "已拒绝" },
    "zh-TW": { approved: "已通過", pending: "待審核", rejected: "已拒絕" },
    ja: { approved: "承認済み", pending: "審査中", rejected: "却下済み" },
  } as const;
  return labels[language][status];
}
