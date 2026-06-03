"use client";

import { LogIn } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useLanguage } from "@/hooks/useLanguage";
import { withBackFrom } from "@/lib/navigation/back";

const loginCardCopy = {
  "zh-CN": { browse: "\u5148\u901b\u901b\u793e\u533a", description: "\u767b\u5f55\u540e\u53ef\u4ee5\u53d1\u5e03\u5185\u5bb9\u548c\u7559\u8a00\u3002", login: "\u53bb\u767b\u5f55", title: "\u8bf7\u5148\u767b\u5f55" },
  "zh-TW": { browse: "\u5148\u901b\u901b\u793e\u7fa4", description: "\u767b\u5165\u5f8c\u53ef\u4ee5\u767c\u5e03\u5167\u5bb9\u548c\u7559\u8a00\u3002", login: "\u53bb\u767b\u5165", title: "\u8acb\u5148\u767b\u5165" },
  ja: { browse: "\u30b3\u30df\u30e5\u30cb\u30c6\u30a3\u3092\u898b\u308b", description: "\u30ed\u30b0\u30a4\u30f3\u3059\u308b\u3068\u6295\u7a3f\u3084\u30b3\u30e1\u30f3\u30c8\u304c\u3067\u304d\u307e\u3059\u3002", login: "\u30ed\u30b0\u30a4\u30f3", title: "\u30ed\u30b0\u30a4\u30f3\u304c\u5fc5\u8981\u3067\u3059" },
};

export function CommunityLoginRequiredCard({ description, title }: { description?: string; title?: string }) {
  const { language } = useLanguage();
  const text = loginCardCopy[language];
  const [currentPath, setCurrentPath] = useState("/community/all");

  useEffect(() => {
    setCurrentPath(`${window.location.pathname}${window.location.search}`);
  }, []);

  const loginHref = withBackFrom(`/login?redirect=${encodeURIComponent(currentPath)}`);

  return (
    <section className="rounded-[24px] border border-white/80 bg-white/86 p-4 shadow-[0_12px_28px_rgba(15,76,129,0.08)]">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-[#2563EB] ring-1 ring-blue-100">
          <LogIn className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-[15px] font-[850] text-[#061a3a]">{title ?? text.title}</h2>
          <p className="mt-1 text-[12px] font-bold leading-[19px] text-[#40546f]">{description ?? text.description}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link className="inline-flex h-9 items-center justify-center rounded-full bg-[linear-gradient(135deg,#2563eb,#38bdf8)] px-4 text-xs font-black text-white shadow-[0_10px_20px_rgba(37,99,235,0.18)]" href={loginHref} prefetch={false}>
              {text.login}
            </Link>
            <Link className="inline-flex h-9 items-center justify-center rounded-full bg-blue-50 px-4 text-xs font-black text-[#2563EB] ring-1 ring-blue-100" href="/community/all" prefetch={false}>
              {text.browse}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
