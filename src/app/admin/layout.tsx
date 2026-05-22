import type { ReactNode } from "react";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "管理页面｜Japan Life",
  description: "Japan Life 管理页面。",
  path: "/admin",
  noIndex: true,
});

export default function AdminLayout({ children }: { children: ReactNode }) {
  return children;
}
