import type { ReactNode } from "react";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "通知 | Japan Life",
  description: "查看 Japan Life 的社区、生活帮手和生活提醒消息。",
  path: "/notifications",
  noIndex: true,
});

export default function NotificationsLayout({ children }: { children: ReactNode }) {
  return children;
}
