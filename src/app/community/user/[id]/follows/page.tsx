"use client";

import { MoreHorizontal, Search, UserRound, X } from "lucide-react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { BackButton } from "@/components/BackButton";
import {
  followCommunityUser,
  getCommunityFollowList,
  getCommunityMutualFollowList,
  readCommunityFollowingUsers,
  unfollowCommunityUser,
  type CommunityFollowPageTab,
} from "@/lib/community/follow";
import { addCommunityBlockedUser, communityShowFollowersKey, communityShowFollowingKey } from "@/lib/community/privacy";
import { communityCurrentUserId } from "@/lib/community/storage";
import type { CommunityUserProfile } from "@/lib/community/types";
import { supabase } from "@/lib/supabase";

const tabs: Array<{ id: CommunityFollowPageTab; label: string }> = [
  { id: "mutual", label: "互相关注" },
  { id: "following", label: "关注" },
  { id: "followers", label: "粉丝" },
];
const profileIdKey = "japan-life:me-profile-id";

export default function CommunityFollowsPage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const userId = params.id;
  const initialTab = normalizeTab(searchParams.get("tab"));
  const [activeTab, setActiveTab] = useState<CommunityFollowPageTab>(initialTab);
  const [followingUsers, setFollowingUsers] = useState<Set<string>>(() => readCommunityFollowingUsers());
  const [localProfileId] = useState(() => typeof window === "undefined" ? "" : window.localStorage.getItem(profileIdKey) || "");
  const [currentAccountId, setCurrentAccountId] = useState("");
  const [query, setQuery] = useState("");
  const [showFollowers] = useState(() => typeof window === "undefined" ? true : window.localStorage.getItem(communityShowFollowersKey) !== "false");
  const [showFollowing] = useState(() => typeof window === "undefined" ? true : window.localStorage.getItem(communityShowFollowingKey) !== "false");
  const [confirmUnfollowUser, setConfirmUnfollowUser] = useState<CommunityUserProfile | null>(null);
  const [actionUser, setActionUser] = useState<CommunityUserProfile | null>(null);
  const isOwnProfile = userId === currentAccountId || userId === communityCurrentUserId || userId === "local-user" || userId === localProfileId;

  useEffect(() => {
    let mounted = true;
    if (!supabase) return;
    void supabase.auth.getSession().then(({ data }) => {
      if (mounted) setCurrentAccountId(data.session?.user.id ?? "");
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentAccountId(session?.user.id ?? "");
    });
    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const blockedByPrivacy = !isOwnProfile && (
    (activeTab === "following" && !showFollowing) ||
    (activeTab === "followers" && !showFollowers) ||
    (activeTab === "mutual" && (!showFollowing || !showFollowers))
  );

  const list = activeTab === "mutual"
    ? getCommunityMutualFollowList(userId, { isOwnProfile })
    : getCommunityFollowList(userId, activeTab, { isOwnProfile });

  const filteredList = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return list;
    return list.filter((user) => `${user.displayName} ${user.bio} ${user.area}`.toLowerCase().includes(keyword));
  }, [list, query]);

  const refreshRelations = (nextFollowing = readCommunityFollowingUsers()) => {
    setFollowingUsers(new Set(nextFollowing));
  };

  const followBack = (targetUserId: string) => {
    refreshRelations(followCommunityUser(targetUserId));
  };

  const requestUnfollow = (user: CommunityUserProfile) => {
    setActionUser(null);
    setConfirmUnfollowUser(user);
  };

  const confirmUnfollow = () => {
    if (!confirmUnfollowUser) return;
    refreshRelations(unfollowCommunityUser(confirmUnfollowUser.id));
    setConfirmUnfollowUser(null);
  };

  const blockUser = (user: CommunityUserProfile) => {
    addCommunityBlockedUser(user.id);
    setActionUser(null);
    setConfirmUnfollowUser(null);
    refreshRelations();
  };

  return (
    <main className="min-h-screen bg-white text-[#111827]">
      <div className="mx-auto min-h-screen w-full max-w-[430px] bg-white pb-24">
        <header className="sticky top-0 z-30 border-b border-slate-100 bg-white/95 px-4 pt-4 backdrop-blur">
          <div className="grid h-11 grid-cols-[44px_1fr] items-center">
            <BackButton fallbackHref={`/community/user/${userId}`} label="" />
            <nav className="grid grid-cols-3 text-center">
              {tabs.map((tab) => (
                <button className={`relative h-11 text-[16px] font-black transition ${activeTab === tab.id ? "text-[#111827]" : "text-slate-400"}`} key={tab.id} onClick={() => setActiveTab(tab.id)} type="button">
                  {tab.label}
                  {activeTab === tab.id ? <span className="absolute bottom-0 left-1/2 h-1 w-7 -translate-x-1/2 rounded-full bg-[#2563eb]" /> : null}
                </button>
              ))}
            </nav>
          </div>

          <label className="my-3 flex h-10 items-center gap-2 rounded-full bg-slate-100 px-4 text-slate-400">
            <Search className="h-4 w-4" />
            <input className="min-w-0 flex-1 bg-transparent text-sm font-bold text-[#111827] outline-none placeholder:text-slate-400" onChange={(event) => setQuery(event.target.value)} placeholder={activeTab === "followers" ? "搜索我的粉丝" : "搜索已关注的人"} value={query} />
          </label>
        </header>

        <section className="px-4 pt-4">
          <p className="mb-3 text-[13px] font-black text-slate-500">{getListTitle(activeTab, blockedByPrivacy ? 0 : filteredList.length)}</p>
          {blockedByPrivacy ? (
            <PrivateFollowState tab={activeTab} />
          ) : filteredList.length === 0 ? (
            <div className="mt-12 rounded-[24px] bg-blue-50 px-5 py-8 text-center text-sm font-black text-[#2563eb]">
              {activeTab === "mutual" ? "还没有互相关注的人" : activeTab === "following" ? "还没有关注的人" : "还没有粉丝"}
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredList.map((user) => (
                <FollowUserRow
                  isFollowing={followingUsers.has(user.id)}
                  key={user.id}
                  onBlock={() => blockUser(user)}
                  onFollowBack={() => followBack(user.id)}
                  onMore={() => setActionUser(user)}
                  onUnfollow={() => requestUnfollow(user)}
                  tab={activeTab}
                  user={user}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      {confirmUnfollowUser ? (
        <ConfirmDialog
          confirmLabel="不再关注"
          message="不再关注该作者？"
          onCancel={() => setConfirmUnfollowUser(null)}
          onConfirm={confirmUnfollow}
        />
      ) : null}

      {actionUser ? (
        <ActionSheet
          onBlock={() => blockUser(actionUser)}
          onClose={() => setActionUser(null)}
          onUnfollow={followingUsers.has(actionUser.id) ? () => requestUnfollow(actionUser) : undefined}
          user={actionUser}
        />
      ) : null}
    </main>
  );
}

function PrivateFollowState({ tab }: { tab: CommunityFollowPageTab }) {
  const label = tab === "mutual" ? "互相关注" : tab === "following" ? "关注" : "粉丝";
  return (
    <section className="mt-12 rounded-[24px] bg-blue-50 px-5 py-8 text-center shadow-[0_12px_28px_rgba(37,99,235,0.08)] ring-1 ring-blue-100">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white text-[#2563eb] ring-1 ring-blue-100">
        <UserRound className="h-6 w-6" />
      </div>
      <p className="mt-4 text-sm font-black text-[#2563eb]">TA 暂未公开{label}列表</p>
      <p className="mt-2 text-xs font-bold leading-5 text-slate-500">对方关闭公开后，只有本人可以查看这个列表。</p>
    </section>
  );
}

function FollowUserRow({ isFollowing, onFollowBack, onMore, onUnfollow, tab, user }: { isFollowing: boolean; onBlock: () => void; onFollowBack: () => void; onMore: () => void; onUnfollow: () => void; tab: CommunityFollowPageTab; user: CommunityUserProfile }) {
  const mutual = tab === "mutual" || isFollowing;
  const imageAvatar = isImageAvatar(user.avatar);
  return (
    <div className="flex items-center gap-3">
      <Link className="flex min-w-0 flex-1 items-center gap-3" href={`/community/user/${user.id}`}>
        <span className="flex h-[58px] w-[58px] shrink-0 items-center justify-center overflow-hidden rounded-full bg-[linear-gradient(135deg,#dbeafe,#ffffff,#e0f2fe)] text-[#2563eb] ring-1 ring-blue-100" style={!imageAvatar && user.avatar ? { background: user.avatar } : undefined}>
          {imageAvatar ? <img alt={user.displayName} className="h-full w-full object-cover" src={user.avatar} /> : <UserRound className="h-7 w-7" />}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[17px] font-black text-[#111827]">{user.displayName}</span>
          <span className="mt-1 block truncate text-[13px] font-bold text-slate-500">{getUserSubtitle(user)}</span>
        </span>
      </Link>

      {tab === "followers" && !mutual ? (
        <button className="h-9 shrink-0 rounded-full border border-[#2563eb] px-4 text-sm font-black text-[#2563eb]" onClick={onFollowBack} type="button">
          回关
        </button>
      ) : (
        <button className="flex h-9 shrink-0 items-center justify-center rounded-full border border-slate-200 px-4 text-sm font-black text-[#374151]" onClick={onUnfollow} type="button">
          {mutual ? "互相关注" : "已关注"}
        </button>
      )}

      <button className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[#111827]" onClick={onMore} type="button" aria-label="更多">
        <MoreHorizontal className="h-5 w-5" />
      </button>
    </div>
  );
}

function ConfirmDialog({ confirmLabel, message, onCancel, onConfirm }: { confirmLabel: string; message: string; onCancel: () => void; onConfirm: () => void }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/42 px-8">
      <section className="w-full max-w-[330px] overflow-hidden rounded-[18px] bg-white text-center shadow-[0_24px_70px_rgba(15,23,42,0.28)]">
        <p className="px-5 py-8 text-[19px] font-black text-[#111827]">{message}</p>
        <div className="grid grid-cols-2 border-t border-slate-100">
          <button className="h-14 border-r border-slate-100 text-[17px] font-black text-slate-400" onClick={onCancel} type="button">取消</button>
          <button className="h-14 text-[17px] font-black text-rose-500" onClick={onConfirm} type="button">{confirmLabel}</button>
        </div>
      </section>
    </div>
  );
}

function ActionSheet({ onBlock, onClose, onUnfollow, user }: { onBlock: () => void; onClose: () => void; onUnfollow?: () => void; user: CommunityUserProfile }) {
  return (
    <div className="fixed inset-0 z-[95] flex items-end justify-center bg-black/35 px-3 pb-3" onClick={onClose}>
      <section className="w-full max-w-[430px] overflow-hidden rounded-[22px] bg-white shadow-[0_20px_60px_rgba(15,23,42,0.24)]" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <p className="min-w-0 truncate text-sm font-black text-slate-500">{user.displayName}</p>
          <button className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-50 text-slate-500" onClick={onClose} type="button" aria-label="关闭">
            <X className="h-4 w-4" />
          </button>
        </div>
        {onUnfollow ? <button className="h-12 w-full border-b border-slate-100 text-[15px] font-black text-[#111827]" onClick={onUnfollow} type="button">不再关注</button> : null}
        <button className="h-12 w-full text-[15px] font-black text-rose-600" onClick={onBlock} type="button">拉黑并移除关注</button>
      </section>
    </div>
  );
}

function normalizeTab(value: string | null): CommunityFollowPageTab {
  if (value === "followers" || value === "following" || value === "mutual") return value;
  return "following";
}

function isImageAvatar(value?: string) {
  return Boolean(value && !value.startsWith("linear-gradient"));
}

function getListTitle(tab: CommunityFollowPageTab, count: number) {
  if (tab === "mutual") return `互相关注 (${count})`;
  if (tab === "followers") return `我的粉丝 (${count})`;
  return `已关注 (${count})`;
}

function getUserSubtitle(user: CommunityUserProfile) {
  if (user.postCount > 0) return `笔记 ${user.postCount} | 粉丝 ${user.likeReceivedCount + user.favoriteReceivedCount}`;
  return user.bio || "还没有简介";
}
