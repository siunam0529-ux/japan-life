export type DailyTip = {
  id: string;
  zhCN: string;
  zhTW: string;
  ja: string;
  href: string;
  updatedAt: string;
};

export const dailyTips: DailyTip[] = [
  {
    id: "work-hours",
    zhCN: "如果你是留学生，记得在打工时间记录里打开 28 小时提醒。",
    zhTW: "如果你是留學生，記得在打工時間記錄裡打開 28 小時提醒。",
    ja: "留学生なら、勤務時間記録で28時間のリマインドをオンにしましょう。",
    href: "/tools/work-hours",
    updatedAt: "2026-05-21",
  },
  {
    id: "rent-budget",
    zhCN: "找房时先把房租控制在收入的 25%～33%，生活会轻松很多。",
    zhTW: "找房時先把房租控制在收入的 25%～33%，生活會輕鬆很多。",
    ja: "家賃は収入の25%〜33%に抑えると、生活に余裕が出やすいです。",
    href: "/tools/rent",
    updatedAt: "2026-05-21",
  },
  {
    id: "city-office",
    zhCN: "搬家后 14 天内通常需要到区役所办理住址变更。",
    zhTW: "搬家後 14 天內通常需要到區役所辦理地址變更。",
    ja: "引っ越し後は通常14日以内に区役所で住所変更を行います。",
    href: "/resources",
    updatedAt: "2026-05-21",
  },
];
