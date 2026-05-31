import type { ReactNode } from "react";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "今天吃什么｜Japan Life",
  description: "根据车站位置随机寻找附近可用的 HotPepper 店铺。",
  keywords: ["今天吃什么", "HotPepper", "东京附近餐厅", "Japan Life"],
  path: "/food",
});

export default function FoodLayout({ children }: { children: ReactNode }) {
  return children;
}
