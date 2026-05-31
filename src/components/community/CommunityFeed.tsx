"use client";

import { Bell, Heart, Home, Menu, MessageCircle, Plus, Search, UserRound, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { CommunityInterestDialog } from "@/components/community/CommunityInterestDialog";
import { CommunityPostImageFrame } from "@/components/community/CommunityPostImageFrame";
import { CommunityEmptyState } from "@/components/community/CommunityStates";
import { compareCommunityPosts } from "@/lib/community/curation";
import { communityMockPosts } from "@/lib/community/mock";
import { getCommunityInterests, getCommunityRecommendationReason, getRecommendedPosts, markCommunityOnboardingSkipped, saveCommunityInterests, shouldShowCommunityOnboarding } from "@/lib/community/preferences";
import { getCommunityNewPostHref, getCommunityPostHref, getCommunityUserHref } from "@/lib/community/routes";
import { getCurrentCommunityUser, type CommunityUser } from "@/lib/community/currentUser";
import { addCommunityNotification, communityCurrentUserId, communityLikesStorageKey, createCommunityNotification, getCommunityLikeIds, getCommunityPosts, mergeCommunityPosts, readCommunityIdSet, readCommunityPosts, toggleCommunityLike, writeCommunityIdSet } from "@/lib/community/repository";
import { communityLocaleConfigs, getCommunityPostTypeLabel, type CommunityPost, type CommunityPostType, type CommunityViewLocale } from "@/lib/community/types";

type CommunityTab = "recommend" | "daily" | "nearby" | "help" | "secondhand" | "buddy";

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
  searchPlaceholder: "搜索美食、租房、打工、闲置、搭子...",
  subtitle: "看看大家的在日生活动态",
  switchLabel: "切换社区",
  tabs: { buddy: "搭子", daily: "日常", help: "求助", nearby: "附近", recommend: "推荐", secondhand: "闲置" },
  title: "生活社区",
};

