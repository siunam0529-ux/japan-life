import type { ReactNode } from "react";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "联系我们｜Japan Life",
  description: "联系 Japan Life 团队，反馈日本生活工具、地区信息、优惠和店铺内容相关问题。",
  path: "/contact",
});

export default function ContactLayout({ children }: { children: ReactNode }) {
  return children;
}
