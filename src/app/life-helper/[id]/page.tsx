"use client";

import type { User } from "@supabase/supabase-js";
import { ArrowLeft, CheckCircle2, Handshake, Info, LockKeyhole, MapPin, MessageCircle, Send, ShieldCheck, UserRoundCheck, XCircle } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import type { CSSProperties, FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import { useLanguage } from "@/hooks/useLanguage";
import { clearLifeHelperPreloadCache, getCachedLifeHelperData, warmLifeHelperData } from "@/lib/appPreload";
import { createLifeHelperApplication, fetchLifeHelperApplications, updateLifeHelperApplicationStatus, updateLifeHelperRequestStatus } from "@/lib/lifeHelper/api";
import { getContactVisibilityLabel, getLifeHelperApplicationStatusLabel, getLifeHelperCategoryLabel, type LifeHelperApplication, type LifeHelperApplicationStatus, type LifeHelperRequest, type LifeHelperRequestStatus } from "@/lib/lifeHelper/types";
import { type Language } from "@/lib/i18n/translations";
import { withBackFrom } from "@/lib/navigation/back";
import { supabase } from "@/lib/supabase";

const zhCnDetailCopy = {
  back: "返回",
  badge: "生活帮手",
  defaultMessage: "你好，我可以帮忙。时间和费用可以再商量。",
  userFallback: "Japan Life 用户",
  loadFail: "生活帮手数据读取失败。",
  loginRequired: "请先登录后再使用生活帮手功能。",
  ownRequest: "这是你发布的需求，可以在本页查看收到的申请。",
  closedCannotApply: "这个需求已经关闭，暂时不能再发送申请。",
  alreadyAppliedMessage: "你已经发送过申请。",
  applicationSent: "已发送申请，发布者可以看到你的留言和联系方式。",
  applicationFail: "申请发送失败。",
  acceptedMessage: "已接受这条申请，系统已自动发送 App 私信。",
  declinedMessage: "已拒绝这条申请。",
  applicationUpdateFail: "申请状态更新失败。",
  requestClosed: "需求已关闭，新的申请会停止接收。",
  requestReopened: "需求已重新开放。",
  requestUpdateFail: "需求状态更新失败。",
  notFoundTitle: "没有找到这个需求",
  notFoundDesc: "可能是本地数据被清理，或者这个需求已经不存在。",
  backToLifeHelper: "回到生活帮手",
  recruiting: "招募中",
  closed: "已关闭",
  author: "发布者",
  budget: "预算",
  preferredTime: "希望时间",
  createdAt: "发布时间",
  closeRequest: "关闭这个需求",
  reopenRequest: "重新开放需求",
  detail: "详细说明",
  contact: "联系方式",
  visibilityRule: "可见规则",
  hiddenContact: "联系方式暂不公开。发送申请后，发布者可以看到你的留言和联系方式。",
  login: "去登录",
  applyContact: "申请联系",
  nameOptional: "称呼（可选）",
  namePlaceholder: "例如：小南",
  message: "留言",
  myContact: "我的联系方式",
  contactPlaceholder: "微信 / LINE ID / 邮箱 / 电话 / 其他",
  sendApplication: "发送申请",
  receivedApplications: "收到的申请",
  noApplications: "还没有人申请这个需求。",
  status: "状态",
  idLabel: "ID",
  accept: "接受",
  decline: "拒绝",
  ownButton: "这是你发布的需求",
  closedButton: "需求已关闭",
  appliedButton: (status: string) => "申请" + status,
  canHelp: "我可以帮忙",
  safetyTitle: "隐私和安全提示",
  safetyItems: ["请不要提前支付大额费用。", "见面建议选择公共场所。", "涉及宠物、钥匙、房间进入等事项，请提前确认身份和细节。"],
  safetyPlatform: "平台仅提供信息匹配，请自行判断风险。",
} as const;

const zhTwDetailCopy = {
  ...zhCnDetailCopy,
  badge: "生活幫手",
  defaultMessage: "你好，我可以幫忙。時間和費用可以再商量。",
  userFallback: "Japan Life 使用者",
  loadFail: "生活幫手資料讀取失敗。",
  loginRequired: "請先登入後再使用生活幫手功能。",
  ownRequest: "這是你發布的需求，可以在本頁查看收到的申請。",
  closedCannotApply: "這個需求已經關閉，暫時不能再發送申請。",
  alreadyAppliedMessage: "你已經發送過申請。",
  applicationSent: "已發送申請，發布者可以看到你的留言和聯絡方式。",
  applicationFail: "申請發送失敗。",
  acceptedMessage: "已接受這條申請，系統已自動發送 App 私訊。",
  declinedMessage: "已拒絕這條申請。",
  applicationUpdateFail: "申請狀態更新失敗。",
  requestClosed: "需求已關閉，新的申請會停止接收。",
  requestReopened: "需求已重新開放。",
  requestUpdateFail: "需求狀態更新失敗。",
  notFoundTitle: "沒有找到這個需求",
  notFoundDesc: "可能是本地資料被清理，或者這個需求已經不存在。",
  backToLifeHelper: "回到生活幫手",
  closed: "已關閉",
  author: "發布者",
  budget: "預算",
  preferredTime: "希望時間",
  createdAt: "發布時間",
  closeRequest: "關閉這個需求",
  reopenRequest: "重新開放需求",
  detail: "詳細說明",
  contact: "聯絡方式",
  visibilityRule: "可見規則",
  hiddenContact: "聯絡方式暫不公開。發送申請後，發布者可以看到你的留言和聯絡方式。",
  login: "去登入",
  applyContact: "申請聯絡",
  nameOptional: "稱呼（可選）",
  namePlaceholder: "例如：小南",
  myContact: "我的聯絡方式",
  contactPlaceholder: "微信 / LINE ID / 信箱 / 電話 / 其他",
  sendApplication: "發送申請",
  receivedApplications: "收到的申請",
  noApplications: "還沒有人申請這個需求。",
  status: "狀態",
  decline: "拒絕",
  ownButton: "這是你發布的需求",
  closedButton: "需求已關閉",
  appliedButton: (status: string) => "申請" + status,
  canHelp: "我可以幫忙",
  safetyTitle: "隱私和安全提示",
  safetyItems: ["請不要提前支付大額費用。", "見面建議選擇公共場所。", "涉及寵物、鑰匙、房間進入等事項，請提前確認身份和細節。"],
  safetyPlatform: "平台僅提供資訊配對，請自行判斷風險。",
} as const;

const jaDetailCopy = {
  ...zhCnDetailCopy,
  back: "戻る",
  badge: "暮らしサポート",
  defaultMessage: "こんにちは。お手伝いできます。時間と料金は相談できます。",
  userFallback: "Japan Life ユーザー",
  loadFail: "暮らしサポートのデータ読み込みに失敗しました。",
  loginRequired: "暮らしサポートを使うには先にログインしてください。",
  ownRequest: "これはあなたが投稿した依頼です。このページで届いた応募を確認できます。",
  closedCannotApply: "この依頼は締め切られているため、応募できません。",
  alreadyAppliedMessage: "すでに応募済みです。",
  applicationSent: "応募を送信しました。投稿者はあなたのメッセージと連絡先を確認できます。",
  applicationFail: "応募の送信に失敗しました。",
  acceptedMessage: "この応募を承認しました。App 内メッセージを自動送信しました。",
  declinedMessage: "この応募を拒否しました。",
  applicationUpdateFail: "応募ステータスの更新に失敗しました。",
  requestClosed: "依頼を締め切りました。新しい応募は停止されます。",
  requestReopened: "依頼を再開しました。",
  requestUpdateFail: "依頼ステータスの更新に失敗しました。",
  notFoundTitle: "この依頼が見つかりません",
  notFoundDesc: "ローカルデータが削除されたか、この依頼が存在しない可能性があります。",
  backToLifeHelper: "暮らしサポートへ戻る",
  recruiting: "募集中",
  closed: "締切済み",
  author: "投稿者",
  budget: "予算",
  preferredTime: "希望日時",
  createdAt: "投稿日時",
  closeRequest: "この依頼を締切",
  reopenRequest: "依頼を再開",
  detail: "詳細",
  contact: "連絡先",
  visibilityRule: "表示ルール",
  hiddenContact: "連絡先はまだ公開されていません。応募後、投稿者はあなたのメッセージと連絡先を確認できます。",
  login: "ログイン",
  applyContact: "応募する",
  nameOptional: "名前（任意）",
  namePlaceholder: "例：ミナミ",
  message: "メッセージ",
  myContact: "自分の連絡先",
  contactPlaceholder: "WeChat / LINE ID / メール / 電話 / その他",
  sendApplication: "応募を送信",
  receivedApplications: "届いた応募",
  noApplications: "この依頼への応募はまだありません。",
  status: "ステータス",
  accept: "承認",
  decline: "拒否",
  ownButton: "あなたの依頼です",
  closedButton: "依頼は締切済み",
  appliedButton: (status: string) => "応募" + status,
  canHelp: "手伝えます",
  safetyTitle: "プライバシーと安全の注意",
  safetyItems: ["高額な費用を事前に支払わないでください。", "会う場合は公共の場所をおすすめします。", "ペット、鍵、室内への立ち入りなどは、事前に本人確認と詳細確認をしてください。"],
  safetyPlatform: "プラットフォームは情報マッチングのみ提供します。リスクはご自身で判断してください。",
} as const;

const detailCopy = { "zh-CN": zhCnDetailCopy, "zh-TW": zhTwDetailCopy, ja: jaDetailCopy } as const;

type DetailText = (typeof detailCopy)[Language];

function getUserDisplayName(user: User | null, fallback: string) {
  const metadata = user?.user_metadata;
  const value = metadata?.display_name ?? metadata?.full_name ?? metadata?.name;
  if (typeof value === "string" && value.trim()) return value.trim();
  return user?.email?.split("@")[0] || fallback;
}

export default function LifeHelperDetailPage() {
  const { language } = useLanguage();
  const text = detailCopy[language];
  const params = useParams<{ id: string }>();
  const requestId = decodeURIComponent(params.id);
  const [applications, setApplications] = useState<LifeHelperApplication[]>([]);
  const [applicationContact, setApplicationContact] = useState("");
  const [applicationMessage, setApplicationMessage] = useState<string>(text.defaultMessage);
  const [applicationName, setApplicationName] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [requests, setRequests] = useState<LifeHelperRequest[]>([]);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const defaultMessages: string[] = Object.values(detailCopy).map((copy) => copy.defaultMessage);
    setApplicationMessage((current) => defaultMessages.includes(current) ? text.defaultMessage : current);
  }, [text.defaultMessage]);

  useEffect(() => {
    const cached = getCachedLifeHelperData();
    if (cached) {
      setRequests(cached.requests);
      setApplications(cached.applications);
    }
    void (async () => {
      setMessage("");
      try {
        const nextData = await warmLifeHelperData();
        setRequests(nextData.requests);
        setApplications(nextData.applications);
      } catch (error) {
        setMessage(error instanceof Error ? error.message : text.loadFail);
      }
    })();
    if (!supabase) return;

    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (mounted) setUser(data.session?.user ?? null);
      if (mounted && data.session?.user) void loadApplications();
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setUser(session?.user ?? null);
      void loadApplications();
    });
    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, [text.loadFail]);

  async function loadApplications() {
    try {
      setApplications(await fetchLifeHelperApplications());
    } catch {
      setApplications([]);
    }
  }

  const allRequests = useMemo(() => requests, [requests]);
  const request = allRequests.find((item) => item.id === requestId);
  const requestApplications = applications.filter((application) => application.requestId === requestId);
  const mine = Boolean(user && request?.authorId === user.id);
  const myApplication = user ? applications.find((application) => application.requestId === requestId && application.applicantId === user.id) : undefined;
  const canSeeContact = Boolean(request && (request.contactVisibility === "public" || mine || (request.contactVisibility === "after_apply" && myApplication)));
  const canSubmit = request?.status === "open" && applicationContact.trim() && applicationMessage.trim();

  function openApplicationForm() {
    if (!user) {
      setMessage(text.loginRequired);
      return;
    }
    if (mine) {
      setMessage(text.ownRequest);
      return;
    }
    if (request?.status !== "open") {
      setMessage(text.closedCannotApply);
      return;
    }
    if (myApplication) {
      setMessage(text.alreadyAppliedMessage);
      return;
    }
    setMessage("");
    setApplicationName(getUserDisplayName(user, text.userFallback));
    setFormOpen(true);
  }

  async function submitApplication(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user || !request || !canSubmit || mine || myApplication) return;
    try {
      const nextApplication = await createLifeHelperApplication({
        applicantName: applicationName.trim() || getUserDisplayName(user, text.userFallback),
        contact: applicationContact.trim(),
        message: applicationMessage.trim(),
        requestId: request.id,
      });
      setApplications((current) => [nextApplication, ...current.filter((application) => application.id !== nextApplication.id)]);
      clearLifeHelperPreloadCache();
      setFormOpen(false);
      setMessage(text.applicationSent);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : text.applicationFail);
    }
  }

  async function updateApplicationStatus(applicationId: string, status: LifeHelperApplicationStatus) {
    if (!mine) return;
    try {
      const updated = await updateLifeHelperApplicationStatus(applicationId, status);
      setApplications((current) => current.map((application) => application.id === updated.id ? updated : application));
      clearLifeHelperPreloadCache();
      setMessage(status === "accepted" ? text.acceptedMessage : text.declinedMessage);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : text.applicationUpdateFail);
    }
  }

  async function updateRequestStatus(status: LifeHelperRequestStatus) {
    if (!mine || !request) return;
    try {
      const updated = await updateLifeHelperRequestStatus(request.id, status);
      setRequests((current) => current.map((item) => item.id === updated.id ? updated : item));
      clearLifeHelperPreloadCache();
      setMessage(status === "closed" ? text.requestClosed : text.requestReopened);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : text.requestUpdateFail);
    }
  }

  if (!request) {
    return (
      <main className="jl-tool-theme min-h-screen text-[#061a3a]">
        <div className="jl-tool-shell mx-auto flex min-h-screen w-full max-w-[430px] flex-col gap-4 px-4 pb-28 pt-5">
          <Header text={text} />
          <section className="rounded-[28px] border border-white/80 bg-white/85 p-5 shadow-[0_18px_40px_rgba(37,99,235,0.12)]">
            <h1 className="text-2xl font-black">{text.notFoundTitle}</h1>
            <p className="mt-2 text-sm font-bold leading-6 text-slate-600">{text.notFoundDesc}</p>
            <Link className="mt-4 flex h-11 items-center justify-center rounded-2xl bg-[#2563EB] text-sm font-black text-white" href="/life-helper">{text.backToLifeHelper}</Link>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="jl-tool-theme min-h-screen text-[#061a3a]">
      <div className="jl-tool-shell mx-auto flex min-h-screen w-full max-w-[430px] flex-col gap-4 overflow-x-hidden px-4 pb-[calc(env(safe-area-inset-bottom)+12rem)] pt-5">
        <Header text={text} />

        <section className="rounded-[28px] border border-white/80 bg-white/90 p-5 shadow-[0_18px_40px_rgba(37,99,235,0.12)] backdrop-blur">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-[#1D4ED8] ring-1 ring-blue-100">{getLifeHelperCategoryLabel(request.category, language)}</span>
            <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-slate-600 ring-1 ring-blue-100">{request.status === "open" ? text.recruiting : text.closed}</span>
          </div>
          <h1 className="mt-4 break-words text-2xl font-black leading-tight">{request.title}</h1>
          <p className="mt-3 flex items-center gap-1 text-sm font-black text-[#2563EB]">
            <MapPin className="h-4 w-4" />
            {request.area}
          </p>
          <div className="mt-4">
            <AccountBadge avatar={request.authorAvatar} id={request.authorProfileId || request.authorId} idLabel={text.idLabel} label={text.author} name={request.authorName} />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 text-xs font-black text-slate-700">
            <InfoPill label={text.budget} value={request.budget} />
            <InfoPill label={text.preferredTime} value={request.preferredTime} />
            <InfoPill label={text.createdAt} value={request.createdAt} />
          </div>
          {mine ? (
            <button className="mt-4 h-11 w-full rounded-2xl border border-blue-200 bg-white text-sm font-black text-[#2563EB] shadow-sm" onClick={() => updateRequestStatus(request.status === "open" ? "closed" : "open")} type="button">
              {request.status === "open" ? text.closeRequest : text.reopenRequest}
            </button>
          ) : null}
        </section>

        <section className="rounded-[26px] border border-white/80 bg-white/90 p-4 shadow-[0_14px_32px_rgba(37,99,235,0.09)]">
          <h2 className="text-lg font-black">{text.detail}</h2>
          <p className="mt-3 whitespace-pre-wrap text-sm font-bold leading-7 text-slate-600">{request.description}</p>
        </section>

        <section className="rounded-[26px] border border-white/80 bg-white/90 p-4 shadow-[0_14px_32px_rgba(37,99,235,0.09)]">
          <div className="flex items-center gap-2 text-sm font-black text-[#1D4ED8]">
            <LockKeyhole className="h-4 w-4" />
            {text.contact}
          </div>
          <p className="mt-2 text-xs font-bold leading-5 text-slate-500">{text.visibilityRule}: {getContactVisibilityLabel(request.contactVisibility, language)}</p>
          {canSeeContact && request.contact ? (
            <p className="mt-3 rounded-2xl bg-blue-50 px-3 py-2 text-sm font-black text-[#2563EB] ring-1 ring-blue-100">{request.contact}</p>
          ) : (
            <p className="mt-3 rounded-2xl bg-slate-50 px-3 py-2 text-xs font-bold leading-5 text-slate-500">{text.hiddenContact}</p>
          )}
        </section>

        {message ? <p className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-xs font-black leading-5 text-[#1D4ED8]">{message} {!user ? <Link className="underline" href={withBackFrom(`/login?next=/life-helper/${request.id}`)}>{text.login}</Link> : null}</p> : null}

        {formOpen ? (
          <form className="rounded-[26px] border border-blue-100 bg-blue-50/80 p-4 shadow-sm" onSubmit={submitApplication}>
            <div className="flex items-center gap-2 text-sm font-black text-[#1D4ED8]">
              <MessageCircle className="h-4 w-4" />
              {text.applyContact}
            </div>
            <div className="mt-3 grid gap-3">
              <TextInput label={text.nameOptional} onChange={setApplicationName} placeholder={text.namePlaceholder} value={applicationName} />
              <label className="grid gap-1.5">
                <span className="text-xs font-black text-slate-500">{text.message}</span>
                <textarea className="min-h-24 resize-none rounded-2xl border border-blue-100 bg-white px-4 py-3 text-sm font-bold outline-none focus:border-blue-400" onChange={(event) => setApplicationMessage(event.target.value)} placeholder={text.defaultMessage} value={applicationMessage} />
              </label>
              <TextInput label={text.myContact} onChange={setApplicationContact} placeholder={text.contactPlaceholder} value={applicationContact} />
              <SafetyNotice compact text={text} />
              <button className="flex h-11 items-center justify-center gap-2 rounded-2xl bg-[#2563EB] text-sm font-black text-white disabled:cursor-not-allowed disabled:bg-slate-300" disabled={!canSubmit} type="submit">
                <Send className="h-4 w-4" />
                {text.sendApplication}
              </button>
            </div>
          </form>
        ) : null}

        {mine ? (
          <section className="rounded-[26px] border border-white/80 bg-white/90 p-4 shadow-[0_14px_32px_rgba(37,99,235,0.09)]">
            <h2 className="text-lg font-black">{text.receivedApplications}</h2>
            <div className="mt-3 grid gap-2">
              {requestApplications.length === 0 ? (
                <p className="rounded-2xl bg-blue-50/70 p-3 text-xs font-bold text-slate-500 ring-1 ring-blue-100">{text.noApplications}</p>
              ) : (
                requestApplications.map((application) => (
                  <article className="rounded-2xl bg-blue-50/70 p-3 text-xs font-bold leading-5 text-slate-600 ring-1 ring-blue-100" key={application.id}>
                    <AccountBadge avatar={application.applicantAvatar} id={application.applicantProfileId || application.applicantId} idLabel={text.idLabel} label={application.createdAt} name={application.applicantName} />
                    <p className="mt-1 text-[#2563EB]">{text.status}: {getLifeHelperApplicationStatusLabel(application.status, language)}</p>
                    <p className="mt-1">{application.message}</p>
                    <p className="mt-1 text-[#2563EB]">{text.contact}: {application.contact}</p>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <button className="inline-flex h-9 items-center justify-center gap-1 rounded-full bg-[#2563EB] px-3 text-xs font-black text-white disabled:bg-slate-300" disabled={application.status === "accepted"} onClick={() => updateApplicationStatus(application.id, "accepted")} type="button">
                        <CheckCircle2 className="h-4 w-4" />
                        {text.accept}
                      </button>
                      <button className="inline-flex h-9 items-center justify-center gap-1 rounded-full border border-rose-200 bg-white px-3 text-xs font-black text-rose-700 disabled:text-slate-400" disabled={application.status === "declined"} onClick={() => updateApplicationStatus(application.id, "declined")} type="button">
                        <XCircle className="h-4 w-4" />
                        {text.decline}
                      </button>
                    </div>
                  </article>
                ))
              )}
            </div>
          </section>
        ) : null}

        <SafetyNotice text={text} />
      </div>

      <div className="fixed inset-x-4 bottom-[calc(env(safe-area-inset-bottom)+5.85rem)] z-40 mx-auto max-w-[398px] rounded-[24px] border border-white/80 bg-white/95 p-3 shadow-[0_14px_34px_rgba(15,76,129,0.14)] backdrop-blur">
        <button className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#2563EB] text-sm font-black text-white shadow-[0_16px_30px_rgba(37,99,235,0.24)] disabled:bg-slate-300" disabled={mine || Boolean(myApplication) || request.status !== "open"} onClick={openApplicationForm} type="button">
          <UserRoundCheck className="h-4 w-4" />
          {mine ? text.ownButton : request.status !== "open" ? text.closedButton : myApplication ? text.appliedButton(getLifeHelperApplicationStatusLabel(myApplication.status, language)) : text.canHelp}
        </button>
      </div>
    </main>
  );
}

function Header({ text }: { text: DetailText }) {
  return (
    <div className="flex items-center justify-between">
      <Link className="inline-flex h-9 items-center gap-2 rounded-full bg-white/85 px-4 text-sm font-black text-[#2563EB] shadow-sm ring-1 ring-blue-100" href="/life-helper">
        <ArrowLeft className="h-4 w-4" />
        {text.back}
      </Link>
      <span className="inline-flex items-center gap-1 rounded-full bg-white/85 px-4 py-2 text-xs font-black text-[#2563EB] shadow-sm ring-1 ring-blue-100">
        <Handshake className="h-3.5 w-3.5" />
        {text.badge}
      </span>
    </div>
  );
}

function InfoPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-2xl bg-blue-50/80 px-3 py-2 ring-1 ring-blue-100">
      <p className="text-[10px] text-slate-500">{label}</p>
      <p className="truncate">{value}</p>
    </div>
  );
}

function AccountBadge({ avatar, id, idLabel, label, name }: { avatar?: string; id: string; idLabel: string; label: string; name: string }) {
  return (
    <div className="flex min-w-0 items-center gap-3 rounded-2xl bg-blue-50/70 px-3 py-2 ring-1 ring-blue-100">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-[#2563EB] ring-1 ring-blue-100" style={{ background: getAvatarBackground(avatar) }}>
        {isImageAvatar(avatar) ? null : <UserRoundCheck className="h-5 w-5" />}
      </span>
      <span className="min-w-0">
        <span className="block text-[10px] font-black text-slate-500">{label}</span>
        <span className="block truncate text-sm font-black text-slate-900">{name}</span>
        <span className="block truncate text-[11px] font-bold text-[#2563EB]">{idLabel}: {id}</span>
      </span>
    </div>
  );
}

function getAvatarBackground(avatar?: string): CSSProperties["background"] {
  if (!avatar) return "linear-gradient(135deg,#dbeafe,#ffffff,#e0f2fe)";
  if (avatar.startsWith("linear-gradient")) return avatar;
  return `center / cover no-repeat url("${avatar}")`;
}

function isImageAvatar(avatar?: string) {
  return Boolean(avatar && !avatar.startsWith("linear-gradient"));
}

function TextInput({ label, onChange, placeholder, value }: { label: string; onChange: (value: string) => void; placeholder: string; value: string }) {
  return (
    <label className="grid gap-1.5">
      <span className="text-xs font-black text-slate-500">{label}</span>
      <input className="h-11 min-w-0 rounded-2xl border border-blue-100 bg-white px-4 text-sm font-bold outline-none focus:border-blue-400" onChange={(event) => onChange(event.target.value)} placeholder={placeholder} value={value} />
    </label>
  );
}

function SafetyNotice({ compact = false, text }: { compact?: boolean; text: DetailText }) {
  return (
    <section className={`${compact ? "rounded-2xl bg-white/85 p-3" : "rounded-[26px] border border-blue-100 bg-white/85 p-4 shadow-[0_14px_32px_rgba(37,99,235,0.08)]"} text-xs font-bold leading-5 text-slate-600`}>
      <div className="flex items-center gap-2 text-sm font-black text-[#1D4ED8]">
        <ShieldCheck className="h-5 w-5" />
        {text.safetyTitle}
      </div>
      <ul className="mt-3 space-y-2">
        {text.safetyItems.map((item) => (
          <li className="flex gap-2" key={item}>
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#2563EB]" />
            {item}
          </li>
        ))}
        <li className="flex gap-2"><Info className="mt-0.5 h-4 w-4 shrink-0 text-[#2563EB]" />{text.safetyPlatform}</li>
      </ul>
    </section>
  );
}
