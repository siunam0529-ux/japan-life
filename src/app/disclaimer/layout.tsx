import type { ReactNode } from "react";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "免责声明｜数据来源与参考说明｜Japan Life",
  description: "Japan Life 的数据来源、更新时间和参考说明。汇率、假日、地区、优惠、交通、签证、医疗、税务等信息请以官方信息为准。",
  keywords: ["Japan Life 免责声明", "数据来源", "日本生活参考", "官方信息"],
  path: "/disclaimer",
});

export default function DisclaimerLayout({ children }: { children: ReactNode }) {
  return children;
}
