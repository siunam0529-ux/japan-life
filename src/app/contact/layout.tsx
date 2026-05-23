import type { ReactNode } from "react";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "反馈与合作｜Japan Life",
  description: "联系 Japan Life，反馈日本生活工具、地区信息、优惠、店铺内容相关问题，也可咨询合作与推荐。",
  keywords: ["Japan Life 联系", "Japan Life 合作", "日本生活反馈"],
  path: "/contact",
});

export default function ContactLayout({ children }: { children: ReactNode }) {
  return children;
}
