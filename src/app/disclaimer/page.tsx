"use client";

import { AlertTriangle, BadgeJapaneseYen, BriefcaseBusiness, FileWarning, HeartPulse, Home, Landmark, Plane } from "lucide-react";
import { BackButton } from "@/components/BackButton";
import { useLanguage } from "@/hooks/useLanguage";

const copy = {
  "zh-CN": {
    back: "返回",
    title: "免责声明",
    subtitle: "Japan Life 是生活辅助工具，不替代官方信息或专业意见。",
    warningTitle: "请务必以官方和专业人士意见为准",
    warningBody: "本 App 中涉及金钱、税务、签证、在留、医疗、房租、政策福利等内容均为生活参考和估算，不构成法律、税务、医疗、投资、不动产或行政手续建议。",
    sections: [
      {
        icon: BadgeJapaneseYen,
        title: "工资、税金、汇率与生活成本",
        body: "工资计算、税后收入、汇率换算、生活成本和房租评估仅为概算。实际金额会因公司制度、社保、住民税、汇率、银行手续费、地区和个人条件不同而变化。",
      },
      {
        icon: Plane,
        title: "签证、在留和行政手续",
        body: "在留提醒、期限倒数和手续说明只用于提醒。签证、在留资格、更新材料、提交期限等请以出入国在留管理厅、市区町村窗口或行政书士等专业人士确认结果为准。",
      },
      {
        icon: HeartPulse,
        title: "医疗、保险和紧急信息",
        body: "医院、保险、急病、灾害或紧急联系信息仅供查找入口和生活参考。身体不适、紧急情况或医疗判断请立即联系医疗机构、急救电话或专业人士。",
      },
      {
        icon: Home,
        title: "房租、不动产和店铺信息",
        body: "房租评估、地区对比、外国人友好店铺、优惠和商家信息可能随时间变化。签约、付款、上架、拜访店铺前，请确认官方页面、合同内容、店铺最新公告和现场条件。",
      },
      {
        icon: Landmark,
        title: "政策福利和官方入口",
        body: "补助金、支援制度、税金通知、手续入口和政策信息可能因地区、身份、收入、家庭情况和发布日期不同而变化。申请前请以政府、自治体或相关机构的最新公告为准。",
      },
      {
        icon: BriefcaseBusiness,
        title: "工作、打工和劳动时间",
        body: "打工时间、工资估算和工作限制提醒仅供自我管理。具体劳动条件、在留资格限制、雇佣合同和薪资明细请以雇主、学校、入管或劳动相关机构确认结果为准。",
      },
    ],
    footerTitle: "数据可能延迟或不完整",
    footerBody: "天气、汇率、节日、地区、优惠、推荐 App、交通和店铺数据可能来自第三方 API、本地整理或用户设置，可能出现延迟、遗漏或变更。使用前请再次确认官方来源。",
  },
  "zh-TW": {
    back: "返回",
    title: "免責聲明",
    subtitle: "Japan Life 是生活輔助工具，不替代官方資訊或專業意見。",
    warningTitle: "請務必以官方和專業人士意見為準",
    warningBody: "本 App 中涉及金錢、稅務、簽證、在留、醫療、房租、政策福利等內容均為生活參考和估算，不構成法律、稅務、醫療、投資、不動產或行政手續建議。",
    sections: [
      {
        icon: BadgeJapaneseYen,
        title: "薪資、稅金、匯率與生活成本",
        body: "薪資計算、稅後收入、匯率換算、生活成本和房租評估僅為概算。實際金額會因公司制度、社保、住民稅、匯率、銀行手續費、地區和個人條件不同而變化。",
      },
      {
        icon: Plane,
        title: "簽證、在留和行政手續",
        body: "在留提醒、期限倒數和手續說明只用於提醒。簽證、在留資格、更新材料、提交期限等請以出入國在留管理廳、市區町村窗口或行政書士等專業人士確認結果為準。",
      },
      {
        icon: HeartPulse,
        title: "醫療、保險和緊急資訊",
        body: "醫院、保險、急病、災害或緊急聯絡資訊僅供查找入口和生活參考。身體不適、緊急情況或醫療判斷請立即聯絡醫療機構、急救電話或專業人士。",
      },
      {
        icon: Home,
        title: "房租、不動產和店鋪資訊",
        body: "房租評估、地區對比、外國人友好店鋪、優惠和商家資訊可能隨時間變化。簽約、付款、上架、拜訪店鋪前，請確認官方頁面、合約內容、店鋪最新公告和現場條件。",
      },
      {
        icon: Landmark,
        title: "政策福利和官方入口",
        body: "補助金、支援制度、稅金通知、手續入口和政策資訊可能因地區、身份、收入、家庭情況和發布日期不同而變化。申請前請以政府、自治體或相關機構的最新公告為準。",
      },
      {
        icon: BriefcaseBusiness,
        title: "工作、打工和勞動時間",
        body: "打工時間、薪資估算和工作限制提醒僅供自我管理。具體勞動條件、在留資格限制、僱傭合約和薪資明細請以雇主、學校、入管或勞動相關機構確認結果為準。",
      },
    ],
    footerTitle: "資料可能延遲或不完整",
    footerBody: "天氣、匯率、節日、地區、優惠、推薦 App、交通和店鋪資料可能來自第三方 API、本地整理或使用者設定，可能出現延遲、遺漏或變更。使用前請再次確認官方來源。",
  },
  ja: {
    back: "戻る",
    title: "免責事項",
    subtitle: "Japan Life は生活補助ツールであり、公式情報や専門家の意見に代わるものではありません。",
    warningTitle: "必ず公式情報と専門家の確認を優先してください",
    warningBody: "本アプリの金銭、税金、ビザ、在留、医療、家賃、政策支援に関する内容は生活上の参考と概算であり、法律、税務、医療、投資、不動産、行政手続きの助言ではありません。",
    sections: [
      {
        icon: BadgeJapaneseYen,
        title: "給与、税金、為替、生活費",
        body: "給与計算、手取り、為替換算、生活費、家賃チェックは概算です。実際の金額は会社制度、社会保険、住民税、為替、銀行手数料、地域、個人条件により変わります。",
      },
      {
        icon: Plane,
        title: "ビザ、在留、行政手続き",
        body: "在留期限リマインダー、期限カウント、手続き説明は確認用です。ビザ、在留資格、更新書類、提出期限は出入国在留管理庁、市区町村窓口、行政書士など専門家の確認を優先してください。",
      },
      {
        icon: HeartPulse,
        title: "医療、保険、緊急情報",
        body: "病院、保険、急病、災害、緊急連絡先の情報は入口検索と生活参考用です。体調不良、緊急時、医療判断が必要な場合は、医療機関、救急、専門家へすぐ相談してください。",
      },
      {
        icon: Home,
        title: "家賃、不動産、店舗情報",
        body: "家賃チェック、エリア比較、外国人にやさしい店舗、お得情報、店舗情報は変わる場合があります。契約、支払い、掲載申請、来店前には公式ページ、契約内容、店舗の最新案内、現地条件を確認してください。",
      },
      {
        icon: Landmark,
        title: "政策支援と公式入口",
        body: "補助金、支援制度、税金通知、手続き入口、政策情報は地域、在留状況、収入、世帯、公開日により変わります。申請前に政府、自治体、関係機関の最新案内をご確認ください。",
      },
      {
        icon: BriefcaseBusiness,
        title: "仕事、アルバイト、勤務時間",
        body: "勤務時間、給与概算、就労制限リマインダーは自己管理用です。具体的な労働条件、在留資格の制限、雇用契約、給与明細は雇用主、学校、入管、労働関連機関へ確認してください。",
      },
    ],
    footerTitle: "データは遅延または不完全な場合があります",
    footerBody: "天気、為替、祝日、地域、お得情報、おすすめアプリ、交通、店舗データは第三者 API、ローカル整理、ユーザー設定に基づく場合があり、遅延、欠落、変更が起こる可能性があります。利用前に公式情報を再確認してください。",
  },
} as const;

