import type { ComponentType } from "react";

export function StatusMessage({ icon: Icon, title, text }: { icon: ComponentType<{ className?: string }>; title: string; text: string }) {
  return (
    <div className="rounded-3xl border border-white/50 bg-white/75 p-5 text-[#0F172A] shadow-[0_18px_45px_rgba(37,99,235,0.08)] backdrop-blur-xl">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-50 to-sky-100 text-[#2563EB] shadow-sm">
          <Icon className="h-5 w-5" />
        </span>
        <div>
          <p className="font-black">{title}</p>
          <p className="mt-1 text-sm font-bold leading-6 text-[#64748B]">{text}</p>
        </div>
      </div>
    </div>
  );
}
