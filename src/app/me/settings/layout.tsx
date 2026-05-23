import type { ReactNode } from "react";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "App 设置｜Japan Life",
  description: "管理 Japan Life 的通知、本地数据备份、导入导出和本机数据清除。",
  path: "/me/settings",
  noIndex: true,
});

export default function SettingsLayout({ children }: { children: ReactNode }) {
  return children;
}
