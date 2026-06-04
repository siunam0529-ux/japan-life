"use client";

import type { CommunityRepositoryResult, GetCommunityPostsOptions } from "@/lib/community/repository";
import { getCommunityLikeIds, getCommunityPosts, getNotifications } from "@/lib/community/repository";
import type { CommunityNotification, CommunityPost, CommunityViewLocale } from "@/lib/community/types";
import { fetchLifeHelperApplications, fetchLifeHelperJoinApplications, fetchLifeHelperProviders, fetchLifeHelperRequests, type LifeHelperProvider } from "@/lib/lifeHelper/api";
import type { LifeHelperBusinessApplication, LifeHelperPersonalApplication } from "@/lib/lifeHelper/join";
import type { LifeHelperApplication, LifeHelperRequest } from "@/lib/lifeHelper/types";
import { getCurrentMessageUser, listMyConversations, shouldUseRealMessageAuth } from "@/lib/messages/api";
import type { ConversationListItem } from "@/lib/messages/types";
import { fetchExchangeRates, getEmptyExchangeRates, type ExchangeRatesResult } from "@/lib/api/exchange";
import { fetchJapaneseHolidays, type HolidayApiResult } from "@/lib/api/holidays";
import { getTokyoDateTimeString } from "@/lib/utils/format";
import { fetchOdptTrainStatusLines, type OdptClientLine } from "@/lib/trainStatus/odptClient";
import { fetchWeatherForecast, getWeatherLocation, getWeatherLocationFromSettings } from "@/lib/weather";
import type { BenefitRecord } from "@/lib/benefits/types";
import type { TokyoStationApiResponse } from "@/lib/stations/types";
import type { WeatherForecast, WeatherLocation } from "@/types/weather";

type CacheEntry<T> = {
  promise?: Promise<T>;
  updatedAt: number;
  value?: T;
};

type StoredCacheEntry<T> = {
  updatedAt: number;
  value: T;
};

type StoredCommunityFeedWarmCache = Omit<CommunityFeedWarmCache, "likeIds"> & {
  likeIds: string[];
};

type StoredUserSettings = Parameters<typeof getWeatherLocationFromSettings>[0];

export type NotificationWarmCache = {
  applications: LifeHelperApplication[];
  businessApplications: LifeHelperBusinessApplication[];
  communityNotifications: CommunityNotification[];
  communityUserId: string;
  conversationError: string;
  conversations: ConversationListItem[];
  helpers: LifeHelperPersonalApplication[];
  requests: LifeHelperRequest[];
  supabaseCommunityEnabled: boolean;
};

export type LifeHelperWarmCache = {
  applications: LifeHelperApplication[];
  businessApplications: LifeHelperBusinessApplication[];
  helpers: LifeHelperPersonalApplication[];
  providers: LifeHelperProvider[];
  requests: LifeHelperRequest[];
};

export type TrainStatusWarmCache = {
  lines: OdptClientLine[];
  source: "fallback" | "odpt";
};

export type FriendlyShopWarmResponse = {
  items?: unknown[];
};

export type RecommendedAppsWarmResponse = {
  items?: unknown[];
};

type CommunityFeedWarmCache = {
  likeIds: Set<string>;
  posts: CommunityRepositoryResult<CommunityPost[]>;
};

export const appPreloadStoragePrefix = "japan-life:preload-cache:";
export const appPreloadCacheChangeEvent = "japan-life:preload-cache-change";

const appPreloadMemoryTtlMs = 30 * 60 * 1000;
const appPreloadStorageTtlMs = 6 * 60 * 60 * 1000;
const dailyDataStorageTtlMs = 24 * 60 * 60 * 1000;
const fastChangingDataMemoryTtlMs = 60 * 1000;
const fastChangingDataStorageTtlMs = 10 * 60 * 1000;
const routePreloadDelayMs = 90;
// New user-facing routes must be added here by default. See docs/preload-cache-policy.md.
const routePreloadHrefs = [
  "/",
  "/about",
  "/account",
  "/account/password",
  "/admin",
  "/admin/benefits",
  "/admin/community",
  "/admin/community/check",
  "/admin/community/stats",
  "/admin/content",
  "/admin/feedback",
  "/admin/life-helper",
  "/admin/stores/hotpepper-import",
  "/app-review",
  "/apps",
  "/areas",
  "/benefits",
  "/claim",
  "/claim/hotpepper",
  "/community",
  "/community/all",
  "/community/all/new",
  "/community/me",
  "/community/new",
  "/contact",
  "/data-status",
  "/disclaimer",
  "/favorites",
  "/feedback",
  "/food",
  "/forgot-password",
  "/home-tools",
  "/life-alerts",
  "/life-helper",
  "/life-helper/join",
  "/life-helper/join/business",
  "/life-helper/join/helper",
  "/life-helper/manage",
  "/login",
  "/me",
  "/me/settings",
  "/me/settings/notifications",
  "/me/settings/permissions",
  "/me/settings/privacy",
  "/me/settings/storage",
  "/messages",
  "/notifications",
  "/onboarding",
  "/places",
  "/play",
  "/privacy",
  "/reminders",
  "/reset-password",
  "/resources",
  "/search",
  "/signup",
  "/terms",
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
  "/train-deals",
  "/walk",
];

