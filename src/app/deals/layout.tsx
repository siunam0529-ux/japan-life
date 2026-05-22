import type { ReactNode } from "react";
import { createMetadata, pageSeo } from "@/lib/seo";

export const metadata = createMetadata(pageSeo.deals);

export default function DealsLayout({ children }: { children: ReactNode }) {
  return children;
}
