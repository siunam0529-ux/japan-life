import { notFound, redirect } from "next/navigation";
import { CommunityFeed } from "@/components/community/CommunityFeed";
import { createCommunityViewMetadata } from "@/lib/community/seo";
import { isCommunityViewLocale } from "@/lib/community/types";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isCommunityViewLocale(locale)) return {};
  return createCommunityViewMetadata(locale);
}

export default async function CommunityLocalePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isCommunityViewLocale(locale)) notFound();
  if (locale !== "all") redirect("/community/all");
  return <CommunityFeed locale={locale} />;
}