const cache = new Map<string, CacheEntry<unknown>>();

export function getCachedCommunityFeed(locale: CommunityViewLocale) {
  return getCached<CommunityFeedWarmCache>(communityFeedCacheKey(locale), reviveCommunityFeed);
}

export function getCachedCommunityPost(postId: string) {
  return getCached<CommunityPost>(communityPostCacheKey(postId));
}

export function rememberCommunityPosts(posts: CommunityPost[]) {
  posts.forEach((post) => rememberCommunityPost(post));
}

export function rememberCommunityPost(post: CommunityPost) {
  const key = communityPostCacheKey(post.id);
  cache.set(key, { updatedAt: Date.now(), value: post });
  writeStoredCache(key, post);
}

export function warmCommunityFeed(locale: CommunityViewLocale = "all") {
  return remember(
    communityFeedCacheKey(locale),
    async () => {
      const [posts, likes] = await Promise.all([
        getCommunityPosts({ limit: 80, locale } satisfies GetCommunityPostsOptions),
        getCommunityLikeIds(),
      ]);
      rememberCommunityPosts(posts.data);
      return { likeIds: likes.data, posts };
    },
    {
      revive: reviveCommunityFeed,
      serialize: serializeCommunityFeed,
    },
  );
}

export function getCachedNotifications() {
  return getCached<NotificationWarmCache>(notificationsCacheKey);
}

export function warmNotifications() {
  return remember(notificationsCacheKey, async () => {
    const currentUser = await getCurrentMessageUser();
    if (shouldUseRealMessageAuth() && currentUser.isMock) {
      return emptyNotificationWarmCache("");
    }

    const [notificationResult, conversationResult, lifeHelperResult] = await Promise.all([
      getNotifications(currentUser.id),
      withWarmTimeout(listMyConversations(), { data: [], error: "", source: "fallback" as const }),
      warmLifeHelperData(),
    ]);

    return {
      applications: lifeHelperResult.applications,
      businessApplications: lifeHelperResult.businessApplications,
      communityNotifications: notificationResult.data,
      communityUserId: currentUser.id,
      conversationError: conversationResult.error,
      conversations: conversationResult.data ?? [],
      helpers: lifeHelperResult.helpers,
      requests: lifeHelperResult.requests,
      supabaseCommunityEnabled: notificationResult.source === "supabase",
    };
  });
}

export function getCachedLifeHelperData() {
  return getCached<LifeHelperWarmCache>(lifeHelperCacheKey);
}

export function warmLifeHelperData() {
  return remember(lifeHelperCacheKey, async () => {
    const [requests, applications, providers, joins] = await Promise.all([
      withWarmTimeout(fetchLifeHelperRequests(), []),
      withWarmTimeout(fetchLifeHelperApplications(), []),
      withWarmTimeout(fetchLifeHelperProviders(), []),
      withWarmTimeout(fetchLifeHelperJoinApplications(), { business: [], helpers: [] }),
    ]);
    return {
      applications,
      businessApplications: joins.business,
      helpers: joins.helpers,
      providers,
      requests,
    };
  });
}

export function getCachedExchangeRates() {
  return getCached<ExchangeRatesResult>(exchangeRatesCacheKey, undefined, {
    memoryTtlMs: fastChangingDataMemoryTtlMs,
    storageTtlMs: fastChangingDataStorageTtlMs,
  });
}

