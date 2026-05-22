"use client";

import { ArrowLeft, Bell, ChevronRight, FileText, Heart, Info, KeyRound, Languages, MessageCircle, Settings, ShieldCheck, UserRound } from "lucide-react";
import Link from "next/link";
import { useLanguage } from "@/hooks/useLanguage";
import { useUserSettings } from "@/hooks/useUserSettings";

const copy = {
  "zh-CN": {
    accountCenter: "账号中心",
    currentSettings: "当前生活设置",
    emptyCurrency: "先设置地区、身份、语言和默认货币",
    emptyProfile: "还没有设置资料",
    favoriteSubtitle: "查看收藏的店铺、地区、App 和文章",
    favoriteTitle: "我的收藏",
    footer: "当前版本不接数据库，不保存账号密码。生活设置、收藏、日历备注和提醒数据保存在当前浏览器本地，可在 App 设置中导出或导入。",
    intro: "这里集中管理收藏、提醒中心、手机通知和本机数据。账号登录功能尚未开启，当前不会收集个人账号资料。",
    setupButton: "设置",
    title: "我的",
    actions: [
      { title: "关于 Japan Life", subtitle: "运营主体、产品说明和联系方式", icon: Info, href: "/about" },
      { title: "联系我们 / 反馈", subtitle: "店铺上架、合作、问题反馈", icon: MessageCircle, href: "/feedback" },
      { title: "隐私政策", subtitle: "localStorage、数据收集、推广说明", icon: ShieldCheck, href: "/privacy" },
      { title: "使用条款", subtitle: "使用本服务前需要了解的规则", icon: FileText, href: "/terms" },
      { title: "免责声明", subtitle: "税金、签证、医疗、房租等仅供参考", icon: FileText, href: "/disclaimer" },
      { title: "账号资料", subtitle: "账号功能预留；当前不收集个人账号资料", icon: UserRound, href: "/me" },
      { title: "修改密码", subtitle: "账号功能预留；当前无需设置密码", icon: KeyRound, href: "/me" },
      { title: "语言与货币", subtitle: "在生活设置中调整语言、地区和默认货币", icon: Languages, href: "/onboarding" },
    ],
  },
  "zh-TW": {
    accountCenter: "帳號中心",
    currentSettings: "目前生活設定",
    emptyCurrency: "先設定地區、身分、語言和預設貨幣",
    emptyProfile: "還沒有設定資料",
    favoriteSubtitle: "查看收藏的店鋪、地區、App 和文章",
    favoriteTitle: "我的收藏",
    footer: "目前版本不接資料庫，不保存帳號密碼。生活設定、收藏、日曆備註和提醒資料會保存在目前瀏覽器本地，可在 App 設定中匯出或匯入。",
    intro: "這裡集中管理收藏、提醒中心、手機通知和本機資料。帳號登入功能尚未開啟，目前不會收集個人帳號資料。",
    setupButton: "設定",
    title: "我的",
    actions: [
      { title: "關於 Japan Life", subtitle: "營運主體、產品說明和聯絡方式", icon: Info, href: "/about" },
      { title: "聯絡我們 / 回饋", subtitle: "店鋪上架、合作、問題回饋", icon: MessageCircle, href: "/feedback" },
      { title: "隱私政策", subtitle: "localStorage、資料收集、推廣說明", icon: ShieldCheck, href: "/privacy" },
      { title: "使用條款", subtitle: "使用本服務前需要了解的規則", icon: FileText, href: "/terms" },
      { title: "免責聲明", subtitle: "稅金、簽證、醫療、房租等僅供參考", icon: FileText, href: "/disclaimer" },
      { title: "帳號資料", subtitle: "帳號功能預留；目前不收集個人帳號資料", icon: UserRound, href: "/me" },
      { title: "修改密碼", subtitle: "帳號功能預留；目前不需要設定密碼", icon: KeyRound, href: "/me" },
      { title: "語言與貨幣", subtitle: "在生活設定中調整語言、地區和預設貨幣", icon: Languages, href: "/onboarding" },
    ],
  },
  ja: {
    accountCenter: "アカウント",
    currentSettings: "現在の生活設定",
    emptyCurrency: "地域、身分、言語、通貨を設定してください",
    emptyProfile: "まだ設定されていません",
    favoriteSubtitle: "保存した店舗、エリア、アプリ、記事を確認",
    favoriteTitle: "お気に入り",
    footer: "現在のバージョンはデータベースに接続せず、アカウントパスワードも保存しません。生活設定、お気に入り、カレンダーメモ、リマインダーは現在のブラウザ内に保存され、アプリ設定から書き出し・読み込みできます。",
    intro: "お気に入り、リマインダー、スマホ通知、端末内データをここで管理できます。ログイン機能はまだ未提供で、現在は個人アカウント情報を収集しません。",
    setupButton: "設定",
    title: "マイページ",
    actions: [
      { title: "Japan Life について", subtitle: "運営、サービス説明、連絡先", icon: Info, href: "/about" },
      { title: "お問い合わせ / フィードバック", subtitle: "店舗掲載、提携、問題報告", icon: MessageCircle, href: "/feedback" },
      { title: "プライバシーポリシー", subtitle: "localStorage、データ収集、広告説明", icon: ShieldCheck, href: "/privacy" },
      { title: "利用規約", subtitle: "サービス利用前に確認するルール", icon: FileText, href: "/terms" },
      { title: "免責事項", subtitle: "税金、ビザ、医療、家賃などは参考情報です", icon: FileText, href: "/disclaimer" },
      { title: "アカウント情報", subtitle: "アカウント機能は準備中です。現在は個人情報を収集しません", icon: UserRound, href: "/me" },
      { title: "パスワード変更", subtitle: "アカウント機能は準備中です。現在はパスワード設定不要です", icon: KeyRound, href: "/me" },
      { title: "言語と通貨", subtitle: "生活設定で言語、地域、既定通貨を調整", icon: Languages, href: "/onboarding" },
    ],
  },
} as const;

