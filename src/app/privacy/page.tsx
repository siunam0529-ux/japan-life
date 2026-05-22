"use client";

import { ArrowLeft, Database, Mail, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useLanguage } from "@/hooks/useLanguage";

const copy = {
  "zh-CN": {
    back: "返回",
    title: "隐私政策",
    subtitle: "Privacy Policy / プライバシーポリシー",
    storageTitle: "localStorage 保存内容",
    contactTitle: "联系",
    contactBody: "隐私、数据删除、内容修正或合作问题，请联系 siunam0529@gmail.com。",
    storage: [
      "用户设置：居住地区、身份、语言偏好、默认货币、是否打工、是否租房、onboarding 完成状态",
      "收藏内容：收藏的地区、店铺、文章、推荐 App、优惠推荐",
      "最近查看：用户在本机浏览过的入口记录",
      "工资计算、打工时间、生活成本、在留提醒、日本日历个人备注等本地工具数据",
    ],
    blocks: [
      ["数据收集", "Japan Life 第一版会在用户设备本地保存部分使用数据，用于恢复收藏、设置、提醒和计算结果。当前版本不接数据库，不需要登录，不会把这些 localStorage 数据上传到服务器。"],
      ["运营主体", "开发者/运营主体名称：小南。联系邮箱：siunam0529@gmail.com。"],
      ["推广链接", "优惠推荐、推荐 App 或生活服务入口中，未来可能包含 affiliate 推广链接。含推广关系的页面会尽量标明“推广/广告”说明，用户仍应以官方页面的价格、条件和条款为准。"],
      ["第三方 API", "汇率可能使用 Frankfurter API，日本国民祝日可能使用 Holidays JP API，推荐 App 信息可能使用 Apple iTunes Search API。第三方服务的可用性、返回内容和隐私规则以各服务官方说明为准。"],
      ["不出售用户数据", "Japan Life 不出售用户数据。若后续增加账号、服务器同步、通知或上传功能，会在上线前更新隐私政策并说明用途。"],
      ["Apple App Privacy / Google Play Data safety 参考口径", "当前版本可按“收集数据：是”准备表单，因为 App 会在设备本地保存用户设置、收藏、备注和提醒。若上架包不上传这些数据到服务器，可在表单中说明数据主要保存在设备本地，用于 App 功能；是否属于 Apple/Google 表单中的具体分类，需要以上架包实际功能为准最终填写。"],
    ],
  },
  "zh-TW": {
    back: "返回",
    title: "隱私政策",
    subtitle: "Privacy Policy / プライバシーポリシー",
    storageTitle: "localStorage 儲存內容",
    contactTitle: "聯絡",
    contactBody: "隱私、資料刪除、內容修正或合作問題，請聯絡 siunam0529@gmail.com。",
    storage: [
      "使用者設定：居住地區、身份、語言偏好、預設貨幣、是否打工、是否租屋、onboarding 完成狀態",
      "收藏內容：收藏的地區、店鋪、文章、推薦 App、優惠推薦",
      "最近查看：使用者在本機瀏覽過的入口記錄",
      "薪資計算、打工時間、生活成本、在留提醒、日本日曆個人備註等本地工具資料",
    ],
    blocks: [
      ["資料收集", "Japan Life 第一版會在使用者裝置本地儲存部分使用資料，用於恢復收藏、設定、提醒和計算結果。目前版本未連接資料庫，不需要登入，也不會把這些 localStorage 資料上傳到伺服器。"],
      ["營運主體", "開發者/營運主體名稱：小南。聯絡信箱：siunam0529@gmail.com。"],
      ["推廣連結", "優惠推薦、推薦 App 或生活服務入口中，未來可能包含 affiliate 推廣連結。含推廣關係的頁面會盡量標明「推廣/廣告」說明，使用者仍應以官方頁面的價格、條件和條款為準。"],
      ["第三方 API", "匯率可能使用 Frankfurter API，日本國民假日可能使用 Holidays JP API，推薦 App 資訊可能使用 Apple iTunes Search API。第三方服務的可用性、返回內容和隱私規則以各服務官方說明為準。"],
      ["不出售使用者資料", "Japan Life 不出售使用者資料。若後續增加帳號、伺服器同步、通知或上傳功能，會在上線前更新隱私政策並說明用途。"],
      ["Apple App Privacy / Google Play Data safety 參考口徑", "目前版本可按「收集資料：是」準備表單，因為 App 會在裝置本地儲存使用者設定、收藏、備註和提醒。若上架包不將這些資料上傳到伺服器，可在表單中說明資料主要保存在裝置本地，用於 App 功能；是否屬於 Apple/Google 表單中的具體分類，需要以上架包實際功能為準最終填寫。"],
    ],
  },
  ja: {
    back: "戻る",
    title: "プライバシーポリシー",
    subtitle: "Privacy Policy",
    storageTitle: "localStorage に保存される内容",
    contactTitle: "連絡先",
    contactBody: "プライバシー、データ削除、内容修正、提携に関するお問い合わせは siunam0529@gmail.com までご連絡ください。",
    storage: [
      "ユーザー設定：居住エリア、在留状況、言語、既定通貨、アルバイト状況、賃貸状況、初期設定の完了状態",
      "保存した項目：エリア、お店、記事、おすすめアプリ、お得情報",
      "最近見た項目：この端末で閲覧した入口の記録",
      "給与計算、勤務時間、生活費、在留期限、日本カレンダーのメモなど端末内のツールデータ",
    ],
    blocks: [
      ["データ収集", "Japan Life の初期版は、保存項目、設定、リマインダー、計算結果を復元するため、一部の利用データを端末内に保存します。現在のバージョンはデータベースに接続せず、ログインも不要で、localStorage のデータをサーバーへ送信しません。"],
      ["運営者", "開発者/運営者名：小南。メール：siunam0529@gmail.com。"],
      ["プロモーションリンク", "お得情報、おすすめアプリ、生活サービス入口には、将来的に affiliate リンクが含まれる場合があります。プロモーション関係があるページではできる限り表示し、価格、条件、規約は公式ページを確認してください。"],
      ["第三者 API", "為替は Frankfurter API、日本の祝日は Holidays JP API、おすすめアプリ情報は Apple iTunes Search API を利用する場合があります。第三者サービスの可用性、返却内容、プライバシールールは各サービスの公式説明に従います。"],
      ["ユーザーデータを販売しません", "Japan Life はユーザーデータを販売しません。今後アカウント、サーバー同期、通知、アップロード機能を追加する場合は、公開前にプライバシーポリシーを更新し、用途を説明します。"],
      ["Apple App Privacy / Google Play Data safety の参考", "現在のバージョンは端末内に設定、保存項目、メモ、リマインダーを保存するため、「データ収集あり」として準備する想定です。これらをサーバーへ送信しない場合は、主に端末内保存でアプリ機能のために使う旨を説明できます。最終的な分類は実際の公開パッケージに合わせて確認してください。"],
    ],
  },
} as const;

