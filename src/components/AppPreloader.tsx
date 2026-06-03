"use client";

import { useEffect } from "react";
import { preloadAppRoutes, warmCoreAppData } from "@/lib/appPreload";

export function AppPreloader() {
  useEffect(() => {
    const run = () => {
      preloadAppRoutes();
      warmCoreAppData();
    };

    if ("requestIdleCallback" in window) {
      const id = window.requestIdleCallback(run, { timeout: 1200 });
      return () => window.cancelIdleCallback(id);
    }

    const id = globalThis.setTimeout(run, 300);
    return () => globalThis.clearTimeout(id);
  }, []);

  return null;
}
