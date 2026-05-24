import {
  BadgePercent,
  BookOpenText,
  Calculator,
  CalendarDays,
  ClipboardList,
  Clock3,
  CloudSun,
  Home,
  ListChecks,
  RefreshCw,
  SearchCheck,
  TrainFront,
  WalletCards,
} from "lucide-react";

type LocalizedTitle = {
  "zh-CN": string;
  "zh-TW": string;
  ja: string;
};

export const dashboardTools = [
  { key: "salary", icon: Calculator, href: "/tools/salary", title: { "zh-CN": "工资计算", "zh-TW": "薪資計算", ja: "給与計算" } },
  { key: "rent", icon: Home, href: "/tools/rent", title: { "zh-CN": "租房助手", "zh-TW": "租屋助手", ja: "賃貸サポート" } },
  { key: "exchange", icon: RefreshCw, href: "/tools/exchange", title: { "zh-CN": "汇率换算", "zh-TW": "匯率換算", ja: "為替換算" } },
  { key: "holidays", icon: CalendarDays, href: "/tools/holidays", title: { "zh-CN": "日本日历", "zh-TW": "日本日曆", ja: "日本カレンダー" } },
  { key: "livingCost", icon: WalletCards, href: "/tools/living-cost", title: { "zh-CN": "生活成本", "zh-TW": "生活成本", ja: "生活費" } },
  { key: "procedureNavigator", icon: ClipboardList, href: "/tools/procedure-navigator", title: { "zh-CN": "手续导航", "zh-TW": "手續導航", ja: "手続きナビ" } },
  { key: "lifeChecklist", icon: ListChecks, href: "/tools/life-checklist", title: { "zh-CN": "生活 Checklist", "zh-TW": "生活 Checklist", ja: "生活チェック" } },
  { key: "resources", icon: SearchCheck, href: "/resources", title: { "zh-CN": "日本生活指南", "zh-TW": "日本生活指南", ja: "日本生活ガイド" } },
  { key: "deals", icon: BadgePercent, href: "/deals", title: { "zh-CN": "生活优惠", "zh-TW": "生活優惠", ja: "お得情報" } },
  { key: "workHours", icon: Clock3, href: "/tools/work-hours", title: { "zh-CN": "打工时间", "zh-TW": "打工時間", ja: "勤務時間" } },
  { key: "weather", icon: CloudSun, href: "/tools/weather", title: { "zh-CN": "7 天天气", "zh-TW": "7 天天氣", ja: "7日間天気" } },
  { key: "trainStatus", icon: TrainFront, href: "/tools/train-status", title: { "zh-CN": "东京电车交通", "zh-TW": "東京電車交通", ja: "東京の電車運行" } },
  { key: "apps", icon: BookOpenText, href: "/apps", title: { "zh-CN": "推荐 App", "zh-TW": "推薦 App", ja: "おすすめアプリ" } },
] as const satisfies readonly {
  key: string;
  icon: typeof Calculator;
  href: string;
  title: LocalizedTitle;
}[];

export type DashboardToolKey = (typeof dashboardTools)[number]["key"];

export const maxHomeToolCount = 9;

export const defaultHomeToolKeys: DashboardToolKey[] = [
  "salary",
  "rent",
  "exchange",
  "holidays",
  "livingCost",
  "resources",
  "deals",
];