export function warmExchangeRates() {
  return remember(exchangeRatesCacheKey, () => withWarmTimeout(fetchExchangeRates(), getEmptyExchangeRates("warm timeout")), {
    memoryTtlMs: fastChangingDataMemoryTtlMs,
    storageTtlMs: fastChangingDataStorageTtlMs,
  });
}

export function getCachedTrainStatus() {
  return getCached<TrainStatusWarmCache>(trainStatusCacheKey, undefined, {
    memoryTtlMs: fastChangingDataMemoryTtlMs,
    storageTtlMs: fastChangingDataStorageTtlMs,
  });
}

export function warmTrainStatus() {
  return remember(trainStatusCacheKey, fetchOdptTrainStatusLines, {
    memoryTtlMs: fastChangingDataMemoryTtlMs,
    storageTtlMs: fastChangingDataStorageTtlMs,
  });
}

export function getCachedBenefitsData() {
  return getCached<{ items: BenefitRecord[] }>(benefitsCacheKey);
}

export function warmBenefitsData() {
  return warmApiJson<{ items: BenefitRecord[] }>(benefitsCacheKey, "/api/benefits", { items: [] });
}

export function getCachedFriendlyShopsData() {
  return getCached<FriendlyShopWarmResponse>(friendlyShopsCacheKey);
}

export function warmFriendlyShopsData() {
  return warmApiJson<FriendlyShopWarmResponse>(friendlyShopsCacheKey, "/api/friendly-shops", { items: [] });
}

export function getCachedRecommendedAppsData() {
  return getCached<RecommendedAppsWarmResponse>(recommendedAppsCacheKey, undefined, {
    storageTtlMs: dailyDataStorageTtlMs,
  });
}

export function warmRecommendedAppsData() {
  return warmApiJson<RecommendedAppsWarmResponse>(recommendedAppsCacheKey, "/api/recommended-apps/", { items: [] }, {
    storageTtlMs: dailyDataStorageTtlMs,
  });
}

export function getCachedHolidays() {
  return getCached<HolidayApiResult>(holidaysCacheKey);
}

export function warmHolidays() {
  return remember(holidaysCacheKey, () => withWarmTimeout(fetchJapaneseHolidays(), {
    fallback: true,
    items: [],
    source: "local-reference" as const,
    updatedAt: getTokyoDateTimeString(),
  }));
}

export function getCachedWeatherForecast(location: WeatherLocation) {
  return getCached<WeatherForecast>(weatherCacheKey(location), undefined, {
    memoryTtlMs: fastChangingDataMemoryTtlMs,
    storageTtlMs: fastChangingDataStorageTtlMs,
  });
}

export function warmWeatherForecast(location: WeatherLocation) {
  return remember(weatherCacheKey(location), () => withWarmTimeout(fetchWeatherForecast(location), null as WeatherForecast | null), {
    memoryTtlMs: fastChangingDataMemoryTtlMs,
    storageTtlMs: fastChangingDataStorageTtlMs,
  });
}

export function getCachedStationsData(version = stationsApiVersion) {
  return getCached<TokyoStationApiResponse>(stationsCacheKey(version));
}

export function warmStationsData(version = stationsApiVersion, forceRefresh = false) {
  const requestUrl = `/api/stations/odpt/?version=${version}${forceRefresh ? "&refresh=1" : ""}`;
  return warmApiJson<TokyoStationApiResponse>(stationsCacheKey(version), requestUrl, {
    cached: true,
    fetchedAt: "",
    source: "cache",
    stations: [],
  });
}

export function preloadAppRoutes() {
  if (typeof window === "undefined") return;
  routePreloadHrefs.forEach((href, index) => {
    window.setTimeout(() => preloadRoute(href), routePreloadDelayMs * (index + 1));
  });
}

export function warmCoreAppData() {
  // New shared/list data sources should warm here unless they are protected admin data or mutation-only APIs.
  void warmCommunityFeed("all");
  void warmNotifications();
  void warmLifeHelperData();
  void warmExchangeRates();
  void warmTrainStatus();
  void warmBenefitsData();
  void warmFriendlyShopsData();
  void warmRecommendedAppsData();
  void warmHolidays();
  void warmWeatherData();
  void warmStationsDataWithVersionCheck();
}

export function clearAppPreloadCache() {
  cache.clear();
  if (typeof window === "undefined") return;
  getPreloadStorageKeys().forEach((key) => window.localStorage.removeItem(key));
  dispatchAppPreloadCacheChange();
}

