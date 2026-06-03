"use client";

import { ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import { BackButton } from "@/components/BackButton";
import { useLanguage } from "@/hooks/useLanguage";
import type { Language } from "@/lib/i18n/translations";

type PermissionItem = {
  id: string;
};

const permissions: PermissionItem[] = [
  { id: "contacts" },
  { id: "geolocation" },
  { id: "camera" },
  { id: "photos" },
  { id: "microphone" },
  { id: "clipboard" },
];

const permissionsCopy = {
  "zh-CN": {
    title: "系统权限管理",
    intro: "为保证产品与功能的使用，Japan Life 会在特定场景下向你申请以下权限",
    labels: { contacts: "通讯录", geolocation: "位置", camera: "照相机", photos: "相册", microphone: "麦克风", clipboard: "剪切板" },
    allowed: "已允许",
    denied: "已拒绝",
    setup: "去设置",
    locationAllowed: "位置权限已允许。",
    locationFallback: "如果浏览器没有弹窗，请到手机系统或浏览器设置里开启权限。",
    genericMessage: "请到手机系统设置或浏览器网站设置里管理这个权限。网页版不能直接打开系统设置。",
    systemSettings: "系统权限设置",
    systemMessage: "请到手机系统设置或浏览器网站设置里管理 Japan Life 权限。",
  },
  "zh-TW": {
    title: "系統權限管理",
    intro: "為確保產品與功能可以使用，Japan Life 會在特定場景下向你申請以下權限",
    labels: { contacts: "通訊錄", geolocation: "位置", camera: "相機", photos: "相簿", microphone: "麥克風", clipboard: "剪貼簿" },
    allowed: "已允許",
    denied: "已拒絕",
    setup: "去設定",
    locationAllowed: "位置權限已允許。",
    locationFallback: "如果瀏覽器沒有彈窗，請到手機系統或瀏覽器設定裡開啟權限。",
    genericMessage: "請到手機系統設定或瀏覽器網站設定裡管理這個權限。網頁版不能直接打開系統設定。",
    systemSettings: "系統權限設定",
    systemMessage: "請到手機系統設定或瀏覽器網站設定裡管理 Japan Life 權限。",
  },
  ja: {
    title: "システム権限管理",
    intro: "Japan Life は機能を利用するため、必要な場面で以下の権限を申請します",
    labels: { contacts: "連絡先", geolocation: "位置情報", camera: "カメラ", photos: "写真", microphone: "マイク", clipboard: "クリップボード" },
    allowed: "許可済み",
    denied: "拒否済み",
    setup: "設定へ",
    locationAllowed: "位置情報の権限が許可されました。",
    locationFallback: "ブラウザの確認画面が出ない場合は、スマホ本体またはブラウザ設定で権限を有効にしてください。",
    genericMessage: "スマホ本体またはブラウザのサイト設定でこの権限を管理してください。Web 版からシステム設定を直接開くことはできません。",
    systemSettings: "システム権限設定",
    systemMessage: "スマホ本体またはブラウザのサイト設定で Japan Life の権限を管理してください。",
  },
} as const;

export default function SystemPermissionsPage() {
  const { language } = useLanguage();
  const text = permissionsCopy[language];
  const [message, setMessage] = useState("");
  const [permissionStatus, setPermissionStatus] = useState<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;
    async function readPermissions() {
      const next: Record<string, string> = {};
      if (typeof navigator !== "undefined" && "permissions" in navigator) {
        for (const id of ["geolocation", "camera", "microphone"]) {
          try {
            const status = await navigator.permissions.query({ name: id as PermissionName });
            next[id] = mapPermissionState(status.state, language);
          } catch {
            next[id] = text.setup;
          }
        }
      }
      if (!cancelled) setPermissionStatus(next);
    }
    void readPermissions();
    return () => {
      cancelled = true;
    };
  }, [language, text.setup]);

  const handleOpenSetting = (item: PermissionItem) => {
    if (item.id === "geolocation" && typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        () => setMessage(text.locationAllowed),
        () => setMessage(text.locationFallback),
        { enableHighAccuracy: false, maximumAge: 60000, timeout: 5000 },
      );
      return;
    }
    setMessage(text.genericMessage);
  };

  return (
    <main className="min-h-screen bg-[#f7fbff] text-[#111827]">
      <div className="mx-auto min-h-screen w-full max-w-[430px] px-4 pb-24 pt-5">
        <header className="grid grid-cols-[auto_1fr_auto] items-center">
          <BackButton fallbackHref="/me/settings" label="" />
          <h1 className="text-center text-[20px] font-black tracking-normal">{text.title}</h1>
          <span className="h-10 w-10" />
        </header>

        <p className="mt-8 px-1 text-[17px] font-black leading-7 text-slate-400">
          {text.intro}
        </p>

        <section className="mt-7 overflow-hidden rounded-[26px] bg-white shadow-[0_14px_34px_rgba(15,76,129,0.08)] ring-1 ring-slate-100">
          {permissions.map((item) => (
            <button className="flex h-[74px] w-full items-center gap-4 border-b border-slate-100 px-5 text-left last:border-b-0" key={item.id} onClick={() => handleOpenSetting(item)} type="button">
              <span className="min-w-0 flex-1 text-[18px] font-black text-[#111827]">{text.labels[item.id as keyof typeof text.labels]}</span>
              <span className="text-[17px] font-black text-slate-400">{permissionStatus[item.id] || text.setup}</span>
              <ChevronRight className="h-5 w-5 text-slate-300" />
            </button>
          ))}
        </section>

        <button className="mx-auto mt-8 block text-[16px] font-black text-[#2563eb]" onClick={() => setMessage(text.systemMessage)} type="button">
          {text.systemSettings}
        </button>

        {message ? (
          <p className="mt-5 rounded-[22px] bg-blue-50 px-4 py-3 text-sm font-black leading-6 text-[#2563eb]">{message}</p>
        ) : null}
      </div>
    </main>
  );
}

function mapPermissionState(state: PermissionState, language: Language) {
  const text = permissionsCopy[language];
  if (state === "granted") return text.allowed;
  if (state === "denied") return text.denied;
  return text.setup;
}
