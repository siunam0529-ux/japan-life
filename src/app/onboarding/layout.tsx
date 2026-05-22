import type { ReactNode } from "react";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "生活设定｜Japan Life",
  description: "设置 Japan Life 的在日生活偏好，用于推荐更合适的工具、地区和提醒。",
  path: "/onboarding",
  noIndex: true,
});

export default function OnboardingLayout({ children }: { children: ReactNode }) {
  return children;
}
