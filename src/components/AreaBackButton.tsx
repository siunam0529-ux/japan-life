"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { routePreviousKey } from "@/components/RouteHistory";

export function AreaBackButton() {
  const router = useRouter();

  const goBack = () => {
    if (typeof window === "undefined") return;

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
    router.push("/tools/area-compare");
  };

  return (
    <button
      aria-label="Back"
      className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-stone-700 shadow-sm"
      onClick={goBack}
      type="button"
    >
      <ArrowLeft className="h-5 w-5" />
    </button>
  );
}
