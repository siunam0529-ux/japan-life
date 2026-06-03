"use client";

import { ArrowLeft, CalendarDays, CheckCircle2, Clock3, Heart, Info, MapPinned, RefreshCw, Sparkles, UsersRound } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CollapsiblePanel } from "@/components/CollapsiblePanel";
import { PlayPlanSteps } from "@/components/play/PlayPlanSteps";
import { useLanguage } from "@/hooks/useLanguage";
import { playCompanionTags, playDestinations, playModes, playTypeTags } from "@/lib/play/destinations";
import { getInitialPlayPick, getPlayDestinationById, getPlayMatches, pickPlayDestination } from "@/lib/play/recommendation";
import { getPlayDateKey, readPlayDailyPick, readPlayFavorites, readPlayVisitedRecords, resetPlayStorage, writePlayDailyPick, writePlayFavorites, writePlayVisitedRecords } from "@/lib/play/storage";
import type { Language } from "@/lib/i18n/translations";
import type { PlayDestination, PlayFilterTag, PlayMode, PlaySavedDestination, PlayVisitedRecord } from "@/lib/play/types";

const PlayMiniMap = dynamic(() => import("@/components/play/PlayMiniMap"), {
  loading: () => <PlayMapLoading />,
  ssr: false,
});

const filterGroups = [
  { title: "对象", options: playCompanionTags },
  { title: "类型", options: playTypeTags },
];

