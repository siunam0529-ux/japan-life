import type { ReactNode } from "react";
import { createMetadata, pageSeo } from "@/lib/seo";

export const metadata = createMetadata(pageSeo.lifeAlerts);

export default function LifeAlertsLayout({ children }: { children: ReactNode }) {
  return children;
}
