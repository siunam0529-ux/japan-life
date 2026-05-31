"use client";

import type { User } from "@supabase/supabase-js";
import { Bell, CheckCircle2, ChevronRight, Handshake, Heart, Inbox, MessageCircle, ShieldCheck, Star, Trash2, UserRound } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { CommunityLoginRequiredCard } from "@/components/community/CommunityLoginRequiredCard";
import { useReminders } from "@/hooks/useReminders";
import { getCurrentCommunityUser, type CommunityUser } from "@/lib/community/currentUser";
import { getCommunityPostHref, getCommunitySelectionHref } from "@/lib/community/routes";
import { communityCurrentUserId, getNotifications, markAllNotificationsRead, markNotificationRead, readCommunityNotifications, writeCommunityNotifications } from "@/lib/community/repository";
import { communityLocaleBadges, communityNotificationTypeLabels, type CommunityNotification, type CommunityNotificationType } from "@/lib/community/types";
import { readLifeHelperBusinessApplications, readLifeHelperPersonalApplications } from "@/lib/lifeHelper/join";
import { readLifeHelperApplications, readLifeHelperRequests } from "@/lib/lifeHelper/storage";
import { getLifeHelperCategoryLabel } from "@/lib/lifeHelper/types";
import { supabase } from "@/lib/supabase";
import type { ReminderItem } from "@/types/reminder";

type NotificationTab = "all" | "community" | "life-helper" | "reminders";
type AppNotificationSource = "community" | "life-helper" | "reminder";
type AppNotificationTone = "blue" | "green" | "orange" | "rose" | "violet";

type AppNotification = {
  createdAt: string;
  detail: string;
  href: string;
  icon: LucideIcon;
  id: string;
  isRead: boolean;
  meta: string;
  source: AppNotificationSource;
  title: string;
  tone: AppNotificationTone;
  communityNotification?: CommunityNotification;
};

const appNotificationReadIdsKey = "japan-life-app-notification-read-ids";

const tabs: { id: NotificationTab; label: string }[] = [
  { id: "all", label: "全部" },
  { id: "community", label: "社区" },
  { id: "life-helper", label: "生活帮手" },
  { id: "reminders", label: "待办提醒" },
];

const sourceLabels: Record<AppNotificationSource, string> = {
  community: "社区",
  "life-helper": "生活帮手",
  reminder: "待办",
};

