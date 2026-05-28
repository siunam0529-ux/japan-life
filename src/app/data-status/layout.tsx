import type { ReactNode } from "react";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "数据来源与状态｜Japan Life",
  description: "查看 Japan Life 使用的真实 API、本地参考数据、备用数据和用户需要确认的信息范围。",
  path: "/data-status",
});

export default function DataStatusLayout({ children }: { children: ReactNode }) {
  return children;
}
