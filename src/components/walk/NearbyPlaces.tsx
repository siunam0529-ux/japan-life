"use client";

import { useEffect, useState } from "react";
import { CollapsiblePanel } from "@/components/CollapsiblePanel";
import { NearbyPlaceCard } from "@/components/walk/NearbyPlaceCard";
import type { NearbyPlace, NearbyPlaceType, WalkSpot } from "@/lib/walk/spots";

const filterTypes: Array<NearbyPlaceType | "全部"> = ["全部", "咖啡店", "书店", "旧书店", "神社", "公园", "商店街", "拉面店", "便利店", "河边", "猫咖", "小巷", "甜品店"];

type NearbyPlacesResponse = {
  message?: string;
  places?: NearbyPlace[];
  source?: string;
};

export function NearbyPlaces({ spot }: { spot: Pick<WalkSpot, "latitude" | "longitude" | "station"> }) {
  const [activeType, setActiveType] = useState<NearbyPlaceType | "全部">("全部");
  const [places, setPlaces] = useState<NearbyPlace[]>([]);
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"empty" | "error" | "loading" | "success">("loading");

  useEffect(() => {
    const controller = new AbortController();
    let mounted = true;

    async function loadNearbyPlaces() {
      setStatus("loading");
      setMessage("");
      setPlaces([]);

      const params = new URLSearchParams({
        lat: String(spot.latitude),
        lng: String(spot.longitude),
        type: activeType,
      });

      try {
        const response = await fetch(`/api/walk/nearby/?${params.toString()}`, {
          cache: "no-store",
          signal: controller.signal,
        });
        const data = (await response.json()) as NearbyPlacesResponse;
        if (!mounted) return;

        if (!response.ok) {
          setStatus("error");
          setMessage(data.message || "附近真实地点暂时取得失败，请先用地图 APP 搜索。");
          return;
        }

        const nextPlaces = Array.isArray(data.places) ? data.places.slice(0, 5) : [];
        setPlaces(nextPlaces);
        setStatus(nextPlaces.length > 0 ? "success" : "empty");
        setMessage(data.message || "");
      } catch {
        if (!mounted || controller.signal.aborted) return;
        setStatus("error");
        setMessage("附近真实地点暂时取得失败，请先用地图 APP 搜索。");
      }
    }

    loadNearbyPlaces();

    return () => {
      mounted = false;
      controller.abort();
    };
  }, [activeType, spot.latitude, spot.longitude]);

  return (
    <section className="rounded-[26px] border border-emerald-100 bg-white/90 p-4 shadow-[0_12px_30px_rgba(22,101,52,0.08)]">
      <p className="text-xs font-black text-emerald-700">Nearby</p>
      <h2 className="mt-1 text-lg font-black text-[#10231A]">附近可以顺路看看</h2>
      <p className="mt-2 text-xs font-bold leading-5 text-[#64748B]">HotPepper 有覆盖的店铺类别会优先使用 HotPepper；公园、书店、神社、商店街等非 HotPepper 地点才使用 OpenStreetMap。取不到时会直接提示你打开地图确认。</p>
      <CollapsiblePanel className="mt-3 rounded-[22px] bg-emerald-50/50 p-3 shadow-none" contentClassName="mt-2" eyebrow="Filter" summary={`当前：${activeType}`} title="地点类型">
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          {filterTypes.map((type) => {
            const active = activeType === type;
            return (
              <button
                aria-pressed={active}
                className={`min-h-9 shrink-0 rounded-full px-3 text-xs font-black transition active:scale-[0.98] ${
                  active ? "bg-emerald-700 text-white shadow-sm" : "border border-emerald-100 bg-white text-[#475569]"
                }`}
                key={type}
                onClick={() => setActiveType(type)}
                type="button"
              >
                {type}
              </button>
            );
          })}
        </div>
      </CollapsiblePanel>

      {status === "loading" && <p className="mt-3 rounded-2xl bg-emerald-50 px-3 py-3 text-sm font-black text-emerald-800">正在取得 {spot.station} 附近真实地点...</p>}

      {status === "empty" && <p className="mt-3 rounded-2xl bg-emerald-50 px-3 py-3 text-sm font-black text-emerald-800">{message || "附近暂时没有取得真实地点，可以直接打开地图 APP 搜索。"}</p>}

      {status === "error" && <p className="mt-3 rounded-2xl bg-amber-50 px-3 py-3 text-sm font-black text-amber-800">{message}</p>}

      {status === "success" ? (
        <div className="mt-3 grid gap-2">
          {places.map((place) => (
            <NearbyPlaceCard key={place.id} place={place} />
          ))}
        </div>
      ) : (
        <a
          className="mt-3 inline-flex min-h-10 w-full items-center justify-center rounded-2xl border border-emerald-100 bg-white px-4 text-xs font-black text-emerald-800 shadow-sm transition active:scale-[0.98]"
          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${spot.latitude},${spot.longitude}`)}`}
          rel="noreferrer"
          target="_blank"
        >
          打开地图 APP 自己确认
        </a>
      )}
    </section>
  );
}
