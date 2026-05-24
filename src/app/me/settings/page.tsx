"use client";

import { Bell, CloudRain, Download, Recycle, RotateCcw, Settings, TrainFront, Upload } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { BackButton } from "@/components/BackButton";
import { useLanguage } from "@/hooks/useLanguage";
import { useUserSettings } from "@/hooks/useUserSettings";
import { getNotificationPermission, isNotificationSupported, registerServiceWorker, requestNotificationPermission, showBrowserNotification } from "@/lib/browserNotifications";
import { clearJapanLifeData, exportJapanLifeData, getJapanLifeStorageKeys, importJapanLifeData } from "@/lib/localDataBackup";
import { getDefaultNotificationSettings, getNotificationSettings, saveNotificationSettings } from "@/lib/notificationSettings";
import type { NotificationCategory, NotificationSettings } from "@/types/notificationSettings";

const visibleNotificationCategories = ["garbage", "weather", "rail"] as const satisfies readonly NotificationCategory[];
type VisibleNotificationCategory = (typeof visibleNotificationCategories)[number];

const copy = {
  "zh-CN": {
    back: "返回",
    title: "App 设置",
    descriptionTitle: "设置说明",
    description: "这里管理手机弹窗通知和本机数据。通知只用于生活提醒，不会发送广告通知。",
    notificationTitle: "手机弹窗通知",
    notificationDescription: "只保留最常用的手机通知：明天垃圾通知、天气通知和电车通知。需要先允许浏览器通知权限。",
    notificationStatus: "权限状态",
    notificationUnsupported: "当前浏览器不支持手机通知",
    notificationGranted: "已允许",
    notificationDenied: "通知权限已被拒绝，请在浏览器或系统设置中重新开启。",
    notificationPrompt: "未开启",
    notifyEnable: "开启手机通知",
    notifyMaster: "启用手机弹窗通知",
    iphoneTip: "iPhone 使用手机通知时，建议先将 Japan Life 添加到主屏幕。",
    activeTime: "提醒时间段",
    activeTimeEnd: "结束",
    activeTimeStart: "开始",
    realtimeRule: "实时触发",
    time: "通知时间",
    categoryLabels: {
      garbage: "明天垃圾通知",
      rail: "电车通知",
      weather: "天气通知",
    },
    categoryDescriptions: {
      garbage: "根据你在日历里设置的垃圾日，前一晚通知。默认 21:00，可以自己改时间。",
      rail: "你设置的常用线路发生延误、停运、恢复运行等异常时，在设定时间段内尽量第一时间弹窗提醒。",
      weather: "如果一小时后预计下雨，或现在突然出现无预警降雨，会在设定时间段内尽量第一时间弹窗提醒。",
    },
    timingHints: {
      garbage: "前一晚提醒",
      rail: "常用线路异常时通知",
      weather: "一小时后有雨 / 突然下雨时通知",
    },
    on: "开启",
    off: "关闭",
    testNotification: "发送测试通知",
    testNotificationSent: "测试手机通知已发送。",
    dataTitle: "本机数据",
    dataDescription: "导出、导入或清除本机保存的 Japan Life 数据。结构已为未来 API 同步预留。",
    exportData: "导出数据",
    importData: "导入数据",
    clear: "清除本机数据",
    clearConfirm: "再次点击确认清除",
    clearDone: "已清除本机数据",
    exportDone: "数据已导出",
    importDone: "数据已导入",
    importError: "导入失败：请确认 JSON 格式和 schemaVersion。",
    resetHelp: "只会操作 Japan Life 白名单数据，不会写入未知 localStorage key。",
  },
  "zh-TW": {
    back: "返回",
    title: "App 設定",
    descriptionTitle: "設定說明",
    description: "這裡管理手機彈窗通知和本機資料。通知只用於生活提醒，不會發送廣告通知。",
    notificationTitle: "手機彈窗通知",
    notificationDescription: "只保留最常用的手機通知：明天垃圾通知、天氣通知和電車通知。需要先允許瀏覽器通知權限。",
    notificationStatus: "權限狀態",
    notificationUnsupported: "目前瀏覽器不支援手機通知",
    notificationGranted: "已允許",
    notificationDenied: "通知權限已被拒絕，請在瀏覽器或系統設定中重新開啟。",
    notificationPrompt: "未開啟",
    notifyEnable: "開啟手機通知",
    notifyMaster: "啟用手機彈窗通知",
    iphoneTip: "iPhone 使用手機通知時，建議先將 Japan Life 加入主畫面。",
    activeTime: "提醒時間段",
    activeTimeEnd: "結束",
    activeTimeStart: "開始",
    realtimeRule: "即時觸發",
    time: "通知時間",
    categoryLabels: {
      garbage: "明天垃圾通知",
      rail: "電車通知",
      weather: "天氣通知",
    },
    categoryDescriptions: {
      garbage: "根據你在日曆裡設定的垃圾日，前一晚通知。預設 21:00，可以自己改時間。",
      rail: "你設定的常用路線發生延誤、停駛、恢復運行等異常時，會在設定時間段內盡量第一時間彈窗提醒。",
      weather: "如果一小時後預計下雨，或現在突然出現無預警降雨，會在設定時間段內盡量第一時間彈窗提醒。",
    },
    timingHints: {
      garbage: "前一晚提醒",
      rail: "常用路線異常時通知",
      weather: "一小時後有雨 / 突然下雨時通知",
    },
    on: "開啟",
    off: "關閉",
    testNotification: "發送測試通知",
    testNotificationSent: "測試手機通知已發送。",
    dataTitle: "本機資料",
    dataDescription: "匯出、匯入或清除本機保存的 Japan Life 資料。結構已為未來 API 同步預留。",
    exportData: "匯出資料",
    importData: "匯入資料",
    clear: "清除本機資料",
    clearConfirm: "再次點擊確認清除",
    clearDone: "已清除本機資料",
    exportDone: "資料已匯出",
    importDone: "資料已匯入",
    importError: "匯入失敗：請確認 JSON 格式和 schemaVersion。",
    resetHelp: "只會操作 Japan Life 白名單資料，不會寫入未知 localStorage key。",
  },
  ja: {
    back: "戻る",
    title: "App 設定",
    descriptionTitle: "設定について",
    description: "ここではスマホのポップアップ通知と端末内データを管理します。通知は生活リマインダー用で、広告通知は送りません。",
    notificationTitle: "スマホ通知",
    notificationDescription: "よく使う通知だけ残しています：明日のごみ、天気、電車。先にブラウザ通知の許可が必要です。",
    notificationStatus: "権限状態",
    notificationUnsupported: "現在のブラウザはスマホ通知に対応していません",
    notificationGranted: "許可済み",
    notificationDenied: "通知権限が拒否されています。ブラウザまたはシステム設定で再度有効にしてください。",
    notificationPrompt: "未設定",
    notifyEnable: "スマホ通知を有効にする",
    notifyMaster: "スマホ通知を有効にする",
    iphoneTip: "iPhone でスマホ通知を使う場合は、Japan Life を先にホーム画面へ追加することをおすすめします。",
    activeTime: "通知時間帯",
    activeTimeEnd: "終了",
    activeTimeStart: "開始",
    realtimeRule: "リアルタイム判定",
    time: "通知時間",
    categoryLabels: {
      garbage: "明日のごみ通知",
      rail: "電車通知",
      weather: "天気通知",
    },
    categoryDescriptions: {
      garbage: "カレンダーで設定したごみの日を前夜に通知します。初期設定は 21:00 で、時間は変更できます。",
      rail: "登録したよく使う路線に遅延、運休、運転再開などの異常が出たとき、設定した時間帯内でできるだけ早く通知します。",
      weather: "1時間後に雨が予想される場合、または予告なく雨が降り始めた場合、設定した時間帯内でできるだけ早く通知します。",
    },
    timingHints: {
      garbage: "前夜に通知",
      rail: "よく使う路線の異常時に通知",
      weather: "1時間後の雨 / 急な雨で通知",
    },
    on: "オン",
    off: "オフ",
    testNotification: "テスト通知を送信",
    testNotificationSent: "テスト通知を送信しました。",
    dataTitle: "端末内データ",
    dataDescription: "端末内に保存された Japan Life データを書き出し、読み込み、削除できます。将来の API 同期にも使いやすい構造です。",
    exportData: "データを書き出す",
    importData: "データを読み込む",
    clear: "端末内データを削除",
    clearConfirm: "もう一度押して削除",
    clearDone: "端末内データを削除しました",
    exportDone: "データを書き出しました",
    importDone: "データを読み込みました",
    importError: "読み込みに失敗しました。JSON と schemaVersion を確認してください。",
    resetHelp: "Japan Life の許可されたデータのみ操作し、不明な localStorage key は書き込みません。",
  },
} as const;

