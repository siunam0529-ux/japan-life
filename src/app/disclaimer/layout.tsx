import type { ReactNode } from "react";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "数据与免责声明｜Japan Life",
  description: "Japan Life 的数据来源、更新时间和参考说明。汇率、假日、地区、优惠等信息请以官方信息为准。",
  path: "/disclaimer",
});

export default function DisclaimerLayout({ children }: { children: ReactNode }) {
  return children;
}
