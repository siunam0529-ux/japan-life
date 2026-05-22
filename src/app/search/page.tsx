"use client";

import { ArrowLeft, BadgePercent, BookOpenText, CalendarDays, CloudSun, FileClock, GitCompare, Home, Recycle, Search, ShieldCheck, WalletCards } from "lucide-react";
import type { ComponentType } from "react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useLanguage } from "@/hooks/useLanguage";

type LocalizedText = { "zh-CN": string; "zh-TW": string; ja: string };

type SearchItem = {
  title: LocalizedText;
  subtitle: LocalizedText;
  href: string;
  type: LocalizedText;
  keywords: string;
  icon: ComponentType<{ className?: string }>;
};

const items: SearchItem[] = [
  {
    title: { "zh-CN": "搬家 / 入住手续", "zh-TW": "搬家 / 入住手續", ja: "引っ越し / 入居手続き" },
    subtitle: { "zh-CN": "居民登记、水电煤、网络、邮便转送", "zh-TW": "居民登記、水電瓦斯、網路、郵便轉送", ja: "住民登録、ライフライン、ネット、郵便転送" },
    href: "/arrival",
    type: { "zh-CN": "生活路线", "zh-TW": "生活路線", ja: "生活ルート" },
    keywords: "搬家 入住 来日 到日本 水电煤 水電瓦斯 网络 網路 邮便 郵便 转送 轉送 住民登记 住民登記 住所 迁入 遷入 引っ越し 入居 国保 國保 国民健康保险 國民健康保險 年金 国民年金 國民年金 区役所 區役所 市役所 住民票 my number",
    icon: Home,
  },
  {
    title: { "zh-CN": "退租前检查", "zh-TW": "退租前檢查", ja: "退去前チェック" },
    subtitle: { "zh-CN": "初期照片、清扫费、管理公司、房租压力", "zh-TW": "初期照片、清潔費、管理公司、房租壓力", ja: "入居時写真、清掃費、管理会社、家賃負担" },
    href: "/tools/rent",
    type: { "zh-CN": "租房", "zh-TW": "租屋", ja: "賃貸" },
    keywords: "退租 退去 解约 解約 原状回復 清扫费 清潔費 敷金 礼金 禮金 租房 租屋 房租 管理公司",
    icon: Home,
  },
  {
    title: { "zh-CN": "在留更新", "zh-TW": "在留更新", ja: "在留更新" },
    subtitle: { "zh-CN": "在留期限提醒和更新节点", "zh-TW": "在留期限提醒和更新節點", ja: "在留期限と更新タイミング" },
    href: "/tools/visa-reminder",
    type: { "zh-CN": "签证", "zh-TW": "簽證", ja: "ビザ" },
    keywords: "在留 更新 签证 簽證 入管 期限 在留卡 visa extension immigration",
    icon: FileClock,
  },
  {
    title: { "zh-CN": "粗大垃圾", "zh-TW": "粗大垃圾", ja: "粗大ごみ" },
    subtitle: { "zh-CN": "垃圾分类、收集日、粗大垃圾申请入口", "zh-TW": "垃圾分類、收集日、粗大垃圾申請入口", ja: "ごみ分別、収集日、粗大ごみ申請" },
    href: "/resources",
    type: { "zh-CN": "生活指南", "zh-TW": "生活指南", ja: "生活ガイド" },
    keywords: "粗大垃圾 垃圾 分类 分類 收集日 回收 sodai gomi 资源 資源 回收券 粗大ごみ",
    icon: Recycle,
  },
  {
    title: { "zh-CN": "工资到手", "zh-TW": "薪資到手", ja: "手取り計算" },
    subtitle: { "zh-CN": "正社员、打工、社保和税后概算", "zh-TW": "正社員、打工、社保和稅後概算", ja: "正社員、アルバイト、社会保険と税後概算" },
    href: "/tools/salary",
    type: { "zh-CN": "工具", "zh-TW": "工具", ja: "ツール" },
    keywords: "工资 工資 薪资 薪資 到手 税后 稅後 社保 年金 健保 住民税 打工 正社员 正社員 salary",
    icon: WalletCards,
  },
  {
    title: { "zh-CN": "打工 28 小时", "zh-TW": "打工 28 小時", ja: "アルバイト28時間" },
    subtitle: { "zh-CN": "留学生工时记录和提醒", "zh-TW": "留學生工時記錄和提醒", ja: "留学生の勤務時間記録と確認" },
    href: "/tools/work-hours",
    type: { "zh-CN": "工具", "zh-TW": "工具", ja: "ツール" },
    keywords: "打工 28小时 28小時 资格外活动 資格外活動 排班 工时 工時 留学生 留學生 work hours",
    icon: ShieldCheck,
  },
  {
    title: { "zh-CN": "日本日历", "zh-TW": "日本日曆", ja: "日本カレンダー" },
    subtitle: { "zh-CN": "祝日、个人备注、考试和假期", "zh-TW": "祝日、個人備註、考試和假期", ja: "祝日、個人メモ、試験、休暇" },
    href: "/tools/holidays",
    type: { "zh-CN": "工具", "zh-TW": "工具", ja: "ツール" },
    keywords: "日历 日曆 假日 祝日 个人备注 個人備註 JLPT EJU 予定 calendar holiday",
    icon: CalendarDays,
  },
  {
    title: { "zh-CN": "7天天气", "zh-TW": "7天天氣", ja: "7日間天気" },
    subtitle: { "zh-CN": "未来7天气温、天气状态和降水概率", "zh-TW": "未來7天氣溫、天氣狀態和降水機率", ja: "7日間の気温、天気、降水確率" },
    href: "/tools/weather",
    type: { "zh-CN": "工具", "zh-TW": "工具", ja: "ツール" },
    keywords: "天气 天氣 气温 氣溫 降水 降雨 雨 伞 傘 weather forecast forecast 天気 予報 降水確率",
    icon: CloudSun,
  },
  {
    title: { "zh-CN": "地区对比", "zh-TW": "地區對比", ja: "地域比較" },
    subtitle: { "zh-CN": "对比东京区域的房租、通勤和生活便利度", "zh-TW": "對比東京區域的房租、通勤和生活便利度", ja: "東京エリアの家賃、通勤、暮らしやすさを比較" },
    href: "/tools/area-compare",
    type: { "zh-CN": "工具", "zh-TW": "工具", ja: "ツール" },
    keywords: "地区 地區 区域 區域 对比 對比 比较 比較 东京 東京 房租 通勤 生活便利 area compare",
    icon: GitCompare,
  },
  {
    title: { "zh-CN": "推荐 App", "zh-TW": "推薦 App", ja: "おすすめアプリ" },
    subtitle: { "zh-CN": "交通、支付、汇款、租房、防灾和医疗", "zh-TW": "交通、支付、匯款、租屋、防災和醫療", ja: "交通、支払い、送金、賃貸、防災、医療" },
    href: "/apps",
    type: { "zh-CN": "App", "zh-TW": "App", ja: "アプリ" },
    keywords: "app 交通 支付 汇款 匯款 租房 租屋 防灾 防災 医疗 醫療 翻译 翻譯 地图 地圖",
    icon: BookOpenText,
  },
  {
    title: { "zh-CN": "优惠推荐", "zh-TW": "優惠推薦", ja: "お得情報" },
    subtitle: { "zh-CN": "手机卡、Wi-Fi、汇款、信用卡", "zh-TW": "手機卡、Wi-Fi、匯款、信用卡", ja: "スマホ、Wi-Fi、送金、クレジットカード" },
    href: "/deals",
    type: { "zh-CN": "优惠", "zh-TW": "優惠", ja: "お得" },
    keywords: "优惠 優惠 手机卡 手機卡 wifi 汇款 匯款 信用卡 支付 deal coupon",
    icon: BadgePercent,
  },
];

