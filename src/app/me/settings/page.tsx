"use client";

import { Bell, CalendarDays, CloudRain, CreditCard, Download, IdCard, Percent, ReceiptText, Recycle, RotateCcw, Settings, Store, TrainFront, Upload, WalletCards } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { BackButton } from "@/components/BackButton";
import { useLanguage } from "@/hooks/useLanguage";
import { useUserSettings } from "@/hooks/useUserSettings";
import { getNotificationPermission, isNotificationSupported, registerServiceWorker, requestNotificationPermission, showBrowserNotification } from "@/lib/browserNotifications";
import { clearJapanLifeData, exportJapanLifeData, getJapanLifeStorageKeys, importJapanLifeData } from "@/lib/localDataBackup";
import { getDefaultNotificationSettings, getNotificationSettings, saveNotificationSettings } from "@/lib/notificationSettings";
import type { NotificationCategory, NotificationSettings } from "@/types/notificationSettings";

const notificationCategories: NotificationCategory[] = [
  "weather",
  "rail",
  "garbage",
  "monthlyPayment",
  "holiday",
  "residenceCard",
  "calendarNote",
  "workHours",
  "salaryTax",
  "rent",
  "deals",
  "shopClaim",
];
const notificationDayLimits: Record<NotificationCategory, number> = {
  garbage: 2,
  monthlyPayment: 30,
  holiday: 7,
  residenceCard: 180,
  weather: 0,
  rail: 0,
  workHours: 0,
  salaryTax: 0,
  rent: 0,
  calendarNote: 30,
  deals: 0,
  shopClaim: 0,
};

