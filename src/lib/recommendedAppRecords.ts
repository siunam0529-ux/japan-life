import { recommendedApps, type RecommendedApp } from "@/data/recommendedApps";

export type RecommendedAppRecord = Record<string, unknown> & {
  id: string | number;
  status?: string;
  sort_order?: number;
};

export function recommendedAppToRecord(app: RecommendedApp, index: number): RecommendedAppRecord {
  return {
    id: app.id,
    name: app.name,
    category: app.category,
    categoryZhCN: app.categoryZhCN,
    categoryZhTW: app.categoryZhTW,
    categoryJa: app.categoryJa,
    descriptionZhCN: app.descriptionZhCN,
    descriptionZhTW: app.descriptionZhTW,
    descriptionJa: app.descriptionJa,
    shortDescriptionZhCN: app.shortDescriptionZhCN,
    shortDescriptionZhTW: app.shortDescriptionZhTW,
    shortDescriptionJa: app.shortDescriptionJa,
    usefulForZhCN: app.usefulForZhCN,
    usefulForZhTW: app.usefulForZhTW,
    usefulForJa: app.usefulForJa,
    platforms: app.platforms,
    appStoreUrl: app.appStoreUrl,
    iconUrl: app.iconUrl,
    developerName: app.developerName,
    priceText: app.priceText,
    tags: app.tags,
    isFree: app.isFree,
    relatedToolIds: app.relatedToolIds,
    updatedAt: app.updatedAt,
    status: app.status === "published" ? "published" : "draft",
    sort_order: index + 1000,
  };
}

export function getLocalRecommendedAppRecords() {
  return recommendedApps.map(recommendedAppToRecord);
}

export function mergeRecommendedAppRecords(localRecords: RecommendedAppRecord[], remoteRecords: RecommendedAppRecord[]) {
  const merged = new Map<string, RecommendedAppRecord>();

  localRecords.forEach((record) => {
    merged.set(String(record.id), record);
  });

  remoteRecords.forEach((record) => {
    merged.set(String(record.id), record);
  });

  return Array.from(merged.values()).sort((a, b) => Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0));
}
