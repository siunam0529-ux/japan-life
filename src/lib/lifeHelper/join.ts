export type LifeHelperJoinStatus = "pending" | "approved" | "rejected";
export type LifeHelperJoinType = "business" | "helper";
export type LifeHelperContactType = "LINE" | "邮箱" | "电话" | "其他";

export const lifeHelperBusinessApplicationsStorageKey = "japan-life-life-helper-business-applications";
export const lifeHelperPersonalApplicationsStorageKey = "japan-life-life-helper-personal-applications";

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

export const helperLanguageOptions = ["中文", "日语", "英语", "繁语", "韩语", "其他"] as const;
export const lifeHelperServiceLanguageTags = ["只支持中文", "只支持日语", "中日双语", "中文为主", "日语为主", "英语可沟通", "其他语言"] as const;

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
};

export type LifeHelperPersonalApplication = {
  id: string;
  type: "helper";
  displayName: string;
  services: LifeHelperPersonalService[];
  area: string;
  availableTime: string;
  contact: string;
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
};

export const sampleApprovedBusinessApplications: LifeHelperBusinessApplication[] = [
  {
    id: "sample-approved-business-cleaning",
    area: "新宿・中野周边",
    businessHours: "平日 10:00-18:00",
    businessName: "Sakura 生活清洁",
    category: "清洁打扫",
    contactName: "Japan Life 示例",
    description: "面向一个人住和小户型的日常清洁、退房前整理和简单收纳。正式委托前请确认服务范围和费用。",
    email: "",
    languages: ["中文", "日语"],
    serviceLanguageTag: "中日双语",
    lineId: "sample-cleaning",
    notes: "本地示例服务者，用于展示入驻后的卡片结构。",
    phone: "",
    priceInfo: "3,000円起，按内容确认",
    status: "approved",
    type: "business",
    userId: "sample-business-cleaning",
    website: "",
    createdAt: "本地示例",
  },
];

export const sampleApprovedPersonalApplications: LifeHelperPersonalApplication[] = [
  {
    id: "sample-approved-helper-translate",
    area: "池袋・板桥・线上",
    availableTime: "周末 / 平日傍晚",
    contact: "sample-helper",
    contactType: "LINE",
    displayName: "小林同学",
    experience: "留学生，日常手续和简单翻译经验。",
    languages: ["中文", "日语"],
    serviceLanguageTag: "中日双语",
    notes: "本地示例个人帮手，用于展示入驻后的卡片结构。",
    priceExpectation: "1,500円起，可商量",
    selfIntro: "可以帮忙跑腿、陪同手续、简单日语确认。涉及签字和法律判断时请以官方窗口为准。",
    services: ["手续陪同", "翻译陪同", "跑腿代办"],
    status: "approved",
    type: "helper",
    userId: "sample-helper-translate",
    createdAt: "本地示例",
  },
];

const statusSet = new Set<LifeHelperJoinStatus>(["pending", "approved", "rejected"]);
const businessCategorySet = new Set<string>(businessServiceCategories);
const personalServiceSet = new Set<string>(personalServiceOptions);
const languageSet = new Set<string>(helperLanguageOptions);
const serviceLanguageTagSet = new Set<string>(lifeHelperServiceLanguageTags);
const contactTypeSet = new Set<LifeHelperContactType>(["LINE", "邮箱", "电话", "其他"]);

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

function filterLanguages(value: unknown): LifeHelperLanguage[] {
  return Array.isArray(value) ? value.filter((item): item is LifeHelperLanguage => typeof item === "string" && languageSet.has(item)) : [];
}

function inferServiceLanguageTag(languages: LifeHelperLanguage[]): LifeHelperServiceLanguageTag {
  const hasChinese = languages.includes("中文");
  const hasJapanese = languages.includes("日语");
  const hasEnglish = languages.includes("英语");
  if (hasChinese && hasJapanese) return "中日双语";
  if (hasChinese) return "只支持中文";
  if (hasJapanese) return "只支持日语";
  if (hasEnglish) return "英语可沟通";
  return "其他语言";
}

