import type { ReactNode } from "react";
import { createMetadata, pageSeo } from "@/lib/seo";

export const metadata = createMetadata(pageSeo.rent);

export default function RentLayout({ children }: { children: ReactNode }) {
  return children;
}
