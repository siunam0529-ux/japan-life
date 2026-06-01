"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { goBack } from "@/lib/navigation/back";

export function AreaBackButton() {
  const router = useRouter();

  const handleBack = () => goBack(router, "/tools/area-compare");

  return (
    <button
      aria-label="Back"
      className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#2563EB] shadow-sm ring-1 ring-blue-100/70"
      onClick={handleBack}
      type="button"
    >
      <ArrowLeft className="h-5 w-5" />
    </button>
  );
}
