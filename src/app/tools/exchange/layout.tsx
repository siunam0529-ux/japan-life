import type { ReactNode } from "react";
import { createMetadata, pageSeo } from "@/lib/seo";

export const metadata = createMetadata(pageSeo.exchange);

export default function ExchangeLayout({ children }: { children: ReactNode }) {
  return children;
}
