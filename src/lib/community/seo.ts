import type { Metadata } from "next";
import { getCommunityPostById } from "@/lib/community/repository";
import { isCommunityViewLocale, type CommunityViewLocale } from "@/lib/community/types";

const siteName = "Japan Life";
const baseTitle = "Japan Life Community";
const baseDescription = "Community posts about life in Japan, help, secondhand items, buddies, and local tips.";

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
  const image = input.image || "/og/community.png";
  const path = input.path || "/community/all";

  return {
    description,
    metadataBase: new URL("https://japan-life.example.com"),
    openGraph: {
      description,
      images: [{ url: image }],
      siteName,
      title,
      type: input.type || "website",
      url: path,
    },
    robots: input.noIndex ? { follow: false, index: false } : undefined,
    title,
    twitter: {
      card: "summary_large_image",
      description,
      images: [image],
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
    title: `${baseTitle} - ${suffix}`,
  });
}

export function createCommunityTopicMetadata(tag: string, locale: CommunityViewLocale): Metadata {
  const cleanTag = decodeURIComponent(tag).replace(/^#+/, "").trim();
  return createCommunityMetadata({
    description: `Explore Japan Life community posts about #${cleanTag}.`,
    path: `/community/${locale}/topic/${encodeURIComponent(cleanTag)}`,
    title: `#${cleanTag} | ${baseTitle}`,
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

  const description = post.content.trim() ? post.content.slice(0, 150) : baseDescription;
  return createCommunityMetadata({
    description,
    path: `/community/${locale}/${id}`,
    title: `${post.title} | ${baseTitle}`,
    type: "article",
  });
}