const copy = {
  "zh-CN": {
    back: "返回",
    title: "App 设置",
    description: "管理手机通知和本机数据。",
    notificationTitle: "手机通知",
    notificationDescription: "统一管理天气、交通、垃圾日、缴费、日历、在留、工时和店铺审核等 App 内通知。不会发送广告通知。",
    notificationStatus: "权限状态",
    notificationUnsupported: "当前浏览器不支持",
    notificationGranted: "已允许",
    notificationDenied: "通知权限已被拒绝，请在浏览器或系统设置中重新开启。",
    notificationPrompt: "未开启",
    notificationDisabled: "未开启",
    notifyEnable: "开启手机通知",
    notifyMaster: "开启生活提醒通知",
    daysBefore: "提前",
    daysUnit: "天",
    time: "时间",
    testNotification: "发送测试通知",
    testNotificationSent: "测试通知已发送",
    iphoneTip: "iPhone 使用手机通知时，建议先将 Japan Life 添加到主屏幕。",
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
    categoryLabels: { garbage: "垃圾日提醒", monthlyPayment: "每月缴费提醒", holiday: "日本节日提醒", residenceCard: "在留卡期限提醒", weather: "天气提醒", rail: "电车延误提醒", workHours: "打工工时提醒", salaryTax: "收入 / 税线提醒", rent: "房租压力提醒", calendarNote: "日历备注提醒", deals: "优惠推荐提醒", shopClaim: "店铺申请审核提醒" },
  },
  "zh-TW": {
    back: "返回",
    title: "App 設定",
    description: "管理手機通知和本機資料。",
    notificationTitle: "手機通知",
    notificationDescription: "統一管理天氣、交通、垃圾日、繳費、日曆、在留、工時和店鋪審核等 App 內通知。不會發送廣告通知。",
    notificationStatus: "權限狀態",
    notificationUnsupported: "目前瀏覽器不支援",
    notificationGranted: "已允許",
    notificationDenied: "通知權限已被拒絕，請在瀏覽器或系統設定中重新開啟。",
    notificationPrompt: "未開啟",
    notificationDisabled: "未開啟",
    notifyEnable: "開啟手機通知",
    notifyMaster: "開啟生活提醒通知",
    daysBefore: "提前",
    daysUnit: "天",
    time: "時間",
    testNotification: "發送測試通知",
    testNotificationSent: "測試通知已發送",
    iphoneTip: "iPhone 使用手機通知時，建議先將 Japan Life 加入主畫面。",
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
    categoryLabels: { garbage: "垃圾日提醒", monthlyPayment: "每月繳費提醒", holiday: "日本節日提醒", residenceCard: "在留卡期限提醒", weather: "天氣提醒", rail: "電車延誤提醒", workHours: "打工工時提醒", salaryTax: "收入 / 稅線提醒", rent: "房租壓力提醒", calendarNote: "日曆備註提醒", deals: "優惠推薦提醒", shopClaim: "店鋪申請審核提醒" },
  },
  ja: {
    back: "戻る",
    title: "App 設定",
    description: "スマホ通知と端末内データを管理します。",
    notificationTitle: "スマホ通知",
    notificationDescription: "天気、交通、ごみ、支払い、カレンダー、在留、勤務時間、店舗審査などのApp内通知をまとめて管理します。広告通知は送りません。",
    notificationStatus: "権限状態",
    notificationUnsupported: "現在のブラウザは通知に対応していません",
    notificationGranted: "許可済み",
    notificationDenied: "通知権限が拒否されています。ブラウザまたはシステム設定で再度有効にしてください。",
    notificationPrompt: "未設定",
    notificationDisabled: "未設定",
    notifyEnable: "スマホ通知を有効にする",
    notifyMaster: "生活リマインダー通知を有効にする",
    daysBefore: "何日前",
    daysUnit: "日",
    time: "時間",
    testNotification: "テスト通知を送信",
    testNotificationSent: "テスト通知を送信しました",
    iphoneTip: "iPhone でスマホ通知を使う場合は、Japan Life を先にホーム画面へ追加することをおすすめします。",
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
    categoryLabels: { garbage: "ごみ収集日リマインダー", monthlyPayment: "毎月支払いリマインダー", holiday: "日本の祝日リマインダー", residenceCard: "在留カード期限リマインダー", weather: "天気リマインダー", rail: "電車遅延リマインダー", workHours: "勤務時間リマインダー", salaryTax: "収入 / 税ライン通知", rent: "家賃負担リマインダー", calendarNote: "カレンダーメモ通知", deals: "お得情報通知", shopClaim: "店舗申請審査通知" },
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
    const saved = saveNotificationSettings(next);
    setNotificationSettings(saved);
    setNotificationMessage("");
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
    } else if (permission === "denied") {
      setNotificationMessage(text.notificationDenied);
    }
  };

  const handleNotificationMasterToggle = () => {
    updateNotificationSettings({ ...notificationSettings, enabled: !notificationSettings.enabled });
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

  const updateTiming = (category: NotificationCategory, patch: Partial<NotificationSettings["timings"][NotificationCategory]>) => {
    const maxDays = notificationDayLimits[category];
    const daysBefore = patch.daysBefore;
    updateNotificationSettings({
      ...notificationSettings,
      timings: {
        ...notificationSettings.timings,
        [category]: {
          ...notificationSettings.timings[category],
          ...patch,
          daysBefore: typeof daysBefore === "number" ? Math.min(Math.max(0, daysBefore), maxDays) : notificationSettings.timings[category].daysBefore,
        },
      },
    });
  };

  const handleTestNotification = async () => {
    const sent = await showBrowserNotification("Japan Life 提醒测试", {
      body: "手机通知已成功开启。",
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      tag: "japan-life-test-notification",
      data: { url: "/reminders", category: "monthlyPayment" },
    });
    if (sent) setNotificationMessage(text.testNotificationSent);
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
      setNotificationPermission(getNotificationPermission());
      setConfirmingClear(false);
      setDataMessage(text.importDone);
    } catch {
      setDataMessage(text.importError);
    }
  };

  const permissionLabel =
    notificationPermission === "unsupported"
      ? text.notificationUnsupported
      : notificationPermission === "granted"
        ? text.notificationGranted
        : notificationPermission === "denied"
          ? text.notificationDenied
          : notificationSettings.enabled
            ? text.notificationDisabled
            : text.notificationPrompt;
  const notificationControlsDisabled = !notificationSettings.enabled;

  return (
    <main className="min-h-screen bg-[#f5f0e7] text-stone-950">
      <div className="mx-auto min-h-screen max-w-[430px] bg-[#fbf8f2] px-4 pb-8 pt-5 shadow-2xl shadow-stone-300/40">
        <header className="mb-4 flex items-center justify-between">
          <BackButton fallbackHref="/me" label={text.back} />
          <span className="rounded-full bg-emerald-50 px-4 py-2 text-xs font-black text-emerald-800">Japan Life</span>
        </header>

        <section className="rounded-[28px] bg-emerald-800 p-5 text-white shadow-[0_18px_45px_rgba(18,93,70,0.22)]">
          <Settings className="h-9 w-9" />
          <h1 className="mt-4 text-3xl font-black">{text.title}</h1>
          <p className="mt-2 text-sm font-semibold leading-6 text-emerald-50">{text.description}</p>
        </section>

        <section className="mt-4 rounded-[24px] bg-white p-4 shadow-sm" id="home-tools">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
              <Bell className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <h2 className="text-lg font-black">{text.notificationTitle}</h2>
              <p className="mt-1 text-xs font-bold leading-5 text-stone-500">{text.notificationDescription}</p>
            </div>
          </div>

          {isIOS && <p className="mt-3 rounded-2xl bg-amber-50 px-3 py-2 text-xs font-black leading-5 text-amber-800">{text.iphoneTip}</p>}

          <div className="mt-4 rounded-2xl bg-stone-50 p-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-black">{text.notifyMaster}</p>
                <p className="mt-1 text-xs font-bold text-stone-500">{text.notificationStatus}: {permissionLabel}</p>
              </div>
              <button className={`selection-chip shrink-0 rounded-full px-3 py-2 text-xs font-black ${notificationSettings.enabled ? "is-selected" : ""}`} onClick={notificationPermission === "granted" ? handleNotificationMasterToggle : handleEnableNotifications} type="button" disabled={notificationPermission === "unsupported"}>
                {notificationSettings.enabled ? "ON" : text.notifyEnable}
              </button>
            </div>
          </div>

          <div className="mt-3 grid gap-3">
            {notificationCategories.map((category) => (
              <NotificationCategoryRow
                category={category}
                daysBeforeLabel={text.daysBefore}
                daysUnitLabel={text.daysUnit}
                disabled={notificationControlsDisabled}
                icon={getNotificationCategoryIcon(category)}
                key={category}
                label={text.categoryLabels[category]}
                maxDays={notificationDayLimits[category]}
                onToggle={(enabled) => updateCategory(category, enabled)}
                onUpdateDays={(daysBefore) => updateTiming(category, { daysBefore })}
                onUpdateTime={(time) => updateTiming(category, { time })}
                settings={notificationSettings}
                timeLabel={text.time}
              />
            ))}
          </div>

          {notificationMessage && <p className="mt-3 rounded-2xl bg-emerald-50 px-3 py-2 text-xs font-black leading-5 text-emerald-800">{notificationMessage}</p>}

          <button className="jl-action-primary mt-4 w-full rounded-2xl px-4 py-3 text-sm" onClick={handleTestNotification} type="button" disabled={notificationPermission !== "granted"}>
            {text.testNotification}
          </button>
        </section>


        <section className="mt-4 rounded-[24px] bg-white p-4 shadow-sm">
          <h2 className="text-lg font-black">{text.dataTitle}</h2>
          <p className="mt-2 text-xs font-bold leading-5 text-stone-500">{text.dataDescription}</p>
          <div className="mt-3 rounded-2xl bg-stone-50 px-3 py-2 text-[11px] font-bold leading-5 text-stone-500">
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
          <p className="mt-3 text-xs font-bold leading-5 text-stone-500">{text.resetHelp}</p>
          {dataMessage && <p className="mt-3 rounded-2xl bg-emerald-50 px-3 py-2 text-xs font-black leading-5 text-emerald-800">{dataMessage}</p>}
          <button className={`mt-4 flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-black ${confirmingClear ? "bg-red-50 text-red-700" : "bg-stone-100 text-stone-700"}`} onClick={handleClear} type="button">
            <RotateCcw className="h-4 w-4" />
            {confirmingClear ? text.clearConfirm : text.clear}
          </button>
        </section>
      </div>
    </main>
  );
}

