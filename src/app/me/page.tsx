"use client";

import type { User } from "@supabase/supabase-js";
import { Camera, FileText, Heart, LogIn, MessageCircle, Pencil, Search, Settings, UserRound } from "lucide-react";
import Link from "next/link";
import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { BackButton } from "@/components/BackButton";
import { CommunityPostImageFrame } from "@/components/community/CommunityPostImageFrame";
import { getCurrentCommunityUser, type CommunityUser } from "@/lib/community/currentUser";
import { getCommunityFavoriteIds, getCommunityPosts } from "@/lib/community/repository";
import type { CommunityPost } from "@/lib/community/types";
import { getCommunityPostHref } from "@/lib/community/routes";
import { withBackFrom } from "@/lib/navigation/back";
import { supabase } from "@/lib/supabase";

const avatarStorageKey = "japan-life:user-avatar";
const displayNameStorageKey = "japan-life:user-display-name";

type MeTab = "posts" | "favorites" | "liked";

function getUserAvatarUrl(user: User | null) {
  const value = user?.user_metadata?.avatar_url;
  return typeof value === "string" ? value : "";
}

function getUserDisplayName(user: User | null) {
  const metadata = user?.user_metadata;
  const value = metadata?.display_name ?? metadata?.full_name ?? metadata?.name;
  return typeof value === "string" ? value.trim() : "";
}

async function uploadAvatar(file: File) {
  const body = new FormData();
  body.append("file", file);
  body.append("folder", "avatars");
  const response = await fetch("/api/upload-public-image", { body, method: "POST" });
  const result = (await response.json().catch(() => null)) as { error?: string; publicUrl?: string } | null;
  if (!response.ok || !result?.publicUrl) throw new Error(result?.error || "头像上传失败");
  return result.publicUrl;
}

