import type { ReactNode } from "react";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "消息｜Japan Life",
  description: "查看 Japan Life 的私信、社区互动、生活帮手和官方通知。",
  path: "/notifications",
  noIndex: true,
});

export default function NotificationsLayout({ children }: { children: ReactNode }) {
  return children;
}
