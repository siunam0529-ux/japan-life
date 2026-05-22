"use client";

import { Bell, Database, Download, LocateFixed, Mail, ShieldCheck } from "lucide-react";
import { BackButton } from "@/components/BackButton";
import { useLanguage } from "@/hooks/useLanguage";

const copy = {
  "zh-CN": {
    back: "返回",
    title: "隐私政策",
    subtitle: "说明 Japan Life 如何处理定位、通知、本机数据和第三方 API。",
    importantTitle: "重要说明",
    importantBody: "当前版本不需要登录，不接数据库，不会把 localStorage 中的个人设置、备注、提醒或导入导出数据主动上传到 Japan Life 服务器。",
    sections: [
      {
        icon: Database,
        title: "本机保存的数据",
        body: "Japan Life 会使用 localStorage 在你的设备本机保存 App 设置、语言、地区、收藏、日历备注、垃圾日程、每月提醒、提醒状态、通知设置、工资/工时/生活成本工具结果等数据。这些数据用于恢复你的使用状态。",
      },
      {
        icon: LocateFixed,
        title: "定位信息",
        body: "如果你主动点击定位功能，App 会通过浏览器 navigator.geolocation 获取经纬度，并尝试转换为日本地区、城市和天气位置。定位仅在你授权后执行。若你已手动设置地区，App 不会强制覆盖，会提示是否更新为当前位置。",
      },
      {
        icon: Bell,
        title: "手机通知",
        body: "通知功能使用浏览器 Notification API 和 Service Worker，用于垃圾日、缴费、节日、在留卡等生活提醒。Japan Life 不发送营销推送，也不接 Firebase 或远程推送服务器。通知权限只会在你点击开启时申请。",
      },
      {
        icon: Download,
        title: "数据导出 / 导入",
        body: "数据管理功能会把本机数据整理为 JSON，包含 userProfile、settings、calendar、reminders 等分区。导入时只写入 Japan Life 白名单 localStorage key，不会写入未知 key。请妥善保管导出的 JSON，避免泄露个人备注和生活设置。",
      },
      {
        icon: ShieldCheck,
        title: "第三方 API 与外部服务",
        body: "天气可能使用 Open-Meteo API，汇率可能使用 Frankfurter API，日本节日可能使用 Holidays JP API，推荐 App 信息可能使用 Apple iTunes Search API。第三方服务的返回内容、可用性和隐私规则以各服务官方说明为准。",
      },
      {
        icon: ShieldCheck,
        title: "不会出售用户数据",
        body: "Japan Life 不出售用户数据。若未来增加账号登录、云端同步、后端表单、远程通知或上传功能，会在上线前更新隐私政策，并说明收集目的、保存方式和删除方式。",
      },
    ],
    storageTitle: "localStorage 主要保存内容",
    storage: [
      "用户资料与设置：语言、居住地区、默认货币、通知设置、日历显示设置",
      "日历数据：用户备注、垃圾日程、每月提醒",
      "提醒中心：提醒完成 / 忽略状态",
      "工具数据：在留提醒、工资/工时/生活成本等本机结果",
      "天气缓存：所在地区的天气数据缓存，通常约 1 小时更新",
      "提交记录：联系表单、店铺上架申请等本机提交箱记录",
    ],
    contactTitle: "联系与删除",
    contactBody: "如需隐私咨询、内容修正、数据删除协助或合作联系，请发送邮件至 siunam0529@gmail.com。你也可以在 App 设置的数据管理中导出或清除本机数据。",
  },
  "zh-TW": {
    back: "返回",
    title: "隱私政策",
    subtitle: "說明 Japan Life 如何處理定位、通知、本機資料和第三方 API。",
    importantTitle: "重要說明",
    importantBody: "目前版本不需要登入，不接資料庫，不會把 localStorage 中的個人設定、備註、提醒或匯入匯出資料主動上傳到 Japan Life 伺服器。",
    sections: [
      {
        icon: Database,
        title: "本機保存的資料",
        body: "Japan Life 會使用 localStorage 在你的裝置本機保存 App 設定、語言、地區、收藏、日曆備註、垃圾日程、每月提醒、提醒狀態、通知設定、薪資/工時/生活成本工具結果等資料。這些資料用於恢復你的使用狀態。",
      },
      {
        icon: LocateFixed,
        title: "定位資訊",
        body: "如果你主動點擊定位功能，App 會透過瀏覽器 navigator.geolocation 取得經緯度，並嘗試轉換為日本地區、城市和天氣位置。定位只會在你授權後執行。若你已手動設定地區，App 不會強制覆蓋，會提示是否更新為目前位置。",
      },
      {
        icon: Bell,
        title: "手機通知",
        body: "通知功能使用瀏覽器 Notification API 和 Service Worker，用於垃圾日、繳費、節日、在留卡等生活提醒。Japan Life 不發送行銷推播，也不接 Firebase 或遠端推播伺服器。通知權限只會在你點擊開啟時申請。",
      },
      {
        icon: Download,
        title: "資料匯出 / 匯入",
        body: "資料管理功能會把本機資料整理為 JSON，包含 userProfile、settings、calendar、reminders 等分區。匯入時只寫入 Japan Life 白名單 localStorage key，不會寫入未知 key。請妥善保管匯出的 JSON，避免洩露個人備註和生活設定。",
      },
      {
        icon: ShieldCheck,
        title: "第三方 API 與外部服務",
        body: "天氣可能使用 Open-Meteo API，匯率可能使用 Frankfurter API，日本節日可能使用 Holidays JP API，推薦 App 資訊可能使用 Apple iTunes Search API。第三方服務的返回內容、可用性和隱私規則以各服務官方說明為準。",
      },
      {
        icon: ShieldCheck,
        title: "不出售使用者資料",
        body: "Japan Life 不出售使用者資料。若未來增加帳號登入、雲端同步、後端表單、遠端通知或上傳功能，會在上線前更新隱私政策，並說明收集目的、保存方式和刪除方式。",
      },
    ],
    storageTitle: "localStorage 主要保存內容",
    storage: [
      "使用者資料與設定：語言、居住地區、預設貨幣、通知設定、日曆顯示設定",
      "日曆資料：使用者備註、垃圾日程、每月提醒",
      "提醒中心：提醒完成 / 忽略狀態",
      "工具資料：在留提醒、薪資/工時/生活成本等本機結果",
      "天氣快取：所在地區的天氣資料快取，通常約 1 小時更新",
      "提交記錄：聯絡表單、店鋪上架申請等本機提交箱記錄",
    ],
    contactTitle: "聯絡與刪除",
    contactBody: "如需隱私諮詢、內容修正、資料刪除協助或合作聯絡，請發送郵件至 siunam0529@gmail.com。你也可以在 App 設定的資料管理中匯出或清除本機資料。",
  },
  ja: {
    back: "戻る",
    title: "プライバシーポリシー",
    subtitle: "Japan Life における位置情報、通知、端末内データ、外部 API の扱いについて説明します。",
    importantTitle: "重要なお知らせ",
    importantBody: "現在のバージョンはログイン不要、データベース未接続です。localStorage 内の個人設定、メモ、リマインダー、エクスポート/インポートデータを Japan Life のサーバーへ自動送信しません。",
    sections: [
      {
        icon: Database,
        title: "端末内に保存されるデータ",
        body: "Japan Life は localStorage を使い、アプリ設定、言語、地域、お気に入り、カレンダーメモ、ごみ日程、月次リマインダー、リマインダー状態、通知設定、給与/勤務時間/生活費ツールの結果などを端末内に保存します。これらは利用状態を復元するために使われます。",
      },
      {
        icon: LocateFixed,
        title: "位置情報",
        body: "ユーザーが位置情報機能を操作した場合、ブラウザの navigator.geolocation により緯度・経度を取得し、日本の地域、市区町村、天気位置へ変換します。位置情報は許可後のみ取得します。手動で地域を設定済みの場合、強制的に上書きせず、現在地へ更新するか確認します。",
      },
      {
        icon: Bell,
        title: "スマホ通知",
        body: "通知機能はブラウザの Notification API と Service Worker を使い、ごみ収集日、支払い、祝日、在留カードなどの生活リマインダーに利用します。Japan Life は広告通知を送らず、Firebase や遠隔プッシュサーバーにも接続しません。通知権限はユーザー操作時のみ要求します。",
      },
      {
        icon: Download,
        title: "データのエクスポート / インポート",
        body: "データ管理機能は端末内データを JSON として整理し、userProfile、settings、calendar、reminders などの区分を含みます。インポート時は Japan Life が許可した localStorage key のみを書き込み、不明な key は書き込みません。エクスポートした JSON は個人メモや生活設定を含むため、大切に管理してください。",
      },
      {
        icon: ShieldCheck,
        title: "第三者 API と外部サービス",
        body: "天気は Open-Meteo API、為替は Frankfurter API、日本の祝日は Holidays JP API、おすすめアプリ情報は Apple iTunes Search API を利用する場合があります。第三者サービスの内容、可用性、プライバシールールは各サービスの公式説明に従います。",
      },
      {
        icon: ShieldCheck,
        title: "ユーザーデータを販売しません",
        body: "Japan Life はユーザーデータを販売しません。今後アカウントログイン、クラウド同期、バックエンドフォーム、遠隔通知、アップロード機能を追加する場合は、公開前に本ポリシーを更新し、収集目的、保存方法、削除方法を説明します。",
      },
    ],
    storageTitle: "localStorage の主な保存内容",
    storage: [
      "ユーザー情報と設定：言語、居住地域、既定通貨、通知設定、カレンダー表示設定",
      "カレンダーデータ：ユーザーメモ、ごみ日程、月次リマインダー",
      "リマインダーセンター：完了 / 非表示状態",
      "ツールデータ：在留期限、給与/勤務時間/生活費など端末内の結果",
      "天気キャッシュ：選択地域の天気データ。通常は約 1 時間で更新",
      "送信記録：お問い合わせ、店舗掲載申請など端末内の送信箱記録",
    ],
    contactTitle: "お問い合わせと削除",
    contactBody: "プライバシー相談、内容修正、データ削除支援、提携に関するお問い合わせは siunam0529@gmail.com までご連絡ください。アプリ設定のデータ管理から、端末内データのエクスポートや削除もできます。",
  },
} as const;