export default function MePage() {
  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [communityUser, setCommunityUser] = useState<CommunityUser | null>(null);
  const [avatarUrl, setAvatarUrl] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [activeTab, setActiveTab] = useState<MeTab>("posts");
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [favoritePosts, setFavoritePosts] = useState<CommunityPost[]>([]);
  const [avatarMessage, setAvatarMessage] = useState("");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  useEffect(() => {
    setAvatarUrl(window.localStorage.getItem(avatarStorageKey) ?? "");
    setDisplayName(window.localStorage.getItem(displayNameStorageKey) ?? "");

    let mounted = true;
    async function loadCommunity() {
      const current = await getCurrentCommunityUser();
      if (!mounted) return;
      setCommunityUser(current);
      const userId = current?.id;
      const [postResult, allResult, favoriteResult] = await Promise.all([
        userId ? getCommunityPosts({ authorId: userId, includeAllStatuses: true }) : Promise.resolve({ data: [] as CommunityPost[] }),
        getCommunityPosts({ locale: "all", status: "published" }),
        userId ? getCommunityFavoriteIds(userId) : Promise.resolve({ data: new Set<string>() }),
      ]);
      if (!mounted) return;
      setPosts(postResult.data);
      setFavoritePosts(allResult.data.filter((post) => favoriteResult.data.has(post.id)));
    }
    void loadCommunity().catch(() => {
      if (mounted) {
        setPosts([]);
        setFavoritePosts([]);
      }
    });

    if (!supabase) return () => {
      mounted = false;
    };

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      const nextUser = data.session?.user ?? null;
      applyUser(nextUser);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      applyUser(session?.user ?? null);
    });

    function applyUser(nextUser: User | null) {
      setUser(nextUser);
      setAvatarUrl(getUserAvatarUrl(nextUser) || window.localStorage.getItem(avatarStorageKey) || "");
      const nextDisplayName = getUserDisplayName(nextUser) || window.localStorage.getItem(displayNameStorageKey) || "";
      setDisplayName(nextDisplayName);
      if (nextDisplayName) window.localStorage.setItem(displayNameStorageKey, nextDisplayName);
    }

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const visiblePosts = useMemo(() => {
    if (activeTab === "favorites") return favoritePosts;
    if (activeTab === "liked") return [];
    return posts;
  }, [activeTab, favoritePosts, posts]);

  const name = displayName || communityUser?.name || user?.email?.split("@")[0] || "Japan Life 用户";
  const handleAvatarChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (event.target) event.target.value = "";
    if (!file || !supabase || !user) return;
    setUploadingAvatar(true);
    setAvatarMessage("");
    try {
      const publicUrl = await uploadAvatar(file);
      const { data, error } = await supabase.auth.updateUser({ data: { avatar_url: publicUrl } });
      if (error) throw error;
      window.localStorage.setItem(avatarStorageKey, publicUrl);
      setAvatarUrl(publicUrl);
      setUser(data.user);
      setAvatarMessage("头像已更新");
    } catch (error) {
      setAvatarMessage(error instanceof Error ? error.message : "头像上传失败");
    } finally {
      setUploadingAvatar(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f6faff] text-[#111827]">
      <div className="mx-auto min-h-screen w-full max-w-[430px] overflow-x-hidden bg-[#f6faff] pb-28">
        <section className="relative overflow-hidden bg-[linear-gradient(180deg,#5b6670_0%,#66717b_100%)] px-4 pb-7 pt-5 text-white">
          <div className="flex items-center justify-between">
            <BackButton variant="icon" />
            <div className="flex items-center gap-2">
              <Link className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white/18 px-3 text-xs font-black backdrop-blur" href="/community/profile">
                <Pencil className="h-3.5 w-3.5" />
                编辑主页
              </Link>
              <Link className="flex h-9 w-9 items-center justify-center rounded-full bg-white/18 backdrop-blur" href="/me/settings" aria-label="设置">
                <Settings className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <div className="mt-8 flex items-center gap-4">
            <button className="relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/95 text-[#2563eb] ring-2 ring-white/50" disabled={!user} onClick={() => avatarInputRef.current?.click()} type="button">
              {avatarUrl ? <img alt="" className="h-full w-full object-cover" src={avatarUrl} /> : <UserRound className="h-11 w-11" />}
              {user ? (
                <span className="absolute bottom-1 right-1 flex h-7 w-7 items-center justify-center rounded-full bg-white text-[#2563EB] shadow-sm">
                  <Camera className="h-3.5 w-3.5" />
                </span>
              ) : null}
            </button>
            <input ref={avatarInputRef} accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleAvatarChange} type="file" />
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-[28px] font-black leading-9">{name}</h1>
              <p className="mt-1 truncate text-sm font-bold text-white/72">Japan Life ID：{communityUser?.id?.slice(0, 10) || user?.id?.slice(0, 10) || "local-user"}</p>
              <p className="mt-1 text-sm font-bold text-white/72">IP：日本</p>
            </div>
          </div>

          <div className="mt-7 flex items-center gap-7 text-white">
            <ProfileStat label="笔记" value={posts.length} />
            <ProfileStat label="收藏" value={favoritePosts.length} />
            <ProfileStat label="获赞与收藏" value={posts.reduce((sum, post) => sum + post.likeCount + post.favoriteCount, 0)} />
          </div>

          <p className="mt-5 text-base font-black leading-6">分享在日生活，看看附近的人都在做什么</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="rounded-full bg-white/16 px-3 py-1.5 text-xs font-black backdrop-blur">日本东京都</span>
            {user ? null : (
              <Link className="inline-flex items-center gap-1.5 rounded-full bg-white/18 px-3 py-1.5 text-xs font-black backdrop-blur" href={withBackFrom("/login?next=/me")}>
                <LogIn className="h-3.5 w-3.5" />
                登录后同步主页
              </Link>
            )}
          </div>
          {uploadingAvatar || avatarMessage ? <p className="mt-3 rounded-2xl bg-white/16 px-3 py-2 text-xs font-black">{uploadingAvatar ? "头像上传中..." : avatarMessage}</p> : null}
        </section>

        <section className="-mt-4 rounded-t-[28px] bg-white pb-8">
          <div className="grid grid-cols-[1fr_1fr_1fr_auto] items-center border-b border-slate-100 px-2">
            <ProfileTab active={activeTab === "posts"} icon={FileText} label="笔记" onClick={() => setActiveTab("posts")} />
            <ProfileTab active={activeTab === "favorites"} icon={Heart} label="收藏" onClick={() => setActiveTab("favorites")} />
            <ProfileTab active={activeTab === "liked"} icon={Heart} label="赞过" onClick={() => setActiveTab("liked")} />
            <Link className="flex h-12 w-12 items-center justify-center text-slate-500" href="/community/all">
              <Search className="h-5 w-5" />
            </Link>
          </div>

          {activeTab === "liked" ? (
            <EmptyState text="赞过的内容暂时只保存在社区列表里，这里先保持简洁。" />
          ) : visiblePosts.length === 0 ? (
            <EmptyState text={activeTab === "favorites" ? "还没有收藏的社区笔记。" : "还没有发布笔记。"} />
          ) : (
            <div className="columns-2 gap-2 px-2 pt-3 [column-fill:_balance]">
              {visiblePosts.map((post) => (
                <ProfilePostCard key={post.id} post={post} />
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function ProfileStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="min-w-0">
      <p className="text-[23px] font-black leading-7">{value}</p>
      <p className="mt-0.5 whitespace-nowrap text-sm font-black text-white/72">{label}</p>
    </div>
  );
}

function ProfileTab({ active, icon: Icon, label, onClick }: { active: boolean; icon: typeof FileText; label: string; onClick: () => void }) {
  return (
    <button className={`relative flex h-14 items-center justify-center gap-1.5 text-[15px] font-black ${active ? "text-[#111827]" : "text-slate-400"}`} onClick={onClick} type="button">
      <Icon className="h-4 w-4" />
      {label}
      {active ? <span className="absolute bottom-2 left-1/2 h-1 w-8 -translate-x-1/2 rounded-full bg-[#ef4056]" /> : null}
    </button>
  );
}

function ProfilePostCard({ post }: { post: CommunityPost }) {
  return (
    <article className="mb-2 break-inside-avoid overflow-hidden rounded-[10px] bg-white shadow-[0_8px_22px_rgba(15,23,42,0.06)] ring-1 ring-slate-100">
      <Link href={getCommunityPostHref(post, "all")}>
        <div className="h-[162px] overflow-hidden rounded-[8px]">
          <CommunityPostImageFrame image={post.images?.[0]} type={post.type} />
        </div>
        <div className="px-2 py-2">
          <h2 className="line-clamp-2 text-[13px] font-black leading-[19px]">{post.title}</h2>
          <div className="mt-2 flex items-center justify-between gap-2 text-[11px] font-black text-slate-500">
            <span className="truncate">{post.area}</span>
            <span className="inline-flex items-center gap-1">
              <Heart className="h-3.5 w-3.5" />
              {post.likeCount + post.favoriteCount}
            </span>
          </div>
        </div>
      </Link>
    </article>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="px-4 py-10 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-[#2563eb]">
        <MessageCircle className="h-6 w-6" />
      </div>
      <p className="mt-3 text-sm font-black text-slate-500">{text}</p>
      <Link className="mt-4 inline-flex h-10 items-center rounded-full bg-[#ef4056] px-5 text-sm font-black text-white" href="/community/all/new">
        去发布
      </Link>
    </div>
  );
}
