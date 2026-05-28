import type { ReactNode } from "react";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "日本生活成本计算工具｜Japan Life",
  description: "估算日本生活成本，参考房租、交通、饮食、通信和日常支出，适合留学、工作和搬家前预算规划。",
  keywords: ["日本生活成本", "东京生活费", "日本留学生活费", "生活预算"],
  path: "/tools/living-cost",
});

export default function LivingCostLayout({ children }: { children: ReactNode }) {
  return children;
}
