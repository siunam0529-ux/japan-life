"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";

const currentKey = "japan-life:route-current";
const previousKey = "japan-life:route-previous";

function RouteHistoryInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams.toString();
  const route = `${pathname}${search ? `?${search}` : ""}`;

  useEffect(() => {
    const current = window.sessionStorage.getItem(currentKey);
    if (current && current !== route) {
      window.sessionStorage.setItem(previousKey, current);
    }
    window.sessionStorage.setItem(currentKey, route);
  }, [route]);

  return null;
}

export function RouteHistory() {
  return (
    <Suspense fallback={null}>
      <RouteHistoryInner />
    </Suspense>
  );
}

export { currentKey as routeCurrentKey, previousKey as routePreviousKey };
