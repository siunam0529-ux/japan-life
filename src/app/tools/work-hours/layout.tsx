import type { ReactNode } from "react";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "打工时长记录｜留学生28小时提醒｜Japan Life",
  description: "记录每周打工时长和剩余时间，适合留学生和在日本兼职工作的人参考，支持28小时默认提醒。",
  keywords: ["日本打工", "留学生28小时", "工时记录", "日本兼职"],
  path: "/tools/work-hours",
});

export default function WorkHoursLayout({ children }: { children: ReactNode }) {
  return children;
}