export default function DisclaimerPage() {
  const { language } = useLanguage();
  const text = copy[language];

  return (
    <main className="min-h-screen bg-[#F6FAFF] px-4 py-5 text-[#0F172A]">
      <div className="mx-auto min-h-screen max-w-[430px] bg-[radial-gradient(circle_at_top,#DFF1FF_0%,#F6FAFF_42%,#FFFFFF_100%)] px-4 py-5">
        <div className="mb-5">
          <BackButton fallbackHref="/me" label={text.back} />
        </div>

        <section className="rounded-[28px] border border-white/60 bg-white/75 p-5 shadow-[0_18px_45px_rgba(37,99,235,0.10)] backdrop-blur-xl">
          <FileWarning className="h-8 w-8 text-[#F97316]" />
          <h1 className="mt-3 text-3xl font-black tracking-tight">{text.title}</h1>
          <p className="mt-2 text-sm font-semibold leading-6 text-[#64748B]">{text.subtitle}</p>
        </section>

        <section className="mt-4 rounded-[24px] border border-orange-100 bg-orange-50/90 p-4 shadow-sm">
          <div className="flex items-center gap-2 text-[#C2410C]">
            <AlertTriangle className="h-5 w-5" />
            <h2 className="font-black">{text.warningTitle}</h2>
          </div>
          <p className="mt-2 text-sm font-bold leading-7 text-[#7C2D12]">{text.warningBody}</p>
        </section>

        <section className="mt-4 grid gap-3">
          {text.sections.map(({ body, icon: Icon, title }) => (
            <article className="rounded-[24px] border border-white/60 bg-white/75 p-4 shadow-sm backdrop-blur-xl" key={title}>
              <div className="flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-orange-50 text-[#F97316]">
                  <Icon className="h-5 w-5" />
                </span>
                <h2 className="font-black">{title}</h2>
              </div>
              <p className="mt-3 text-sm font-bold leading-7 text-[#64748B]">{body}</p>
            </article>
          ))}
        </section>

        <section className="mt-4 rounded-[24px] border border-white/60 bg-white/75 p-4 shadow-sm backdrop-blur-xl">
          <h2 className="font-black text-[#2563EB]">{text.footerTitle}</h2>
          <p className="mt-2 text-sm font-bold leading-7 text-[#64748B]">{text.footerBody}</p>
        </section>
      </div>
    </main>
  );
}