const quickQueries = {
  "zh-CN": ["搬家", "退租", "国保", "在留更新", "粗大垃圾", "地区", "打工", "汇率"],
  "zh-TW": ["搬家", "退租", "國保", "在留更新", "粗大垃圾", "地區", "打工", "匯率"],
  ja: ["引っ越し", "退去", "国保", "在留更新", "粗大ごみ", "地域", "アルバイト", "為替"],
} as const;

const copy = {
  "zh-CN": {
    back: "返回",
    empty: "没有找到相关入口",
    emptyHint: "试试搜索：搬家、退租、国保、在留更新、粗大垃圾。",
    placeholder: "搜：搬家 / 退租 / 国保 / 在留更新 / 粗大垃圾",
    title: "生活问题搜索",
  },
  "zh-TW": {
    back: "返回",
    empty: "沒有找到相關入口",
    emptyHint: "試試搜尋：搬家、退租、國保、在留更新、粗大垃圾。",
    placeholder: "搜：搬家 / 退租 / 國保 / 在留更新 / 粗大垃圾",
    title: "生活問題搜尋",
  },
  ja: {
    back: "戻る",
    empty: "関連する入口が見つかりません",
    emptyHint: "引っ越し、退去、国保、在留更新、粗大ごみで検索してみてください。",
    placeholder: "検索：引っ越し / 退去 / 国保 / 在留更新 / 粗大ごみ",
    title: "生活の困りごと検索",
  },
} as const;

