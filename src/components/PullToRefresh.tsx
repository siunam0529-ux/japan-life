"use client";

import { RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const pullThreshold = 74;
const maxPullDistance = 112;

export function PullToRefresh() {
  const router = useRouter();
  const startYRef = useRef<number | null>(null);
  const pullingRef = useRef(false);
  const [distance, setDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const reset = () => {
      startYRef.current = null;
      pullingRef.current = false;
      setDistance(0);
    };

    const onTouchStart = (event: TouchEvent) => {
      if (window.scrollY > 0 || event.touches.length !== 1 || refreshing) return;
      startYRef.current = event.touches[0]?.clientY ?? null;
      pullingRef.current = false;
    };

    const onTouchMove = (event: TouchEvent) => {
      const startY = startYRef.current;
      if (startY === null || window.scrollY > 0 || refreshing) return;
      const currentY = event.touches[0]?.clientY ?? startY;
      const delta = currentY - startY;
      if (delta <= 0) return;
      if (delta > 10) pullingRef.current = true;
      if (!pullingRef.current) return;
      setDistance(Math.min(maxPullDistance, delta * 0.55));
    };

    const onTouchEnd = () => {
      if (!pullingRef.current) {
        reset();
        return;
      }
      if (distance >= pullThreshold) {
        setRefreshing(true);
        setDistance(pullThreshold);
        router.refresh();
        window.setTimeout(() => {
          setRefreshing(false);
          reset();
        }, 700);
        return;
      }
      reset();
    };

    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    window.addEventListener("touchcancel", reset, { passive: true });

    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("touchcancel", reset);
    };
  }, [distance, refreshing, router]);

  const visible = distance > 0 || refreshing;
  const progress = Math.min(1, distance / pullThreshold);

  return (
    <div
      aria-hidden={!visible}
      className="pointer-events-none fixed left-1/2 top-3 z-[90] flex -translate-x-1/2 items-center justify-center transition-opacity duration-150"
      style={{ opacity: visible ? 1 : 0, transform: `translate(-50%, ${Math.max(0, distance - 42)}px)` }}
    >
      <div className="flex h-10 items-center gap-2 rounded-full border border-blue-100 bg-white/95 px-4 text-xs font-black text-blue-800 shadow-[0_12px_28px_rgba(37,99,235,0.16)] backdrop-blur">
        <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} style={{ transform: refreshing ? undefined : `rotate(${progress * 220}deg)` }} />
        {refreshing ? "刷新中" : progress >= 1 ? "松开刷新" : "下拉刷新"}
      </div>
    </div>
  );
}
