import type { ReactNode } from "react";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "今天去哪玩｜Japan Life",
  description: "根据时间、预算和心情，随机推荐东京半日游、一日游和周末目的地。",
  keywords: ["今天去哪玩", "东京周末", "东京一日游", "东京半日游", "Japan Life"],
  path: "/play",
});

export default function PlayLayout({ children }: { children: ReactNode }) {
  return children;
}