export function GlobalNotificationsCenter() {
  const router = useRouter();
  const { activeReminders, today } = useReminders();
  const [activeTab, setActiveTab] = useState<NotificationTab>("all");
  const [communityNotifications, setCommunityNotifications] = useState<CommunityNotification[]>([]);
  const [communityUser, setCommunityUser] = useState<CommunityUser | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [user, setUser] = useState<User | null>(null);
  const [supabaseCommunityEnabled, setSupabaseCommunityEnabled] = useState(false);

  useEffect(() => {
    setReadIds(readAppNotificationIds());
    let mounted = true;
    void getCurrentCommunityUser().then(async (currentUser) => {
      if (!mounted) return;
      setCommunityUser(currentUser);
      setAuthChecked(true);
      if (!currentUser) return;
      const localNotifications = readCommunityNotifications().filter((notification) => notification.userId === currentUser.id);
      setCommunityNotifications(localNotifications);
      writeCommunityNotifications(readCommunityNotifications());
      const result = await getNotifications(currentUser.id);
      if (!mounted) return;
      if (result.source === "supabase") {
        setSupabaseCommunityEnabled(true);
        setCommunityNotifications(result.data);
      }
    });

    if (!supabase) return () => {
      mounted = false;
    };

    supabase.auth.getSession().then(({ data }) => {
      if (mounted) setUser(data.session?.user ?? null);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) setUser(session?.user ?? null);
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const notifications = useMemo(() => {
    const community = communityNotifications.map(toAppCommunityNotification);
    const helper = buildLifeHelperNotifications(user, readIds, communityUser?.id);
    const reminders = buildReminderNotifications(activeReminders, today, readIds);
    return [...community, ...helper, ...reminders].sort((left, right) => notificationTime(right.createdAt) - notificationTime(left.createdAt));
  }, [activeReminders, communityNotifications, communityUser?.id, readIds, today, user]);

  const visibleNotifications = activeTab === "all" ? notifications : notifications.filter((notification) => notification.source === activeTab);
  const unreadCount = notifications.filter((notification) => !notification.isRead).length;

  function saveReadIds(nextReadIds: Set<string>) {
    setReadIds(nextReadIds);
    writeAppNotificationIds(nextReadIds);
  }

  function markOneRead(notification: AppNotification) {
    if (notification.source === "community" && notification.communityNotification) {
      const nextCommunityNotifications = communityNotifications.map((item) => (item.id === notification.communityNotification?.id ? { ...item, isRead: true } : item));
      setCommunityNotifications(nextCommunityNotifications);
      if (supabaseCommunityEnabled) void markNotificationRead(notification.communityNotification.id, communityUser?.id);
      else writeCommunityNotifications(nextCommunityNotifications);
      return;
    }
    const nextReadIds = new Set(readIds);
    nextReadIds.add(notification.id);
    saveReadIds(nextReadIds);
  }

  function markAllRead() {
    const nextCommunityNotifications = communityNotifications.map((notification) => ({ ...notification, isRead: true }));
    setCommunityNotifications(nextCommunityNotifications);
    if (supabaseCommunityEnabled) void markAllNotificationsRead(communityUser?.id);
    else writeCommunityNotifications(nextCommunityNotifications);
    saveReadIds(new Set([...readIds, ...notifications.filter((notification) => notification.source !== "community").map((notification) => notification.id)]));
  }

  function openNotification(notification: AppNotification) {
    markOneRead(notification);
    if (notification.href) router.push(notification.href);
  }

  if (!authChecked) {
    return (
      <main className="jl-tool-theme min-h-screen text-[#061a3a]">
        <div className="jl-tool-shell mx-auto min-h-screen w-full max-w-[430px] px-4 pb-32 pt-5">
          <div className="rounded-[24px] border border-white/80 bg-white/86 p-4 text-sm font-black text-[#2563EB] shadow-[0_12px_28px_rgba(15,76,129,0.08)]">加载中...</div>
        </div>
      </main>
    );
  }

  if (!communityUser) {
    return (
      <main className="jl-tool-theme min-h-screen text-[#061a3a]">
        <div className="jl-tool-shell mx-auto min-h-screen w-full max-w-[430px] px-4 pb-32 pt-5">
          <CommunityLoginRequiredCard description="登录后可以查看社区、生活帮手和 App 提醒通知。" title="请先登录" />
        </div>
      </main>
    );
  }

  return (
    <main className="jl-tool-theme min-h-screen text-[#061a3a]">
      <div className="jl-tool-shell mx-auto min-h-screen w-full max-w-[430px] px-4 pb-32 pt-5">
        <header className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-black uppercase tracking-[0.12em] text-[#2563EB]">Japan Life</p>
            <h1 className="truncate text-[28px] font-[850] leading-9 text-[#061a3a]">通知</h1>
          </div>
          <button className="h-9 rounded-full bg-white/85 px-4 text-xs font-black text-[#2563EB] shadow-sm ring-1 ring-blue-100 disabled:text-slate-400" disabled={unreadCount === 0} onClick={markAllRead} type="button">
            全部已读
          </button>
        </header>

        <section className="mt-4 rounded-[30px] border border-white/80 bg-white/85 p-5 shadow-[0_18px_40px_rgba(37,99,235,0.12)] backdrop-blur">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-[#2563EB] ring-1 ring-blue-100">
            <Bell className="h-6 w-6" />
          </span>
          <h2 className="mt-4 text-[24px] font-[850] leading-8">全部消息通知</h2>
          <p className="mt-2 text-sm font-bold leading-6 text-slate-600">集中查看社区、生活帮手和生活待办提醒。</p>
          <p className="mt-3 inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-[#1D4ED8] ring-1 ring-blue-100">未读 {unreadCount} 条</p>
        </section>

        <nav className="mt-4 flex gap-2 overflow-x-auto pb-1">
          {tabs.map((tab) => (
            <button className={`h-9 shrink-0 rounded-full px-4 text-sm font-black ${activeTab === tab.id ? "bg-[linear-gradient(135deg,#2563eb,#38bdf8)] text-white shadow-[0_10px_22px_rgba(37,99,235,0.22)]" : "bg-white/80 text-slate-600 ring-1 ring-blue-100"}`} key={tab.id} onClick={() => setActiveTab(tab.id)} type="button">
              {tab.label}
            </button>
          ))}
        </nav>

        <section className="mt-4 grid gap-3">
          {visibleNotifications.map((notification) => (
            <NotificationCard key={notification.id} notification={notification} onOpen={() => openNotification(notification)} />
          ))}
          {visibleNotifications.length === 0 ? (
            <div className="rounded-[22px] border border-[rgba(226,232,240,0.85)] bg-[rgba(255,255,255,0.82)] p-5 text-center shadow-[0_10px_24px_rgba(15,76,129,0.07)]">
              <Bell className="mx-auto h-8 w-8 text-[#2563EB]" />
              <h2 className="mt-3 text-sm font-[850] text-[#061a3a]">暂时没有通知</h2>
              <p className="mt-1 text-xs font-bold leading-5 text-[#40546f]">社区互动、生活帮手申请和待办提醒会显示在这里。</p>
            </div>
          ) : null}
        </section>

        <section className="mt-4 rounded-[24px] bg-white/85 p-4 text-xs font-bold leading-5 text-slate-600 ring-1 ring-blue-100">
          <div className="flex items-center gap-2 text-sm font-black text-[#1D4ED8]">
            <ShieldCheck className="h-5 w-5" />
            提醒说明
          </div>
          <p className="mt-2">这里是 App 内消息中心。手机系统弹窗通知仍在「App 设置」里单独开启。</p>
        </section>
      </div>
    </main>
  );
}

function NotificationCard({ notification, onOpen }: { notification: AppNotification; onOpen: () => void }) {
  const Icon = notification.icon;
  return (
    <button
      className={`relative w-full rounded-[20px] border border-[rgba(226,232,240,0.88)] p-3.5 text-left shadow-[0_10px_24px_rgba(15,76,129,0.08)] transition active:scale-[0.99] ${notification.isRead ? "bg-[rgba(255,255,255,0.78)]" : "bg-[rgba(239,248,255,0.92)]"}`}
      onClick={onOpen}
      type="button"
    >
      {!notification.isRead ? <span className="absolute right-3 top-3 h-2.5 w-2.5 rounded-full bg-rose-500" /> : null}
      <div className="flex gap-3">
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl shadow-sm ring-1 ${getToneClass(notification.tone)}`}>
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 pr-3">
            <h2 className="line-clamp-1 text-sm font-black">{notification.title}</h2>
            <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-black text-slate-500 ring-1 ring-slate-100">{sourceLabels[notification.source]}</span>
            {notification.communityNotification ? (
              <span className={`rounded-full px-2.5 py-1 text-[11px] font-black ${communityLocaleBadges[notification.communityNotification.communityLocale].tone}`}>
                {communityLocaleBadges[notification.communityNotification.communityLocale].label}
              </span>
            ) : null}
          </div>
          <p className="mt-1 line-clamp-2 text-xs font-bold leading-5 text-slate-600">{notification.detail}</p>
          <p className="mt-2 flex items-center justify-between gap-3 text-[11px] font-bold text-slate-400">
            <span>{notification.meta}</span>
            <ChevronRight className="h-4 w-4 shrink-0" />
          </p>
        </div>
      </div>
    </button>
  );
}

function toAppCommunityNotification(notification: CommunityNotification): AppNotification {
  return {
    id: `community:${notification.id}`,
    communityNotification: notification,
    createdAt: notification.createdAt,
    detail: notification.message,
    href: getCommunityNotificationHref(notification),
    icon: getCommunityNotificationIcon(notification.type),
    isRead: notification.isRead,
    meta: notification.createdAt || "刚刚",
    source: "community",
    title: notification.title || communityNotificationTypeLabels[notification.type],
    tone: "blue",
  };
}

function buildLifeHelperNotifications(user: User | null, readIds: Set<string>, communityUserId?: string): AppNotification[] {
  const requests = readLifeHelperRequests();
  const requestById = new Map(requests.map((request) => [request.id, request]));
  const currentUserIds = new Set([communityCurrentUserId, "current-user", "local-user", "japan-life-local-user", user?.id, communityUserId].filter((value): value is string => Boolean(value)));
  const applications = readLifeHelperApplications();
  const businessApplications = readLifeHelperBusinessApplications();
  const personalApplications = readLifeHelperPersonalApplications();

  const received = applications
    .filter((application) => {
      const request = requestById.get(application.requestId);
      return request && currentUserIds.has(request.authorId);
    })
    .map((application): AppNotification => {
      const request = requestById.get(application.requestId);
      const id = `life-helper:received:${application.id}`;
      return {
        id,
        createdAt: application.createdAt,
        detail: `${application.applicantName}：${application.message}`,
        href: request ? `/life-helper/${request.id}` : "/life-helper",
        icon: Inbox,
        isRead: readIds.has(id),
        meta: request ? getLifeHelperCategoryLabel(request.category) : application.createdAt,
        source: "life-helper",
        title: request ? `收到「${request.title}」的申请` : "收到生活帮手申请",
        tone: "green",
      };
    });

  const sent = applications
    .filter((application) => currentUserIds.has(application.applicantId))
    .map((application): AppNotification => {
      const request = requestById.get(application.requestId);
      const id = `life-helper:sent:${application.id}:${application.status}`;
      return {
        id,
        createdAt: application.createdAt,
        detail: application.status === "sent" ? "申请已发送，等待发布者确认。" : `申请状态：${application.status}`,
        href: request ? `/life-helper/${request.id}` : "/life-helper",
        icon: Handshake,
        isRead: readIds.has(id),
        meta: application.createdAt,
        source: "life-helper",
        title: request ? `你申请了「${request.title}」` : "生活帮手申请状态",
        tone: application.status === "sent" ? "blue" : "orange",
      };
    });

  const joins = [...businessApplications, ...personalApplications]
    .filter((application) => currentUserIds.has(application.userId))
    .map((application): AppNotification => {
      const id = `life-helper:join:${application.id}:${application.status}`;
      const name = application.type === "business" ? application.businessName : application.displayName;
      return {
        id,
        createdAt: application.createdAt,
        detail: getLifeHelperJoinMessage(application.status),
        href: "/life-helper/join",
        icon: UserRound,
        isRead: readIds.has(id),
        meta: application.createdAt,
        source: "life-helper",
        title: `入驻申请：${name}`,
        tone: application.status === "approved" ? "green" : application.status === "rejected" ? "rose" : "orange",
      };
    });

  return [...received, ...sent, ...joins];
}

function buildReminderNotifications(reminders: ReminderItem[], today: string, readIds: Set<string>): AppNotification[] {
  return reminders
    .filter((reminder) => reminder.status === "active")
    .slice(0, 16)
    .map((reminder) => {
      const id = `reminder:${reminder.id}:${reminder.date}`;
      return {
        id,
        createdAt: `${reminder.date} ${reminder.time ?? ""}`.trim(),
        detail: reminder.description || "查看待办中心里的生活提醒。",
        href: reminder.targetUrl ?? "/reminders",
        icon: getReminderIcon(reminder),
        isRead: readIds.has(id),
        meta: formatReminderMeta(reminder, today),
        source: "reminder" as const,
        title: reminder.title,
        tone: getReminderTone(reminder),
      };
    });
}

function getCommunityNotificationIcon(type: CommunityNotificationType) {
  if (type === "comment" || type === "reply") return MessageCircle;
  if (type === "contact_request") return Inbox;
  if (type === "like") return Heart;
  if (type === "favorite") return Star;
  if (type === "post_approved" || type === "report_result") return CheckCircle2;
  if (type === "post_hidden") return ShieldCheck;
  return Bell;
}

function getCommunityNotificationHref(notification: CommunityNotification) {
  if (notification.targetType === "contact_request") return "/community/me?tab=received";
  if (notification.postId) return getCommunityPostHref({ id: notification.postId, communityLocale: notification.communityLocale });
  return getCommunitySelectionHref();
}

function getReminderIcon(reminder: ReminderItem) {
  if (reminder.type === "garbage") return Trash2;
  if (reminder.type === "monthlyPayment") return Bell;
  if (reminder.type === "holiday") return Bell;
  if (reminder.type === "residenceCard") return ShieldCheck;
  return Bell;
}

function getReminderTone(reminder: ReminderItem): AppNotificationTone {
  if (reminder.priority === "high") return "orange";
  if (reminder.type === "garbage") return "green";
  if (reminder.type === "residenceCard") return "rose";
  return "blue";
}

function getLifeHelperJoinMessage(status: "approved" | "pending" | "rejected") {
  if (status === "approved") return "你的生活帮手入驻申请已通过。";
  if (status === "rejected") return "你的生活帮手入驻申请暂未通过，可以检查资料后再提交。";
  return "你的生活帮手入驻申请正在审核中。";
}

function formatReminderMeta(reminder: ReminderItem, today: string) {
  if (reminder.date === today) return reminder.time ? `今天 ${reminder.time}` : "今天";
  return reminder.time ? `${reminder.date.slice(5)} ${reminder.time}` : reminder.date.slice(5);
}

function notificationTime(value: string) {
  if (!value) return 0;
  const dateTime = new Date(value);
  if (!Number.isNaN(dateTime.getTime())) return dateTime.getTime();
  const monthDay = value.match(/^(\d{2})\/(\d{2})\s+(\d{2}):(\d{2})/);
  if (monthDay) {
    const [, month, day, hour, minute] = monthDay;
    return new Date(new Date().getFullYear(), Number(month) - 1, Number(day), Number(hour), Number(minute)).getTime();
  }
  const dateOnly = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (dateOnly) return new Date(value).getTime();
  return 0;
}

function readAppNotificationIds() {
  if (typeof window === "undefined") return new Set<string>();
  try {
    const raw = window.localStorage.getItem(appNotificationReadIdsKey);
    const parsed = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : []);
  } catch {
    return new Set<string>();
  }
}

function writeAppNotificationIds(ids: Set<string>) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(appNotificationReadIdsKey, JSON.stringify([...ids].slice(-500)));
}

function getToneClass(tone: AppNotificationTone) {
  if (tone === "green") return "bg-emerald-50 text-emerald-600 ring-emerald-100";
  if (tone === "orange") return "bg-orange-50 text-orange-600 ring-orange-100";
  if (tone === "rose") return "bg-rose-50 text-rose-600 ring-rose-100";
  if (tone === "violet") return "bg-violet-50 text-violet-600 ring-violet-100";
  return "bg-blue-50 text-[#2563EB] ring-blue-100";
}
