import type { Language } from "@/lib/i18n/translations";

export const lifeHelperCategories = [
  { id: "cleaning", label: "清洁打扫" },
  { id: "moving", label: "搬运帮忙" },
  { id: "pet", label: "宠物照顾" },
  { id: "errand", label: "跑腿代办" },
  { id: "procedure", label: "手续陪同" },
  { id: "translate", label: "翻译陪同" },
  { id: "furniture", label: "家具组装" },
  { id: "hospital", label: "陪去医院" },
  { id: "other", label: "其他帮忙" },
] as const;

export type LifeHelperCategory = (typeof lifeHelperCategories)[number]["id"];
export type LifeHelperContactVisibility = "after_apply" | "public" | "private";
export type LifeHelperRequestStatus = "open" | "closed";
export type LifeHelperApplicationStatus = "sent" | "accepted" | "declined";

export type LifeHelperRequest = {
  id: string;
  title: string;
  category: LifeHelperCategory;
  area: string;
  budget: string;
  preferredTime: string;
  description: string;
  contact: string;
  contactVisibility: LifeHelperContactVisibility;
  authorName: string;
  authorId: string;
  authorAvatar?: string;
  authorProfileId?: string;
  createdAt: string;
  status: LifeHelperRequestStatus;
  source: "user";
};

export type LifeHelperApplication = {
  id: string;
  requestId: string;
  applicantId: string;
  applicantName: string;
  applicantAvatar?: string;
  applicantProfileId?: string;
  message: string;
  contact: string;
  createdAt: string;
  status: LifeHelperApplicationStatus;
};

const categoryLabels: Record<LifeHelperCategory, Record<Language, string>> = {
  cleaning: { "zh-CN": "清洁打扫", "zh-TW": "清潔打掃", ja: "掃除" },
  moving: { "zh-CN": "搬运帮忙", "zh-TW": "搬運幫忙", ja: "荷物運び" },
  pet: { "zh-CN": "宠物照顾", "zh-TW": "寵物照顧", ja: "ペットのお世話" },
  errand: { "zh-CN": "跑腿代办", "zh-TW": "跑腿代辦", ja: "用事代行" },
  procedure: { "zh-CN": "手续陪同", "zh-TW": "手續陪同", ja: "手続き同行" },
  translate: { "zh-CN": "翻译陪同", "zh-TW": "翻譯陪同", ja: "通訳同行" },
  furniture: { "zh-CN": "家具组装", "zh-TW": "家具組裝", ja: "家具組み立て" },
  hospital: { "zh-CN": "陪去医院", "zh-TW": "陪去醫院", ja: "病院同行" },
  other: { "zh-CN": "其他帮忙", "zh-TW": "其他幫忙", ja: "その他サポート" },
};

const contactVisibilityLabels: Record<LifeHelperContactVisibility, Record<Language, string>> = {
  public: { "zh-CN": "公开显示", "zh-TW": "公開顯示", ja: "公開表示" },
  private: { "zh-CN": "不公开，仅站内申请", "zh-TW": "不公開，僅站內申請", ja: "非公開、サイト内応募のみ" },
  after_apply: { "zh-CN": "仅申请后可见", "zh-TW": "僅申請後可見", ja: "応募後のみ表示" },
};

const applicationStatusLabels: Record<LifeHelperApplicationStatus, Record<Language, string>> = {
  sent: { "zh-CN": "待处理", "zh-TW": "待處理", ja: "未対応" },
  accepted: { "zh-CN": "已接受", "zh-TW": "已接受", ja: "承認済み" },
  declined: { "zh-CN": "已拒绝", "zh-TW": "已拒絕", ja: "拒否済み" },
};

export function getLifeHelperCategoryLabel(category: LifeHelperCategory, language: Language = "zh-CN") {
  return categoryLabels[category]?.[language] ?? categoryLabels.other[language];
}

export function getContactVisibilityLabel(value: LifeHelperContactVisibility, language: Language = "zh-CN") {
  return contactVisibilityLabels[value][language];
}

export function getLifeHelperApplicationStatusLabel(status: LifeHelperApplicationStatus, language: Language = "zh-CN") {
  return applicationStatusLabels[status][language];
}
