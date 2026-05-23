import type { ReactNode } from "react";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "注册｜Japan Life",
  description: "注册 Japan Life 账号。",
  path: "/signup",
  noIndex: true,
});

export default function SignupLayout({ children }: { children: ReactNode }) {
  return children;
}
