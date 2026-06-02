"use client";

import { AlertTriangle, ArrowLeft, Heart, Info, PiggyBank, Search, Star, Ticket, TrainFront } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { TrainDealCalculator } from "@/components/trainDeals/TrainDealCalculator";
import { TrainDealCard } from "@/components/trainDeals/TrainDealCard";
import { TrainDealTabs } from "@/components/trainDeals/TrainDealTabs";
import { useLanguage } from "@/hooks/useLanguage";
import { trainDeals, trainDealTabs } from "@/lib/trainDeals/deals";
import { getTodayTrainDealTip } from "@/lib/trainDeals/recommendation";
import { readTrainDealFavoriteIds, readTrainDealFrequentIds, writeTrainDealFavoriteIds, writeTrainDealFrequentIds } from "@/lib/trainDeals/storage";
import type { TrainDealCalculatorState, TrainDealTab } from "@/lib/trainDeals/types";

const initialCalculatorState: TrainDealCalculatorState = {
  airport: false,
  mainRail: "Metro",
  multiSpot: true,
  rideCount: "3〜4 次",
  suburban: false,
};

const tabTagAliases: Partial<Record<TrainDealTab, string[]>> = {
  "东京 Metro": ["Metro", "地下铁"],
  "都营地下铁": ["都营", "地下铁"],
  "学生 / 通勤": ["学生", "通勤", "定期券"],
};

const trainDealsCopy = {
  "zh-CN": {
    ariaBack: "返回 Japan Life 首页",
    back: "返回 Japan Life",
    title: "电车优惠",
    subtitle: "一日券、优惠票和交通省钱建议。",
    todayTitle: "今日交通省钱建议",
    defaultTip: "今天先看路线会不会集中在同一家铁路公司，再判断一日券是否适合。",
    tickets: "常见优惠票列表",
    count: (value: number) => `${value} 个`,
    empty: "暂时没有找到对应优惠票，换个分类看看吧。",
    showAll: "查看全部",
    favorites: "收藏的优惠票",
    noFavorites: "还没有收藏。常用的一日券或通勤票可以先收藏起来。",
    frequent: "常用优惠票",
    noFrequent: "还没有常用优惠票。通勤、机场或常去近郊路线可以设为常用。",
    view: "查看",
    noticeTitle: "买优惠票前注意",
    notices: ["一日券不一定适合所有路线", "JR、Metro、都营、私铁的适用范围不同", "机场交通通常规则不同", "有些票只能在特定地点购买", "价格和适用范围可能变化", "购买前请确认官方信息"],
    notice: "交通优惠票的价格、适用区间和购买条件可能变化，请以铁路公司官方信息为准。",
    localTitle: "本地数据说明",
    local: "电车优惠数据目前为 Japan Life 本地整理；运行信息可在「东京交通」查看 ODPT 参考状态。收藏和常用优惠票会保存在本机浏览器中，清除浏览器数据后可能会消失。",
    trainStatus: "查看东京交通",
  },
  "zh-TW": {
    ariaBack: "返回 Japan Life 首頁",
    back: "返回 Japan Life",
    title: "電車優惠",
    subtitle: "一日券、優惠票和交通省錢建議。",
    todayTitle: "今日交通省錢建議",
    defaultTip: "今天先看路線會不會集中在同一家鐵路公司，再判斷一日券是否適合。",
    tickets: "常見優惠票列表",
    count: (value: number) => `${value} 個`,
    empty: "暫時沒有找到對應優惠票，換個分類看看吧。",
    showAll: "查看全部",
    favorites: "收藏的優惠票",
    noFavorites: "還沒有收藏。常用的一日券或通勤票可以先收藏起來。",
    frequent: "常用優惠票",
    noFrequent: "還沒有常用優惠票。通勤、機場或常去近郊路線可以設為常用。",
    view: "查看",
    noticeTitle: "買優惠票前注意",
    notices: ["一日券不一定適合所有路線", "JR、Metro、都營、私鐵的適用範圍不同", "機場交通通常規則不同", "有些票只能在特定地點購買", "價格和適用範圍可能變化", "購買前請確認官方資訊"],
    notice: "交通優惠票的價格、適用區間和購買條件可能變化，請以鐵路公司官方資訊為準。",
    localTitle: "本地資料說明",
    local: "電車優惠資料目前為 Japan Life 本地整理；運行資訊可在「東京交通」查看 ODPT 參考狀態。收藏和常用優惠票會保存在本機瀏覽器中，清除瀏覽器資料後可能會消失。",
    trainStatus: "查看東京交通",
  },
  ja: {
    ariaBack: "Japan Life ホームに戻る",
    back: "Japan Life に戻る",
    title: "電車のお得情報",
    subtitle: "一日券、割引きっぷ、交通費の節約ヒント。",
    todayTitle: "今日の交通費節約ヒント",
    defaultTip: "まず今日の移動が同じ鉄道会社に集中するか確認し、一日券が合うか判断しましょう。",
    tickets: "よく使うお得きっぷ",
    count: (value: number) => `${value}件`,
    empty: "該当するきっぷが見つかりません。別のカテゴリを試してください。",
    showAll: "すべて見る",
    favorites: "保存したきっぷ",
    noFavorites: "まだ保存がありません。よく使う一日券や通勤向けきっぷを保存できます。",
    frequent: "よく使うきっぷ",
    noFrequent: "まだよく使うきっぷがありません。通勤、空港、近郊ルートを設定できます。",
    view: "見る",
    noticeTitle: "購入前の注意",
    notices: ["一日券がすべてのルートに合うとは限りません", "JR、Metro、都営、私鉄で適用範囲が異なります", "空港交通はルールが異なることがあります", "特定の場所でしか購入できないきっぷがあります", "価格や適用範囲は変わることがあります", "購入前に公式情報を確認してください"],
    notice: "交通系のお得きっぷは価格、適用区間、購入条件が変わることがあります。鉄道会社の公式情報を確認してください。",
    localTitle: "ローカルデータについて",
    local: "電車のお得情報は現在 Japan Life がローカルで整理したデータです。運行情報は「東京交通」で ODPT の取得状況を確認できます。保存したきっぷはこのブラウザに保存され、ブラウザデータを削除すると消えることがあります。",
    trainStatus: "東京交通を見る",
  },
} as const;

