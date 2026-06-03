"use client";

import { AlertTriangle, Ban, CalendarDays, CheckCircle2, CloudRain, CloudSun, Clock3, Footprints, Heart, Loader2, Map, Share2, Sparkles, WalletCards } from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";
import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { CollapsiblePanel } from "@/components/CollapsiblePanel";
import { WalkCard } from "@/components/walk/WalkCard";
import { WalkCollections } from "@/components/walk/WalkCollections";
import { WalkFeedback } from "@/components/walk/WalkFeedback";
import { WalkHistory } from "@/components/walk/WalkHistory";
import { WalkRecordForm } from "@/components/walk/WalkRecordForm";
import { WalkReasonList } from "@/components/walk/WalkReasonList";
import { WalkRouteTimeline } from "@/components/walk/WalkRouteTimeline";
import { WalkSearch } from "@/components/walk/WalkSearch";
import { WalkStats } from "@/components/walk/WalkStats";
import { WalkTags } from "@/components/walk/WalkTags";
import { WalkTaskBox } from "@/components/walk/WalkTaskBox";
import { useLanguage } from "@/hooks/useLanguage";
import { useUserSettings } from "@/hooks/useUserSettings";
import { useWalkWeather } from "@/hooks/useWalkWeather";
import { getDailyWalkPick, getTokyoDateKey, readSkippedSpotIdsByDate, shuffleDailyWalkPick, skipDailyWalkSpot, writeDailyWalkPick, type DailyWalkPick } from "@/lib/walk/dailyPick";
import { getWalkCollectionPool, getWalkCollectionTag, walkCollections, type WalkCollection } from "@/lib/walk/collections";
import { addTodayWalkFeedback, readTodayWalkFeedback, type WalkFeedbackId } from "@/lib/walk/feedback";
import { generateWalkReasonList, generateWalkRecommendationCopy } from "@/lib/walk/generateWalkCopy";
import { getWalkContext, type WalkContext } from "@/lib/walk/recommendationLogic";
import { walkSpots, walkTags, type WalkTag } from "@/lib/walk/spots";
import { createWalkRecord, markWalkSpotVisited, readWalkCompletion, readWalkFavoriteIds, readWalkRecords, readWalkVisitedMap, resetWalkLocalStorage, walkMoodOptions, writeWalkCompletion, writeWalkFavoriteIds, writeWalkRecords, type WalkCompletion, type WalkMoodId, type WalkRecord, type WalkVisitMap } from "@/lib/walk/storage";
import { buildWalkWeatherRecommendation, type WalkWeatherSnapshot } from "@/lib/walk/weatherRecommendation";
import type { Language } from "@/lib/i18n/translations";

const WalkMiniMap = dynamic(() => import("@/components/walk/WalkMiniMap"), {
  ssr: false,
});

