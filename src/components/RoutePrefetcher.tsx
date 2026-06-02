"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

const primaryRoutes = [
  "/",
  "/places",
  "/community/all",
  "/notifications",
  "/me",
];

const secondaryRoutes = [
  "/apps",
  "/benefits",
  "/claim",
  "/contact",
  "/data-status",
  "/deals",
  "/favorites",
  "/food",
  "/home-tools",
  "/life-alerts",
  "/life-helper",
  "/life-helper/join",
  "/life-helper/manage",
  "/play",
  "/reminders",
  "/resources",
  "/search",
  "/train-deals",
  "/walk",
  "/tools/area-compare",
  "/tools/exchange",
  "/tools/holidays",
  "/tools/life-checklist",
  "/tools/living-cost",
  "/tools/procedure-navigator",
  "/tools/rent",
  "/tools/salary",
  "/tools/train-status",
  "/tools/visa-reminder",
  "/tools/weather",
];

const routesToPrefetch = [...new Set([...primaryRoutes, ...secondaryRoutes])];

type MaybeNavigatorConnection = Navigator & {
  connection?: {
    effectiveType?: string;
    saveData?: boolean;
  };
};

export function RoutePrefetcher() {
  const router = useRouter();

  useEffect(() => {
    if (shouldSkipPrefetch()) return;
    let cancelled = false;
    const timers: number[] = [];

    const prefetchRoute = (href: string, delay: number) => {
      const timer = window.setTimeout(() => {
        if (!cancelled) router.prefetch(href);
      }, delay);
      timers.push(timer);
    };

    primaryRoutes.forEach((href, index) => prefetchRoute(href, 450 + index * 140));
    secondaryRoutes.forEach((href, index) => prefetchRoute(href, 1500 + index * 220));

    const idleId = requestIdle(() => {
      routesToPrefetch.forEach((href, index) => prefetchRoute(href, index * 80));
    }, 9000);

    return () => {
      cancelled = true;
      timers.forEach((timer) => window.clearTimeout(timer));
      cancelIdle(idleId);
    };
  }, [router]);

  return null;
}

function shouldSkipPrefetch() {
  if (typeof navigator === "undefined") return true;
  const connection = (navigator as MaybeNavigatorConnection).connection;
  if (connection?.saveData) return true;
  return connection?.effectiveType === "slow-2g" || connection?.effectiveType === "2g";
}

function requestIdle(callback: () => void, timeout: number) {
  if ("requestIdleCallback" in window) {
    return window.requestIdleCallback(callback, { timeout });
  }
  return globalThis.setTimeout(callback, timeout);
}

function cancelIdle(id: ReturnType<typeof requestIdle>) {
  if ("cancelIdleCallback" in window) {
    window.cancelIdleCallback(Number(id));
    return;
  }
  globalThis.clearTimeout(id);
}