export default function PrivacyPage() {
  const { language } = useLanguage();
  const text = copy[language];

  return (
    <main className="min-h-screen bg-[#f5f0e7] px-4 py-5 text-stone-950">
      <div className="mx-auto min-h-screen max-w-[430px] bg-[#fbf8f2] px-4 py-5 shadow-2xl shadow-stone-300/40">
        <Link className="mb-5 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-black shadow-sm" href="/me">
          <ArrowLeft className="h-4 w-4" />
          {text.back}
        </Link>

        <section className="rounded-[30px] bg-emerald-800 p-5 text-white shadow-[0_18px_45px_rgba(18,93,70,0.25)]">
          <ShieldCheck className="h-8 w-8" />
          <h1 className="mt-3 text-3xl font-black">{text.title}</h1>
          <p className="mt-2 text-sm font-semibold leading-6 text-emerald-50">{text.subtitle}</p>
        </section>

        <section className="mt-4 grid gap-3">
          {text.blocks.map(([title, body]) => (
            <article className="rounded-[24px] bg-white p-4 shadow-sm" key={title}>
              <h2 className="font-black text-emerald-800">{title}</h2>
              <p className="mt-2 text-sm font-bold leading-7 text-stone-600">{body}</p>
            </article>
          ))}
        </section>

        <section className="mt-4 rounded-[24px] bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5 text-emerald-700" />
            <h2 className="font-black">{text.storageTitle}</h2>
          </div>
          <ul className="mt-3 grid gap-2 text-sm font-bold leading-7 text-stone-600">
            {text.storage.map((item) => (
              <li key={item}>- {item}</li>
            ))}
          </ul>
        </section>

        <section className="mt-4 rounded-[24px] bg-white p-4 text-sm font-bold leading-7 text-stone-600 shadow-sm">
          <div className="flex items-center gap-2 text-emerald-800">
            <Mail className="h-5 w-5" />
            <span className="font-black">{text.contactTitle}</span>
          </div>
          <p className="mt-2">{text.contactBody}</p>
        </section>
      </div>
    </main>
  );
}