const walkPageCopy = {
  "zh-CN": {
    relaxedMood: "🌿 放松",
    loadError: "随机散步数据暂时读取失败，请刷新后再试。",
    shareTitle: "Japan Life 随机散步",
    shareText: (station: string, task: string) => `今天 Japan Life 推荐我去「${station}」散步。\n任务：${task}\n#JapanLife #东京散步`,
    resetConfirm: "确定要重置随机散步数据吗？收藏、去过、反馈和散步记录都会清除，但不会影响其他 Japan Life 数据。",
    resetDone: "随机散步本地数据已重置。",
    loading: "正在准备今天的散步推荐...",
    reload: "重新加载",
    backAria: "返回 Japan Life 首页",
    back: "← 返回 Japan Life",
    badge: "随机散步",
    title: "今天去哪散步？",
    subtitle: "让我们带你去一个平时不会去的地方",
    completedTitle: "今天的散步完成了。明天再去一个新的地方吧。",
    completedDate: "完成日期：",
    place: "地点：",
    mood: "心情：",
    note: "备注：",
    todayAdvice: "今日散步建议",
    weatherLoading: "天气读取中",
    weatherError: "天气暂时取得失败，先随机推荐一个适合散步的地方。",
    mapPreview: "地图预览",
    mapNote: "地图仅供参考，实际路线请使用常用地图 APP 确认。",
    details: "散步详情",
    recommendationReason: "推荐理由",
    bestTime: "推荐时间",
    duration: "推荐时长",
    budget: "预算参考",
    difficulty: "路线难度",
    steps: "预计步数",
    suitableFor: "适合谁",
    adjust: "筛选和调整",
    collectionPrefix: "专题",
    defaultRandom: "默认随机",
    moodPrefix: "心情",
    searchResults: "搜索结果",
    resultUnit: "个",
    searchEmpty: "今天没有找到合适的地方，换个心情试试吧。",
    openSpot: (station: string) => `打开${station}散步推荐`,
    resultAlt: (station: string) => `${station} 搜索结果`,
    myWalk: "我的散步数据",
    myWalkSummary: (favorites: number, records: number) => `${favorites} 个收藏 / ${records} 条记录`,
    favorites: "我的收藏",
    skippedToday: (count: number) => `今天已跳过 ${count} 个地点，不会再推荐它们。`,
    noFavorites: "还没有收藏的散步地点",
    favoriteHint: "看到喜欢的地方，点图片卡片右上角的心形就能留下来。",
    favoriteAlt: (station: string) => `${station} 收藏`,
    openFavorite: (station: string) => `打开收藏地点${station}`,
    actions: "收藏 / 去过 / 不想去",
    visitedCount: (count: number) => `这个地方已经去过 ${count} 次。`,
    notVisited: "还没记录去过这个地方。",
    removeFavorite: (station: string) => `取消收藏${station}`,
    addFavorite: (station: string) => `收藏${station}`,
    favoriteButtonOn: "已收藏，点击取消",
    favoriteButtonOff: "收藏这个地方",
    markVisited: (station: string) => `标记${station}为我去过了`,
    visitedButton: "我去过了",
    skipToday: (station: string) => `今天不想去${station}`,
    skipButton: "今天不想去",
    share: (station: string) => `分享今天去${station}散步`,
    shareButton: "分享今天的散步",
    shared: "已打开系统分享。",
    copied: "分享文字已复制，可以直接粘贴给朋友。",
    shareFailed: "分享失败，请稍后再试。",
    localTitle: "本地保存说明",
    localDesc: "收藏、去过、反馈和散步记录会保存在本机浏览器中。清除浏览器数据或更换设备后，这些记录可能会消失。",
    resetAria: "重置随机散步本地数据",
    resetButton: "重置散步数据",
  },
  "zh-TW": {
    relaxedMood: "🌿 放鬆",
    loadError: "隨機散步資料暫時讀取失敗，請刷新後再試。",
    shareTitle: "Japan Life 隨機散步",
    shareText: (station: string, task: string) => `今天 Japan Life 推薦我去「${station}」散步。\n任務：${task}\n#JapanLife #東京散步`,
    resetConfirm: "確定要重置隨機散步資料嗎？收藏、去過、回饋和散步紀錄都會清除，但不會影響其他 Japan Life 資料。",
    resetDone: "隨機散步本地資料已重置。",
    loading: "正在準備今天的散步推薦...",
    reload: "重新載入",
    backAria: "返回 Japan Life 首頁",
    back: "← 返回 Japan Life",
    badge: "隨機散步",
    title: "今天去哪散步？",
    subtitle: "讓我們帶你去一個平常不會去的地方",
    completedTitle: "今天的散步完成了。明天再去一個新的地方吧。",
    completedDate: "完成日期：",
    place: "地點：",
    mood: "心情：",
    note: "備註：",
    todayAdvice: "今日散步建議",
    weatherLoading: "天氣讀取中",
    weatherError: "天氣暫時取得失敗，先隨機推薦一個適合散步的地方。",
    mapPreview: "地圖預覽",
    mapNote: "地圖僅供參考，實際路線請使用常用地圖 APP 確認。",
    details: "散步詳情",
    recommendationReason: "推薦理由",
    bestTime: "推薦時間",
    duration: "推薦時長",
    budget: "預算參考",
    difficulty: "路線難度",
    steps: "預計步數",
    suitableFor: "適合誰",
    adjust: "篩選和調整",
    collectionPrefix: "專題",
    defaultRandom: "預設隨機",
    moodPrefix: "心情",
    searchResults: "搜尋結果",
    resultUnit: "個",
    searchEmpty: "今天沒有找到合適的地方，換個心情試試吧。",
    openSpot: (station: string) => `打開${station}散步推薦`,
    resultAlt: (station: string) => `${station} 搜尋結果`,
    myWalk: "我的散步資料",
    myWalkSummary: (favorites: number, records: number) => `${favorites} 個收藏 / ${records} 筆紀錄`,
    favorites: "我的收藏",
    skippedToday: (count: number) => `今天已跳過 ${count} 個地點，不會再推薦它們。`,
    noFavorites: "還沒有收藏的散步地點",
    favoriteHint: "看到喜歡的地方，點圖片卡片右上角的心形就能留下來。",
    favoriteAlt: (station: string) => `${station} 收藏`,
    openFavorite: (station: string) => `打開收藏地點${station}`,
    actions: "收藏 / 去過 / 不想去",
    visitedCount: (count: number) => `這個地方已經去過 ${count} 次。`,
    notVisited: "還沒記錄去過這個地方。",
    removeFavorite: (station: string) => `取消收藏${station}`,
    addFavorite: (station: string) => `收藏${station}`,
    favoriteButtonOn: "已收藏，點擊取消",
    favoriteButtonOff: "收藏這個地方",
    markVisited: (station: string) => `標記${station}為我去過了`,
    visitedButton: "我去過了",
    skipToday: (station: string) => `今天不想去${station}`,
    skipButton: "今天不想去",
    share: (station: string) => `分享今天去${station}散步`,
    shareButton: "分享今天的散步",
    shared: "已打開系統分享。",
    copied: "分享文字已複製，可以直接貼給朋友。",
    shareFailed: "分享失敗，請稍後再試。",
    localTitle: "本地保存說明",
    localDesc: "收藏、去過、回饋和散步紀錄會保存在本機瀏覽器中。清除瀏覽器資料或更換設備後，這些紀錄可能會消失。",
    resetAria: "重置隨機散步本地資料",
    resetButton: "重置散步資料",
  },
  ja: {
    relaxedMood: "🌿 リラックス",
    loadError: "ランダム散歩データを一時的に読み込めません。更新して再試行してください。",
    shareTitle: "Japan Life ランダム散歩",
    shareText: (station: string, task: string) => `今日 Japan Life は「${station}」への散歩をおすすめしました。\nミッション：${task}\n#JapanLife #東京散歩`,
    resetConfirm: "ランダム散歩データをリセットしますか？保存、行った記録、フィードバック、散歩記録は削除されます。他の Japan Life データには影響しません。",
    resetDone: "ランダム散歩のローカルデータをリセットしました。",
    loading: "今日の散歩おすすめを準備中...",
    reload: "再読み込み",
    backAria: "Japan Life ホームへ戻る",
    back: "← Japan Life に戻る",
    badge: "ランダム散歩",
    title: "今日はどこを散歩する？",
    subtitle: "普段は行かない場所へ案内します",
    completedTitle: "今日の散歩は完了です。明日はまた新しい場所へ。",
    completedDate: "完了日：",
    place: "場所：",
    mood: "気分：",
    note: "メモ：",
    todayAdvice: "今日の散歩アドバイス",
    weatherLoading: "天気を読み込み中",
    weatherError: "天気を取得できません。まずは散歩に向いた場所をランダムにおすすめします。",
    mapPreview: "地図プレビュー",
    mapNote: "地図は参考です。実際のルートは普段使う地図アプリで確認してください。",
    details: "散歩詳細",
    recommendationReason: "おすすめ理由",
    bestTime: "おすすめ時間",
    duration: "所要時間",
    budget: "予算目安",
    difficulty: "ルート難度",
    steps: "想定歩数",
    suitableFor: "おすすめ対象",
    adjust: "絞り込みと調整",
    collectionPrefix: "テーマ",
    defaultRandom: "通常ランダム",
    moodPrefix: "気分",
    searchResults: "検索結果",
    resultUnit: "件",
    searchEmpty: "条件に合う場所が見つかりません。気分を変えて試してください。",
    openSpot: (station: string) => `${station}の散歩おすすめを開く`,
    resultAlt: (station: string) => `${station} 検索結果`,
    myWalk: "自分の散歩データ",
    myWalkSummary: (favorites: number, records: number) => `保存 ${favorites} 件 / 記録 ${records} 件`,
    favorites: "保存した場所",
    skippedToday: (count: number) => `今日は ${count} 件をスキップ済み。再おすすめしません。`,
    noFavorites: "保存した散歩スポットはまだありません",
    favoriteHint: "気に入った場所は画像カード右上のハートで保存できます。",
    favoriteAlt: (station: string) => `${station} 保存`,
    openFavorite: (station: string) => `保存した${station}を開く`,
    actions: "保存 / 行った / 避ける",
    visitedCount: (count: number) => `この場所は ${count} 回行きました。`,
    notVisited: "この場所へ行った記録はまだありません。",
    removeFavorite: (station: string) => `${station}の保存を解除`,
    addFavorite: (station: string) => `${station}を保存`,
    favoriteButtonOn: "保存済み、押すと解除",
    favoriteButtonOff: "この場所を保存",
    markVisited: (station: string) => `${station}を行った場所にする`,
    visitedButton: "行った",
    skipToday: (station: string) => `今日は${station}へ行かない`,
    skipButton: "今日は行かない",
    share: (station: string) => `今日の${station}散歩を共有`,
    shareButton: "今日の散歩を共有",
    shared: "共有を開きました。",
    copied: "共有テキストをコピーしました。",
    shareFailed: "共有に失敗しました。後でもう一度試してください。",
    localTitle: "ローカル保存について",
    localDesc: "保存、行った記録、フィードバック、散歩記録はこのブラウザに保存されます。ブラウザデータの削除や端末変更で消える場合があります。",
    resetAria: "ランダム散歩のローカルデータをリセット",
    resetButton: "散歩データをリセット",
  },
} as const;

