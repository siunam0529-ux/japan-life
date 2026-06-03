"use client";

import { Bell, Edit3, Heart, LogOut, MapPin, MessageCircle, Save, Star, UserRound } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { CommunityCurationBadges } from "@/components/community/CommunityCurationBadges";
import { CommunityInterestDialog } from "@/components/community/CommunityInterestDialog";
import { CommunityLoginRequiredCard } from "@/components/community/CommunityLoginRequiredCard";
import { CommunityNotificationButton } from "@/components/community/CommunityNotificationButton";
import { CommunityPostImageFrame } from "@/components/community/CommunityPostImageFrame";
import { CommunityEmptyState } from "@/components/community/CommunityStates";
import { getAccountAreaDisplay } from "@/lib/account/area";
import { getCurrentCommunityUser, type CommunityUser } from "@/lib/community/currentUser";
import { getCommunityInterests, saveCommunityInterests } from "@/lib/community/preferences";
import { communityReactionChangeEvent } from "@/lib/community/reactionEvents";
import { communityMeHref, getCommunityPostHref, getCommunitySelectionHref } from "@/lib/community/routes";
import {
  communityCurrentUserId,
  communityFavoritesStorageKey,
  communityLikesStorageKey,
  getCommunityFavoriteIds,
  getCommunityLikeIds,
  getCommunityProfile,
  getCommunityPosts,
  mergeCommunityPosts,
  readCommunityIdSet,
  readCommunityPosts,
  readCommunityUserProfile,
  upsertCommunityProfile,
  writeCommunityUserProfile,
} from "@/lib/community/repository";
import { getCommunityTopicHref } from "@/lib/community/topics";
import { getCommunityPostTypeLabel, type CommunityPost, type CommunityPostStatus, type CommunityUserProfile } from "@/lib/community/types";
import { supabase } from "@/lib/supabase";

type ProfileTab = "profile" | "posts" | "favorites" | "liked";

const profileTabs: { id: ProfileTab; label: string }[] = [
  { id: "profile", label: "资料" },
  { id: "posts", label: "我的帖子" },
  { id: "favorites", label: "我的收藏" },
  { id: "liked", label: "我赞过" },
];

const languageOptions = ["中文", "English"];
const interestOptions = ["美食", "散步", "省钱", "生活分享", "打工", "租房", "宠物", "语言交换", "手续", "二手", "搬家", "咖啡", "看展"];

const statusLabels: Record<CommunityPostStatus, string> = {
  deleted: "已删除",
  hidden: "已隐藏",
  pending: "待审核",
  published: "已发布",
  reported: "被举报",
};

function createDefaultCommunityProfile(user: CommunityUser, localProfile: CommunityUserProfile): CommunityUserProfile {
  const localPublicId = localProfile.id && localProfile.id !== communityCurrentUserId ? localProfile.id : `jl-${user.id.slice(0, 8)}`;
  return {
    ...localProfile,
    accountId: user.id,
    id: localPublicId,
    area: "",
    displayName: user.name,
    interests: [],
    isAnonymousDefault: false,
    languages: [],
  };
}

