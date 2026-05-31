"use client";

import { LogIn } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export function CommunityLoginRequiredCard({
  description = "登录后可以发布内容和留言。",
  title = "请先登录",
}: {
  description?: string;
  title?: string;
}) {
  const [currentPath, setCurrentPath] = useState("/community/all");

  useEffect(() => {
    setCurrentPath(`${window.location.pathname}${window.location.search}`);
  }, []);

  const loginHref = `/login?redirect=${encodeURIComponent(currentPath)}`;

  return (
    <section className="rounded-[24px] border border-white/80 bg-white/86 p-4 shadow-[0_12px_28px_rgba(15,76,129,0.08)]">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-[#2563EB] ring-1 ring-blue-100">
          <LogIn className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-[15px] font-[850] text-[#061a3a]">{title}</h2>
          <p className="mt-1 text-[12px] font-bold leading-[19px] text-[#40546f]">{description}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link className="inline-flex h-9 items-center justify-center rounded-full bg-[linear-gradient(135deg,#2563eb,#38bdf8)] px-4 text-xs font-black text-white shadow-[0_10px_20px_rgba(37,99,235,0.18)]" href={loginHref}>
              去登录
            </Link>
            <Link className="inline-flex h-9 items-center justify-center rounded-full bg-blue-50 px-4 text-xs font-black text-[#2563EB] ring-1 ring-blue-100" href="/community/all">
              先逛逛社区
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
