import type { ReactNode } from "react";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "日本节日查询｜Japan Life",
  description: "查看日本节日和假日信息，方便安排工作、生活、出行和缴费提醒。",
  path: "/tools/holiday",
});

export default function HolidayLayout({ children }: { children: ReactNode }) {
  return children;
}
