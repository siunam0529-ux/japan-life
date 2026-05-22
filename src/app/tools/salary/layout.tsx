import type { ReactNode } from "react";
import { createMetadata, pageSeo } from "@/lib/seo";

export const metadata = createMetadata(pageSeo.salary);

export default function SalaryLayout({ children }: { children: ReactNode }) {
  return children;
}
