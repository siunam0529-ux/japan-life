"use client";

import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { routePreviousKey } from "@/components/RouteHistory";

export function getCurrentRoute() {
  if (typeof window === "undefined") return "";
  return `${window.location.pathname}${window.location.search}`;
}

export function getBackTarget(fallbackHref = "/") {
  if (typeof window === "undefined") return fallbackHref;

  const params = new URLSearchParams(window.location.search);
  const from = params.get("from");
  const currentRoute = getCurrentRoute();
  if (from && from.startsWith("/") && !from.startsWith("//") && from !== currentRoute) return from;

  const previousRoute = window.sessionStorage.getItem(routePreviousKey);
  if (previousRoute && previousRoute !== currentRoute) return previousRoute;

  return fallbackHref;
}

export function goBack(router: AppRouterInstance, fallbackHref = "/") {
  if (typeof window === "undefined") return;

  const target = getBackTarget(fallbackHref);
  if (target !== fallbackHref || window.history.length <= 1) {
    router.push(target);
    return;
  }

  router.back();
}

export function withBackFrom(href: string) {
  if (typeof window === "undefined") return href;
  const separator = href.includes("?") ? "&" : "?";
  return `${href}${separator}from=${encodeURIComponent(getCurrentRoute())}`;
}
