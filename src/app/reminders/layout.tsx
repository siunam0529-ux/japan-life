import type { ReactNode } from "react";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "提醒中心｜Reminders｜Japan Life",
  description: "统一查看日本日历里的垃圾日、每月缴费和个人生活提醒。",
  path: "/reminders",
  noIndex: true,
});

export default function RemindersLayout({ children }: { children: ReactNode }) {
  return children;
}
