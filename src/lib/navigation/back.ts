"use client";

import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { routePreviousKey } from "@/components/RouteHistory";

export function getCurrentRoute() {
  if (typeof window === "undefined") return "";
  return `${window.location.pathname}${window.location.search}`;
}

function getRoutePath(route: string) {
  try {
    return new URL(route, "http://japan-life.local").pathname;
  } catch {
    return route.split("?")[0] || "/";
  }
}

function isAuthRoute(route: string) {
  const path = getRoutePath(route);
  return path === "/login" || path === "/signup" || path === "/forgot-password" || path === "/reset-password";
}

function needsSignedInSession(route: string) {
  const path = getRoutePath(route);
  return path === "/me" || path === "/account" || path.startsWith("/account/");
}

function isSafeInternalRoute(route: string, currentRoute: string) {
  return route.startsWith("/") && !route.startsWith("//") && route !== currentRoute;
}

function canUseBackTarget(route: string, currentRoute: string) {
  if (!isSafeInternalRoute(route, currentRoute)) return false;
  if (isAuthRoute(currentRoute) && needsSignedInSession(route)) return false;
  return true;
}

export function getBackTarget(fallbackHref = "/") {
  if (typeof window === "undefined") return fallbackHref;

  const params = new URLSearchParams(window.location.search);
  const from = params.get("from");
  const currentRoute = getCurrentRoute();
  if (from && canUseBackTarget(from, currentRoute)) return from;

  const previousRoute = window.sessionStorage.getItem(routePreviousKey);
  if (previousRoute && canUseBackTarget(previousRoute, currentRoute)) return previousRoute;

  return fallbackHref;
}

function getSafePreviousRoute() {
  if (typeof window === "undefined") return "";
  const currentRoute = getCurrentRoute();
  const previousRoute = window.sessionStorage.getItem(routePreviousKey) || "";
  return previousRoute && canUseBackTarget(previousRoute, currentRoute) ? previousRoute : "";
}

export function goBack(router: AppRouterInstance, fallbackHref = "/") {
  if (typeof window === "undefined") return;

  const currentRoute = getCurrentRoute();
  const target = getBackTarget(fallbackHref);
  if (target !== fallbackHref) {
    router.replace(target);
    return;
  }

  if (isAuthRoute(currentRoute)) {
    router.replace(fallbackHref);
    return;
  }

  if (window.history.length > 1) {
    router.back();
    return;
  }

  router.replace(fallbackHref);
}

export function withBackFrom(href: string, options: { preferPrevious?: boolean } = {}) {
  if (typeof window === "undefined") return href;
  const currentRoute = getCurrentRoute();
  const previousRoute = getSafePreviousRoute();
  let from = currentRoute;

  try {
    const url = new URL(href, window.location.origin);
    const redirectTarget = url.searchParams.get("next") || url.searchParams.get("redirect") || "";
    if (options.preferPrevious || redirectTarget === window.location.pathname) {
      from = previousRoute || currentRoute;
    }
  } catch {
    if (options.preferPrevious) from = previousRoute || currentRoute;
  }

  if (isAuthRoute(href) && needsSignedInSession(from)) from = previousRoute || "/";

  const separator = href.includes("?") ? "&" : "?";
  return `${href}${separator}from=${encodeURIComponent(from)}`;
}
