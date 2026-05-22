"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useLanguage } from "@/hooks/useLanguage";

const copy = {
  "zh-CN": {
    title: "免责声明",
    back: "返回",
    section: "简体中文",
    items: [
      "工资、税金、签证、福利、房租、汇率等信息仅供参考。",
      "请以官方信息、行政窗口、税理士、行政书士、不动产专业人士等意见为准。",
      "政策、费率、报名时间和服务入口可能会变动，使用前请再次确认官方来源。",
    ],
  },
  "zh-TW": {
    title: "免責聲明",
    back: "返回",
    section: "繁體中文",
    items: [
      "薪資、稅金、簽證、福利、房租、匯率等資訊僅供參考。",
      "請以官方資訊、行政窗口、稅理士、行政書士、不動產專業人士等意見為準。",
      "政策、費率、報名時間和服務入口可能會變動，使用前請再次確認官方來源。",
    ],
  },
  ja: {
    title: "免責事項",
    back: "戻る",
    section: "日本語",
    items: [
      "給与、税金、ビザ、支援制度、家賃、為替などの情報は参考用です。",
      "公式情報、行政窓口、税理士、行政書士、不動産専門家などの意見を確認してください。",
      "制度、料率、申込時期、サービス入口は変更される場合があります。利用前に公式情報を再確認してください。",
    ],
  },
} as const;

export default function DisclaimerPage() {
  const { language } = useLanguage();
  const text = copy[language];

  return (
    <main className="min-h-screen bg-[#f5f0e7] px-4 py-5 text-stone-950">
      <div className="mx-auto min-h-screen max-w-[430px] bg-[#fbf8f2] px-4 py-5 shadow-2xl shadow-stone-300/40">
        <Link className="mb-5 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-black shadow-sm" href="/">
          <ArrowLeft className="h-4 w-4" />
          {text.back}
        </Link>
        <section className="rounded-[28px] bg-white p-6 shadow-[0_12px_35px_rgba(32,38,34,0.08)]">
          <h1 className="mb-5 text-2xl font-black">{text.title}</h1>
          <article className="rounded-2xl bg-stone-50 p-4">
            <h2 className="font-black text-emerald-800">{text.section}</h2>
            <ul className="mt-2 grid gap-2 text-sm font-bold leading-7 text-stone-600">
              {text.items.map((item) => (
                <li key={item}>• {item}</li>
              ))}
            </ul>
          </article>
        </section>
      </div>
    </main>
  );
}
