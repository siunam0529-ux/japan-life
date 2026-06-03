"use client";

import { Bell, CloudRain, Recycle, TrainFront } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { BackButton } from "@/components/BackButton";
import { CollapsiblePanel } from "@/components/CollapsiblePanel";
import { useLanguage } from "@/hooks/useLanguage";
import { getNotificationPermission, isNotificationSupported, registerServiceWorker, requestNotificationPermission, showBrowserNotification } from "@/lib/browserNotifications";
import { getDefaultNotificationSettings, getNotificationSettings, saveNotificationSettings } from "@/lib/notificationSettings";
import type { NotificationCategory, NotificationSettings } from "@/types/notificationSettings";

const visibleNotificationCategories = ["garbage", "weather", "rail"] as const satisfies readonly NotificationCategory[];
type VisibleNotificationCategory = (typeof visibleNotificationCategories)[number];

const notificationCopy = {
  "zh-CN": {
    activeTime: "\u901a\u77e5\u65f6\u95f4\u6bb5",
    activeTimeEnd: "\u7ed3\u675f",
    activeTimeStart: "\u5f00\u59cb",
    categoriesTitle: "\u63d0\u9192\u7c7b\u522b",
    categoryDescriptions: {
      garbage: "\u6839\u636e\u4f60\u5728\u65e5\u5386\u91cc\u8bbe\u7f6e\u7684\u5783\u573e\u65e5\uff0c\u524d\u4e00\u665a\u901a\u77e5\u3002\u9ed8\u8ba4 21:00\uff0c\u53ef\u4ee5\u81ea\u5df1\u6539\u65f6\u95f4\u3002",
      rail: "\u5e38\u7528\u7ebf\u8def\u53d1\u751f\u5ef6\u8bef\u3001\u505c\u8fd0\u3001\u6062\u590d\u8fd0\u884c\u7b49\u5f02\u5e38\u65f6\uff0c\u5728\u8bbe\u5b9a\u65f6\u95f4\u6bb5\u5185\u5c3d\u91cf\u7b2c\u4e00\u65f6\u95f4\u63d0\u9192\u3002",
      weather: "\u4e00\u5c0f\u65f6\u540e\u6709\u96e8\uff0c\u6216\u8005\u7a81\u7136\u5f00\u59cb\u4e0b\u96e8\u65f6\uff0c\u5728\u8bbe\u5b9a\u65f6\u95f4\u6bb5\u5185\u5c3d\u91cf\u7b2c\u4e00\u65f6\u95f4\u63d0\u9192\u3002",
    },
    categoryLabels: { garbage: "\u660e\u5929\u5783\u573e\u901a\u77e5", rail: "\u7535\u8f66\u901a\u77e5", weather: "\u5929\u6c14\u901a\u77e5" },
    description: "\u53ea\u4fdd\u7559\u6700\u5e38\u7528\u7684\u624b\u673a\u901a\u77e5\uff1a\u660e\u5929\u5783\u573e\u901a\u77e5\u3001\u5929\u6c14\u901a\u77e5\u548c\u7535\u8f66\u901a\u77e5\u3002\u9700\u8981\u5148\u5141\u8bb8\u6d4f\u89c8\u5668\u901a\u77e5\u6743\u9650\u3002",
    iphoneTip: "iPhone \u4f7f\u7528\u624b\u673a\u901a\u77e5\u65f6\uff0c\u5efa\u8bae\u5148\u5c06 Japan Life \u6dfb\u52a0\u5230\u4e3b\u5c4f\u5e55\u3002",
    notificationDenied: "\u901a\u77e5\u6743\u9650\u5df2\u88ab\u62d2\u7edd\uff0c\u8bf7\u5728\u6d4f\u89c8\u5668\u6216\u7cfb\u7edf\u8bbe\u7f6e\u4e2d\u91cd\u65b0\u5f00\u542f\u3002",
    notificationGranted: "\u5df2\u5141\u8bb8",
    notificationPrompt: "\u672a\u5f00\u542f",
    notificationStatus: "\u6743\u9650\u72b6\u6001",
    notificationUnsupported: "\u5f53\u524d\u6d4f\u89c8\u5668\u4e0d\u652f\u6301\u624b\u673a\u901a\u77e5",
    notifyEnable: "\u5f00\u542f\u624b\u673a\u901a\u77e5",
    notifyMaster: "\u542f\u7528\u624b\u673a\u5f39\u7a97\u901a\u77e5",
    off: "\u5173\u95ed",
    on: "\u5f00\u542f",
    realtimeRule: "\u5b9e\u65f6\u89e6\u53d1",
    testNotification: "\u53d1\u9001\u6d4b\u8bd5\u901a\u77e5",
    testNotificationSent: "\u6d4b\u8bd5\u624b\u673a\u901a\u77e5\u5df2\u53d1\u9001\u3002",
    time: "\u901a\u77e5\u65f6\u95f4",
    timingHints: { garbage: "\u524d\u4e00\u665a\u63d0\u9192", rail: "\u5e38\u7528\u7ebf\u8def\u5f02\u5e38\u65f6\u901a\u77e5", weather: "\u4e00\u5c0f\u65f6\u540e\u6709\u96e8 / \u7a81\u7136\u4e0b\u96e8\u65f6\u901a\u77e5" },
    title: "\u624b\u673a\u5f39\u7a97\u901a\u77e5",
  },
  "zh-TW": {
    activeTime: "\u901a\u77e5\u6642\u9593\u6bb5", activeTimeEnd: "\u7d50\u675f", activeTimeStart: "\u958b\u59cb", categoriesTitle: "\u63d0\u9192\u985e\u5225",
    categoryDescriptions: {
      garbage: "\u6839\u64da\u4f60\u5728\u65e5\u66c6\u88e1\u8a2d\u5b9a\u7684\u5783\u573e\u65e5\uff0c\u524d\u4e00\u665a\u901a\u77e5\u3002\u9810\u8a2d 21:00\uff0c\u53ef\u4ee5\u81ea\u5df1\u6539\u6642\u9593\u3002",
      rail: "\u5e38\u7528\u7dda\u8def\u767c\u751f\u5ef6\u8aa4\u3001\u505c\u904b\u3001\u6062\u5fa9\u904b\u884c\u7b49\u7570\u5e38\u6642\uff0c\u5728\u8a2d\u5b9a\u6642\u9593\u6bb5\u5167\u76e1\u91cf\u7b2c\u4e00\u6642\u9593\u63d0\u9192\u3002",
      weather: "\u4e00\u5c0f\u6642\u5f8c\u6709\u96e8\uff0c\u6216\u8005\u7a81\u7136\u958b\u59cb\u4e0b\u96e8\u6642\uff0c\u5728\u8a2d\u5b9a\u6642\u9593\u6bb5\u5167\u76e1\u91cf\u7b2c\u4e00\u6642\u9593\u63d0\u9192\u3002",
    },
    categoryLabels: { garbage: "\u660e\u5929\u5783\u573e\u901a\u77e5", rail: "\u96fb\u8eca\u901a\u77e5", weather: "\u5929\u6c23\u901a\u77e5" },
    description: "\u53ea\u4fdd\u7559\u6700\u5e38\u7528\u7684\u624b\u6a5f\u901a\u77e5\uff1a\u660e\u5929\u5783\u573e\u901a\u77e5\u3001\u5929\u6c23\u901a\u77e5\u548c\u96fb\u8eca\u901a\u77e5\u3002\u9700\u8981\u5148\u5141\u8a31\u700f\u89bd\u5668\u901a\u77e5\u6b0a\u9650\u3002",
    iphoneTip: "iPhone \u4f7f\u7528\u624b\u6a5f\u901a\u77e5\u6642\uff0c\u5efa\u8b70\u5148\u5c07 Japan Life \u52a0\u5230\u4e3b\u756b\u9762\u3002",
    notificationDenied: "\u901a\u77e5\u6b0a\u9650\u5df2\u88ab\u62d2\u7d55\uff0c\u8acb\u5728\u700f\u89bd\u5668\u6216\u7cfb\u7d71\u8a2d\u5b9a\u4e2d\u91cd\u65b0\u958b\u555f\u3002",
    notificationGranted: "\u5df2\u5141\u8a31", notificationPrompt: "\u672a\u958b\u555f", notificationStatus: "\u6b0a\u9650\u72c0\u614b", notificationUnsupported: "\u7576\u524d\u700f\u89bd\u5668\u4e0d\u652f\u6301\u624b\u6a5f\u901a\u77e5",
    notifyEnable: "\u958b\u555f\u624b\u6a5f\u901a\u77e5", notifyMaster: "\u555f\u7528\u624b\u6a5f\u5f48\u7a97\u901a\u77e5", off: "\u95dc\u9589", on: "\u958b\u555f", realtimeRule: "\u5373\u6642\u89f8\u767c",
    testNotification: "\u767c\u9001\u6e2c\u8a66\u901a\u77e5", testNotificationSent: "\u6e2c\u8a66\u624b\u6a5f\u901a\u77e5\u5df2\u767c\u9001\u3002", time: "\u901a\u77e5\u6642\u9593",
    timingHints: { garbage: "\u524d\u4e00\u665a\u63d0\u9192", rail: "\u5e38\u7528\u7dda\u8def\u7570\u5e38\u6642\u901a\u77e5", weather: "\u4e00\u5c0f\u6642\u5f8c\u6709\u96e8 / \u7a81\u7136\u4e0b\u96e8\u6642\u901a\u77e5" },
    title: "\u624b\u6a5f\u5f48\u7a97\u901a\u77e5",
  },
  ja: {
    activeTime: "\u901a\u77e5\u6642\u9593\u5e2f", activeTimeEnd: "\u7d42\u4e86", activeTimeStart: "\u958b\u59cb", categoriesTitle: "\u901a\u77e5\u30ab\u30c6\u30b4\u30ea",
    categoryDescriptions: { garbage: "\u30ab\u30ec\u30f3\u30c0\u30fc\u306b\u8a2d\u5b9a\u3057\u305f\u3054\u307f\u306e\u65e5\u3092\u524d\u65e5\u591c\u306b\u901a\u77e5\u3057\u307e\u3059\u3002\u521d\u671f\u5024\u306f 21:00 \u3067\u3059\u3002", rail: "\u3088\u304f\u4f7f\u3046\u8def\u7dda\u3067\u9045\u5ef6\u30fb\u904b\u4f11\u30fb\u904b\u8ee2\u518d\u958b\u306a\u3069\u304c\u3042\u308b\u3068\u3001\u8a2d\u5b9a\u6642\u9593\u5185\u306b\u901a\u77e5\u3057\u307e\u3059\u3002", weather: "1\u6642\u9593\u5f8c\u306b\u96e8\u304c\u964d\u308b\u5834\u5408\u3084\u6025\u306b\u96e8\u304c\u964d\u308a\u59cb\u3081\u305f\u5834\u5408\u3001\u8a2d\u5b9a\u6642\u9593\u5185\u306b\u901a\u77e5\u3057\u307e\u3059\u3002" },
    categoryLabels: { garbage: "\u660e\u65e5\u306e\u3054\u307f\u901a\u77e5", rail: "\u96fb\u8eca\u901a\u77e5", weather: "\u5929\u6c17\u901a\u77e5" },
    description: "\u3088\u304f\u4f7f\u3046\u30b9\u30de\u30db\u901a\u77e5\u3060\u3051\u3092\u6b8b\u3057\u307e\u3059\u3002\u3054\u307f\u3001\u5929\u6c17\u3001\u96fb\u8eca\u901a\u77e5\u3092\u4f7f\u3046\u306b\u306f\u30d6\u30e9\u30a6\u30b6\u901a\u77e5\u306e\u8a31\u53ef\u304c\u5fc5\u8981\u3067\u3059\u3002",
    iphoneTip: "iPhone \u3067\u901a\u77e5\u3092\u4f7f\u3046\u5834\u5408\u306f\u3001Japan Life \u3092\u5148\u306b\u30db\u30fc\u30e0\u753b\u9762\u306b\u8ffd\u52a0\u3059\u308b\u306e\u304c\u304a\u3059\u3059\u3081\u3067\u3059\u3002",
    notificationDenied: "\u901a\u77e5\u6a29\u9650\u304c\u62d2\u5426\u3055\u308c\u3066\u3044\u307e\u3059\u3002\u30d6\u30e9\u30a6\u30b6\u307e\u305f\u306f\u7aef\u672b\u8a2d\u5b9a\u3067\u6709\u52b9\u306b\u3057\u3066\u304f\u3060\u3055\u3044\u3002",
    notificationGranted: "\u8a31\u53ef\u6e08\u307f", notificationPrompt: "\u672a\u8a31\u53ef", notificationStatus: "\u6a29\u9650\u72b6\u614b", notificationUnsupported: "\u73fe\u5728\u306e\u30d6\u30e9\u30a6\u30b6\u306f\u30b9\u30de\u30db\u901a\u77e5\u306b\u5bfe\u5fdc\u3057\u3066\u3044\u307e\u305b\u3093",
    notifyEnable: "\u30b9\u30de\u30db\u901a\u77e5\u3092\u6709\u52b9\u5316", notifyMaster: "\u30b9\u30de\u30db\u901a\u77e5\u3092\u4f7f\u3046", off: "\u30aa\u30d5", on: "\u30aa\u30f3", realtimeRule: "\u30ea\u30a2\u30eb\u30bf\u30a4\u30e0",
    testNotification: "\u30c6\u30b9\u30c8\u901a\u77e5\u3092\u9001\u4fe1", testNotificationSent: "\u30c6\u30b9\u30c8\u901a\u77e5\u3092\u9001\u4fe1\u3057\u307e\u3057\u305f\u3002", time: "\u901a\u77e5\u6642\u9593",
    timingHints: { garbage: "\u524d\u65e5\u591c\u306b\u901a\u77e5", rail: "\u3088\u304f\u4f7f\u3046\u8def\u7dda\u306e\u7570\u5e38\u6642", weather: "1\u6642\u9593\u5f8c\u306e\u96e8 / \u6025\u306a\u96e8" },
    title: "\u30b9\u30de\u30db\u901a\u77e5",
  },
};

