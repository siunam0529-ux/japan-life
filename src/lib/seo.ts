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

export const defaultKeywords = [
  "Japan Life",
  "在日生活",
  "日本生活",
  "日本留学",
  "日本打工",
  "日本天气",
  "日本日历",
  "日元汇率",
  "工资计算",
  "工时记录",
  "房租评估",
  "在留卡提醒",
  "东京生活",
  "日本生活助手",
  "Japan lifestyle app",
];

export const siteConfig = {
  description:
    "Japan Life 是面向在日生活者、留学生和工作者的生活助手，提供天气、日历、汇率、工资、工时、房租、地区、优惠、推荐 App、友好店铺和生活提醒。",
  name: "Japan Life",
  ogImage: "/icon-512.png",
  title: "Japan Life｜在日生活助手",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://japan-life.vercel.app",
};

export const pageSeo = {
  apps: {
    description: "整理日本生活常用 App，包括交通、支付、购物、翻译、天气、优惠和生活工具，适合刚到日本或长期在日生活的人参考。",
    keywords: ["日本生活 App", "日本常用 App", "日本交通 App", "日本支付 App", "日本留学 App"],
    path: "/apps",
    title: "日本生活推荐 App｜Japan Life",
  },
  areaCompare: {
    description: "对比东京及日本不同地区的房租、交通、生活便利度和生活成本，帮助选择更适合自己的居住区域。",
    keywords: ["日本地区对比", "东京租房", "日本房租", "日本生活成本", "东京生活区域"],
    path: "/tools/area-compare",
    title: "日本地区生活对比｜房租・交通・生活成本｜Japan Life",
  },
  deals: {
    description: "查看日本生活相关优惠、推广和省钱信息，包括生活服务、实用链接和在日生活推荐资源。",
    keywords: ["日本优惠", "日本生活优惠", "在日省钱", "日本推广链接"],
    path: "/deals",
    title: "日本优惠推荐｜Japan Life",
  },
  exchange: {
    description: "快速换算日元与人民币、美元等常用货币，方便日本生活预算、汇款和日常消费参考。",
    keywords: ["日元汇率", "日元换算", "日元人民币", "日本汇率工具"],
    path: "/tools/exchange",
    title: "日元汇率换算｜Japan Life",
  },
  fallbackArea: {
    description: "查看日本地区生活信息，包括房租、交通、便利度、生活成本和居住建议。",
    keywords: ["日本地区生活", "日本租房区域", "东京生活指南"],
    title: "日本地区生活指南｜Japan Life",
  },
  fallbackArticle: {
    description: siteConfig.description,
    keywords: defaultKeywords,
    title: "日本生活文章｜Japan Life",
  },
  garbageCalendar: {
    description: "查看日本节假日、日历提醒、生活日程和特殊日期，方便安排工作、出行、缴费和生活计划。",
    keywords: ["日本日历", "日本节假日", "日本祝日", "日本生活日历"],
    path: "/tools/holidays",
    title: "日本日历｜节假日・生活提醒｜Japan Life",
  },
  home: {
    description: siteConfig.description,
    keywords: defaultKeywords,
    path: "/",
    title: siteConfig.title,
  },
  rent: {
    description: "根据收入和生活成本评估日本租房预算，帮助判断房租是否合理，适合留学、工作和搬家前参考。",
    keywords: ["日本房租", "东京房租", "日本租房预算", "房租评估"],
    path: "/tools/rent",
    title: "日本房租评估｜Japan Life",
  },
  salary: {
    description: "估算日本工资税后收入、到手金额和社会保险负担，帮助在日工作者和留学生规划收入预算。",
    keywords: ["日本工资计算", "日本税后工资", "日本到手工资", "日本社会保险"],
    path: "/tools/salary",
    title: "日本工资计算器｜税后收入・到手工资｜Japan Life",
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
  keywords = defaultKeywords,
  noIndex = false,
  path = "/",
  title = siteConfig.title,
  type = "website",
}: CreateMetadataOptions = {}): Metadata {
  const canonical = createCanonicalUrl(path);
  const imageUrl = image.startsWith("http") ? image : createCanonicalUrl(image);
  const mergedKeywords = Array.from(new Set([...keywords, ...defaultKeywords]));

  return {
    alternates: {
      canonical,
      languages: {
        "ja-JP": canonical,
        "zh-CN": canonical,
        "zh-TW": canonical,
        "x-default": canonical,
      },
    },
    applicationName: siteConfig.name,
    authors: [{ name: "Japan Life" }],
    category: "lifestyle",
    creator: "Japan Life",
    description,
    formatDetection: {
      address: false,
      email: false,
      telephone: false,
    },
    keywords: mergedKeywords,
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
    publisher: "Japan Life",
    robots: {
      follow: !noIndex,
      googleBot: {
        follow: !noIndex,
        index: !noIndex,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
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

export function createSoftwareApplicationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    applicationCategory: "LifestyleApplication",
    description: siteConfig.description,
    inLanguage: ["zh-CN", "zh-TW", "ja-JP"],
    name: siteConfig.name,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "JPY",
    },
    operatingSystem: "Web, iOS",
    url: siteConfig.url,
  };
}

export function createWebSiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    description: siteConfig.description,
    inLanguage: ["zh-CN", "zh-TW", "ja-JP"],
    name: siteConfig.name,
    potentialAction: {
      "@type": "SearchAction",
      query: "required name=search_term_string",
      target: `${siteConfig.url.replace(/\/+$/, "")}/search?q={search_term_string}`,
    },
    url: siteConfig.url,
  };
}