export function CommunityFeed({ locale }: { locale: CommunityViewLocale }) {
  const router = useRouter();
  const copy = locale === "all" ? allCommunityCopy : communityLocaleConfigs[locale];
  const tabs: { id: CommunityTab; label: string; type?: CommunityPostType }[] = useMemo(() => [
    { id: "recommend", label: copy.tabs.recommend },
    { id: "daily", label: copy.tabs.daily, type: "share" },
    { id: "nearby", label: copy.tabs.nearby },
    { id: "help", label: copy.tabs.help, type: "help" },
    { id: "secondhand", label: copy.tabs.secondhand, type: "secondhand" },
    { id: "buddy", label: copy.tabs.buddy, type: "buddy" },
  ], [copy.tabs.buddy, copy.tabs.daily, copy.tabs.help, copy.tabs.nearby, copy.tabs.recommend, copy.tabs.secondhand]);
  const [activeTab, setActiveTab] = useState<CommunityTab>("recommend");
  const [likes, setLikes] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState("");
  const [currentUser, setCurrentUser] = useState<CommunityUser | null>(null);
  const [interestDialogOpen, setInterestDialogOpen] = useState(false);
  const [interests, setInterests] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [supabaseEnabled, setSupabaseEnabled] = useState(false);
  const [userPosts, setUserPosts] = useState<CommunityPost[]>([]);

  useEffect(() => {
    let mounted = true;
    const localPosts = readCommunityPosts(locale === "all" ? "zh-cn" : locale);
    setUserPosts(localPosts);
    const preferenceState = getCommunityInterests();
    setInterests(preferenceState.interests);
    if (shouldShowCommunityOnboarding()) setInterestDialogOpen(true);
    setLikes(readCommunityIdSet(communityLikesStorageKey));
    void getCurrentCommunityUser().then((user) => {
      if (mounted) setCurrentUser(user);
    });
    void getCommunityPosts({ locale }).then((result) => {
      if (!mounted) return;
      if (result.source === "supabase" && result.data.length > 0) {
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
    () => (supabaseEnabled ? userPosts : mergeCommunityPosts(userPosts, communityMockPosts))
      .filter((post) => post.status === "published" && (locale === "all" || post.communityLocale === locale))
      .sort((left, right) => compareCommunityPosts(left, right, { chronologicalFirst: locale === "all", mode: activeTab === "recommend" ? "recommend" : "latest" })),
    [activeTab, locale, supabaseEnabled, userPosts],
  );
  const visiblePosts = useMemo(() => {
    const tab = tabs.find((item) => item.id === activeTab);
    const keyword = query.trim().toLowerCase();
    const filteredPosts = allPosts.filter((post) => {
      const matchesTab = !tab?.type || post.type === tab.type;
      const matchesNearby = activeTab !== "nearby" || ["东京", "東京", "新宿", "池袋", "板桥区", "板橋區", "板橋区", "练马", "練馬", "上野", "涩谷", "澀谷", "渋谷"].includes(post.area);
      const text = `${post.title} ${post.content} ${post.area} ${post.authorName} ${post.tags.join(" ")}`.toLowerCase();
      return matchesTab && matchesNearby && (!keyword || text.includes(keyword));
    });
    return getRecommendedPosts(filteredPosts, interests, { mode: activeTab === "recommend" ? "recommend" : "latest" });
  }, [activeTab, allPosts, interests, query, tabs]);

  async function handleSaveInterests(nextInterests: string[]) {
    const state = await saveCommunityInterests(nextInterests);
    setInterests(state.interests);
    setInterestDialogOpen(false);
    setMessage("已根据你的兴趣推荐内容。");
  }

  function handleSkipInterests() {
    markCommunityOnboardingSkipped();
    setInterestDialogOpen(false);
  }

  async function handleLike(postId: string) {
    if (!currentUser) {
      router.push(`/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`);
      return;
    }

    const wasActive = likes.has(postId);

    if (!supabaseEnabled) {
      const next = new Set(likes);
      if (wasActive) next.delete(postId);
      else next.add(postId);
      setLikes(next);
      writeCommunityIdSet(communityLikesStorageKey, next);

      if (!wasActive) {
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
              <button className={`relative py-4 ${activeTab !== "nearby" ? "text-[#111827] after:absolute after:bottom-2 after:left-1/2 after:h-1 after:w-7 after:-translate-x-1/2 after:rounded-full after:bg-[#ef4056]" : "text-slate-400"}`} onClick={() => setActiveTab("recommend")} type="button">
                发现
              </button>
              <button className={`relative py-4 ${activeTab === "nearby" ? "text-[#111827] after:absolute after:bottom-2 after:left-1/2 after:h-1 after:w-7 after:-translate-x-1/2 after:rounded-full after:bg-[#ef4056]" : "text-slate-400"}`} onClick={() => setActiveTab("nearby")} type="button">
                附近
              </button>
            </div>
            <button className="flex h-10 w-10 items-center justify-center text-[#111827]" onClick={() => setSearchOpen((current) => !current)} type="button" aria-label="搜索">
              <Search className="h-7 w-7" />
            </button>
          </div>

          {searchOpen || query ? (
            <label className="mx-3 mb-3 flex h-[40px] items-center gap-2 rounded-full bg-slate-100 px-4">
              <Search className="h-4 w-4 shrink-0 text-slate-500" />
              <input className="h-full min-w-0 flex-1 border-0 bg-transparent p-0 text-sm font-semibold outline-none placeholder:text-slate-400" onChange={(event) => setQuery(event.target.value)} placeholder={copy.searchPlaceholder} value={query} />
            </label>
          ) : null}

          <div className="flex h-[48px] items-center gap-7 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {tabs.filter((tab) => tab.id !== "nearby").map((tab) => (
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
              recommendationReason={activeTab === "recommend" ? getCommunityRecommendationReason(post, interests) : ""}
            />
          ))}
        </section>

        {visiblePosts.length === 0 ? (
          allPosts.length === 0 ? (
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

        <Link className="fixed bottom-[104px] right-5 z-40 inline-flex h-11 items-center gap-2 rounded-full bg-[linear-gradient(135deg,#2563eb,#38bdf8)] px-4 text-sm font-black text-white shadow-[0_16px_32px_rgba(37,99,235,0.28)]" href={getCommunityNewPostHref(locale)}>
          <Plus className="h-5 w-5" />
          {copy.postButtonLabel}
        </Link>
        <CommunitySideDrawer activeLocale={locale} open={drawerOpen} onClose={() => setDrawerOpen(false)} />
        {interestDialogOpen ? (
          <CommunityInterestDialog
            initialInterests={interests}
            locale={locale}
            onSave={(nextInterests) => void handleSaveInterests(nextInterests)}
            onSkip={handleSkipInterests}
          />
        ) : null}
      </div>
    </main>
  );
}

function CommunitySideDrawer({ activeLocale, onClose, open }: { activeLocale: CommunityViewLocale; onClose: () => void; open: boolean }) {
  const localeLinks: Array<{ href: string; id: CommunityViewLocale; label: string }> = [
    { href: "/community/all", id: "all", label: "社区首页" },
  ];
  const actionLinks = [
    { href: getCommunityNewPostHref(activeLocale), icon: Plus, label: "发布帖子" },
    { href: "/community/me", icon: UserRound, label: "我的社区" },
    { href: "/community/notifications", icon: Bell, label: "通知" },
    { href: "/community/profile", icon: UserRound, label: "社区资料" },
    { href: "/", icon: Home, label: "返回首页" },
  ];

  return (
    <div className={`fixed inset-0 z-50 transition ${open ? "pointer-events-auto" : "pointer-events-none"}`} aria-hidden={!open}>
      <button className={`absolute inset-0 bg-black/28 transition-opacity ${open ? "opacity-100" : "opacity-0"}`} onClick={onClose} type="button" aria-label="关闭社区菜单" />
      <aside className={`absolute inset-y-0 left-0 w-[78vw] max-w-[304px] bg-white px-5 pb-8 pt-5 shadow-[18px_0_48px_rgba(15,23,42,0.18)] transition-transform duration-300 ${open ? "translate-x-0" : "-translate-x-full"}`}>
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

        <div className="mt-6 h-px bg-slate-100" />

        <nav className="mt-6 grid gap-1.5">
          {actionLinks.map((item) => {
            const Icon = item.icon;
            return (
              <Link className="flex h-11 items-center gap-3 rounded-2xl px-3 text-sm font-black text-slate-800 transition active:bg-slate-100" href={item.href} key={item.label} onClick={onClose}>
                <Icon className="h-4 w-4 text-slate-500" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
    </div>
  );
}

function CommunityPostCard({ likeActive, locale, onLike, post, recommendationReason }: { likeActive: boolean; locale: CommunityViewLocale; onLike: () => void; post: CommunityPost; recommendationReason: string }) {
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
        <AuthorLink author={author} post={post} />
        <div className="flex shrink-0 items-center gap-2 text-[11px] font-black text-slate-500">
          <button className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-1 ${likeActive ? "bg-pink-50 text-pink-600" : "bg-white text-slate-500"}`} onClick={onLike} type="button" aria-label="点赞">
            <Heart className={`h-3.5 w-3.5 ${likeActive ? "fill-current" : ""}`} />
            {post.likes + (likeActive ? 1 : 0)}
          </button>
          <span className="inline-flex items-center gap-0.5">
            <MessageCircle className="h-3.5 w-3.5" />
            {post.comments}
          </span>
        </div>
      </div>
    </article>
  );
}

function AuthorLink({ author, post }: { author: string; post: CommunityPost }) {
  const content = (
    <>
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-50 text-[#2563EB]">
        <UserRound className="h-3.5 w-3.5" />
      </span>
      <span className="truncate text-[11px] font-bold text-slate-600">{author}</span>
    </>
  );
  if (!post.authorId) {
    return <div className="flex min-w-0 items-center gap-1.5">{content}</div>;
  }
  return (
    <Link className="flex min-w-0 items-center gap-1.5 rounded-full pr-1 transition hover:bg-blue-50/70" href={getCommunityUserHref(post.authorId)}>
      {content}
    </Link>
  );
}

function getImageHeight(type: CommunityPostType) {
  if (type === "share") return 154;
  if (type === "secondhand") return 166;
  if (type === "help") return 112;
  if (type === "buddy") return 138;
  return 126;
}
