"use client";

import { BriefcaseBusiness, CheckCircle2, Compass, Home, Languages, MapPin, UserRound, WalletCards } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { BackButton } from "@/components/BackButton";
import { useLanguage } from "@/hooks/useLanguage";
import { useUserLocation } from "@/hooks/useUserLocation";
import { Currency, defaultUserSettings, LifeStatus, Region, UserSettings, useUserSettings } from "@/hooks/useUserSettings";
import { Language } from "@/lib/i18n/translations";
import { tokyoWeatherAreaOptions } from "@/lib/weather";

const regionOptions: Region[] = ["tokyo", "osaka", "kyoto", "fukuoka", "other"];
const tokyoSubAreaOptions = tokyoWeatherAreaOptions.filter((item) => item.id !== "tokyo");
const statusOptions: LifeStatus[] = ["student", "work", "family", "japanese", "other"];
const languageOptions: Language[] = ["zh-CN", "zh-TW", "ja"];
const currencyOptions: Currency[] = ["CNY", "HKD", "TWD", "USD", "JPY"];
const workHoursStorageKey = "japan-life-work-hours";
const workHoursChangeEvent = "japan-life-work-hours-change";
const workHourDayKeys = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;

const copy = {
  "zh-CN": {
    title: "设置你的在日生活信息",
    subtitle: "这些资料只保存在本地，用来调整首页提示、默认汇率和常用工具排序。",
    region: "居住地区",
    tokyoArea: "东京 23 区 / 区域",
    status: "身份",
    language: "语言偏好",
    locate: "使用当前位置",
    locating: "定位中...",
    located: "已更新为当前位置",
    locationError: "无法取得当前位置，请稍后再试或手动选择地区。",
    currency: "默认货币",
    working: "是否打工",
    renting: "是否租房",
    save: "保存设置",
    saved: "已保存到本地",
    noteTitle: "定位与资料说明",
    notes: ["身份只表示在日生活状态，不按国籍分类。", "台湾用户可选择繁体中文 + TWD。", "香港用户可选择繁体中文 + HKD。", "中国大陆用户可选择简体中文 + CNY。"],
    regions: { tokyo: "东京", osaka: "大阪", kyoto: "京都", fukuoka: "福冈", other: "其他" },
    statuses: { student: "留学生", work: "工作签", family: "家族滞在", japanese: "日本人", other: "其他" },
    languages: { "zh-CN": "简体中文", "zh-TW": "繁體中文", ja: "日本語" },
    preview: {
      student: "首页会显示 28 小时提醒、打工时间和留学生相关提示。",
      work: "首页会优先显示税后工资、年金保险和住民税相关提示。",
      rent: "租房用户会看到房租压力、地区数据和不动产店铺入口。",
      twd: "默认货币为 TWD 时，汇率卡片会优先显示 JPY/TWD。",
    },
  },
  "zh-TW": {
    title: "設定你的在日生活資訊",
    subtitle: "這些資料只會保存在本機，用來調整首頁提示、預設匯率和常用工具排序。",
    region: "居住地區",
    tokyoArea: "東京 23 區 / 區域",
    status: "身份",
    language: "語言偏好",
    locate: "使用目前位置",
    locating: "定位中...",
    located: "已更新為目前位置",
    locationError: "無法取得目前位置，請稍後再試或手動選擇地區。",
    currency: "預設貨幣",
    working: "是否打工",
    renting: "是否租房",
    save: "儲存設定",
    saved: "已儲存到本機",
    noteTitle: "定位與資料說明",
    notes: ["身份只表示在日生活狀態，不按國籍分類。", "台灣使用者可選擇繁體中文 + TWD。", "香港使用者可選擇繁體中文 + HKD。", "中國大陸使用者可選擇簡體中文 + CNY。"],
    regions: { tokyo: "東京", osaka: "大阪", kyoto: "京都", fukuoka: "福岡", other: "其他" },
    statuses: { student: "留學生", work: "工作簽", family: "家族滯在", japanese: "日本人", other: "其他" },
    languages: { "zh-CN": "简体中文", "zh-TW": "繁體中文", ja: "日本語" },
    preview: {
      student: "首頁會顯示 28 小時提醒、打工時間和留學生相關提示。",
      work: "首頁會優先顯示稅後薪資、年金保險和住民稅相關提示。",
      rent: "租房使用者會看到房租壓力、地區資料和不動產店鋪入口。",
      twd: "預設貨幣為 TWD 時，匯率卡片會優先顯示 JPY/TWD。",
    },
  },
  ja: {
    title: "日本生活の情報を設定する",
    subtitle: "この情報は端末内に保存され、ホームの表示、通貨、よく使う機能の調整に使われます。",
    region: "居住エリア",
    tokyoArea: "東京 23 区 / エリア",
    status: "在留状況",
    language: "言語",
    locate: "現在地を使う",
    locating: "位置情報を取得中...",
    located: "現在地に更新しました",
    locationError: "現在地を取得できませんでした。後でもう一度試すか、手動で地域を選択してください。",
    currency: "標準通貨",
    working: "アルバイト中",
    renting: "賃貸中",
    save: "設定を保存",
    saved: "端末に保存しました",
    noteTitle: "位置情報と設定について",
    notes: ["身份は日本での生活状態を表すもので、国籍分類ではありません。", "台湾の方は繁體中文 + TWD を選べます。", "香港の方は繁體中文 + HKD を選べます。", "中国大陸の方は简体中文 + CNY を選べます。"],
    regions: { tokyo: "東京", osaka: "大阪", kyoto: "京都", fukuoka: "福岡", other: "その他" },
    statuses: { student: "留学生", work: "就労ビザ", family: "家族滞在", japanese: "日本人", other: "その他" },
    languages: { "zh-CN": "简体中文", "zh-TW": "繁體中文", ja: "日本語" },
    preview: {
      student: "ホームに28時間リマインダー、勤務時間、留学生向けヒントを表示します。",
      work: "ホームで手取り、年金、保険、住民税のヒントを優先表示します。",
      rent: "賃貸中の方には家賃チェック、エリア情報、不動産店舗入口を表示します。",
      twd: "標準通貨が TWD の場合、為替カードは JPY/TWD を優先表示します。",
    },
  },
} as const;