const settingsEntryCopy = {
  "zh-CN": {
    subtitle: "通知设置、数据备份、导入导出和本机数据管理",
    title: "App 设置",
  },
  "zh-TW": {
    subtitle: "通知設定、資料備份、匯入匯出和本機資料管理",
    title: "App 設定",
  },
  ja: {
    subtitle: "通知設定、データバックアップ、読み込み、端末内データ管理",
    title: "アプリ設定",
  },
} as const;

const remindersEntryCopy = {
  "zh-CN": {
    subtitle: "查看垃圾日、缴费、节日、在留卡和自定义提醒",
    title: "提醒中心",
  },
  "zh-TW": {
    subtitle: "查看垃圾日、繳費、節日、在留卡和自訂提醒",
    title: "提醒中心",
  },
  ja: {
    subtitle: "ごみ、支払い、祝日、在留カード、カスタム通知を確認",
    title: "リマインダー",
  },
} as const;

export default function MePage() {
  const { language } = useLanguage();
  const text = copy[language];
  const settingsEntry = settingsEntryCopy[language];
  const remindersEntry = remindersEntryCopy[language];
  const { settings, loaded } = useUserSettings();

  return (
    <main className="min-h-screen bg-[#f5f0e7] text-stone-950">
      <div className="mx-auto flex min-h-screen w-full max-w-[430px] flex-col gap-5 bg-[#fbf8f2] px-4 pb-10 pt-5 shadow-2xl shadow-stone-300/40">
        <header className="flex items-center justify-between">
          <Link href="/" className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-emerald-700 shadow-sm">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <span className="rounded-full bg-white px-4 py-2 text-sm font-black text-emerald-700 shadow-sm">Japan Life</span>
        </header>

        <section className="rounded-[30px] bg-emerald-800 p-5 text-white shadow-[0_18px_45px_rgba(18,93,70,0.25)]">
          <div className="flex items-start gap-4">
            <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl bg-white/15">
              <UserRound className="h-8 w-8" />
            </span>
            <div>
              <p className="text-sm font-bold text-emerald-100">{text.accountCenter}</p>
              <h1 className="mt-1 text-3xl font-black tracking-tight">{text.title}</h1>
              <p className="mt-3 text-sm font-semibold leading-6 text-emerald-50">{text.intro}</p>
            </div>
          </div>
        </section>

        <section className="rounded-[28px] bg-white p-5 shadow-[0_12px_35px_rgba(32,38,34,0.08)]">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-black text-stone-500">{text.currentSettings}</p>
              <h2 className="mt-1 text-xl font-black">
                {loaded && settings ? `${settings.region} / ${settings.status}` : text.emptyProfile}
              </h2>
              <p className="mt-1 text-sm font-bold text-stone-500">
                {loaded && settings ? `${settings.language} / ${settings.currency}` : text.emptyCurrency}
              </p>
            </div>
            <Link className="rounded-2xl bg-emerald-700 px-4 py-3 text-sm font-black text-white" href="/onboarding">
              {text.setupButton}
            </Link>
          </div>
        </section>

        <section className="overflow-hidden rounded-[28px] bg-white shadow-[0_12px_35px_rgba(32,38,34,0.08)]">
          <Link href="/favorites" className="flex items-center gap-3 border-b border-stone-100 p-4 transition hover:bg-emerald-50/60">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
              <Heart className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="font-black">{text.favoriteTitle}</h2>
              <p className="text-sm font-bold text-stone-500">{text.favoriteSubtitle}</p>
            </div>
            <ChevronRight className="h-5 w-5 text-stone-400" />
          </Link>

          <Link href="/reminders" className="flex items-center gap-3 border-b border-stone-100 p-4 transition hover:bg-emerald-50/60">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-50 text-sky-700">
              <Bell className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="font-black">{remindersEntry.title}</h2>
              <p className="text-sm font-bold text-stone-500">{remindersEntry.subtitle}</p>
            </div>
            <ChevronRight className="h-5 w-5 text-stone-400" />
          </Link>

          <Link href="/me/settings" className="flex items-center gap-3 border-b border-stone-100 p-4 transition hover:bg-emerald-50/60">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
              <Settings className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="font-black">{settingsEntry.title}</h2>
              <p className="text-sm font-bold text-stone-500">{settingsEntry.subtitle}</p>
            </div>
            <ChevronRight className="h-5 w-5 text-stone-400" />
          </Link>

          {text.actions.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.title} href={item.href} className="flex items-center gap-3 border-b border-stone-100 p-4 transition hover:bg-emerald-50/60 last:border-b-0">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                  <Icon className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <h2 className="font-black">{item.title}</h2>
                  <p className="text-sm font-bold text-stone-500">{item.subtitle}</p>
                </div>
                <ChevronRight className="h-5 w-5 text-stone-400" />
              </Link>
            );
          })}
        </section>

        <section className="rounded-[24px] bg-white/70 p-4 text-xs font-bold leading-5 text-stone-500">
          <Settings className="mb-2 h-4 w-4 text-emerald-700" />
          {text.footer}
        </section>
      </div>
    </main>
  );
}
