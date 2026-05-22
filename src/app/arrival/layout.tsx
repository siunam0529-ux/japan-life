import type { ReactNode } from "react";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "初到日本生活清单｜Japan Life",
  description: "整理刚到日本后的生活事项，包括住所、手续、交通、通信、打工和生活准备。",
  path: "/arrival",
});

export default function ArrivalLayout({ children }: { children: ReactNode }) {
  return children;
}
