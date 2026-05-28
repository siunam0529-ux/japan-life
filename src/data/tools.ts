import {
  BadgePercent,
  BookOpenText,
  Calculator,
  CalendarDays,
  ClipboardList,
  Clock3,
  CloudSun,
  Footprints,
  Home,
  Landmark,
  ListChecks,
  MapPinned,
  Soup,
  RefreshCw,
  SearchCheck,
  Tickets,
  TrainFront,
  WalletCards,
} from "lucide-react";

type LocalizedTitle = {
  "zh-CN": string;
  "zh-TW": string;
  ja: string;
};

type LocalizedText = LocalizedTitle;

export const dashboardTools = [
  { key: "salary", icon: Calculator, href: "/tools/salary", title: { "zh-CN": "工资计算", "zh-TW": "薪資計算", ja: "給与計算" } },
  { key: "rent", icon: Home, href: "/tools/rent", title: { "zh-CN": "租房助手", "zh-TW": "租屋助手", ja: "賃貸サポート" } },
  { key: "exchange", icon: RefreshCw, href: "/tools/exchange", title: { "zh-CN": "汇率换算", "zh-TW": "匯率換算", ja: "為替換算" } },
  { key: "holidays", icon: CalendarDays, href: "/tools/holidays", title: { "zh-CN": "日本日历", "zh-TW": "日本日曆", ja: "日本カレンダー" } },
  { key: "livingCost", icon: WalletCards, href: "/tools/living-cost", title: { "zh-CN": "生活成本", "zh-TW": "生活成本", ja: "生活費" } },
  { key: "procedureNavigator", icon: ClipboardList, href: "/tools/procedure-navigator", title: { "zh-CN": "手续导航", "zh-TW": "手續導航", ja: "手続きナビ" } },
  { key: "lifeChecklist", icon: ListChecks, href: "/tools/life-checklist", title: { "zh-CN": "生活清单", "zh-TW": "生活清單", ja: "生活リスト" } },
  { key: "resources", icon: SearchCheck, href: "/resources", title: { "zh-CN": "生活指南", "zh-TW": "生活指南", ja: "生活ガイド" } },
  { key: "walk", icon: Footprints, href: "/walk", title: { "zh-CN": "随机散步", "zh-TW": "隨機散步", ja: "ランダム散歩" } },
  {
    key: "play",
    icon: MapPinned,
    href: "/play",
    title: { "zh-CN": "今天去哪玩", "zh-TW": "今天去哪玩", ja: "今日どこ行く" },
    subtitle: {
      "zh-CN": "半日游、一日游和周末随机目的地推荐。",
      "zh-TW": "半日遊、一日遊和週末隨機目的地推薦。",
      ja: "半日・一日・週末のおでかけ先を提案",
    },
  },
  {
    key: "food",
    icon: Soup,
    href: "/food",
    title: { "zh-CN": "今天吃什么", "zh-TW": "今天吃什麼", ja: "今日なに食べる" },
    subtitle: {
      "zh-CN": "根据时间、天气和心情推荐今天吃什么。",
      "zh-TW": "根據時間、天氣和心情推薦今天吃什麼。",
      ja: "時間、天気、気分に合わせて今日の食事を提案",
    },
  },
  {
    key: "trainDeals",
    icon: Tickets,
    href: "/train-deals",
    title: { "zh-CN": "电车优惠", "zh-TW": "電車優惠", ja: "電車のお得情報" },
    subtitle: {
      "zh-CN": "一日券、优惠票和交通省钱建议。",
      "zh-TW": "一日券、優惠票和交通省錢建議。",
      ja: "一日券、割引きっぷ、交通費の節約ヒント",
    },
  },
  {
    key: "benefits",
    icon: Landmark,
    href: "/benefits",
    title: { "zh-CN": "福利资讯", "zh-TW": "福利資訊", ja: "支援情報" },
    subtitle: {
      "zh-CN": "补助金、支援制度和行政福利信息。",
      "zh-TW": "補助金、支援制度和行政福利資訊。",
      ja: "補助金、支援制度、行政サポート情報。",
    },
  },
  { key: "deals", icon: BadgePercent, href: "/deals", title: { "zh-CN": "生活优惠", "zh-TW": "生活優惠", ja: "お得情報" } },
  { key: "workHours", icon: Clock3, href: "/tools/work-hours", title: { "zh-CN": "打工时间", "zh-TW": "打工時間", ja: "勤務時間" } },
  { key: "weather", icon: CloudSun, href: "/tools/weather", title: { "zh-CN": "7 天天气", "zh-TW": "7 天天氣", ja: "7日間天気" } },
  { key: "trainStatus", icon: TrainFront, href: "/tools/train-status", title: { "zh-CN": "东京交通", "zh-TW": "東京交通", ja: "東京交通" } },
  { key: "apps", icon: BookOpenText, href: "/apps", title: { "zh-CN": "推荐 App", "zh-TW": "推薦 App", ja: "おすすめアプリ" } },
] as const satisfies readonly {
  key: string;
  icon: typeof Calculator;
  href: string;
  hint?: LocalizedText;
  subtitle?: LocalizedText;
  title: LocalizedTitle;
}[];

export type DashboardToolKey = (typeof dashboardTools)[number]["key"];

export const maxHomeToolCount = 9;

export const defaultHomeToolKeys: DashboardToolKey[] = [
  "salary",
  "rent",
  "deals",
  "play",
  "trainDeals",
  "apps",
  "walk",
  "food",
  "resources",
];
