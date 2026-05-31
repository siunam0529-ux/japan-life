"use client";

import { ArrowLeft, ChevronRight, Languages } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { CommunityInterestDialog } from "@/components/community/CommunityInterestDialog";
import { CommunityNotificationButton } from "@/components/community/CommunityNotificationButton";
import { CommunityProfileButton } from "@/components/community/CommunityProfileButton";
import { getCommunityInterests, saveCommunityInterests } from "@/lib/community/preferences";
import { communityMeHref, getCommunityLocaleHref } from "@/lib/community/routes";
import { communityLocaleConfigs, type CommunityViewLocale } from "@/lib/community/types";

const entranceCopy: Record<CommunityViewLocale, { button: string; description: string; subtitle: string; title: string }> = {
  all: {
    button: "进入社区",
    description: "分享在日生活，看看附近的人都在做什么",
    subtitle: "日常、求助、闲置、搭子都在这里",
    title: "生活社区",
  },
  ja: {
    button: "进入社区",
    description: communityLocaleConfigs.ja.description,
    subtitle: "日常、求助、闲置、搭子都在这里",
    title: "生活社区",
  },
  "zh-cn": {
    button: "进入社区",
    description: communityLocaleConfigs["zh-cn"].description,
    subtitle: "中国大陆用户在日生活交流",
    title: "生活社区",
  },
  "zh-tw": {
    button: "进入社区",
    description: communityLocaleConfigs["zh-tw"].description,
    subtitle: "香港・台灣・澳門用戶在日生活交流",
    title: "生活社区",
  },
};

const entrances: CommunityViewLocale[] = ["all"];

export default function CommunityEntrancePage() {
  const [interests, setInterests] = useState<string[]>([]);
  const [interestDialogOpen, setInterestDialogOpen] = useState(false);

  useEffect(() => {
    setInterests(getCommunityInterests().interests);
  }, []);

  async function handleSaveInterests(nextInterests: string[]) {
    const state = await saveCommunityInterests(nextInterests);
    setInterests(state.interests);
    setInterestDialogOpen(false);
  }

  return (
    <main className="jl-tool-theme min-h-screen text-[#061a3a]">
      <div className="jl-tool-shell mx-auto min-h-screen w-full max-w-[430px] px-4 pb-32 pt-5">
        <div className="flex items-center justify-between">
          <Link className="inline-flex h-9 items-center gap-2 rounded-full bg-white/85 px-4 text-sm font-black text-[#2563EB] shadow-sm ring-1 ring-blue-100" href="/">
            <ArrowLeft className="h-4 w-4" />
            返回
          </Link>
          <div className="flex items-center gap-2">
            <CommunityNotificationButton />
            <CommunityProfileButton href={communityMeHref} label="我的社区" />
          </div>
        </div>

        <section className="mt-4 rounded-[30px] border border-white/80 bg-white/85 p-5 shadow-[0_18px_40px_rgba(37,99,235,0.12)] backdrop-blur">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-[#2563EB] ring-1 ring-blue-100">
            <Languages className="h-6 w-6" />
          </span>
          <h1 className="mt-4 text-[28px] font-[850] leading-9">生活社区</h1>
          <p className="mt-2 text-sm font-bold leading-6 text-slate-600">分享在日生活，看看附近的人都在做什么</p>
          <div className="mt-4 rounded-[22px] bg-blue-50/80 p-3 ring-1 ring-blue-100">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-black text-[#1D4ED8]">{interests.length ? "已根据你的兴趣推荐内容" : "选择兴趣，让社区更懂你"}</p>
                {interests.length ? (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {interests.slice(0, 3).map((interest) => (
                      <span className="rounded-full bg-white/85 px-2.5 py-1 text-[11px] font-black text-[#2563EB] ring-1 ring-blue-100" key={interest}>{interest}</span>
                    ))}
                  </div>
                ) : null}
              </div>
              <button className="h-8 shrink-0 rounded-full bg-[#2563EB] px-3 text-xs font-black text-white shadow-[0_8px_18px_rgba(37,99,235,0.18)]" onClick={() => setInterestDialogOpen(true)} type="button">
                设置兴趣
              </button>
            </div>
          </div>
        </section>

        <section className="mt-4 grid grid-cols-1 gap-3">
          {entrances.map((locale) => {
            const config = locale === "all" ? null : communityLocaleConfigs[locale];
            const copy = entranceCopy[locale];
            return (
              <Link className={`group relative flex min-h-[124px] overflow-hidden rounded-[26px] border border-white/80 bg-gradient-to-br ${locale === "all" ? "from-violet-500/22 via-blue-500/16 to-sky-300/18" : config?.cardAccent} p-4 pb-12 pr-16 shadow-[0_14px_32px_rgba(15,76,129,0.10)] ring-1 ring-white/70 backdrop-blur transition active:scale-[0.99]`} href={getCommunityLocaleHref(locale)} key={locale}>
                <div className="min-w-0 flex-1">
                  <div className="min-w-0">
                    <p className="text-xs font-black text-[#2563EB]">{locale === "all" ? "All" : config?.localeBadge}</p>
                    <h2 className={`mt-0.5 truncate font-black leading-7 ${locale === "all" ? "text-[22px]" : "text-xl"}`}>{copy.title}</h2>
                    <p className="mt-0.5 line-clamp-1 text-[13px] font-bold leading-5 text-slate-600">{copy.subtitle}</p>
                    <p className="mt-0.5 line-clamp-1 text-[11.5px] font-bold leading-4 text-slate-500">{copy.description}</p>
                  </div>
                </div>
                <span className="absolute bottom-3 left-4 inline-flex h-7 w-fit items-center rounded-full bg-[#2563EB] px-3 text-[11px] font-black text-white shadow-[0_10px_20px_rgba(37,99,235,0.18)]">
                  {copy.button}
                </span>
                <span className={`absolute right-4 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full ${locale === "all" ? "bg-[linear-gradient(135deg,#7c3aed,#2563eb)] text-white" : "bg-white/80 text-[#2563EB]"} shadow-sm ring-1 ring-blue-100`}>
                  <ChevronRight className="h-5 w-5" />
                </span>
              </Link>
            );
          })}
        </section>
        <section className="mt-4 rounded-[22px] border border-[rgba(226,232,240,0.85)] bg-[rgba(255,255,255,0.82)] p-[14px] shadow-[0_10px_24px_rgba(15,76,129,0.07)]">
          <h2 className="text-[14px] font-[850] text-[#061a3a]">社区能做什么？</h2>
          <p className="mt-2 text-[12px] font-bold leading-[19px] text-[#40546f]">
            你可以在这里分享日常、提问求助、发布闲置、找搭子。第一版先做统一社区，减少维护成本。
          </p>
        </section>
        {interestDialogOpen ? (
          <CommunityInterestDialog
            initialInterests={interests}
            locale="all"
            onSave={(nextInterests) => void handleSaveInterests(nextInterests)}
            onSkip={() => setInterestDialogOpen(false)}
          />
        ) : null}
      </div>
    </main>
  );
}
