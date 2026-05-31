import type { ReactNode } from "react";
import { createCommunityNoIndexMetadata } from "@/lib/community/seo";

export const metadata = createCommunityNoIndexMetadata(
  "我的社区 | Japan Life",
  "查看你在 Japan Life 社区里的帖子、收藏和申请。",
  "/community/me",
);

export default function CommunityMeLayout({ children }: { children: ReactNode }) {
  return children;
}
