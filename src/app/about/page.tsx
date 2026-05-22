"use client";

import { Mail, ShieldCheck, Sparkles } from "lucide-react";
import { BackButton } from "@/components/BackButton";
import { useLanguage } from "@/hooks/useLanguage";

const copy = {
  "zh-CN": {
    back: "返回",
    title: "关于 Japan Life",
    subtitle: "一个外国人友好的日本生活工具平台。",
    positioning: "产品定位",
    positioningBody: "Japan Life 面向在日生活的新用户、留学生、工作签、家族滞在、日本人和其他外国人。第一版重点服务中文圈用户，同时保留繁體中文和日本語结构，后续可继续扩展 English。",
    features: "主要功能",
    featuresBody: "汇率、工资、打工时间、房租压力、生活成本、日本日历、在留提醒、日本生活指南、推荐 App、优惠推荐、店铺上架申请和收藏。",
    operator: "运营主体",
    owner: "小南",
  },
  "zh-TW": {
    back: "返回",
    title: "關於 Japan Life",
    subtitle: "一個外國人友好的日本生活工具平台。",
    positioning: "產品定位",
    positioningBody: "Japan Life 面向在日生活的新使用者、留學生、工作簽、家族滯在、日本人和其他外國人。第一版重點服務中文圈使用者，同時保留繁體中文和日本語結構，後續可繼續擴展 English。",
    features: "主要功能",
    featuresBody: "匯率、薪資、打工時間、房租壓力、生活成本、日本日曆、在留提醒、日本生活指南、推薦 App、優惠推薦、店鋪上架申請和收藏。",
    operator: "營運主體",
    owner: "小南",
  },
  ja: {
    back: "戻る",
    title: "Japan Life について",
    subtitle: "外国人にやさしい日本生活ツールプラットフォームです。",
    positioning: "サービスの位置づけ",
    positioningBody: "Japan Life は来日直後の方、留学生、就労ビザ、家族滞在、日本人、その他の外国人に向けた生活支援ツールです。初版は中国語圏ユーザーを中心に、繁體中文と日本語にも対応できる構成にしています。",
    features: "主な機能",
    featuresBody: "為替、給与、勤務時間、家賃負担、生活費、日本カレンダー、在留期限、生活ガイド、おすすめアプリ、お得情報、店舗掲載申請、お気に入り管理。",
    operator: "運営主体",
    owner: "小南",
  },
} as const;

export default function AboutPage() {
  const { language } = useLanguage();
  const text = copy[language];

  return (
    <main className="min-h-screen bg-[#f5f0e7] px-4 py-5 text-stone-950">
      <div className="mx-auto min-h-screen max-w-[430px] bg-[#fbf8f2] px-4 py-5 shadow-2xl shadow-stone-300/40">
        <div className="mb-5">
          <BackButton fallbackHref="/me" label={text.back} />
        </div>

        <section className="rounded-[30px] bg-emerald-800 p-5 text-white shadow-[0_18px_45px_rgba(18,93,70,0.25)]">
          <Sparkles className="h-8 w-8" />
          <h1 className="mt-3 text-3xl font-black">{text.title}</h1>
          <p className="mt-2 text-sm font-semibold leading-6 text-emerald-50">{text.subtitle}</p>
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
