import type { ReactNode } from "react";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "日本生活成本工具｜Japan Life",
  description: "估算日本生活成本，参考房租、交通、餐饮、通信和日常支出。",
  path: "/tools/living-cost",
});

export default function LivingCostLayout({ children }: { children: ReactNode }) {
  return children;
}
