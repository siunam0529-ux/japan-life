import type { ReactNode } from "react";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "账号资料｜Japan Life",
  description: "查看和管理 Japan Life 登录账号。",
  path: "/account",
  noIndex: true,
});

export default function AccountLayout({ children }: { children: ReactNode }) {
  return children;
}
