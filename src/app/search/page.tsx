"use client";

import { ArrowLeft, BadgePercent, BookOpenText, CalendarDays, CloudSun, FileClock, GitCompare, Home, Recycle, Search, ShieldCheck, TrainFront, WalletCards } from "lucide-react";
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
    title: { "zh-CN": "初到日本", "zh-TW": "初到日本", ja: "来日したら" },
    subtitle: { "zh-CN": "搬家、入住、居民登记、水电煤和国保路线", "zh-TW": "搬家、入住、居民登錄、水電瓦斯和國保路線", ja: "引っ越し、入居、住民登録、ライフライン、国保" },
    href: "/arrival",
    type: { "zh-CN": "生活路线", "zh-TW": "生活路線", ja: "生活ルート" },
    keywords: "搬家 入住 来日 到日本 水电煤 网络 邮便 转送 住民登记 国保 年金 区役所 引っ越し 入居 国民健康保険",
    icon: Home,
  },
  {
    title: { "zh-CN": "退租前检查", "zh-TW": "退租前檢查", ja: "退去前チェック" },
    subtitle: { "zh-CN": "初期照片、清扫费、管理公司和房租压力", "zh-TW": "初期照片、清潔費、管理公司和房租壓力", ja: "入居時写真、清掃費、管理会社、家賃の確認" },
    href: "/tools/rent",
    type: { "zh-CN": "租房", "zh-TW": "租屋", ja: "賃貸" },
    keywords: "退租 退去 解约 原状恢复 清扫费 敷金 礼金 租房 租屋 管理公司",
    icon: Home,
  },
  {
    title: { "zh-CN": "在留更新", "zh-TW": "在留更新", ja: "在留更新" },
    subtitle: { "zh-CN": "在留期限倒数和更新节点提醒", "zh-TW": "在留期限倒數和更新節點提醒", ja: "在留期限と更新タイミングの確認" },
    href: "/tools/visa-reminder",
    type: { "zh-CN": "签证", "zh-TW": "簽證", ja: "ビザ" },
    keywords: "在留 更新 签证 入管 期限 在留卡 visa extension immigration",
    icon: FileClock,
  },
  {
    title: { "zh-CN": "粗大垃圾", "zh-TW": "粗大垃圾", ja: "粗大ごみ" },
    subtitle: { "zh-CN": "垃圾分类、收集日、粗大垃圾申请入口", "zh-TW": "垃圾分類、收集日、粗大垃圾申請入口", ja: "ごみ分別、収集日、粗大ごみ申請の確認" },
    href: "/tools/holidays",
    type: { "zh-CN": "生活指南", "zh-TW": "生活指南", ja: "生活ガイド" },
    keywords: "粗大垃圾 垃圾 分类 收集日 回收 sodai gomi 资源 資源 ごみ 分別 収集日",
    icon: Recycle,
  },
  {
    title: { "zh-CN": "工资到手", "zh-TW": "薪資到手", ja: "手取り計算" },
    subtitle: { "zh-CN": "正社员、打工、社保和税后收入估算", "zh-TW": "正社員、打工、社保和稅後收入估算", ja: "正社員、アルバイト、社会保険、税後の目安" },
    href: "/tools/salary",
    type: { "zh-CN": "工具", "zh-TW": "工具", ja: "ツール" },
    keywords: "工资 薪资 到手 税后 社保 年金 健保 住民税 打工 正社员 salary",
    icon: WalletCards,
  },
  {
    title: { "zh-CN": "打工 28 小时", "zh-TW": "打工 28 小時", ja: "アルバイト28時間" },
    subtitle: { "zh-CN": "留学生工时记录和提醒", "zh-TW": "留學生工時記錄和提醒", ja: "留学生の勤務時間記録と確認" },
    href: "/tools/work-hours",
    type: { "zh-CN": "工具", "zh-TW": "工具", ja: "ツール" },
    keywords: "打工 28小时 资格外活动 排班 工时 留学生 work hours",
    icon: ShieldCheck,
  },
  {
    title: { "zh-CN": "日本日历", "zh-TW": "日本日曆", ja: "日本カレンダー" },
    subtitle: { "zh-CN": "节日、个人备注、垃圾日程和每月提醒", "zh-TW": "節日、個人備註、垃圾日程和每月提醒", ja: "祝日、個人メモ、ごみ収集、月次リマインダー" },
    href: "/tools/holidays",
    type: { "zh-CN": "工具", "zh-TW": "工具", ja: "ツール" },
    keywords: "日历 日曆 假日 节日 祝日 备注 備註 垃圾日程 每月提醒 calendar holiday ごみ",
    icon: CalendarDays,
  },
  {
    title: { "zh-CN": "7 天天气", "zh-TW": "7 天天氣", ja: "7日間天気" },
    subtitle: { "zh-CN": "未来 7 天气温、天气状态和降水概率", "zh-TW": "未來 7 天氣溫、天氣狀態和降水機率", ja: "7日間の気温、天気、降水確率" },
    href: "/tools/weather",
    type: { "zh-CN": "工具", "zh-TW": "工具", ja: "ツール" },
    keywords: "天气 天氣 气温 氣溫 降水 降雨 weather forecast 天気 予報",
    icon: CloudSun,
  },
  {
    title: { "zh-CN": "地区对比", "zh-TW": "地區對比", ja: "地域比較" },
    subtitle: { "zh-CN": "对比东京区域的房租、通勤和生活便利度", "zh-TW": "對比東京區域的房租、通勤和生活便利度", ja: "東京エリアの家賃、通勤、暮らしやすさを比較" },
    href: "/tools/area-compare",
    type: { "zh-CN": "工具", "zh-TW": "工具", ja: "ツール" },
    keywords: "地区 地區 区域 对比 比较 東京 房租 通勤 生活便利 area compare",
    icon: GitCompare,
  },
  {
    title: { "zh-CN": "东京电车交通", "zh-TW": "東京電車交通", ja: "東京の電車運行情報" },
    subtitle: { "zh-CN": "查询山手线、中央线、东京 Metro 等线路状态，API 接入预留", "zh-TW": "查詢山手線、中央線、東京 Metro 等路線狀態，API 接入預留", ja: "山手線、中央線、東京メトロなどの運行状況を確認" },
    href: "/tools/train-status",
    type: { "zh-CN": "交通", "zh-TW": "交通", ja: "交通" },
    keywords: "东京 東京 电车 電車 交通 地铁 地鐵 metro train rail 山手线 山手線 中央线 中央線 京王线 京王線 总武线 總武線 東西線 筑波快线 筑波快線 遅延 延误 延誤 運行情報",
    icon: TrainFront,
  },
  {
    title: { "zh-CN": "推荐 App", "zh-TW": "推薦 App", ja: "おすすめアプリ" },
    subtitle: { "zh-CN": "交通、支付、汇款、租房、防灾和医疗", "zh-TW": "交通、支付、匯款、租屋、防災和醫療", ja: "交通、支払い、送金、賃貸、防災、医療" },
    href: "/apps",
    type: { "zh-CN": "App", "zh-TW": "App", ja: "アプリ" },
    keywords: "app 交通 支付 汇款 租房 防灾 医疗 翻译 地图",
    icon: BookOpenText,
  },
  {
    title: { "zh-CN": "优惠推荐", "zh-TW": "優惠推薦", ja: "お得情報" },
    subtitle: { "zh-CN": "手机卡、Wi-Fi、汇款、信用卡", "zh-TW": "手機卡、Wi-Fi、匯款、信用卡", ja: "スマホ、Wi-Fi、送金、クレジットカード" },
    href: "/deals",
    type: { "zh-CN": "优惠", "zh-TW": "優惠", ja: "お得" },
    keywords: "优惠 優惠 手机卡 wifi 汇款 信用卡 deal coupon",
    icon: BadgePercent,
  },
];

