"use client";

import { ArrowLeft, Eye, RefreshCw, Search } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { communityMockPosts } from "@/lib/community/mock";
import { isCommunityPostFeatured } from "@/lib/community/curation";
import { getCommunityPostHref, communitySelectionHref } from "@/lib/community/routes";
import {
  mapCommentFromDb,
  mapContactRequestFromDb,
  mapPostFromDb,
  mapReportFromDb,
  type CommunityCommentRow,
  type CommunityContactRequestRow,
  type CommunityPostRow,
  type CommunityReportRow,
} from "@/lib/community/repository";
import {
  addCommunityNotification,
  communityCurrentUserId,
  createCommunityNotification,
  readCommunityComments,
  readCommunityContactRequests,
  readCommunityPosts,
  readCommunityReports,
  writeCommunityComments,
  writeCommunityContactRequests,
  writeCommunityPosts,
  writeCommunityReports,
} from "@/lib/community/repository";
import {
  communityLocaleBadges,
  getCommunityPostTypeLabel,
  type CommunityComment,
  type CommunityCommentStatus,
  type CommunityContactRequest,
  type CommunityContactRequestStatus,
  type CommunityLocale,
  type CommunityPost,
  type CommunityPostStatus,
  type CommunityPostType,
  type CommunityReport,
  type CommunityReportTargetType,
  type CommunityViewLocale,
} from "@/lib/community/types";

type AdminTab = "pending" | "published" | "reported" | "hidden" | "comments";
type CurationFilter = "all" | "pinned" | "featured" | "official" | "normal";
type PostTypeFilter = "all" | CommunityPostType;

const sessionKey = "japan-life-admin-auth";

const tabs: { id: AdminTab; label: string }[] = [
  { id: "pending", label: "待审核" },
  { id: "published", label: "已发布" },
  { id: "reported", label: "被举报" },
  { id: "hidden", label: "已隐藏" },
  { id: "comments", label: "评论管理" },
];

const localeFilters: { id: CommunityViewLocale; label: string }[] = [
  { id: "all", label: "全部社区" },
  { id: "zh-cn", label: "简中社区" },
  { id: "zh-tw", label: "繁中社區" },
  { id: "ja", label: "日本語コミュニティ" },
];

const typeFilters: { id: PostTypeFilter; label: string }[] = [
  { id: "all", label: "全部类型" },
  { id: "share", label: "生活分享" },
  { id: "help", label: "求助" },
  { id: "secondhand", label: "闲置" },
  { id: "buddy", label: "搭子" },
  { id: "helper", label: "帮忙" },
];

const curationFilters: { id: CurationFilter; label: string }[] = [
  { id: "all", label: "全部" },
  { id: "pinned", label: "置顶" },
  { id: "featured", label: "精选" },
  { id: "official", label: "官方推荐" },
  { id: "normal", label: "普通" },
];

const postStatusLabels: Record<CommunityPostStatus, string> = {
  deleted: "已删除",
  hidden: "已隐藏",
  pending: "待审核",
  published: "已发布",
  reported: "被举报",
};

const commentStatusLabels: Record<CommunityCommentStatus, string> = {
  deleted: "已删除",
  hidden: "已隐藏",
  published: "已发布",
  reported: "被举报",
};

const contactStatusLabels: Record<CommunityContactRequestStatus, string> = {
  accepted: "已接受",
  cancelled: "已取消",
  declined: "已拒绝",
  deleted: "已删除",
  hidden: "已隐藏",
  pending: "待处理",
  read: "已读",
  rejected: "已拒绝",
};

