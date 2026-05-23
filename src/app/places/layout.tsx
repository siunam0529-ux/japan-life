import type { ReactNode } from "react";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "外国人友好店铺｜Japan Life",
  description: "查看日本生活中的外国人友好店铺，包括餐厅、生活服务、日常购物和实用地点。",
  keywords: ["外国人友好店铺", "日本店铺推荐", "东京店铺", "在日生活服务"],
  path: "/places",
});

export default function PlacesLayout({ children }: { children: ReactNode }) {
  return children;
}