function syncStudentWorkHourLimit(status: LifeStatus) {
  if (typeof window === "undefined" || status !== "student") return;

  const emptyHours = Object.fromEntries(workHourDayKeys.map((key) => [key, ""])) as Record<string, string>;
  let hours = emptyHours;

  try {
    const raw = window.localStorage.getItem(workHoursStorageKey);
    if (raw) {
      const parsed = JSON.parse(raw) as { hours?: unknown } | Record<string, unknown>;
      if ("hours" in parsed && parsed.hours && typeof parsed.hours === "object" && !Array.isArray(parsed.hours)) {
        hours = { ...emptyHours, ...(parsed.hours as Record<string, string>) };
      } else if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        hours = { ...emptyHours, ...(parsed as Record<string, string>) };
      }
    }
  } catch {
    hours = emptyHours;
  }

  window.localStorage.setItem(workHoursStorageKey, JSON.stringify({ hours, studentLimitEnabled: true }));
  window.dispatchEvent(new Event(workHoursChangeEvent));
}

export default function OnboardingPage() {
  const { language, setLanguage, t } = useLanguage();
  const { saveSettings, settings } = useUserSettings();
  const [form, setForm] = useState<UserSettings>(() => settings ?? { ...defaultUserSettings, language });
  const [saved, setSaved] = useState(false);
  const activeCopy = copy[language];
  const userLocation = useUserLocation({
    autoRequest: false,
    autoUpdateSettings: true,
    confirmUpdate: (location) => window.confirm(`${location.prefecture}${location.city ? ` ${location.city}` : ""} に更新しますか？`),
    settings,
  });

  const updateForm = (patch: Partial<UserSettings>) => {
    setForm((current) => ({ ...current, ...patch }));
    setSaved(false);
  };

  const handleSave = () => {
    const payload: Omit<UserSettings, "updatedAt"> = {
      ...form,
      currency: form.defaultCurrency,
      worksPartTime: form.isWorking,
      rentsHome: form.isRenting,
      onboardingCompleted: true,
    };
    saveSettings(payload);
    syncStudentWorkHourLimit(payload.status);
    setLanguage(payload.language);
    setSaved(true);
  };

  useEffect(() => {
    if (!userLocation.resolvedLocation) return;
    const resolved = userLocation.resolvedLocation;
    setForm((current) => ({
      ...current,
      areaId: resolved.areaId,
      location: {
        city: resolved.city,
        latitude: resolved.latitude,
        longitude: resolved.longitude,
        prefecture: resolved.prefecture,
        updatedAt: resolved.updatedAt,
      },
      locationSource: "geolocation",
      region: resolved.region,
      regionSource: "geolocation",
    }));
    setSaved(true);
  }, [userLocation.resolvedLocation]);

  return (
    <main className="min-h-screen bg-[#f5f0e7] text-stone-950">
      <div className="mx-auto min-h-screen max-w-[430px] bg-[#fbf8f2] px-4 pb-24 pt-4 shadow-2xl shadow-stone-300/40">
        <div className="mb-5 flex items-center justify-between">
          <BackButton label={t.common.back} />
          <span className="rounded-full bg-emerald-50 px-4 py-2 text-xs font-black text-emerald-800">Japan Life</span>
        </div>

        <section className="rounded-[30px] bg-white p-5 text-[#0F172A] shadow-[0_18px_45px_rgba(37,99,235,0.10)]">
          <div className="mb-3 flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-blue-50 text-[#2563EB]">
              <Compass className="h-5 w-5" />
            </span>
            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-[#2563EB]">Japan Life</span>
          </div>
          <h1 className="text-3xl font-black leading-tight">{activeCopy.title}</h1>
          <p className="mt-3 text-sm font-semibold leading-6 text-[#64748B]">{activeCopy.subtitle}</p>
        </section>

        <section className="mt-5 rounded-[24px] bg-white p-5 shadow-[0_10px_24px_rgba(32,38,34,0.07)]">
          <div className="grid gap-4">
            <Select
              icon={Home}
              label={activeCopy.region}
              options={regionOptions.map((value) => [value, activeCopy.regions[value]])}
              value={form.region}
              onChange={(value) => updateForm({ region: value as Region, regionSource: "manual", areaId: value === "tokyo" ? form.areaId ?? tokyoSubAreaOptions[0]?.id ?? null : null })}
            />
            {form.region === "tokyo" && (
              <Select
                icon={Compass}
                label={activeCopy.tokyoArea}
                options={tokyoSubAreaOptions.map((item) => [item.id, item.name[language]])}
                value={form.areaId && form.areaId !== "tokyo" ? form.areaId : tokyoSubAreaOptions[0]?.id ?? ""}
                onChange={(value) => updateForm({ areaId: value, regionSource: "manual" })}
              />
            )}
            <button className="flex h-11 items-center justify-center gap-2 rounded-2xl bg-blue-50 px-4 text-sm font-black text-[#2563EB] shadow-sm" disabled={userLocation.loading} onClick={userLocation.requestLocation} type="button">
              <MapPin className="h-4 w-4" />
              {userLocation.loading ? activeCopy.locating : activeCopy.locate}
            </button>
            {userLocation.resolvedLocation && (
              <p className="rounded-2xl bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-800">
                {activeCopy.located}: {userLocation.resolvedLocation.prefecture} {userLocation.resolvedLocation.city}
              </p>
            )}
            {userLocation.error && <p className="rounded-2xl bg-red-50 px-3 py-2 text-xs font-black text-red-700">{activeCopy.locationError}</p>}
            <Select
              icon={UserRound}
              label={activeCopy.status}
              options={statusOptions.map((value) => [value, activeCopy.statuses[value]])}
              value={form.status}
              onChange={(value) => updateForm({ status: value as LifeStatus })}
            />
            <Select
              icon={Languages}
              label={activeCopy.language}
              options={languageOptions.map((value) => [value, activeCopy.languages[value]])}
              value={form.language}
              onChange={(value) => {
                updateForm({ language: value as Language });
                setLanguage(value as Language);
              }}
            />
            <Select
              icon={WalletCards}
              label={activeCopy.currency}
              options={currencyOptions.map((value) => [value, value])}
              value={form.defaultCurrency}
              onChange={(value) => updateForm({ currency: value as Currency, defaultCurrency: value as Currency })}
            />
            <Toggle icon={BriefcaseBusiness} label={activeCopy.working} checked={form.isWorking} onChange={(value) => updateForm({ isWorking: value, worksPartTime: value })} />
            <Toggle icon={Home} label={activeCopy.renting} checked={form.isRenting} onChange={(value) => updateForm({ isRenting: value, rentsHome: value })} />
          </div>

          <button className="mt-5 w-full rounded-2xl bg-emerald-800 px-5 py-3 text-sm font-black text-white shadow-sm" onClick={handleSave} type="button">
            {activeCopy.save}
          </button>
          {saved && <p className="mt-3 rounded-2xl bg-emerald-50 px-3 py-2 text-sm font-black text-emerald-800">{activeCopy.saved}</p>}
        </section>

        <section className="mt-5 grid gap-3">
          {form.status === "student" && <InfoCard text={activeCopy.preview.student} />}
          {form.status === "work" && <InfoCard text={activeCopy.preview.work} />}
          {form.isRenting && <InfoCard text={activeCopy.preview.rent} />}
          {form.defaultCurrency === "TWD" && <InfoCard text={activeCopy.preview.twd} />}
        </section>

        <section className="mt-5 rounded-[24px] bg-white p-5 shadow-[0_10px_24px_rgba(32,38,34,0.07)]">
          <h2 className="text-lg font-black">{activeCopy.noteTitle}</h2>
          <div className="mt-4 grid gap-2">
            {activeCopy.notes.map((note) => (
              <div className="flex gap-2 rounded-2xl bg-stone-50 px-3 py-3 text-sm font-bold leading-6 text-stone-600" key={note}>
                <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-emerald-700" />
                <span>{note}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

function Select({
  icon: Icon,
  label,
  onChange,
  options,
  value,
}: {
  icon: LucideIcon;
  label: string;
  onChange: (value: string) => void;
  options: string[][];
  value: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 flex items-center gap-2 text-xs font-black text-stone-600">
        <Icon className="h-4 w-4 text-emerald-700" />
        {label}
      </span>
      <select className="h-10 w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 font-black outline-none focus:border-emerald-600" value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map(([optionValue, optionLabel]) => (
          <option key={optionValue} value={optionValue}>
            {optionLabel}
          </option>
        ))}
      </select>
    </label>
  );
}

function Toggle({ checked, icon: Icon, label, onChange }: { checked: boolean; icon: LucideIcon; label: string; onChange: (value: boolean) => void }) {
  return (
    <div>
      <p className="mb-1 flex items-center gap-2 text-xs font-black text-stone-600">
        <Icon className="h-4 w-4 text-emerald-700" />
        {label}
      </p>
      <button className={`h-10 w-full rounded-2xl px-4 text-sm font-black transition ${checked ? "bg-emerald-800 text-white" : "bg-stone-100 text-stone-500"}`} onClick={() => onChange(!checked)} type="button">
        {checked ? "ON" : "OFF"}
      </button>
    </div>
  );
}

function InfoCard({ text }: { text: string }) {
  return <div className="rounded-[20px] border border-emerald-100 bg-emerald-50 px-3 py-2 text-sm font-bold leading-6 text-emerald-900">{text}</div>;
}

