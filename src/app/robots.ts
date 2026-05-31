import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/seo";

export const dynamic = "force-static";

function isProductionIndexableHost() {
  const siteUrl = siteConfig.url;
  const isPreview = process.env.VERCEL_ENV === "preview";
  const isLocalhost = siteUrl.includes("localhost") || siteUrl.includes("127.0.0.1");
  return !isPreview && !isLocalhost;
}

export default function robots(): MetadataRoute.Robots {
  const indexable = isProductionIndexableHost();
  const disallow = [
    "/admin",
    "/community/profile",
    "/community/me",
    "/community/notifications",
    "/notifications",
    "/community/*/new",
  ];

  return {
    rules: {
      userAgent: "*",
      allow: indexable ? ["/", "/community", "/community/all", "/community/zh-cn", "/community/zh-tw", "/community/ja"] : undefined,
      disallow: indexable ? disallow : "/",
    },
    sitemap: `${siteConfig.url.replace(/\/+$/, "")}/sitemap.xml`,
  };
}
