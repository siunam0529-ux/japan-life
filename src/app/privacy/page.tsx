"use client";

import { Bell, Cloud, Database, Download, LocateFixed, Mail, ShieldCheck, UploadCloud, UserRound } from "lucide-react";
import { BackButton } from "@/components/BackButton";
import { useLanguage } from "@/hooks/useLanguage";

const copy = {
  "zh-CN": {
    back: "返回",
    title: "隐私政策",
    subtitle: "说明 Japan Life 如何处理账号、定位、通知、本机数据、云同步和后台提交。",
    importantTitle: "重要说明",
    importantBody: "Japan Life 会同时使用浏览器本机存储和 Supabase 云端服务。你的个人设置、收藏、备注、提醒等会先保存在当前设备；登录后，App 会尝试把白名单内的本机数据同步到你的账号云端数据中。",
    sections: [
      { icon: UserRound, title: "账号与登录", body: "账号登录、注册、忘记密码、重置密码和 Google 登录由 Supabase Auth 提供。Japan Life 可以读取当前登录用户的邮箱和用户 ID，用于账号状态、数据同步和账号页面展示。" },
      { icon: Cloud, title: "云端同步", body: "登录后，Japan Life 会把 App 设置、语言、地区、收藏、最近浏览、日历备注、垃圾日程、每月提醒、提醒状态、通知设置、工资/工时/在留提醒等白名单数据同步到 Supabase。同步用于换设备或刷新后恢复你的使用状态。" },
      { icon: Database, title: "本机保存的数据", body: "Japan Life 仍会使用 localStorage 保存本机状态，包括语言、地区、首页自选工具、首页自选线路、收藏、日历备注、提醒状态、工资和工时工具结果、头像缓存、天气缓存等。这些数据用于提升速度和离线/弱网体验。" },
      { icon: UploadCloud, title: "上传与后台提交", body: "推荐 App、优惠链接、友好店铺、店铺上架申请和后台上传图片会通过 Supabase 数据库或 Supabase Storage 保存。店铺申请会以待审核状态进入后台，管理员确认后才会公开展示。" },
      { icon: LocateFixed, title: "定位信息", body: "当你主动点击定位功能时，App 会通过浏览器 navigator.geolocation 获取经纬度，并尝试转换为日本都道府县、市区町村和天气区域。用户拒绝定位时不会影响基本使用。" },
      { icon: Bell, title: "通知权限", body: "通知功能使用浏览器 Notification API 和 Service Worker，用于垃圾日、缴费、节日、在留卡等生活提醒。通知权限只会在你主动开启时申请，Japan Life 不发送营销推送。" },
      { icon: Download, title: "导出与导入", body: "数据管理功能会把白名单内本机数据整理为 JSON。导入时只写入 Japan Life 允许的 localStorage key，不会写入未知 key。请妥善保管导出的 JSON，避免泄露个人备注和生活设置。" },
      { icon: ShieldCheck, title: "第三方 API", body: "天气、汇率、日本节假日、App Store 信息等可能来自 Open-Meteo、Frankfurter、Holidays JP、Apple iTunes Search API 等第三方服务。第三方服务的可用性和隐私规则以其官方说明为准。" },
    ],
    storageTitle: "localStorage 主要保存内容",
    storage: ["用户设置、语言、地区、默认货币、通知设置", "首页自选工具、常用线路、收藏、最近浏览", "日历备注、垃圾日程、每月提醒、提醒完成状态", "工资计算结果、工时记录、在留卡提醒、到日清单", "头像缓存、天气缓存、云同步状态"],
    contactTitle: "联系与删除",
    contactBody: "如需隐私咨询、内容修正、数据删除协助或合作联系，请发送邮件至 siunam0529@gmail.com。你也可以在 App 设置的数据管理中导出或清除本机数据。",
  },
  "zh-TW": {
    back: "返回",
    title: "隱私政策",
    subtitle: "說明 Japan Life 如何處理帳號、定位、通知、本機資料、雲端同步和後台提交。",
    importantTitle: "重要說明",
    importantBody: "Japan Life 會同時使用瀏覽器本機儲存和 Supabase 雲端服務。你的個人設定、收藏、備註、提醒等會先保存在目前裝置；登入後，App 會嘗試把白名單內的本機資料同步到你的帳號雲端資料中。",
    sections: [
      { icon: UserRound, title: "帳號與登入", body: "帳號登入、註冊、忘記密碼、重設密碼和 Google 登入由 Supabase Auth 提供。Japan Life 可以讀取目前登入使用者的 email 和 user ID，用於帳號狀態、資料同步和帳號頁展示。" },
      { icon: Cloud, title: "雲端同步", body: "登入後，Japan Life 會把 App 設定、語言、地區、收藏、最近瀏覽、日曆備註、垃圾日程、每月提醒、提醒狀態、通知設定、薪資/工時/在留提醒等白名單資料同步到 Supabase。" },
      { icon: Database, title: "本機保存的資料", body: "Japan Life 仍會使用 localStorage 保存本機狀態，包括語言、地區、首頁自選工具、首頁自選路線、收藏、日曆備註、提醒狀態、薪資和工時工具結果、頭像快取、天氣快取等。" },
      { icon: UploadCloud, title: "上傳與後台提交", body: "推薦 App、優惠連結、友好店鋪、店鋪上架申請和後台上傳圖片會透過 Supabase 資料庫或 Supabase Storage 保存。店鋪申請會以待審核狀態進入後台。" },
      { icon: LocateFixed, title: "定位資訊", body: "當你主動點擊定位功能時，App 會透過瀏覽器 navigator.geolocation 取得經緯度，並嘗試轉換為日本都道府縣、市區町村和天氣區域。拒絕定位時不會影響基本使用。" },
      { icon: Bell, title: "通知權限", body: "通知功能使用瀏覽器 Notification API 和 Service Worker，用於垃圾日、繳費、節日、在留卡等生活提醒。通知權限只會在你主動開啟時申請，Japan Life 不發送行銷推播。" },
      { icon: Download, title: "匯出與匯入", body: "資料管理功能會把白名單內本機資料整理為 JSON。匯入時只寫入 Japan Life 允許的 localStorage key，不會寫入未知 key。請妥善保管匯出的 JSON。" },
      { icon: ShieldCheck, title: "第三方 API", body: "天氣、匯率、日本節假日、App Store 資訊等可能來自 Open-Meteo、Frankfurter、Holidays JP、Apple iTunes Search API 等第三方服務。" },
    ],
    storageTitle: "localStorage 主要保存內容",
    storage: ["使用者設定、語言、地區、預設貨幣、通知設定", "首頁自選工具、常用路線、收藏、最近瀏覽", "日曆備註、垃圾日程、每月提醒、提醒完成狀態", "薪資計算結果、工時記錄、在留卡提醒、到日清單", "頭像快取、天氣快取、雲端同步狀態"],
    contactTitle: "聯絡與刪除",
    contactBody: "如需隱私諮詢、內容修正、資料刪除協助或合作聯絡，請寄信至 siunam0529@gmail.com。你也可以在 App 設定的資料管理中匯出或清除本機資料。",
  },
  ja: {
    back: "戻る",
    title: "プライバシーポリシー",
    subtitle: "Japan Life におけるアカウント、位置情報、通知、端末内データ、クラウド同期、管理画面への送信について説明します。",
    importantTitle: "重要なお知らせ",
    importantBody: "Japan Life はブラウザの端末内ストレージと Supabase のクラウドサービスを併用します。設定、保存項目、メモ、リマインダーなどはまず端末内に保存され、ログイン後は許可されたデータのみアカウントのクラウドデータへ同期されます。",
    sections: [
      { icon: UserRound, title: "アカウントとログイン", body: "メールログイン、登録、パスワード再設定、Google ログインは Supabase Auth により提供されます。Japan Life はログイン中ユーザーのメールアドレスとユーザー ID を、アカウント表示と同期に利用します。" },
      { icon: Cloud, title: "クラウド同期", body: "ログイン後、App 設定、言語、地域、お気に入り、最近見た項目、カレンダーメモ、ごみ日程、月次リマインダー、通知設定、給与/勤務時間/在留カードリマインダーなどを Supabase に同期します。" },
      { icon: Database, title: "端末内に保存されるデータ", body: "Japan Life は localStorage を使い、言語、地域、ホーム表示ツール、路線、お気に入り、カレンダーメモ、通知状態、給与・勤務時間ツール結果、アイコンキャッシュ、天気キャッシュなどを端末内に保存します。" },
      { icon: UploadCloud, title: "アップロードと管理画面送信", body: "おすすめ App、特典リンク、友好店舗、店舗掲載申請、管理画面でアップロードされた画像は Supabase Database または Supabase Storage に保存されます。店舗申請は審査待ちとして保存され、管理者承認後に公開されます。" },
      { icon: LocateFixed, title: "位置情報", body: "ユーザーが位置情報機能を操作した場合、ブラウザの navigator.geolocation で緯度・経度を取得し、日本の都道府県、市区町村、天気エリアへ変換します。拒否しても基本機能は利用できます。" },
      { icon: Bell, title: "通知権限", body: "通知はブラウザ Notification API と Service Worker を使い、ごみの日、支払い、祝日、在留カードなどの生活リマインダーに利用します。マーケティング通知は送信しません。" },
      { icon: Download, title: "エクスポートとインポート", body: "データ管理機能は許可された端末内データを JSON として整理します。インポート時は Japan Life が許可した localStorage key のみを書き込みます。" },
      { icon: ShieldCheck, title: "第三者 API", body: "天気、為替、日本の祝日、App Store 情報などは Open-Meteo、Frankfurter、Holidays JP、Apple iTunes Search API などの第三者サービスを利用する場合があります。" },
    ],
    storageTitle: "localStorage の主な保存内容",
    storage: ["ユーザー設定、言語、地域、標準通貨、通知設定", "ホーム表示ツール、よく使う路線、お気に入り、最近見た項目", "カレンダーメモ、ごみ日程、月次リマインダー、完了状態", "給与計算結果、勤務時間、在留カードリマインダー、到着チェックリスト", "アイコンキャッシュ、天気キャッシュ、クラウド同期状態"],
    contactTitle: "連絡と削除",
    contactBody: "プライバシー相談、内容修正、データ削除のサポート、提携に関するお問い合わせは siunam0529@gmail.com までご連絡ください。App 設定のデータ管理から端末内データのエクスポートや削除もできます。",
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
            {text.storage.map((item) => <li className="rounded-2xl bg-sky-50/70 px-3 py-2" key={item}>{item}</li>)}
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
