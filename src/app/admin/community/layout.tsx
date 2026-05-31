import type { ReactNode } from "react";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "社区管理｜Japan Life",
  description: "Japan Life 社区内容审核管理页面。",
  path: "/admin/community",
  noIndex: true,
});

export default function AdminCommunityLayout({ children }: { children: ReactNode }) {
  return children;
}
