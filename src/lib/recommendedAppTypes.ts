export type AppPlatform = "iOS" | "Android" | "Web";
export type RecommendedAppStatus = "published" | "hidden";

export type RecommendedAppCategory =
  | "transport"
  | "payment"
  | "remittance"
  | "rent"
  | "work"
  | "secondhand"
  | "delivery"
  | "translation"
  | "japanese"
  | "disaster"
  | "medical"
  | "shopping";

export type RecommendedApp = {
  id: string;
  name: string;
  category: RecommendedAppCategory;
  categoryZhCN: string;
  categoryZhTW: string;
  categoryJa: string;
  descriptionZhCN: string;
  descriptionZhTW: string;
  descriptionJa: string;
  shortDescriptionZhCN: string;
  shortDescriptionZhTW: string;
  shortDescriptionJa: string;
  usefulForZhCN: string;
  usefulForZhTW: string;
  usefulForJa: string;
  platforms: AppPlatform[];
  officialUrl: string;
  appStoreUrl: string;
  googlePlayUrl: string;
  iconUrl?: string;
  developerName?: string;
  priceText?: string;
  apiSource?: "itunes";
  tags: string[];
  isFree: boolean;
  relatedToolIds: string[];
  updatedAt: string;
  status: RecommendedAppStatus;
};
