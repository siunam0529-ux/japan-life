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
    subtitle: "这里集中说明 Japan Life 目前哪些信息来自真实 API，哪些是本地整理或备用数据。",
    liveTitle: "真实 API",
    referenceTitle: "本地参考 / 备用",
    noteTitle: "使用前请确认",
    noteBody: "交通、票券、房租、福利、店铺、汇率和天气都可能延迟或变化。涉及出行、付款、申请、签约前，请以官方信息和现场情况为准。",
    feedback: "发现数据不准？去反馈",
    items: [
      { icon: TrainFront, title: "东京交通 / 车站", status: "ODPT API", body: "东京交通状态、23 区车站搜索和租屋车站选择优先使用 ODPT。数据可能与铁路公司公告存在延迟或差异。", live: true },
      { icon: Store, title: "吃喝 / 美容美发店铺", status: "HotPepper API", body: "今天吃什么、随机散步附近店铺，以及 HotPepper 覆盖的吃喝美容美发类别优先走 HotPepper。", live: true },
      { icon: CloudSun, title: "天气", status: "Open-Meteo", body: "首页天气、天气页和天气提醒使用 Open-Meteo；网络失败时会保留缓存或显示说明。", live: true },
      { icon: RefreshCw, title: "汇率", status: "Frankfurter + 备用数据", body: "汇率优先使用 Frankfurter。周末、节假日或请求失败时，可能显示最近数据或 Japan Life 备用数据。", live: true },
      { icon: Database, title: "推荐 App / 优惠 / 店铺申请", status: "Supabase 后台", body: "后台发布的数据来自 Supabase；店铺申请需要管理员审核后才展示。", live: true },
      { icon: ShieldCheck, title: "电车优惠 / 票券建议", status: "本地整理", body: "电车优惠不是实时票价计算，不保证最便宜。票券价格、范围和购买条件请以铁路公司官方信息为准。", live: false },
      { icon: Database, title: "随机散步 / 今天去哪玩", status: "本地目的地 + HotPepper 附近店", body: "目的地推荐是本地整理；附近店铺会尽量使用 HotPepper。没有结果时会显示说明，不假装有真实店铺。", live: false },
      { icon: Database, title: "租金估算 / 生活成本", status: "参考模型", body: "租金、生活成本和工资类计算用于预算参考，不是正式报价、税务建议或不动产估价。", live: false },
    ],
  },
  "zh-TW": {
    back: "返回",
    title: "資料來源與狀態",
    subtitle: "這裡集中說明 Japan Life 目前哪些資訊來自真實 API，哪些是本地整理或備用資料。",
    liveTitle: "真實 API",
    referenceTitle: "本地參考 / 備用",
    noteTitle: "使用前請確認",
    noteBody: "交通、票券、房租、福利、店鋪、匯率和天氣都可能延遲或變化。涉及出行、付款、申請、簽約前，請以官方資訊和現場情況為準。",
    feedback: "發現資料不準？去回饋",
    items: [
      { icon: TrainFront, title: "東京交通 / 車站", status: "ODPT API", body: "東京交通狀態、23 區車站搜尋和租屋車站選擇優先使用 ODPT。資料可能與鐵路公司公告存在延遲或差異。", live: true },
      { icon: Store, title: "吃喝 / 美容美髮店鋪", status: "HotPepper API", body: "今天吃什麼、隨機散步附近店鋪，以及 HotPepper 覆蓋的吃喝美容美髮類別優先走 HotPepper。", live: true },
      { icon: CloudSun, title: "天氣", status: "Open-Meteo", body: "首頁天氣、天氣頁和天氣提醒使用 Open-Meteo；網路失敗時會保留快取或顯示說明。", live: true },
      { icon: RefreshCw, title: "匯率", status: "Frankfurter + 備用資料", body: "匯率優先使用 Frankfurter。週末、假日或請求失敗時，可能顯示最近資料或 Japan Life 備用資料。", live: true },
      { icon: Database, title: "推薦 App / 優惠 / 店鋪申請", status: "Supabase 後台", body: "後台發布的資料來自 Supabase；店鋪申請需要管理員審核後才展示。", live: true },
      { icon: ShieldCheck, title: "電車優惠 / 票券建議", status: "本地整理", body: "電車優惠不是即時票價計算，不保證最便宜。票券價格、範圍和購買條件請以鐵路公司官方資訊為準。", live: false },
      { icon: Database, title: "隨機散步 / 今天去哪玩", status: "本地目的地 + HotPepper 附近店", body: "目的地推薦是本地整理；附近店鋪會盡量使用 HotPepper。沒有結果時會顯示說明，不假裝有真實店鋪。", live: false },
      { icon: Database, title: "租金估算 / 生活成本", status: "參考模型", body: "租金、生活成本和薪資類計算用於預算參考，不是正式報價、稅務建議或不動產估價。", live: false },
    ],
  },
  ja: {
    back: "戻る",
    title: "データ元と状態",
    subtitle: "Japan Life で使っている実 API、ローカル整理データ、予備データの範囲をまとめています。",
    liveTitle: "実 API",
    referenceTitle: "ローカル参考 / 予備",
    noteTitle: "利用前に確認してください",
    noteBody: "交通、チケット、家賃、支援制度、店舗、為替、天気は遅延や変更がある場合があります。移動、支払い、申請、契約前には公式情報と現地状況をご確認ください。",
    feedback: "データが違う場合は連絡",
    items: [
      { icon: TrainFront, title: "東京交通 / 駅", status: "ODPT API", body: "東京の運行情報、23区駅検索、家賃ツールの駅選択は ODPT を優先します。鉄道会社の発表と差異や遅延がある場合があります。", live: true },
      { icon: Store, title: "飲食 / 美容店舗", status: "HotPepper API", body: "今日の食事、散歩近くの店、HotPepper 対象の飲食・美容カテゴリは HotPepper を優先します。", live: true },
      { icon: CloudSun, title: "天気", status: "Open-Meteo", body: "ホーム、天気ページ、天気通知は Open-Meteo を利用します。失敗時はキャッシュまたは説明を表示します。", live: true },
      { icon: RefreshCw, title: "為替", status: "Frankfurter + 予備データ", body: "為替は Frankfurter を優先します。週末、祝日、取得失敗時は最近のデータまたは Japan Life の予備データを表示する場合があります。", live: true },
      { icon: Database, title: "おすすめ App / 特典 / 店舗申請", status: "Supabase 管理", body: "管理画面で公開したデータは Supabase から取得します。店舗申請は管理者確認後に表示されます。", live: true },
      { icon: ShieldCheck, title: "電車割引 / きっぷ提案", status: "ローカル整理", body: "電車割引はリアルタイム運賃計算ではなく、最安保証もしません。価格や範囲は鉄道会社公式情報をご確認ください。", live: false },
      { icon: Database, title: "ランダム散歩 / 今日のお出かけ", status: "ローカル目的地 + HotPepper 周辺店", body: "目的地はローカル整理です。周辺店舗は可能な範囲で HotPepper を使用します。結果がない場合は説明を表示します。", live: false },
      { icon: Database, title: "家賃推定 / 生活費", status: "参考モデル", body: "家賃、生活費、給与の計算は予算参考であり、正式見積、税務助言、不動産評価ではありません。", live: false },
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