function getMoodLabel(mood: WalkMoodId) {
  const option = walkMoodOptions.find((item) => item.id === mood);
  return option ? `${option.emoji} ${option.label}` : "🌿 放松";
}

function formatCompletionDate(value: string, language: Language) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const locale = language === "ja" ? "ja-JP" : language === "zh-TW" ? "zh-TW" : "zh-CN";
  return date.toLocaleDateString(locale, { day: "2-digit", month: "2-digit", year: "numeric" });
}

export default function WalkClientPage() {
  const { language } = useLanguage();
  const text = walkPageCopy[language];
  const { settings } = useUserSettings();
  const [activeTag, setActiveTag] = useState<WalkTag | "全部">("全部");
  const [activeCollection, setActiveCollection] = useState<WalkCollection | null>(null);
  const [context, setContext] = useState<WalkContext>(() => getWalkContext(new Date("2026-05-21T15:00:00+09:00")));
  const [completion, setCompletion] = useState<WalkCompletion | null>(null);
  const [dailyPick, setDailyPick] = useState<DailyWalkPick | null>(null);
  const [spot, setSpot] = useState(walkSpots[0]);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [feedbackIds, setFeedbackIds] = useState<WalkFeedbackId[]>([]);
  const [loadError, setLoadError] = useState("");
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [shareStatus, setShareStatus] = useState<"copied" | "failed" | "idle" | "shared">("idle");
  const [skippedTodayIds, setSkippedTodayIds] = useState<string[]>([]);
  const [taskIndex, setTaskIndex] = useState(0);
  const [weatherApplied, setWeatherApplied] = useState(false);
  const [resetStatus, setResetStatus] = useState("");
  const [visitedMap, setVisitedMap] = useState<WalkVisitMap>({});
  const [walkRecords, setWalkRecords] = useState<WalkRecord[]>([]);
  const { error: weatherError, loading: weatherLoading, snapshot: walkWeather } = useWalkWeather({ language, settings });

  useEffect(() => {
    try {
      const nextContext = getWalkContext();
      const today = getTokyoDateKey();
      const { pick, spot: pickedSpot } = getDailyWalkPick({ context: nextContext, date: today, selectedTag: "全部" });
      const savedCompletion = readWalkCompletion();
      setContext(nextContext);
      setDailyPick(pick);
      setSpot(pickedSpot);
      setTaskIndex(0);
      setFavoriteIds(readWalkFavoriteIds());
      setFeedbackIds(readTodayWalkFeedback(today));
      setSkippedTodayIds(readSkippedSpotIdsByDate()[today] ?? []);
      setVisitedMap(readWalkVisitedMap());
      setWalkRecords(readWalkRecords());
      setCompletion(savedCompletion?.date === today ? savedCompletion : null);
      setLoadError("");
    } catch {
      setLoadError(text.loadError);
    } finally {
      setLoading(false);
    }
  }, [text.loadError]);

  useEffect(() => {
    if (loading || weatherLoading || weatherApplied) return;
    const today = getTokyoDateKey();
    const nextContext = {
      ...context,
      weatherLabel: walkWeather.description,
      weatherMessage: walkWeather.recommendation,
      weatherMode: walkWeather.mode,
    };
    const todayFeedbackIds = readTodayWalkFeedback(today);
    const { pick, spot: nextSpot } = shuffleDailyWalkPick({
      context: nextContext,
      currentSpotId: spot.id,
      date: today,
      feedbackIds: todayFeedbackIds,
      selectedTag: activeTag,
      weatherSnapshot: walkWeather,
    });
    setContext(nextContext);
    setDailyPick(pick);
    setSpot(nextSpot);
    setFeedbackIds(todayFeedbackIds);
    setTaskIndex(0);
    setSkippedTodayIds(readSkippedSpotIdsByDate()[today] ?? []);
    setWeatherApplied(true);
  }, [activeTag, context, loading, spot.id, walkWeather, weatherApplied, weatherLoading]);

  const favoriteSpots = useMemo(() => {
    const favoriteSet = new Set(favoriteIds);
    return walkSpots.filter((item) => favoriteSet.has(item.id));
  }, [favoriteIds]);

  const isFavorite = favoriteIds.includes(spot.id);
  const currentTask = dailyPick?.spotId === spot.id ? dailyPick.task : spot.tasks[taskIndex % spot.tasks.length] ?? spot.walkTask;
  const visitCount = visitedMap[spot.id]?.count ?? 0;
  const walkCopyInput = useMemo(
    () => ({
      activeTag,
      context,
      feedbackIds,
      isFavorite,
      spot,
      visitCount,
      weather: walkWeather,
    }),
    [activeTag, context, feedbackIds, isFavorite, spot, visitCount, walkWeather],
  );
  const dailyWalkCopy = useMemo(() => generateWalkRecommendationCopy(walkCopyInput), [walkCopyInput]);
  const walkReasons = useMemo(() => generateWalkReasonList(walkCopyInput), [walkCopyInput]);
  const activeCollectionPool = useMemo(() => getWalkCollectionPool(activeCollection), [activeCollection]);
  const searchResults = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return [];
    return walkSpots.filter((item) => {
      const haystack = `${item.station} ${item.englishName} ${item.area} ${item.title} ${item.subtitle} ${item.moodTags.join(" ")} ${item.weatherTags.join(" ")}`.toLowerCase();
      return haystack.includes(keyword);
    });
  }, [query]);

  const saveFavoriteIds = (nextIds: string[]) => {
    setFavoriteIds(nextIds);
    writeWalkFavoriteIds(nextIds);
  };

  const toggleFavorite = () => {
    const nextIds = isFavorite ? favoriteIds.filter((id) => id !== spot.id) : [spot.id, ...favoriteIds.filter((id) => id !== spot.id)];
    saveFavoriteIds(nextIds);
  };

  const openFavoriteSpot = (id: string) => {
    const nextSpot = walkSpots.find((item) => item.id === id);
    if (nextSpot) setSpot(nextSpot);
    setDailyPick(null);
    setTaskIndex(0);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const shuffleSpot = useCallback(() => {
    const today = getTokyoDateKey();
    const { pick, spot: nextSpot } = shuffleDailyWalkPick({ context, currentSpotId: spot.id, date: today, feedbackIds, poolOverride: activeCollection ? activeCollectionPool : undefined, selectedTag: activeTag, weatherSnapshot: walkWeather });
    setDailyPick(pick);
    setSpot(nextSpot);
    setTaskIndex(0);
  }, [activeCollection, activeCollectionPool, activeTag, context, feedbackIds, spot.id, walkWeather]);

  const changeTag = (tag: WalkTag | "全部") => {
    setActiveCollection(null);
    setActiveTag(tag);
    const today = getTokyoDateKey();
    const { pick, spot: nextSpot } = shuffleDailyWalkPick({ context, currentSpotId: spot.id, date: today, feedbackIds, selectedTag: tag, weatherSnapshot: walkWeather });
    setDailyPick(pick);
    setSpot(nextSpot);
    setTaskIndex(0);
  };

  const changeTask = () => {
    const nextTaskIndex = (taskIndex + 1) % Math.max(spot.tasks.length, 1);
    const nextTask = spot.tasks[nextTaskIndex] ?? spot.walkTask;
    setTaskIndex(nextTaskIndex);
    if (dailyPick?.spotId === spot.id) {
      const nextPick = { ...dailyPick, task: nextTask };
      setDailyPick(nextPick);
      writeDailyWalkPick(nextPick);
    }
  };

  const completeTodayWalk = (mood: WalkMoodId, note: string) => {
    const today = getTokyoDateKey();
    const nextCompletion: WalkCompletion = {
      completedAt: new Date().toISOString(),
      date: today,
      moodLabel: getMoodLabel(mood),
      note: note.trim() || currentTask,
      spotId: spot.id,
      station: spot.station,
    };
    setCompletion(nextCompletion);
    writeWalkCompletion(nextCompletion);
  };

  const markVisited = () => {
    const nextMap = markWalkSpotVisited(spot.id);
    setVisitedMap(nextMap);
    completeTodayWalk("relaxed", currentTask);
  };

  const skipToday = () => {
    const today = getTokyoDateKey();
    const { pick, skippedSpotIds, spot: nextSpot } = skipDailyWalkSpot({ context, date: today, feedbackIds, poolOverride: activeCollection ? activeCollectionPool : undefined, selectedTag: activeTag, spotId: spot.id, weatherSnapshot: walkWeather });
    setDailyPick(pick);
    setSkippedTodayIds(skippedSpotIds);
    setSpot(nextSpot);
    setTaskIndex(0);
  };

  const selectFeedback = (feedbackId: WalkFeedbackId) => {
    const today = getTokyoDateKey();
    const nextFeedbackIds = addTodayWalkFeedback(feedbackId, today);
    const { pick, spot: nextSpot } = shuffleDailyWalkPick({
      context,
      currentSpotId: spot.id,
      date: today,
      feedbackIds: nextFeedbackIds,
      poolOverride: activeCollection ? activeCollectionPool : undefined,
      selectedTag: activeTag,
      weatherSnapshot: walkWeather,
    });
    setFeedbackIds(nextFeedbackIds);
    setDailyPick(pick);
    setSpot(nextSpot);
    setTaskIndex(0);
  };

  const selectCollection = (collection: WalkCollection) => {
    const tag = getWalkCollectionTag(collection);
    const pool = getWalkCollectionPool(collection);
    const today = getTokyoDateKey();
    const { pick, spot: nextSpot } = shuffleDailyWalkPick({
      context,
      currentSpotId: spot.id,
      date: today,
      feedbackIds,
      poolOverride: pool,
      selectedTag: tag,
      weatherSnapshot: walkWeather,
    });
    setActiveCollection(collection);
    setActiveTag(tag);
    setDailyPick(pick);
    setSpot(nextSpot);
    setTaskIndex(0);
  };

  const clearCollection = () => {
    setActiveCollection(null);
  };

  const saveWalkRecord = ({ mood, note }: { mood: WalkMoodId; note: string }) => {
    const nextRecord = createWalkRecord({ mood, note, spot: { ...spot, walkTask: currentTask }, weather: context.weatherLabel });
    const nextRecords = [nextRecord, ...walkRecords].slice(0, 20);
    setWalkRecords(nextRecords);
    writeWalkRecords(nextRecords);
    completeTodayWalk(mood, note);
  };

  const copyShareText = async (text: string) => {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "true");
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    const copied = document.execCommand("copy");
    document.body.removeChild(textarea);
    if (copied) return;
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return;
    }
    throw new Error("Clipboard is not available.");
  };

  const shareTodayWalk = async () => {
    const shareText = text.shareText(spot.station, currentTask);
    try {
      if (navigator.share) {
        await navigator.share({
          text: shareText,
          title: text.shareTitle,
          url: `${window.location.origin}/walk`,
        });
        setShareStatus("shared");
      } else {
        await copyShareText(shareText);
        setShareStatus("copied");
      }
    } catch {
      try {
        await copyShareText(shareText);
        setShareStatus("copied");
      } catch {
        setShareStatus("failed");
      }
    }
    window.setTimeout(() => setShareStatus("idle"), 2400);
  };

  const resetWalkData = () => {
    const confirmed = window.confirm(text.resetConfirm);
    if (!confirmed) return;
    resetWalkLocalStorage();
    const nextContext = getWalkContext();
    const today = getTokyoDateKey();
    const { pick, spot: nextSpot } = getDailyWalkPick({ context: nextContext, date: today, selectedTag: "全部" });
    setActiveCollection(null);
    setActiveTag("全部");
    setCompletion(null);
    setContext(nextContext);
    setDailyPick(pick);
    setFavoriteIds([]);
    setFeedbackIds([]);
    setQuery("");
    setSkippedTodayIds([]);
    setSpot(nextSpot);
    setTaskIndex(0);
    setVisitedMap({});
    setWalkRecords([]);
    setResetStatus(text.resetDone);
    window.setTimeout(() => setResetStatus(""), 2400);
  };

  if (loading) {
    return (
      <WalkPageShell>
        <div className="flex min-h-[70vh] flex-col items-center justify-center text-center">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-700" />
          <p className="mt-3 text-sm font-black text-[#10231A]">{text.loading}</p>
        </div>
      </WalkPageShell>
    );
  }

  if (loadError) {
    return (
      <WalkPageShell>
        <div className="flex min-h-[70vh] flex-col items-center justify-center text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-3xl bg-amber-100 text-amber-700">
            <AlertTriangle className="h-6 w-6" />
          </span>
          <p className="mt-3 text-sm font-black text-[#10231A]">{loadError}</p>
          <button className="mt-4 h-11 rounded-2xl bg-emerald-700 px-5 text-sm font-black text-white" onClick={() => window.location.reload()} type="button">
            {text.reload}
          </button>
        </div>
      </WalkPageShell>
    );
  }

  return (
    <main className="jl-tool-theme min-h-screen text-[#10231A]">
      <div className="jl-tool-shell mx-auto min-h-screen max-w-[430px] overflow-x-hidden px-4 pb-32 pt-5">
        <header className="flex items-center justify-between gap-3">
          <Link aria-label={text.backAria} className="inline-flex min-h-11 items-center rounded-full border border-emerald-100 bg-white/90 px-4 text-sm font-black text-emerald-800 shadow-sm transition active:scale-[0.98]" href="/">
            {text.back}
          </Link>
          <span className="inline-flex items-center gap-1 rounded-full bg-white/85 px-4 py-2 text-xs font-black text-emerald-700 shadow-sm backdrop-blur-xl">
            {text.badge}
            <Footprints className="h-3.5 w-3.5" />
          </span>
        </header>

        <section className="mt-6 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-3xl bg-emerald-100 text-emerald-700 shadow-sm">
            <Footprints className="h-6 w-6" />
          </div>
          <h1 className="mt-4 text-3xl font-black tracking-tight">{text.title}</h1>
          <p className="mx-auto mt-3 max-w-[280px] text-sm font-bold leading-6 text-[#64748B]">{text.subtitle}</p>
        </section>

        <section className="mt-6">
          <WalkCard spot={spot} onShuffle={shuffleSpot} visitCount={visitCount} />
        </section>

        <section className="mt-4">
          <WalkActionPanel
            isFavorite={isFavorite}
            onShare={shareTodayWalk}
            onSkipToday={skipToday}
            onToggleFavorite={toggleFavorite}
            onVisited={markVisited}
            shareStatus={shareStatus}
            spotName={spot.station}
            visitCount={visitCount}
            text={text}
          />
        </section>

        {completion && (
          <section className="mt-5">
            <WalkCompletionCard completion={completion} language={language} text={text} />
          </section>
        )}

        <section className="mt-5">
          <MapPreviewSection spot={spot} text={text} />
        </section>

        <section className="mt-5">
          <WalkDetailsPanel
            context={context}
            currentTask={currentTask}
            dailyWalkCopy={dailyWalkCopy}
            onChangeTask={changeTask}
            spot={spot}
            walkReasons={walkReasons}
            walkWeather={walkWeather}
            weatherError={weatherError}
            weatherLoading={weatherLoading}
            text={text}
          />
        </section>

        <section className="mt-5">
          <WalkAdjustPanel
            activeCollection={activeCollection}
            activeTag={activeTag}
            collections={walkCollections}
            feedbackIds={feedbackIds}
            onChangeTag={changeTag}
            onClearCollection={clearCollection}
            onSearchChange={setQuery}
            onSelectCollection={selectCollection}
            onSelectFeedback={selectFeedback}
            onShuffle={shuffleSpot}
            onSpotOpen={openFavoriteSpot}
            query={query}
            searchResults={searchResults}
            spot={spot}
            text={text}
          />
        </section>

        <section className="mt-5">
          <WalkPersonalPanel
            favoriteSpots={favoriteSpots}
            favoriteCount={favoriteIds.length}
            onOpenFavorite={openFavoriteSpot}
            onReset={resetWalkData}
            onSaveRecord={saveWalkRecord}
            records={walkRecords}
            resetStatus={resetStatus}
            skippedTodayCount={skippedTodayIds.length}
            spot={spot}
            visitedMap={visitedMap}
            weatherLabel={context.weatherLabel}
            text={text}
          />
        </section>
      </div>
    </main>
  );
}

