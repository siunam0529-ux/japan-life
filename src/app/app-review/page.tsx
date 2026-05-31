"use client";

import { CheckCircle2, KeyRound, LinkIcon, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { BackButton } from "@/components/BackButton";
import { useLanguage } from "@/hooks/useLanguage";

const routeHrefs = ["/", "/tools/train-status", "/food", "/tools/rent", "/me", "/account", "/data-status", "/privacy", "/terms", "/disclaimer"] as const;

const appReviewCopy = {
  "zh-CN": {
    back: "返回",
    title: "审核说明",
    subtitle: "这里用于准备 App Store 审核和试运营自查，不展示敏感密码。测试账号请填写在 App Store Connect Review Notes。",
    accountTitle: "审核账号与流程",
    reviewItems: [
      "如果审核需要登录，请在 App Store Connect 的 Review Notes 填写测试账号邮箱和密码。",
      "不登录也可以使用首页、天气、汇率、东京交通、今天吃什么、随机散步、今天去哪玩、租房助手等主要功能。",
      "登录后可测试头像、云同步、收藏、提醒和账号删除。",
      "账号删除入口：我的 → 账号与密码 → 删除账号。",
      "数据来源说明入口：我的 → 数据来源与状态。",
      "反馈和支持入口：我的 → 联系 / 反馈。",
    ],
    routesTitle: "审核常用入口",
    routeLabels: ["首页", "东京交通", "今天吃什么", "租房助手", "我的", "账号与密码", "数据来源与状态", "隐私政策", "使用条款", "免责声明"],
    reminderTitle: "提交前提醒",
    reminder: "请确认生产环境变量、Supabase URL/Auth 回调、ODPT、HotPepper、隐私政策 URL、支持 URL 和测试账号都已在正式环境配置好。",
  },
  "zh-TW": {
    back: "返回",
    title: "審核說明",
    subtitle: "這裡用於準備 App Store 審核和試營運自查，不展示敏感密碼。測試帳號請填寫在 App Store Connect Review Notes。",
    accountTitle: "審核帳號與流程",
    reviewItems: [
      "如果審核需要登入，請在 App Store Connect 的 Review Notes 填寫測試帳號信箱和密碼。",
      "不登入也可以使用首頁、天氣、匯率、東京交通、今天吃什麼、隨機散步、今天去哪玩、租屋助手等主要功能。",
      "登入後可測試頭像、雲同步、收藏、提醒和帳號刪除。",
      "帳號刪除入口：我的 → 帳號與密碼 → 刪除帳號。",
      "資料來源說明入口：我的 → 資料來源與狀態。",
      "回饋和支援入口：我的 → 聯絡 / 回饋。",
    ],
    routesTitle: "審核常用入口",
    routeLabels: ["首頁", "東京交通", "今天吃什麼", "租屋助手", "我的", "帳號與密碼", "資料來源與狀態", "隱私政策", "使用條款", "免責聲明"],
    reminderTitle: "提交前提醒",
    reminder: "請確認正式環境變數、Supabase URL/Auth 回呼、ODPT、HotPepper、隱私政策 URL、支援 URL 和測試帳號都已在正式環境配置好。",
  },
  ja: {
    back: "戻る",
    title: "審査メモ",
    subtitle: "App Store 審査と試験運用の確認用ページです。機密パスワードは表示しません。テストアカウントは App Store Connect の Review Notes に記載してください。",
    accountTitle: "審査アカウントと手順",
    reviewItems: [
      "審査でログインが必要な場合、App Store Connect の Review Notes にテスト用メールとパスワードを記載してください。",
      "ログインなしでもホーム、天気、為替、東京交通、今日なに食べる、ランダム散歩、今日どこ行く、賃貸サポートなど主要機能を利用できます。",
      "ログイン後はアバター、クラウド同期、保存、リマインダー、アカウント削除をテストできます。",
      "アカウント削除：マイページ → アカウントとパスワード → アカウント削除。",
      "データソース説明：マイページ → データ来源と状態。",
      "フィードバックとサポート：マイページ → 連絡 / フィードバック。",
    ],
    routesTitle: "審査で使う入口",
    routeLabels: ["ホーム", "東京交通", "今日なに食べる", "賃貸サポート", "マイページ", "アカウントとパスワード", "データ来源と状態", "プライバシーポリシー", "利用規約", "免責事項"],
    reminderTitle: "提出前の確認",
    reminder: "本番環境変数、Supabase URL/Auth コールバック、ODPT、HotPepper、プライバシーポリシー URL、サポート URL、テストアカウントが本番環境で設定済みか確認してください。",
  },
} as const;

export default function AppReviewPage() {
  const { language } = useLanguage();
  const text = appReviewCopy[language];
  const routeItems = routeHrefs.map((href, index) => ({ href, label: text.routeLabels[index] }));

  return (
    <main className="min-h-screen bg-[#F6FAFF] px-4 py-5 text-[#0F172A]">
      <div className="mx-auto min-h-screen max-w-[430px] px-1 pb-10">
        <div className="mb-5">
          <BackButton fallbackHref="/me" label={text.back} />
        </div>

        <section className="rounded-[28px] border border-white/60 bg-white/75 p-5 shadow-[0_18px_45px_rgba(37,99,235,0.10)] backdrop-blur-xl">
          <p className="text-sm font-black text-[#2563EB]">Japan Life</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight">{text.title}</h1>
          <p className="mt-3 text-sm font-bold leading-6 text-[#64748B]">
            {text.subtitle}
          </p>
        </section>

        <section className="mt-5 rounded-[28px] border border-white/60 bg-white/80 p-4 shadow-[0_10px_35px_rgba(37,99,235,0.08)]">
          <h2 className="flex items-center gap-2 text-lg font-black">
            <KeyRound className="h-5 w-5 text-[#2563EB]" />
            {text.accountTitle}
          </h2>
          <div className="mt-3 grid gap-2">
            {text.reviewItems.map((item) => (
              <p className="flex items-start gap-2 rounded-2xl bg-blue-50/80 px-3 py-2 text-xs font-bold leading-5 text-[#475569]" key={item}>
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                {item}
              </p>
            ))}
          </div>
        </section>

        <section className="mt-5 rounded-[28px] border border-white/60 bg-white/80 p-4 shadow-[0_10px_35px_rgba(37,99,235,0.08)]">
          <h2 className="flex items-center gap-2 text-lg font-black">
            <LinkIcon className="h-5 w-5 text-[#2563EB]" />
            {text.routesTitle}
          </h2>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {routeItems.map((item) => (
              <Link className="rounded-2xl border border-blue-100 bg-blue-50/70 px-3 py-3 text-center text-xs font-black text-[#2563EB]" href={item.href} key={item.href}>
                {item.label}
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-5 rounded-[24px] border border-amber-100 bg-amber-50/90 p-4">
          <h2 className="flex items-center gap-2 text-sm font-black text-amber-900">
            <ShieldCheck className="h-5 w-5" />
            {text.reminderTitle}
          </h2>
          <p className="mt-2 text-xs font-bold leading-5 text-amber-900/80">
            {text.reminder}
          </p>
        </section>
      </div>
    </main>
  );
}
