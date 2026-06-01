"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/hooks/useLanguage";
import { goBack } from "@/lib/navigation/back";

type BackButtonProps = {
  fallbackHref?: string;
  label?: string;
  variant?: "pill" | "icon";
};

export function BackButton({ fallbackHref = "/", label, variant = "pill" }: BackButtonProps) {
  const router = useRouter();
  const { t } = useLanguage();
  const text = label ?? t.common.back;

  const handleBack = () => goBack(router, fallbackHref);

  if (variant === "icon") {
    return (
      <button className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#2563EB] shadow-sm ring-1 ring-blue-100/70" onClick={handleBack} type="button" aria-label={text}>
        <ArrowLeft className="h-4 w-4" />
      </button>
    );
  }

  return (
    <button className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#2563EB] shadow-sm ring-1 ring-blue-100/70" onClick={handleBack} type="button" aria-label={text}>
      <ArrowLeft className="h-4 w-4" />
    </button>
  );
}
