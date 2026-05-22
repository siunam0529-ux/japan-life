import type { ReactNode } from "react";
import { createMetadata, pageSeo } from "@/lib/seo";

export const metadata = createMetadata(pageSeo.garbageCalendar);

export default function HolidaysLayout({ children }: { children: ReactNode }) {
  return children;
}
