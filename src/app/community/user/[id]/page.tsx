"use client";

import { ArrowLeft, MapPin, MessageCircle, UserRound } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { CommunityCurationBadges } from "@/components/community/CommunityCurationBadges";
import { CommunityPostImageFrame } from "@/components/community/CommunityPostImageFrame";
import { CommunityEmptyState, CommunityErrorState } from "@/components/community/CommunityStates";
import { communityMockPosts } from "@/lib/community/mock";
import { communityCurrentUserId, getCommunityPosts, getCommunityProfile, mergeCommunityPosts, readCommunityPosts, readCommunityUserProfile, readCommunityUsers } from "@/lib/community/repository";
import { communityHomeHref, getCommunityPostHref } from "@/lib/community/routes";
import { getCommunityPostTypeLabel, type CommunityPost, type CommunityUserProfile } from "@/lib/community/types";

export default function CommunityUserPage() {
  const params = useParams<{ id: string }>();
  const userId = params.id;
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [supabaseEnabled, setSupabaseEnabled] = useState(false);
  const [user, setUser] = useState<CommunityUserProfile | null>(null);

  useEffect(() => {
    setPosts(readCommunityPosts());
    const currentProfile = readCommunityUserProfile();
    const users = readCommunityUsers();
    setUser(userId === communityCurrentUserId ? currentProfile : users.find((item) => item.id === userId) ?? null);
    let mounted = true;
    void Promise.all([getCommunityProfile(userId), getCommunityPosts({ authorId: userId })]).then(([profileResult, postsResult]) => {
      if (!mounted) return;
      if (profileResult.source === "supabase" && profileResult.data) {
        setSupabaseEnabled(true);
        setUser(profileResult.data);
      }
      if (postsResult.source === "supabase") {
        setSupabaseEnabled(true);
        setPosts(postsResult.data);
      }
    });
    return () => {
      mounted = false;
    };
  }, [userId]);

  const publicPosts = useMemo(
    () => (supabaseEnabled ? posts : mergeCommunityPosts(posts, communityMockPosts))
      .filter((post) => post.authorId === userId && post.status === "published" && !post.isAnonymous)
      .sort((left, right) => parseCommunityTime(right.createdAt) - parseCommunityTime(left.createdAt)),
    [posts, supabaseEnabled, userId],
  );

  if (!user) {
    return (
      <main className="jl-tool-theme min-h-screen text-[#061a3a]">
        <div className="jl-tool-shell mx-auto min-h-screen w-full max-w-[430px] px-4 pb-32 pt-5">
          <Link className="inline-flex h-9 items-center gap-2 rounded-full bg-white/85 px-4 text-sm font-black text-[#2563EB] shadow-sm ring-1 ring-blue-100" href={communityHomeHref}>
            <ArrowLeft className="h-4 w-4" />
            返回
          </Link>
          <div className="mt-4">
            <CommunityErrorState actionHref={communityHomeHref} description="这个用户可能不存在，或资料暂时不可见。" title="没有找到这个用户主页" />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="jl-tool-theme min-h-screen text-[#061a3a]">
      <div className="jl-tool-shell mx-auto min-h-screen w-full max-w-[430px] px-4 pb-32 pt-5">
        <div className="flex items-center justify-between gap-2">
          <Link className="inline-flex h-9 items-center gap-2 rounded-full bg-white/85 px-4 text-sm font-black text-[#2563EB] shadow-sm ring-1 ring-blue-100" href={communityHomeHref}>
            <ArrowLeft className="h-4 w-4" />
            返回
          </Link>
        </div>

        <section className="mt-4 rounded-[28px] border border-white/80 bg-white/85 p-[18px] shadow-[0_14px_32px_rgba(15,76,129,0.10)] backdrop-blur">
          <div className="flex gap-4">
            <span className="flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-[24px] text-white shadow-[0_14px_28px_rgba(37,99,235,0.18)]" style={{ background: user.avatar }}>
              <UserRound className="h-8 w-8" />
            </span>
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-[22px] font-[850] leading-7 text-[#061a3a]">{user.displayName}</h1>
              <p className="mt-1 inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-[#1D4ED8] ring-1 ring-blue-100">
                <MapPin className="h-3.5 w-3.5" />
                {user.area}
              </p>
              <p className="mt-2 text-[13px] font-bold leading-5 text-[#40546f]">{user.bio || "这个用户还没有填写简介。"}</p>
            </div>
          </div>
          <TagRow className="mt-4" items={user.languages} />
          <TagRow className="mt-2" items={user.interests} />
          <div className="mt-4 grid grid-cols-2 gap-2">
            <div className="rounded-[18px] bg-white/70 px-3 py-3 text-center ring-1 ring-blue-100">
              <p className="text-[18px] font-[850]">{publicPosts.length}</p>
              <p className="text-[11px] font-bold text-slate-500">公开发帖</p>
            </div>
            <div className="rounded-[18px] bg-white/70 px-3 py-3 text-center ring-1 ring-blue-100">
              <p className="text-[18px] font-[850]">{user.joinedAt}</p>
              <p className="text-[11px] font-bold text-slate-500">加入时间</p>
            </div>
          </div>
        </section>

        <div className="mt-3">
          <a className="flex h-[42px] items-center justify-center rounded-full bg-[linear-gradient(135deg,#2563eb,#38bdf8)] text-sm font-extrabold text-white shadow-[0_12px_24px_rgba(37,99,235,0.22)]" href="#public-posts">
            查看 TA 的帖子
          </a>
        </div>

        <section className="mt-4 grid gap-3" id="public-posts">
          <h2 className="px-1 text-lg font-black">TA 的公开帖子</h2>
          {publicPosts.length ? publicPosts.map((post) => <PostCard key={post.id} post={post} />) : <CommunityEmptyState description="TA 暂时没有公开帖子。" />}
        </section>
      </div>
    </main>
  );
}

function PostCard({ post }: { post: CommunityPost }) {
  return (
    <Link className="rounded-[24px] bg-white/88 p-4 shadow-[0_12px_30px_rgba(37,99,235,0.08)] ring-1 ring-white/80" href={getCommunityPostHref(post)}>
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
      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs font-black text-slate-500">
        <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5 text-[#2563EB]" />{post.area}</span>
        <span className="inline-flex items-center gap-1"><MessageCircle className="h-3.5 w-3.5" />{post.comments}</span>
      </div>
    </Link>
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

function parseCommunityTime(value: string) {
  const match = value.match(/^(\d{2})\/(\d{2})\s+(\d{2}):(\d{2})$/);
  if (!match) return 0;
  const [, month, day, hour, minute] = match;
  return new Date(2026, Number(month) - 1, Number(day), Number(hour), Number(minute)).getTime();
}
