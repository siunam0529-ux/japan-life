import type { ReactNode } from "react";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "数据来源与状态｜Japan Life",
  description: "查看 Japan Life 使用的真实 API、本地参考资料和需要用户确认的信息范围。",
  path: "/data-status",
});

export default function DataStatusLayout({ children }: { children: ReactNode }) {
  return children;
}
