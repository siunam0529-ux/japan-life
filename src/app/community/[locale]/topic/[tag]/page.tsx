import { notFound } from "next/navigation";
import { CommunityTopicPageClient } from "@/components/community/CommunityTopicPageClient";
import { createCommunityTopicMetadata } from "@/lib/community/seo";
import { isCommunityViewLocale } from "@/lib/community/types";

export async function generateMetadata({ params }: { params: Promise<{ locale: string; tag: string }> }) {
  const { locale, tag } = await params;
  if (!isCommunityViewLocale(locale)) return {};
  return createCommunityTopicMetadata(tag, locale);
}

export default async function CommunityLocaleTopicPage({ params }: { params: Promise<{ locale: string; tag: string }> }) {
  const { locale, tag } = await params;
  if (!isCommunityViewLocale(locale)) notFound();
  return <CommunityTopicPageClient locale={locale} tag={decodeURIComponent(tag)} />;
}
