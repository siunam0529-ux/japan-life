import type { ReactNode } from "react";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "使用条款｜Japan Life",
  description: "Japan Life 的使用条款和服务说明，包含工具参考、用户提交内容、账号同步和服务调整说明。",
  keywords: ["Japan Life 使用条款", "服务条款", "日本生活工具"],
  path: "/terms",
});

export default function TermsLayout({ children }: { children: ReactNode }) {
  return children;
}
