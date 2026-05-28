import type { ReactNode } from "react";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "今天吃什么｜Japan Life",
  description: "根据时间、天气和心情，推荐今天适合吃什么。",
  keywords: ["今天吃什么", "日本生活饮食", "东京吃饭推荐", "Japan Life"],
  path: "/food",
});

export default function FoodLayout({ children }: { children: ReactNode }) {
  return children;
}
