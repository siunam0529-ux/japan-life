"use client";

import { Copy, Handshake, Mail, MessageCircle, Send } from "lucide-react";
import { useState } from "react";
import { BackButton } from "@/components/BackButton";
import { useLanguage } from "@/hooks/useLanguage";

const contactItems = [
  { label: "LINE", value: "namxd0529" },
  { label: "WeChat / 微信", value: "minami970529" },
  { label: "Email / 邮箱", value: "siunam0529@gmail.com" },
] as const;

const copy = {
  "zh-CN": {
    title: "反馈与合作",
    subtitle: "如果你在使用 Japan Life 时发现内容错误、功能不好用，或者想进行店铺推荐、优惠合作、内容合作，都可以通过下面的方式联系我。",
    feedbackTitle: "反馈",
    feedbackBody: "欢迎告诉我哪里看不清、哪里不好用、哪些工具还缺功能。越具体越好，例如页面名称、遇到的问题、希望怎么改。",
    collaborationTitle: "合作",
    collaborationBody: "如果你有在日生活相关服务、店铺、优惠链接、实用 App 或内容资源，想放进 Japan Life，可以直接联系我说明合作方式。",
    contactTitle: "我的联系方式",
    copy: "复制",
    copied: "已复制",
  },
  "zh-TW": {
    title: "回饋與合作",
    subtitle: "如果你在使用 Japan Life 時發現內容錯誤、功能不好用，或者想進行店鋪推薦、優惠合作、內容合作，都可以透過下面方式聯絡我。",
    feedbackTitle: "回饋",
    feedbackBody: "歡迎告訴我哪裡看不清、哪裡不好用、哪些工具還缺功能。越具體越好，例如頁面名稱、遇到的問題、希望怎麼改。",
    collaborationTitle: "合作",
    collaborationBody: "如果你有在日生活相關服務、店鋪、優惠連結、實用 App 或內容資源，想放進 Japan Life，可以直接聯絡我說明合作方式。",
    contactTitle: "我的聯絡方式",
    copy: "複製",
    copied: "已複製",
  },
  ja: {
    title: "フィードバック・提携",
    subtitle: "Japan Life の内容修正、使いにくい点、店舗掲載、特典掲載、コンテンツ提携などは、下記の連絡先からお気軽にご連絡ください。",
    feedbackTitle: "フィードバック",
    feedbackBody: "見づらい箇所、使いにくい機能、追加してほしいツールなどを教えてください。ページ名、問題点、希望する改善内容があると助かります。",
    collaborationTitle: "提携",
    collaborationBody: "日本生活に関するサービス、店舗、特典リンク、便利アプリ、情報コンテンツを Japan Life に掲載したい場合は、提携内容を添えてご連絡ください。",
    contactTitle: "連絡先",
    copy: "コピー",
    copied: "コピー済み",
  },
} as const;

export default function ContactPage() {
  const { language, t } = useLanguage();
  const text = copy[language];
  const [copiedValue, setCopiedValue] = useState("");

  const copyText = async (value: string) => {
    await navigator.clipboard.writeText(value);
    setCopiedValue(value);
  };

  return (
    <main className="min-h-screen bg-[#F6FAFF] px-4 py-5 text-[#0F172A]">
      <div className="mx-auto min-h-screen max-w-[430px] px-1 pb-10">
        <div className="mb-5">
          <BackButton label={t.common.back} />
        </div>

        <section className="rounded-[28px] border border-white/60 bg-white/75 p-5 shadow-[0_18px_45px_rgba(37,99,235,0.10)] backdrop-blur-xl">
          <p className="text-sm font-black text-[#2563EB]">Japan Life</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight">{text.title}</h1>
          <p className="mt-3 text-sm font-bold leading-6 text-[#64748B]">{text.subtitle}</p>
        </section>

        <section className="mt-5 grid gap-3">
          <InfoCard icon={<MessageCircle className="h-5 w-5" />} title={text.feedbackTitle} body={text.feedbackBody} tone="blue" />
          <InfoCard icon={<Handshake className="h-5 w-5" />} title={text.collaborationTitle} body={text.collaborationBody} tone="pink" />
        </section>

        <section className="mt-5 rounded-[28px] border border-white/60 bg-white/75 p-4 shadow-[0_10px_35px_rgba(37,99,235,0.08)] backdrop-blur-xl">
          <h2 className="flex items-center gap-2 text-lg font-black">
            <Send className="h-5 w-5 text-[#2563EB]" />
            {text.contactTitle}
          </h2>
          <div className="mt-4 grid gap-2">
            {contactItems.map((item) => (
              <div className="flex items-center gap-3 rounded-2xl border border-blue-100 bg-blue-50/70 p-3" key={item.label}>
                <Mail className="h-4 w-4 shrink-0 text-[#2563EB]" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-black text-[#64748B]">{item.label}</p>
                  <p className="mt-0.5 truncate text-sm font-black text-[#0F172A]">{item.value}</p>
                </div>
                <button className="rounded-2xl bg-white px-3 py-2 text-xs font-black text-[#2563EB] shadow-sm" onClick={() => copyText(item.value)} type="button">
                  <span className="inline-flex items-center gap-1">
                    <Copy className="h-3.5 w-3.5" />
                    {copiedValue === item.value ? text.copied : text.copy}
                  </span>
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

function InfoCard({ body, icon, title, tone }: { body: string; icon: React.ReactNode; title: string; tone: "blue" | "pink" }) {
  const toneClass = tone === "blue" ? "bg-blue-50 text-[#2563EB]" : "bg-pink-50 text-[#F472B6]";

  return (
    <article className="rounded-[28px] border border-white/60 bg-white/75 p-4 shadow-[0_10px_35px_rgba(37,99,235,0.08)] backdrop-blur-xl">
      <div className="flex items-start gap-3">
        <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${toneClass}`}>{icon}</span>
        <div className="min-w-0">
          <h2 className="text-lg font-black">{title}</h2>
          <p className="mt-2 text-sm font-bold leading-6 text-[#64748B]">{body}</p>
        </div>
      </div>
    </article>
  );
}
