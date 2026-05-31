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
  createdAt: string;
  status: LifeHelperRequestStatus;
  source: "sample" | "user";
};

export type LifeHelperApplication = {
  id: string;
  requestId: string;
  applicantId: string;
  applicantName: string;
  message: string;
  contact: string;
  createdAt: string;
  status: LifeHelperApplicationStatus;
};

export function getLifeHelperCategoryLabel(category: LifeHelperCategory) {
  return lifeHelperCategories.find((item) => item.id === category)?.label ?? "其他帮忙";
}

export function getContactVisibilityLabel(value: LifeHelperContactVisibility) {
  if (value === "public") return "公开显示";
  if (value === "private") return "不公开，仅站内申请";
  return "仅申请后可见";
}
