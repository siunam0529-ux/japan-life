import type { Metadata } from "next";
import { getCommunityPostById } from "@/lib/community/repository";
import { createCanonicalUrl, siteConfig } from "@/lib/seo";
import { isCommunityViewLocale, type CommunityViewLocale } from "@/lib/community/types";

const siteName = "Japan Life";
const baseTitle = "Japan Life 生活社区";
const baseDescription = "在 Japan Life 生活社区分享日本生活经验、折扣福利、闲置、搭子和交友动态，连接在日生活者、留学生和工作者。";

type CommunityMetadataInput = {
  description?: string;
  image?: string;
  noIndex?: boolean;
  path?: string;
  title?: string;
  type?: "article" | "website";
};

export const communitySelectionSeo = {
  description: baseDescription,
  title: baseTitle,
};

export function isCommunityMetadataLocale(value: string): value is CommunityViewLocale {
  return isCommunityViewLocale(value);
}

export function createCommunityMetadata(input: CommunityMetadataInput = {}): Metadata {
  const title = input.title || baseTitle;
  const description = input.description || baseDescription;
  const image = input.image || "/images/og/community-og.png";
  const path = input.path || "/community/all";
  const canonical = createCanonicalUrl(path);
  const imageUrl = image.startsWith("http") ? image : createCanonicalUrl(image);

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
    description,
    metadataBase: new URL(siteConfig.url),
    openGraph: {
      description,
      images: [{ alt: "Japan Life 生活社区", height: 630, url: imageUrl, width: 1200 }],
      siteName,
      title,
      type: input.type || "website",
      url: canonical,
    },
    robots: input.noIndex ? { follow: false, index: false } : undefined,
    title,
    twitter: {
      card: "summary_large_image",
      description,
      images: [imageUrl],
      title,
    },
  };
}

export function createCommunityNoIndexMetadata(title: string, description = baseDescription, path = "/community/all"): Metadata {
  return createCommunityMetadata({ description, noIndex: true, path, title });
}

export function createCommunityViewMetadata(locale: CommunityViewLocale): Metadata {
  const suffix = locale === "all" ? "All" : locale;
  return createCommunityMetadata({
    description: baseDescription,
    path: `/community/${locale}`,
    title: locale === "all" ? baseTitle : `${baseTitle}｜${suffix}`,
  });
}

export function createCommunityTopicMetadata(tag: string, locale: CommunityViewLocale): Metadata {
  const cleanTag = decodeURIComponent(tag).replace(/^#+/, "").trim();
  return createCommunityMetadata({
    description: `查看 Japan Life 生活社区关于 #${cleanTag} 的日本生活帖子、经验、折扣福利和交流内容。`,
    path: `/community/${locale}/topic/${encodeURIComponent(cleanTag)}`,
    title: `#${cleanTag}｜${baseTitle}`,
  });
}

export async function createCommunityPostMetadata(id: string, locale: CommunityViewLocale): Promise<Metadata> {
  const result = await getCommunityPostById(id, locale);
  const post = result.data;
  if (!post) {
    return createCommunityMetadata({
      description: baseDescription,
      path: `/community/${locale}/${id}`,
      title: baseTitle,
      type: "article",
    });
  }

  const description = post.content.trim() ? post.content.replace(/\s+/g, " ").slice(0, 150) : baseDescription;
  return createCommunityMetadata({
    description,
    path: `/community/${locale}/${id}`,
    title: `${post.title}｜${baseTitle}`,
    type: "article",
  });
}
