import type { MetadataRoute } from "next";
import { areaItems } from "@/data/areas";
import { articleItems } from "@/data/articles";
import { createCanonicalUrl } from "@/lib/seo";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: createCanonicalUrl("/"), lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: createCanonicalUrl("/tools/salary"), lastModified: now, changeFrequency: "weekly", priority: 0.85 },
    { url: createCanonicalUrl("/tools/rent"), lastModified: now, changeFrequency: "weekly", priority: 0.85 },
    { url: createCanonicalUrl("/tools/exchange"), lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: createCanonicalUrl("/tools/holidays"), lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: createCanonicalUrl("/tools/area-compare"), lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: createCanonicalUrl("/apps"), lastModified: now, changeFrequency: "weekly", priority: 0.75 },
    { url: createCanonicalUrl("/deals"), lastModified: now, changeFrequency: "weekly", priority: 0.75 },
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
