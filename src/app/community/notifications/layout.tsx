import type { ReactNode } from "react";
import { createCommunityNoIndexMetadata } from "@/lib/community/seo";

export const metadata = createCommunityNoIndexMetadata(
  "消息通知 | Japan Life",
  "查看你的 Japan Life 社区消息通知。",
  "/community/notifications",
);

export default function CommunityNotificationsLayout({ children }: { children: ReactNode }) {
  return children;
}
