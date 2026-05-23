import type { ReactNode } from "react";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "日本手续导航｜搬家・入学・换工作・回国｜Japan Life",
  description: "按生活场景整理日本外国人常见手续，包括搬家、初到日本、换工作、入学毕业、结婚生子、丢证件和回国离日。",
  keywords: ["日本手续", "日本搬家手续", "住民票", "国民健康保险", "在留卡地址变更", "日本生活导航"],
  path: "/tools/procedure-navigator",
});

export default function ProcedureNavigatorLayout({ children }: { children: ReactNode }) {
  return children;
}