function NotificationCategoryRow({
  category,
  daysBeforeLabel,
  daysUnitLabel,
  disabled,
  icon: Icon,
  label,
  maxDays,
  onToggle,
  onUpdateDays,
  onUpdateTime,
  settings,
  timeLabel,
}: {
  category: NotificationCategory;
  daysBeforeLabel: string;
  daysUnitLabel: string;
  disabled: boolean;
  icon: LucideIcon;
  label: string;
  maxDays: number;
  onToggle: (enabled: boolean) => void;
  onUpdateDays: (daysBefore: number) => void;
  onUpdateTime: (time: string) => void;
  settings: NotificationSettings;
  timeLabel: string;
}) {
  const timing = settings.timings[category];
  const categoryDisabled = disabled || !settings.categories[category];

  return (
    <div className="rounded-2xl border border-stone-100 bg-stone-50 p-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <Icon className="h-4 w-4 shrink-0 text-emerald-700" />
          <p className="truncate text-sm font-black">{label}</p>
        </div>
        <button className={`selection-chip shrink-0 rounded-full px-3 py-1.5 text-xs font-black ${settings.categories[category] ? "is-selected" : ""}`} onClick={() => onToggle(!settings.categories[category])} type="button" disabled={disabled}>
          {settings.categories[category] ? "ON" : "OFF"}
        </button>
      </div>

      <div className="mt-3 grid grid-cols-[1fr_1fr] gap-2">
        <label className="block">
          <span className="mb-1 block text-[11px] font-black text-stone-500">{daysBeforeLabel}</span>
          <div className="flex items-center gap-1 rounded-xl bg-white px-2">
            <input className="h-10 min-w-0 flex-1 bg-transparent text-sm font-black outline-none disabled:text-stone-300" disabled={categoryDisabled} max={maxDays} min={0} onChange={(event) => onUpdateDays(Number(event.target.value))} type="number" value={timing.daysBefore} />
            <span className="text-xs font-black text-stone-400">{daysUnitLabel}</span>
          </div>
        </label>
        <label className="block">
          <span className="mb-1 block text-[11px] font-black text-stone-500">{timeLabel}</span>
          <input className="h-10 w-full rounded-xl bg-white px-2 text-sm font-black outline-none disabled:text-stone-300" disabled={categoryDisabled} onChange={(event) => onUpdateTime(event.target.value)} type="time" value={timing.time} />
        </label>
      </div>
    </div>
  );
}

function getNotificationCategoryIcon(category: NotificationCategory) {
  switch (category) {
    case "garbage":
      return Recycle;
    case "monthlyPayment":
      return CreditCard;
    case "holiday":
      return CalendarDays;
    case "residenceCard":
      return IdCard;
    case "weather":
      return CloudRain;
    case "rail":
      return TrainFront;
    case "workHours":
      return CalendarDays;
    case "salaryTax":
      return Percent;
    case "rent":
      return ReceiptText;
    case "calendarNote":
      return Bell;
    case "deals":
      return WalletCards;
    case "shopClaim":
      return Store;
  }
}

