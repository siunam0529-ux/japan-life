import type { ReactNode } from "react";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "我的收藏｜Japan Life",
  description: "查看在 Japan Life 收藏的日本生活工具、地区、店铺、App 和优惠信息。",
  path: "/favorites",
  noIndex: true,
});

export default function FavoritesLayout({ children }: { children: ReactNode }) {
  return children;
}
