"use client";

import { Mail, ShieldCheck, Sparkles } from "lucide-react";
import { BackButton } from "@/components/BackButton";
import { useLanguage } from "@/hooks/useLanguage";

const copy = {
  "zh-CN": {
    back: "返回",
    title: "关于 Japan Life",
    subtitle: "把在日本生活常用的信息和工具整理在一起。",
    positioning: "产品定位",
    positioningBody: "Japan Life 面向刚来日本、正在留学、工作、陪读或长期生活的人。你可以在这里查看生活工具、地区信息、社区内容和常用提醒，少一点来回查资料的麻烦。",
    features: "主要功能",
    featuresBody: "汇率换算、工资与生活成本估算、房租参考、日本日历、在留提醒、生活指南、交通票券参考、友好店铺、社区、私信通知和个人收藏。",
    operator: "运营主体",
    owner: "小南",
  },
  "zh-TW": {
    back: "返回",
    title: "關於 Japan Life",
    subtitle: "把在日本生活常用的資訊和工具整理在一起。",
    positioning: "產品定位",
    positioningBody: "Japan Life 面向剛來日本、正在留學、工作、陪讀或長期生活的人。你可以在這裡查看生活工具、地區資訊、社群內容和常用提醒，少一點來回查資料的麻煩。",
    features: "主要功能",
    featuresBody: "匯率換算、薪資與生活成本估算、房租參考、日本日曆、在留提醒、生活指南、交通票券參考、友好店鋪、社群、私訊通知和個人收藏。",
    operator: "營運主體",
    owner: "小南",
  },
  ja: {
    back: "戻る",
    title: "Japan Life について",
    subtitle: "日本生活に必要な情報とツールをまとめています。",
    positioning: "サービスの位置づけ",
    positioningBody: "Japan Life は、来日直後の方、留学生、仕事で滞在している方、家族滞在の方、長く日本で暮らす方に向けた生活サポートアプリです。生活ツール、地域情報、コミュニティ、通知を一か所で確認できます。",
    features: "主な機能",
    featuresBody: "為替換算、給与と生活費の目安、家賃チェック、日本カレンダー、在留期限リマインダー、生活ガイド、お得情報、友好店舗、コミュニティ、メッセージ通知、お気に入り管理。",
    operator: "運営主体",
    owner: "小南",
  },
} as const;

export default function AboutPage() {
  const { language } = useLanguage();
  const text = copy[language];

  return (
    <main className="jl-tool-theme min-h-screen px-4 py-5 text-stone-950">
      <div className="jl-tool-shell mx-auto min-h-screen max-w-[430px] px-4 py-5">
        <div className="mb-5">
          <BackButton fallbackHref="/me" label={text.back} />
        </div>

        <section className="rounded-[30px] border border-slate-200 bg-white p-5 text-[#0F172A] shadow-sm">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-[#2563EB]">
              <Sparkles className="h-6 w-6" />
            </span>
            <h1 className="text-3xl font-black">{text.title}</h1>
          </div>
          <p className="mt-3 text-sm font-semibold leading-6 text-[#64748B]">{text.subtitle}</p>
        </section>

        <section className="mt-4 grid gap-3">
          <InfoBlock title={text.positioning} body={text.positioningBody} />
          <InfoBlock title={text.features} body={text.featuresBody} />
          <article className="rounded-[24px] bg-white p-4 shadow-sm">
            <h2 className="font-black text-emerald-800">{text.operator}</h2>
            <p className="mt-2 flex items-center gap-2 text-sm font-bold text-stone-600">
              <ShieldCheck className="h-4 w-4 text-emerald-700" />
              {text.owner}
            </p>
            <p className="mt-2 flex items-center gap-2 text-sm font-bold text-stone-600">
              <Mail className="h-4 w-4 text-emerald-700" />
              siunam0529@gmail.com
            </p>
          </article>
        </section>
      </div>
    </main>
  );
}

function InfoBlock({ body, title }: { body: string; title: string }) {
  return (
    <article className="rounded-[24px] bg-white p-4 shadow-sm">
      <h2 className="font-black text-emerald-800">{title}</h2>
      <p className="mt-2 text-sm font-bold leading-7 text-stone-600">{body}</p>
    </article>
  );
}
