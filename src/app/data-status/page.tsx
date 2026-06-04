"use client";

import { AlertTriangle, CheckCircle2, CloudSun, Database, ExternalLink, RefreshCw, ShieldCheck, Store, TrainFront } from "lucide-react";
import Link from "next/link";
import { BackButton } from "@/components/BackButton";
import { useLanguage } from "@/hooks/useLanguage";

type DataStatusItem = {
  body: string;
  icon: typeof TrainFront;
  live: boolean;
  status: string;
  title: string;
};

const copy = {
  "zh-CN": {
    back: "返回",
    title: "数据来源与状态",
    subtitle: "这里说明 Japan Life 的信息来源，方便你判断哪些内容会实时更新，哪些内容适合当作参考。",
    liveTitle: "会实时更新的内容",
    referenceTitle: "整理好的参考内容",
    noteTitle: "使用前请确认",
    noteBody: "交通、票券、房租、福利、店铺、汇率和天气都可能延迟或变化。涉及出行、付款、申请、签约前，请以官方信息和现场情况为准。",
    feedback: "发现数据不准？去反馈",
    items: [
      { icon: TrainFront, title: "东京交通 / 车站", status: "实时来源", body: "交通运行状态和车站搜索会读取公开交通数据。暂时读取不到时，页面会直接提示，不会显示过期状态当作实时结果。", live: true },
      { icon: Store, title: "吃喝 / 美容美发店铺", status: "店铺来源", body: "餐厅和部分美容美发店铺会结合公开店铺信息与 Japan Life 已收录内容展示。预约、优惠和营业状态请以跳转后的店铺页面为准。", live: true },
      { icon: CloudSun, title: "天气", status: "天气来源", body: "首页天气、天气页和天气提醒会读取天气数据。网络不稳定时可能显示缓存或提示稍后再试。", live: true },
      { icon: RefreshCw, title: "汇率", status: "汇率来源", body: "汇率会读取公开汇率数据。周末或节假日可能停留在最近一个交易日，这是汇率来源本身的更新节奏。", live: true },
      { icon: Database, title: "社区 / 通知 / 私信", status: "账号数据", body: "社区、通知、关注、私信等账号相关内容会跟随你的 Japan Life 账号保存和读取。", live: true },
      { icon: ShieldCheck, title: "电车优惠 / 票券建议", status: "生活参考", body: "电车优惠用于帮你快速比较常见选择，不代表最终票价。购买前请以铁路公司页面和售票规则为准。", live: false },
      { icon: Database, title: "节日 / 烟花 / 考试 / 活动", status: "人工整理", body: "这类内容会按公开信息整理成便于查看的列表。时间、地点临时调整时，请以主办方公告为准。", live: false },
      { icon: Database, title: "租金估算 / 生活成本", status: "预算参考", body: "租金、生活成本和工资类计算用于提前估算预算，不是正式报价、税务建议或不动产估价。", live: false },
    ],
  },
  "zh-TW": {
    back: "返回",
    title: "資料來源與狀態",
    subtitle: "這裡說明 Japan Life 的資訊來源，方便你判斷哪些內容會即時更新，哪些內容適合當作參考。",
    liveTitle: "會即時更新的內容",
    referenceTitle: "整理好的參考內容",
    noteTitle: "使用前請確認",
    noteBody: "交通、票券、房租、福利、店鋪、匯率和天氣都可能延遲或變化。涉及出行、付款、申請、簽約前，請以官方資訊和現場情況為準。",
    feedback: "發現資料不準？去回饋",
    items: [
      { icon: TrainFront, title: "東京交通 / 車站", status: "即時來源", body: "交通運行狀態和車站搜尋會讀取公開交通資料。暫時讀取不到時，頁面會直接提示，不會把過期狀態當作即時結果。", live: true },
      { icon: Store, title: "吃喝 / 美容美髮店鋪", status: "店鋪來源", body: "餐廳和部分美容美髮店鋪會結合公開店鋪資訊與 Japan Life 已收錄內容展示。預約、優惠和營業狀態請以跳轉後的店鋪頁面為準。", live: true },
      { icon: CloudSun, title: "天氣", status: "天氣來源", body: "首頁天氣、天氣頁和天氣提醒會讀取天氣資料。網路不穩定時可能顯示快取或提示稍後再試。", live: true },
      { icon: RefreshCw, title: "匯率", status: "匯率來源", body: "匯率會讀取公開匯率資料。週末或假日可能停留在最近一個交易日，這是匯率來源本身的更新節奏。", live: true },
      { icon: Database, title: "社群 / 通知 / 私訊", status: "帳號資料", body: "社群、通知、關注、私訊等帳號相關內容會跟隨你的 Japan Life 帳號保存和讀取。", live: true },
      { icon: ShieldCheck, title: "電車優惠 / 票券建議", status: "生活參考", body: "電車優惠用於幫你快速比較常見選擇，不代表最終票價。購買前請以鐵路公司頁面和售票規則為準。", live: false },
      { icon: Database, title: "假日 / 煙火 / 考試 / 活動", status: "人工整理", body: "這類內容會按公開資訊整理成便於查看的列表。時間、地點臨時調整時，請以主辦方公告為準。", live: false },
      { icon: Database, title: "租金估算 / 生活成本", status: "預算參考", body: "租金、生活成本和薪資類計算用於提前估算預算，不是正式報價、稅務建議或不動產估價。", live: false },
    ],
  },
  ja: {
    back: "戻る",
    title: "データ元と状態",
    subtitle: "Japan Life の情報源をまとめています。リアルタイムに近い内容か、参考として見る内容かを確認できます。",
    liveTitle: "更新される情報",
    referenceTitle: "整理された参考情報",
    noteTitle: "利用前に確認してください",
    noteBody: "交通、チケット、家賃、支援制度、店舗、為替、天気は遅延や変更が起きることがあります。移動、支払い、申請、契約前には公式情報と現地状況を確認してください。",
    feedback: "データが違う場合は連絡",
    items: [
      { icon: TrainFront, title: "東京交通 / 駅", status: "交通データ", body: "運行状況と駅検索は公開交通データを読み込みます。取得できない時は、古い状態をリアルタイムとして表示せず、そのまま案内します。", live: true },
      { icon: Store, title: "飲食 / 美容店舗", status: "店舗情報", body: "飲食店と一部の美容店舗は、公開店舗情報と Japan Life に掲載された内容を組み合わせて表示します。予約、クーポン、営業状況は遷移先ページを確認してください。", live: true },
      { icon: CloudSun, title: "天気", status: "天気データ", body: "ホーム、天気ページ、天気通知は天気データを読み込みます。通信が不安定な時はキャッシュや再試行案内を表示する場合があります。", live: true },
      { icon: RefreshCw, title: "為替", status: "為替データ", body: "為替は公開為替データを読み込みます。週末や祝日は直近の取引日で止まることがあります。", live: true },
      { icon: Database, title: "コミュニティ / 通知 / メッセージ", status: "アカウント情報", body: "コミュニティ、通知、フォロー、メッセージなどは Japan Life アカウントに紐づいて保存、表示されます。", live: true },
      { icon: ShieldCheck, title: "電車割引 / チケット提案", status: "生活参考", body: "電車割引はよく使う選択肢を比べるための参考です。購入前に鉄道会社のページと販売条件を確認してください。", live: false },
      { icon: Database, title: "祝日 / 花火 / 試験 / イベント", status: "編集情報", body: "公開情報を見やすく整理した内容です。時間や場所が変更される場合は、主催者の案内を確認してください。", live: false },
      { icon: Database, title: "家賃推定 / 生活費", status: "予算参考", body: "家賃、生活費、給与計算は予算を考えるための目安であり、正式な見積もり、税務助言、不動産評価ではありません。", live: false },
    ],
  },
} as const;

