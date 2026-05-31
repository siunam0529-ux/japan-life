import type { ReactNode } from "react";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "生活帮手｜Japan Life",
  description: "找附近的人帮你处理清洁、搬运、跑腿、陪同手续、翻译和其他生活小事。",
  keywords: ["生活帮手", "暮らしサポート", "在日生活", "附近帮忙", "Japan Life"],
  path: "/life-helper",
});

export default function LifeHelperLayout({ children }: { children: ReactNode }) {
  return children;
}