const playCopy = {
  "zh-CN": {
    mapLoading: "地图加载中...",
    backAria: "返回 Japan Life 首页",
    back: "返回 Japan Life",
    title: "今天去哪玩",
    subtitle: "半日游、一日游和周末随机目的地推荐。",
    current: "当前",
    planTitle: "今天想怎么玩",
    modeLabel: "游玩模式",
    groups: { companion: "对象", type: "类型" },
    todayPlan: "今日游玩计划",
    routeTitle: "推荐路线",
    shuffle: "换一个",
    duration: "预计",
    budget: "预算",
    reference: "仅供参考",
    bestFor: "适合",
    reason: "理由",
    empty: "今天还没找到合适的目的地，换个条件试试吧。",
    actions: "收藏 / 去过",
    favorited: "已收藏",
    favorite: "收藏",
    visitedDone: "去过了",
    visited: "去过",
    openMap: "打开地图",
    budgetDuration: "预算和时长",
    budgetReference: "预算仅供参考",
    audience: "适合对象",
    mapTitle: "小地图预览",
    mapNote: "地图仅供参考，实际路线请以地图 APP 为准。",
    favoritesTitle: "收藏的游玩目的地",
    favoritesEmpty: "还没有收藏。适合周末再去的地方可以先收藏起来。",
    view: "查看",
    visitedTitle: "去过的目的地",
    visitedEmpty: "还没有记录。去过之后可以点「去过」。",
    visitedCount: (count: number) => `已记录 ${count} 个目的地。`,
    localTitle: "本地保存说明",
    localDesc: "今日推荐、收藏和去过记录会保存在本机浏览器中，清除浏览器数据后可能会消失。目的地为 Japan Life 本地精选整理，出发前请确认交通和营业信息。",
    reset: "重置今天去哪玩数据",
  },
  "zh-TW": {
    mapLoading: "地圖載入中...",
    backAria: "返回 Japan Life 首頁",
    back: "返回 Japan Life",
    title: "今天去哪玩",
    subtitle: "半日遊、一日遊和週末隨機目的地推薦。",
    current: "目前",
    planTitle: "今天想怎麼玩",
    modeLabel: "遊玩模式",
    groups: { companion: "對象", type: "類型" },
    todayPlan: "今日遊玩計畫",
    routeTitle: "推薦路線",
    shuffle: "換一個",
    duration: "預計",
    budget: "預算",
    reference: "僅供參考",
    bestFor: "適合",
    reason: "理由",
    empty: "今天還沒找到合適的目的地，換個條件試試吧。",
    actions: "收藏 / 去過",
    favorited: "已收藏",
    favorite: "收藏",
    visitedDone: "去過了",
    visited: "去過",
    openMap: "打開地圖",
    budgetDuration: "預算和時長",
    budgetReference: "預算僅供參考",
    audience: "適合對象",
    mapTitle: "小地圖預覽",
    mapNote: "地圖僅供參考，實際路線請以地圖 APP 為準。",
    favoritesTitle: "收藏的遊玩目的地",
    favoritesEmpty: "還沒有收藏。適合週末再去的地方可以先收藏起來。",
    view: "查看",
    visitedTitle: "去過的目的地",
    visitedEmpty: "還沒有紀錄。去過之後可以點「去過」。",
    visitedCount: (count: number) => `已記錄 ${count} 個目的地。`,
    localTitle: "本地保存說明",
    localDesc: "今日推薦、收藏和去過紀錄會保存在本機瀏覽器中，清除瀏覽器資料後可能會消失。目的地為 Japan Life 本地精選整理，出發前請確認交通和營業資訊。",
    reset: "重置今天去哪玩資料",
  },
  ja: {
    mapLoading: "地図を読み込み中...",
    backAria: "Japan Life ホームへ戻る",
    back: "Japan Life に戻る",
    title: "今日はどこへ行く？",
    subtitle: "半日、一日、週末向けのランダム目的地を提案します。",
    current: "現在",
    planTitle: "今日の遊び方",
    modeLabel: "遊び方",
    groups: { companion: "相手", type: "タイプ" },
    todayPlan: "今日のプラン",
    routeTitle: "おすすめルート",
    shuffle: "別の候補",
    duration: "目安",
    budget: "予算",
    reference: "参考",
    bestFor: "おすすめ",
    reason: "理由",
    empty: "条件に合う目的地がまだ見つかりません。条件を変えてみてください。",
    actions: "保存 / 行った",
    favorited: "保存済み",
    favorite: "保存",
    visitedDone: "行った",
    visited: "行った",
    openMap: "地図を開く",
    budgetDuration: "予算と所要時間",
    budgetReference: "予算は参考です",
    audience: "おすすめ対象",
    mapTitle: "ミニ地図プレビュー",
    mapNote: "地図は参考です。実際のルートは地図アプリで確認してください。",
    favoritesTitle: "保存した目的地",
    favoritesEmpty: "保存した目的地はまだありません。週末に行きたい場所を保存しておけます。",
    view: "見る",
    visitedTitle: "行った目的地",
    visitedEmpty: "記録はまだありません。行った後に「行った」を押せます。",
    visitedCount: (count: number) => `${count}件の目的地を記録済み。`,
    localTitle: "ローカル保存について",
    localDesc: "今日の提案、保存、行った記録はこのブラウザに保存されます。ブラウザデータを削除すると消える場合があります。目的地は Japan Life のローカル整理情報です。出発前に交通と営業情報を確認してください。",
    reset: "今日はどこへ行くデータをリセット",
  },
} as const;

function PlayMapLoading() {
  const { language } = useLanguage();
  return <div className="flex h-[220px] items-center justify-center rounded-[24px] bg-emerald-50 text-sm font-black text-emerald-700">{playCopy[language].mapLoading}</div>;
}

const modeLabels: Record<PlayMode, Record<Language, string>> = {
  "半日游": { "zh-CN": "半日游", "zh-TW": "半日遊", ja: "半日" },
  "一日游": { "zh-CN": "一日游", "zh-TW": "一日遊", ja: "一日" },
  "傍晚出发": { "zh-CN": "傍晚出发", "zh-TW": "傍晚出發", ja: "夕方出発" },
  "周末小旅行": { "zh-CN": "周末小旅行", "zh-TW": "週末小旅行", ja: "週末小旅行" },
};