export default function DataStatusPage() {
  const { language } = useLanguage();
  const text = copy[language];
  const liveItems = text.items.filter((item) => item.live);
  const referenceItems = text.items.filter((item) => !item.live);

  return (
    <main className="min-h-screen bg-[#F6FAFF] px-4 py-5 text-[#0F172A]">
      <div className="mx-auto min-h-screen max-w-[430px] px-1 pb-10">
        <div className="mb-5">
          <BackButton fallbackHref="/me" label={text.back} />
        </div>

        <section className="rounded-[28px] border border-white/60 bg-white/75 p-5 shadow-[0_18px_45px_rgba(37,99,235,0.10)] backdrop-blur-xl">
          <p className="text-sm font-black text-[#2563EB]">Japan Life</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight">{text.title}</h1>
          <p className="mt-3 text-sm font-bold leading-6 text-[#64748B]">{text.subtitle}</p>
        </section>

        <DataGroup title={text.liveTitle} items={liveItems} />
        <DataGroup title={text.referenceTitle} items={referenceItems} />

        <section className="mt-4 rounded-[24px] border border-amber-100 bg-amber-50/90 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
            <div>
              <h2 className="text-sm font-black text-amber-900">{text.noteTitle}</h2>
              <p className="mt-2 text-xs font-bold leading-5 text-amber-900/80">{text.noteBody}</p>
              <Link className="mt-3 inline-flex items-center gap-1 text-xs font-black text-[#2563EB]" href="/feedback">
                {text.feedback}
                <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function DataGroup({ items, title }: { items: DataStatusItem[]; title: string }) {
  return (
    <section className="mt-5">
      <h2 className="px-1 text-lg font-black">{title}</h2>
      <div className="mt-3 grid gap-3">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <article className="rounded-[24px] border border-white/70 bg-white/80 p-4 shadow-[0_10px_30px_rgba(37,99,235,0.08)] backdrop-blur-xl" key={item.title}>
              <div className="flex items-start gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-[#2563EB]">
                  <Icon className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-black">{item.title}</h3>
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-black ${item.live ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-700"}`}>
                      <CheckCircle2 className="h-3 w-3" />
                      {item.status}
                    </span>
                  </div>
                  <p className="mt-2 text-xs font-bold leading-5 text-[#64748B]">{item.body}</p>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
