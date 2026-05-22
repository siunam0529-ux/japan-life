import type { ReactNode } from "react";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "日本地区生活指南｜房租・交通・生活成本｜Japan Life",
  description: "查看日本不同地区的房租、交通、生活便利度和生活成本，帮助选择更适合自己的居住地区。",
  path: "/areas",
});

export default function AreasLayout({ children }: { children: ReactNode }) {
  return children;
}
