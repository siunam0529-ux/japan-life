import type { ReactNode } from "react";
import { createMetadata, pageSeo } from "@/lib/seo";

export const metadata = createMetadata(pageSeo.areaCompare);

export default function AreaCompareLayout({ children }: { children: ReactNode }) {
  return children;
}
