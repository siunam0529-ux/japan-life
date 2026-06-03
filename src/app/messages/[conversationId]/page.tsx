"use client";

import { ChevronRight, LayoutGrid, Send, UserRound, X } from "lucide-react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import type { CSSProperties, FormEvent, ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { BackButton } from "@/components/BackButton";
import { useLanguage } from "@/hooks/useLanguage";
import { blockUser, checkBlockStatus, getConversation, getCurrentMessageUser, listMessages, markConversationRead, reportUser, sendMessage, shouldUseRealMessageAuth, unblockUser } from "@/lib/messages/api";
import { clearForcedMessageConversationUnread, readDesktopMessageConversationIds, readMessageConversationBackground, readMessageConversationClearedAt, readMessageConversationRemark, readMutedMessageConversationIds, readPinnedMessageConversationIds, setMessageConversationBackground, setMessageConversationClearedAt, setMessageConversationDesktopShortcut, setMessageConversationMuted, setMessageConversationPinned, setMessageConversationRemark, setMessageUserRemark } from "@/lib/messages/listActions";
import type { ConversationListItem, MessageItem, MessageReportReason } from "@/lib/messages/types";
import type { Language } from "@/lib/i18n/translations";

const threadCopy = {
  "zh-CN": {
    back: "返回",
    settings: "聊天设置",
    missing: "会话不存在或你没有权限查看",
    sendFail: "发送失败，请稍后再试。",
    unblocked: "已解除拉黑。",
    blocked: "已拉黑该用户，无法继续发送消息。",
    cleared: "聊天记录已清空。",
    remarkSaved: "备注名已保存。",
    remarkCleared: "备注名已清除。",
    backgroundDefault: "已恢复默认聊天背景。",
    backgroundUpdated: "聊天背景已更新。",
    desktopAdded: "已添加到本地桌面快捷入口。",
    desktopRemoved: "已从本地桌面快捷入口移除。",
    reportSubmitted: "举报已提交，我们会尽快处理。",
    reportFail: "举报失败，请稍后再试。",
    blockedByMe: "你已拉黑该用户，无法继续发送消息。",
    blockedMe: "对方暂时无法接收私信。",
    empty: "还没有消息，打个招呼吧",
    blockedPlaceholder: "已拉黑，无法发送",
    placeholder: "发消息...",
    send: "发送",
    reportUser: "举报用户",
    reportPlaceholder: "补充说明，可不填",
    submitReport: "提交举报",
    remarkTitle: "设置备注名",
    saveRemark: "保存备注",
    clearInput: "清空输入",
    backgroundTitle: "设置聊天背景",
    loginTitle: "请先登录",
    loginDesc: "登录后可以查看聊天记录和发送私信。",
    login: "去登录",
    userFallback: "Japan Life 用户",
    desktopAddedDetail: "已添加",
    addDesktop: "添加好友到桌面",
    pinChat: "置顶聊天",
    mute: "消息免打扰",
    block: "加入黑名单",
    report: "举报",
    clearMessages: "清空聊天记录",
    more: "更多",
    close: "关闭",
    reportReasons: { harassment: "骚扰", spam: "广告 / 诈骗", inappropriate: "不适当内容", other: "其他" },
    backgrounds: { default: "默认", sky: "天空蓝", sakura: "樱花粉", mint: "薄荷绿" },
  },
  "zh-TW": {
    back: "返回",
    settings: "聊天設定",
    missing: "會話不存在或你沒有權限查看",
    sendFail: "傳送失敗，請稍後再試。",
    unblocked: "已解除封鎖。",
    blocked: "已封鎖該使用者，無法繼續傳送訊息。",
    cleared: "聊天記錄已清空。",
    remarkSaved: "備註名已儲存。",
    remarkCleared: "備註名已清除。",
    backgroundDefault: "已恢復預設聊天背景。",
    backgroundUpdated: "聊天背景已更新。",
    desktopAdded: "已加入本地桌面快捷入口。",
    desktopRemoved: "已從本地桌面快捷入口移除。",
    reportSubmitted: "檢舉已提交，我們會盡快處理。",
    reportFail: "檢舉失敗，請稍後再試。",
    blockedByMe: "你已封鎖該使用者，無法繼續傳送訊息。",
    blockedMe: "對方暫時無法接收私訊。",
    empty: "還沒有訊息，打個招呼吧",
    blockedPlaceholder: "已封鎖，無法傳送",
    placeholder: "傳送訊息...",
    send: "傳送",
    reportUser: "檢舉使用者",
    reportPlaceholder: "補充說明，可不填",
    submitReport: "提交檢舉",
    remarkTitle: "設定備註名",
    saveRemark: "儲存備註",
    clearInput: "清空輸入",
    backgroundTitle: "設定聊天背景",
    loginTitle: "請先登入",
    loginDesc: "登入後可以查看聊天記錄和傳送私訊。",
    login: "去登入",
    userFallback: "Japan Life 使用者",
    desktopAddedDetail: "已加入",
    addDesktop: "將好友加入桌面",
    pinChat: "置頂聊天",
    mute: "訊息免打擾",
    block: "加入黑名單",
    report: "檢舉",
    clearMessages: "清空聊天記錄",
    more: "更多",
    close: "關閉",
    reportReasons: { harassment: "騷擾", spam: "廣告 / 詐騙", inappropriate: "不適當內容", other: "其他" },
    backgrounds: { default: "預設", sky: "天空藍", sakura: "櫻花粉", mint: "薄荷綠" },
  },
  ja: {
    back: "戻る",
    settings: "チャット設定",
    missing: "会話が存在しないか、表示する権限がありません",
    sendFail: "送信に失敗しました。しばらくしてからもう一度お試しください。",
    unblocked: "ブロックを解除しました。",
    blocked: "このユーザーをブロックしました。メッセージは送信できません。",
    cleared: "チャット履歴を削除しました。",
    remarkSaved: "メモ名を保存しました。",
    remarkCleared: "メモ名を削除しました。",
    backgroundDefault: "デフォルトのチャット背景に戻しました。",
    backgroundUpdated: "チャット背景を更新しました。",
    desktopAdded: "ローカルのデスクトップ入口に追加しました。",
    desktopRemoved: "ローカルのデスクトップ入口から削除しました。",
    reportSubmitted: "通報を送信しました。できるだけ早く確認します。",
    reportFail: "通報に失敗しました。しばらくしてからもう一度お試しください。",
    blockedByMe: "このユーザーをブロック中のため、メッセージを送信できません。",
    blockedMe: "相手は現在メッセージを受信できません。",
    empty: "まだメッセージはありません。挨拶してみましょう",
    blockedPlaceholder: "ブロック中のため送信できません",
    placeholder: "メッセージを入力...",
    send: "送信",
    reportUser: "ユーザーを通報",
    reportPlaceholder: "補足説明（任意）",
    submitReport: "通報を送信",
    remarkTitle: "メモ名を設定",
    saveRemark: "メモを保存",
    clearInput: "入力をクリア",
    backgroundTitle: "チャット背景を設定",
    loginTitle: "ログインしてください",
    loginDesc: "ログイン後、チャット履歴の確認とメッセージ送信ができます。",
    login: "ログイン",
    userFallback: "Japan Life ユーザー",
    desktopAddedDetail: "追加済み",
    addDesktop: "友だちをデスクトップへ追加",
    pinChat: "チャットを固定",
    mute: "通知をミュート",
    block: "ブラックリストに追加",
    report: "通報",
    clearMessages: "チャット履歴を削除",
    more: "その他",
    close: "閉じる",
    reportReasons: { harassment: "嫌がらせ", spam: "広告 / 詐欺", inappropriate: "不適切な内容", other: "その他" },
    backgrounds: { default: "デフォルト", sky: "スカイブルー", sakura: "桜ピンク", mint: "ミントグリーン" },
  },
} as const;

