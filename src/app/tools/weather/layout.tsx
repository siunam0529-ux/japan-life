import type { ReactNode } from "react";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "日本7天天气｜生活天气预报｜Japan Life",
  description: "查看日本生活地区未来7天天气、气温和降水概率，方便安排出门、垃圾日和生活计划。",
  path: "/tools/weather",
});

export default function WeatherLayout({ children }: { children: ReactNode }) {
  return children;
}
