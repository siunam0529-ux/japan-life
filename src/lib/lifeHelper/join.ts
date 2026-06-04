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

const businessCategoryLabels: Record<LifeHelperBusinessCategory, Record<Language, string>> = {
  "清洁打扫": { "zh-CN": "清洁打扫", "zh-TW": "清潔打掃", ja: "掃除" },
  "搬家搬运": { "zh-CN": "搬家搬运", "zh-TW": "搬家搬運", ja: "引っ越し・運搬" },
  "宠物服务": { "zh-CN": "宠物服务", "zh-TW": "寵物服務", ja: "ペットサービス" },
  "维修安装": { "zh-CN": "维修安装", "zh-TW": "維修安裝", ja: "修理・取り付け" },
  "翻译陪同": { "zh-CN": "翻译陪同", "zh-TW": "翻譯陪同", ja: "通訳同行" },
  "手续代办": { "zh-CN": "手续代办", "zh-TW": "手續代辦", ja: "手続き代行" },
  "美容护理": { "zh-CN": "美容护理", "zh-TW": "美容護理", ja: "美容ケア" },
  "餐饮外卖": { "zh-CN": "餐饮外卖", "zh-TW": "餐飲外送", ja: "飲食・デリバリー" },
  "其他服务": { "zh-CN": "其他服务", "zh-TW": "其他服務", ja: "その他サービス" },
};

const personalServiceLabels: Record<LifeHelperPersonalService, Record<Language, string>> = {
  "清洁打扫": { "zh-CN": "清洁打扫", "zh-TW": "清潔打掃", ja: "掃除" },
  "搬运帮忙": { "zh-CN": "搬运帮忙", "zh-TW": "搬運幫忙", ja: "荷物運び" },
  "宠物照顾": { "zh-CN": "宠物照顾", "zh-TW": "寵物照顧", ja: "ペットのお世話" },
  "跑腿代办": { "zh-CN": "跑腿代办", "zh-TW": "跑腿代辦", ja: "用事代行" },
  "手续陪同": { "zh-CN": "手续陪同", "zh-TW": "手續陪同", ja: "手続き同行" },
  "翻译陪同": { "zh-CN": "翻译陪同", "zh-TW": "翻譯陪同", ja: "通訳同行" },
  "家具组装": { "zh-CN": "家具组装", "zh-TW": "家具組裝", ja: "家具組み立て" },
  "陪去医院": { "zh-CN": "陪去医院", "zh-TW": "陪去醫院", ja: "病院同行" },
  "买东西代办": { "zh-CN": "买东西代办", "zh-TW": "買東西代辦", ja: "買い物代行" },
  "其他帮忙": { "zh-CN": "其他帮忙", "zh-TW": "其他幫忙", ja: "その他サポート" },
};

const helperLanguageLabels: Record<LifeHelperLanguage, Record<Language, string>> = {
  中文: { "zh-CN": "中文", "zh-TW": "中文", ja: "中国語" },
  日语: { "zh-CN": "日语", "zh-TW": "日語", ja: "日本語" },
  英语: { "zh-CN": "英语", "zh-TW": "英語", ja: "英語" },
  繁体中文: { "zh-CN": "繁体中文", "zh-TW": "繁體中文", ja: "繁体字中国語" },
  韩语: { "zh-CN": "韩语", "zh-TW": "韓語", ja: "韓国語" },
  其他: { "zh-CN": "其他", "zh-TW": "其他", ja: "その他" },
};

const serviceLanguageTagLabels: Record<LifeHelperServiceLanguageTag, Record<Language, string>> = {
  只支持中文: { "zh-CN": "只支持中文", "zh-TW": "只支援中文", ja: "中国語のみ" },
  只支持日语: { "zh-CN": "只支持日语", "zh-TW": "只支援日語", ja: "日本語のみ" },
  中日双语: { "zh-CN": "中日双语", "zh-TW": "中日雙語", ja: "日中対応" },
  中文为主: { "zh-CN": "中文为主", "zh-TW": "中文為主", ja: "中国語中心" },
  日语为主: { "zh-CN": "日语为主", "zh-TW": "日語為主", ja: "日本語中心" },
  英语可沟通: { "zh-CN": "英语可沟通", "zh-TW": "英語可溝通", ja: "英語対応可" },
  其他语言: { "zh-CN": "其他语言", "zh-TW": "其他語言", ja: "その他言語" },
};

const contactTypeLabels: Record<LifeHelperContactType, Record<Language, string>> = {
  微信: { "zh-CN": "微信", "zh-TW": "微信", ja: "WeChat" },
  LINE: { "zh-CN": "LINE", "zh-TW": "LINE", ja: "LINE" },
  邮箱: { "zh-CN": "邮箱", "zh-TW": "信箱", ja: "メール" },
  电话: { "zh-CN": "电话", "zh-TW": "電話", ja: "電話" },
  其他: { "zh-CN": "其他", "zh-TW": "其他", ja: "その他" },
};

export function getLifeHelperBusinessCategoryLabel(category: string, language: Language = "zh-CN") {
  return businessCategoryLabels[category as LifeHelperBusinessCategory]?.[language] ?? category;
}

export function getLifeHelperPersonalServiceLabel(service: string, language: Language = "zh-CN") {
  return personalServiceLabels[service as LifeHelperPersonalService]?.[language] ?? service;
}

export function getLifeHelperLanguageLabel(value: string, language: Language = "zh-CN") {
  return helperLanguageLabels[value as LifeHelperLanguage]?.[language] ?? value;
}

export function getLifeHelperServiceLanguageTagLabel(tag: string, language: Language = "zh-CN") {
  return serviceLanguageTagLabels[tag as LifeHelperServiceLanguageTag]?.[language] ?? tag;
}

export function getLifeHelperContactTypeLabel(type: string, language: Language = "zh-CN") {
  return contactTypeLabels[type as LifeHelperContactType]?.[language] ?? type;
}
