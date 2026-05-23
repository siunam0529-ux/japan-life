import type { ReactNode } from "react";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "日本生活 Checklist｜第一次来日本备物清单｜Japan Life",
  description: "整理第一次来日本需要准备、购买、开通和随身携带的物品清单，包括手机、银行卡、印章、国保、My Number、居家用品和应急物品。",
  keywords: ["日本生活清单", "第一次来日本", "日本备物清单", "日本留学准备", "日本生活 Checklist", "印章", "My Number"],
  path: "/tools/life-checklist",
});

export default function LifeChecklistLayout({ children }: { children: ReactNode }) {
  return children;
}
