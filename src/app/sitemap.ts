import type { MetadataRoute } from "next";
import { areaItems } from "@/data/areas";
import { articleItems } from "@/data/articles";
import { createCanonicalUrl } from "@/lib/seo";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: createCanonicalUrl("/"), lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: createCanonicalUrl("/about"), lastModified: now, changeFrequency: "monthly", priority: 0.55 },
    { url: createCanonicalUrl("/areas"), lastModified: now, changeFrequency: "weekly", priority: 0.75 },
    { url: createCanonicalUrl("/places"), lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: createCanonicalUrl("/resources"), lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: createCanonicalUrl("/tools/salary"), lastModified: now, changeFrequency: "weekly", priority: 0.85 },
    { url: createCanonicalUrl("/tools/rent"), lastModified: now, changeFrequency: "weekly", priority: 0.85 },
    { url: createCanonicalUrl("/tools/exchange"), lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: createCanonicalUrl("/tools/weather"), lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: createCanonicalUrl("/tools/holidays"), lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: createCanonicalUrl("/tools/area-compare"), lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: createCanonicalUrl("/tools/living-cost"), lastModified: now, changeFrequency: "weekly", priority: 0.75 },
    { url: createCanonicalUrl("/tools/life-checklist"), lastModified: now, changeFrequency: "weekly", priority: 0.82 },
    { url: createCanonicalUrl("/tools/procedure-navigator"), lastModified: now, changeFrequency: "weekly", priority: 0.82 },
    { url: createCanonicalUrl("/tools/work-hours"), lastModified: now, changeFrequency: "weekly", priority: 0.75 },
    { url: createCanonicalUrl("/tools/visa-reminder"), lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: createCanonicalUrl("/tools/train-status"), lastModified: now, changeFrequency: "daily", priority: 0.7 },
    { url: createCanonicalUrl("/apps"), lastModified: now, changeFrequency: "weekly", priority: 0.75 },
    { url: createCanonicalUrl("/deals"), lastModified: now, changeFrequency: "weekly", priority: 0.75 },
    { url: createCanonicalUrl("/claim"), lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: createCanonicalUrl("/contact"), lastModified: now, changeFrequency: "monthly", priority: 0.45 },
    { url: createCanonicalUrl("/privacy"), lastModified: now, changeFrequency: "yearly", priority: 0.35 },
    { url: createCanonicalUrl("/terms"), lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: createCanonicalUrl("/disclaimer"), lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ];

  const areaRoutes: MetadataRoute.Sitemap = areaItems.map((area) => ({
    url: createCanonicalUrl(`/areas/${area.id}`),
    lastModified: area.updatedAt ? new Date(area.updatedAt) : now,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const articleRoutes: MetadataRoute.Sitemap = articleItems
    .filter((article) => article.href.startsWith("/articles/"))
    .map((article) => ({
      url: createCanonicalUrl(`/articles/${article.id}`),
      lastModified: article.updatedAt ? new Date(article.updatedAt) : now,
      changeFrequency: "monthly",
      priority: 0.55,
    }));

  return [...staticRoutes, ...areaRoutes, ...articleRoutes];
}