export default function NotificationSettingsPage() {
  const { language } = useLanguage();
  const text = notificationCopy[language];
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(() => getDefaultNotificationSettings());
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | "unsupported">("unsupported");
  const [notificationMessage, setNotificationMessage] = useState("");
  const isIOS = typeof navigator !== "undefined" && /iPad|iPhone|iPod/.test(navigator.userAgent);

  useEffect(() => {
    setNotificationSettings(getNotificationSettings());
    setNotificationPermission(getNotificationPermission());
  }, []);

  const updateNotificationSettings = (next: NotificationSettings) => {
    setNotificationSettings(saveNotificationSettings(next));
    setNotificationMessage("");
  };

  const handleNotificationMasterToggle = () => {
    updateNotificationSettings({ ...notificationSettings, enabled: !notificationSettings.enabled });
  };

  const handleEnableNotifications = async () => {
    if (!isNotificationSupported()) {
      setNotificationPermission("unsupported");
      return;
    }

    await registerServiceWorker();
    const permission = await requestNotificationPermission();
    setNotificationPermission(permission);

    if (permission === "granted") {
      updateNotificationSettings({ ...notificationSettings, enabled: true });
      setNotificationMessage("");
    } else if (permission === "denied") {
      setNotificationMessage(text.notificationDenied);
    }
  };

  const updateCategory = (category: NotificationCategory, enabled: boolean) => {
    updateNotificationSettings({
      ...notificationSettings,
      categories: { ...notificationSettings.categories, [category]: enabled },
      timings: {
        ...notificationSettings.timings,
        [category]: { ...notificationSettings.timings[category], enabled },
      },
    });
  };

  const updateGarbageNotificationTime = (time: string) => {
    updateNotificationSettings({
      ...notificationSettings,
      timings: {
        ...notificationSettings.timings,
        garbage: { ...notificationSettings.timings.garbage, daysBefore: 1, time },
      },
    });
  };

  const updateNotificationTimeWindow = (category: "rail" | "weather", patch: { endTime?: string; startTime?: string }) => {
    updateNotificationSettings({
      ...notificationSettings,
      timings: {
        ...notificationSettings.timings,
        [category]: { ...notificationSettings.timings[category], ...patch },
      },
    });
  };

  const handleTestNotification = async () => {
    const sent = await showBrowserNotification("Japan Life", {
      badge: "/icon-192.png",
      body: text.testNotificationSent,
      data: { category: "weather", url: "/me/settings/notifications" },
      icon: "/icon-192.png",
      tag: "japan-life-test-notification",
    });
    if (sent) setNotificationMessage(text.testNotificationSent);
  };

  const permissionLabel =
    notificationPermission === "unsupported"
      ? text.notificationUnsupported
      : notificationPermission === "granted"
        ? text.notificationGranted
        : notificationPermission === "denied"
          ? text.notificationDenied
          : text.notificationPrompt;

  return (
    <main className="min-h-screen bg-[#F6FAFF] text-[#0F172A]">
      <div className="mx-auto min-h-screen max-w-[430px] bg-[#F6FAFF] px-4 pb-24 pt-5">
        <header className="mb-4 grid grid-cols-[auto_1fr_auto] items-center">
          <BackButton fallbackHref="/me/settings" label="" />
          <h1 className="text-center text-[20px] font-black tracking-normal">{text.title}</h1>
          <span className="h-10 w-10" />
        </header>

        <section className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-[0_18px_45px_rgba(37,99,235,0.10)]">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-[#2563EB]">
              <Bell className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <h2 className="text-lg font-black">{text.title}</h2>
              <p className="mt-1 text-xs font-bold leading-5 text-[#64748B]">{text.description}</p>
            </div>
          </div>

          {isIOS && <p className="mt-3 rounded-2xl bg-amber-50 px-3 py-2 text-xs font-black leading-5 text-amber-800">{text.iphoneTip}</p>}

          <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-black">{text.notifyMaster}</p>
                <p className="mt-1 text-xs font-bold text-[#64748B]">
                  {text.notificationStatus}: {permissionLabel}
                </p>
              </div>
              <button
                className={`selection-chip shrink-0 rounded-full px-3 py-2 text-xs font-black ${notificationSettings.enabled ? "is-selected" : ""}`}
                disabled={notificationPermission === "unsupported"}
                onClick={notificationPermission === "granted" ? handleNotificationMasterToggle : handleEnableNotifications}
                type="button"
              >
                {notificationSettings.enabled ? text.on : text.notifyEnable}
              </button>
            </div>
          </div>

          <CollapsiblePanel className="mt-3 rounded-2xl border-slate-200 p-3 shadow-none" contentClassName="mt-3 grid gap-3" summary={`${visibleNotificationCategories.filter((category) => notificationSettings.categories[category]).length}/${visibleNotificationCategories.length}`} title={text.categoriesTitle}>
            {visibleNotificationCategories.map((category) => (
              <NotificationCategoryRow
                activeTimeEndLabel={text.activeTimeEnd}
                activeTimeLabel={text.activeTime}
                activeTimeStartLabel={text.activeTimeStart}
                category={category}
                description={text.categoryDescriptions[category]}
                disabled={!notificationSettings.enabled || notificationPermission !== "granted"}
                icon={getNotificationCategoryIcon(category)}
                key={category}
                label={text.categoryLabels[category]}
                offLabel={text.off}
                onLabel={text.on}
                onToggle={(enabled) => updateCategory(category, enabled)}
                onUpdateTime={category === "garbage" ? updateGarbageNotificationTime : undefined}
                onUpdateTimeWindow={
                  category === "rail" || category === "weather"
                    ? (patch) => updateNotificationTimeWindow(category, patch)
                    : undefined
                }
                settings={notificationSettings}
                timeLabel={text.time}
                timingHint={text.timingHints[category]}
                triggerLabel={category === "garbage" ? undefined : text.realtimeRule}
              />
            ))}
          </CollapsiblePanel>

          {notificationMessage && <p className="mt-3 rounded-2xl bg-blue-50 px-3 py-2 text-xs font-black leading-5 text-[#1D4ED8]">{notificationMessage}</p>}

          <button className="jl-action-primary mt-4 w-full rounded-2xl px-4 py-3 text-sm font-black disabled:opacity-50" disabled={notificationPermission !== "granted"} onClick={handleTestNotification} type="button">
            {text.testNotification}
          </button>
        </section>
      </div>
    </main>
  );
}

