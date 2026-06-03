"use client";

import { ChevronRight, ShieldCheck, X } from "lucide-react";
import { useEffect, useState } from "react";
import { BackButton } from "@/components/BackButton";
import { useLanguage } from "@/hooks/useLanguage";
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

const privacyCopy = {
  "zh-CN": {
    title: "隐私设置",
    intro: "管理别人进入你的主页时可以看到哪些内容，也可以设置谁能给你发私信。",
    toggles: {
      comments: { label: "公开我的评论", description: "默认关闭。关闭后，别人进你的主页不能看你评论过的内容。" },
      following: { label: "公开我的关注列表", description: "关闭后，别人点击你的关注数时会看到隐私提示。" },
      followers: { label: "公开我的粉丝列表", description: "关闭后，别人点击你的粉丝数时会看到隐私提示。" },
    },
    privateMessages: "私信权限",
    privacyOptions: [
      { description: "任何人都可以给你发私信。", label: "所有人", value: "all" },
      { description: "只有你关注的人可以给你发私信。", label: "我关注的人", value: "following" },
      { description: "只允许互相关注的人给你发私信。", label: "互相关注", value: "mutual" },
    ] satisfies Array<{ description: string; label: string; value: CommunityPrivateMessagePrivacy }>,
    blacklist: "黑名单",
    idPlaceholder: "输入 Japan Life ID",
    add: "加入",
    blacklistHint: "加入黑名单后，对方主页会显示已拉黑，并禁止发私信。",
    emptyBlacklist: "暂无黑名单用户",
    removeBlacklist: "移除黑名单",
  },
  "zh-TW": {
    title: "隱私設定",
    intro: "管理別人進入你的主頁時可以看到哪些內容，也可以設定誰能傳私訊給你。",
    toggles: {
      comments: { label: "公開我的評論", description: "預設關閉。關閉後，別人進你的主頁不能看你評論過的內容。" },
      following: { label: "公開我的關注列表", description: "關閉後，別人點擊你的關注數時會看到隱私提示。" },
      followers: { label: "公開我的粉絲列表", description: "關閉後，別人點擊你的粉絲數時會看到隱私提示。" },
    },
    privateMessages: "私訊權限",
    privacyOptions: [
      { description: "任何人都可以傳私訊給你。", label: "所有人", value: "all" },
      { description: "只有你關注的人可以傳私訊給你。", label: "我關注的人", value: "following" },
      { description: "只允許互相關注的人傳私訊給你。", label: "互相關注", value: "mutual" },
    ] satisfies Array<{ description: string; label: string; value: CommunityPrivateMessagePrivacy }>,
    blacklist: "黑名單",
    idPlaceholder: "輸入 Japan Life ID",
    add: "加入",
    blacklistHint: "加入黑名單後，對方主頁會顯示已拉黑，並禁止傳私訊。",
    emptyBlacklist: "暫無黑名單使用者",
    removeBlacklist: "移除黑名單",
  },
  ja: {
    title: "プライバシー設定",
    intro: "他のユーザーがあなたのプロフィールで見られる内容と、メッセージを送れる相手を設定できます。",
    toggles: {
      comments: { label: "コメントを公開", description: "初期設定はオフです。オフにすると、他のユーザーはあなたがコメントした内容を見られません。" },
      following: { label: "フォロー一覧を公開", description: "オフにすると、他のユーザーがフォロー数を押した時に非公開の案内が表示されます。" },
      followers: { label: "フォロワー一覧を公開", description: "オフにすると、他のユーザーがフォロワー数を押した時に非公開の案内が表示されます。" },
    },
    privateMessages: "メッセージ権限",
    privacyOptions: [
      { description: "誰でもあなたにメッセージを送れます。", label: "すべての人", value: "all" },
      { description: "あなたがフォローしている人だけが送れます。", label: "フォロー中の人", value: "following" },
      { description: "相互フォローの人だけが送れます。", label: "相互フォロー", value: "mutual" },
    ] satisfies Array<{ description: string; label: string; value: CommunityPrivateMessagePrivacy }>,
    blacklist: "ブロックリスト",
    idPlaceholder: "Japan Life ID を入力",
    add: "追加",
    blacklistHint: "ブロックリストに追加すると、相手のプロフィールにブロック中と表示され、メッセージ送信も禁止されます。",
    emptyBlacklist: "ブロック中のユーザーはいません",
    removeBlacklist: "ブロックリストから削除",
  },
} as const;
export default function CommunityPrivacySettingsPage() {
  const { language } = useLanguage();
  const text = privacyCopy[language];
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
          <h1 className="text-center text-[20px] font-black tracking-normal">{text.title}</h1>
          <span className="h-10 w-10" />
        </header>

        <p className="mt-6 px-1 text-sm font-black leading-6 text-slate-400">
          {text.intro}
        </p>

        <section className="mt-6 overflow-hidden rounded-[24px] bg-white shadow-[0_14px_34px_rgba(15,76,129,0.08)] ring-1 ring-slate-100">
          <ToggleRow checked={showComments} description={text.toggles.comments.description} label={text.toggles.comments.label} onChange={(value) => updateBooleanSetting(communityShowCommentsKey, setShowComments, value)} />
          <ToggleRow checked={showFollowing} description={text.toggles.following.description} label={text.toggles.following.label} onChange={(value) => updateBooleanSetting(communityShowFollowingKey, setShowFollowing, value)} />
          <ToggleRow checked={showFollowers} description={text.toggles.followers.description} label={text.toggles.followers.label} onChange={(value) => updateBooleanSetting(communityShowFollowersKey, setShowFollowers, value)} />
        </section>

        <section className="mt-7">
          <h2 className="px-1 text-sm font-black text-slate-400">{text.privateMessages}</h2>
          <div className="mt-3 overflow-hidden rounded-[24px] bg-white shadow-[0_14px_34px_rgba(15,76,129,0.08)] ring-1 ring-slate-100">
            {text.privacyOptions.map((option) => (
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
          <h2 className="px-1 text-sm font-black text-slate-400">{text.blacklist}</h2>
          <div className="mt-3 rounded-[24px] bg-white p-4 shadow-[0_14px_34px_rgba(15,76,129,0.08)] ring-1 ring-slate-100">
            <div className="flex gap-2">
              <input className="h-12 min-w-0 flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-black outline-none focus:border-[#2563eb]" onChange={(event) => setDraftBlockedId(event.target.value)} placeholder={text.idPlaceholder} value={draftBlockedId} />
              <button className="h-12 rounded-2xl bg-[#2563eb] px-5 text-sm font-black text-white disabled:bg-slate-300" disabled={!draftBlockedId.trim()} onClick={addBlockedUser} type="button">
                {text.add}
              </button>
            </div>
            <p className="mt-2 text-xs font-bold leading-5 text-slate-400">{text.blacklistHint}</p>

            <div className="mt-4 grid gap-2">
              {blacklist.length === 0 ? (
                <div className="rounded-2xl bg-slate-50 px-4 py-5 text-center text-sm font-black text-slate-400">{text.emptyBlacklist}</div>
              ) : blacklist.map((userId) => (
                <div className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3" key={userId}>
                  <ShieldCheck className="h-4 w-4 shrink-0 text-[#2563eb]" />
                  <span className="min-w-0 flex-1 truncate text-sm font-black text-[#111827]">{userId}</span>
                  <button className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-rose-500 shadow-sm" onClick={() => removeBlockedUser(userId)} type="button" aria-label={text.removeBlacklist}>
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