function WalkPageShell({ children }: { children: ReactNode }) {
  const { language } = useLanguage();
  const text = walkPageCopy[language];

  return (
    <main className="jl-tool-theme min-h-screen text-[#10231A]">
      <div className="jl-tool-shell mx-auto min-h-screen max-w-[430px] overflow-x-hidden px-4 pb-32 pt-5">
        <header className="flex items-center justify-between gap-3">
          <Link aria-label={text.backAria} className="inline-flex min-h-11 items-center rounded-full border border-emerald-100 bg-white/90 px-4 text-sm font-black text-emerald-800 shadow-sm transition active:scale-[0.98]" href="/">
            {text.back}
          </Link>
          <span className="inline-flex items-center gap-1 rounded-full bg-white/85 px-4 py-2 text-xs font-black text-emerald-700 shadow-sm backdrop-blur-xl">
            {text.badge}
            <Footprints className="h-3.5 w-3.5" />
          </span>
        </header>
        {children}
      </div>
    </main>
  );
}

function WalkCompletionCard({ completion, language, text }: { completion: WalkCompletion; language: Language; text: typeof walkPageCopy[Language] }) {
  return (
    <section className="rounded-[26px] border border-emerald-100 bg-white/92 p-4 shadow-[0_12px_30px_rgba(22,101,52,0.08)]">
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-sm">
          <CheckCircle2 className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-black text-emerald-700">Done Today</p>
          <h2 className="mt-1 text-lg font-black text-[#10231A]">{text.completedTitle}</h2>
          <div className="mt-3 grid gap-2 rounded-[22px] border border-emerald-100 bg-emerald-50/70 p-3 text-sm font-bold text-[#475569]">
            <p>
              <span className="font-black text-[#10231A]">{text.completedDate}</span>
              {formatCompletionDate(completion.completedAt, language)}
            </p>
            <p>
              <span className="font-black text-[#10231A]">{text.place}</span>
              {completion.station}
            </p>
            <p>
              <span className="font-black text-[#10231A]">{text.mood}</span>
              {completion.moodLabel}
            </p>
            <p className="leading-6">
              <span className="font-black text-[#10231A]">{text.note}</span>
              {completion.note}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function TodayWalkCopyCard({ copy, text }: { copy: string; text: typeof walkPageCopy[Language] }) {
  return (
    <section className="rounded-[26px] border border-emerald-100 bg-white/92 p-4 shadow-[0_12px_30px_rgba(22,101,52,0.08)]">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-lime-100 text-emerald-700">
          <Sparkles className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-black text-emerald-700">Today Note</p>
          <h2 className="mt-1 text-lg font-black text-[#10231A]">{text.todayAdvice}</h2>
          <p className="mt-2 text-sm font-bold leading-6 text-[#475569]">{copy}</p>
        </div>
      </div>
    </section>
  );
}

function WeatherHintCard({
  error,
  icon: Icon,
  loading,
  snapshot,
  spot,
  text,
}: {
  error: string | null;
  icon: typeof CloudSun;
  loading: boolean;
  snapshot: WalkWeatherSnapshot;
  spot: { station: string };
  text: typeof walkPageCopy[Language];
}) {
  const temperatureLabel = typeof snapshot.temperature === "number" ? `${Math.round(snapshot.temperature)}°C` : "--°C";
  const title = loading ? text.weatherLoading : `${snapshot.locationName} ${temperatureLabel}・${snapshot.description}`;
  const body = error ? text.weatherError : buildWalkWeatherRecommendation(snapshot, spot);

  return (
    <section className="rounded-[24px] border border-emerald-100 bg-white/90 p-4 shadow-[0_10px_24px_rgba(22,101,52,0.07)]">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Icon className="h-5 w-5" />}
        </span>
        <div>
          <p className="text-xs font-black text-emerald-700">{title}</p>
          <p className="mt-1 text-sm font-bold leading-6 text-[#475569]">{body}</p>
        </div>
      </div>
    </section>
  );
}

function ContextCard({ body, icon: Icon, title }: { body: string; icon: typeof Clock3; title: string }) {
  return (
    <section className="rounded-[24px] border border-emerald-100 bg-white/90 p-4 shadow-[0_10px_24px_rgba(22,101,52,0.07)]">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
          <Icon className="h-5 w-5" />
        </span>
        <div>
          <p className="text-xs font-black text-emerald-700">{title}</p>
          <p className="mt-1 text-sm font-bold leading-6 text-[#475569]">{body}</p>
        </div>
      </div>
    </section>
  );
}

function InfoBlock({ body, highlight, icon: Icon, title }: { body: string; highlight?: boolean; icon: typeof Sparkles; title: string }) {
  return (
    <section className={`rounded-[26px] border p-4 shadow-[0_12px_30px_rgba(22,101,52,0.08)] ${highlight ? "border-emerald-100 bg-emerald-50" : "border-slate-200 bg-white/92"}`}>
      <div className="flex items-start gap-3">
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${highlight ? "bg-emerald-600 text-white" : "bg-emerald-100 text-emerald-700"}`}>
          <Icon className="h-5 w-5" />
        </span>
        <div>
          <p className="text-sm font-black text-[#10231A]">{title}</p>
          <p className="mt-2 text-sm font-bold leading-6 text-[#475569]">{body}</p>
        </div>
      </div>
    </section>
  );
}

function MapPreviewSection({ spot, text }: { spot: typeof walkSpots[number]; text: typeof walkPageCopy[Language] }) {
  return (
    <section className="rounded-[26px] border border-emerald-100 bg-white/92 p-4 shadow-[0_12px_30px_rgba(22,101,52,0.08)]">
      <div className="mb-3 flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
          <Map className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-black text-emerald-700">Map Preview</p>
          <h2 className="mt-1 text-lg font-black text-[#10231A]">{text.mapPreview}</h2>
          <p className="mt-1 text-sm font-bold text-[#475569]">{spot.station}・{spot.area}</p>
        </div>
      </div>
      <WalkMiniMap spot={spot} />
      <p className="mt-3 rounded-2xl bg-emerald-50 px-3 py-2 text-xs font-bold leading-5 text-emerald-800">
        {text.mapNote}
      </p>
    </section>
  );
}

function WalkDetailsPanel({
  context,
  currentTask,
  dailyWalkCopy,
  onChangeTask,
  spot,
  walkReasons,
  walkWeather,
  weatherError,
  weatherLoading,
  text,
}: {
  context: WalkContext;
  currentTask: string;
  dailyWalkCopy: string;
  onChangeTask: () => void;
  spot: typeof walkSpots[number];
  walkReasons: string[];
  walkWeather: WalkWeatherSnapshot;
  weatherError: string | null;
  weatherLoading: boolean;
  text: typeof walkPageCopy[Language];
}) {
  return (
    <CollapsiblePanel eyebrow="Details" lazyMount summary={`${spot.duration} / ${spot.budget} / ${spot.difficulty}`} title={text.details}>
      <div className="grid gap-3">
        <TodayWalkCopyCard copy={dailyWalkCopy} text={text} />
        <div className="grid gap-3">
          <ContextCard icon={Clock3} title={context.timeLabel} body={context.timeMessage} />
          <WeatherHintCard error={weatherError} icon={walkWeather.isRainy ? CloudRain : CloudSun} loading={weatherLoading} snapshot={walkWeather} spot={spot} text={text} />
        </div>
        <InfoBlock icon={Sparkles} title={text.recommendationReason} body={spot.reason} />
        <WalkReasonList reasons={walkReasons} />
        <WalkTaskBox task={currentTask} onChangeTask={onChangeTask} />
        <div className="grid grid-cols-2 gap-3">
          <MiniInfo icon={CalendarDays} label={text.bestTime} value={spot.bestTime} />
          <MiniInfo icon={Clock3} label={text.duration} value={spot.duration} />
          <MiniInfo icon={WalletCards} label={text.budget} value={spot.budget} />
          <MiniInfo icon={Footprints} label={text.difficulty} value={spot.difficulty} />
          <MiniInfo icon={Map} label={text.steps} value={spot.stepsEstimate} />
          <MiniInfo icon={Heart} label={text.suitableFor} value={spot.suitableFor.slice(0, 2).join(" / ")} />
        </div>
        <WalkRouteTimeline steps={spot.routeSteps} />
      </div>
    </CollapsiblePanel>
  );
}

function WalkAdjustPanel({
  activeCollection,
  activeTag,
  collections,
  feedbackIds,
  onChangeTag,
  onClearCollection,
  onSearchChange,
  onSelectCollection,
  onSelectFeedback,
  onShuffle,
  onSpotOpen,
  query,
  searchResults,
  spot,
  text,
}: {
  activeCollection: WalkCollection | null;
  activeTag: WalkTag | "全部";
  collections: WalkCollection[];
  feedbackIds: WalkFeedbackId[];
  onChangeTag: (tag: WalkTag | "全部") => void;
  onClearCollection: () => void;
  onSearchChange: (value: string) => void;
  onSelectCollection: (collection: WalkCollection) => void;
  onSelectFeedback: (feedbackId: WalkFeedbackId) => void;
  onShuffle: () => void;
  onSpotOpen: (spotId: string) => void;
  query: string;
  searchResults: typeof walkSpots;
  spot: typeof walkSpots[number];
  text: typeof walkPageCopy[Language];
}) {
  const summary = activeCollection ? `${text.collectionPrefix}: ${activeCollection.title}` : activeTag === "全部" ? text.defaultRandom : `${text.moodPrefix}: ${activeTag}`;

  return (
    <CollapsiblePanel eyebrow="Adjust" lazyMount summary={summary} title={text.adjust}>
      <div className="grid gap-3">
        <WalkTags activeTag={activeTag} onChange={onChangeTag} tags={walkTags} />
        <WalkCollections activeCollection={activeCollection} collections={collections} onClear={onClearCollection} onSelect={onSelectCollection} onShuffle={onShuffle} spot={spot} />
        <WalkSearch value={query} onChange={onSearchChange} />
        {query.trim() && <WalkSearchResults onSpotOpen={onSpotOpen} results={searchResults} text={text} />}
        <WalkFeedback feedbackIds={feedbackIds} onSelect={onSelectFeedback} />
      </div>
    </CollapsiblePanel>
  );
}

function WalkSearchResults({ onSpotOpen, results, text }: { onSpotOpen: (spotId: string) => void; results: typeof walkSpots; text: typeof walkPageCopy[Language] }) {
  return (
    <div className="rounded-[26px] border border-emerald-100 bg-white/90 p-4 shadow-[0_12px_30px_rgba(22,101,52,0.08)]">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-black text-[#10231A]">{text.searchResults}</h2>
        <span className="text-xs font-black text-emerald-700">{results.length} {text.resultUnit}</span>
      </div>
      {results.length === 0 ? (
        <p className="mt-3 rounded-2xl bg-emerald-50 px-3 py-3 text-sm font-black text-emerald-800">{text.searchEmpty}</p>
      ) : (
        <div className="mt-3 grid gap-2">
          {results.slice(0, 6).map((item) => (
            <button aria-label={text.openSpot(item.station)} className="flex min-h-[72px] items-center gap-3 rounded-[22px] border border-slate-200 bg-white p-2 text-left shadow-sm transition active:scale-[0.99]" key={item.id} onClick={() => onSpotOpen(item.id)} type="button">
              <img alt={text.resultAlt(item.station)} className="h-14 w-14 shrink-0 rounded-[16px] object-cover" src={item.image} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-black text-[#10231A]">{item.station}</span>
                <span className="mt-1 block truncate text-xs font-bold text-[#64748B]">{item.moodTags.join(" / ")}</span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function WalkPersonalPanel({
  favoriteCount,
  favoriteSpots,
  onOpenFavorite,
  onReset,
  onSaveRecord,
  records,
  resetStatus,
  skippedTodayCount,
  spot,
  visitedMap,
  weatherLabel,
  text,
}: {
  favoriteCount: number;
  favoriteSpots: typeof walkSpots;
  onOpenFavorite: (spotId: string) => void;
  onReset: () => void;
  onSaveRecord: (input: { mood: WalkMoodId; note: string }) => void;
  records: WalkRecord[];
  resetStatus: string;
  skippedTodayCount: number;
  spot: typeof walkSpots[number];
  visitedMap: WalkVisitMap;
  weatherLabel: string;
  text: typeof walkPageCopy[Language];
}) {
  return (
    <CollapsiblePanel eyebrow="My Walk" lazyMount summary={text.myWalkSummary(favoriteCount, records.length)} title={text.myWalk}>
      <div className="grid gap-3">
        <WalkRecordForm onSave={onSaveRecord} spot={spot} weatherLabel={weatherLabel} />
        <WalkHistory records={records.slice(0, 5)} />
        <WalkStats favoriteCount={favoriteCount} records={records} visitedMap={visitedMap} />
        <FavoriteWalkList favoriteSpots={favoriteSpots} onOpenFavorite={onOpenFavorite} skippedTodayCount={skippedTodayCount} text={text} />
        <WalkLocalSettings onReset={onReset} resetStatus={resetStatus} text={text} />
      </div>
    </CollapsiblePanel>
  );
}

function FavoriteWalkList({ favoriteSpots, onOpenFavorite, skippedTodayCount, text }: { favoriteSpots: typeof walkSpots; onOpenFavorite: (spotId: string) => void; skippedTodayCount: number; text: typeof walkPageCopy[Language] }) {
  return (
    <section className="rounded-[26px] border border-emerald-100 bg-white/90 p-4 shadow-[0_12px_30px_rgba(22,101,52,0.08)]">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black text-emerald-700">Favorites</p>
          <h2 className="mt-1 text-lg font-black">{text.favorites}</h2>
        </div>
        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">{favoriteSpots.length} {text.resultUnit}</span>
      </div>
      {skippedTodayCount > 0 && <p className="mt-2 text-xs font-bold text-[#64748B]">{text.skippedToday(skippedTodayCount)}</p>}
      {favoriteSpots.length === 0 ? (
        <div className="mt-3 rounded-[22px] border border-dashed border-emerald-200 bg-emerald-50/60 p-4 text-center">
          <Heart className="mx-auto h-6 w-6 text-emerald-700" />
          <p className="mt-2 text-sm font-black text-[#10231A]">{text.noFavorites}</p>
          <p className="mt-1 text-xs font-bold leading-5 text-[#64748B]">{text.favoriteHint}</p>
        </div>
      ) : (
        <div className="mt-3 grid gap-2">
          {favoriteSpots.map((item) => (
            <button aria-label={text.openFavorite(item.station)} className="flex min-h-[84px] items-center gap-3 rounded-[22px] border border-slate-200 bg-white p-2 text-left shadow-sm transition active:scale-[0.99]" key={item.id} onClick={() => onOpenFavorite(item.id)} type="button">
              <img alt={text.favoriteAlt(item.station)} className="h-16 w-16 shrink-0 rounded-[18px] object-cover" src={item.image} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-black text-[#10231A]">{item.station}</span>
                <span className="mt-1 block truncate text-xs font-bold text-[#64748B]">{item.subtitle}</span>
                <span className="mt-1 block text-[11px] font-black text-emerald-700">{item.duration} · {item.budget}</span>
              </span>
              <Heart className="h-4 w-4 shrink-0 fill-rose-500 text-rose-500" />
            </button>
          ))}
        </div>
      )}
    </section>
  );
}

function MiniInfo({ icon: Icon, label, value }: { icon: typeof CalendarDays; label: string; value: string }) {
  return (
    <section className="rounded-[24px] border border-slate-200 bg-white/92 p-4 shadow-[0_10px_24px_rgba(15,23,42,0.06)]">
      <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-lime-100 text-emerald-700">
        <Icon className="h-4 w-4" />
      </span>
      <p className="mt-3 text-xs font-black text-[#64748B]">{label}</p>
      <p className="mt-1 text-base font-black text-[#10231A]">{value}</p>
    </section>
  );
}

function WalkActionPanel({
  isFavorite,
  onShare,
  onSkipToday,
  onToggleFavorite,
  onVisited,
  shareStatus,
  spotName,
  text,
  visitCount,
}: {
  isFavorite: boolean;
  onShare: () => void;
  onSkipToday: () => void;
  onToggleFavorite: () => void;
  onVisited: () => void;
  shareStatus: "copied" | "failed" | "idle" | "shared";
  spotName: string;
  text: typeof walkPageCopy[Language];
  visitCount: number;
}) {
  return (
    <section className="rounded-[26px] border border-emerald-100 bg-white/90 p-4 shadow-[0_12px_30px_rgba(22,101,52,0.08)]">
      <p className="text-xs font-black text-emerald-700">Save & Action</p>
      <h2 className="mt-1 text-lg font-black text-[#10231A]">{text.actions}</h2>
      <p className="mt-1 text-xs font-bold leading-5 text-[#64748B]">
        {visitCount > 0 ? text.visitedCount(visitCount) : text.notVisited}
      </p>
      <div className="mt-4 grid gap-2">
        <button
          aria-label={isFavorite ? text.removeFavorite(spotName) : text.addFavorite(spotName)}
          className={`flex min-h-11 items-center justify-center gap-2 rounded-2xl text-sm font-black transition active:scale-[0.98] ${
            isFavorite ? "bg-rose-50 text-rose-600" : "bg-emerald-700 text-white"
          }`}
          onClick={onToggleFavorite}
          type="button"
        >
          <Heart className={`h-4 w-4 ${isFavorite ? "fill-rose-500" : ""}`} />
          {isFavorite ? text.favoriteButtonOn : text.favoriteButtonOff}
        </button>
        <div className="grid grid-cols-2 gap-2">
          <button aria-label={text.markVisited(spotName)} className="flex min-h-11 items-center justify-center gap-1.5 rounded-2xl bg-emerald-50 text-xs font-black text-emerald-800 transition active:scale-[0.98]" onClick={onVisited} type="button">
            <CheckCircle2 className="h-4 w-4" />
            {text.visitedButton}
          </button>
          <button aria-label={text.skipToday(spotName)} className="flex min-h-11 items-center justify-center gap-1.5 rounded-2xl bg-slate-100 text-xs font-black text-[#475569] transition active:scale-[0.98]" onClick={onSkipToday} type="button">
            <Ban className="h-4 w-4" />
            {text.skipButton}
          </button>
        </div>
        <button aria-label={text.share(spotName)} className="flex min-h-11 items-center justify-center gap-1.5 rounded-2xl border border-emerald-100 bg-white text-xs font-black text-emerald-800 shadow-sm transition active:scale-[0.98]" onClick={onShare} type="button">
          <Share2 className="h-4 w-4" />
          {text.shareButton}
        </button>
      </div>
      {shareStatus !== "idle" && (
        <p className={`mt-3 rounded-2xl px-3 py-2 text-center text-xs font-black ${shareStatus === "failed" ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`} role="status">
          {shareStatus === "shared" ? text.shared : shareStatus === "copied" ? text.copied : text.shareFailed}
        </p>
      )}
    </section>
  );
}

function WalkLocalSettings({ onReset, resetStatus, text }: { onReset: () => void; resetStatus: string; text: typeof walkPageCopy[Language] }) {
  return (
    <section className="rounded-[26px] border border-emerald-100 bg-white/90 p-4 shadow-[0_12px_30px_rgba(22,101,52,0.08)]">
      <p className="text-xs font-black text-emerald-700">Local Data</p>
      <h2 className="mt-1 text-lg font-black text-[#10231A]">{text.localTitle}</h2>
      <p className="mt-2 text-xs font-bold leading-5 text-[#64748B]">
        {text.localDesc}
      </p>
      <button
        aria-label={text.resetAria}
        className="mt-4 flex min-h-11 w-full items-center justify-center rounded-2xl border border-red-100 bg-red-50 px-4 text-sm font-black text-red-700 transition active:scale-[0.98]"
        onClick={onReset}
        type="button"
      >
        {text.resetButton}
      </button>
      {resetStatus && (
        <p className="mt-3 rounded-2xl bg-emerald-50 px-3 py-2 text-center text-xs font-black text-emerald-700" role="status">
          {resetStatus}
        </p>
      )}
    </section>
  );
}
