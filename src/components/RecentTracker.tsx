"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { useLanguage } from "@/hooks/useLanguage";
import { useRecentItems } from "@/hooks/useRecentItems";

const trackablePages = {
  "/apps": { "zh-CN": { title: "推荐 App", type: "App" }, "zh-TW": { title: "推薦 App", type: "App" }, ja: { title: "おすすめアプリ", type: "アプリ" } },
  "/areas": { "zh-CN": { title: "东京地区数据", type: "地区" }, "zh-TW": { title: "東京地區資料", type: "地區" }, ja: { title: "東京エリア情報", type: "エリア" } },
  "/contact": { "zh-CN": { title: "反馈与合作", type: "联系" }, "zh-TW": { title: "回饋與合作", type: "聯絡" }, ja: { title: "フィードバック", type: "連絡" } },
  "/deals": { "zh-CN": { title: "生活优惠", type: "优惠" }, "zh-TW": { title: "生活優惠", type: "優惠" }, ja: { title: "お得情報", type: "特典" } },
  "/favorites": { "zh-CN": { title: "我的收藏", type: "个人" }, "zh-TW": { title: "我的收藏", type: "個人" }, ja: { title: "お気に入り", type: "個人" } },
  "/places": { "zh-CN": { title: "友好店铺", type: "店铺" }, "zh-TW": { title: "友好店鋪", type: "店鋪" }, ja: { title: "友好店舗", type: "店舗" } },
  "/play": { "zh-CN": { title: "今天去哪玩", type: "工具" }, "zh-TW": { title: "今天去哪玩", type: "工具" }, ja: { title: "今日どこ行く", type: "ツール" } },
  "/resources": { "zh-CN": { title: "生活指南", type: "指南" }, "zh-TW": { title: "生活指南", type: "指南" }, ja: { title: "生活ガイド", type: "ガイド" } },
  "/search": { "zh-CN": { title: "更多工具", type: "工具池" }, "zh-TW": { title: "更多工具", type: "工具池" }, ja: { title: "その他ツール", type: "ツール" } },
  "/train-deals": { "zh-CN": { title: "电车优惠", type: "工具" }, "zh-TW": { title: "電車優惠", type: "工具" }, ja: { title: "電車のお得情報", type: "ツール" } },
  "/tools/area-compare": { "zh-CN": { title: "地区对比", type: "工具" }, "zh-TW": { title: "地區比較", type: "工具" }, ja: { title: "エリア比較", type: "ツール" } },
  "/tools/exchange": { "zh-CN": { title: "汇率换算", type: "工具" }, "zh-TW": { title: "匯率換算", type: "工具" }, ja: { title: "為替換算", type: "ツール" } },
  "/tools/holidays": { "zh-CN": { title: "日本日历", type: "工具" }, "zh-TW": { title: "日本日曆", type: "工具" }, ja: { title: "日本カレンダー", type: "ツール" } },
  "/tools/living-cost": { "zh-CN": { title: "生活成本计算", type: "工具" }, "zh-TW": { title: "生活成本計算", type: "工具" }, ja: { title: "生活費計算", type: "ツール" } },
  "/tools/procedure-navigator": { "zh-CN": { title: "手续导航", type: "工具" }, "zh-TW": { title: "手續導航", type: "工具" }, ja: { title: "手続きナビ", type: "ツール" } },
  "/tools/life-checklist": { "zh-CN": { title: "生活 Checklist", type: "工具" }, "zh-TW": { title: "生活 Checklist", type: "工具" }, ja: { title: "生活チェック", type: "ツール" } },
  "/tools/rent": { "zh-CN": { title: "房租评估", type: "工具" }, "zh-TW": { title: "房租評估", type: "工具" }, ja: { title: "家賃チェック", type: "ツール" } },
  "/tools/salary": { "zh-CN": { title: "工资计算", type: "工具" }, "zh-TW": { title: "薪資計算", type: "工具" }, ja: { title: "給与計算", type: "ツール" } },
  "/tools/train-status": { "zh-CN": { title: "东京交通", type: "工具" }, "zh-TW": { title: "東京交通", type: "工具" }, ja: { title: "東京交通", type: "ツール" } },
  "/tools/visa-reminder": { "zh-CN": { title: "在留提醒", type: "工具" }, "zh-TW": { title: "在留提醒", type: "工具" }, ja: { title: "在留期限", type: "ツール" } },
  "/tools/weather": { "zh-CN": { title: "7 天天气", type: "工具" }, "zh-TW": { title: "7 天天氣", type: "工具" }, ja: { title: "7日間天気", type: "ツール" } },
  "/tools/work-hours": { "zh-CN": { title: "打工时间记录", type: "工具" }, "zh-TW": { title: "打工時間記錄", type: "工具" }, ja: { title: "勤務時間記録", type: "ツール" } },
} as const;

export function RecentTracker() {
  const pathname = usePathname();
  const { language } = useLanguage();
  const { addRecentItem } = useRecentItems();

  useEffect(() => {
    if (!pathname || pathname === "/") return;
    const matchedKey = Object.keys(trackablePages)
      .sort((a, b) => b.length - a.length)
      .find((key) => pathname === key || pathname.startsWith(`${key}/`)) as keyof typeof trackablePages | undefined;
    if (!matchedKey) return;
    addRecentItem({ href: pathname, ...trackablePages[matchedKey][language] });
  }, [addRecentItem, language, pathname]);

  return null;
}
