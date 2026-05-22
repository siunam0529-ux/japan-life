import { notFound } from "next/navigation";
import { recommendedApps } from "@/data/recommendedApps";
import { createRecommendedAppSlug, normalizeSupabaseRecommendedApp, type SupabaseRecommendedApp } from "@/lib/recommendedAppNormalize";
import { createMetadata } from "@/lib/seo";
import { supabase } from "@/lib/supabase";
import { AppDetailClient } from "./AppDetailClient";

async function getSupabaseApp(id: string) {
  if (!supabase) return undefined;

  const { data, error } = await supabase.from("recommended_apps").select("*").eq("status", "published").eq("id", id).maybeSingle();
  if (!error && data) return normalizeSupabaseRecommendedApp(data as SupabaseRecommendedApp);

  const { data: items } = await supabase.from("recommended_apps").select("*").eq("status", "published");
  const item = (items ?? []).find((record) => {
    const app = normalizeSupabaseRecommendedApp(record as SupabaseRecommendedApp);
    return createRecommendedAppSlug(app.name) === id;
  });

  if (!item) {
    return undefined;
  }
  return normalizeSupabaseRecommendedApp(item as SupabaseRecommendedApp);
}

export function generateStaticParams() {
  return recommendedApps.filter((app) => app.status === "published").map((app) => ({ id: app.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const app = recommendedApps.find((item) => item.id === id && item.status === "published") ?? (await getSupabaseApp(id));

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
  const app = recommendedApps.find((item) => item.id === id && item.status === "published") ?? (await getSupabaseApp(id));

  if (!app) {
    notFound();
  }

  return <AppDetailClient app={app} />;
}
