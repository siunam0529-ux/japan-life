import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/seo";

export const dynamic = "force-static";

function isProductionIndexableHost() {
  const siteUrl = siteConfig.url;
  const isPreview = process.env.VERCEL_ENV === "preview";
  const isLocalhost = siteUrl.includes("localhost") || siteUrl.includes("127.0.0.1");
  const isVercelPreview = siteUrl.includes(".vercel.app") && !siteUrl.includes("japanlife-app.com");
  return !isPreview && !isLocalhost && !isVercelPreview;
}

export default function robots(): MetadataRoute.Robots {
  const indexable = isProductionIndexableHost();

  return {
    rules: {
      userAgent: "*",
      allow: indexable ? "/" : undefined,
      disallow: indexable ? undefined : "/",
    },
    sitemap: `${siteConfig.url.replace(/\/+$/, "")}/sitemap.xml`,
  };
}
