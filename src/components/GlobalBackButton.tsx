"use client";

import { ArrowLeft } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useLanguage } from "@/hooks/useLanguage";
import { routePreviousKey } from "@/components/RouteHistory";

export function GlobalBackButton() {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useLanguage();

  if (pathname === "/") return null;

  const goBack = () => {
    const currentRoute = `${window.location.pathname}${window.location.search}`;
    const previousRoute = window.sessionStorage.getItem(routePreviousKey);
    if (previousRoute && previousRoute !== currentRoute) {
      router.push(previousRoute);
      return;
    }

    if (window.history.length > 1) {
      router.back();
      return;
    }
    router.push("/");
  };

  return (
    <button
      aria-label={t.common.back}
      className="fixed bottom-[calc(env(safe-area-inset-bottom)+6.75rem)] left-4 z-[60] inline-flex h-10 items-center gap-2 rounded-full border border-white/75 bg-white/90 px-3 text-xs font-black text-[#2563EB] shadow-[0_12px_28px_rgba(15,76,129,0.14)] backdrop-blur-xl transition active:scale-[0.98]"
      onClick={goBack}
      type="button"
    >
      <ArrowLeft className="h-4 w-4" />
      {t.common.back}
    </button>
  );
}
