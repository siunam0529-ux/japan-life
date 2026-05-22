import type { ReactNode } from "react";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "外国人友好店铺｜Japan Life",
  description: "查看日本生活中的外国人友好店铺，包括餐厅、服务和生活相关地点。",
  path: "/places",
});

export default function PlacesLayout({ children }: { children: ReactNode }) {
  return children;
}
