import type { ReactNode } from "react";
import { createCommunityNoIndexMetadata } from "@/lib/community/seo";

export const metadata = createCommunityNoIndexMetadata(
  "发布社区内容 | Japan Life",
  "发布 Japan Life 社区内容。",
  "/community/all/new",
);

export default function CommunityNewPostLayout({ children }: { children: ReactNode }) {
  return children;
}
