import type { ReactNode } from "react";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "福利・支援制度管理｜Japan Life",
  description: "Japan Life 福利・支援制度管理页面。",
  path: "/admin/benefits",
  noIndex: true,
});

export default function AdminBenefitsLayout({ children }: { children: ReactNode }) {
  return children;
}
