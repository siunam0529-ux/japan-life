"use client";

import { BackButton } from "@/components/BackButton";
import { useLanguage } from "@/hooks/useLanguage";

const copy = {
  "zh-CN": {
    title: "使用条款",
    back: "返回",
    section: "简体中文",
    items: [
      "Japan Life 提供日本生活工具、索引、提醒和后台内容展示，不构成法律、税务、签证、不动产、投资或医疗建议。",
      "工资、房租、汇率、工时、在留、优惠、交通、店铺等信息可能存在延迟、遗漏或变化，使用前请自行确认官方信息。",
      "用户提交的店铺申请、反馈、头像或图片内容应确保真实、合法，不得侵犯他人权益。",
      "登录功能用于账号识别和数据同步；不登录时，App 仍可在本机保存设置和使用记录。",
      "Japan Life 可为了安全、维护、功能优化或合规原因调整服务内容。",
    ],
  },
  "zh-TW": {
    title: "使用條款",
    back: "返回",
    section: "繁體中文",
    items: [
      "Japan Life 提供日本生活工具、索引、提醒和後台內容展示，不構成法律、稅務、簽證、不動產、投資或醫療建議。",
      "薪資、房租、匯率、工時、在留、優惠、交通、店鋪等資訊可能存在延遲、遺漏或變化，使用前請自行確認官方資訊。",
      "使用者提交的店鋪申請、回饋、頭像或圖片內容應確保真實、合法，不得侵犯他人權益。",
      "登入功能用於帳號識別和資料同步；不登入時，App 仍可在本機保存設定和使用記錄。",
      "Japan Life 可為了安全、維護、功能優化或合規原因調整服務內容。",
    ],
  },
  ja: {
    title: "利用規約",
    back: "戻る",
    section: "日本語",
    items: [
      "Japan Life は日本生活のためのツール、索引、リマインダー、管理画面コンテンツを提供します。法律、税務、ビザ、不動産、投資、医療に関する助言ではありません。",
      "給与、家賃、為替、勤務時間、在留、特典、交通、店舗情報などは遅延、欠落、変更が発生する場合があります。利用前に公式情報をご確認ください。",
      "ユーザーが送信する店舗申請、フィードバック、アイコン、画像などは、正確かつ合法であり、第三者の権利を侵害しないものとします。",
      "ログイン機能はアカウント識別とデータ同期のために利用します。未ログインでも端末内に設定や利用記録を保存できます。",
      "Japan Life は安全性、保守、機能改善、法令対応のため、サービス内容を調整する場合があります。",
    ],
  },
} as const;

export default function TermsPage() {
  const { language } = useLanguage();
  const text = copy[language];

  return (
    <main className="min-h-screen bg-[#F6FAFF] px-4 py-5 text-[#0F172A]">
      <div className="mx-auto min-h-screen max-w-[430px] bg-[radial-gradient(circle_at_top,#DFF1FF_0%,#F6FAFF_42%,#FFFFFF_100%)] px-4 py-5">
        <div className="mb-5">
          <BackButton label={text.back} />
        </div>
        <section className="rounded-[28px] border border-white/60 bg-white/75 p-6 shadow-[0_18px_45px_rgba(37,99,235,0.10)] backdrop-blur-xl">
          <h1 className="mb-5 text-2xl font-black">{text.title}</h1>
          <article className="rounded-2xl border border-blue-100 bg-blue-50/70 p-4">
            <h2 className="font-black text-[#2563EB]">{text.section}</h2>
            <ul className="mt-3 grid gap-2 text-sm font-bold leading-7 text-[#334155]">
              {text.items.map((item) => (
                <li className="rounded-2xl bg-white/80 px-3 py-2 shadow-sm" key={item}>{item}</li>
              ))}
            </ul>
          </article>
        </section>
      </div>
    </main>
  );
}
