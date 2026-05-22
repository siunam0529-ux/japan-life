import type { ComponentType } from "react";

export function StatusMessage({ icon: Icon, title, text }: { icon: ComponentType<{ className?: string }>; title: string; text: string }) {
  return (
    <div className="rounded-[18px] border border-emerald-100 bg-emerald-50 p-4 text-emerald-900">
      <div className="flex items-start gap-3">
        <Icon className="mt-0.5 h-5 w-5 shrink-0" />
        <div>
          <p className="font-black">{title}</p>
          <p className="mt-1 text-sm font-bold leading-6">{text}</p>
        </div>
      </div>
    </div>
  );
}
