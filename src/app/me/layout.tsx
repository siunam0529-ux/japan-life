import type { ReactNode } from "react";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "账号中心｜Japan Life",
  description: "管理 Japan Life 的收藏、提醒中心、App 设置和本机保存数据。",
  path: "/me",
  noIndex: true,
});

export default function MeLayout({ children }: { children: ReactNode }) {
  return children;
}
