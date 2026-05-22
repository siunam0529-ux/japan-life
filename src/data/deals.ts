export type DealCategory = "mobile" | "wifi" | "creditCard" | "remittance" | "payment" | "rentConsult" | "jobApply" | "shopping";
export type AffiliateProvider = "a8" | "rakuten" | "valueCommerce" | "other" | "";
export type DealStatus = "published" | "hidden" | "expired";

export type DealItem = {
  id: string;
  providerName: string;
  titleZhCN: string;
  titleZhTW: string;
  titleJa: string;
  category: DealCategory;
  descriptionZhCN: string;
  descriptionZhTW: string;
  descriptionJa: string;
  rewardTextZhCN: string;
  rewardTextZhTW: string;
  rewardTextJa: string;
  conditionsZhCN: string;
  conditionsZhTW: string;
  conditionsJa: string;
  targetUserZhCN: string;
  targetUserZhTW: string;
  targetUserJa: string;
  // 上线后替换这里：官方网站永远填 officialUrl。
  officialUrl: string;
  // 上线后替换这里：拿到推广链接后填到对应平台，并把 activeAffiliateProvider 改成该平台。
  affiliateLinks: {
    a8: string; // 这里填写 A8.net 推广链接
    rakuten: string; // 这里填写 楽天アフィリエイト链接
    valueCommerce: string; // 这里填写 ValueCommerce 链接
    other: string; // 这里填写其他推广链接
  };
  activeAffiliateProvider: AffiliateProvider;
  isAffiliate: boolean;
  validUntil: string;
  updatedAt: string;
  status: DealStatus;
  tags: string[];
  logoUrl: string;
};

export const dealItems: DealItem[] = [];
