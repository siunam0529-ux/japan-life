import type { ReactNode } from "react";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "反馈建议｜Japan Life",
  description: "向 Japan Life 提交反馈和建议，帮助改进日本生活工具和内容体验。",
  path: "/feedback",
});

export default function FeedbackLayout({ children }: { children: ReactNode }) {
  return children;
}
