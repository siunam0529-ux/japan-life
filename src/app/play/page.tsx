"use client";

import { ArrowLeft, CalendarDays, CheckCircle2, Clock3, Heart, Info, MapPinned, RefreshCw, Sparkles, UsersRound } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CollapsiblePanel } from "@/components/CollapsiblePanel";
import { PlayFilterTabs } from "@/components/play/PlayFilterTabs";
import { PlayPlanSteps } from "@/components/play/PlayPlanSteps";
import { playCompanionTags, playDestinations, playModes, playTimeTags, playTypeTags } from "@/lib/play/destinations";
import { getInitialPlayPick, getPlayDestinationById, getPlayMatches, pickPlayDestination } from "@/lib/play/recommendation";
import { getPlayDateKey, readPlayDailyPick, readPlayFavorites, readPlayVisitedRecords, resetPlayStorage, writePlayDailyPick, writePlayFavorites, writePlayVisitedRecords } from "@/lib/play/storage";
import type { PlayDestination, PlayFilterTag, PlayMode, PlaySavedDestination, PlayVisitedRecord } from "@/lib/play/types";

const PlayMiniMap = dynamic(() => import("@/components/play/PlayMiniMap"), {
  loading: () => <div className="flex h-[220px] items-center justify-center rounded-[24px] bg-emerald-50 text-sm font-black text-emerald-700">地图加载中...</div>,
  ssr: false,
});

const filterGroups = [
  { title: "时间", options: playTimeTags },
  { title: "对象", options: playCompanionTags },
  { title: "类型", options: playTypeTags },
];

function saveDaily(destination: PlayDestination, dateKey: string, filters: PlayFilterTag[], mode: PlayMode) {
  writePlayDailyPick({ date: dateKey, destinationId: destination.id, filters, mode });
}

