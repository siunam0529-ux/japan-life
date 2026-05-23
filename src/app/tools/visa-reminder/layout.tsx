import type { ReactNode } from "react";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "在留期限提醒｜Japan Life",
  description: "记录在留期限和相关手续时间，帮助在日本生活的人提前准备在留卡更新和行政安排。",
  keywords: ["在留卡提醒", "日本签证提醒", "在留期限", "日本行政手续"],
  path: "/tools/visa-reminder",
});

export default function VisaReminderLayout({ children }: { children: ReactNode }) {
  return children;
}