function NotificationCategoryRow({
  activeTimeEndLabel,
  activeTimeLabel,
  activeTimeStartLabel,
  category,
  description,
  disabled,
  icon: Icon,
  label,
  offLabel,
  onLabel,
  onToggle,
  onUpdateTime,
  onUpdateTimeWindow,
  settings,
  timeLabel,
  timingHint,
  triggerLabel,
}: {
  activeTimeEndLabel: string;
  activeTimeLabel: string;
  activeTimeStartLabel: string;
  category: VisibleNotificationCategory;
  description: string;
  disabled: boolean;
  icon: LucideIcon;
  label: string;
  offLabel: string;
  onLabel: string;
  onToggle: (enabled: boolean) => void;
  onUpdateTime?: (time: string) => void;
  onUpdateTimeWindow?: (patch: { endTime?: string; startTime?: string }) => void;
  settings: NotificationSettings;
  timeLabel: string;
  timingHint: string;
  triggerLabel?: string;
}) {
  const enabled = settings.categories[category];
  const timing = settings.timings[category];

  return (
    <div className={`rounded-2xl border p-3 ${disabled ? "border-slate-200 bg-slate-50 opacity-70" : "border-slate-200 bg-white"}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 gap-2">
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#2563EB]">
            <Icon className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-black">{label}</p>
            <p className="mt-1 text-xs font-bold leading-5 text-[#64748B]">{description}</p>
            <p className="mt-2 inline-flex rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-black text-[#2563EB]">
              {triggerLabel ? `${triggerLabel} / ${timingHint}` : timingHint}
            </p>
          </div>
        </div>
        <button className={`selection-chip shrink-0 rounded-full px-3 py-1.5 text-xs font-black ${enabled ? "is-selected" : ""}`} disabled={disabled} onClick={() => onToggle(!enabled)} type="button">
          {enabled ? onLabel : offLabel}
        </button>
      </div>
      {onUpdateTime ? (
        <label className="mt-3 block rounded-2xl border border-slate-200 bg-white px-3 py-2">
          <span className="mb-1 block text-[11px] font-black text-[#64748B]">{timeLabel}</span>
          <input
            className="h-9 w-full bg-transparent text-sm font-black text-[#0F172A] outline-none disabled:text-slate-300"
            disabled={disabled || !enabled}
            onChange={(event) => onUpdateTime(event.target.value)}
            type="time"
            value={timing.time}
          />
        </label>
      ) : null}
      {onUpdateTimeWindow ? (
        <div className="mt-3 rounded-2xl border border-slate-200 bg-white px-3 py-2">
          <p className="mb-2 text-[11px] font-black text-[#64748B]">{activeTimeLabel}</p>
          <div className="grid grid-cols-2 gap-2">
            <label className="block">
              <span className="mb-1 block text-[10px] font-black text-[#64748B]">{activeTimeStartLabel}</span>
              <input
                className="h-9 w-full rounded-xl border border-slate-200 bg-white px-2 text-sm font-black text-[#0F172A] outline-none disabled:text-slate-300"
                disabled={disabled || !enabled}
                onChange={(event) => onUpdateTimeWindow({ startTime: event.target.value })}
                type="time"
                value={timing.startTime ?? "09:00"}
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-[10px] font-black text-[#64748B]">{activeTimeEndLabel}</span>
              <input
                className="h-9 w-full rounded-xl border border-slate-200 bg-white px-2 text-sm font-black text-[#0F172A] outline-none disabled:text-slate-300"
                disabled={disabled || !enabled}
                onChange={(event) => onUpdateTimeWindow({ endTime: event.target.value })}
                type="time"
                value={timing.endTime ?? "21:00"}
              />
            </label>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function getNotificationCategoryIcon(category: VisibleNotificationCategory) {
  switch (category) {
    case "garbage":
      return Recycle;
    case "weather":
      return CloudRain;
    case "rail":
      return TrainFront;
    default:
      return Bell;
  }
}
