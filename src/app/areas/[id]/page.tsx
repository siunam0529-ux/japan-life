import { notFound } from "next/navigation";
import { AreaDetailClient } from "@/app/areas/[id]/AreaDetailClient";
import { areaItems } from "@/data/areas";
import { createMetadata, pageSeo } from "@/lib/seo";

export function generateStaticParams() {
  return areaItems.map((area) => ({ id: area.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const area = areaItems.find((item) => item.id === id);

  if (!area) {
    return createMetadata({
      ...pageSeo.fallbackArea,
      path: `/areas/${id}`,
    });
  }

  const areaName = area.nameZhCN || area.nameJa || area.nameEn;
  return createMetadata({
    title: `${areaName}生活指南｜垃圾日历・房租・交通｜Japan Life`,
    description: `查看${areaName}的生活信息，包括垃圾收集日、房租参考、交通便利度、生活成本和日本生活建议。`,
    path: `/areas/${area.id}`,
  });
}

export default async function AreaDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const area = areaItems.find((item) => item.id === id);
  if (!area) notFound();

  return <AreaDetailClient area={area} />;
}
