import type { ReactNode } from "react";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "日本生活搜索｜Japan Life",
  description: "搜索 Japan Life 的日本生活工具、地区信息、日历、垃圾分类、优惠和常用 App。",
  path: "/search",
});

export default function SearchLayout({ children }: { children: ReactNode }) {
  return children;
}
