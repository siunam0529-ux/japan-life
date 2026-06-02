"use client";

import { Eye, Headphones, Heart, Menu, Pencil, Search, Settings, UserRound, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { CommunityPostImageFrame } from "@/components/community/CommunityPostImageFrame";
import { CommunityEmptyState } from "@/components/community/CommunityStates";
import { isOwnAccountProfile, readMeProfile } from "@/lib/account/profile";
import { compareCommunityPosts } from "@/lib/community/curation";
import { getCommunityInterests, getCommunityRecommendationReason, getRecommendedPosts, shouldShowCommunityOnboarding } from "@/lib/community/preferences";
import { dispatchCommunityReactionChange } from "@/lib/community/reactionEvents";
import { getCommunityNewPostHref, getCommunityPostHref, getCommunityUserHref } from "@/lib/community/routes";
import { getCurrentCommunityUser, type CommunityUser } from "@/lib/community/currentUser";
import { addCommunityNotification, communityCurrentUserId, communityLikesStorageKey, createCommunityNotification, getCommunityLikeIds, getCommunityPosts, readCommunityIdSet, readCommunityPosts, readCommunityUsers, toggleCommunityLike } from "@/lib/community/repository";
import { communityLocaleConfigs, getCommunityPostTypeLabel, type CommunityPost, type CommunityPostType, type CommunityUserProfile, type CommunityViewLocale } from "@/lib/community/types";
import { withBackFrom } from "@/lib/navigation/back";

type CommunityTab = "recommend" | "follow" | "daily" | "help" | "secondhand" | "buddy";

const typeTone: Record<CommunityPostType, string> = {
  buddy: "bg-violet-50 text-violet-700 ring-violet-100",
  help: "bg-amber-50 text-amber-700 ring-amber-100",
  helper: "bg-blue-50 text-blue-700 ring-blue-100",
  secondhand: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  share: "bg-pink-50 text-pink-700 ring-pink-100",
};

const allCommunityCopy = {
  localeBadge: "All",
  postButtonLabel: "发布",
  searchPlaceholder: "搜索美食、租房、打工、Japan Life ID...",
  subtitle: "看看大家的在日生活动态",
  switchLabel: "社区",
  tabs: { buddy: "搭子", daily: "日常", help: "求助", nearby: "附近", recommend: "推荐", secondhand: "闲置" },
  title: "生活社区",
};
const localProfileIdKey = "japan-life:me-profile-id";
const communityFollowingUsersStorageKey = "japan-life-community-following-users";

export function CommunityFeed({ locale }: { locale: CommunityViewLocale }) {
  const router = useRouter();
  const copy = locale === "all" ? allCommunityCopy : communityLocaleConfigs[locale];
  const tabs: { id: CommunityTab; label: string; type?: CommunityPostType }[] = useMemo(() => [
    { id: "recommend", label: copy.tabs.recommend },
    { id: "daily", label: copy.tabs.daily, type: "share" },
    { id: "help", label: copy.tabs.help, type: "help" },
    { id: "secondhand", label: copy.tabs.secondhand, type: "secondhand" },
    { id: "buddy", label: copy.tabs.buddy, type: "buddy" },
  ], [copy.tabs.buddy, copy.tabs.daily, copy.tabs.help, copy.tabs.recommend, copy.tabs.secondhand]);
  const [activeTab, setActiveTab] = useState<CommunityTab>("recommend");
  const [likes, setLikes] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState("");
  const [currentUser, setCurrentUser] = useState<CommunityUser | null>(null);
  const [interests, setInterests] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [supabaseEnabled, setSupabaseEnabled] = useState(false);
  const [followingUsers, setFollowingUsers] = useState<Set<string>>(new Set());
  const [userPosts, setUserPosts] = useState<CommunityPost[]>([]);
  const [localProfileId, setLocalProfileId] = useState("");
  const [authorProfiles] = useState<Record<string, CommunityUserProfile>>({});

  useEffect(() => {
    let mounted = true;
    const localPosts = readCommunityPosts(locale === "all" ? "zh-cn" : locale).slice(0, 60);
    setUserPosts(localPosts);
    const preferenceState = getCommunityInterests();
    setInterests(preferenceState.interests);
    setLocalProfileId(window.localStorage.getItem(localProfileIdKey) || "");
    setFollowingUsers(readCommunityIdSet(communityFollowingUsersStorageKey));
    void shouldShowCommunityOnboarding;
    setLikes(readCommunityIdSet(communityLikesStorageKey));
    void getCurrentCommunityUser().then((user) => {
      if (mounted) setCurrentUser(user);
    });
    void getCommunityPosts({ limit: 60, locale }).then((result) => {
      if (!mounted) return;
      if (result.source === "supabase") {
        setSupabaseEnabled(true);
        setUserPosts(result.data);
      } else {
        setSupabaseEnabled(false);
      }
    });
    void getCommunityLikeIds().then((result) => {
      if (mounted && result.source === "supabase") setLikes(result.data);
    });
    const publishMessage = window.sessionStorage.getItem("japan-life-community-publish-message");
    if (publishMessage) {
      setMessage(publishMessage);
      window.sessionStorage.removeItem("japan-life-community-publish-message");
    }
    return () => {
      mounted = false;
    };
  }, [locale]);

  const allPosts = useMemo(
    () => userPosts
      .filter((post) => post.status === "published" && (locale === "all" || post.communityLocale === locale))
      .sort((left, right) => compareCommunityPosts(left, right, { chronologicalFirst: locale === "all", mode: activeTab === "recommend" ? "recommend" : "latest" })),
    [activeTab, locale, userPosts],
  );
  const visiblePosts = useMemo(() => {
    const tab = tabs.find((item) => item.id === activeTab);
    const keyword = query.trim().toLowerCase();
    const filteredPosts = allPosts.filter((post) => {
      const matchesFollow = activeTab !== "follow" || (post.authorId && followingUsers.has(post.authorId));
      const matchesTab = !tab?.type || post.type === tab.type;
      const profileSearchId = post.authorId === currentUser?.id || post.authorId === communityCurrentUserId ? localProfileId : "";
      const text = `${post.title} ${post.content} ${post.area} ${post.authorName} ${post.authorId} ${profileSearchId} ${post.tags.join(" ")}`.toLowerCase();
      return matchesFollow && matchesTab && (!keyword || text.includes(keyword));
    });
    return getRecommendedPosts(filteredPosts, interests, { mode: activeTab === "recommend" ? "recommend" : "latest" });
  }, [activeTab, allPosts, currentUser?.id, followingUsers, interests, localProfileId, query, tabs]);

  async function handleLike(postId: string) {
    if (!currentUser) {
      router.push(withBackFrom(`/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`));
      return;
    }

    const wasActive = likes.has(postId);

    if (!supabaseEnabled) {
      const result = await toggleCommunityLike(postId, currentUser.id);
      if (!result.data) {
        setMessage(result.error || "点赞失败，请稍后再试。");
        return;
      }
      const next = new Set(likes);
      if (result.data.active) next.add(postId);
      else next.delete(postId);
      setLikes(next);
      setUserPosts((items) => items.map((post) => post.id === postId ? {
        ...post,
        likeCount: result.data!.count,
        likes: result.data!.count,
      } : post));
      dispatchCommunityReactionChange({ active: result.data.active, count: result.data.count, postId, type: "like" });

      if (result.data.active && !wasActive) {
        const post = allPosts.find((item) => item.id === postId);
        if (post) {
          addCommunityNotification(createCommunityNotification({
            communityLocale: post.communityLocale,
            message: `你的分享「${post.title}」收到新的点赞。`,
            postId: post.id,
            targetId: post.id,
            targetType: "post",
            title: "有人点赞了你的帖子",
            type: "like",
            userId: post.authorId || communityCurrentUserId,
          }));
        }
      }
      return;
    }

    const result = await toggleCommunityLike(postId, currentUser.id);
    if (!result.data) {
      setMessage(result.error || "点赞失败，请稍后再试。");
      return;
    }

    const next = new Set(likes);
    if (result.data.active) next.add(postId);
    else next.delete(postId);
    setLikes(next);
    setUserPosts((items) => items.map((post) => post.id === postId ? {
      ...post,
      likeCount: result.data!.count,
      likes: result.data!.count,
    } : post));
    dispatchCommunityReactionChange({ active: result.data.active, count: result.data.count, postId, type: "like" });
  }

  function clearFilters() {
    setActiveTab("recommend");
    setQuery("");
  }

  return (
    <main className="min-h-screen bg-white text-[#111827]">
      <div className="mx-auto min-h-screen w-full max-w-[430px] px-2 pb-[132px]">
        <header className="-mx-2 border-b border-slate-100 bg-white/95">
          <div className="flex h-[58px] items-center justify-between px-3">
            <button className="flex h-10 w-10 items-center justify-center text-[#111827]" onClick={() => setDrawerOpen(true)} type="button" aria-label="打开社区菜单">
              <Menu className="h-7 w-7" />
            </button>
            <div className="flex items-center gap-8 text-[17px] font-black">
              <button className={`relative py-4 ${activeTab !== "follow" ? "text-[#111827] after:absolute after:bottom-2 after:left-1/2 after:h-1 after:w-7 after:-translate-x-1/2 after:rounded-full after:bg-[#ef4056]" : "text-slate-400"}`} onClick={() => setActiveTab("recommend")} type="button">
                发现
              </button>
              <button className={`relative py-4 ${activeTab === "follow" ? "text-[#111827] after:absolute after:bottom-2 after:left-1/2 after:h-1 after:w-7 after:-translate-x-1/2 after:rounded-full after:bg-[#ef4056]" : "text-slate-400"}`} onClick={() => setActiveTab("follow")} type="button">
                关注
              </button>
            </div>
            <div className="flex items-center gap-1">
              <Link className="flex h-10 w-10 items-center justify-center text-[#111827]" href={getCommunityNewPostHref(locale)} aria-label={copy.postButtonLabel}>
                <Pencil className="h-6 w-6" />
              </Link>
              <button className="flex h-10 w-10 items-center justify-center text-[#111827]" onClick={() => setSearchOpen((current) => !current)} type="button" aria-label="搜索">
                <Search className="h-7 w-7" />
              </button>
            </div>
          </div>

          {searchOpen || query ? (
            <label className="mx-3 mb-3 flex h-[40px] items-center gap-2 rounded-full bg-slate-100 px-4">
              <Search className="h-4 w-4 shrink-0 text-slate-500" />
              <input className="h-full min-w-0 flex-1 border-0 bg-transparent p-0 text-sm font-semibold outline-none placeholder:text-slate-400" onChange={(event) => setQuery(event.target.value)} placeholder={copy.searchPlaceholder} value={query} />
            </label>
          ) : null}

          <div className="flex h-[48px] items-center gap-7 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {tabs.map((tab) => (
              <button className={`h-full shrink-0 text-[15px] font-black ${activeTab === tab.id ? "text-[#111827]" : "text-slate-400"}`} key={tab.id} onClick={() => setActiveTab(tab.id)} type="button">
                {tab.label}
              </button>
            ))}
          </div>
        </header>

        {message ? <p className="mt-4 rounded-2xl bg-blue-50 px-4 py-3 text-xs font-black text-[#1D4ED8] ring-1 ring-blue-100">{message}</p> : null}
        <section className="mt-2 columns-2 gap-2 max-[359px]:columns-1">
          {visiblePosts.map((post) => (
            <CommunityPostCard
              key={post.id}
              likeActive={likes.has(post.id)}
              locale={locale}
              onLike={() => void handleLike(post.id)}
              post={post}
              currentUser={currentUser}
              profile={authorProfiles[post.authorId]}
              recommendationReason={activeTab === "recommend" ? getCommunityRecommendationReason(post, interests) : ""}
            />
          ))}
        </section>

        {visiblePosts.length === 0 ? (
          activeTab === "follow" ? (
            <CommunityEmptyState
              action={<button className="mt-3 inline-flex h-9 items-center justify-center rounded-full bg-white px-4 text-xs font-black text-[#2563EB] ring-1 ring-blue-100" onClick={() => setActiveTab("recommend")} type="button">去看看发现</button>}
              description="关注作者后，这里会单独显示他们的新帖子。"
              title="还没有关注作者"
            />
          ) : allPosts.length === 0 ? (
            <CommunityEmptyState
              actionHref={getCommunityNewPostHref(locale)}
              actionLabel="去发布"
              description="来发布第一条在日生活分享、求助、闲置或搭子帖吧。"
              title="还没有内容"
            />
          ) : (
            <CommunityEmptyState
              action={<button className="mt-3 inline-flex h-9 items-center justify-center rounded-full bg-white px-4 text-xs font-black text-[#2563EB] ring-1 ring-blue-100" onClick={clearFilters} type="button">清除筛选</button>}
              description="换个关键词、地区或分类试试看。"
              title="没有找到相关内容"
            />
          )
        ) : null}

        <CommunitySideDrawer activeLocale={locale} open={drawerOpen} onClose={() => setDrawerOpen(false)} />
      </div>
    </main>
  );
}