export function clearCommunityFeedPreloadCache() {
  clearPreloadCacheByKey((key) => key.startsWith("community-feed:"));
}

export function clearCommunityPostPreloadCache(postId: string) {
  clearPreloadCacheByKey((key) => key === communityPostCacheKey(postId) || key.startsWith("community-feed:"));
}

export function clearLifeHelperPreloadCache() {
  clearPreloadCacheByKey((key) => key === lifeHelperCacheKey || key === notificationsCacheKey);
}

export function clearApiPreloadCache(match?: (key: string) => boolean) {
  clearPreloadCacheByKey((key) => key.startsWith("api:") && (!match || match(key)));
}

export function getAppPreloadCacheStats() {
  if (typeof window === "undefined") return { bytes: 0, count: 0 };
  return getPreloadStorageKeys().reduce(
    (stats, key) => {
      const value = window.localStorage.getItem(key) ?? "";
      return {
        bytes: stats.bytes + getTextBytes(key) + getTextBytes(value),
        count: stats.count + 1,
      };
    },
    { bytes: 0, count: 0 },
  );
}

export function dispatchAppPreloadCacheChange() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(appPreloadCacheChangeEvent));
}

function communityFeedCacheKey(locale: CommunityViewLocale) {
  return `community-feed:${locale}`;
}

function communityPostCacheKey(postId: string) {
  return `community-post:${postId}`;
}

const exchangeRatesCacheKey = "exchange-rates:main";
const benefitsCacheKey = "api:benefits";
const friendlyShopsCacheKey = "api:friendly-shops";
const holidaysCacheKey = "api:holidays";
const lifeHelperCacheKey = "life-helper:main";
const notificationsCacheKey = "notifications:main";
const recommendedAppsCacheKey = "api:recommended-apps";
const trainStatusCacheKey = "train-status:odpt";
const stationsApiVersion = "odpt-hotpepper-v5";

function getCached<T>(
  key: string,
  revive?: (value: unknown) => T | null,
  options: { memoryTtlMs?: number; storageTtlMs?: number } = {},
) {
  const memory = getMemoryCache<T>(key, options.memoryTtlMs);
  if (memory) return memory;
  const stored = readStoredCache(key, revive, options.storageTtlMs);
  if (!stored) return undefined;
  cache.set(key, { updatedAt: stored.updatedAt, value: stored.value });
  return stored.value;
}

function getMemoryCache<T>(key: string, memoryTtlMs = appPreloadMemoryTtlMs) {
  const entry = cache.get(key) as CacheEntry<T> | undefined;
  if (!entry?.value) return undefined;
  if (Date.now() - entry.updatedAt > memoryTtlMs) return undefined;
  return entry.value;
}

function remember<T>(
  key: string,
  loader: () => Promise<T>,
  options: {
    memoryTtlMs?: number;
    revive?: (value: unknown) => T | null;
    serialize?: (value: T) => unknown;
    storageTtlMs?: number;
  } = {},
) {
  const current = cache.get(key) as CacheEntry<T> | undefined;
  const memoryValue = getMemoryCache<T>(key, options.memoryTtlMs);
  if (memoryValue) return Promise.resolve(memoryValue);
  if (current?.promise) return current.promise;

  const stored = readStoredCache<T>(key, options.revive, options.storageTtlMs);
  const entry: CacheEntry<T> = current ?? {
    updatedAt: stored?.updatedAt ?? 0,
    value: stored?.value,
  };
  entry.promise = loader()
    .then((value) => {
      entry.value = value;
      entry.updatedAt = Date.now();
      writeStoredCache(key, value, options.serialize);
      return value;
    })
    .finally(() => {
      entry.promise = undefined;
    });
  cache.set(key, entry as CacheEntry<unknown>);
  return entry.promise;
}

function warmApiJson<T>(
  key: string,
  url: string,
  fallback: T,
  options: { memoryTtlMs?: number; storageTtlMs?: number } = {},
) {
  return remember(key, async () => {
    const response = await withWarmTimeout(fetch(url), null as Response | null);
    if (!response?.ok) return fallback;
    return await response.json().catch(() => fallback) as T;
  }, options);
}

