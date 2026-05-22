"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/hooks/useLanguage";

type BackButtonProps = {
  fallbackHref?: string;
  label?: string;
  variant?: "pill" | "icon";
};

export function BackButton({ fallbackHref = "/", label, variant = "pill" }: BackButtonProps) {
  const router = useRouter();
  const { t } = useLanguage();
  const text = label ?? t.common.back;

  const goBack = () => {
    if (typeof window === "undefined") return;

    if (window.history.length > 1) {
      router.back();
      return;
    }
    router.push(fallbackHref);
  };

  if (variant === "icon") {
    return (
      <button className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-700 shadow-sm" onClick={goBack} type="button" aria-label={text}>
        <ArrowLeft className="h-4 w-4" />
      </button>
    );
  }

  return (
    <button className="flex items-center gap-2 rounded-full bg-white px-3 py-2 text-xs font-black text-stone-600 shadow-sm" onClick={goBack} type="button">
      <ArrowLeft className="h-4 w-4" />
      {text}
    </button>
  );
}
