import type { Metadata } from "next";
import { communityMockPosts } from "@/lib/community/mock";
import { getCommunityPostById } from "@/lib/community/repository";
import { isPostInCommunityView } from "@/lib/community/routes";
import { isCommunityViewLocale, type CommunityPost, type CommunityPostImage, type CommunityViewLocale } from "@/lib/community/types";

type CommunityMetadataOptions = {
  description: string;
  image?: string;
  noIndex?: boolean;
  openGraphDescription?: string;
  path: string;
  title: string;
  type?: "article" | "website";
};

const communityDefaultDescription = "查看 Japan Life 社区里的在日生活内容。";
export const communityDefaultOgImage = "/images/og/community-og.png";

export const communityViewSeo: Record<CommunityViewLocale, { description: string; title: string }> = {
  all: {
    description: "同时浏览简中、繁中、日本語社区的在日生活动态。",
    title: "全部社区 | Japan Life",
  },
  ja: {
    description: "日本語で在日生活情報を共有できるコミュニティ。",
    title: "日本語コミュニティ | Japan Life",
  },
  "zh-cn": {
    description: "中国大陆用户在日生活交流，分享生活、求助、闲置和同城搭子。",
    title: "简中社区 | Japan Life",
  },
  "zh-tw": {
    description: "香港、台灣、澳門用戶在日生活交流，分享生活資訊、二手、求助和搭子。",
    title: "繁中社區 | Japan Life",
  },
};

export const communitySelectionSeo = {
  description: "选择语言社区，浏览在日生活分享、求助、闲置、搭子和生活信息。",
  title: "社区 | Japan Life",
};

export const communityPostFallbackSeo = {
  description: communityDefaultDescription,
  title: "社区内容 | Japan Life",
};

export function createCommunityMetadata({
  description,
  image = communityDefaultOgImage,
  noIndex = false,
  openGraphDescription,
  path,
  title,
  type = "website",
}: CommunityMetadataOptions): Metadata {
  const siteUrl = getConfiguredSiteUrl();
  const canonical = siteUrl ? createCommunityAbsoluteUrl(path, siteUrl) : undefined;
  const imageUrl = toCommunityImageUrl(image, siteUrl);

  return {
    ...(siteUrl ? { metadataBase: new URL(siteUrl) } : {}),
    ...(canonical ? { alternates: { canonical } } : {}),
    applicationName: "Japan Life",
    authors: [{ name: "Japan Life" }],
    category: "community",
    creator: "Japan Life",
    description,
    openGraph: {
      description: openGraphDescription ?? description,
      images: [{ alt: "Japan Life 社区分享卡片", height: 630, url: imageUrl, width: 1200 }],
      locale: "zh_CN",
      siteName: "Japan Life",
      title,
      type,
      ...(canonical ? { url: canonical } : {}),
    },
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

export function createCommunityViewMetadata(locale: CommunityViewLocale) {
  const copy = communityViewSeo[locale];
  return createCommunityMetadata({
    description: copy.description,
    path: `/community/${locale}`,
    title: copy.title,
  });
}

export function createCommunityTopicMetadata(tag: string, locale: CommunityViewLocale = "all") {
  const cleanTag = decodeURIComponent(tag).replace(/^#+/, "").trim();
  const title = `#${cleanTag} | Japan Life 社区`;

  return createCommunityMetadata({
    description: `查看 Japan Life 社区中关于 #${cleanTag} 的在日生活内容。`,
    openGraphDescription: "生活分享、求助、闲置、搭子和在日生活经验。",
    path: `/community/${locale}/topic/${encodeURIComponent(cleanTag)}`,
    title,
  });
}

export async function createCommunityPostMetadata(id: string, locale: CommunityViewLocale): Promise<Metadata> {
  const post = await getPostForMetadata(id, locale);

  if (!post) {
    return createCommunityMetadata({
      description: communityPostFallbackSeo.description,
      path: `/community/${locale}/${id}`,
      title: communityPostFallbackSeo.title,
      type: "article",
    });
  }

  const description = truncateDescription(post.content, "Japan Life 社区里的在日生活分享、求助、闲置和搭子内容。");

  return createCommunityMetadata({
    description,
    image: getPostOgImage(post),
    path: `/community/${locale}/${id}`,
    title: `${post.title} | Japan Life 社区`,
    type: "article",
  });
}

export function createCommunityNoIndexMetadata(title: string, description: string, path: string) {
  return createCommunityMetadata({
    description,
    noIndex: true,
    path,
    title,
  });
}

async function getPostForMetadata(id: string, locale: CommunityViewLocale) {
  try {
    const result = await getCommunityPostById(id, locale);
    if (result.data) return result.data;
  } catch {
    // Metadata must not break build or page rendering if Supabase is unavailable.
  }

  return communityMockPosts.find((post) => post.id === id && post.status === "published" && isPostInCommunityView(post, locale)) ?? null;
}

function getPostOgImage(post: CommunityPost) {
  const image = post.images?.[0];
  return getCommunityImageUrl(image) ?? communityDefaultOgImage;
}

function getCommunityImageUrl(image: CommunityPostImage | undefined) {
  if (!image) return "";
  if (typeof image === "string") return image;
  if ("url" in image && image.url) return image.url;
  return "";
}

function truncateDescription(value: string, fallback: string) {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (!normalized) return fallback;
  return normalized.length > 110 ? `${normalized.slice(0, 110)}...` : normalized;
}

function toCommunityImageUrl(image: string, siteUrl: string | null) {
  if (/^https?:\/\//i.test(image)) return image;
  if (siteUrl) return createCommunityAbsoluteUrl(image, siteUrl);
  return image;
}

function createCommunityAbsoluteUrl(path: string, siteUrl: string) {
  const base = siteUrl.replace(/\/+$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return normalizedPath === "/" ? base : `${base}${normalizedPath.replace(/\/+$/, "")}`;
}

function getConfiguredSiteUrl() {
  const value = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return value;
  } catch {
    return null;
  }
}

export function isCommunityMetadataLocale(value: string): value is CommunityViewLocale {
  return isCommunityViewLocale(value);
}
