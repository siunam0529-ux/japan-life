import type { ReactNode } from "react";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "打工时长记录｜Japan Life",
  description: "记录每周打工时长和剩余时间，适合留学生和在日本兼职工作的人参考。",
  path: "/tools/work-hours",
});

export default function WorkHoursLayout({ children }: { children: ReactNode }) {
  return children;
}
