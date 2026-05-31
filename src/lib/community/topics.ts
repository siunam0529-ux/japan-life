import type { CommunityViewLocale } from "@/lib/community/types";

export const communityHotTopics: Record<CommunityViewLocale, string[]> = {
  all: ["池袋美食", "東京散步", "東京散歩", "租房避坑", "部屋探し", "省钱生活", "節約生活", "同城搭子", "友達募集", "宠物生活"],
  ja: ["池袋グルメ", "東京散歩", "部屋探し", "バイト日本語", "節約生活", "引っ越し", "友達募集", "ペット生活", "手続き相談", "一人ごはん"],
  "zh-cn": ["池袋美食", "东京散步", "租房避坑", "打工日语", "省钱生活", "搬家出清", "同城搭子", "宠物生活", "手续求助", "一人食"],
  "zh-tw": ["池袋美食", "東京散步", "租屋避伏", "打工日文", "慳錢生活", "搬屋清物", "同城搭子", "寵物生活", "手續求助", "一人食"],
};

export function getHotCommunityTopics(locale: CommunityViewLocale) {
  return communityHotTopics[locale];
}

export function normalizeCommunityTag(value: string) {
  return value.replace(/^#+/, "").trim();
}

export function parseCommunityTags(value: string, limit = 5) {
  const seen = new Set<string>();
  return value
    .split(/[,\s，、#]+/)
    .map(normalizeCommunityTag)
    .filter((tag) => {
      if (!tag || seen.has(tag)) return false;
      seen.add(tag);
      return true;
    })
    .slice(0, limit);
}

export function getCommunityTopicHref(tag: string, locale?: CommunityViewLocale) {
  const encodedTag = encodeURIComponent(normalizeCommunityTag(tag));
  return `/community/${locale ?? "all"}/topic/${encodedTag}`;
}
