import type { ReactNode } from "react";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "使用条款｜Japan Life",
  description: "Japan Life 的使用条款和服务说明。",
  path: "/terms",
});

export default function TermsLayout({ children }: { children: ReactNode }) {
  return children;
}
