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
    "/account",
    "/app-review",
    "/community/me",
    "/community/new",
    "/notifications",
    "/messages",
    "/me",
    "/favorites",
    "/home-tools",
    "/login",
    "/signup",
    "/forgot-password",
    "/reset-password",
    "/onboarding",
    "/reminders",
    "/feedback",
    "/data-status",
    "/community/*/new",
    "/api",
  ];

  return {
    rules: {
      userAgent: "*",
      allow: indexable ? ["/", "/community", "/community/all"] : undefined,
      disallow: indexable ? disallow : "/",
    },
    sitemap: `${siteConfig.url.replace(/\/+$/, "")}/sitemap.xml`,
  };
}