export default function SearchPage() {
  const { language } = useLanguage();
  const text = copy[language];
  const [query, setQuery] = useState("");
  const results = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return items;
    return items.filter((item) => `${item.title[language]} ${item.subtitle[language]} ${item.type[language]} ${item.keywords}`.toLowerCase().includes(keyword));
  }, [language, query]);

  return (
    <main className="min-h-screen bg-[#f5f0e7] text-stone-950">
      <div className="mx-auto min-h-screen max-w-[430px] bg-[#fbf8f2] px-4 py-5 shadow-2xl shadow-stone-300/40">
        <div className="flex items-center justify-between">
          <Link className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-black text-stone-600 shadow-sm" href="/">
            <ArrowLeft className="h-4 w-4" />
            {text.back}
          </Link>
          <h1 className="text-xl font-black text-emerald-800">{text.title}</h1>
        </div>

        <label className="mt-4 flex h-11 items-center gap-2 rounded-2xl bg-white px-3 shadow-sm">
          <Search className="h-4 w-4 shrink-0 text-emerald-800" />
          <input className="w-full bg-transparent text-sm font-black outline-none placeholder:text-stone-400" placeholder={text.placeholder} value={query} onChange={(event) => setQuery(event.target.value)} />
        </label>

        <section className="mt-3 flex flex-wrap gap-2">
          {quickQueries[language].map((item) => (
            <button className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-black text-emerald-800" key={item} onClick={() => setQuery(item)} type="button">
              {item}
            </button>
          ))}
        </section>

        <section className="mt-5 grid gap-3">
          {results.length === 0 ? (
            <div className="rounded-[24px] bg-white p-8 text-center shadow-sm">
              <h2 className="text-xl font-black">{text.empty}</h2>
              <p className="mt-2 text-sm font-bold text-stone-500">{text.emptyHint}</p>
            </div>
          ) : (
            results.map((item) => {
              const Icon = item.icon;
              return (
                <Link className="rounded-[22px] bg-white p-4 shadow-sm transition hover:bg-emerald-50" href={item.href} key={`${item.href}-${item.title[language]}`}>
                  <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-800">
                      <Icon className="h-5 w-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-black text-emerald-700">{item.type[language]}</p>
                      <h2 className="mt-1 text-lg font-black">{item.title[language]}</h2>
                      <p className="mt-1 text-sm font-bold text-stone-500">{item.subtitle[language]}</p>
                    </div>
                  </div>
                </Link>
              );
            })
          )}
        </section>
      </div>
    </main>
  );
}
