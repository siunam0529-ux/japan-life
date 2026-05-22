"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { useLanguage } from "@/hooks/useLanguage";
import { useRecentItems } from "@/hooks/useRecentItems";

const trackablePages = {
  "/apps": { "zh-CN": { title: "推荐 App", type: "App" }, "zh-TW": { title: "推薦 App", type: "App" }, ja: { title: "おすすめアプリ", type: "アプリ" } },
  "/areas": { "zh-CN": { title: "东京地区数据", type: "地区" }, "zh-TW": { title: "東京地區資料", type: "地區" }, ja: { title: "東京エリア情報", type: "エリア" } },
  "/arrival": { "zh-CN": { title: "初到日本清单", type: "路线" }, "zh-TW": { title: "初到日本清單", type: "路線" }, ja: { title: "来日チェックリスト", type: "ルート" } },
  "/contact": { "zh-CN": { title: "联系我们", type: "表单" }, "zh-TW": { title: "聯絡我們", type: "表單" }, ja: { title: "お問い合わせ", type: "フォーム" } },
  "/deals": { "zh-CN": { title: "优惠推荐", type: "优惠" }, "zh-TW": { title: "優惠推薦", type: "優惠" }, ja: { title: "お得情報", type: "お得" } },
  "/favorites": { "zh-CN": { title: "我的收藏", type: "个人" }, "zh-TW": { title: "我的收藏", type: "個人" }, ja: { title: "お気に入り", type: "個人" } },
  "/places": { "zh-CN": { title: "推荐店铺", type: "店铺" }, "zh-TW": { title: "推薦店鋪", type: "店鋪" }, ja: { title: "おすすめ店舗", type: "店舗" } },
  "/resources": { "zh-CN": { title: "生活指南", type: "指南" }, "zh-TW": { title: "生活指南", type: "指南" }, ja: { title: "生活ガイド", type: "ガイド" } },
  "/search": { "zh-CN": { title: "生活问题搜索", type: "搜索" }, "zh-TW": { title: "生活問題搜尋", type: "搜尋" }, ja: { title: "生活検索", type: "検索" } },
  "/tools/area-compare": { "zh-CN": { title: "地区对比", type: "工具" }, "zh-TW": { title: "地區比較", type: "工具" }, ja: { title: "エリア比較", type: "ツール" } },
  "/tools/exchange": { "zh-CN": { title: "汇率换算", type: "工具" }, "zh-TW": { title: "匯率換算", type: "工具" }, ja: { title: "為替換算", type: "ツール" } },
  "/tools/holidays": { "zh-CN": { title: "日本日历", type: "工具" }, "zh-TW": { title: "日本日曆", type: "工具" }, ja: { title: "日本カレンダー", type: "ツール" } },
  "/tools/living-cost": { "zh-CN": { title: "生活成本", type: "工具" }, "zh-TW": { title: "生活成本", type: "工具" }, ja: { title: "生活費", type: "ツール" } },
  "/tools/rent": { "zh-CN": { title: "房租评估", type: "工具" }, "zh-TW": { title: "房租評估", type: "工具" }, ja: { title: "家賃チェック", type: "ツール" } },
  "/tools/salary": { "zh-CN": { title: "工资计算", type: "工具" }, "zh-TW": { title: "薪資計算", type: "工具" }, ja: { title: "給与計算", type: "ツール" } },
  "/tools/visa-reminder": { "zh-CN": { title: "在留提醒", type: "工具" }, "zh-TW": { title: "在留提醒", type: "工具" }, ja: { title: "在留期限", type: "ツール" } },
  "/tools/work-hours": { "zh-CN": { title: "打工时间", type: "工具" }, "zh-TW": { title: "打工時間", type: "工具" }, ja: { title: "勤務時間", type: "ツール" } },
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
