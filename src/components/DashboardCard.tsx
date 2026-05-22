import type { ReactNode } from "react";

export function DashboardCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-[28px] border border-white/60 bg-white/75 p-4 shadow-[0_10px_40px_rgba(37,99,235,0.08)] backdrop-blur-xl transition-all duration-300 sm:p-5 ${className}`}>
      {children}
    </section>
  );
}