export default function PrivacyPage() {
  const { language } = useLanguage();
  const text = copy[language];

  return (
    <main className="min-h-screen bg-[#F6FAFF] px-4 py-5 text-[#0F172A]">
      <div className="mx-auto min-h-screen max-w-[430px] bg-[radial-gradient(circle_at_top,#DFF1FF_0%,#F6FAFF_42%,#FFFFFF_100%)] px-4 py-5">
        <div className="mb-5">
          <BackButton fallbackHref="/me" label={text.back} />
        </div>

        <section className="rounded-[28px] border border-white/60 bg-white/75 p-5 shadow-[0_18px_45px_rgba(37,99,235,0.10)] backdrop-blur-xl">
          <ShieldCheck className="h-8 w-8 text-[#2563EB]" />
          <h1 className="mt-3 text-3xl font-black tracking-tight">{text.title}</h1>
          <p className="mt-2 text-sm font-semibold leading-6 text-[#64748B]">{text.subtitle}</p>
        </section>

        <section className="mt-4 rounded-[24px] border border-blue-100 bg-blue-50/80 p-4 shadow-sm">
          <h2 className="font-black text-[#2563EB]">{text.importantTitle}</h2>
          <p className="mt-2 text-sm font-bold leading-7 text-[#334155]">{text.importantBody}</p>
        </section>

        <section className="mt-4 grid gap-3">
          {text.sections.map(({ body, icon: Icon, title }) => (
            <article className="rounded-[24px] border border-white/60 bg-white/75 p-4 shadow-sm backdrop-blur-xl" key={title}>
              <div className="flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-sky-50 text-[#2563EB]">
                  <Icon className="h-5 w-5" />
                </span>
                <h2 className="font-black">{title}</h2>
              </div>
              <p className="mt-3 text-sm font-bold leading-7 text-[#64748B]">{body}</p>
            </article>
          ))}
        </section>

        <section className="mt-4 rounded-[24px] border border-white/60 bg-white/75 p-4 shadow-sm backdrop-blur-xl">
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5 text-[#2563EB]" />
            <h2 className="font-black">{text.storageTitle}</h2>
          </div>
          <ul className="mt-3 grid gap-2 text-sm font-bold leading-7 text-[#64748B]">
            {text.storage.map((item) => (
              <li className="rounded-2xl bg-sky-50/70 px-3 py-2" key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <section className="mt-4 rounded-[24px] border border-white/60 bg-white/75 p-4 text-sm font-bold leading-7 text-[#64748B] shadow-sm backdrop-blur-xl">
          <div className="flex items-center gap-2 text-[#2563EB]">
            <Mail className="h-5 w-5" />
            <span className="font-black">{text.contactTitle}</span>
          </div>
          <p className="mt-2">{text.contactBody}</p>
        </section>
      </div>
    </main>
  );
}
