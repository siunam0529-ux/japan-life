import type { ReactNode } from "react";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "日本生活资源｜政策福利・官方链接｜Japan Life",
  description: "整理日本生活相关的政策福利、官方信息、手续资源和实用链接，方便在日生活者快速查找。",
  keywords: ["日本生活资源", "日本政策福利", "日本官方链接", "在日手续"],
  path: "/resources",
});

export default function ResourcesLayout({ children }: { children: ReactNode }) {
  return children;
}
