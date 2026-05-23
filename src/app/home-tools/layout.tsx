import type { ReactNode } from "react";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "常用工具管理｜Japan Life",
  description: "管理 Japan Life 首页显示的常用工具。",
  path: "/home-tools",
  noIndex: true,
});

export default function HomeToolsLayout({ children }: { children: ReactNode }) {
  return children;
}
