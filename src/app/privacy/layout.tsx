import type { ReactNode } from "react";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "隐私政策｜Japan Life",
  description: "Japan Life 的隐私政策，说明个人信息、浏览数据和本地保存数据的处理方式。",
  path: "/privacy",
});

export default function PrivacyLayout({ children }: { children: ReactNode }) {
  return children;
}
