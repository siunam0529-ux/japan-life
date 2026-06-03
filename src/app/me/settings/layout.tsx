import type { ReactNode } from "react";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "App 设置｜Japan Life",
  description: "管理 Japan Life 的账号、通知、隐私、收藏、消息、本地数据和存储空间。",
  path: "/me/settings",
  noIndex: true,
});

export default function SettingsLayout({ children }: { children: ReactNode }) {
  return children;
}
