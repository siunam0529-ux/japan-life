import type { ReactNode } from "react";
import { createCommunityNoIndexMetadata } from "@/lib/community/seo";

export const metadata = createCommunityNoIndexMetadata(
  "我的社区资料 | Japan Life",
  "管理你的 Japan Life 社区资料。",
  "/community/profile",
);

export default function CommunityProfileLayout({ children }: { children: ReactNode }) {
  return children;
}
