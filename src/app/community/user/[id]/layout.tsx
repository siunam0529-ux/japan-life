import type { ReactNode } from "react";
import { createCommunityNoIndexMetadata } from "@/lib/community/seo";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return createCommunityNoIndexMetadata(
    "社区用户 | Japan Life",
    "查看 Japan Life 社区用户资料。",
    `/community/user/${id}`,
  );
}

export default function CommunityUserLayout({ children }: { children: ReactNode }) {
  return children;
}
