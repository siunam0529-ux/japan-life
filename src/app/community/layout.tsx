import type { ReactNode } from "react";
import { createCommunityMetadata, communitySelectionSeo } from "@/lib/community/seo";

export const metadata = createCommunityMetadata({
  description: communitySelectionSeo.description,
  path: "/community",
  title: communitySelectionSeo.title,
});

export default function CommunityLayout({ children }: { children: ReactNode }) {
  return children;
}
