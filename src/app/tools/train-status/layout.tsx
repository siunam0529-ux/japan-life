import type { ReactNode } from "react";
import { createMetadata, pageSeo } from "@/lib/seo";

export const metadata = createMetadata(pageSeo.trainStatus);

export default function TrainStatusLayout({ children }: { children: ReactNode }) {
  return children;
}