export default function TrainDealsPage() {
  const { language } = useLanguage();
  const text = trainDealsCopy[language];
  const [activeTab, setActiveTab] = useState<TrainDealTab>("全部");
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [frequentIds, setFrequentIds] = useState<string[]>([]);
  const [calculatorState, setCalculatorState] = useState<TrainDealCalculatorState>(initialCalculatorState);
  const [todayTip, setTodayTip] = useState<string>(text.defaultTip);

  useEffect(() => {
    setFavoriteIds(readTrainDealFavoriteIds());
    setFrequentIds(readTrainDealFrequentIds());
    setTodayTip(getTodayTrainDealTip());
  }, []);

  const filteredDeals = useMemo(() => {
    if (activeTab === "全部") return trainDeals;
    const aliases = tabTagAliases[activeTab] ?? [activeTab];
    return trainDeals.filter((deal) => deal.category === activeTab || aliases.some((alias) => deal.tags.includes(alias)));
  }, [activeTab]);

  const favoriteDeals = useMemo(() => trainDeals.filter((deal) => favoriteIds.includes(deal.id)), [favoriteIds]);
  const frequentDeals = useMemo(() => trainDeals.filter((deal) => frequentIds.includes(deal.id)), [frequentIds]);

  const toggleFavorite = (id: string) => {
    const nextIds = favoriteIds.includes(id) ? favoriteIds.filter((item) => item !== id) : [id, ...favoriteIds.filter((item) => item !== id)];
    setFavoriteIds(nextIds);
    writeTrainDealFavoriteIds(nextIds);
  };

  const toggleFrequent = (id: string) => {
    const nextIds = frequentIds.includes(id) ? frequentIds.filter((item) => item !== id) : [id, ...frequentIds.filter((item) => item !== id)];
    setFrequentIds(nextIds);
    writeTrainDealFrequentIds(nextIds);
  };

  const showAll = () => setActiveTab("全部");

  return (
    <main className="jl-tool-theme min-h-screen text-[#10231A]">
      <div className="jl-tool-shell mx-auto min-h-screen max-w-[430px] px-4 pb-32 pt-5">
        <header className="flex items-center justify-between gap-3">
          <Link aria-label={text.ariaBack} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-emerald-100 bg-white/90 px-4 text-sm font-black text-emerald-800 shadow-sm transition active:scale-[0.98]" href="/">
            <ArrowLeft className="h-4 w-4" />
            {text.back}
          </Link>
          <span className="inline-flex items-center gap-1 rounded-full bg-white/85 px-4 py-2 text-xs font-black text-emerald-700 shadow-sm backdrop-blur-xl">
            Train
            <TrainFront className="h-3.5 w-3.5" />
          </span>
        </header>

        <section className="mt-5 rounded-[34px] border border-emerald-100 bg-white/92 p-5 shadow-[0_18px_45px_rgba(22,101,52,0.10)]">
          <div className="flex items-start gap-3">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-3xl bg-emerald-600 p-3 text-white shadow-sm">
              <Ticket className="h-7 w-7" />
            </span>
            <div>
              <p className="text-xs font-black text-emerald-700">Japan Life Tool</p>
              <h1 className="mt-1 text-3xl font-black tracking-tight">{text.title}</h1>
              <p className="mt-2 text-sm font-bold leading-6 text-[#64748B]">{text.subtitle}</p>
            </div>
          </div>
        </section>

        <section className="mt-4 rounded-[26px] border border-emerald-100 bg-white/92 p-4 shadow-[0_12px_30px_rgba(22,101,52,0.08)]">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
              <PiggyBank className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs font-black text-emerald-700">Today</p>
              <h2 className="mt-1 text-lg font-black text-[#10231A]">{text.todayTitle}</h2>
              <p className="mt-1 text-sm font-bold leading-6 text-[#475569]">{todayTip}</p>
            </div>
          </div>
        </section>

        <section className="mt-4">
          <TrainDealCalculator onChange={setCalculatorState} state={calculatorState} />
        </section>

        <section className="mt-4">
          <TrainDealTabs activeTab={activeTab} onChange={setActiveTab} tabs={trainDealTabs} />
        </section>

        <section className="mt-4">
          <div className="mb-3 flex items-end justify-between gap-3 px-1">
            <div>
              <p className="text-xs font-black text-emerald-700">Tickets</p>
              <h2 className="text-lg font-black text-[#10231A]">{text.tickets}</h2>
            </div>
            <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-[#64748B] shadow-sm">{text.count(filteredDeals.length)}</span>
          </div>

          {filteredDeals.length === 0 ? (
            <div className="rounded-[26px] border border-emerald-100 bg-white/92 p-4 shadow-[0_12px_30px_rgba(22,101,52,0.08)]">
              <p className="text-sm font-black leading-6 text-emerald-800">{text.empty}</p>
              <button className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl bg-emerald-700 px-4 text-xs font-black text-white" onClick={showAll} type="button">
                <Search className="h-4 w-4" />
                {text.showAll}
              </button>
            </div>
          ) : (
            <div className="grid gap-3">
              {filteredDeals.map((deal) => (
                <TrainDealCard
                  deal={deal}
                  isFavorite={favoriteIds.includes(deal.id)}
                  isFrequent={frequentIds.includes(deal.id)}
                  key={deal.id}
                  onToggleFavorite={toggleFavorite}
                  onToggleFrequent={toggleFrequent}
                />
              ))}
            </div>
          )}
        </section>

        <section className="mt-4 rounded-[26px] border border-emerald-100 bg-white/90 p-4 shadow-[0_12px_30px_rgba(22,101,52,0.08)]">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
              <Heart className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs font-black text-emerald-700">Favorites</p>
              <h2 className="text-lg font-black text-[#10231A]">{text.favorites}</h2>
            </div>
          </div>
          {favoriteDeals.length === 0 ? (
            <p className="mt-3 rounded-2xl bg-emerald-50 px-3 py-3 text-sm font-bold leading-6 text-emerald-800">{text.noFavorites}</p>
          ) : (
            <div className="mt-3 grid gap-2">
              {favoriteDeals.map((deal) => (
                <button
                  className="flex min-h-12 items-center justify-between gap-3 rounded-2xl border border-emerald-100 bg-white px-3 py-2 text-left shadow-sm transition focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 active:scale-[0.98]"
                  key={deal.id}
                  onClick={() => setActiveTab(deal.category)}
                  type="button"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-black text-[#10231A]">{deal.name}</span>
                    <span className="mt-0.5 block truncate text-xs font-bold text-[#64748B]">{deal.company}</span>
                  </span>
                  <span className="shrink-0 text-xs font-black text-emerald-700">{text.view}</span>
                </button>
              ))}
            </div>
          )}
        </section>

        <section className="mt-4 rounded-[26px] border border-emerald-100 bg-white/90 p-4 shadow-[0_12px_30px_rgba(22,101,52,0.08)]">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
              <Star className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs font-black text-emerald-700">Frequent</p>
              <h2 className="text-lg font-black text-[#10231A]">{text.frequent}</h2>
            </div>
          </div>
          {frequentDeals.length === 0 ? (
            <p className="mt-3 rounded-2xl bg-emerald-50 px-3 py-3 text-sm font-bold leading-6 text-emerald-800">{text.noFrequent}</p>
          ) : (
            <div className="mt-3 grid gap-2">
              {frequentDeals.map((deal) => (
                <button
                  className="flex min-h-12 items-center justify-between gap-3 rounded-2xl border border-emerald-100 bg-white px-3 py-2 text-left shadow-sm transition focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 active:scale-[0.98]"
                  key={deal.id}
                  onClick={() => setActiveTab(deal.category)}
                  type="button"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-black text-[#10231A]">{deal.name}</span>
                    <span className="mt-0.5 block truncate text-xs font-bold text-[#64748B]">{deal.company}</span>
                  </span>
                  <span className="shrink-0 text-xs font-black text-emerald-700">{text.view}</span>
                </button>
              ))}
            </div>
          )}
        </section>

        <section className="mt-4 rounded-[26px] border border-amber-100 bg-white/90 p-4 shadow-[0_12px_30px_rgba(22,101,52,0.08)]">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
              <AlertTriangle className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs font-black text-amber-700">Notice</p>
              <h2 className="mt-1 text-lg font-black text-[#10231A]">{text.noticeTitle}</h2>
              <ul className="mt-2 grid gap-1 text-xs font-bold leading-5 text-[#64748B]">
                {text.notices.map((item) => <li key={item}>· {item}</li>)}
              </ul>
              <p className="mt-3 rounded-2xl bg-amber-50 px-3 py-2 text-xs font-black leading-5 text-amber-900">{text.notice}</p>
            </div>
          </div>
        </section>

        <section className="mt-4 rounded-[26px] border border-emerald-100 bg-white/90 p-4 shadow-[0_12px_30px_rgba(22,101,52,0.08)]">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
              <Info className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs font-black text-emerald-700">Local</p>
              <h2 className="mt-1 text-lg font-black text-[#10231A]">{text.localTitle}</h2>
              <p className="mt-1 text-xs font-bold leading-5 text-[#64748B]">{text.local}</p>
              <Link className="mt-3 inline-flex min-h-11 w-full items-center justify-center rounded-2xl border border-emerald-100 bg-white px-4 text-xs font-black text-emerald-800 shadow-sm transition active:scale-[0.98]" href="/tools/train-status">
                {text.trainStatus}
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
