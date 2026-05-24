import { notFound } from "next/navigation";
import { dealItems } from "@/data/deals";
import { createMetadata } from "@/lib/seo";
import { DealDetailClient } from "./DealDetailClient";
import { normalizePromotionLink } from "../page";

async function getPromotionDeal(id: string) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "http://localhost:3000";
    const response = await fetch(`${baseUrl}/api/promotion-links/`, { next: { revalidate: 300 } });
    const data = (await response.json()) as { items?: unknown[] };
    const item = data.items?.find((record) => {
      if (!record || typeof record !== "object") return false;
      return `promotion-${String((record as Record<string, unknown>).id)}` === id;
    });
    return item && typeof item === "object" ? normalizePromotionLink(item as Parameters<typeof normalizePromotionLink>[0]) : undefined;
  } catch {
    return undefined;
  }
}

export function generateStaticParams() {
  return dealItems.filter((deal) => deal.status === "published").map((deal) => ({ id: deal.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const deal = dealItems.find((item) => item.id === id && item.status === "published") ?? (await getPromotionDeal(id));

  if (!deal) {
    return createMetadata({
      title: "日本生活优惠｜Japan Life",
      description: "查看日本生活相关优惠和省钱信息，涵盖通信、购物、出行、订阅服务和日常生活。",
      path: `/deals/${id}`,
    });
  }

  return createMetadata({
    title: `${deal.providerName}｜日本生活优惠｜Japan Life`,
    description: deal.descriptionZhCN,
    path: `/deals/${deal.id}`,
  });
}

export default async function DealDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const deal = dealItems.find((item) => item.id === id && item.status === "published") ?? (await getPromotionDeal(id));

  if (!deal) notFound();

  return <DealDetailClient deal={deal} />;
}
