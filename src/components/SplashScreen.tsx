"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

export function SplashScreen() {
  const [visible, setVisible] = useState(true);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const leaveTimer = window.setTimeout(() => setLeaving(true), 1050);
    const hideTimer = window.setTimeout(() => setVisible(false), 1350);
    return () => {
      window.clearTimeout(leaveTimer);
      window.clearTimeout(hideTimer);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center bg-[#F6FAFF] transition-opacity duration-300 ${leaving ? "opacity-0" : "opacity-100"}`}
      aria-label="Japan Life splash screen"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_28%,rgba(223,241,255,1),rgba(246,250,255,0.96)_42%,#F6FAFF_100%)]" />
      <div className={`relative flex flex-col items-center text-center transition-all duration-1000 ${leaving ? "scale-[1.02] opacity-0" : "scale-100 opacity-100"}`}>
        <div className="animate-[japan-life-float_1800ms_ease-in-out_infinite] rounded-[32px] bg-white/70 p-1.5 shadow-[0_24px_60px_rgba(37,99,235,0.18)] ring-1 ring-white/70 backdrop-blur-xl">
          <Image
            src="/icon-512.png"
            alt="Japan Life"
            width={120}
            height={120}
            priority
            className="h-[120px] w-[120px] rounded-[28px]"
          />
        </div>
        <h1 className="mt-6 text-[28px] font-bold tracking-tight text-[#0F172A]">Japan Life</h1>
        <p className="mt-2 text-[14px] font-bold tracking-tight text-[#2563EB]">在日生活助手</p>
      </div>
    </div>
  );
}
