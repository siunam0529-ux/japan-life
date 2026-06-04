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
  "日本生活",
  "在日生活",
  "日本生活助手",
  "日本留学",
  "日本工作",
  "日本打工",
  "日本租房",
  "东京租房",
  "日本工资计算",
  "日元汇率",
  "日本天气",
  "日本日历",
  "日本节假日",
  "在留卡提醒",
  "日本手续",
  "日本生活社区",
  "外国人友好店铺",
  "Japan lifestyle app",
  "Japan life tools",
  "life in Japan",
  "Japan travel and living",
  "日本生活アプリ",
  "日本生活便利ツール",
];

export const siteConfig = {
  description:
    "Japan Life 是面向在日生活者、留学生和工作者的日本生活助手，整合天气、交通、日历、生活提醒、日元汇率、工资计算、租房助手、手续导航、生活社区和外国人友好店铺。",
  name: "Japan Life",
  ogImage: "/images/og/japan-life-og.png",
  title: "Japan Life｜日本生活助手・在日生活工具",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://japan-life.vercel.app",
};

export const pageSeo = {
  apps: {
    description: "整理在日本生活常用 App，覆盖交通、支付、购物、翻译、天气和生活工具，适合刚到日本、留学、工作或长期在日生活的人参考。",
    keywords: ["日本生活 App", "日本常用 App", "日本交通 App", "日本支付 App", "日本留学 App", "日本必备 App"],
    path: "/apps",
    title: "日本生活常用 App 推荐｜Japan Life",
  },
  areaCompare: {
    description: "对比东京 23 区和热门车站的房租、交通、生活便利度、工资和生活成本，帮助你选择更适合自己的居住区域。",
    keywords: ["日本地区对比", "东京租房", "东京23区", "日本房租", "日本生活成本", "东京生活区域"],
    path: "/tools/area-compare",
    title: "东京地区生活对比｜房租・交通・生活成本｜Japan Life",
  },
  exchange: {
    description: "快速换算日元与人民币、美元等常用货币，适合日本生活预算、汇款、工资和日常消费参考。",
    keywords: ["日元汇率", "日元换算", "日元人民币", "日本汇率工具", "JPY CNY"],
    path: "/tools/exchange",
    title: "日元汇率换算｜Japan Life",
  },
  fallbackArea: {
    description: "查看日本地区生活信息，包含房租、交通、便利度、生活成本和居住建议。",
    keywords: ["日本地区生活", "日本租房区域", "东京生活指南"],
    title: "日本地区生活指南｜Japan Life",
  },
  fallbackArticle: {
    description: siteConfig.description,
    keywords: defaultKeywords,
    title: "日本生活文章｜Japan Life",
  },
  garbageCalendar: {
    description: "查看日本节假日、生活日历、缴费、手续、考试活动和生活日程提醒，方便安排工作、出行、手续和日常生活。",
    keywords: ["日本日历", "日本节假日", "日本祝日", "日本生活日历", "日本生活提醒"],
    path: "/tools/holidays",
    title: "日本日历｜节假日・生活提醒｜Japan Life",
  },
  home: {
    description: siteConfig.description,
    keywords: defaultKeywords,
    path: "/",
    title: siteConfig.title,
  },
  lifeAlerts: {
    description: "集中查看日本生活提醒，包含天气、交通、行政福利政策、签证在留、日历、缴费和个人待办。",
    keywords: ["日本生活提醒", "日本待办", "天气提醒", "交通提醒", "在留提醒", "日本生活中心"],
    path: "/life-alerts",
    title: "日本生活提醒中心｜天气・交通・签证・缴费｜Japan Life",
  },
  rent: {
    description: "根据东京热门车站、房型、面积、步行时间、楼龄和楼层估算参考租金，并结合地区对比、生活成本和工资信息辅助租房判断。",
    keywords: ["日本房租", "东京房租", "日本租房预算", "房租评估", "东京车站租金", "日本租房工具"],
    path: "/tools/rent",
    title: "日本租房助手｜房租评估・东京地区对比｜Japan Life",
  },
  salary: {
    description: "估算日本工资税后收入、到手金额和社会保险负担，帮助在日工作者和留学生规划收入预算。",
    keywords: ["日本工资计算", "日本税后工资", "日本到手工资", "日本社会保险", "日本打工工资"],
    path: "/tools/salary",
    title: "日本工资计算器｜税后收入・到手工资｜Japan Life",
  },
  trainStatus: {
    description: "查看东京常用电车线路参考状态，适合通勤、出门前确认和生活提醒联动。",
    keywords: ["东京电车", "日本电车", "东京交通", "电车延误", "山手线", "中央线", "东京 Metro"],
    path: "/tools/train-status",
    title: "东京交通状态｜常用电车线路提醒｜Japan Life",
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
        "zh-CN": canonical,
        "zh-TW": canonical,
        "ja-JP": canonical,
        "x-default": canonical,
      },
    },
    applicationName: siteConfig.name,
    authors: [{ name: "Japan Life" }],
    category: "lifestyle",
    creator: "Japan Life",
    description,
    appleWebApp: {
      capable: true,
      statusBarStyle: "default",
      title: siteConfig.name,
    },
    formatDetection: {
      address: false,
      email: false,
      telephone: false,
    },
    keywords: mergedKeywords,
    metadataBase: new URL(siteConfig.url),
    openGraph: {
      alternateLocale: ["zh_TW", "ja_JP", "en_US"],
      description,
      images: [{ alt: "Japan Life 日本生活助手", height: 630, url: imageUrl, width: 1200 }],
      locale: "zh_CN",
      siteName: siteConfig.name,
      title,
      type,
      url: canonical,
    },
    publisher: "Japan Life",
    referrer: "origin-when-cross-origin",
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
      card: "summary_large_image",
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
    inLanguage: ["zh-CN", "zh-TW", "ja-JP", "en"],
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
    inLanguage: ["zh-CN", "zh-TW", "ja-JP", "en"],
    name: siteConfig.name,
    potentialAction: {
      "@type": "SearchAction",
      query: "required name=search_term_string",
      target: `${siteConfig.url.replace(/\/+$/, "")}/search?q={search_term_string}`,
    },
    url: siteConfig.url,
  };
}
