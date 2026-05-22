import { type RecommendedApp, type RecommendedAppCategory } from "@/data/recommendedApps";

export type SupabaseRecommendedApp = Partial<RecommendedApp> & {
  id: string | number;
  name?: string;
  title?: string;
  category?: RecommendedAppCategory | string;
  category_zh_cn?: string;
  category_zh_tw?: string;
  category_ja?: string;
  description?: string;
  description_zh_cn?: string;
  description_zh_tw?: string;
  description_ja?: string;
  short_description?: string;
  short_description_zh_cn?: string;
  short_description_zh_tw?: string;
  short_description_ja?: string;
  useful_for_zh_cn?: string;
  useful_for_zh_tw?: string;
  useful_for_ja?: string;
  platforms?: string[] | string;
  official_url?: string;
  app_url?: string;
  app_store_url?: string;
  image_url?: string;
  icon_url?: string;
  developer_name?: string;
  price_text?: string;
  is_free?: boolean;
  related_tool_ids?: string[] | string;
  updated_at?: string;
  status?: string;
  sort_order?: number;
};

export const recommendedAppCategoryIds = new Set<RecommendedAppCategory>([
  "transport",
  "payment",
  "remittance",
  "rent",
  "work",
  "secondhand",
  "delivery",
  "translation",
  "japanese",
  "disaster",
  "medical",
  "shopping",
]);

export function toStringArray(value: unknown) {
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === "string");
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value) as unknown;
      if (Array.isArray(parsed)) return parsed.filter((item): item is string => typeof item === "string");
    } catch {
      return value.split(",").map((item) => item.trim()).filter(Boolean);
    }
  }
  return [];
}

export function isSupabaseRecommendedApp(value: unknown): value is SupabaseRecommendedApp {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return (typeof record.id === "string" || typeof record.id === "number") && (typeof record.name === "string" || typeof record.title === "string");
}

export function createRecommendedAppSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function normalizeSupabaseRecommendedApp(item: SupabaseRecommendedApp): RecommendedApp {
  const category = recommendedAppCategoryIds.has(item.category as RecommendedAppCategory) ? (item.category as RecommendedAppCategory) : "shopping";
  const name = item.name ?? item.title ?? "App";
  const shortDescription = item.short_description ?? item.shortDescriptionZhCN ?? item.description ?? "";
  const platforms = toStringArray(item.platforms).filter((platform): platform is RecommendedApp["platforms"][number] => platform === "iOS" || platform === "Web");

  return {
    id: String(item.id),
    name,
    category,
    categoryZhCN: item.categoryZhCN ?? item.category_zh_cn ?? String(item.category ?? "App"),
    categoryZhTW: item.categoryZhTW ?? item.category_zh_tw ?? String(item.category ?? "App"),
    categoryJa: item.categoryJa ?? item.category_ja ?? String(item.category ?? "App"),
    descriptionZhCN: item.descriptionZhCN ?? item.description_zh_cn ?? item.description ?? shortDescription,
    descriptionZhTW: item.descriptionZhTW ?? item.description_zh_tw ?? item.description ?? shortDescription,
    descriptionJa: item.descriptionJa ?? item.description_ja ?? item.description ?? shortDescription,
    shortDescriptionZhCN: item.shortDescriptionZhCN ?? item.short_description_zh_cn ?? shortDescription,
    shortDescriptionZhTW: item.shortDescriptionZhTW ?? item.short_description_zh_tw ?? shortDescription,
    shortDescriptionJa: item.shortDescriptionJa ?? item.short_description_ja ?? shortDescription,
    usefulForZhCN: item.usefulForZhCN ?? item.useful_for_zh_cn ?? "",
    usefulForZhTW: item.usefulForZhTW ?? item.useful_for_zh_tw ?? "",
    usefulForJa: item.usefulForJa ?? item.useful_for_ja ?? "",
    platforms: platforms.length > 0 ? platforms : ["iOS"],
    officialUrl: "",
    appStoreUrl: item.appStoreUrl ?? item.app_store_url ?? item.app_url ?? "",
    googlePlayUrl: "",
    iconUrl: item.iconUrl ?? item.icon_url ?? item.image_url,
    developerName: item.developerName ?? item.developer_name,
    priceText: item.priceText ?? item.price_text,
    tags: toStringArray(item.tags),
    isFree: Boolean(item.isFree ?? item.is_free ?? true),
    relatedToolIds: toStringArray(item.relatedToolIds ?? item.related_tool_ids),
    updatedAt: item.updatedAt ?? item.updated_at ?? "",
    status: item.status === "published" ? "published" : "hidden",
  };
}
