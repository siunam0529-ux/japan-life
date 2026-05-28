import type { ReactNode } from "react";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "审核说明｜Japan Life",
  description: "Japan Life 的 App Store 审核说明、测试账号准备项、核心页面和数据来源说明。",
  noIndex: true,
  path: "/app-review",
});

export default function AppReviewLayout({ children }: { children: ReactNode }) {
  return children;
}
