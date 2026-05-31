import type { ReactNode } from "react";
import { createCommunityPostMetadata, isCommunityMetadataLocale } from "@/lib/community/seo";

export async function generateMetadata({ params }: { params: Promise<{ id: string; locale: string }> }) {
  const { id, locale } = await params;
  if (!isCommunityMetadataLocale(locale)) {
    return createCommunityPostMetadata(id, "all");
  }
  return createCommunityPostMetadata(id, locale);
}

export default function CommunityPostDetailLayout({ children }: { children: ReactNode }) {
  return children;
}
