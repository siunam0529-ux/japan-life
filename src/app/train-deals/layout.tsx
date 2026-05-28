import type { ReactNode } from "react";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "电车优惠｜Japan Life",
  description: "查看日本常见电车优惠票、一日券和交通省钱建议。",
  keywords: ["日本电车优惠", "东京一日券", "东京交通省钱", "Tokyo Metro 一日券", "日本交通票"],
  path: "/train-deals",
});

export default function TrainDealsLayout({ children }: { children: ReactNode }) {
  return children;
}
