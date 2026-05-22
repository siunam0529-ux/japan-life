import type { ReactNode } from "react";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "关于 Japan Life｜在日生活工具 App",
  description: "了解 Japan Life 的产品定位：面向在日生活者，提供日本生活工具、地区信息、日历提醒和生活参考。",
  path: "/about",
});

export default function AboutLayout({ children }: { children: ReactNode }) {
  return children;
}
