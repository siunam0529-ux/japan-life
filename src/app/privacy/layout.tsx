import type { ReactNode } from "react";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "隐私政策｜Japan Life",
  description: "Japan Life 的隐私政策，说明账号、定位、通知、localStorage、本地数据、云同步、上传内容和第三方 API 的处理方式。",
  keywords: ["Japan Life 隐私政策", "localStorage", "Supabase Auth", "ODPT", "HotPepper", "数据同步"],
  path: "/privacy",
});

export default function PrivacyLayout({ children }: { children: ReactNode }) {
  return children;
}
