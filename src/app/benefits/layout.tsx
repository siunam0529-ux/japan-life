import type { ReactNode } from "react";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "福利・支援制度｜东京23区行政支援｜Japan Life",
  description: "查看東京都和东京23区公开的福利、补助金、助成金、子育て、医疗、家租、留学生、外国人相关支援制度。",
  keywords: ["东京福利", "东京23区", "補助金", "給付金", "助成金", "子育て支援", "外国人支援", "留学生支援"],
  path: "/benefits",
});

export default function BenefitsLayout({ children }: { children: ReactNode }) {
  return children;
}