export default function CommunityProfilePage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<ProfileTab>("profile");
  const [editing, setEditing] = useState(false);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [likeIds, setLikeIds] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState("");
  const [profileArea, setProfileArea] = useState("日本");
  const [interestDialogOpen, setInterestDialogOpen] = useState(false);
  const [localInterests, setLocalInterests] = useState<string[]>([]);
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [profile, setProfile] = useState<CommunityUserProfile | null>(null);
  const [currentUser, setCurrentUser] = useState<CommunityUser | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  const refreshCommunityData = useCallback(async (user: CommunityUser, isMounted: () => boolean = () => true) => {
    const [postResult, publicPostResult, favoriteResult, likeResult] = await Promise.all([
      getCommunityPosts({ authorId: user.id, includeAllStatuses: true }),
      getCommunityPosts(),
      getCommunityFavoriteIds(user.id),
      getCommunityLikeIds(user.id),
    ]);
    if (!isMounted()) return;
    if (postResult.source === "supabase" || publicPostResult.source === "supabase") setPosts(mergeCommunityPosts(postResult.data, publicPostResult.data));
    else setPosts(readCommunityPosts());
    if (favoriteResult.source === "supabase") setFavoriteIds(favoriteResult.data);
    else setFavoriteIds(readCommunityIdSet(communityFavoritesStorageKey));
    if (likeResult.source === "supabase") setLikeIds(likeResult.data);
    else setLikeIds(readCommunityIdSet(communityLikesStorageKey));
  }, []);

  useEffect(() => {
    setProfile(readCommunityUserProfile());
    setProfileArea(getAccountAreaDisplay(readCommunityUserProfile().area));
    setLocalInterests(getCommunityInterests().interests);
    setPosts(readCommunityPosts());
    setFavoriteIds(readCommunityIdSet(communityFavoritesStorageKey));
    setLikeIds(readCommunityIdSet(communityLikesStorageKey));
    let mounted = true;
    void getCurrentCommunityUser().then(async (user) => {
      if (!mounted) return;
      setCurrentUser(user);
      setAuthChecked(true);
      if (!user) return;
      const localProfile = readCommunityUserProfile();
      const defaultProfile = createDefaultCommunityProfile(user, localProfile);
      setProfile(user.isMock ? localProfile : defaultProfile);
      await refreshCommunityData(user, () => mounted);
      if (!mounted) return;
      const profileResult = await getCommunityProfile(user.id);
      if (!mounted) return;
      if (profileResult.data && (profileResult.source === "supabase" || user.isMock)) {
        setProfile({ ...profileResult.data, accountId: user.id });
      } else {
        setProfile(defaultProfile);
      }
    });
    return () => {
      mounted = false;
    };
  }, [refreshCommunityData]);

  useEffect(() => {
    const refreshArea = () => setProfileArea(getAccountAreaDisplay(readCommunityUserProfile().area));
    window.addEventListener("japan-life:user-settings-change", refreshArea);
    window.addEventListener("storage", refreshArea);
    return () => {
      window.removeEventListener("japan-life:user-settings-change", refreshArea);
      window.removeEventListener("storage", refreshArea);
    };
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    const refresh = () => void refreshCommunityData(currentUser);
    window.addEventListener(communityReactionChangeEvent, refresh);
    window.addEventListener("focus", refresh);
    window.addEventListener("pageshow", refresh);
    return () => {
      window.removeEventListener(communityReactionChangeEvent, refresh);
      window.removeEventListener("focus", refresh);
      window.removeEventListener("pageshow", refresh);
    };
  }, [currentUser, refreshCommunityData]);

  const allPosts = useMemo(() => posts, [posts]);
  const currentUserId = profile?.accountId ?? currentUser?.id ?? communityCurrentUserId;
  const myPosts = useMemo(
    () => allPosts
      .filter((post) => post.authorId === currentUserId)
      .sort((left, right) => parseCommunityTime(right.createdAt) - parseCommunityTime(left.createdAt)),
    [allPosts, currentUserId],
  );
  const favoritePosts = useMemo(
    () => allPosts
      .filter((post) => post.status === "published" && favoriteIds.has(post.id))
      .sort((left, right) => parseCommunityTime(right.createdAt) - parseCommunityTime(left.createdAt)),
    [allPosts, favoriteIds],
  );
  const likedPosts = useMemo(
    () => allPosts
      .filter((post) => post.status === "published" && likeIds.has(post.id))
      .sort((left, right) => parseCommunityTime(right.createdAt) - parseCommunityTime(left.createdAt)),
    [allPosts, likeIds],
  );
  const stats = useMemo(() => ({
    comments: myPosts.reduce((sum, post) => sum + post.comments, 0),
    favorites: myPosts.reduce((sum, post) => sum + post.favorites, 0),
    likes: myPosts.reduce((sum, post) => sum + post.likes, 0),
    posts: myPosts.filter((post) => post.status !== "deleted").length,
  }), [myPosts]);

  async function saveProfile(nextProfile: CommunityUserProfile) {
    if (!currentUser) {
      setMessage("请先登录");
      return;
    }
    const profileWithStats = {
      ...nextProfile,
      accountId: currentUser.id,
      commentReceivedCount: stats.comments,
      favoriteReceivedCount: stats.favorites,
      likeReceivedCount: stats.likes,
      postCount: stats.posts,
    };
    const result = await upsertCommunityProfile(profileWithStats);
    if (result.source === "supabase" && result.error) {
      writeCommunityUserProfile(profileWithStats);
      setProfile(profileWithStats);
      setEditing(false);
      setMessage(`资料已先保存在本机，云端暂时不可用：${result.error}`);
      return;
    }
    if (result.source === "fallback") writeCommunityUserProfile(profileWithStats);
    setProfile(profileWithStats);
    setEditing(false);
    setMessage("资料已保存。");
  }

  async function handleSaveInterests(nextInterests: string[]) {
    const state = await saveCommunityInterests(nextInterests);
    setLocalInterests(state.interests);
    setProfile((current) => current ? { ...current, interests: state.interests } : current);
    setInterestDialogOpen(false);
    setMessage("兴趣已保存。");
  }

  async function handleSignOut() {
    if (currentUser?.isMock || !supabase) {
      setMessage("当前为本地预览用户，不需要退出登录。");
      return;
    }
    await supabase.auth.signOut();
    router.replace("/community/all");
  }

  if (!authChecked) {
    return (
      <main className="jl-tool-theme min-h-screen text-[#061a3a]">
        <div className="jl-tool-shell mx-auto min-h-screen w-full max-w-[430px] px-4 pb-32 pt-4">
          <div className="rounded-[24px] border border-white/80 bg-white/86 p-4 text-sm font-black text-[#2563EB] shadow-[0_12px_28px_rgba(15,76,129,0.08)]">加载中...</div>
        </div>
      </main>
    );
  }

  if (!currentUser) {
    return (
      <main className="jl-tool-theme min-h-screen text-[#061a3a]">
        <div className="jl-tool-shell mx-auto min-h-screen w-full max-w-[430px] px-4 pb-32 pt-4">
          <CommunityLoginRequiredCard />
        </div>
      </main>
    );
  }

  if (!profile) return null;
  const displayedInterests = profile.interests.length ? profile.interests : localInterests;
  const displayArea = getAccountAreaDisplay(profileArea || profile.area);

  return (
    <main className="jl-tool-theme min-h-screen text-[#061a3a]">
      <div className="jl-tool-shell mx-auto min-h-screen w-full max-w-[430px] px-4 pb-32 pt-4">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-lg font-[850] leading-7 text-[#061a3a]">社区资料</p>
            <p className="text-[11px] font-bold text-[#64748b]">我的社区资料</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <CommunityNotificationButton />
            <button className="inline-flex h-9 items-center gap-1 rounded-full bg-white/85 px-3 text-xs font-black text-[#2563EB] shadow-sm ring-1 ring-blue-100" onClick={handleSignOut} type="button">
              <LogOut className="h-3.5 w-3.5" />
              退出
            </button>
            <Link className="inline-flex h-9 items-center rounded-full bg-white/85 px-3 text-xs font-black text-[#2563EB] shadow-sm ring-1 ring-blue-100" href={communityMeHref}>
              我的社区
            </Link>
            <Link className="inline-flex h-9 items-center rounded-full bg-white/85 px-3 text-xs font-black text-[#2563EB] shadow-sm ring-1 ring-blue-100" href={getCommunitySelectionHref()}>
              切换
            </Link>
          </div>
        </div>

        {message ? <p className="mt-4 rounded-2xl bg-blue-50 px-4 py-3 text-xs font-black text-[#1D4ED8] ring-1 ring-blue-100">{message}</p> : null}

        <section className="mt-4 rounded-[28px] border border-white/80 bg-white/85 p-[18px] shadow-[0_14px_32px_rgba(15,76,129,0.10)] backdrop-blur">
          <div className="flex gap-4">
            <ProfileAvatar avatar={profile.avatar} name={profile.displayName} />
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-[22px] font-[850] leading-7 text-[#061a3a]">{profile.displayName}</h1>
              <p className="mt-1 inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-[#1D4ED8] ring-1 ring-blue-100">
                <MapPin className="h-3.5 w-3.5" />
                {displayArea}
              </p>
              <p className="mt-2 text-[13px] font-bold leading-5 text-[#40546f]">{profile.bio || "还没有填写个人简介。"}</p>
            </div>
          </div>
          <TagRow className="mt-4" items={profile.languages} />
          <TagRow className="mt-2" items={displayedInterests} />
          <p className="mt-3 text-xs font-bold text-slate-400">加入时间：{profile.joinedAt}</p>
        </section>

        <section className="mt-3 rounded-[24px] bg-white/85 p-4 shadow-[0_12px_28px_rgba(37,99,235,0.08)] ring-1 ring-white/80">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-base font-black">我的兴趣</h2>
              <p className="mt-1 text-xs font-bold text-slate-500">推荐流会优先显示这些话题相关内容。</p>
            </div>
            <button className="h-9 shrink-0 rounded-full bg-[#2563EB] px-4 text-xs font-black text-white shadow-[0_10px_20px_rgba(37,99,235,0.18)]" onClick={() => setInterestDialogOpen(true)} type="button">
              编辑兴趣
            </button>
          </div>
          {displayedInterests.length ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {displayedInterests.map((interest) => (
                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-[#1D4ED8] ring-1 ring-blue-100" key={interest}>#{interest}</span>
              ))}
            </div>
          ) : (
            <p className="mt-3 rounded-2xl bg-blue-50/70 px-3 py-2 text-xs font-bold text-slate-500 ring-1 ring-blue-100">还没有设置兴趣。</p>
          )}
        </section>

        <section className="mt-3 grid grid-cols-4 gap-2">
          <StatCard label="发帖" value={stats.posts} />
          <StatCard label="收到点赞" value={stats.likes} />
          <StatCard label="收到评论" value={stats.comments} />
          <StatCard label="收藏" value={stats.favorites} />
        </section>

        <section className="mt-3 grid grid-cols-2 gap-2">
          <button className="flex h-[42px] items-center justify-center gap-2 rounded-full bg-[linear-gradient(135deg,#2563eb,#38bdf8)] text-sm font-extrabold text-white shadow-[0_12px_24px_rgba(37,99,235,0.22)]" onClick={() => { setActiveTab("profile"); setEditing(true); }} type="button">
            <Edit3 className="h-4 w-4" />
            编辑资料
          </button>
          <ActionButton icon={<Star className="h-4 w-4" />} label="我的帖子" onClick={() => setActiveTab("posts")} />
          <ActionButton icon={<Heart className="h-4 w-4" />} label="我的收藏" onClick={() => setActiveTab("favorites")} />
          <ActionButton icon={<Heart className="h-4 w-4" />} label="我赞过" onClick={() => setActiveTab("liked")} />
          <Link className="flex h-[42px] items-center justify-center gap-2 rounded-full bg-white/85 text-sm font-black text-[#2563EB] shadow-sm ring-1 ring-blue-100" href={communityMeHref}>
            <UserRound className="h-4 w-4" />
            我的社区
          </Link>
          <Link className="flex h-[42px] items-center justify-center gap-2 rounded-full bg-white/85 text-sm font-black text-[#2563EB] shadow-sm ring-1 ring-blue-100" href="/notifications">
            <Bell className="h-4 w-4" />
            消息通知
          </Link>
        </section>

        <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
          {profileTabs.map((tab) => (
            <button className={`h-9 shrink-0 rounded-full px-4 text-sm font-black ${activeTab === tab.id ? "bg-[#2563EB] text-white shadow-[0_10px_22px_rgba(37,99,235,0.22)]" : "bg-white/80 text-slate-600 ring-1 ring-blue-100"}`} key={tab.id} onClick={() => setActiveTab(tab.id)} type="button">
              {tab.label}
            </button>
          ))}
        </div>

        <section className="mt-4 grid gap-3">
          {activeTab === "profile" && editing ? <ProfileForm onCancel={() => setEditing(false)} onSave={saveProfile} profile={profile} /> : null}
          {activeTab === "profile" && !editing ? <ProfileSummary profile={profile} /> : null}
          {activeTab === "posts" ? <PostList empty="你还没有发布帖子。" posts={myPosts} showStatus /> : null}
          {activeTab === "favorites" ? <PostList empty="你还没有收藏帖子。" posts={favoritePosts} /> : null}
          {activeTab === "liked" ? <PostList empty="你还没有点赞帖子。" posts={likedPosts} /> : null}
        </section>
        {interestDialogOpen ? (
          <CommunityInterestDialog
            initialInterests={displayedInterests}
            locale="all"
            onSave={(nextInterests) => void handleSaveInterests(nextInterests)}
            onSkip={() => setInterestDialogOpen(false)}
          />
        ) : null}
      </div>
    </main>
  );
}

function ProfileSummary({ profile }: { profile: CommunityUserProfile }) {
  return (
    <section className="rounded-[24px] bg-white/85 p-4 text-sm font-bold leading-6 text-slate-600 ring-1 ring-blue-100">
      <div>
        <p className="text-xs font-black text-[#061a3a]">我的兴趣话题</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {profile.interests.map((interest) => (
            <Link className="inline-flex h-[26px] items-center rounded-full bg-[rgba(219,234,254,0.72)] px-2.5 text-[11px] font-bold text-[#1d4ed8]" href={getCommunityTopicHref(interest)} key={interest}>
              #{interest}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function ProfileAvatar({ avatar, name }: { avatar: string; name: string }) {
  const imageAvatar = isImageAvatar(avatar);
  return (
    <span className="relative flex h-[72px] w-[72px] shrink-0 items-center justify-center overflow-hidden rounded-[24px] bg-blue-100 text-white shadow-[0_14px_28px_rgba(37,99,235,0.18)]" style={imageAvatar ? undefined : { background: avatar }}>
      {imageAvatar ? <Image alt={name} className="object-cover" fill sizes="72px" src={avatar} unoptimized /> : <UserRound className="h-8 w-8" />}
    </span>
  );
}

function isImageAvatar(value: string) {
  return /^(data:image\/|https?:\/\/|blob:|\/)/i.test(value.trim());
}

function ProfileForm({ onCancel, onSave, profile }: { onCancel: () => void; onSave: (profile: CommunityUserProfile) => void; profile: CommunityUserProfile }) {
  const [draft, setDraft] = useState(profile);

  function toggleValue(key: "interests" | "languages", value: string) {
    setDraft((current) => {
      const values = new Set(current[key]);
      if (values.has(value)) values.delete(value);
      else values.add(value);
      return { ...current, [key]: [...values] };
    });
  }

  return (
    <form className="grid gap-3 rounded-[24px] bg-white/88 p-4 shadow-[0_12px_30px_rgba(37,99,235,0.08)] ring-1 ring-white/80" onSubmit={(event) => { event.preventDefault(); onSave(draft); }}>
      <TextInput label="昵称" onChange={(value) => setDraft((current) => ({ ...current, displayName: value }))} value={draft.displayName} />
      <label className="grid gap-1.5">
        <span className="text-xs font-black text-slate-500">简介</span>
        <textarea className="min-h-24 rounded-2xl border border-blue-100 bg-white/90 px-4 py-3 text-sm font-bold leading-6 outline-none focus:border-[#2563EB]" onChange={(event) => setDraft((current) => ({ ...current, bio: event.target.value }))} value={draft.bio} />
      </label>
      <MultiSelect label="使用语言" onToggle={(value) => toggleValue("languages", value)} options={languageOptions} values={draft.languages} />
      <MultiSelect label="兴趣标签" onToggle={(value) => toggleValue("interests", value)} options={interestOptions} values={draft.interests} />
      <div className="grid grid-cols-2 gap-2">
        <button className="h-11 rounded-full bg-slate-50 text-sm font-black text-slate-600 ring-1 ring-slate-200" onClick={onCancel} type="button">取消</button>
        <button className="flex h-11 items-center justify-center gap-2 rounded-full bg-[linear-gradient(135deg,#2563eb,#38bdf8)] text-sm font-black text-white" disabled={!draft.displayName.trim()} type="submit">
          <Save className="h-4 w-4" />
          保存
        </button>
      </div>
    </form>
  );
}

function TextInput({ label, onChange, value }: { label: string; onChange: (value: string) => void; value: string }) {
  return (
    <label className="grid gap-1.5">
      <span className="text-xs font-black text-slate-500">{label}</span>
      <input className="h-11 rounded-2xl border border-blue-100 bg-white/90 px-4 text-sm font-bold outline-none focus:border-[#2563EB]" onChange={(event) => onChange(event.target.value)} value={value} />
    </label>
  );
}

function MultiSelect({ label, onToggle, options, values }: { label: string; onToggle: (value: string) => void; options: string[]; values: string[] }) {
  return (
    <div>
      <p className="text-xs font-black text-slate-500">{label}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {options.map((option) => {
          const active = values.includes(option);
          return (
            <button className={`h-[30px] rounded-full px-3 text-xs font-black ring-1 ${active ? "bg-[#2563EB] text-white ring-[#2563EB]" : "bg-blue-50/80 text-[#1D4ED8] ring-blue-100"}`} key={option} onClick={() => onToggle(option)} type="button">
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function PostList({ empty, posts, showStatus = false }: { empty: string; posts: CommunityPost[]; showStatus?: boolean }) {
  if (posts.length === 0) return <EmptyState text={empty} />;
  return posts.map((post) => <PostCard key={post.id} post={post} showStatus={showStatus} />);
}

function PostCard({ post, showStatus }: { post: CommunityPost; showStatus: boolean }) {
  const content = (
    <>
      <div className="-mx-1 -mt-1 mb-3 h-32 overflow-hidden rounded-[20px]">
        <CommunityPostImageFrame image={post.images?.[0]} type={post.type} />
      </div>
      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1.5">
          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-[#1D4ED8] ring-1 ring-blue-100">{getCommunityPostTypeLabel(post.type)}</span>
          <CommunityCurationBadges locale={post.communityLocale} post={post} />
        </div>
        <span className="text-xs font-bold text-slate-400">{post.createdAt}</span>
      </div>
      <h2 className="mt-2 line-clamp-2 text-base font-black">{post.title}</h2>
      <p className="mt-1 line-clamp-2 text-xs font-bold leading-5 text-slate-600">{post.content}</p>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-black text-slate-500">
        {showStatus ? <span className="rounded-full bg-slate-50 px-3 py-1 ring-1 ring-slate-200">{statusLabels[post.status]}</span> : null}
        <span className="inline-flex items-center gap-1"><Heart className="h-3.5 w-3.5" />{post.likes}</span>
        <span className="inline-flex items-center gap-1"><MessageCircle className="h-3.5 w-3.5" />{post.comments}</span>
      </div>
    </>
  );

  if (post.status !== "published") {
    return <article className="rounded-[24px] bg-white/88 p-4 shadow-[0_12px_30px_rgba(37,99,235,0.08)] ring-1 ring-white/80">{content}</article>;
  }
  return (
    <Link className="rounded-[24px] bg-white/88 p-4 shadow-[0_12px_30px_rgba(37,99,235,0.08)] ring-1 ring-white/80" href={getCommunityPostHref(post)}>
      {content}
    </Link>
  );
}

function ActionButton({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button className="flex h-[42px] items-center justify-center gap-2 rounded-full bg-white/85 text-sm font-black text-[#2563EB] shadow-sm ring-1 ring-blue-100" onClick={onClick} type="button">
      {icon}
      {label}
    </button>
  );
}

function TagRow({ className = "", items }: { className?: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div className={`${className} flex flex-wrap gap-2`}>
      {items.map((item) => (
        <span className="inline-flex h-[26px] items-center rounded-full bg-[rgba(219,234,254,0.72)] px-2.5 text-[11px] font-bold text-[#1d4ed8]" key={item}>{item}</span>
      ))}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[20px] bg-white/85 px-2 py-3 text-center shadow-sm ring-1 ring-blue-100">
      <p className="text-[18px] font-[850] leading-6 text-[#061a3a]">{value}</p>
      <p className="mt-0.5 text-[11px] font-bold text-slate-500">{label}</p>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return <CommunityEmptyState description={text} />;
}

function parseCommunityTime(value: string) {
  const match = value.match(/^(\d{2})\/(\d{2})\s+(\d{2}):(\d{2})$/);
  if (!match) return 0;
  const [, month, day, hour, minute] = match;
  return new Date(2026, Number(month) - 1, Number(day), Number(hour), Number(minute)).getTime();
}