export default function PlayPage() {
  const [dateKey, setDateKey] = useState("2026-01-01");
  const [filters, setFilters] = useState<PlayFilterTag[]>([]);
  const [mode, setMode] = useState<PlayMode>("半日游");
  const [favorites, setFavorites] = useState<PlaySavedDestination[]>([]);
  const [visitedRecords, setVisitedRecords] = useState<PlayVisitedRecord[]>([]);
  const [selectedId, setSelectedId] = useState(playDestinations[0]?.id ?? "");

  useEffect(() => {
    const today = getPlayDateKey();
    const savedPick = readPlayDailyPick(today);
    const nextFilters = savedPick?.filters ?? [];
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

  const setSelectedAndSave = (destination: PlayDestination, nextFilters = filters, nextMode = mode) => {
    setSelectedId(destination.id);
    saveDaily(destination, dateKey, nextFilters, nextMode);
    window.scrollTo({ top: 0, behavior: "smooth" });
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
    if (picked) setSelectedAndSave(picked);
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
    <main className="min-h-screen bg-[#F4F8F0] text-[#10231A]">
      <div className="mx-auto min-h-screen max-w-[430px] bg-[radial-gradient(circle_at_top,#F3FBEA_0%,#F7FAF3_38%,#FFFFFF_100%)] px-4 pb-32 pt-5">
        <header className="flex items-center justify-between gap-3">
          <Link aria-label="返回 Japan Life 首页" className="inline-flex min-h-11 items-center gap-2 rounded-full border border-emerald-100 bg-white/90 px-4 text-sm font-black text-emerald-800 shadow-sm transition active:scale-[0.98]" href="/">
            <ArrowLeft className="h-4 w-4" />
            返回 Japan Life
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
              <h1 className="mt-1 text-3xl font-black tracking-tight">今天去哪玩</h1>
              <p className="mt-2 text-sm font-bold leading-6 text-[#64748B]">半日游、一日游和周末随机目的地推荐。</p>
            </div>
          </div>
        </section>

        <section className="mt-4 rounded-[26px] border border-lime-100 bg-lime-50/80 p-4 shadow-[0_12px_30px_rgba(22,101,52,0.06)]">
          <p className="text-sm font-black leading-6 text-lime-900">想轻松走走的话，可以用随机散步。这里更适合半日游和周末出门。</p>
          <Link className="mt-3 inline-flex min-h-11 w-full items-center justify-center rounded-2xl bg-white px-4 text-xs font-black text-emerald-800 shadow-sm ring-1 ring-lime-100" href="/walk">
            去随机散步
          </Link>
        </section>

        {selected ? (
          <section className="mt-4 rounded-[30px] border border-emerald-100 bg-white/95 shadow-[0_18px_45px_rgba(22,101,52,0.12)]">
            <div className="p-4">
              <p className="text-xs font-black text-emerald-700">今日游玩计划</p>
              <h2 className="mt-1 text-2xl font-black tracking-tight text-[#10231A]">
                {selected.name}・{mode}
              </h2>
              <p className="mt-1 text-xs font-bold text-[#64748B]">{selected.japaneseName} / {selected.englishName}</p>
              <div className="mt-3 grid gap-2 rounded-2xl bg-emerald-50 px-3 py-3">
                <p className="text-xs font-bold leading-5 text-[#64748B]">预计：{selected.duration}</p>
                <p className="text-xs font-bold leading-5 text-[#64748B]">预算：{selected.budget}（仅供参考）</p>
                <p className="text-xs font-bold leading-5 text-[#64748B]">适合：{selected.bestFor.join(" / ")}</p>
                <p className="text-sm font-bold leading-6 text-emerald-900">理由：{selected.reason}</p>
              </div>
            </div>
          </section>
        ) : (
          <section className="mt-4 rounded-[26px] border border-emerald-100 bg-white/92 p-4 shadow-[0_12px_30px_rgba(22,101,52,0.08)]">
            <p className="text-sm font-black leading-6 text-emerald-800">今天还没找到合适的目的地，换个条件试试吧。</p>
          </section>
        )}

        <CollapsiblePanel className="mt-4" eyebrow="Mode" summary={`当前：${mode}`} title="今天想怎么玩">
          <div className="mt-3 grid grid-cols-2 gap-2">
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
                  {item}
                </button>
              );
            })}
          </div>
        </CollapsiblePanel>

        <div className="mt-4">
          <PlayFilterTabs activeFilters={filters} groups={filterGroups} onToggle={toggleFilter} />
        </div>

        {selected ? (
          <>
            <div className="mt-4">
              <PlayPlanSteps steps={selected.planSteps} />
            </div>

            <section className="mt-4 grid gap-3">
              <div className="rounded-[24px] border border-emerald-100 bg-white/92 p-4 shadow-[0_12px_30px_rgba(22,101,52,0.08)]">
                <p className="flex items-center gap-2 text-xs font-black text-emerald-700">
                  <Clock3 className="h-4 w-4" />
                  预算和时长
                </p>
                <p className="mt-2 text-sm font-black text-[#10231A]">{selected.duration}</p>
                <p className="mt-1 text-xs font-bold text-[#64748B]">{selected.budget}（预算仅供参考）</p>
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
                  适合对象
                </p>
                <p className="mt-2 text-sm font-black text-[#10231A]">{selected.bestFor.join("・")}</p>
                <p className="mt-1 text-xs font-bold text-[#64748B]">{selected.difficulty}</p>
              </div>
            </section>

            <section className="mt-4 rounded-[26px] border border-emerald-100 bg-white/92 p-4 shadow-[0_12px_30px_rgba(22,101,52,0.08)]">
              <p className="text-xs font-black text-emerald-700">Map</p>
              <h2 className="mt-1 text-lg font-black text-[#10231A]">小地图预览</h2>
              <p className="mt-1 text-xs font-bold leading-5 text-[#64748B]">地图仅供参考，实际路线请以地图 APP 为准。</p>
              <div className="mt-3">
                <PlayMiniMap destination={selected} />
              </div>
            </section>

            <section className="mt-4 overflow-hidden rounded-[26px] border border-emerald-100 bg-white/92 p-4 shadow-[0_12px_30px_rgba(22,101,52,0.08)]">
              <p className="text-xs font-black text-emerald-700">Actions</p>
              <h2 className="mt-1 text-lg font-black text-[#10231A]">收藏 / 去过</h2>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-emerald-700 px-3 text-xs font-black text-white shadow-sm transition active:scale-[0.98]" onClick={shuffleDestination} type="button">
                  <RefreshCw className="h-4 w-4" />
                  换一个
                </button>
                <button
                  aria-pressed={favoriteIds.includes(selected.id)}
                  className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl px-3 text-xs font-black shadow-sm transition active:scale-[0.98] ${
                    favoriteIds.includes(selected.id) ? "bg-rose-50 text-rose-700" : "border border-emerald-100 bg-white text-emerald-800"
                  }`}
                  onClick={() => toggleFavorite(selected.id)}
                  type="button"
                >
                  <Heart className={`h-4 w-4 ${favoriteIds.includes(selected.id) ? "fill-current" : ""}`} />
                  {favoriteIds.includes(selected.id) ? "已收藏" : "收藏"}
                </button>
                <button
                  aria-pressed={visitedIds.includes(selected.id)}
                  className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl px-3 text-xs font-black shadow-sm transition active:scale-[0.98] ${
                    visitedIds.includes(selected.id) ? "bg-lime-100 text-lime-800" : "border border-lime-100 bg-lime-50 text-lime-800"
                  }`}
                  onClick={() => toggleVisited(selected.id)}
                  type="button"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  {visitedIds.includes(selected.id) ? "去过了" : "去过"}
                </button>
                <a className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-emerald-100 bg-white px-3 text-xs font-black text-emerald-800 shadow-sm transition active:scale-[0.98]" href={`https://www.google.com/maps/search/?api=1&query=${selected.latitude},${selected.longitude}`} rel="noopener noreferrer" target="_blank">
                  <MapPinned className="h-4 w-4" />
                  打开地图
                </a>
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
              <h2 className="text-lg font-black text-[#10231A]">收藏的游玩目的地</h2>
            </div>
          </div>
          {favoriteDestinations.length === 0 ? (
            <p className="mt-3 rounded-2xl bg-emerald-50 px-3 py-3 text-sm font-bold leading-6 text-emerald-800">还没有收藏。适合周末再去的地方可以先收藏起来。</p>
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
                  <span className="shrink-0 text-xs font-black text-emerald-700">查看</span>
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
              <h2 className="mt-1 text-lg font-black text-[#10231A]">去过的目的地</h2>
              <p className="mt-1 text-xs font-bold leading-5 text-[#64748B]">
                {visitedRecords.length === 0 ? "还没有记录。去过之后可以点「去过」。" : `已记录 ${visitedRecords.length} 个目的地。`}
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
                      <span className="shrink-0 text-xs font-black text-emerald-700">查看</span>
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
              <h2 className="mt-1 text-lg font-black text-[#10231A]">本地保存说明</h2>
              <p className="mt-1 text-xs font-bold leading-5 text-[#64748B]">今日推荐、收藏和去过记录会保存在本机浏览器中，清除浏览器数据后可能会消失。目的地为 Japan Life 本地精选整理，出发前请确认交通和营业信息。</p>
              <button className="mt-3 inline-flex min-h-11 w-full items-center justify-center rounded-2xl border border-emerald-100 bg-white px-4 text-xs font-black text-emerald-800 shadow-sm transition active:scale-[0.98]" onClick={resetPlayData} type="button">
                重置今天去哪玩数据
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