const quickQueries = {
  "zh-CN": ["搬家", "退租", "国保", "在留更新", "粗大垃圾", "电车", "打工", "汇率"],
  "zh-TW": ["搬家", "退租", "國保", "在留更新", "粗大垃圾", "電車", "打工", "匯率"],
  ja: ["引っ越し", "退去", "国保", "在留更新", "粗大ごみ", "電車", "アルバイト", "為替"],
} as const;

const copy = {
  "zh-CN": {
    back: "返回",
    empty: "没有找到相关入口",
    emptyHint: "试试搜索：搬家、退租、国保、在留更新、粗大垃圾、电车。",
    placeholder: "搜：搬家 / 退租 / 国保 / 电车 / 粗大垃圾",
    title: "生活问题搜索",
  },
  "zh-TW": {
    back: "返回",
    empty: "沒有找到相關入口",
    emptyHint: "試試搜尋：搬家、退租、國保、在留更新、粗大垃圾、電車。",
    placeholder: "搜：搬家 / 退租 / 國保 / 電車 / 粗大垃圾",
    title: "生活問題搜尋",
  },
  ja: {
    back: "戻る",
    empty: "関連する入口が見つかりません",
    emptyHint: "引っ越し、退去、国保、在留更新、粗大ごみ、電車で検索してみてください。",
    placeholder: "検索：引っ越し / 退去 / 国保 / 電車 / 粗大ごみ",
    title: "生活検索",
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
    <main className="min-h-screen bg-[#F6FAFF] text-[#0F172A]">
      <div className="mx-auto min-h-screen max-w-[430px] bg-[radial-gradient(circle_at_top,#DFF1FF_0%,#F6FAFF_42%,#FFFFFF_100%)] px-4 pb-24 pt-5">
        <div className="flex items-center justify-between gap-3">
          <Link className="ios-glass-button flex items-center gap-2 px-4 py-2 text-sm font-black text-[#64748B]" href="/">
            <ArrowLeft className="h-4 w-4" />
            {text.back}
          </Link>
          <h1 className="truncate text-xl font-black tracking-tight text-[#0F172A]">{text.title}</h1>
        </div>

        <label className="mt-4 flex h-12 items-center gap-2 rounded-3xl border border-white/60 bg-white/75 px-4 shadow-sm backdrop-blur-xl">
          <Search className="h-4 w-4 shrink-0 text-[#64748B]" />
          <input className="w-full bg-transparent text-sm font-bold text-[#0F172A] outline-none placeholder:text-[#94A3B8]" placeholder={text.placeholder} value={query} onChange={(event) => setQuery(event.target.value)} />
        </label>

        <section className="mt-3 flex flex-wrap gap-2">
          {quickQueries[language].map((item) => (
            <button className="ios-glass-button px-3 py-1.5 text-xs font-black text-[#2563EB]" key={item} onClick={() => setQuery(item)} type="button">
              {item}
            </button>
          ))}
        </section>

        <section className="mt-5 grid gap-3">
          {results.length === 0 ? (
            <div className="rounded-[28px] border border-white/60 bg-white/75 p-8 text-center shadow-sm backdrop-blur-xl">
              <h2 className="text-xl font-black">{text.empty}</h2>
              <p className="mt-2 text-sm font-bold leading-6 text-[#64748B]">{text.emptyHint}</p>
            </div>
          ) : (
            results.map((item) => {
              const Icon = item.icon;
              return (
                <Link className="rounded-[26px] border border-white/60 bg-white/75 p-4 shadow-[0_10px_32px_rgba(37,99,235,0.08)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/90" href={item.href} key={`${item.href}-${item.title[language]}`}>
                  <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-100 to-blue-100 text-[#2563EB] shadow-sm">
                      <Icon className="h-5 w-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-black text-[#2563EB]">{item.type[language]}</p>
                      <h2 className="mt-1 truncate text-lg font-black">{item.title[language]}</h2>
                      <p className="mt-1 line-clamp-2 text-sm font-bold leading-5 text-[#64748B]">{item.subtitle[language]}</p>
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
