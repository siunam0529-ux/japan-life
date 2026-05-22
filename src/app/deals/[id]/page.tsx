import { notFound } from "next/navigation";
import { dealItems } from "@/data/deals";
import { createMetadata } from "@/lib/seo";
import { DealDetailClient } from "./DealDetailClient";

export function generateStaticParams() {
  return dealItems.filter((deal) => deal.status === "published").map((deal) => ({ id: deal.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const deal = dealItems.find((item) => item.id === id && item.status === "published");

  if (!deal) {
    return createMetadata({
      title: "日本优惠推荐｜Japan Life",
      description: "查看日本生活相关优惠和省钱信息，涵盖通信、购物、出行、订阅服务和日常生活。",
      path: `/deals/${id}`,
    });
  }

  return createMetadata({
    title: `${deal.providerName}｜日本优惠推荐｜Japan Life`,
    description: deal.descriptionZhCN,
    path: `/deals/${deal.id}`,
  });
}

export default async function DealDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const deal = dealItems.find((item) => item.id === id && item.status === "published");

  if (!deal) notFound();

  return <DealDetailClient deal={deal} />;
}