const tagLabels: Record<PlayFilterTag, Record<Language, string>> = {
  "半日": { "zh-CN": "半日", "zh-TW": "半日", ja: "半日" },
  "一日": { "zh-CN": "一日", "zh-TW": "一日", ja: "一日" },
  "傍晚出发": { "zh-CN": "傍晚出发", "zh-TW": "傍晚出發", ja: "夕方出発" },
  "周末": { "zh-CN": "周末", "zh-TW": "週末", ja: "週末" },
  "一个人": { "zh-CN": "一个人", "zh-TW": "一個人", ja: "ひとり" },
  "朋友": { "zh-CN": "朋友", "zh-TW": "朋友", ja: "友人" },
  "情侣": { "zh-CN": "情侣", "zh-TW": "情侶", ja: "カップル" },
  "家人": { "zh-CN": "家人", "zh-TW": "家人", ja: "家族" },
  "自然": { "zh-CN": "自然", "zh-TW": "自然", ja: "自然" },
  "咖啡": { "zh-CN": "咖啡", "zh-TW": "咖啡", ja: "カフェ" },
  "购物": { "zh-CN": "购物", "zh-TW": "購物", ja: "買い物" },
  "老街": { "zh-CN": "老街", "zh-TW": "老街", ja: "昔ながらの街" },
  "海边": { "zh-CN": "海边", "zh-TW": "海邊", ja: "海辺" },
  "夜景": { "zh-CN": "夜景", "zh-TW": "夜景", ja: "夜景" },
  "低预算": { "zh-CN": "低预算", "zh-TW": "低預算", ja: "低予算" },
  "雨天也可以": { "zh-CN": "雨天也可以", "zh-TW": "雨天也可以", ja: "雨の日も可" },
  "不想太累": { "zh-CN": "不想太累", "zh-TW": "不想太累", ja: "疲れにくい" },
  "想有出门感": { "zh-CN": "想有出门感", "zh-TW": "想有出門感", ja: "出かけた感" },
  "想拍照": { "zh-CN": "想拍照", "zh-TW": "想拍照", ja: "写真向き" },
  "想吃点好的": { "zh-CN": "想吃点好的", "zh-TW": "想吃點好的", ja: "食事重視" },
};

function labelMode(mode: PlayMode, language: Language) {
  return modeLabels[mode]?.[language] ?? mode;
}

function labelTag(tag: PlayFilterTag, language: Language) {
  return tagLabels[tag]?.[language] ?? tag;
}

const visibleFilterTags = new Set<PlayFilterTag>([...playCompanionTags, ...playTypeTags]);

function normalizePlayFilters(filters: PlayFilterTag[]) {
  return filters.filter((tag) => visibleFilterTags.has(tag));
}

function saveDaily(destination: PlayDestination, dateKey: string, filters: PlayFilterTag[], mode: PlayMode) {
  writePlayDailyPick({ date: dateKey, destinationId: destination.id, filters, mode });
}

