"use client";

import { ChevronRight, ShieldCheck, X } from "lucide-react";
import { useEffect, useState } from "react";
import { BackButton } from "@/components/BackButton";
import {
  communityShowCommentsKey,
  communityShowFollowersKey,
  communityShowFollowingKey,
  addCommunityBlockedUser,
  readCommunityBlacklist,
  readCommunityPrivateMessagePrivacy,
  type CommunityPrivateMessagePrivacy,
  writeCommunityBlacklist,
  writeCommunityPrivateMessagePrivacy,
} from "@/lib/community/privacy";

const privacyOptions: Array<{ description: string; label: string; value: CommunityPrivateMessagePrivacy }> = [
  { description: "任何人都可以给你发私信。", label: "所有人", value: "all" },
  { description: "只有你关注的人可以给你发私信。", label: "我关注的人", value: "following" },
  { description: "只允许互相关注的人给你发私信。", label: "互相关注", value: "mutual" },
];

export default function CommunityPrivacySettingsPage() {
  const [blacklist, setBlacklist] = useState<string[]>([]);
  const [draftBlockedId, setDraftBlockedId] = useState("");
  const [messagePrivacy, setMessagePrivacy] = useState<CommunityPrivateMessagePrivacy>("all");
  const [showComments, setShowComments] = useState(false);
  const [showFollowers, setShowFollowers] = useState(true);
  const [showFollowing, setShowFollowing] = useState(true);

  useEffect(() => {
    setBlacklist(readCommunityBlacklist());
    setMessagePrivacy(readCommunityPrivateMessagePrivacy());
    setShowComments(window.localStorage.getItem(communityShowCommentsKey) === "true");
    setShowFollowers(window.localStorage.getItem(communityShowFollowersKey) !== "false");
    setShowFollowing(window.localStorage.getItem(communityShowFollowingKey) !== "false");
  }, []);

  const updateBooleanSetting = (key: string, setter: (value: boolean) => void, value: boolean) => {
    setter(value);
    window.localStorage.setItem(key, String(value));
  };

  const updateMessagePrivacy = (value: CommunityPrivateMessagePrivacy) => {
    setMessagePrivacy(value);
    writeCommunityPrivateMessagePrivacy(value);
  };

  const addBlockedUser = () => {
    const nextId = draftBlockedId.trim();
    if (!nextId) return;
    const next = addCommunityBlockedUser(nextId);
    setBlacklist(next);
    writeCommunityBlacklist(next);
    setDraftBlockedId("");
  };

  const removeBlockedUser = (userId: string) => {
    const next = blacklist.filter((item) => item !== userId);
    setBlacklist(next);
    writeCommunityBlacklist(next);
  };

  return (
    <main className="min-h-screen bg-[#f7fbff] text-[#111827]">
      <div className="mx-auto min-h-screen w-full max-w-[430px] px-4 pb-24 pt-5">
        <header className="grid grid-cols-[auto_1fr_auto] items-center">
          <BackButton fallbackHref="/me/settings" label="" />
          <h1 className="text-center text-[20px] font-black tracking-normal">隐私设置</h1>
          <span className="h-10 w-10" />
        </header>

        <p className="mt-6 px-1 text-sm font-black leading-6 text-slate-400">
          管理别人进入你社区主页时可以看到哪些内容，也可以设置谁能给你发私信。
        </p>

        <section className="mt-6 overflow-hidden rounded-[24px] bg-white shadow-[0_14px_34px_rgba(15,76,129,0.08)] ring-1 ring-slate-100">
          <ToggleRow checked={showComments} description="默认关闭。关闭后，别人进你的主页不能看你评论过的内容。" label="公开我的评论" onChange={(value) => updateBooleanSetting(communityShowCommentsKey, setShowComments, value)} />
          <ToggleRow checked={showFollowing} description="关闭后，别人点击你的关注数时会看到隐私提示。" label="公开我的关注列表" onChange={(value) => updateBooleanSetting(communityShowFollowingKey, setShowFollowing, value)} />
          <ToggleRow checked={showFollowers} description="关闭后，别人点击你的粉丝数时会看到隐私提示。" label="公开我的粉丝列表" onChange={(value) => updateBooleanSetting(communityShowFollowersKey, setShowFollowers, value)} />
        </section>

        <section className="mt-7">
          <h2 className="px-1 text-sm font-black text-slate-400">私信权限</h2>
          <div className="mt-3 overflow-hidden rounded-[24px] bg-white shadow-[0_14px_34px_rgba(15,76,129,0.08)] ring-1 ring-slate-100">
            {privacyOptions.map((option) => (
              <button className="flex w-full items-center gap-3 border-b border-slate-100 px-4 py-4 text-left last:border-b-0" key={option.value} onClick={() => updateMessagePrivacy(option.value)} type="button">
                <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ring-2 ${messagePrivacy === option.value ? "bg-[#2563eb] ring-[#2563eb]" : "bg-white ring-slate-200"}`}>
                  {messagePrivacy === option.value ? <span className="h-2 w-2 rounded-full bg-white" /> : null}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[16px] font-black text-[#111827]">{option.label}</span>
                  <span className="mt-1 block text-xs font-bold leading-5 text-slate-400">{option.description}</span>
                </span>
                <ChevronRight className="h-4 w-4 text-slate-300" />
              </button>
            ))}
          </div>
        </section>

        <section className="mt-7">
          <h2 className="px-1 text-sm font-black text-slate-400">黑名单</h2>
          <div className="mt-3 rounded-[24px] bg-white p-4 shadow-[0_14px_34px_rgba(15,76,129,0.08)] ring-1 ring-slate-100">
            <div className="flex gap-2">
              <input className="h-12 min-w-0 flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-black outline-none focus:border-[#2563eb]" onChange={(event) => setDraftBlockedId(event.target.value)} placeholder="输入 Japan Life ID" value={draftBlockedId} />
              <button className="h-12 rounded-2xl bg-[#2563eb] px-5 text-sm font-black text-white disabled:bg-slate-300" disabled={!draftBlockedId.trim()} onClick={addBlockedUser} type="button">
                加入
              </button>
            </div>
            <p className="mt-2 text-xs font-bold leading-5 text-slate-400">加入黑名单后，对方主页会显示已拉黑，并禁止发私信。</p>

            <div className="mt-4 grid gap-2">
              {blacklist.length === 0 ? (
                <div className="rounded-2xl bg-slate-50 px-4 py-5 text-center text-sm font-black text-slate-400">暂无黑名单用户</div>
              ) : blacklist.map((userId) => (
                <div className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3" key={userId}>
                  <ShieldCheck className="h-4 w-4 shrink-0 text-[#2563eb]" />
                  <span className="min-w-0 flex-1 truncate text-sm font-black text-[#111827]">{userId}</span>
                  <button className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-rose-500 shadow-sm" onClick={() => removeBlockedUser(userId)} type="button" aria-label="移除黑名单">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function ToggleRow({ checked, description, label, onChange }: { checked: boolean; description: string; label: string; onChange: (value: boolean) => void }) {
  return (
    <button className="flex w-full items-center justify-between gap-4 border-b border-slate-100 px-4 py-4 text-left last:border-b-0" onClick={() => onChange(!checked)} type="button">
      <span className="min-w-0">
        <span className="block text-[16px] font-black text-[#111827]">{label}</span>
        <span className="mt-1 block text-xs font-bold leading-5 text-slate-400">{description}</span>
      </span>
      <span className={`relative h-8 w-14 shrink-0 rounded-full transition ${checked ? "bg-[#2563eb]" : "bg-slate-200"}`}>
        <span className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow transition ${checked ? "left-7" : "left-1"}`} />
      </span>
    </button>
  );
}
