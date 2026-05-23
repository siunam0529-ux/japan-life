import type { Metadata } from "next";

type MetadataType = "article" | "website";

type CreateMetadataOptions = {
  description?: string;
  image?: string;
  keywords?: string[];
  noIndex?: boolean;
  path?: string;
  title?: string;
  type?: MetadataType;
};

export const siteConfig = {
  description:
    "Japan Life 是面向在日生活者的生活助手，提供天气、日历、汇率、工资、工时、房租、地区、优惠、推荐 App 和生活提醒。",
  name: "Japan Life",
  ogImage: "/icon-512.png",
  title: "Japan Life｜在日生活助手",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://japanlife-app.com",
};

export const pageSeo = {
  apps: {
    description: "整理日本生活常用 App，包括交通、支付、购物、翻译、天气和生活工具。",
    path: "/apps",
    title: "日本生活推荐 App｜Japan Life",
  },
  areaCompare: {
    description: "对比日本不同地区的房租、交通、生活便利度和生活成本。",
    path: "/tools/area-compare",
    title: "日本地区生活对比｜Japan Life",
  },
  deals: {
    description: "查看日本生活相关优惠、推广和省钱信息。",
    path: "/deals",
    title: "日本优惠推荐｜Japan Life",
  },
  exchange: {
    description: "快速换算日元与常用货币，方便日本生活预算规划。",
    path: "/tools/exchange",
    title: "日元汇率换算｜Japan Life",
  },
  fallbackArea: {
    description: "查看日本地区生活信息，包括房租、交通、便利度和生活建议。",
    title: "日本地区生活指南｜Japan Life",
  },
  fallbackArticle: {
    description: siteConfig.description,
    title: "日本生活文章｜Japan Life",
  },
  garbageCalendar: {
    description: "查看日本节假日、日历提醒和生活日程。",
    path: "/tools/holidays",
    title: "日本日历｜Japan Life",
  },
  home: {
    description: siteConfig.description,
    path: "/",
    title: siteConfig.title,
  },
  rent: {
    description: "根据收入和生活成本评估日本租房预算，帮助判断房租是否合理。",
    path: "/tools/rent",
    title: "日本房租评估｜Japan Life",
  },
  salary: {
    description: "估算日本工资税后收入、到手金额和社会保险负担。",
    path: "/tools/salary",
    title: "日本工资计算器｜Japan Life",
  },
};

export function createCanonicalUrl(path = "/") {
  const base = siteConfig.url.replace(/\/+$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  if (normalizedPath === "/") return base;
  return `${base}${normalizedPath.replace(/\/+$/, "")}`;
}

export function createMetadata({
  description = siteConfig.description,
  image = siteConfig.ogImage,
  keywords,
  noIndex = false,
  path = "/",
  title = siteConfig.title,
  type = "website",
}: CreateMetadataOptions = {}): Metadata {
  const canonical = createCanonicalUrl(path);
  const imageUrl = image.startsWith("http") ? image : createCanonicalUrl(image);

  return {
    alternates: {
      canonical,
      languages: {
        "ja-JP": canonical,
        "zh-CN": canonical,
        "zh-TW": canonical,
      },
    },
    applicationName: siteConfig.name,
    description,
    keywords,
    metadataBase: new URL(siteConfig.url),
    openGraph: {
      alternateLocale: ["ja_JP", "zh_TW"],
      description,
      images: [{ alt: "Japan Life 在日生活助手", height: 512, url: imageUrl, width: 512 }],
      locale: "zh_CN",
      siteName: siteConfig.name,
      title,
      type,
      url: canonical,
    },
    robots: {
      follow: !noIndex,
      index: !noIndex,
    },
    title,
    twitter: {
      card: "summary",
      description,
      images: [imageUrl],
      title,
    },
  };
}