export default function AppSettingsPage() {
  const { language } = useLanguage();
  const text = copy[language];
  const { clearSettings } = useUserSettings();
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(() => getDefaultNotificationSettings());
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | "unsupported">("unsupported");
  const [notificationMessage, setNotificationMessage] = useState("");
  const [dataMessage, setDataMessage] = useState("");
  const [confirmingClear, setConfirmingClear] = useState(false);
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

  const handleClear = () => {
    if (!confirmingClear) {
      setConfirmingClear(true);
      setDataMessage(text.clearConfirm);
      return;
    }
    clearJapanLifeData();
    clearSettings();
    setNotificationSettings(getNotificationSettings());
    setConfirmingClear(false);
    setDataMessage(text.clearDone);
  };

  const handleExportData = () => {
    const data = exportJapanLifeData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `japan-life-backup-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    setConfirmingClear(false);
    setDataMessage(text.exportDone);
  };

  const handleImportData = async (file: File | null) => {
    if (!file) return;
    try {
      const content = await file.text();
      importJapanLifeData(JSON.parse(content));
      setNotificationSettings(getNotificationSettings());
      setConfirmingClear(false);
      setDataMessage(text.importDone);
    } catch {
      setDataMessage(text.importError);
    }
  };

  const handleTestNotification = async () => {
    const sent = await showBrowserNotification("Japan Life", {
      badge: "/icon-192.png",
      body: text.testNotificationSent,
      data: { category: "weather", url: "/me/settings" },
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
        <header className="mb-4 flex items-center justify-between">
          <BackButton fallbackHref="/me" label={text.back} />
          <span className="rounded-full bg-white px-4 py-2 text-xs font-black text-[#2563EB] shadow-sm">Japan Life</span>
        </header>

        <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_18px_45px_rgba(37,99,235,0.10)]">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-[#2563EB]">
            <Settings className="h-7 w-7" />
          </span>
          <p className="mt-4 text-sm font-black text-[#2563EB]">{text.descriptionTitle}</p>
          <h1 className="mt-1 text-3xl font-black tracking-tight">{text.title}</h1>
          <p className="mt-3 text-sm font-bold leading-6 text-[#475569]">{text.description}</p>
        </section>

        <section className="mt-4 rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm" id="home-tools">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-[#2563EB]">
              <Bell className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <h2 className="text-lg font-black">{text.notificationTitle}</h2>
              <p className="mt-1 text-xs font-bold leading-5 text-[#64748B]">{text.notificationDescription}</p>
            </div>
          </div>

          {isIOS && <p className="mt-3 rounded-2xl bg-amber-50 px-3 py-2 text-xs font-black leading-5 text-amber-800">{text.iphoneTip}</p>}

          <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-black">{text.notifyMaster}</p>
                <p className="mt-1 text-xs font-bold text-[#64748B]">{text.notificationStatus}: {permissionLabel}</p>
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

          <div className="mt-3 grid gap-3">
            {visibleNotificationCategories.map((category) => (
              <NotificationCategoryRow
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
                activeTimeEndLabel={text.activeTimeEnd}
                activeTimeLabel={text.activeTime}
                activeTimeStartLabel={text.activeTimeStart}
                settings={notificationSettings}
                timeLabel={text.time}
                timingHint={text.timingHints[category]}
                triggerLabel={category === "garbage" ? undefined : text.realtimeRule}
              />
            ))}
          </div>

          {notificationMessage && <p className="mt-3 rounded-2xl bg-blue-50 px-3 py-2 text-xs font-black leading-5 text-[#1D4ED8]">{notificationMessage}</p>}

          <button className="jl-action-primary mt-4 w-full rounded-2xl px-4 py-3 text-sm font-black disabled:opacity-50" disabled={notificationPermission !== "granted"} onClick={handleTestNotification} type="button">
            {text.testNotification}
          </button>
        </section>

        <section className="mt-4 rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-lg font-black">{text.dataTitle}</h2>
          <p className="mt-2 text-xs font-bold leading-5 text-[#64748B]">{text.dataDescription}</p>
          <div className="mt-3 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-[11px] font-bold leading-5 text-[#64748B]">
            {getJapanLifeStorageKeys().join(" / ")}
          </div>
          <div className="mt-4 grid gap-2">
            <button className="jl-action-primary flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-black" onClick={handleExportData} type="button">
              <Download className="h-4 w-4" />
              {text.exportData}
            </button>
            <label className="jl-action-secondary flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-black">
              <Upload className="h-4 w-4" />
              {text.importData}
              <input className="hidden" accept="application/json,.json" onChange={(event) => handleImportData(event.target.files?.[0] ?? null)} type="file" />
            </label>
          </div>
          <p className="mt-3 text-xs font-bold leading-5 text-[#64748B]">{text.resetHelp}</p>
          {dataMessage && <p className="mt-3 rounded-2xl bg-blue-50 px-3 py-2 text-xs font-black leading-5 text-[#1D4ED8]">{dataMessage}</p>}
          <button className={`mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-sm font-black ${confirmingClear ? "border-red-200 bg-red-50 text-red-700" : "border-slate-200 bg-white text-slate-700"}`} onClick={handleClear} type="button">
            <RotateCcw className="h-4 w-4" />
            {confirmingClear ? text.clearConfirm : text.clear}
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
              {triggerLabel ? `${triggerLabel} · ${timingHint}` : timingHint}
            </p>
          </div>
        </div>
        <button className={`selection-chip shrink-0 rounded-full px-3 py-1.5 text-xs font-black ${enabled ? "is-selected" : ""}`} onClick={() => onToggle(!enabled)} type="button" disabled={disabled}>
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
