"use client";

import { AlertTriangle, Ban, CalendarDays, CheckCircle2, CloudRain, CloudSun, Clock3, Footprints, Heart, Loader2, Map, Share2, Sparkles, WalletCards } from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";
import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { NearbyPlaces } from "@/components/walk/NearbyPlaces";
import { WalkCard } from "@/components/walk/WalkCard";
import { WalkCollections } from "@/components/walk/WalkCollections";
import { WalkFeedback } from "@/components/walk/WalkFeedback";
import { WalkHistory } from "@/components/walk/WalkHistory";
import { WalkRecordForm } from "@/components/walk/WalkRecordForm";
import { WalkReasonList } from "@/components/walk/WalkReasonList";
import { WalkRouteTimeline } from "@/components/walk/WalkRouteTimeline";
import { WalkSearch } from "@/components/walk/WalkSearch";
import { WalkShareCard } from "@/components/walk/WalkShareCard";
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

const WalkMiniMap = dynamic(() => import("@/components/walk/WalkMiniMap"), {
  ssr: false,
});

function getMoodLabel(mood: WalkMoodId) {
  const option = walkMoodOptions.find((item) => item.id === mood);
  return option ? `${option.emoji} ${option.label}` : "🌿 放松";
}

function formatCompletionDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("zh-CN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export default function WalkClientPage() {
  const { language } = useLanguage();
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
  const [shareOpen, setShareOpen] = useState(false);
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
      setLoadError("随机散步数据暂时读取失败，请刷新后再试。");
    } finally {
      setLoading(false);
    }
  }, []);

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
    const text = `今天 Japan Life 推荐我去「${spot.station}」散步。\n任务：${currentTask}\n#JapanLife #东京散步`;
    try {
      if (navigator.share) {
        await navigator.share({
          text,
          title: "Japan Life 随机散步",
          url: `${window.location.origin}/walk`,
        });
        setShareStatus("shared");
      } else {
        await copyShareText(text);
        setShareStatus("copied");
      }
    } catch {
      try {
        await copyShareText(text);
        setShareStatus("copied");
      } catch {
        setShareStatus("failed");
      }
    }
    window.setTimeout(() => setShareStatus("idle"), 2400);
  };

  const resetWalkData = () => {
    const confirmed = window.confirm("确定要重置随机散步数据吗？收藏、去过、反馈和散步记录都会清除，但不会影响其他 Japan Life 数据。");
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
    setResetStatus("随机散步本地数据已重置。");
    window.setTimeout(() => setResetStatus(""), 2400);
  };

  if (loading) {
    return (
      <WalkPageShell>
        <div className="flex min-h-[70vh] flex-col items-center justify-center text-center">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-700" />
          <p className="mt-3 text-sm font-black text-[#10231A]">正在准备今天的散步推荐...</p>
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
            重新加载
          </button>
        </div>
      </WalkPageShell>
    );
  }

  return (
    <main className="min-h-screen bg-[#F4F8F0] text-[#10231A]">
      <div className="mx-auto min-h-screen max-w-[430px] overflow-x-hidden bg-[radial-gradient(circle_at_top,#F3FBEA_0%,#F7FAF3_38%,#FFFFFF_100%)] px-4 pb-32 pt-5">
        <header className="flex items-center justify-between gap-3">
          <Link aria-label="返回 Japan Life 首页" className="inline-flex min-h-11 items-center rounded-full border border-emerald-100 bg-white/90 px-4 text-sm font-black text-emerald-800 shadow-sm transition active:scale-[0.98]" href="/">
            ← 返回 Japan Life
          </Link>
          <span className="inline-flex items-center gap-1 rounded-full bg-white/85 px-4 py-2 text-xs font-black text-emerald-700 shadow-sm backdrop-blur-xl">
            随机散步
            <Footprints className="h-3.5 w-3.5" />
          </span>
        </header>

        <section className="mt-6 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-3xl bg-emerald-100 text-emerald-700 shadow-sm">
            <Footprints className="h-6 w-6" />
          </div>
          <h1 className="mt-4 text-3xl font-black tracking-tight">今天去哪散步？</h1>
          <p className="mx-auto mt-3 max-w-[280px] text-sm font-bold leading-6 text-[#64748B]">让我们带你去一个平时不会去的地方</p>
        </section>

        <section className="mt-5 grid gap-3">
          <ContextCard icon={Clock3} title={context.timeLabel} body={context.timeMessage} />
          <WeatherHintCard error={weatherError} icon={walkWeather.isRainy ? CloudRain : CloudSun} loading={weatherLoading} snapshot={walkWeather} spot={spot} />
        </section>

        <section className="mt-5">
          <TodayWalkCopyCard copy={dailyWalkCopy} />
        </section>

        <section className="mt-6">
          <WalkCard spot={spot} onShuffle={shuffleSpot} visitCount={visitCount} />
        </section>

        {completion && (
          <section className="mt-5">
            <WalkCompletionCard completion={completion} />
          </section>
        )}

        <section className="mt-5">
          <WalkTags activeTag={activeTag} onChange={changeTag} tags={walkTags} />
        </section>

        <section className="mt-5">
          <WalkCollections activeCollection={activeCollection} collections={walkCollections} onClear={clearCollection} onSelect={selectCollection} onShuffle={shuffleSpot} spot={spot} />
        </section>

        <section className="mt-5">
          <WalkSearch value={query} onChange={setQuery} />
          {query.trim() && (
            <div className="mt-3 rounded-[26px] border border-emerald-100 bg-white/90 p-4 shadow-[0_12px_30px_rgba(22,101,52,0.08)]">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-sm font-black text-[#10231A]">搜索结果</h2>
                <span className="text-xs font-black text-emerald-700">{searchResults.length} 个</span>
              </div>
              {searchResults.length === 0 ? (
                <p className="mt-3 rounded-2xl bg-emerald-50 px-3 py-3 text-sm font-black text-emerald-800">今天没有找到合适的地方，换个心情试试吧。</p>
              ) : (
                <div className="mt-3 grid gap-2">
                  {searchResults.slice(0, 6).map((item) => (
                    <button aria-label={`打开${item.station}散步推荐`} className="flex min-h-[72px] items-center gap-3 rounded-[22px] border border-slate-200 bg-white p-2 text-left shadow-sm transition active:scale-[0.99]" key={item.id} onClick={() => openFavoriteSpot(item.id)} type="button">
                      <img alt={`${item.station} 搜索结果`} className="h-14 w-14 shrink-0 rounded-[16px] object-cover" src={item.image} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-black text-[#10231A]">{item.station}</span>
                        <span className="mt-1 block truncate text-xs font-bold text-[#64748B]">{item.moodTags.join(" / ")}</span>
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>

        <section className="mt-5 grid gap-3">
          <InfoBlock icon={Sparkles} title="推荐理由" body={spot.reason} />
          <WalkReasonList reasons={walkReasons} />
          <WalkTaskBox task={currentTask} onChangeTask={changeTask} />
          <div className="grid grid-cols-2 gap-3">
            <MiniInfo icon={CalendarDays} label="推荐时间" value={spot.bestTime} />
            <MiniInfo icon={Clock3} label="推荐时长" value={spot.duration} />
            <MiniInfo icon={WalletCards} label="预算参考" value={spot.budget} />
            <MiniInfo icon={Footprints} label="路线难度" value={spot.difficulty} />
            <MiniInfo icon={Map} label="预计步数" value={spot.stepsEstimate} />
            <MiniInfo icon={Heart} label="适合谁" value={spot.suitableFor.slice(0, 2).join(" / ")} />
          </div>
        </section>

        <section className="mt-5">
          <MapPreviewSection spot={spot} />
        </section>

        <section className="mt-5">
          <NearbyPlaces spot={spot} />
        </section>

        <section className="mt-5">
          <WalkRouteTimeline steps={spot.routeSteps} />
        </section>

        <section className="mt-5">
          <WalkFeedback feedbackIds={feedbackIds} onSelect={selectFeedback} />
        </section>

        <section className="mt-5">
          <WalkActionPanel
            isFavorite={isFavorite}
            onShare={shareTodayWalk}
            onSkipToday={skipToday}
            onToggleFavorite={toggleFavorite}
            onVisited={markVisited}
            shareStatus={shareStatus}
            spotName={spot.station}
            visitCount={visitCount}
          />
        </section>

        <section className="mt-5">
          <button aria-label={`生成${spot.station}散步分享卡片预览`} className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#10231A] text-sm font-black text-white shadow-[0_16px_32px_rgba(16,35,26,0.20)] transition active:scale-[0.98]" onClick={() => setShareOpen(true)} type="button">
            <Share2 className="h-4 w-4" />
            生成分享卡片
          </button>
        </section>

        <section className="mt-5">
          <WalkRecordForm onSave={saveWalkRecord} spot={spot} weatherLabel={context.weatherLabel} />
        </section>

        <section className="mt-5">
          <WalkHistory records={walkRecords.slice(0, 5)} />
        </section>

        <section className="mt-5">
          <WalkStats favoriteCount={favoriteIds.length} records={walkRecords} visitedMap={visitedMap} />
        </section>

        <section className="mt-5 rounded-[26px] border border-emerald-100 bg-white/90 p-4 shadow-[0_12px_30px_rgba(22,101,52,0.08)]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black text-emerald-700">Favorites</p>
              <h2 className="mt-1 text-lg font-black">我的收藏</h2>
            </div>
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">{favoriteSpots.length} 个</span>
          </div>
          {skippedTodayIds.length > 0 && <p className="mt-2 text-xs font-bold text-[#64748B]">今天已跳过 {skippedTodayIds.length} 个地点，不会再推荐它们。</p>}
          {favoriteSpots.length === 0 ? (
            <div className="mt-3 rounded-[22px] border border-dashed border-emerald-200 bg-emerald-50/60 p-4 text-center">
              <Heart className="mx-auto h-6 w-6 text-emerald-700" />
              <p className="mt-2 text-sm font-black text-[#10231A]">还没有收藏的散步地点</p>
              <p className="mt-1 text-xs font-bold leading-5 text-[#64748B]">看到喜欢的地方，点图片卡片右上角的心形就能留下来。</p>
            </div>
          ) : (
            <div className="mt-3 grid gap-2">
              {favoriteSpots.map((item) => (
                <button aria-label={`打开收藏地点${item.station}`} className="flex min-h-[84px] items-center gap-3 rounded-[22px] border border-slate-200 bg-white p-2 text-left shadow-sm transition active:scale-[0.99]" key={item.id} onClick={() => openFavoriteSpot(item.id)} type="button">
                  <img alt={`${item.station} 收藏`} className="h-16 w-16 shrink-0 rounded-[18px] object-cover" src={item.image} />
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

        <section className="mt-5">
          <WalkLocalSettings onReset={resetWalkData} resetStatus={resetStatus} />
        </section>
        {shareOpen && <WalkShareCard spot={spot} task={currentTask} onClose={() => setShareOpen(false)} />}
      </div>
    </main>
  );
}

function WalkPageShell({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen bg-[#F4F8F0] text-[#10231A]">
      <div className="mx-auto min-h-screen max-w-[430px] overflow-x-hidden bg-[radial-gradient(circle_at_top,#F3FBEA_0%,#F7FAF3_38%,#FFFFFF_100%)] px-4 pb-32 pt-5">
        <header className="flex items-center justify-between gap-3">
          <Link aria-label="返回 Japan Life 首页" className="inline-flex min-h-11 items-center rounded-full border border-emerald-100 bg-white/90 px-4 text-sm font-black text-emerald-800 shadow-sm transition active:scale-[0.98]" href="/">
            ← 返回 Japan Life
          </Link>
          <span className="inline-flex items-center gap-1 rounded-full bg-white/85 px-4 py-2 text-xs font-black text-emerald-700 shadow-sm backdrop-blur-xl">
            随机散步
            <Footprints className="h-3.5 w-3.5" />
          </span>
        </header>
        {children}
      </div>
    </main>
  );
}

function WalkCompletionCard({ completion }: { completion: WalkCompletion }) {
  return (
    <section className="rounded-[26px] border border-emerald-100 bg-white/92 p-4 shadow-[0_12px_30px_rgba(22,101,52,0.08)]">
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-sm">
          <CheckCircle2 className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-black text-emerald-700">Done Today</p>
          <h2 className="mt-1 text-lg font-black text-[#10231A]">今天的散步完成了。明天再去一个新的地方吧。</h2>
          <div className="mt-3 grid gap-2 rounded-[22px] border border-emerald-100 bg-emerald-50/70 p-3 text-sm font-bold text-[#475569]">
            <p>
              <span className="font-black text-[#10231A]">完成日期：</span>
              {formatCompletionDate(completion.completedAt)}
            </p>
            <p>
              <span className="font-black text-[#10231A]">地点：</span>
              {completion.station}
            </p>
            <p>
              <span className="font-black text-[#10231A]">心情：</span>
              {completion.moodLabel}
            </p>
            <p className="leading-6">
              <span className="font-black text-[#10231A]">备注：</span>
              {completion.note}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function TodayWalkCopyCard({ copy }: { copy: string }) {
  return (
    <section className="rounded-[26px] border border-emerald-100 bg-white/92 p-4 shadow-[0_12px_30px_rgba(22,101,52,0.08)]">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-lime-100 text-emerald-700">
          <Sparkles className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-black text-emerald-700">Today Note</p>
          <h2 className="mt-1 text-lg font-black text-[#10231A]">今日散步建议</h2>
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
}: {
  error: string | null;
  icon: typeof CloudSun;
  loading: boolean;
  snapshot: WalkWeatherSnapshot;
  spot: { station: string };
}) {
  const temperatureLabel = typeof snapshot.temperature === "number" ? `${Math.round(snapshot.temperature)}°C` : "--°C";
  const title = loading ? "天气读取中" : `${snapshot.locationName} ${temperatureLabel}・${snapshot.description}`;
  const body = error ? "天气暂时取得失败，先随机推荐一个适合散步的地方。" : buildWalkWeatherRecommendation(snapshot, spot);

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

function MapPreviewSection({ spot }: { spot: typeof walkSpots[number] }) {
  return (
    <section className="rounded-[26px] border border-emerald-100 bg-white/92 p-4 shadow-[0_12px_30px_rgba(22,101,52,0.08)]">
      <div className="mb-3 flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
          <Map className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-black text-emerald-700">Map Preview</p>
          <h2 className="mt-1 text-lg font-black text-[#10231A]">地图预览</h2>
          <p className="mt-1 text-sm font-bold text-[#475569]">{spot.station}・{spot.area}</p>
        </div>
      </div>
      <WalkMiniMap spot={spot} />
      <p className="mt-3 rounded-2xl bg-emerald-50 px-3 py-2 text-xs font-bold leading-5 text-emerald-800">
        地图仅供参考，实际路线请使用常用地图 APP 确认。
      </p>
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
  visitCount,
}: {
  isFavorite: boolean;
  onShare: () => void;
  onSkipToday: () => void;
  onToggleFavorite: () => void;
  onVisited: () => void;
  shareStatus: "copied" | "failed" | "idle" | "shared";
  spotName: string;
  visitCount: number;
}) {
  return (
    <section className="rounded-[26px] border border-emerald-100 bg-white/90 p-4 shadow-[0_12px_30px_rgba(22,101,52,0.08)]">
      <p className="text-xs font-black text-emerald-700">Save & Action</p>
      <h2 className="mt-1 text-lg font-black text-[#10231A]">收藏 / 去过 / 不想去</h2>
      <p className="mt-1 text-xs font-bold leading-5 text-[#64748B]">
        {visitCount > 0 ? `这个地方已经去过 ${visitCount} 次。` : "还没记录去过这个地方。"}
      </p>
      <div className="mt-4 grid gap-2">
        <button
          aria-label={isFavorite ? `取消收藏${spotName}` : `收藏${spotName}`}
          className={`flex min-h-11 items-center justify-center gap-2 rounded-2xl text-sm font-black transition active:scale-[0.98] ${
            isFavorite ? "bg-rose-50 text-rose-600" : "bg-emerald-700 text-white"
          }`}
          onClick={onToggleFavorite}
          type="button"
        >
          <Heart className={`h-4 w-4 ${isFavorite ? "fill-rose-500" : ""}`} />
          {isFavorite ? "已收藏，点击取消" : "收藏这个地方"}
        </button>
        <div className="grid grid-cols-2 gap-2">
          <button aria-label={`标记${spotName}为我去过了`} className="flex min-h-11 items-center justify-center gap-1.5 rounded-2xl bg-emerald-50 text-xs font-black text-emerald-800 transition active:scale-[0.98]" onClick={onVisited} type="button">
            <CheckCircle2 className="h-4 w-4" />
            我去过了
          </button>
          <button aria-label={`今天不想去${spotName}`} className="flex min-h-11 items-center justify-center gap-1.5 rounded-2xl bg-slate-100 text-xs font-black text-[#475569] transition active:scale-[0.98]" onClick={onSkipToday} type="button">
            <Ban className="h-4 w-4" />
            今天不想去
          </button>
        </div>
        <button aria-label={`分享今天去${spotName}散步`} className="flex min-h-11 items-center justify-center gap-1.5 rounded-2xl border border-emerald-100 bg-white text-xs font-black text-emerald-800 shadow-sm transition active:scale-[0.98]" onClick={onShare} type="button">
          <Share2 className="h-4 w-4" />
          分享今天的散步
        </button>
      </div>
      {shareStatus !== "idle" && (
        <p className={`mt-3 rounded-2xl px-3 py-2 text-center text-xs font-black ${shareStatus === "failed" ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`} role="status">
          {shareStatus === "shared" ? "已打开系统分享。" : shareStatus === "copied" ? "分享文字已复制，可以直接粘贴给朋友。" : "分享失败，请稍后再试。"}
        </p>
      )}
    </section>
  );
}

function WalkLocalSettings({ onReset, resetStatus }: { onReset: () => void; resetStatus: string }) {
  return (
    <section className="rounded-[26px] border border-emerald-100 bg-white/90 p-4 shadow-[0_12px_30px_rgba(22,101,52,0.08)]">
      <p className="text-xs font-black text-emerald-700">Local Data</p>
      <h2 className="mt-1 text-lg font-black text-[#10231A]">本地保存说明</h2>
      <p className="mt-2 text-xs font-bold leading-5 text-[#64748B]">
        收藏、去过、反馈和散步记录会保存在本机浏览器中。清除浏览器数据或更换设备后，这些记录可能会消失。
      </p>
      <button
        aria-label="重置随机散步本地数据"
        className="mt-4 flex min-h-11 w-full items-center justify-center rounded-2xl border border-red-100 bg-red-50 px-4 text-sm font-black text-red-700 transition active:scale-[0.98]"
        onClick={onReset}
        type="button"
      >
        重置散步数据
      </button>
      {resetStatus && (
        <p className="mt-3 rounded-2xl bg-emerald-50 px-3 py-2 text-center text-xs font-black text-emerald-700" role="status">
          {resetStatus}
        </p>
      )}
    </section>
  );
}
