import { MapPin } from "lucide-react";
import { notFound } from "next/navigation";
import { AreaBackButton } from "@/components/AreaBackButton";
import { areaItems } from "@/data/areas";
import { formatCurrency } from "@/lib/formatCurrency";
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

  return (
    <main className="min-h-screen bg-[#f5f0e7] text-stone-950">
      <div className="mx-auto min-h-screen max-w-[430px] bg-[#fbf8f2] px-4 py-5 shadow-2xl shadow-stone-300/40">
        <div className="mb-4 flex items-center justify-between">
          <AreaBackButton />
          <span className="rounded-full bg-emerald-50 px-4 py-2 text-xs font-black text-emerald-800">Japan Life</span>
        </div>
        <section className="rounded-[28px] bg-emerald-800 p-5 text-white shadow-[0_18px_45px_rgba(20,108,92,0.22)]">
          <MapPin className="h-9 w-9" />
          <h1 className="mt-4 text-2xl font-black">{area.nameZhCN} / {area.nameJa}</h1>
          <p className="mt-2 text-sm font-semibold leading-6 text-emerald-50">{area.nameEn}</p>
        </section>
        <section className="mt-4 grid grid-cols-2 gap-2.5">
          <Metric label="平均房租" value={formatCurrency(area.averageRent, "JPY")} />
          <Metric label="平均时薪" value={formatCurrency(area.averageWage, "JPY")} />
          <Metric label="交通" value={`${area.transportScore}/100`} />
          <Metric label="外国人友好" value={`${area.foreignerFriendlyScore}/100`} />
          <Metric label="生活便利" value={`${area.livingConvenienceScore}/100`} />
          <Metric label="安全度" value={`${area.safetyScore}/100`} />
        </section>
        <section className="mt-4 rounded-[24px] border border-stone-200 bg-white p-4 shadow-sm">
          <h2 className="text-lg font-black">适合人群</h2>
          <p className="mt-2 text-sm font-bold leading-6 text-stone-600">{area.recommendedForZhCN}</p>
          <h2 className="mt-4 text-lg font-black">优点</h2>
          {area.prosZhCN.map((item) => <p className="mt-1 text-sm font-bold text-stone-600" key={item}>- {item}</p>)}
          <h2 className="mt-4 text-lg font-black">注意点</h2>
          {area.consZhCN.map((item) => <p className="mt-1 text-sm font-bold text-stone-600" key={item}>- {item}</p>)}
        </section>
        <p className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-bold leading-5 text-amber-900">
          本页地区数据为 Japan Life 静态参考数据，仅供生活参考，不作为正式租房、签约或行政判断依据。实际房租、交通和生活感受会因房源、车站、时间和个人条件不同而变化。
        </p>
      </div>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-[20px] bg-white p-4 shadow-sm"><p className="text-xs font-black text-stone-500">{label}</p><p className="mt-1 text-lg font-black">{value}</p></div>;
}
