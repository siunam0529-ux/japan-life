"use client";

import { CheckCircle2, Database, HardDrive, RefreshCw, Trash2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { BackButton } from "@/components/BackButton";
import { useLanguage } from "@/hooks/useLanguage";
import { appPreloadCacheChangeEvent, clearAppPreloadCache, getAppPreloadCacheStats } from "@/lib/appPreload";
import type { Language } from "@/lib/i18n/translations";

type StorageStats = {
  appCacheBytes: number;
  cacheCount: number;
  deviceQuotaBytes: number | null;
  deviceUsageBytes: number | null;
  localDataBytes: number;
  temporaryBytes: number;
};

const cacheKeyPrefixes = ["japan-life-weather-v2:", "japan-life-weather-v3:"];
const cacheKeys = ["japan-life:stations-api-version"];
const temporaryKeys = ["japan-life:recent", "japan-life-app-notification-read-ids", "japan-life-train-status-incidents"];
const temporarySessionKeys = ["japan-life:route-current", "japan-life:route-previous"];
const dataChangeEvents = [
  appPreloadCacheChangeEvent,
  "japan-life:recent-change",
  "japan-life:stations-cache-change",
  "japan-life-weather-cache-change",
  "japan-life-train-status-incidents-change",
];

const emptyStats: StorageStats = {
  appCacheBytes: 0,
  cacheCount: 0,
  deviceQuotaBytes: null,
  deviceUsageBytes: null,
  localDataBytes: 0,
  temporaryBytes: 0,
};

const storageCopy = {
  "zh-CN": {
    title: "存储空间",
    refresh: "刷新存储数据",
    used: "Japan Life 已用空间",
    appData: "App 数据",
    cache: "缓存",
    deviceAvailable: "设备可用",
    cacheDesc: (count: number) => `清理天气、站点、预热缓存和浏览器缓存。目前检测到 ${count} 个缓存项。`,
    cacheDone: "缓存已清理",
    temporary: "临时记录",
    temporaryDesc: "清理最近浏览、通知已读状态、电车临时记录和页面返回历史。",
    temporaryDone: "临时记录已清理",
    clearAll: "一键清理",
    clearAllDesc: "同时清理缓存和临时记录，不会删除账号、个人主页资料、收藏、提醒、设置或私信。",
    clearAllDone: "可清理空间已处理",
    retainedTitle: "保留的数据",
    retainedDesc: "账号登录、个人主页资料、收藏、提醒、首页工具、通知设置和私信数据会保留。这里清理的是可以重新生成的缓存和临时状态。",
    processing: "处理中",
    clear: "清理",
    unknown: "未知",
  },
  "zh-TW": {
    title: "儲存空間",
    refresh: "刷新儲存資料",
    used: "Japan Life 已用空間",
    appData: "App 資料",
    cache: "快取",
    deviceAvailable: "裝置可用",
    cacheDesc: (count: number) => `清理天氣、站點、預熱快取和瀏覽器快取。目前偵測到 ${count} 個快取項。`,
    cacheDone: "快取已清理",
    temporary: "暫存記錄",
    temporaryDesc: "清理最近瀏覽、通知已讀狀態、電車暫存記錄和頁面返回歷史。",
    temporaryDone: "暫存記錄已清理",
    clearAll: "一鍵清理",
    clearAllDesc: "同時清理快取和暫存記錄，不會刪除帳號、個人主頁資料、收藏、提醒、設定或私訊。",
    clearAllDone: "可清理空間已處理",
    retainedTitle: "保留的資料",
    retainedDesc: "帳號登入、個人主頁資料、收藏、提醒、首頁工具、通知設定和私訊資料會保留。這裡清理的是可以重新產生的快取和暫存狀態。",
    processing: "處理中",
    clear: "清理",
    unknown: "未知",
  },
  ja: {
    title: "ストレージ",
    refresh: "ストレージ情報を更新",
    used: "Japan Life 使用中の容量",
    appData: "App データ",
    cache: "キャッシュ",
    deviceAvailable: "端末の空き容量",
    cacheDesc: (count: number) => `天気、駅、事前読み込み、ブラウザーキャッシュを削除します。現在 ${count} 件のキャッシュ項目を検出しました。`,
    cacheDone: "キャッシュを削除しました",
    temporary: "一時記録",
    temporaryDesc: "最近見た項目、通知の既読状態、電車の一時記録、ページの戻り履歴を削除します。",
    temporaryDone: "一時記録を削除しました",
    clearAll: "まとめて削除",
    clearAllDesc: "キャッシュと一時記録をまとめて削除します。アカウント、プロフィール、保存、リマインダー、設定、メッセージは削除されません。",
    clearAllDone: "削除できる容量を処理しました",
    retainedTitle: "保持されるデータ",
    retainedDesc: "アカウントログイン、プロフィール、保存、リマインダー、ホームツール、通知設定、メッセージデータは保持されます。ここで削除するのは再生成できるキャッシュと一時状態です。",
    processing: "処理中",
    clear: "削除",
    unknown: "不明",
  },
} as const;
export default function StorageSettingsPage() {
  const { language } = useLanguage();
  const text = storageCopy[language];
  const [stats, setStats] = useState<StorageStats>(emptyStats);
  const [loading, setLoading] = useState(true);
  const [busyAction, setBusyAction] = useState("");
  const [message, setMessage] = useState("");

  const refreshStats = useCallback(async () => {
    setLoading(true);
    setStats(await readStorageStats());
    setLoading(false);
  }, []);

  useEffect(() => {
    void refreshStats();
  }, [refreshStats]);

  const usagePercent = useMemo(() => {
    if (!stats.deviceQuotaBytes || !stats.deviceUsageBytes) return 0;
    return Math.min(100, Math.max(0, (stats.deviceUsageBytes / stats.deviceQuotaBytes) * 100));
  }, [stats.deviceQuotaBytes, stats.deviceUsageBytes]);

  async function runAction(action: string, handler: () => Promise<void> | void, doneMessage: string) {
    setBusyAction(action);
    setMessage("");
    await handler();
    dispatchStorageEvents();
    await refreshStats();
    setBusyAction("");
    setMessage(doneMessage);
  }

  return (
    <main className="min-h-screen bg-[#F6FAFF] text-[#0F172A]">
      <div className="mx-auto min-h-screen max-w-[430px] bg-[#F6FAFF] px-4 pb-24 pt-5">
        <header className="mb-5 grid grid-cols-[auto_1fr_auto] items-center">
          <BackButton fallbackHref="/me/settings" label="" />
          <h1 className="text-center text-[20px] font-black tracking-normal">{text.title}</h1>
          <button className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#2563EB] shadow-sm ring-1 ring-slate-100 disabled:opacity-50" disabled={loading || Boolean(busyAction)} onClick={refreshStats} type="button" aria-label={text.refresh}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </header>

        <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_18px_45px_rgba(37,99,235,0.10)]">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-[#2563EB]">
              <HardDrive className="h-6 w-6" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-black text-[#2563EB]">{text.used}</p>
              <h2 className="mt-1 text-4xl font-black tracking-normal">{formatBytes(stats.localDataBytes + stats.appCacheBytes)}</h2>
            </div>
          </div>

          <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-[#2563EB]" style={{ width: `${usagePercent || Math.min(100, Math.max(3, (stats.localDataBytes + stats.appCacheBytes) / 1024 / 1024))}%` }} />
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            <StorageMetric dotClassName="bg-[#2563EB]" label={text.appData} value={formatBytes(stats.localDataBytes)} />
            <StorageMetric dotClassName="bg-[#F59E0B]" label={text.cache} value={formatBytes(stats.appCacheBytes)} />
            <StorageMetric dotClassName="bg-slate-200" label={text.deviceAvailable} value={formatAvailableDeviceBytes(stats.deviceUsageBytes, stats.deviceQuotaBytes, language)} />
          </div>
        </section>

        <section className="mt-5 overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-sm">
          <StorageAction actionText={text.clear} busy={busyAction === "cache"} busyText={text.processing} description={text.cacheDesc(stats.cacheCount)} disabled={Boolean(busyAction)} icon={Trash2} onClick={() => runAction("cache", clearAppCache, text.cacheDone)} title={text.cache} />
          <StorageAction actionText={text.clear} busy={busyAction === "temporary"} busyText={text.processing} description={text.temporaryDesc} disabled={Boolean(busyAction)} icon={Trash2} onClick={() => runAction("temporary", clearTemporaryRecords, text.temporaryDone)} title={text.temporary} />
          <StorageAction actionText={text.clear} busy={busyAction === "all"} busyText={text.processing} description={text.clearAllDesc} disabled={Boolean(busyAction)} icon={Database} onClick={() => runAction("all", clearCleanableStorage, text.clearAllDone)} title={text.clearAll} />
        </section>

        <section className="mt-4 rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm font-black">{text.retainedTitle}</p>
          <p className="mt-2 text-xs font-bold leading-5 text-[#64748B]">{text.retainedDesc}</p>
        </section>

        {message ? (
          <p className="mt-4 flex items-center gap-2 rounded-[22px] bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-700">
            <CheckCircle2 className="h-4 w-4" />
            {message}
          </p>
        ) : null}
      </div>
    </main>
  );
}

function StorageMetric({ dotClassName, label, value }: { dotClassName: string; label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 px-2 py-3">
      <p className="flex items-center justify-center gap-1.5 text-[11px] font-black text-[#64748B]">
        <span className={`h-2 w-2 rounded-full ${dotClassName}`} />
        {label}
      </p>
      <p className="mt-1 truncate text-sm font-black text-[#0F172A]">{value}</p>
    </div>
  );
}

function StorageAction({ actionText, busy, busyText, description, disabled, icon: Icon, onClick, title }: { actionText: string; busy: boolean; busyText: string; description: string; disabled: boolean; icon: LucideIcon; onClick: () => void; title: string }) {
  return (
    <button className="flex w-full items-center gap-3 border-b border-slate-100 px-4 py-4 text-left last:border-b-0 disabled:opacity-60" disabled={disabled} onClick={onClick} type="button">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
        {busy ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Icon className="h-4 w-4" />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[16px] font-black">{title}</span>
        <span className="mt-1 block text-xs font-bold leading-5 text-[#64748B]">{description}</span>
      </span>
      <span className="rounded-full border border-rose-200 px-3 py-1.5 text-xs font-black text-rose-600">{busy ? busyText : actionText}</span>
    </button>
  );
}

async function readStorageStats(): Promise<StorageStats> {
  if (typeof window === "undefined") return emptyStats;

  const [appCache, deviceEstimate] = await Promise.all([readCacheStorageStats(), readDeviceStorageEstimate()]);
  const preloadStats = getAppPreloadCacheStats();

  return {
    appCacheBytes: getStorageBytes((key) => isCacheStorageKey(key)) + appCache.bytes + preloadStats.bytes,
    cacheCount: appCache.count + preloadStats.count,
    deviceQuotaBytes: deviceEstimate.quota,
    deviceUsageBytes: deviceEstimate.usage,
    localDataBytes: getStorageBytes((key) => isJapanLifeLocalStorageKey(key)),
    temporaryBytes: getStorageBytes((key) => temporaryKeys.includes(key)),
  };
}

async function readCacheStorageStats() {
  if (typeof window === "undefined" || !("caches" in window)) return { bytes: 0, count: 0 };
  try {
    const names = await window.caches.keys();
    let bytes = 0;
    let count = 0;
    for (const name of names) {
      const cache = await window.caches.open(name);
      const requests = await cache.keys();
      count += requests.length;
      for (const request of requests) {
        const response = await cache.match(request);
        if (response) bytes += await getResponseBytes(response);
      }
    }
    return { bytes, count };
  } catch {
    return { bytes: 0, count: 0 };
  }
}

async function readDeviceStorageEstimate() {
  if (typeof navigator === "undefined" || !navigator.storage?.estimate) return { quota: null, usage: null };
  try {
    const estimate = await navigator.storage.estimate();
    return {
      quota: typeof estimate.quota === "number" ? estimate.quota : null,
      usage: typeof estimate.usage === "number" ? estimate.usage : null,
    };
  } catch {
    return { quota: null, usage: null };
  }
}

async function getResponseBytes(response: Response) {
  try {
    const clone = response.clone();
    const contentLength = clone.headers.get("content-length");
    if (contentLength && Number.isFinite(Number(contentLength))) return Number(contentLength);
    return (await clone.blob()).size;
  } catch {
    return 0;
  }
}

async function clearAppCache() {
  if (typeof window === "undefined") return;
  removeLocalStorageKeys((key) => isCacheStorageKey(key));
  clearAppPreloadCache();
  if ("caches" in window) {
    try {
      const names = await window.caches.keys();
      await Promise.all(names.map((name) => window.caches.delete(name)));
    } catch {
      // Browser cache deletion can fail in restricted webviews.
    }
  }
}

function clearTemporaryRecords() {
  if (typeof window === "undefined") return;
  removeLocalStorageKeys((key) => temporaryKeys.includes(key));
  temporarySessionKeys.forEach((key) => window.sessionStorage.removeItem(key));
}

async function clearCleanableStorage() {
  await clearAppCache();
  clearTemporaryRecords();
}

function removeLocalStorageKeys(match: (key: string) => boolean) {
  getLocalStorageKeys().filter(match).forEach((key) => window.localStorage.removeItem(key));
}

function getStorageBytes(match: (key: string) => boolean) {
  return getLocalStorageKeys().reduce((total, key) => {
    if (!match(key)) return total;
    const value = window.localStorage.getItem(key) ?? "";
    return total + getTextBytes(key) + getTextBytes(value);
  }, 0);
}

function getLocalStorageKeys() {
  if (typeof window === "undefined") return [];
  const keys: string[] = [];
  for (let index = 0; index < window.localStorage.length; index += 1) {
    const key = window.localStorage.key(index);
    if (key) keys.push(key);
  }
  return keys;
}

function isJapanLifeLocalStorageKey(key: string) {
  return key.startsWith("japan-life:") || key.startsWith("japan-life-") || key === "hasCompletedCommunityOnboarding" || key === "hasSkippedCommunityOnboarding";
}

function isCacheStorageKey(key: string) {
  return cacheKeys.includes(key) || cacheKeyPrefixes.some((prefix) => key.startsWith(prefix));
}

function getTextBytes(value: string) {
  try {
    return new Blob([value]).size;
  } catch {
    return value.length * 2;
  }
}

function formatAvailableDeviceBytes(usage: number | null, quota: number | null, language: Language) {
  if (!quota || usage === null) return storageCopy[language].unknown;
  return formatBytes(Math.max(0, quota - usage));
}

function formatBytes(bytes: number) {
  if (!bytes) return "0.0KB";
  const units = ["B", "KB", "MB", "GB"] as const;
  let value = bytes;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  return `${value.toFixed(unitIndex === 0 ? 0 : 1)}${units[unitIndex]}`;
}

function dispatchStorageEvents() {
  if (typeof window === "undefined") return;
  dataChangeEvents.forEach((eventName) => window.dispatchEvent(new Event(eventName)));
}

