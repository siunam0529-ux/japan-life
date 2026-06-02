"use client";

import { ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import { BackButton } from "@/components/BackButton";

type PermissionItem = {
  id: string;
  label: string;
};

const permissions: PermissionItem[] = [
  { id: "contacts", label: "通讯录" },
  { id: "geolocation", label: "位置" },
  { id: "camera", label: "照相机" },
  { id: "photos", label: "相册" },
  { id: "microphone", label: "麦克风" },
  { id: "clipboard", label: "剪切板" },
];

export default function SystemPermissionsPage() {
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
            next[id] = mapPermissionState(status.state);
          } catch {
            next[id] = "去设置";
          }
        }
      }
      if (!cancelled) setPermissionStatus(next);
    }
    void readPermissions();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleOpenSetting = (item: PermissionItem) => {
    if (item.id === "geolocation" && typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        () => setMessage("位置权限已允许。"),
        () => setMessage("如果浏览器没有弹窗，请到手机系统或浏览器设置里开启权限。"),
        { enableHighAccuracy: false, maximumAge: 60000, timeout: 5000 },
      );
      return;
    }
    setMessage("请到手机系统设置或浏览器网站设置里管理这个权限。网页版不能直接打开系统设置。");
  };

  return (
    <main className="min-h-screen bg-[#f7fbff] text-[#111827]">
      <div className="mx-auto min-h-screen w-full max-w-[430px] px-4 pb-24 pt-5">
        <header className="grid grid-cols-[auto_1fr_auto] items-center">
          <BackButton fallbackHref="/me/settings" label="" />
          <h1 className="text-center text-[20px] font-black tracking-normal">系统权限管理</h1>
          <span className="h-10 w-10" />
        </header>

        <p className="mt-8 px-1 text-[17px] font-black leading-7 text-slate-400">
          为保证产品与功能的使用，Japan Life 会在特定场景下向你申请以下权限
        </p>

        <section className="mt-7 overflow-hidden rounded-[26px] bg-white shadow-[0_14px_34px_rgba(15,76,129,0.08)] ring-1 ring-slate-100">
          {permissions.map((item) => (
            <button className="flex h-[74px] w-full items-center gap-4 border-b border-slate-100 px-5 text-left last:border-b-0" key={item.id} onClick={() => handleOpenSetting(item)} type="button">
              <span className="min-w-0 flex-1 text-[18px] font-black text-[#111827]">{item.label}</span>
              <span className="text-[17px] font-black text-slate-400">{permissionStatus[item.id] || "去设置"}</span>
              <ChevronRight className="h-5 w-5 text-slate-300" />
            </button>
          ))}
        </section>

        <button className="mx-auto mt-8 block text-[16px] font-black text-[#2563eb]" onClick={() => setMessage("请到手机系统设置或浏览器网站设置里管理 Japan Life 权限。")} type="button">
          系统权限设置
        </button>

        {message ? (
          <p className="mt-5 rounded-[22px] bg-blue-50 px-4 py-3 text-sm font-black leading-6 text-[#2563eb]">{message}</p>
        ) : null}
      </div>
    </main>
  );
}

function mapPermissionState(state: PermissionState) {
  if (state === "granted") return "已允许";
  if (state === "denied") return "已拒绝";
  return "去设置";
}