export default function PlayPage() {
  const { language } = useLanguage();
  const text = playCopy[language];
  const [dateKey, setDateKey] = useState("2026-01-01");
  const [filters, setFilters] = useState<PlayFilterTag[]>([]);
  const [mode, setMode] = useState<PlayMode>("半日游");
  const [favorites, setFavorites] = useState<PlaySavedDestination[]>([]);
  const [visitedRecords, setVisitedRecords] = useState<PlayVisitedRecord[]>([]);
  const [selectedId, setSelectedId] = useState(playDestinations[0]?.id ?? "");

  useEffect(() => {
    const today = getPlayDateKey();
    const savedPick = readPlayDailyPick(today);
    const nextFilters = normalizePlayFilters(savedPick?.filters ?? []);
    const nextMode = savedPick?.mode ?? "半日游";
    const nextDestination = getInitialPlayPick(savedPick?.destinationId ?? null, nextFilters, nextMode) ?? playDestinations[0];
    setDateKey(today);
    setFilters(nextFilters);
    setMode(nextMode);
    setFavorites(readPlayFavorites());
    setVisitedRecords(readPlayVisitedRecords());
    setSelectedId(nextDestination.id);
    saveDaily(nextDestination, today, nextFilters, nextMode);
  }, []);

  const matches = useMemo(() => getPlayMatches(filters, mode), [filters, mode]);
  const selected = getPlayDestinationById(selectedId) ?? matches[0] ?? null;
  const favoriteIds = useMemo(() => favorites.map((item) => item.destinationId), [favorites]);
  const visitedIds = useMemo(() => visitedRecords.map((item) => item.destinationId), [visitedRecords]);
  const favoriteDestinations = useMemo(() => playDestinations.filter((destination) => favoriteIds.includes(destination.id)), [favoriteIds]);
  const visitedDestinations = useMemo(() => playDestinations.filter((destination) => visitedIds.includes(destination.id)), [visitedIds]);

  const setSelectedAndSave = (destination: PlayDestination, nextFilters = filters, nextMode = mode, shouldScroll = true) => {
    setSelectedId(destination.id);
    saveDaily(destination, dateKey, nextFilters, nextMode);
    if (shouldScroll) window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const toggleFilter = (tag: PlayFilterTag) => {
    const nextFilters = filters.includes(tag) ? filters.filter((item) => item !== tag) : [tag, ...filters];
    const nextMatches = getPlayMatches(nextFilters, mode);
    setFilters(nextFilters);
    if (nextMatches[0]) setSelectedAndSave(nextMatches[0], nextFilters, mode);
    else setSelectedId("");
  };

  const changeMode = (nextMode: PlayMode) => {
    const nextMatches = getPlayMatches(filters, nextMode);
    setMode(nextMode);
    if (nextMatches[0]) setSelectedAndSave(nextMatches[0], filters, nextMode);
  };

  const shuffleDestination = () => {
    const picked = pickPlayDestination({ currentId: selected?.id, filters, mode });
    if (picked) setSelectedAndSave(picked, filters, mode, false);
  };

  const toggleFavorite = (id: string) => {
    const nextFavorites = favoriteIds.includes(id)
      ? favorites.filter((item) => item.destinationId !== id)
      : [{ date: dateKey, destinationId: id, mode, selectedTags: filters }, ...favorites.filter((item) => item.destinationId !== id)];
    setFavorites(nextFavorites);
    writePlayFavorites(nextFavorites);
  };

  const toggleVisited = (id: string) => {
    const nextRecords = visitedIds.includes(id)
      ? visitedRecords.filter((item) => item.destinationId !== id)
      : [{ date: dateKey, destinationId: id, mode }, ...visitedRecords.filter((item) => item.destinationId !== id)];
    setVisitedRecords(nextRecords);
    writePlayVisitedRecords(nextRecords);
  };

  const resetPlayData = () => {
    const nextDestination = pickPlayDestination({ filters: [], mode: "半日游" }) ?? playDestinations[0];
    resetPlayStorage();
    setFilters([]);
    setMode("半日游");
    setFavorites([]);
    setVisitedRecords([]);
    setSelectedId(nextDestination.id);
    saveDaily(nextDestination, dateKey, [], "半日游");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <main className="jl-tool-theme min-h-screen text-[#10231A]">
      <div className="jl-tool-shell mx-auto min-h-screen max-w-[430px] px-4 pb-32 pt-5">
        <header className="flex items-center justify-between gap-3">
          <Link aria-label={text.backAria} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-emerald-100 bg-white/90 px-4 text-sm font-black text-emerald-800 shadow-sm transition active:scale-[0.98]" href="/">
            <ArrowLeft className="h-4 w-4" />
            {text.back}
          </Link>
          <span className="inline-flex items-center gap-1 rounded-full bg-white/85 px-4 py-2 text-xs font-black text-emerald-700 shadow-sm backdrop-blur-xl">
            Play
            <Sparkles className="h-3.5 w-3.5" />
          </span>
        </header>

        <section className="mt-5 rounded-[34px] border border-emerald-100 bg-white/92 p-5 shadow-[0_18px_45px_rgba(22,101,52,0.10)]">
          <div className="flex items-start gap-3">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-3xl bg-emerald-600 p-3 text-white shadow-sm">
              <MapPinned className="h-7 w-7" />
            </span>
            <div>
              <p className="text-xs font-black text-emerald-700">Japan Life Tool</p>
              <h1 className="mt-1 text-3xl font-black tracking-tight">{text.title}</h1>
              <p className="mt-2 text-sm font-bold leading-6 text-[#64748B]">{text.subtitle}</p>
            </div>
          </div>
        </section>

        <CollapsiblePanel
          className="mt-4"
          eyebrow="Plan"
          summary={filters.length > 0 ? `${text.current}: ${labelMode(mode, language)} / ${filters.slice(0, 2).map((item) => labelTag(item, language)).join(" / ")}${filters.length > 2 ? "..." : ""}` : `${text.current}: ${labelMode(mode, language)}`}
          title={text.planTitle}
        >
          <div className="mt-3 grid gap-4">
            <div>
              <p className="mb-2 text-xs font-black text-[#475569]">{text.modeLabel}</p>
              <div className="grid grid-cols-2 gap-2">
                {playModes.map((item) => {
                  const active = mode === item;
                  return (
                    <button
                      aria-pressed={active}
                      className={`min-h-11 rounded-2xl px-3 text-xs font-black transition focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 active:scale-[0.98] ${
                        active ? "bg-emerald-700 text-white shadow-sm" : "border border-emerald-100 bg-white text-emerald-800"
                      }`}
                      key={item}
                      onClick={() => changeMode(item)}
                      type="button"
                    >
                      {labelMode(item, language)}
                    </button>
                  );
                })}
              </div>
            </div>

            {filterGroups.map((group, groupIndex) => (
              <div key={group.title}>
                <p className="mb-2 text-xs font-black text-[#475569]">{groupIndex === 0 ? text.groups.companion : text.groups.type}</p>
                <div className="flex flex-wrap gap-2">
                  {group.options.map((option) => {
                    const active = filters.includes(option);
                    return (
                      <button
                        aria-pressed={active}
                        className={`min-h-10 rounded-full px-3 text-xs font-black transition focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 active:scale-[0.98] ${
                          active ? "bg-emerald-700 text-white shadow-sm" : "border border-emerald-100 bg-white text-[#475569]"
                        }`}
                        key={option}
                        onClick={() => toggleFilter(option)}
                        type="button"
                      >
                        {labelTag(option, language)}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </CollapsiblePanel>

        {selected ? (
          <>
            <section className="mt-4 rounded-[30px] border border-emerald-100 bg-white/95 shadow-[0_18px_45px_rgba(22,101,52,0.12)]">
              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-black text-emerald-700">{text.todayPlan}</p>
                    <h2 className="mt-1 break-words text-2xl font-black tracking-tight text-[#10231A]">
                      {selected.name}・{labelMode(mode, language)}
                    </h2>
                    <p className="mt-1 break-words text-xs font-bold text-[#64748B]">{selected.japaneseName} / {selected.englishName}</p>
                  </div>
                  <button
                    className="inline-flex min-h-10 shrink-0 items-center justify-center gap-1.5 rounded-2xl bg-emerald-700 px-3 text-xs font-black text-white shadow-sm transition active:scale-[0.98]"
                    onClick={shuffleDestination}
                    type="button"
                  >
                    <RefreshCw className="h-4 w-4" />
                    {text.shuffle}
                  </button>
                </div>
                <div className="mt-3 grid gap-2 rounded-2xl bg-emerald-50 px-3 py-3">
                  <p className="text-xs font-bold leading-5 text-[#64748B]">{text.duration}: {selected.duration}</p>
                  <p className="text-xs font-bold leading-5 text-[#64748B]">{text.budget}: {selected.budget} ({text.reference})</p>
                  <p className="text-xs font-bold leading-5 text-[#64748B]">{text.bestFor}: {selected.bestFor.map((item) => labelTag(item, language)).join(" / ")}</p>
                  <p className="text-sm font-bold leading-6 text-emerald-900">{text.reason}: {selected.reason}</p>
                </div>
              </div>
            </section>

          </>
        ) : (
          <section className="mt-4 rounded-[26px] border border-emerald-100 bg-white/92 p-4 shadow-[0_12px_30px_rgba(22,101,52,0.08)]">
            <p className="text-sm font-black leading-6 text-emerald-800">{text.empty}</p>
          </section>
        )}

        {selected ? (
          <section className="mt-3 overflow-hidden rounded-[26px] border border-emerald-100 bg-white/92 p-4 shadow-[0_12px_30px_rgba(22,101,52,0.08)]">
            <p className="text-xs font-black text-emerald-700">Actions</p>
            <h2 className="mt-1 text-lg font-black text-[#10231A]">{text.actions}</h2>
            <div className="mt-3 grid grid-cols-3 gap-2">
              <button
                aria-pressed={favoriteIds.includes(selected.id)}
                className={`inline-flex min-h-11 items-center justify-center gap-1.5 rounded-2xl px-2 text-xs font-black shadow-sm transition active:scale-[0.98] ${
                  favoriteIds.includes(selected.id) ? "bg-rose-50 text-rose-700" : "border border-emerald-100 bg-white text-emerald-800"
                }`}
                onClick={() => toggleFavorite(selected.id)}
                type="button"
              >
                <Heart className={`h-4 w-4 ${favoriteIds.includes(selected.id) ? "fill-current" : ""}`} />
                {favoriteIds.includes(selected.id) ? text.favorited : text.favorite}
              </button>
              <button
                aria-pressed={visitedIds.includes(selected.id)}
                className={`inline-flex min-h-11 items-center justify-center gap-1.5 rounded-2xl px-2 text-xs font-black shadow-sm transition active:scale-[0.98] ${
                  visitedIds.includes(selected.id) ? "bg-lime-100 text-lime-800" : "border border-lime-100 bg-lime-50 text-lime-800"
                }`}
                onClick={() => toggleVisited(selected.id)}
                type="button"
              >
                <CheckCircle2 className="h-4 w-4" />
                {visitedIds.includes(selected.id) ? text.visitedDone : text.visited}
              </button>
              <a className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-2xl border border-emerald-100 bg-white px-2 text-xs font-black text-emerald-800 shadow-sm transition active:scale-[0.98]" href={`https://www.google.com/maps/search/?api=1&query=${selected.latitude},${selected.longitude}`} rel="noopener noreferrer" target="_blank">
                <MapPinned className="h-4 w-4" />
                {text.openMap}
              </a>
            </div>
          </section>
        ) : null}

        {selected ? (
          <>
            <div className="mt-4">
              <PlayPlanSteps steps={selected.planSteps} title={text.routeTitle} />
            </div>

            <section className="mt-4 grid gap-3">
              <div className="rounded-[24px] border border-emerald-100 bg-white/92 p-4 shadow-[0_12px_30px_rgba(22,101,52,0.08)]">
                <p className="flex items-center gap-2 text-xs font-black text-emerald-700">
                  <Clock3 className="h-4 w-4" />
                  {text.budgetDuration}
                </p>
                <p className="mt-2 text-sm font-black text-[#10231A]">{selected.duration}</p>
                <p className="mt-1 text-xs font-bold text-[#64748B]">{selected.budget} ({text.budgetReference})</p>
                <ul className="mt-3 grid gap-2 text-xs font-bold leading-5 text-[#475569]">
                  {selected.budgetBreakdown.map((item) => (
                    <li className="rounded-2xl bg-emerald-50 px-3 py-2" key={item}>
                      {item}
                    </li>
                  ))}
                </ul>
                <p className="mt-3 rounded-2xl bg-slate-50 px-3 py-2 text-xs font-bold leading-5 text-[#64748B]">{selected.transportNote}</p>
              </div>
              <div className="rounded-[24px] border border-emerald-100 bg-white/92 p-4 shadow-[0_12px_30px_rgba(22,101,52,0.08)]">
                <p className="flex items-center gap-2 text-xs font-black text-emerald-700">
                  <UsersRound className="h-4 w-4" />
                  {text.audience}
                </p>
                <p className="mt-2 text-sm font-black text-[#10231A]">{selected.bestFor.map((item) => labelTag(item, language)).join("・")}</p>
                <p className="mt-1 text-xs font-bold text-[#64748B]">{selected.difficulty}</p>
              </div>
            </section>

            <section className="mt-4 rounded-[26px] border border-emerald-100 bg-white/92 p-4 shadow-[0_12px_30px_rgba(22,101,52,0.08)]">
              <p className="text-xs font-black text-emerald-700">Map</p>
              <h2 className="mt-1 text-lg font-black text-[#10231A]">{text.mapTitle}</h2>
              <p className="mt-1 text-xs font-bold leading-5 text-[#64748B]">{text.mapNote}</p>
              <div className="mt-3">
                <PlayMiniMap destination={selected} />
              </div>
            </section>

          </>
        ) : null}

        <section className="mt-4 rounded-[26px] border border-emerald-100 bg-white/90 p-4 shadow-[0_12px_30px_rgba(22,101,52,0.08)]">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
              <Heart className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs font-black text-emerald-700">Favorites</p>
              <h2 className="text-lg font-black text-[#10231A]">{text.favoritesTitle}</h2>
            </div>
          </div>
          {favoriteDestinations.length === 0 ? (
            <p className="mt-3 rounded-2xl bg-emerald-50 px-3 py-3 text-sm font-bold leading-6 text-emerald-800">{text.favoritesEmpty}</p>
          ) : (
            <div className="mt-3 grid gap-2">
              {favoriteDestinations.map((destination) => (
                <button
                  className="flex min-h-12 items-center justify-between gap-3 rounded-2xl border border-emerald-100 bg-white px-3 py-2 text-left shadow-sm transition focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 active:scale-[0.98]"
                  key={destination.id}
                  onClick={() => setSelectedAndSave(destination)}
                  type="button"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-black text-[#10231A]">{destination.name}</span>
                    <span className="mt-0.5 block truncate text-xs font-bold text-[#64748B]">{destination.area}</span>
                  </span>
                  <span className="shrink-0 text-xs font-black text-emerald-700">{text.view}</span>
                </button>
              ))}
            </div>
          )}
        </section>

        <section className="mt-4 rounded-[26px] border border-emerald-100 bg-white/90 p-4 shadow-[0_12px_30px_rgba(22,101,52,0.08)]">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
              <CalendarDays className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs font-black text-emerald-700">Visited</p>
              <h2 className="mt-1 text-lg font-black text-[#10231A]">{text.visitedTitle}</h2>
              <p className="mt-1 text-xs font-bold leading-5 text-[#64748B]">
                {visitedRecords.length === 0 ? text.visitedEmpty : text.visitedCount(visitedRecords.length)}
              </p>
              {visitedDestinations.length > 0 ? (
                <div className="mt-3 grid gap-2">
                  {visitedDestinations.slice(0, 5).map((destination) => (
                    <button
                      className="flex min-h-12 items-center justify-between gap-3 rounded-2xl border border-emerald-100 bg-white px-3 py-2 text-left shadow-sm transition focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 active:scale-[0.98]"
                      key={destination.id}
                      onClick={() => setSelectedAndSave(destination)}
                      type="button"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-black text-[#10231A]">{destination.name}</span>
                        <span className="mt-0.5 block truncate text-xs font-bold text-[#64748B]">{destination.area}</span>
                      </span>
                      <span className="shrink-0 text-xs font-black text-emerald-700">{text.view}</span>
                    </button>
                  ))}
                </div>
              ) : null}
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
              <p className="mt-1 text-xs font-bold leading-5 text-[#64748B]">{text.localDesc}</p>
              <button className="mt-3 inline-flex min-h-11 w-full items-center justify-center rounded-2xl border border-emerald-100 bg-white px-4 text-xs font-black text-emerald-800 shadow-sm transition active:scale-[0.98]" onClick={resetPlayData} type="button">
                {text.reset}
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
