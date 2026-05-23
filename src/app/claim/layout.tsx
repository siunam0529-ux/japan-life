import type { ReactNode } from "react";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "店铺上架申请｜Japan Life",
  description: "申请将外国人友好店铺加入 Japan Life，提交店铺信息、图片、地址、联系方式和服务内容。",
  keywords: ["店铺上架", "外国人友好店铺", "日本店铺推荐", "Japan Life 合作"],
  path: "/claim",
});

export default function ClaimLayout({ children }: { children: ReactNode }) {
  return children;
}