export default function AdminCommunityPage() {
  const [activeTab, setActiveTab] = useState<AdminTab>("pending");
  const [comments, setComments] = useState<CommunityComment[]>([]);
  const [contactRequests, setContactRequests] = useState<CommunityContactRequest[]>([]);
  const [localeFilter, setLocaleFilter] = useState<CommunityViewLocale>("all");
  const [loggedIn, setLoggedIn] = useState(false);
  const [message, setMessage] = useState("");
  const [password, setPassword] = useState("");
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [query, setQuery] = useState("");
  const [reports, setReports] = useState<CommunityReport[]>([]);
  const [supabaseEnabled, setSupabaseEnabled] = useState(false);
  const [curationFilter, setCurationFilter] = useState<CurationFilter>("all");
  const [typeFilter, setTypeFilter] = useState<PostTypeFilter>("all");

  useEffect(() => {
    setLoggedIn(Boolean(window.sessionStorage.getItem(sessionKey)));
  }, []);

  const loadLocalData = useCallback(() => {
    const storedPosts = readCommunityPosts();
    const nextPosts = storedPosts.length
      ? storedPosts
      : communityMockPosts.map((post) => ({ ...post, featured: Boolean(post.featured), reportCount: post.reportCount ?? 0 }));
    if (!storedPosts.length) writeCommunityPosts(nextPosts);
    setPosts(nextPosts);
    setComments(readCommunityComments());
    setReports(readCommunityReports());
    setContactRequests(readCommunityContactRequests());
  }, []);

  const loadData = useCallback(async () => {
    const adminPassword = window.sessionStorage.getItem(sessionKey) ?? "";
    if (!adminPassword) {
      loadLocalData();
      return;
    }
    try {
      const response = await fetch("/api/admin/community/", {
        headers: { "x-admin-password": adminPassword },
      });
      if (!response.ok) throw new Error("Supabase community admin API unavailable.");
      const data = (await response.json()) as {
        comments?: CommunityCommentRow[];
        contactRequests?: CommunityContactRequestRow[];
        posts?: CommunityPostRow[];
        reports?: CommunityReportRow[];
      };
      setSupabaseEnabled(true);
      setPosts((data.posts ?? []).map(mapPostFromDb));
      setComments((data.comments ?? []).map(mapCommentFromDb));
      setReports((data.reports ?? []).map(mapReportFromDb));
      setContactRequests((data.contactRequests ?? []).map(mapContactRequestFromDb));
    } catch (error) {
      console.warn("[community-admin] fallback to localStorage", error);
      setSupabaseEnabled(false);
      loadLocalData();
    }
  }, [loadLocalData]);

  useEffect(() => {
    if (loggedIn) void loadData();
  }, [loadData, loggedIn]);

  async function handleLogin() {
    if (!password.trim()) return;
    setMessage("");
    try {
      const response = await fetch("/api/admin/community/", {
        headers: { "x-admin-password": password.trim() },
      });
      if (!response.ok) throw new Error("管理员密码不正确");
      window.sessionStorage.setItem(sessionKey, password.trim());
      setLoggedIn(true);
      setPassword("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "登录失败");
    }
  }

  const filteredPosts = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return posts
      .filter((post) => matchesLocale(post.communityLocale, localeFilter))
      .filter((post) => typeFilter === "all" || post.type === typeFilter)
      .filter((post) => matchesCurationFilter(post, curationFilter))
      .filter((post) => {
        if (activeTab === "pending") return post.status === "pending";
        if (activeTab === "published") return post.status === "published";
        if (activeTab === "hidden") return post.status === "hidden" || post.status === "deleted";
        return false;
      })
      .filter((post) => {
        if (!keyword) return true;
        return `${post.title} ${post.content} ${post.authorName} ${post.area}`.toLowerCase().includes(keyword);
      })
      .sort((left, right) => parseCommunityTime(right.createdAt) - parseCommunityTime(left.createdAt));
  }, [activeTab, curationFilter, localeFilter, posts, query, typeFilter]);

  const filteredReports = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return reports
      .filter((report) => {
        const target = getReportTarget(report, posts, comments);
        if (!target) return true;
        if (!matchesLocale(target.locale, localeFilter)) return false;
        if (typeFilter !== "all" && target.postType && target.postType !== typeFilter) return false;
        if (curationFilter !== "all" && target.post && !matchesCurationFilter(target.post, curationFilter)) return false;
        if (!keyword) return true;
        return `${report.reason} ${report.detail} ${target.summary} ${target.author} ${target.title}`.toLowerCase().includes(keyword);
      })
      .sort((left, right) => parseCommunityTime(right.createdAt) - parseCommunityTime(left.createdAt));
  }, [comments, curationFilter, localeFilter, posts, query, reports, typeFilter]);

  const filteredComments = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return comments
      .filter((comment) => matchesLocale(comment.communityLocale, localeFilter))
      .filter((comment) => {
        const post = posts.find((item) => item.id === comment.postId);
        if (typeFilter !== "all" && post?.type !== typeFilter) return false;
        if (post && !matchesCurationFilter(post, curationFilter)) return false;
        if (!keyword) return true;
        return `${comment.content} ${comment.authorName} ${post?.title ?? ""}`.toLowerCase().includes(keyword);
      })
      .sort((left, right) => parseCommunityTime(right.createdAt) - parseCommunityTime(left.createdAt));
  }, [comments, curationFilter, localeFilter, posts, query, typeFilter]);

  const filteredContacts = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return contactRequests
      .filter((request) => matchesLocale(request.communityLocale, localeFilter))
      .filter((request) => {
        const post = posts.find((item) => item.id === request.postId);
        if (typeFilter !== "all" && post?.type !== typeFilter) return false;
        if (post && !matchesCurationFilter(post, curationFilter)) return false;
        if (!keyword) return true;
        return `${request.message} ${request.contact} ${request.fromName} ${post?.title ?? ""}`.toLowerCase().includes(keyword);
      })
      .sort((left, right) => parseCommunityTime(right.createdAt) - parseCommunityTime(left.createdAt));
  }, [contactRequests, curationFilter, localeFilter, posts, query, typeFilter]);

  function toggleFeatured(post: CommunityPost) {
    if (isCommunityPostFeatured(post)) {
      patchPost(post.id, { featured: false, featuredReason: undefined, isFeatured: false }, "已取消精选");
      return;
    }
    const reason = window.prompt("精选理由，可选", post.featuredReason || "");
    patchPost(post.id, { featured: true, featuredReason: reason?.trim() || undefined, isFeatured: true }, "已设为精选");
  }

  function patchPost(postId: string, patch: Partial<CommunityPost>, nextMessage = "帖子已更新") {
    const previousPost = posts.find((post) => post.id === postId);
    const nextPosts = posts.map((post) => post.id === postId ? { ...post, ...patch } : post);
    setPosts(nextPosts);
    writeCommunityPosts(nextPosts);
    if (previousPost && patch.status === "published" && previousPost.status !== "published") {
      addCommunityNotification(createCommunityNotification({
        communityLocale: previousPost.communityLocale,
        message: `你的帖子「${previousPost.title}」已通过审核并公开显示。`,
        postId: previousPost.id,
        targetId: previousPost.id,
        targetType: "post",
        title: "你的帖子已通过审核",
        type: "post_approved",
        userId: previousPost.authorId || communityCurrentUserId,
      }));
    }
    if (previousPost && patch.status === "hidden" && previousPost.status !== "hidden") {
      addCommunityNotification(createCommunityNotification({
        communityLocale: previousPost.communityLocale,
        message: `你的帖子「${previousPost.title}」已被管理员隐藏。`,
        postId: previousPost.id,
        targetId: previousPost.id,
        targetType: "post",
        title: "你的帖子已被隐藏",
        type: "post_hidden",
        userId: previousPost.authorId || communityCurrentUserId,
      }));
    }
    setMessage(nextMessage);
    void patchCommunityAdmin("community_posts", postId, toPostDbPatch(patch));
  }

  function patchComment(commentId: string, patch: Partial<CommunityComment>, nextMessage = "评论已更新") {
    const nextComments = comments.map((comment) => comment.id === commentId ? { ...comment, ...patch } : comment);
    setComments(nextComments);
    writeCommunityComments(nextComments);
    setMessage(nextMessage);
    void patchCommunityAdmin("community_comments", commentId, toCommentDbPatch(patch));
  }

  function patchContact(requestId: string, patch: Partial<CommunityContactRequest>, nextMessage = "联系申请已更新") {
    const nextRequests = contactRequests.map((request) => request.id === requestId ? { ...request, ...patch } : request);
    setContactRequests(nextRequests);
    writeCommunityContactRequests(nextRequests);
    setMessage(nextMessage);
    void patchCommunityAdmin("community_contact_requests", requestId, toContactDbPatch(patch));
  }

  function patchReport(reportId: string, patch: Partial<CommunityReport>, nextMessage = "举报已处理") {
    const nextReports = reports.map((report) => report.id === reportId ? { ...report, ...patch } : report);
    setReports(nextReports);
    writeCommunityReports(nextReports);
    setMessage(nextMessage);
    void patchCommunityAdmin("community_reports", reportId, toReportDbPatch(patch));
  }

  function updateReportedContent(report: CommunityReport, status: CommunityPostStatus | CommunityCommentStatus) {
    if (report.targetType === "post") {
      patchPost(report.targetId, { status: status as CommunityPostStatus }, "举报内容已更新");
    } else {
      patchComment(report.targetId, { status: status as CommunityCommentStatus }, "举报内容已更新");
    }
    patchReport(report.id, { status: "resolved" });
  }

  const postReportCount = (postId: string) => reports.filter((report) => report.targetType === "post" && report.targetId === postId).length;
  const commentReportCount = (commentId: string) => reports.filter((report) => report.targetType === "comment" && report.targetId === commentId).length;

  if (!loggedIn) {
    return (
      <main className="min-h-screen bg-[linear-gradient(180deg,#eaf6ff_0%,#f7fbff_48%,#ffffff_100%)] px-4 py-5 text-[#061a3a]">
        <div className="mx-auto max-w-[430px]">
          <Link className="inline-flex h-10 items-center gap-2 rounded-full bg-white/85 px-4 text-sm font-black text-[#2563EB] shadow-sm ring-1 ring-blue-100" href="/admin">
            <ArrowLeft className="h-4 w-4" />
            返回后台
          </Link>
          <section className="mt-5 rounded-[28px] border border-white/70 bg-white/86 p-5 shadow-[0_18px_45px_rgba(37,99,235,0.10)]">
            <p className="text-xs font-black text-[#2563EB]">Admin</p>
            <h1 className="mt-1 text-2xl font-black">社区管理</h1>
            <p className="mt-2 text-sm font-bold leading-6 text-slate-600">审核帖子、评论、举报和联系申请</p>
            <div className="mt-4 grid gap-3">
              <input className="h-12 rounded-2xl border border-blue-100 bg-blue-50/70 px-4 text-sm font-bold outline-none focus:border-[#2563EB]" onChange={(event) => setPassword(event.target.value)} placeholder="管理员密码" type="password" value={password} />
              <button className="h-12 rounded-full bg-[#2563EB] text-sm font-black text-white shadow-[0_14px_28px_rgba(37,99,235,0.22)]" onClick={handleLogin} type="button">进入社区管理</button>
              {message ? <p className="rounded-2xl bg-rose-50 px-4 py-3 text-xs font-bold text-rose-700">{message}</p> : null}
            </div>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#eaf6ff_0%,#f7fbff_48%,#ffffff_100%)] px-4 py-5 text-[#061a3a]">
      <div className="mx-auto min-h-screen w-full max-w-[960px] px-0 pb-12">
        <div className="flex items-center justify-between gap-3">
          <Link className="inline-flex h-10 items-center gap-2 rounded-full bg-white/85 px-4 text-sm font-black text-[#2563EB] shadow-sm ring-1 ring-blue-100" href="/admin">
            <ArrowLeft className="h-4 w-4" />
            返回后台
          </Link>
          <button className="inline-flex h-10 items-center gap-2 rounded-full bg-white/85 px-4 text-xs font-black text-slate-600 shadow-sm ring-1 ring-blue-100" onClick={() => void loadData()} type="button">
            <RefreshCw className="h-4 w-4" />
            刷新
          </button>
        </div>

        <section className="mt-5 rounded-[30px] border border-white/80 bg-white/86 p-5 shadow-[0_18px_45px_rgba(37,99,235,0.10)]">
          <p className="text-xs font-black text-[#2563EB]">Community Admin</p>
          <h1 className="mt-1 text-[28px] font-[850] leading-9">社区管理</h1>
          <p className="mt-2 text-sm font-bold leading-6 text-slate-600">审核帖子、评论、举报和联系申请</p>
          <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_190px_190px_190px]">
            <label className="flex h-11 items-center gap-2 rounded-2xl bg-blue-50/80 px-4 ring-1 ring-blue-100">
              <Search className="h-4 w-4 text-[#2563EB]" />
              <input className="h-full min-w-0 flex-1 bg-transparent text-sm font-bold outline-none placeholder:text-slate-400" onChange={(event) => setQuery(event.target.value)} placeholder="搜索标题、内容、作者、地区" value={query} />
            </label>
            <select className="h-11 rounded-2xl border border-blue-100 bg-white/90 px-3 text-sm font-black outline-none focus:border-[#2563EB]" onChange={(event) => setLocaleFilter(event.target.value as CommunityViewLocale)} value={localeFilter}>
              {localeFilters.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
            </select>
            <select className="h-11 rounded-2xl border border-blue-100 bg-white/90 px-3 text-sm font-black outline-none focus:border-[#2563EB]" onChange={(event) => setTypeFilter(event.target.value as PostTypeFilter)} value={typeFilter}>
              {typeFilters.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
            </select>
            <select className="h-11 rounded-2xl border border-blue-100 bg-white/90 px-3 text-sm font-black outline-none focus:border-[#2563EB]" onChange={(event) => setCurationFilter(event.target.value as CurationFilter)} value={curationFilter}>
              {curationFilters.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
            </select>
          </div>
        </section>

        <section className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-5">
          {tabs.map((tab) => (
            <button className={`h-11 rounded-2xl px-3 text-sm font-black shadow-sm transition ${activeTab === tab.id ? "bg-[#2563EB] text-white" : "bg-white/86 text-slate-600 ring-1 ring-blue-100"}`} key={tab.id} onClick={() => setActiveTab(tab.id)} type="button">
              {tab.label}
            </button>
          ))}
        </section>

        {message ? <p className="mt-4 rounded-2xl bg-blue-50 px-4 py-3 text-xs font-black text-[#1D4ED8] ring-1 ring-blue-100">{message}</p> : null}

        <section className="mt-4 grid gap-3">
          <p className="rounded-2xl bg-white/70 px-4 py-2 text-xs font-black text-slate-500 ring-1 ring-blue-100">
            {supabaseEnabled ? "Supabase community data" : "localStorage/mock fallback"}
          </p>
          {activeTab === "reported" ? (
            filteredReports.length ? filteredReports.map((report) => (
              <ReportCard
                key={report.id}
                onDelete={() => updateReportedContent(report, "deleted")}
                onHide={() => updateReportedContent(report, "hidden")}
                onIgnore={() => patchReport(report.id, { status: "resolved" }, "已忽略举报")}
                onResolve={() => patchReport(report.id, { status: "resolved" })}
                report={report}
                reportCount={getTargetReportCount(report, reports)}
                target={getReportTarget(report, posts, comments)}
              />
            )) : <EmptyState text="暂无举报内容。" />
          ) : null}

          {activeTab === "comments" ? (
            filteredComments.length ? filteredComments.map((comment) => (
              <CommentCard
                comment={comment}
                key={comment.id}
                onDelete={() => patchComment(comment.id, { status: "deleted" }, "评论已删除")}
                onHide={() => patchComment(comment.id, { status: "hidden" }, "评论已隐藏")}
                onRestore={() => patchComment(comment.id, { status: "published" }, "评论已恢复")}
                post={posts.find((item) => item.id === comment.postId)}
                reportCount={Math.max(comment.reportCount ?? 0, commentReportCount(comment.id))}
              />
            )) : <EmptyState text="暂无评论。" />
          ) : null}

          {activeTab !== "reported" && activeTab !== "comments" ? (
            filteredPosts.length ? filteredPosts.map((post) => (
              <PostCard
                key={post.id}
                onApprove={() => patchPost(post.id, { status: "published" }, "帖子已通过")}
                onDelete={() => patchPost(post.id, { status: "deleted" }, "帖子已删除")}
                onFeature={() => toggleFeatured(post)}
                onHide={() => patchPost(post.id, { status: "hidden" }, "帖子已隐藏")}
                onOfficial={() => patchPost(post.id, { isOfficialRecommended: !post.isOfficialRecommended }, post.isOfficialRecommended ? "已取消推荐" : "已设为官方推荐")}
                onPin={() => patchPost(post.id, { isPinned: !post.isPinned, pinnedUntil: post.isPinned ? null : post.pinnedUntil ?? null }, post.isPinned ? "已取消置顶" : "已置顶")}
                onRestore={() => patchPost(post.id, { status: "published" }, "帖子已恢复")}
                post={post}
                reportCount={Math.max(post.reportCount ?? 0, postReportCount(post.id))}
              />
            )) : <EmptyState text="当前筛选下暂无帖子。" />
          ) : null}
        </section>

        <ContactRequestSection
          onDelete={(request) => patchContact(request.id, { status: "deleted" }, "联系申请已删除")}
          onHide={(request) => patchContact(request.id, { status: "hidden" }, "联系申请已隐藏")}
          onRestore={(request) => patchContact(request.id, { status: "pending" }, "联系申请已恢复")}
          posts={posts}
          requests={filteredContacts}
        />
      </div>
    </main>
  );
}

function PostCard({ onApprove, onDelete, onFeature, onHide, onOfficial, onPin, onRestore, post, reportCount }: { onApprove: () => void; onDelete: () => void; onFeature: () => void; onHide: () => void; onOfficial: () => void; onPin: () => void; onRestore: () => void; post: CommunityPost; reportCount: number }) {
  return (
    <article className="rounded-[20px] border border-slate-200/90 bg-white/86 p-4 shadow-[0_12px_28px_rgba(15,76,129,0.08)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap gap-2">
            <Badge tone="blue">社区语言：{communityLocaleBadges[post.communityLocale].longLabel}</Badge>
            <Badge tone="slate">帖子类型：{getCommunityPostTypeLabel(post.type)}</Badge>
            <Badge tone={post.status === "published" ? "green" : post.status === "deleted" ? "red" : post.status === "hidden" ? "orange" : "blue"}>{postStatusLabels[post.status]}</Badge>
            {post.isPinned ? <Badge tone="orange">置顶</Badge> : null}
            {isCommunityPostFeatured(post) ? <Badge tone="pink">精选</Badge> : null}
            {post.isOfficialRecommended ? <Badge tone="green">官方推荐</Badge> : null}
          </div>
          <h2 className="mt-3 text-lg font-black leading-7">{post.title}</h2>
          <p className="mt-1 line-clamp-2 text-sm font-bold leading-6 text-slate-600">{post.content}</p>
          {post.featuredReason ? <p className="mt-2 rounded-2xl bg-blue-50 px-3 py-2 text-xs font-bold text-[#1D4ED8] ring-1 ring-blue-100">精选理由：{post.featuredReason}</p> : null}
        </div>
      </div>
      <div className="mt-3 grid gap-2 text-xs font-bold text-slate-500 sm:grid-cols-2 lg:grid-cols-4">
        <span>作者：{post.authorName}</span>
        <span>地区：{post.area}</span>
        <span>发布时间：{post.createdAt}</span>
        <span>点赞 / 评论 / 举报：{post.likes} / {post.comments} / {reportCount}</span>
      </div>
      <ActionBar>
        <ActionButton tone="green" onClick={onApprove}>通过</ActionButton>
        <ActionButton tone="orange" onClick={onHide}>隐藏</ActionButton>
        <ActionButton tone="red" onClick={onDelete}>删除</ActionButton>
        <ActionButton tone="blue" onClick={onRestore}>恢复</ActionButton>
        <ActionButton tone="slate" onClick={onFeature}>{isCommunityPostFeatured(post) ? "取消精选" : "设为精选"}</ActionButton>
        <ActionButton tone="orange" onClick={onPin}>{post.isPinned ? "取消置顶" : "置顶"}</ActionButton>
        <ActionButton tone="green" onClick={onOfficial}>{post.isOfficialRecommended ? "取消推荐" : "设为官方推荐"}</ActionButton>
      </ActionBar>
    </article>
  );
}

function ReportCard({ onDelete, onHide, onIgnore, onResolve, report, reportCount, target }: { onDelete: () => void; onHide: () => void; onIgnore: () => void; onResolve: () => void; report: CommunityReport; reportCount: number; target: ReportTarget | null }) {
  const href = target?.postId && target.locale ? getCommunityPostHref({ id: target.postId, communityLocale: target.locale }) : communitySelectionHref;
  return (
    <article className="rounded-[20px] border border-slate-200/90 bg-white/86 p-4 shadow-[0_12px_28px_rgba(15,76,129,0.08)]">
      <div className="flex flex-wrap gap-2">
        <Badge tone="pink">举报对象：{report.targetType === "post" ? "帖子" : "评论"}</Badge>
        <Badge tone={report.status === "pending" ? "orange" : "green"}>{report.status === "pending" ? "待处理" : "已处理"}</Badge>
        {target ? <Badge tone="blue">{communityLocaleBadges[target.locale].longLabel}</Badge> : null}
      </div>
      <h2 className="mt-3 text-base font-black">举报原因：{report.reason}</h2>
      <p className="mt-1 text-sm font-bold leading-6 text-slate-600">补充说明：{report.detail || "无"}</p>
      <p className="mt-2 line-clamp-2 text-sm font-bold leading-6 text-slate-700">被举报内容：{target?.summary ?? "内容可能已删除或不存在"}</p>
      <div className="mt-3 grid gap-2 text-xs font-bold text-slate-500 sm:grid-cols-3">
        <span>举报时间：{report.createdAt || "旧数据"}</span>
        <span>举报次数：{reportCount}</span>
        <span>当前状态：{target?.status ?? "未知"}</span>
      </div>
      <ActionBar>
        <Link className="inline-flex h-9 items-center gap-1 rounded-xl bg-blue-50 px-3 text-xs font-black text-[#1D4ED8] ring-1 ring-blue-100" href={href}>
          <Eye className="h-3.5 w-3.5" />
          查看内容
        </Link>
        <ActionButton tone="orange" onClick={onHide}>隐藏内容</ActionButton>
        <ActionButton tone="red" onClick={onDelete}>删除内容</ActionButton>
        <ActionButton tone="slate" onClick={onIgnore}>忽略举报</ActionButton>
        <ActionButton tone="green" onClick={onResolve}>标记已处理</ActionButton>
      </ActionBar>
    </article>
  );
}

function CommentCard({ comment, onDelete, onHide, onRestore, post, reportCount }: { comment: CommunityComment; onDelete: () => void; onHide: () => void; onRestore: () => void; post?: CommunityPost; reportCount: number }) {
  return (
    <article className="rounded-[20px] border border-slate-200/90 bg-white/86 p-4 shadow-[0_12px_28px_rgba(15,76,129,0.08)]">
      <div className="flex flex-wrap gap-2">
        <Badge tone="blue">{communityLocaleBadges[comment.communityLocale].longLabel}</Badge>
        <Badge tone={comment.status === "published" ? "green" : comment.status === "deleted" ? "red" : "orange"}>{commentStatusLabels[comment.status]}</Badge>
      </div>
      <p className="mt-3 text-sm font-bold leading-6 text-slate-700">{comment.content}</p>
      <div className="mt-3 grid gap-2 text-xs font-bold text-slate-500 sm:grid-cols-2 lg:grid-cols-4">
        <span>所属帖子：{post?.title ?? "帖子可能已删除"}</span>
        <span>作者：{comment.authorName}</span>
        <span>发布时间：{comment.createdAt}</span>
        <span>举报数：{reportCount}</span>
      </div>
      <ActionBar>
        <ActionButton tone="orange" onClick={onHide}>隐藏评论</ActionButton>
        <ActionButton tone="red" onClick={onDelete}>删除评论</ActionButton>
        <ActionButton tone="blue" onClick={onRestore}>恢复评论</ActionButton>
      </ActionBar>
    </article>
  );
}

function ContactRequestSection({ onDelete, onHide, onRestore, posts, requests }: { onDelete: (request: CommunityContactRequest) => void; onHide: (request: CommunityContactRequest) => void; onRestore: (request: CommunityContactRequest) => void; posts: CommunityPost[]; requests: CommunityContactRequest[] }) {
  return (
    <section className="mt-6 rounded-[24px] border border-slate-200/90 bg-white/86 p-4 shadow-[0_12px_28px_rgba(15,76,129,0.08)]">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-black">联系申请</h2>
          <p className="mt-1 text-xs font-bold text-slate-500">查看、隐藏、删除用户发起的申请联系内容。</p>
        </div>
        <Badge tone="blue">{requests.length}</Badge>
      </div>
      <div className="mt-4 grid gap-3">
        {requests.length ? requests.map((request) => {
          const post = posts.find((item) => item.id === request.postId);
          return (
            <article className="rounded-2xl border border-blue-100 bg-blue-50/60 p-3" key={request.id}>
              <div className="flex flex-wrap gap-2">
                <Badge tone="blue">{communityLocaleBadges[request.communityLocale].longLabel}</Badge>
                <Badge tone={request.status === "deleted" ? "red" : request.status === "hidden" ? "orange" : "green"}>{contactStatusLabels[request.status]}</Badge>
              </div>
              <p className="mt-2 text-sm font-black">{post?.title ?? "帖子可能已删除"}</p>
              <p className="mt-1 text-sm font-bold leading-6 text-slate-700">{request.message}</p>
              <p className="mt-2 rounded-xl bg-white px-3 py-2 text-xs font-black text-[#1D4ED8] ring-1 ring-blue-100">联系方式：{request.contact}</p>
              <p className="mt-2 text-xs font-bold text-slate-500">{request.fromName} / {request.createdAt}</p>
              <ActionBar>
                <ActionButton tone="orange" onClick={() => onHide(request)}>隐藏</ActionButton>
                <ActionButton tone="red" onClick={() => onDelete(request)}>删除</ActionButton>
                <ActionButton tone="blue" onClick={() => onRestore(request)}>恢复</ActionButton>
              </ActionBar>
            </article>
          );
        }) : <EmptyState text="暂无联系申请。" />}
      </div>
    </section>
  );
}

function ActionBar({ children }: { children: React.ReactNode }) {
  return <div className="mt-4 flex flex-wrap gap-2">{children}</div>;
}

function ActionButton({ children, onClick, tone }: { children: React.ReactNode; onClick: () => void; tone: "blue" | "green" | "orange" | "red" | "slate" }) {
  const className = {
    blue: "bg-blue-50 text-[#1D4ED8] ring-blue-100",
    green: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    orange: "bg-orange-50 text-orange-700 ring-orange-100",
    red: "bg-rose-50 text-rose-700 ring-rose-100",
    slate: "bg-slate-50 text-slate-600 ring-slate-200",
  }[tone];
  return <button className={`inline-flex h-9 items-center rounded-xl px-3 text-xs font-black ring-1 ${className}`} onClick={onClick} type="button">{children}</button>;
}

function Badge({ children, tone }: { children: React.ReactNode; tone: "blue" | "green" | "orange" | "pink" | "red" | "slate" }) {
  const className = {
    blue: "bg-blue-50 text-[#1D4ED8] ring-blue-100",
    green: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    orange: "bg-orange-50 text-orange-700 ring-orange-100",
    pink: "bg-pink-50 text-pink-700 ring-pink-100",
    red: "bg-rose-50 text-rose-700 ring-rose-100",
    slate: "bg-slate-50 text-slate-600 ring-slate-200",
  }[tone];
  return <span className={`inline-flex h-7 items-center rounded-full px-3 text-xs font-black ring-1 ${className}`}>{children}</span>;
}

function EmptyState({ text }: { text: string }) {
  return <div className="rounded-[20px] border border-blue-100 bg-white/86 p-6 text-center text-sm font-bold text-slate-500 shadow-[0_12px_28px_rgba(15,76,129,0.08)]">{text}</div>;
}

type ReportTarget = {
  author: string;
  locale: CommunityLocale;
  postId: string;
  postType?: CommunityPostType;
  post?: CommunityPost;
  status: string;
  summary: string;
  title: string;
};

function getReportTarget(report: CommunityReport, posts: CommunityPost[], comments: CommunityComment[]): ReportTarget | null {
  if (report.targetType === "post") {
    const post = posts.find((item) => item.id === report.targetId);
    if (!post) return null;
      return {
        author: post.authorName,
        locale: post.communityLocale,
        post,
        postId: post.id,
      postType: post.type,
      status: postStatusLabels[post.status],
      summary: `${post.title} ${post.content}`,
      title: post.title,
    };
  }
  if (report.targetType === "user") return null;
  const comment = comments.find((item) => item.id === report.targetId);
  if (!comment) return null;
  const post = posts.find((item) => item.id === comment.postId);
  return {
    author: comment.authorName,
    locale: comment.communityLocale,
    postId: comment.postId,
    post,
    postType: post?.type,
    status: commentStatusLabels[comment.status],
    summary: comment.content,
    title: post?.title ?? "帖子可能已删除",
  };
}

async function patchCommunityAdmin(table: string, id: string, patch: Record<string, unknown>) {
  if (Object.keys(patch).length === 0) return;
  const password = window.sessionStorage.getItem(sessionKey) ?? "";
  if (!password) return;
  try {
    const response = await fetch("/api/admin/community/", {
      body: JSON.stringify({ id, patch, table }),
      headers: {
        "Content-Type": "application/json",
        "x-admin-password": password,
      },
      method: "PATCH",
    });
    if (!response.ok) throw new Error("Community admin update failed.");
  } catch (error) {
    console.warn("[community-admin] update fallback only", error);
  }
}

function toPostDbPatch(patch: Partial<CommunityPost>) {
  return cleanPatch({
    status: patch.status,
    featured: patch.featured,
    featured_reason: patch.featuredReason,
    is_featured: patch.isFeatured,
    is_official_recommended: patch.isOfficialRecommended,
    is_pinned: patch.isPinned,
    pinned_until: patch.pinnedUntil,
    report_count: patch.reportCount,
  });
}

function toCommentDbPatch(patch: Partial<CommunityComment>) {
  return cleanPatch({
    status: patch.status,
    report_count: patch.reportCount,
  });
}

function toContactDbPatch(patch: Partial<CommunityContactRequest>) {
  return cleanPatch({
    status: patch.status === "declined" ? "rejected" : patch.status,
  });
}

function toReportDbPatch(patch: Partial<CommunityReport>) {
  return cleanPatch({
    status: patch.status,
  });
}

function cleanPatch(input: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(input).filter(([, value]) => value !== undefined));
}

function getTargetReportCount(target: { targetId: string; targetType: CommunityReportTargetType }, reports: CommunityReport[]) {
  return reports.filter((report) => report.targetId === target.targetId && report.targetType === target.targetType).length;
}

function matchesLocale(locale: CommunityLocale, filter: CommunityViewLocale) {
  return filter === "all" || locale === filter;
}

function matchesCurationFilter(post: CommunityPost, filter: CurationFilter) {
  if (filter === "all") return true;
  if (filter === "pinned") return post.isPinned;
  if (filter === "featured") return isCommunityPostFeatured(post);
  if (filter === "official") return post.isOfficialRecommended;
  return !post.isPinned && !isCommunityPostFeatured(post) && !post.isOfficialRecommended;
}

function parseCommunityTime(value: string) {
  const match = value.match(/^(\d{2})\/(\d{2})\s+(\d{2}):(\d{2})$/);
  if (!match) return 0;
  const [, month, day, hour, minute] = match;
  return new Date(2026, Number(month) - 1, Number(day), Number(hour), Number(minute)).getTime();
}
