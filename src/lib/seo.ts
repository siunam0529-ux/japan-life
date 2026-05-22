import type { Metadata } from "next";

type MetadataType = "website" | "article";

type CreateMetadataOptions = {
  title?: string;
  description?: string;
  path?: string;
  image?: string;
  type?: MetadataType;
  noIndex?: boolean;
  keywords?: string[];
};

export const siteConfig = {
  name: "Japan Life",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://japanlife-app.com",
  title: "Japan Life｜在日生活をもっと便利に",
  description:
    "Japan Life 是面向在日生活者的日本生活工具 App，支持中文与日文用户，提供日本日历、垃圾收集日、工资计算、房租评估、汇率换算、地区信息、政策福利等功能，让日本生活更方便。",
  ogImage: "/og-image.png",
};

export const pageSeo = {
  home: {
    title: "Japan Life｜在日生活をもっと便利に",
    description: "面向在日生活者的日本生活工具 App。查看日本日历、垃圾收集日、工资计算、房租评估、汇率换算、地区信息和生活提醒。",
    path: "/",
  },
  salary: {
    title: "日本工资计算器｜税后收入与手取り估算｜Japan Life",
    description: "快速估算日本工资的税后收入、手取り金额和社会保险负担，适合在日本工作、打工和求职前参考。",
    path: "/tools/salary",
  },
  rent: {
    title: "日本房租评估工具｜租房预算参考｜Japan Life",
    description: "根据收入和生活成本评估日本租房预算，帮助在日本生活的人判断房租是否合理。",
    path: "/tools/rent",
  },
  exchange: {
    title: "日元汇率换算｜JPY 生活换算工具｜Japan Life",
    description: "快速换算日元与常用货币，方便在日本生活、消费、汇款和预算规划。",
    path: "/tools/exchange",
  },
  garbageCalendar: {
    title: "日本垃圾收集日历｜ごみ収集日提醒｜Japan Life",
    description: "查看日本垃圾收集日程和分类提醒，管理可燃垃圾、资源垃圾、塑料垃圾和不可燃垃圾日期。",
    path: "/tools/holidays",
  },
  areaCompare: {
    title: "日本地区生活对比｜房租・交通・生活成本｜Japan Life",
    description: "对比日本不同地区的房租、交通、生活便利度和生活成本，帮助选择更适合居住的地区。",
    path: "/tools/area-compare",
  },
  apps: {
    title: "日本生活推荐 App｜在日必备工具整理｜Japan Life",
    description: "整理日本生活常用 App，包括交通、支付、外卖、购物、翻译、天气和生活工具，适合在日本生活的人参考。",
    path: "/apps",
  },
  deals: {
    title: "日本优惠推荐｜生活省钱信息｜Japan Life",
    description: "查看日本生活相关优惠和省钱信息，涵盖通信、购物、出行、订阅服务和日常生活。",
    path: "/deals",
  },
  fallbackArea: {
    title: "日本地区生活指南｜Japan Life",
    description: "查看日本地区的生活信息，包括垃圾收集日、房租参考、交通便利度、生活成本和日本生活建议。",
  },
  fallbackArticle: {
    title: "日本生活文章｜Japan Life",
    description: siteConfig.description,
  },
};

export function createCanonicalUrl(path = "/") {
  const base = siteConfig.url.replace(/\/+$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  if (normalizedPath === "/") return base;
  return `${base}${normalizedPath.replace(/\/+$/, "")}`;
}

export function createMetadata({
  title = siteConfig.title,
  description = siteConfig.description,
  path = "/",
  image = siteConfig.ogImage,
  type = "website",
  noIndex = false,
  keywords,
}: CreateMetadataOptions = {}): Metadata {
  const canonical = createCanonicalUrl(path);
  const imageUrl = image.startsWith("http") ? image : createCanonicalUrl(image);

  return {
    metadataBase: new URL(siteConfig.url),
    title,
    description,
    applicationName: siteConfig.name,
    keywords,
    alternates: {
      canonical,
      languages: {
        "zh-CN": canonical,
        "ja-JP": canonical,
      },
    },
    robots: {
      index: !noIndex,
      follow: !noIndex,
    },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: siteConfig.name,
      locale: "zh_CN",
      alternateLocale: ["ja_JP"],
      type,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: `${siteConfig.name} - 在日生活をもっと便利に`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
    },
  };
}
