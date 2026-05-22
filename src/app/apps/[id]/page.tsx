import { notFound } from "next/navigation";
import { recommendedApps } from "@/data/recommendedApps";
import { createMetadata } from "@/lib/seo";
import { AppDetailClient } from "./AppDetailClient";

export function generateStaticParams() {
  return recommendedApps.filter((app) => app.status === "published").map((app) => ({ id: app.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const app = recommendedApps.find((item) => item.id === id && item.status === "published");

  if (!app) {
    return createMetadata({
      title: "日本生活推荐 App｜Japan Life",
      description: "查看日本生活常用 App，包括交通、支付、外卖、购物、翻译、天气和生活工具。",
      path: `/apps/${id}`,
    });
  }

  return createMetadata({
    title: `${app.name}｜日本生活推荐 App｜Japan Life`,
    description: app.shortDescriptionZhCN || app.descriptionZhCN,
    path: `/apps/${app.id}`,
  });
}

export default async function AppDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const app = recommendedApps.find((item) => item.id === id && item.status === "published");

  if (!app) {
    notFound();
  }

  return <AppDetailClient app={app} />;
}
