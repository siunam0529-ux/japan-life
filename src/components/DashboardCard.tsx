import type { ReactNode } from "react";

export function DashboardCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-[16px] border border-stone-200/70 bg-white p-3 shadow-[0_7px_18px_rgba(32,38,34,0.06)] sm:p-4 ${className}`}>
      {children}
    </section>
  );
}