function CommunitySideDrawer({ activeLocale, onClose, open }: { activeLocale: CommunityViewLocale; onClose: () => void; open: boolean }) {
  if (!open) return null;
  const localeLinks: Array<{ href: string; id: CommunityViewLocale; label: string }> = [
    { href: "/community/all", id: "all", label: "社区首页" },
  ];
  return (
    <div className="fixed inset-0 z-50" aria-hidden={false}>
      <button className="absolute inset-0 bg-black/28" onClick={onClose} type="button" aria-label="关闭社区菜单" />
      <aside className="absolute inset-y-0 left-0 flex w-[78vw] max-w-[304px] flex-col bg-white px-5 pb-8 pt-5 shadow-[18px_0_48px_rgba(15,23,42,0.18)]">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] font-black text-slate-400">Japan Life</p>
            <h2 className="mt-1 text-xl font-black text-[#111827]">社区菜单</h2>
          </div>
          <button className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-700" onClick={onClose} type="button" aria-label="关闭">
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="mt-7 grid gap-2">
          {localeLinks.map((item) => {
            const active = activeLocale === item.id;
            return (
              <Link className={`flex h-12 items-center justify-between rounded-2xl px-4 text-sm font-black ${active ? "bg-slate-950 text-white" : "bg-slate-50 text-slate-800"}`} href={item.href} key={item.id} onClick={onClose}>
                {item.label}
                {active ? <span className="h-2 w-2 rounded-full bg-[#ef4056]" /> : null}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto grid grid-cols-2 gap-8 px-4 pt-8">
          <DrawerBottomLink href="/feedback" icon={<Headphones className="h-5 w-5" />} label="联系反馈" onClose={onClose} />
          <DrawerBottomLink href="/me/settings" icon={<Settings className="h-5 w-5" />} label="设置" onClose={onClose} />
        </div>
      </aside>
    </div>
  );
}

function DrawerBottomLink({ href, icon, label, onClose }: { href: string; icon: React.ReactNode; label: string; onClose: () => void }) {
  return (
    <Link className="flex min-w-0 flex-col items-center gap-2 text-center text-[12px] font-black text-slate-500 transition active:scale-95" href={href} onClick={onClose}>
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-600 ring-1 ring-slate-200">
        {icon}
      </span>
      <span className="whitespace-nowrap">{label}</span>
    </Link>
  );
}

function CommunityPostCard({ currentUser, likeActive, locale, onLike, post, profile, recommendationReason }: { currentUser: CommunityUser | null; likeActive: boolean; locale: CommunityViewLocale; onLike: () => void; post: CommunityPost; profile?: CommunityUserProfile; recommendationReason: string }) {
  const author = post.authorName;
  const imageHeight = getImageHeight(post.type);
  return (
    <article className="mb-3 min-w-0 break-inside-avoid overflow-hidden rounded-[10px] bg-white">
      <Link className="block" href={getCommunityPostHref(post, locale)}>
        <div className="relative overflow-hidden rounded-[8px]" style={{ height: imageHeight }}>
          <CommunityPostImageFrame image={post.images?.[0]} type={post.type} />
          <div className="absolute inset-0 bg-black/[0.02]" />
          <div className="absolute left-2 top-2 flex flex-wrap gap-1">
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-black ring-1 ${typeTone[post.type]}`}>{getCommunityPostTypeLabel(post.type)}</span>
          </div>
        </div>
        <div className="min-w-0 px-1.5 py-2">
          <h2 className="line-clamp-2 [overflow-wrap:anywhere] text-[14px] font-black leading-[20px]">{post.title}</h2>
          {recommendationReason ? <p className="mt-1 line-clamp-1 text-[10.5px] font-bold leading-4 text-[#64748b]">{recommendationReason}</p> : null}
        </div>
      </Link>
      <div className="flex min-w-0 items-center justify-between gap-2 px-1.5 pb-3">
        <AuthorLink author={author} currentUser={currentUser} post={post} profile={profile} />
        <div className="flex shrink-0 items-center gap-2 text-[11px] font-black text-slate-500">
          <span className="inline-flex items-center gap-0.5 rounded-full px-1.5 py-1 text-slate-500">
            <Eye className="h-3.5 w-3.5" />
            {post.viewCount ?? post.views ?? 0}
          </span>
          <button className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-1 ${likeActive ? "bg-pink-50 text-pink-600" : "bg-white text-slate-500"}`} onClick={onLike} type="button" aria-label="点赞">
            <Heart className={`h-3.5 w-3.5 ${likeActive ? "fill-current" : ""}`} />
            {post.likeCount ?? post.likes}
          </button>
        </div>
      </div>
    </article>
  );
}

function AuthorLink({ author, currentUser, post, profile }: { author: string; currentUser: CommunityUser | null; post: CommunityPost; profile?: CommunityUserProfile }) {
  const avatarValue = getAuthorAvatar(post, currentUser, profile);
  const imageAvatar = isImageAvatar(avatarValue);
  const avatar = (
    <span className="flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-full bg-blue-50 text-[#2563EB]" style={avatarValue && !imageAvatar ? { background: avatarValue } : undefined}>
      {imageAvatar ? <img alt={author} className="h-full w-full object-cover" src={avatarValue} /> : <UserRound className="h-3.5 w-3.5" />}
    </span>
  );
  if (!post.authorId) {
    return (
      <div className="flex min-w-0 items-center gap-1.5">
        {avatar}
        <span className="truncate text-[11px] font-bold text-slate-600">{author}</span>
      </div>
    );
  }
  return (
    <div className="flex min-w-0 items-center gap-1.5">
      <Link className="shrink-0 rounded-full transition active:scale-95" href={withBackFrom(getCommunityUserHref(profile?.id || post.authorId))} aria-label={`查看 ${author} 的主页`}>
        {avatar}
      </Link>
      <span className="truncate text-[11px] font-bold text-slate-600">{author}</span>
    </div>
  );
}

function getAuthorAvatar(post: CommunityPost, currentUser: CommunityUser | null, profile?: CommunityUserProfile) {
  if (post.authorId && isOwnAccountProfile(post.authorId, currentUser)) return readMeProfile(currentUser).avatar;
  if (profile?.avatar) return profile.avatar;
  return readCommunityUsers().find((user) => user.id === post.authorId)?.avatar || "";
}

function isImageAvatar(value: string) {
  return value.startsWith("data:image") || value.startsWith("http") || value.startsWith("/");
}

function getImageHeight(type: CommunityPostType) {
  if (type === "share") return 154;
  if (type === "secondhand") return 166;
  if (type === "help") return 112;
  if (type === "buddy") return 138;
  return 126;
}
