import type { ReactNode } from "react";
import { createMetadata, pageSeo } from "@/lib/seo";

export const metadata = createMetadata(pageSeo.apps);

export default function AppsLayout({ children }: { children: ReactNode }) {
  return children;
}
