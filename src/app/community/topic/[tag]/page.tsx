import { CommunityTopicPageClient } from "@/components/community/CommunityTopicPageClient";
import { createCommunityTopicMetadata } from "@/lib/community/seo";

export async function generateMetadata({ params }: { params: Promise<{ tag: string }> }) {
  const { tag } = await params;
  return createCommunityTopicMetadata(tag, "all");
}

export default async function CommunityTopicPage({ params }: { params: Promise<{ tag: string }> }) {
  const { tag } = await params;
  return <CommunityTopicPageClient locale="all" tag={decodeURIComponent(tag)} />;
}
