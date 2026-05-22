"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useLanguage } from "@/hooks/useLanguage";

const copy = {
  "zh-CN": {
    title: "使用条款",
    back: "返回",
    section: "简体中文",
    items: [
      "本服务提供日本生活工具、索引和 mock 数据预览，不构成法律、税务、签证、不动产或医疗建议。",
      "用户使用计算结果或索引信息时，需要自行确认官方信息。",
      "当前版本不提供账号系统、数据库同步或付费 API。",
    ],
  },
  "zh-TW": {
    title: "使用條款",
    back: "返回",
    section: "繁體中文",
    items: [
      "本服務提供日本生活工具、索引和 mock 資料預覽，不構成法律、稅務、簽證、不動產或醫療建議。",
      "使用者使用計算結果或索引資訊時，需要自行確認官方資訊。",
      "目前版本不提供帳號系統、資料庫同步或付費 API。",
    ],
  },
  ja: {
    title: "利用規約",
    back: "戻る",
    section: "日本語",
    items: [
      "本サービスは日本生活ツール、リンク集、mock データのプレビューを提供します。法律、税務、ビザ、不動産、医療の助言ではありません。",
      "計算結果やリンク情報を利用する際は、必ず公式情報を確認してください。",
      "現時点ではアカウント機能、データベース同期、有料 API は提供していません。",
    ],
  },
} as const;

export default function TermsPage() {
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