function readStoredCache<T>(key: string, revive?: (value: unknown) => T | null, storageTtlMs = appPreloadStorageTtlMs): StoredCacheEntry<T> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(toStorageKey(key));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return null;
    const record = parsed as Partial<StoredCacheEntry<unknown>>;
    if (typeof record.updatedAt !== "number" || !("value" in record)) return null;
    if (Date.now() - record.updatedAt > storageTtlMs) return null;
    const revived = revive ? revive(record.value) : record.value as T;
    if (!revived) return null;
    return { updatedAt: record.updatedAt, value: revived };
  } catch {
    return null;
  }
}

function writeStoredCache<T>(key: string, value: T, serialize?: (value: T) => unknown) {
  if (typeof window === "undefined") return;
  try {
    const payload: StoredCacheEntry<unknown> = {
      updatedAt: Date.now(),
      value: serialize ? serialize(value) : value,
    };
    window.localStorage.setItem(toStorageKey(key), JSON.stringify(payload));
    dispatchAppPreloadCacheChange();
  } catch {
    // Smoothness should not depend on localStorage always accepting larger caches.
  }
}

function clearPreloadCacheByKey(match: (key: string) => boolean) {
  [...cache.keys()].filter(match).forEach((key) => cache.delete(key));
  if (typeof window !== "undefined") {
    getPreloadStorageKeys()
      .filter((key) => match(key.slice(appPreloadStoragePrefix.length)))
      .forEach((key) => window.localStorage.removeItem(key));
  }
  dispatchAppPreloadCacheChange();
}

function serializeCommunityFeed(value: CommunityFeedWarmCache): StoredCommunityFeedWarmCache {
  return {
    likeIds: [...value.likeIds],
    posts: value.posts,
  };
}

function reviveCommunityFeed(value: unknown): CommunityFeedWarmCache | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Partial<StoredCommunityFeedWarmCache>;
  if (!record.posts || !Array.isArray(record.likeIds)) return null;
  return {
    likeIds: new Set(record.likeIds.filter((item): item is string => typeof item === "string")),
    posts: record.posts,
  };
}

function preloadRoute(href: string) {
  if (document.head.querySelector(`link[data-japan-life-preload="route"][href="${href}"]`)) return;
  const link = document.createElement("link");
  link.href = href;
  link.rel = "prefetch";
  link.setAttribute("data-japan-life-preload", "route");
  document.head.appendChild(link);
}

function warmStationsDataWithVersionCheck() {
  if (typeof window === "undefined") return;
  const storedVersion = window.localStorage.getItem("japan-life:stations-api-version") ?? "";
  window.setTimeout(() => {
    void warmStationsData(stationsApiVersion, storedVersion !== stationsApiVersion).catch(() => undefined);
  }, 1000);
}

function warmWeatherData() {
  const settings = readUserSettings();
  const settingsLocation = getWeatherLocationFromSettings(settings);
  const location = settingsLocation ?? getWeatherLocation("tokyo");
  if (!location) return;
  void warmWeatherForecast(location);
}

function weatherCacheKey(location: WeatherLocation) {
  return `api:weather:${location.id}:${location.latitude.toFixed(3)},${location.longitude.toFixed(3)}`;
}

function stationsCacheKey(version: string) {
  return `api:stations:${version}`;
}

function readUserSettings(): StoredUserSettings | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem("japan-life:user-settings");
    return raw ? JSON.parse(raw) as StoredUserSettings : null;
  } catch {
    return null;
  }
}

function emptyNotificationWarmCache(communityUserId: string): NotificationWarmCache {
  return {
    applications: [],
    businessApplications: [],
    communityNotifications: [],
    communityUserId,
    conversationError: "",
    conversations: [],
    helpers: [],
    requests: [],
    supabaseCommunityEnabled: false,
  };
}

async function withWarmTimeout<T>(promise: Promise<T>, fallback: T) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((resolve) => {
        timer = setTimeout(() => resolve(fallback), 2500);
      }),
    ]);
  } catch {
    return fallback;
  } finally {
    if (timer) clearTimeout(timer);
  }
}

function getPreloadStorageKeys() {
  if (typeof window === "undefined") return [];
  const keys: string[] = [];
  for (let index = 0; index < window.localStorage.length; index += 1) {
    const key = window.localStorage.key(index);
    if (key?.startsWith(appPreloadStoragePrefix)) keys.push(key);
  }
  return keys;
}

function toStorageKey(key: string) {
  return `${appPreloadStoragePrefix}${key}`;
}

function getTextBytes(value: string) {
  try {
    return new Blob([value]).size;
  } catch {
    return value.length * 2;
  }
}
