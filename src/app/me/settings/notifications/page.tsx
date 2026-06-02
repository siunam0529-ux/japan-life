"use client";

import { Bell, CloudRain, Recycle, TrainFront } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { BackButton } from "@/components/BackButton";
import { CollapsiblePanel } from "@/components/CollapsiblePanel";
import { getNotificationPermission, isNotificationSupported, registerServiceWorker, requestNotificationPermission, showBrowserNotification } from "@/lib/browserNotifications";
import { getDefaultNotificationSettings, getNotificationSettings, saveNotificationSettings } from "@/lib/notificationSettings";
import type { NotificationCategory, NotificationSettings } from "@/types/notificationSettings";

const visibleNotificationCategories = ["garbage", "weather", "rail"] as const satisfies readonly NotificationCategory[];
type VisibleNotificationCategory = (typeof visibleNotificationCategories)[number];

const text = {
  activeTime: "通知时间段",
  activeTimeEnd: "结束",
  activeTimeStart: "开始",
  categoryDescriptions: {
    garbage: "根据你在日历里设置的垃圾日，前一晚通知。默认 21:00，可以自己改时间。",
    rail: "常用线路发生延误、停运、恢复运行等异常时，在设定时间段内尽量第一时间提醒。",
    weather: "一小时后有雨，或者突然开始下雨时，在设定时间段内尽量第一时间提醒。",
  },
  categoryLabels: {
    garbage: "明天垃圾通知",
    rail: "电车通知",
    weather: "天气通知",
  },
  description: "只保留最常用的手机通知：明天垃圾通知、天气通知和电车通知。需要先允许浏览器通知权限。",
  iphoneTip: "iPhone 使用手机通知时，建议先将 Japan Life 添加到主屏幕。",
  notificationDenied: "通知权限已被拒绝，请在浏览器或系统设置中重新开启。",
  notificationGranted: "已允许",
  notificationPrompt: "未开启",
  notificationStatus: "权限状态",
  notificationUnsupported: "当前浏览器不支持手机通知",
  notifyEnable: "开启手机通知",
  notifyMaster: "启用手机弹窗通知",
  off: "关闭",
  on: "开启",
  realtimeRule: "实时触发",
  testNotification: "发送测试通知",
  testNotificationSent: "测试手机通知已发送。",
  time: "通知时间",
  timingHints: {
    garbage: "前一晚提醒",
    rail: "常用线路异常时通知",
    weather: "一小时后有雨 / 突然下雨时通知",
  },
  title: "手机弹窗通知",
};

export default function NotificationSettingsPage() {
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

          <CollapsiblePanel className="mt-3 rounded-2xl border-slate-200 p-3 shadow-none" contentClassName="mt-3 grid gap-3" summary={`${visibleNotificationCategories.filter((category) => notificationSettings.categories[category]).length}/${visibleNotificationCategories.length}`} title="提醒类别">
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