type ThreadText = typeof threadCopy[Language];

const reportReasonValues: MessageReportReason[] = ["harassment", "spam", "inappropriate", "other"];

const chatBackgroundOptions = [
  { id: "default", preview: "linear-gradient(135deg,#f5faff,#eef7ff)" },
  { id: "sky", preview: "linear-gradient(135deg,#dbeafe,#eff6ff,#ffffff)" },
  { id: "sakura", preview: "linear-gradient(135deg,#fce7f3,#ffffff,#dbeafe)" },
  { id: "mint", preview: "linear-gradient(135deg,#dcfce7,#eff6ff,#ffffff)" },
] as const;

type ChatBackgroundId = typeof chatBackgroundOptions[number]["id"];

export default function MessageThreadPage() {
  const { language } = useLanguage();
  const text = threadCopy[language];
  const params = useParams<{ conversationId: string }>();
  const pathname = usePathname();
  const conversationId = params.conversationId;
  const loginHref = `/login?redirect=${encodeURIComponent(pathname || `/messages/${conversationId}`)}`;
  const [authRequired, setAuthRequired] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const [blockedByMe, setBlockedByMe] = useState(false);
  const [blockedMe, setBlockedMe] = useState(false);
  const [conversation, setConversation] = useState<ConversationListItem | null>(null);
  const [currentUserId, setCurrentUserId] = useState("");
  const [chatBackground, setChatBackground] = useState("default");
  const [desktopAdded, setDesktopAdded] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [backgroundOpen, setBackgroundOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [muted, setMuted] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [reportDetail, setReportDetail] = useState("");
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState<MessageReportReason>("harassment");
  const [remarkDraft, setRemarkDraft] = useState("");
  const [remarkOpen, setRemarkOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState("");
  const blocked = blockedByMe || blockedMe;

  useEffect(() => {
    const previousHtmlOverflow = document.documentElement.style.overflow;
    const previousBodyOverflow = document.body.style.overflow;
    const previousBodyHeight = document.body.style.height;
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    document.body.style.height = "100dvh";
    return () => {
      document.documentElement.style.overflow = previousHtmlOverflow;
      document.body.style.overflow = previousBodyOverflow;
      document.body.style.height = previousBodyHeight;
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    async function load() {
      const user = await getCurrentMessageUser();
      if (shouldUseRealMessageAuth() && user.isMock) {
        if (mounted) {
          setAuthRequired(true);
          setLoading(false);
        }
        return;
      }
      const [conversationResult, messageResult] = await Promise.all([
        getConversation(conversationId),
        listMessages(conversationId),
      ]);
      if (!mounted) return;
      setCurrentUserId(user.id);
      setConversation(conversationResult.data);
      setError(conversationResult.error || messageResult.error);
      if (conversationResult.data) {
        const savedClearedAt = readMessageConversationClearedAt(conversationResult.data.id);
        const savedRemark = readMessageConversationRemark(conversationResult.data.id);
        setDisplayName(savedRemark || conversationResult.data.otherUserName);
        setRemarkDraft(savedRemark);
        setMessages(filterClearedMessages(messageResult.data ?? [], savedClearedAt));
        setChatBackground(readMessageConversationBackground(conversationResult.data.id));
        setDesktopAdded(readDesktopMessageConversationIds().has(conversationResult.data.id));
        setMuted(readMutedMessageConversationIds().has(conversationResult.data.id));
        setPinned(readPinnedMessageConversationIds().has(conversationResult.data.id));
        const blockStatus = await checkBlockStatus(conversationResult.data.otherUserId);
        if (mounted) {
          setBlockedByMe(Boolean(blockStatus.data?.blockedByMe));
          setBlockedMe(Boolean(blockStatus.data?.blockedMe));
        }
      } else {
        setDisplayName("");
        setMessages(messageResult.data ?? []);
        setBlockedByMe(false);
        setBlockedMe(false);
      }
      setLoading(false);
      if (conversationResult.data) {
        clearForcedMessageConversationUnread(conversationId);
        void markConversationRead(conversationId);
      }
    }
    void load();
    return () => {
      mounted = false;
    };
  }, [conversationId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (sending || blocked) return;
    const body = draft.trim();
    if (!body) return;
    setSending(true);
    setStatus("");
    const result = await sendMessage(conversationId, body);
    setSending(false);
    if (!result.data) {
      setStatus(result.error || text.sendFail);
      return;
    }
    setMessages((items) => [...items, result.data!]);
    setDraft("");
  };

  const toggleBlock = async () => {
    if (!conversation) return;
    const result = blockedByMe ? await unblockUser(conversation.otherUserId) : await blockUser(conversation.otherUserId);
    if (result.data) {
      setBlockedByMe(!blockedByMe);
      setStatus(blockedByMe ? text.unblocked : text.blocked);
    }
  };

  const clearVisibleMessages = () => {
    const now = new Date().toISOString();
    setMessageConversationClearedAt(conversationId, now);
    setMessages([]);
    setMenuOpen(false);
    setStatus(text.cleared);
  };

  const toggleMuted = () => {
    const next = !muted;
    setMuted(next);
    setMessageConversationMuted(conversationId, next);
  };

  const togglePinned = () => {
    const next = !pinned;
    setPinned(next);
    setMessageConversationPinned(conversationId, next);
  };

  const saveRemark = () => {
    if (!conversation) return;
    const nextRemark = setMessageConversationRemark(conversationId, remarkDraft);
    setMessageUserRemark(conversation.otherUserId, nextRemark);
    setDisplayName(nextRemark || conversation.otherUserName);
    setRemarkDraft(nextRemark);
    setRemarkOpen(false);
    setStatus(nextRemark ? text.remarkSaved : text.remarkCleared);
  };

  const selectBackground = (background: ChatBackgroundId) => {
    setChatBackground(background);
    setMessageConversationBackground(conversationId, background);
    setBackgroundOpen(false);
    setStatus(background === "default" ? text.backgroundDefault : text.backgroundUpdated);
  };

  const addDesktopShortcut = () => {
    const next = !desktopAdded;
    setDesktopAdded(next);
    setMessageConversationDesktopShortcut(conversationId, next);
    setMenuOpen(false);
    setStatus(next ? text.desktopAdded : text.desktopRemoved);
  };

  const submitReport = async () => {
    if (!conversation) return;
    const result = await reportUser(conversation.otherUserId, conversation.id, reportReason, reportDetail);
    if (result.data) {
      setReportOpen(false);
      setReportDetail("");
      setStatus(text.reportSubmitted);
    } else {
      setStatus(result.error || text.reportFail);
    }
  };

  if (loading) {
    return (
      <main className="h-[100dvh] overflow-hidden bg-[#f5faff]">
        <div className="mx-auto h-full max-w-[430px] p-5">
          <div className="h-10 w-24 animate-pulse rounded-full bg-white" />
        </div>
      </main>
    );
  }

  if (authRequired) {
    return (
      <main className="h-[100dvh] overflow-hidden bg-[#f5faff] text-[#061a3a]">
        <div className="mx-auto h-full w-full max-w-[430px] px-4 pt-5">
          <BackButton fallbackHref="/messages" label={text.back} />
          <LoginRequiredCard loginHref={loginHref} text={text} />
        </div>
      </main>
    );
  }

  if (!conversation || error) {
    return (
      <main className="h-[100dvh] overflow-hidden bg-[#f5faff] text-[#061a3a]">
        <div className="mx-auto h-full w-full max-w-[430px] px-4 pt-5">
          <BackButton fallbackHref="/messages" label={text.back} />
          <section className="mt-6 rounded-[28px] bg-white p-6 text-center shadow-[0_14px_34px_rgba(15,76,129,0.08)] ring-1 ring-blue-50">
            <p className="text-sm font-black leading-6 text-slate-500">{text.missing}</p>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="h-[100dvh] overflow-hidden bg-[#f5faff] text-[#061a3a]">
      <div className="mx-auto flex h-full w-full max-w-[430px] flex-col bg-[#f5faff]">
        <header className="z-40 flex h-[62px] shrink-0 items-center gap-3 border-b border-blue-50 bg-white/95 px-3 backdrop-blur">
          <BackButton fallbackHref="/messages" label="" />
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-[#2563eb]">
            <UserRound className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-[16px] font-black">{displayName || conversation.otherUserName}</h1>
          </div>
          <button className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#111827] ring-1 ring-slate-200" onClick={() => setMenuOpen(true)} type="button" aria-label={text.settings}>
            <LayoutGrid className="h-5 w-5" />
          </button>
        </header>

        <section className="min-h-0 flex-1 overflow-y-auto px-4 py-4" style={getChatBackgroundStyle(chatBackground)}>
          {status ? <p className="mb-3 rounded-2xl bg-blue-50 px-4 py-3 text-xs font-black text-[#2563eb]">{status}</p> : null}
          {blockedByMe ? <p className="mb-3 rounded-2xl bg-rose-50 px-4 py-3 text-xs font-black text-rose-600">{text.blockedByMe}</p> : null}
          {blockedMe ? <p className="mb-3 rounded-2xl bg-rose-50 px-4 py-3 text-xs font-black text-rose-600">{text.blockedMe}</p> : null}
          {messages.length === 0 ? <p className="mt-10 text-center text-sm font-black text-slate-400">{text.empty}</p> : null}
          <div className="grid gap-3">
            {messages.map((message) => {
              const mine = message.senderId === currentUserId;
              return (
                <div className={`flex flex-col ${mine ? "items-end" : "items-start"}`} key={message.id}>
                  <p className="mb-1 px-1 text-[10px] font-black text-slate-400">{formatTime(message.createdAt)}</p>
                  <div className={`max-w-[78%] rounded-[22px] px-4 py-3 text-sm font-bold leading-6 shadow-sm ${mine ? "rounded-br-md bg-[#2563eb] text-white" : "rounded-bl-md bg-white text-[#263b59] ring-1 ring-blue-50"}`}>
                    <p className="whitespace-pre-wrap break-words">{message.body}</p>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>
        </section>

        <form className="z-40 shrink-0 bg-transparent px-3 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] pt-2" onSubmit={submit}>
          <div className="flex min-h-12 items-center gap-2 rounded-[24px] bg-white px-3 py-1.5 shadow-[0_8px_24px_rgba(15,76,129,0.08)] ring-1 ring-blue-200/80">
            <input className="min-w-0 flex-1 bg-transparent px-1 text-[15px] font-bold text-[#061a3a] outline-none placeholder:text-slate-400 disabled:text-slate-400" disabled={blocked || sending} maxLength={500} onChange={(event) => setDraft(event.target.value)} placeholder={blocked ? text.blockedPlaceholder : text.placeholder} value={draft} />
            {draft.trim() ? (
              <button className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#2563eb] text-white disabled:bg-slate-300" disabled={blocked || sending} type="submit" aria-label={text.send}>
                <Send className="h-4 w-4" />
              </button>
            ) : null}
          </div>
        </form>
      </div>

      {menuOpen ? (
        <ChatSettingsSheet
          blockedByMe={blockedByMe}
          desktopAdded={desktopAdded}
          displayName={displayName || conversation.otherUserName}
          conversation={conversation}
          muted={muted}
          onClearMessages={clearVisibleMessages}
          onAddDesktop={addDesktopShortcut}
          onClose={() => setMenuOpen(false)}
          onOpenBackground={() => {
            setMenuOpen(false);
            setBackgroundOpen(true);
          }}
          onOpenRemark={() => {
            setRemarkDraft(readMessageConversationRemark(conversationId));
            setMenuOpen(false);
            setRemarkOpen(true);
          }}
          onOpenReport={() => {
            setMenuOpen(false);
            setReportOpen(true);
          }}
          onToggleBlock={() => void toggleBlock()}
          onToggleMuted={toggleMuted}
          onTogglePinned={togglePinned}
          pinned={pinned}
          text={text}
        />
      ) : null}

      {reportOpen ? (
        <Sheet onClose={() => setReportOpen(false)} text={text} title={text.reportUser}>
          <div className="grid gap-2">
            {reportReasonValues.map((reason) => (
              <button className={`h-11 rounded-2xl px-4 text-left text-sm font-black ring-1 ${reportReason === reason ? "bg-blue-50 text-[#2563eb] ring-blue-100" : "bg-white text-slate-600 ring-slate-100"}`} key={reason} onClick={() => setReportReason(reason)} type="button">
                {text.reportReasons[reason]}
              </button>
            ))}
          </div>
          <textarea className="mt-3 min-h-24 w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold outline-none focus:border-[#2563eb]" onChange={(event) => setReportDetail(event.target.value)} placeholder={text.reportPlaceholder} value={reportDetail} />
          <button className="mt-3 h-12 w-full rounded-2xl bg-[#2563eb] text-sm font-black text-white" onClick={submitReport} type="button">{text.submitReport}</button>
        </Sheet>
      ) : null}

      {remarkOpen ? (
        <Sheet onClose={() => setRemarkOpen(false)} text={text} title={text.remarkTitle}>
          <input className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-black text-[#061a3a] outline-none focus:border-[#2563eb]" maxLength={24} onChange={(event) => setRemarkDraft(event.target.value)} placeholder={conversation.otherUserName} value={remarkDraft} />
          <button className="mt-3 h-12 w-full rounded-2xl bg-[#2563eb] text-sm font-black text-white" onClick={saveRemark} type="button">{text.saveRemark}</button>
          <button className="mt-3 h-11 w-full rounded-2xl bg-slate-50 text-sm font-black text-slate-500" onClick={() => setRemarkDraft("")} type="button">{text.clearInput}</button>
        </Sheet>
      ) : null}

      {backgroundOpen ? (
        <Sheet onClose={() => setBackgroundOpen(false)} text={text} title={text.backgroundTitle}>
          <div className="grid grid-cols-2 gap-3">
            {chatBackgroundOptions.map((option) => (
              <button className={`rounded-[20px] p-3 text-left ring-1 ${chatBackground === option.id ? "bg-blue-50 ring-[#2563eb]" : "bg-white ring-slate-100"}`} key={option.id} onClick={() => selectBackground(option.id)} type="button">
                <span className="block h-20 rounded-2xl ring-1 ring-slate-100" style={{ background: option.preview }} />
                <span className="mt-2 block text-sm font-black text-[#263b59]">{text.backgrounds[option.id]}</span>
              </button>
            ))}
          </div>
        </Sheet>
      ) : null}

    </main>
  );
}

function LoginRequiredCard({ loginHref, text }: { loginHref: string; text: ThreadText }) {
  return (
    <section className="mt-6 rounded-[28px] bg-white p-8 text-center shadow-[0_14px_34px_rgba(15,76,129,0.08)] ring-1 ring-blue-50">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-[#2563eb]">
        <UserRound className="h-7 w-7" />
      </div>
      <h2 className="mt-4 text-lg font-black text-[#061a3a]">{text.loginTitle}</h2>
      <p className="mt-2 text-sm font-bold leading-6 text-slate-500">{text.loginDesc}</p>
      <Link className="mt-5 inline-flex h-11 items-center justify-center rounded-full bg-[#2563eb] px-6 text-sm font-black text-white" href={loginHref}>
        {text.login}
      </Link>
    </section>
  );
}

function ChatSettingsSheet({
  blockedByMe,
  conversation,
  desktopAdded,
  displayName,
  muted,
  onAddDesktop,
  onClearMessages,
  onClose,
  onOpenBackground,
  onOpenReport,
  onOpenRemark,
  onToggleBlock,
  onToggleMuted,
  onTogglePinned,
  pinned,
  text,
}: {
  blockedByMe: boolean;
  conversation: ConversationListItem;
  desktopAdded: boolean;
  displayName: string;
  muted: boolean;
  onAddDesktop: () => void;
  onClearMessages: () => void;
  onClose: () => void;
  onOpenBackground: () => void;
  onOpenReport: () => void;
  onOpenRemark: () => void;
  onToggleBlock: () => void;
  onToggleMuted: () => void;
  onTogglePinned: () => void;
  pinned: boolean;
  text: ThreadText;
}) {
  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center bg-slate-950/35 backdrop-blur-sm" onClick={onClose}>
      <section className="max-h-[86dvh] w-full max-w-[430px] overflow-y-auto rounded-t-[28px] bg-[#f5f5f5] px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-4 shadow-[0_-24px_70px_rgba(15,23,42,0.18)]" onClick={(event) => event.stopPropagation()}>
        <div className="mx-auto h-1.5 w-12 rounded-full bg-slate-300" />

        <div className="mt-6 flex flex-col items-center">
          <span className="flex h-[88px] w-[88px] items-center justify-center rounded-full text-[#2563eb] ring-1 ring-blue-100" style={{ background: getAvatarBackground(conversation.otherUserAvatar) }}>
            <UserRound className="h-10 w-10" />
          </span>
          <h2 className="mt-3 max-w-full truncate text-[22px] font-black text-[#111827]">{displayName || conversation.otherUserName || text.userFallback}</h2>
        </div>

        <div className="mt-8 grid gap-3">
          <SettingsRow label={text.remarkTitle} onClick={onOpenRemark} />
          <SettingsRow label={text.backgroundTitle} onClick={onOpenBackground} />
          <SettingsRow detail={desktopAdded ? text.desktopAddedDetail : undefined} label={text.addDesktop} onClick={onAddDesktop} />
          <SettingsSwitch label={text.pinChat} onChange={onTogglePinned} value={pinned} />
          <section className="overflow-hidden rounded-[20px] bg-white">
            <SettingsSwitch label={text.mute} onChange={onToggleMuted} value={muted} />
            <div className="mx-4 border-t border-slate-100" />
            <SettingsSwitch label={text.block} onChange={onToggleBlock} value={blockedByMe} />
            <div className="mx-4 border-t border-slate-100" />
            <SettingsRow label={text.report} onClick={onOpenReport} />
          </section>
          <button className="h-14 rounded-[20px] bg-white px-5 text-left text-[16px] font-black text-[#111827]" onClick={onClearMessages} type="button">
            {text.clearMessages}
          </button>
        </div>
      </section>
    </div>
  );
}

function SettingsRow({ detail, label, onClick }: { detail?: string; label: string; onClick?: () => void }) {
  return (
    <button className="flex h-14 w-full items-center justify-between rounded-[20px] bg-white px-5 text-left text-[16px] font-black text-[#111827]" onClick={onClick} type="button">
      <span>{label}</span>
      <span className="inline-flex items-center gap-2">
        {detail ? <span className="text-xs font-black text-[#2563eb]">{detail}</span> : null}
        <ChevronRight className="h-5 w-5 text-slate-300" />
      </span>
    </button>
  );
}

function SettingsSwitch({ label, onChange, value }: { label: string; onChange: () => void; value: boolean }) {
  return (
    <button className="flex h-14 w-full items-center justify-between bg-white px-5 text-left text-[16px] font-black text-[#111827]" onClick={onChange} type="button">
      <span>{label}</span>
      <span className={`relative h-8 w-[54px] rounded-full transition ${value ? "bg-[#2563eb]" : "bg-slate-300"}`}>
        <span className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow-sm transition ${value ? "left-7" : "left-1"}`} />
      </span>
    </button>
  );
}

function Sheet({ children, onClose, text, title }: { children: ReactNode; onClose: () => void; text: ThreadText; title?: string }) {
  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center bg-slate-950/35 px-3 pb-3 backdrop-blur-sm" onClick={onClose}>
      <section className="w-full max-w-[430px] rounded-[28px] bg-white p-4 shadow-[0_24px_70px_rgba(15,23,42,0.22)]" onClick={(event) => event.stopPropagation()}>
        <div className="mx-auto h-1.5 w-10 rounded-full bg-slate-200" />
        <div className="mt-4 flex items-center justify-between">
          <h2 className="text-lg font-black text-[#061a3a]">{title ?? text.more}</h2>
          <button className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 text-[#2563eb]" onClick={onClose} type="button" aria-label={text.close}>
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-4">{children}</div>
      </section>
    </div>
  );
}

function getAvatarBackground(avatar?: string) {
  if (!avatar) return "linear-gradient(135deg,#dbeafe,#ffffff,#e0f2fe)";
  if (avatar.startsWith("linear-gradient")) return avatar;
  return `center / cover no-repeat url("${avatar}")`;
}

function getChatBackgroundStyle(background: string): CSSProperties {
  const option = chatBackgroundOptions.find((item) => item.id === background) ?? chatBackgroundOptions[0];
  return { background: option.preview };
}

function filterClearedMessages(messages: MessageItem[], clearedAt: string) {
  if (!clearedAt) return messages;
  const clearedTime = Date.parse(clearedAt);
  if (Number.isNaN(clearedTime)) return messages;
  return messages.filter((message) => Date.parse(message.createdAt) > clearedTime);
}

function formatTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}
