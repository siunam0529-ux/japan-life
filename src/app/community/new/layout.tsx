import type { ReactNode } from "react";
import { createCommunityNoIndexMetadata } from "@/lib/community/seo";

export const metadata = createCommunityNoIndexMetadata(
  "发布社区内容 | Japan Life",
  "发布 Japan Life 社区内容。",
  "/community/new",
);

export default function CommunityNewRedirectLayout({ children }: { children: ReactNode }) {
  return children;
}
