"use client";

import { SlidersHorizontal, Search } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { BackButton } from "@/components/BackButton";
import { dashboardTools } from "@/data/tools";
import { useHomeTools } from "@/hooks/useHomeTools";
import { useLanguage } from "@/hooks/useLanguage";

const copy = {
  "zh-CN": {
    back: "返回",
    empty: "没有可添加的更多工具",
    emptyHint: "当前工具都已经放在首页了。以后新增工具会先出现在这里，也可以到常用工具管理里调整首页显示。",
    manage: "管理首页常用工具",
    placeholder: "搜索更多工具",
    title: "更多工具",
    type: "工具池",
  },
  "zh-TW": {
    back: "返回",
    empty: "沒有可加入的更多工具",
    emptyHint: "目前工具都已經放在首頁了。以後新增工具會先出現在這裡，也可以到常用工具管理裡調整首頁顯示。",
    manage: "管理首頁常用工具",
    placeholder: "搜尋更多工具",
    title: "更多工具",
    type: "工具池",
  },
  ja: {
    back: "戻る",
    empty: "追加できるツールはありません",
    emptyHint: "現在のツールはすべてホームに表示されています。今後追加したツールはまずここに入り、管理画面からホームへ移動できます。",
    manage: "ホームのよく使う機能を管理",
    placeholder: "ツールを検索",
    title: "その他のツール",
    type: "ツール",
  },
} as const;

export default function SearchPage() {
  const { language } = useLanguage();
  const { selectedToolKeys } = useHomeTools();
  const text = copy[language];
  const [query, setQuery] = useState("");

  const moreTools = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return dashboardTools.filter((tool) => {
      if (selectedToolKeys.includes(tool.key)) return false;
      if (!keyword) return true;
      return `${tool.title[language]} ${tool.href} ${tool.key}`.toLowerCase().includes(keyword);
    });
  }, [language, query, selectedToolKeys]);

  return (
    <main className="min-h-screen bg-[#F6FAFF] text-[#0F172A]">
      <div className="mx-auto min-h-screen max-w-[430px] bg-[radial-gradient(circle_at_top,#DFF1FF_0%,#F6FAFF_42%,#FFFFFF_100%)] px-4 pb-24 pt-5">
        <div className="flex items-center justify-between gap-3">
          <BackButton label={text.back} />
          <h1 className="truncate text-xl font-black tracking-tight text-[#0F172A]">{text.title}</h1>
        </div>

        <label className="mt-4 flex h-12 items-center gap-2 rounded-3xl border border-white/60 bg-white/75 px-4 shadow-sm backdrop-blur-xl">
          <Search className="h-4 w-4 shrink-0 text-[#64748B]" />
          <input
            className="w-full bg-transparent text-sm font-bold text-[#0F172A] outline-none placeholder:text-[#94A3B8]"
            placeholder={text.placeholder}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>

        <Link className="mt-3 flex items-center justify-center gap-2 rounded-3xl border border-white/60 bg-white/75 px-4 py-3 text-sm font-black text-[#2563EB] shadow-sm backdrop-blur-xl" href="/home-tools">
          <SlidersHorizontal className="h-4 w-4" />
          {text.manage}
        </Link>

        <section className="mt-5 grid gap-3">
          {moreTools.length === 0 ? (
            <div className="rounded-[28px] border border-white/60 bg-white/75 p-8 text-center shadow-sm backdrop-blur-xl">
              <h2 className="text-xl font-black">{text.empty}</h2>
              <p className="mt-2 text-sm font-bold leading-6 text-[#64748B]">{text.emptyHint}</p>
            </div>
          ) : (
            moreTools.map((tool) => {
              const Icon = tool.icon;
              return (
                <Link
                  className="rounded-[26px] border border-white/60 bg-white/75 p-4 shadow-[0_10px_32px_rgba(37,99,235,0.08)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/90"
                  href={tool.href}
                  key={tool.key}
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-100 to-blue-100 text-[#2563EB] shadow-sm">
                      <Icon className="h-5 w-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-black text-[#2563EB]">{text.type}</p>
                      <h2 className="mt-1 truncate text-lg font-black">{tool.title[language]}</h2>
                      <p className="mt-1 truncate text-sm font-bold leading-5 text-[#64748B]">{tool.href}</p>
                    </div>
                  </div>
                </Link>
              );
            })
          )}
        </section>
      </div>
    </main>
  );
}
