"use client";

import { usePathname } from "next/navigation";
import { BottomNav } from "@/components/BottomNav";

const hiddenPrefixes = [
  "/admin",
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/account",
];

export function GlobalBottomNav() {
  const pathname = usePathname();
  const hidden = hiddenPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));

  if (hidden) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-3 z-40 mx-auto w-full max-w-[430px] px-4">
      <div className="pointer-events-auto">
        <BottomNav />
      </div>
    </div>
  );
}
