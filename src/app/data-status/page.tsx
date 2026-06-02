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
    subtitle: "这里说明 Japan Life 哪些信息来自真实 API，哪些是本地整理的参考资料。",
    liveTitle: "真实 API / 后台数据",
    referenceTitle: "本地参考资料",
    noteTitle: "使用前请确认",
    noteBody: "交通、票券、房租、福利、店铺、汇率和天气都可能延迟或变化。涉及出行、付款、申请、签约前，请以官方信息和现场情况为准。",
    feedback: "发现数据不准？去反馈",
    items: [
      { icon: TrainFront, title: "东京交通 / 车站", status: "ODPT API", body: "交通运行状态和车站搜索优先使用 ODPT。ODPT 不可用时会明确显示暂不可用，不会用本地状态假装实时。", live: true },
      { icon: Store, title: "吃喝 / 美容美发店铺", status: "HotPepper API", body: "吃喝与 HotPepper 覆盖的美容美发类别优先使用 HotPepper。API 未配置或失败时显示不可用说明。", live: true },
      { icon: CloudSun, title: "天气", status: "Open-Meteo", body: "首页天气、天气页和天气提醒使用 Open-Meteo；网络失败时保留缓存或显示说明。", live: true },
      { icon: RefreshCw, title: "汇率", status: "Frankfurter API", body: "汇率优先使用 Frankfurter。请求失败时显示暂不可用，不再使用备用假汇率。周末或节假日可能保留 Frankfurter 最近交易日数据。", live: true },
      { icon: Database, title: "社区 / 通知 / 私信", status: "Supabase", body: "社区、通知、关注、私信等账号相关数据使用 Supabase。Supabase 不可用时显示错误或登录要求，不自动切到假用户数据。", live: true },
      { icon: ShieldCheck, title: "电车优惠 / 票券建议", status: "本地整理", body: "电车优惠不是实时票价计算，不保证最便宜。票券价格、范围和购买条件请以铁路公司官方信息为准。", live: false },
      { icon: Database, title: "节日 / 烟花 / 考试 / 活动", status: "本地参考", body: "这类资料本来就是本地整理，不属于 API 失败后的假数据。出发前仍建议确认官方来源。", live: false },
      { icon: Database, title: "租金估算 / 生活成本", status: "参考模型", body: "租金、生活成本和工资类计算用于预算参考，不是正式报价、税务建议或不动产估价。", live: false },
    ],
  },
  "zh-TW": {
    back: "返回",
    title: "資料來源與狀態",
    subtitle: "這裡說明 Japan Life 哪些資訊來自真實 API，哪些是本地整理的參考資料。",
    liveTitle: "真實 API / 後台資料",
    referenceTitle: "本地參考資料",
    noteTitle: "使用前請確認",
    noteBody: "交通、票券、房租、福利、店鋪、匯率和天氣都可能延遲或變化。涉及出行、付款、申請、簽約前，請以官方資訊和現場情況為準。",
    feedback: "發現資料不準？去回饋",
    items: [
      { icon: TrainFront, title: "東京交通 / 車站", status: "ODPT API", body: "交通運行狀態和車站搜尋優先使用 ODPT。ODPT 不可用時會明確顯示暫不可用，不會用本地狀態假裝即時。", live: true },
      { icon: Store, title: "吃喝 / 美容美髮店鋪", status: "HotPepper API", body: "吃喝與 HotPepper 覆蓋的美容美髮類別優先使用 HotPepper。API 未配置或失敗時顯示不可用說明。", live: true },
      { icon: CloudSun, title: "天氣", status: "Open-Meteo", body: "首頁天氣、天氣頁和天氣提醒使用 Open-Meteo；網路失敗時保留快取或顯示說明。", live: true },
      { icon: RefreshCw, title: "匯率", status: "Frankfurter API", body: "匯率優先使用 Frankfurter。請求失敗時顯示暫不可用，不再使用備用假匯率。週末或假日可能保留 Frankfurter 最近交易日資料。", live: true },
      { icon: Database, title: "社區 / 通知 / 私訊", status: "Supabase", body: "社區、通知、關注、私訊等帳號相關資料使用 Supabase。Supabase 不可用時顯示錯誤或登入要求，不自動切到假使用者資料。", live: true },
      { icon: ShieldCheck, title: "電車優惠 / 票券建議", status: "本地整理", body: "電車優惠不是即時票價計算，不保證最便宜。票券價格、範圍和購買條件請以鐵路公司官方資訊為準。", live: false },
      { icon: Database, title: "假日 / 煙火 / 考試 / 活動", status: "本地參考", body: "這類資料本來就是本地整理，不屬於 API 失敗後的假資料。出發前仍建議確認官方來源。", live: false },
      { icon: Database, title: "租金估算 / 生活成本", status: "參考模型", body: "租金、生活成本和薪資類計算用於預算參考，不是正式報價、稅務建議或不動產估價。", live: false },
    ],
  },
  ja: {
    back: "戻る",
    title: "データ元と状態",
    subtitle: "Japan Life の情報が実 API 由来か、ローカル整理の参考資料かをまとめています。",
    liveTitle: "実 API / 管理データ",
    referenceTitle: "ローカル参考データ",
    noteTitle: "利用前に確認してください",
    noteBody: "交通、チケット、家賃、支援制度、店舗、為替、天気は遅延や変更が起きることがあります。移動、支払い、申請、契約前には公式情報と現地状況を確認してください。",
    feedback: "データが違う場合は連絡",
    items: [
      { icon: TrainFront, title: "東京交通 / 駅", status: "ODPT API", body: "運行状態と駅検索は ODPT を優先します。ODPT が利用できない場合は一時利用不可と表示し、ローカル状態をリアルタイム扱いしません。", live: true },
      { icon: Store, title: "飲食 / 美容店舗", status: "HotPepper API", body: "飲食と HotPepper 対象の美容カテゴリは HotPepper を優先します。API 未設定または失敗時は利用不可の説明を表示します。", live: true },
      { icon: CloudSun, title: "天気", status: "Open-Meteo", body: "ホーム、天気ページ、天気通知は Open-Meteo を使用します。通信失敗時はキャッシュまたは説明を表示します。", live: true },
      { icon: RefreshCw, title: "為替", status: "Frankfurter API", body: "為替は Frankfurter を優先します。取得失敗時は一時利用不可と表示し、予備の仮データは使いません。週末や祝日は Frankfurter の直近取引日データが残る場合があります。", live: true },
      { icon: Database, title: "コミュニティ / 通知 / メッセージ", status: "Supabase", body: "コミュニティ、通知、フォロー、メッセージなどアカウント関連データは Supabase を使用します。Supabase が利用できない場合はエラーまたはログイン要求を表示します。", live: true },
      { icon: ShieldCheck, title: "電車割引 / チケット提案", status: "ローカル整理", body: "電車割引はリアルタイム運賃計算ではなく、最安保証ではありません。価格、範囲、購入条件は鉄道会社の公式情報を確認してください。", live: false },
      { icon: Database, title: "祝日 / 花火 / 試験 / イベント", status: "ローカル参考", body: "これらは元からローカル整理の参考資料で、API 失敗時の仮データではありません。出発前には公式情報も確認してください。", live: false },
      { icon: Database, title: "家賃推定 / 生活費", status: "参考モデル", body: "家賃、生活費、給与計算は予算の参考であり、正式な見積もり、税務助言、不動産評価ではありません。", live: false },
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
