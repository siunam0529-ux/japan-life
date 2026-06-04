import type { ReactNode } from "react";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "今天吃什么｜Japan Life",
  description: "选择想去的区域，从 Japan Life 收录的餐厅里快速挑选今天可以考虑的店。",
  keywords: ["今天吃什么", "东京餐厅推荐", "日本生活", "Japan Life"],
  path: "/food",
});

export default function FoodLayout({ children }: { children: ReactNode }) {
  return children;
}