function normalizeServiceLanguageTag(value: unknown, languages: LifeHelperLanguage[]) {
  return typeof value === "string" && serviceLanguageTagSet.has(value) ? (value as LifeHelperServiceLanguageTag) : inferServiceLanguageTag(languages);
}

function normalizeBusinessApplication(value: unknown): LifeHelperBusinessApplication | null {
  if (!value || typeof value !== "object") return null;
  const item = value as Partial<LifeHelperBusinessApplication>;
  const category = text(item.category);
  if (!item.id || !item.businessName || !item.area || !item.contactName || !item.description || !businessCategorySet.has(category)) return null;
  const languages = filterLanguages(item.languages);
  return {
    id: text(item.id),
    area: text(item.area),
    businessHours: text(item.businessHours),
    businessName: text(item.businessName),
    category: category as LifeHelperBusinessCategory,
    contactName: text(item.contactName),
    createdAt: text(item.createdAt, "本地保存"),
    description: text(item.description),
    email: text(item.email),
    languages,
    lineId: text(item.lineId),
    notes: text(item.notes),
    phone: text(item.phone),
    priceInfo: text(item.priceInfo),
    serviceLanguageTag: normalizeServiceLanguageTag(item.serviceLanguageTag, languages),
    status: statusSet.has(item.status as LifeHelperJoinStatus) ? (item.status as LifeHelperJoinStatus) : "pending",
    type: "business",
    userId: text(item.userId),
    website: text(item.website),
  };
}

function normalizePersonalApplication(value: unknown): LifeHelperPersonalApplication | null {
  if (!value || typeof value !== "object") return null;
  const item = value as Partial<LifeHelperPersonalApplication>;
  const services = Array.isArray(item.services) ? item.services.filter((service): service is LifeHelperPersonalService => typeof service === "string" && personalServiceSet.has(service)) : [];
  if (!item.id || !item.displayName || !item.area || !item.contact || !item.selfIntro || services.length === 0) return null;
  const languages = filterLanguages(item.languages);
  return {
    id: text(item.id),
    area: text(item.area),
    availableTime: text(item.availableTime),
    contact: text(item.contact),
    contactType: contactTypeSet.has(item.contactType as LifeHelperContactType) ? (item.contactType as LifeHelperContactType) : "其他",
    createdAt: text(item.createdAt, "本地保存"),
    displayName: text(item.displayName),
    experience: text(item.experience),
    languages,
    notes: text(item.notes),
    priceExpectation: text(item.priceExpectation),
    serviceLanguageTag: normalizeServiceLanguageTag(item.serviceLanguageTag, languages),
    selfIntro: text(item.selfIntro),
    services,
    status: statusSet.has(item.status as LifeHelperJoinStatus) ? (item.status as LifeHelperJoinStatus) : "pending",
    type: "helper",
    userId: text(item.userId),
  };
}

export function readLifeHelperBusinessApplications() {
  return safeParseArray(lifeHelperBusinessApplicationsStorageKey).map(normalizeBusinessApplication).filter((item): item is LifeHelperBusinessApplication => Boolean(item));
}

export function writeLifeHelperBusinessApplications(items: LifeHelperBusinessApplication[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(lifeHelperBusinessApplicationsStorageKey, JSON.stringify(items));
}

export function readLifeHelperPersonalApplications() {
  return safeParseArray(lifeHelperPersonalApplicationsStorageKey).map(normalizePersonalApplication).filter((item): item is LifeHelperPersonalApplication => Boolean(item));
}

export function writeLifeHelperPersonalApplications(items: LifeHelperPersonalApplication[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(lifeHelperPersonalApplicationsStorageKey, JSON.stringify(items));
}

export function getLifeHelperJoinStatusLabel(status: LifeHelperJoinStatus, language: "ja" | "zh-CN" | "zh-TW" = "zh-CN") {
  const labels = {
    "zh-CN": { approved: "已通过", pending: "待审核", rejected: "已拒绝" },
    "zh-TW": { approved: "已通過", pending: "待審核", rejected: "已拒絕" },
    ja: { approved: "承認済み", pending: "審査待ち", rejected: "却下済み" },
  } as const;
  return labels[language][status];
}
