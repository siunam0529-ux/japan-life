"use client";

import type { User } from "@supabase/supabase-js";
import { ArrowLeft, CheckCircle2, ClipboardList, Copy, Eye, Handshake, Info, MapPin, MessageCircle, Plus, ShieldCheck, Sparkles, UserRoundCheck, XCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { CSSProperties, FormEvent } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { clearLifeHelperPreloadCache, getCachedLifeHelperData, warmLifeHelperData } from "@/lib/appPreload";
import { useLanguage } from "@/hooks/useLanguage";
import { createLifeHelperRequest, fetchLifeHelperApplications, updateLifeHelperApplicationStatus, updateLifeHelperRequestStatus, type LifeHelperProvider } from "@/lib/lifeHelper/api";
import { getLifeHelperLanguageLabel, getLifeHelperPersonalServiceLabel, getLifeHelperServiceLanguageTagLabel, lifeHelperServiceLanguageTags, type LifeHelperServiceLanguageTag } from "@/lib/lifeHelper/join";
import { getContactVisibilityLabel, getLifeHelperApplicationStatusLabel, getLifeHelperCategoryLabel, lifeHelperCategories, type LifeHelperApplication, type LifeHelperApplicationStatus, type LifeHelperCategory, type LifeHelperContactVisibility, type LifeHelperRequest, type LifeHelperRequestStatus } from "@/lib/lifeHelper/types";
import { getOrCreateConversation } from "@/lib/messages/api";
import { withBackFrom } from "@/lib/navigation/back";
import { supabase } from "@/lib/supabase";
import type { Language } from "@/lib/i18n/translations";

type LifeHelperTab = "all" | "mine" | "applied";
type CategoryFilter = "all" | LifeHelperCategory;
type ProviderFilter = "all" | "business" | "helper";
type ProviderLanguageFilter = "all" | LifeHelperServiceLanguageTag;
type LifeHelperList = "requests" | "providers";

const initialForm = {
  area: "",
  budget: "",
  category: "cleaning" as LifeHelperCategory,
  contact: "",
  contactVisibility: "after_apply" as LifeHelperContactVisibility,
  description: "",
  preferredTime: "",
  title: "",
};

const zhCnLifeHelperCopy = {
  back: "返回",
  eyebrow: "生活帮手",
  title: "生活帮手",
  subtitle: "找附近的人帮你处理生活小事",
  intro: "这里是附近个人生活服务匹配，不是店铺列表。发布、申请和入驻数据会同步到线上；接受申请后会自动进入 App 私信。",
  providerJoin: "成为帮手",
  providerJoinDesc: "商家和个人都可以申请提供生活服务。",
  apply: "去申请",
  manageEyebrow: "管理",
  manageTitle: "管理发布需求和服务",
  manageDesc: "查看我的需求、申请记录和服务入驻状态。",
  enter: "进入",
  requestEyebrow: "生活帮手",
  requestList: "需求列表",
  requestHint: "找人帮忙 / 我来帮忙",
  providersEyebrow: "已入驻服务者",
  providers: "商家 / 帮手",
  providersHint: "已入驻服务者",
  publishRequest: "发布需求",
  allRequests: "全部需求",
  mine: "我发布的",
  applied: "我申请的",
  all: "全部",
  loginFirst: "请先登录后再使用生活帮手功能。",
  loginAction: "去登录",
  requestPublished: "需求已发布。",
  requestPublishFailed: "需求发布失败。",
  acceptedMessage: "已接受这条申请，系统已自动发送 App 私信。",
  declinedMessage: "已拒绝这条申请。",
  applicationUpdateFailed: "申请状态更新失败。",
  closedMessage: "需求已关闭。",
  reopenedMessage: "需求已重新开放。",
  requestUpdateFailed: "需求状态更新失败。",
  copiedContact: "联系方式已复制。",
  contactPrefix: "联系方式",
  messageProvider: "站内私信",
  messageProviderFailed: "暂时无法打开私信。",
  formTitle: "发布一个生活帮忙需求",
  titleLabel: "标题",
  titlePlaceholder: "例如：帮忙搬两个纸箱",
  category: "分类",
  area: "地区",
  areaPlaceholder: "地区 / 车站",
  preferredTime: "希望时间",
  preferredTimePlaceholder: "今天傍晚",
  budget: "预算",
  budgetPlaceholder: "2,000日元 / 面议",
  detail: "详细说明",
  detailPlaceholder: "要做什么、多久、有没有注意事项",
  contactVisibility: "联系方式可见范围",
  contact: "联系方式",
  contactPlaceholder: "微信 / LINE ID / 邮箱 / 电话 / 其他",
  loading: "正在读取生活帮手数据...",
  ownLoginEmpty: "请先登录后再查看自己的发布和申请。",
  emptyRequests: "这里暂时没有符合条件的需求，可以换个分类看看，或发布一个新的需求。",
  recruiting: "招募中",
  closed: "已关闭",
  author: "发布者",
  time: "时间",
  createdAt: "发布时间",
  viewDetail: "查看详情",
  viewApplications: "查看申请",
  alreadyApplied: "已申请",
  canHelp: "我可以帮忙",
  closeRequest: "关闭需求",
  reopenRequest: "重新开放",
  receivedApplications: (count: number) => "收到 " + count + " 个申请",
  noApplications: "还没有人申请这个需求。",
  status: "状态",
  accept: "接受",
  decline: "拒绝",
  approvedProviders: "已入驻服务者",
  business: "商家",
  helper: "个人帮手",
  allLanguages: "全部语言",
  noProviders: "暂时没有已通过的服务者。待审核和已拒绝申请不会公开展示。",
  approved: "已通过",
  providerAccount: "入驻账号",
  language: "语言",
  price: "价格",
  needsConfirm: "需确认",
  safetyTitle: "隐私和安全提示",
  safetyItems: ["请不要提前支付大额费用。", "见面建议选择公共场所。", "涉及宠物、钥匙、房间进入等事项，请提前确认身份和细节。", "平台仅提供信息匹配，请自行判断风险。"],
} as const;

const zhTwLifeHelperCopy = {
  ...zhCnLifeHelperCopy,
  eyebrow: "生活幫手",
  title: "生活幫手",
  subtitle: "找附近的人幫你處理生活小事",
  intro: "這裡是附近個人生活服務配對，不是店鋪列表。發布、申請和入駐資料會同步到線上；接受申請後會自動進入 App 私訊。",
  providerJoin: "成為幫手",
  providerJoinDesc: "商家和個人都可以申請提供生活服務。",
  apply: "去申請",
  manageTitle: "管理發布需求和服務",
  manageDesc: "查看我的需求、申請記錄和服務入駐狀態。",
  enter: "進入",
  requestEyebrow: "生活幫手",
  requestHint: "找人幫忙 / 我來幫忙",
  providers: "商家 / 幫手",
  providersHint: "已入駐服務者",
  publishRequest: "發布需求",
  allRequests: "全部需求",
  mine: "我發布的",
  applied: "我申請的",
  loginFirst: "請先登入後再使用生活幫手功能。",
  loginAction: "去登入",
  requestPublished: "需求已發布。",
  requestPublishFailed: "需求發布失敗。",
  acceptedMessage: "已接受這條申請，系統已自動發送 App 私訊。",
  declinedMessage: "已拒絕這條申請。",
  applicationUpdateFailed: "申請狀態更新失敗。",
  closedMessage: "需求已關閉。",
  reopenedMessage: "需求已重新開放。",
  requestUpdateFailed: "需求狀態更新失敗。",
  copiedContact: "聯絡方式已複製。",
  contactPrefix: "聯絡方式",
  messageProvider: "站內私訊",
  messageProviderFailed: "暫時無法開啟私訊。",
  formTitle: "發布一個生活幫忙需求",
  titleLabel: "標題",
  titlePlaceholder: "例如：幫忙搬兩個紙箱",
  category: "分類",
  area: "地區",
  areaPlaceholder: "地區 / 車站",
  preferredTime: "希望時間",
  preferredTimePlaceholder: "今天傍晚",
  budget: "預算",
  budgetPlaceholder: "2,000日圓 / 面議",
  detail: "詳細說明",
  detailPlaceholder: "要做什麼、多久、有沒有注意事項",
  contactVisibility: "聯絡方式可見範圍",
  contact: "聯絡方式",
  contactPlaceholder: "微信 / LINE ID / 信箱 / 電話 / 其他",
  loading: "正在讀取生活幫手資料...",
  ownLoginEmpty: "請先登入後再查看自己的發布和申請。",
  emptyRequests: "這裡暫時沒有符合條件的需求，可以換個分類看看，或發布一個新的需求。",
  closed: "已關閉",
  author: "發布者",
  createdAt: "發布時間",
  viewDetail: "查看詳情",
  viewApplications: "查看申請",
  alreadyApplied: "已申請",
  canHelp: "我可以幫忙",
  closeRequest: "關閉需求",
  reopenRequest: "重新開放",
  receivedApplications: (count: number) => "收到 " + count + " 個申請",
  noApplications: "還沒有人申請這個需求。",
  status: "狀態",
  decline: "拒絕",
  approvedProviders: "已入駐服務者",
  helper: "個人幫手",
  allLanguages: "全部語言",
  noProviders: "暫時沒有已通過的服務者。待審核和已拒絕申請不會公開展示。",
  approved: "已通過",
  providerAccount: "入駐帳號",
  language: "語言",
  price: "價格",
  safetyTitle: "隱私和安全提示",
  safetyItems: ["請不要提前支付大額費用。", "見面建議選擇公共場所。", "涉及寵物、鑰匙、房間進入等事項，請提前確認身份和細節。", "平台僅提供資訊配對，請自行判斷風險。"],
} as const;

const jaLifeHelperCopy = {
  ...zhCnLifeHelperCopy,
  back: "戻る",
  eyebrow: "暮らしサポート",
  title: "暮らしサポート",
  subtitle: "近くの人に暮らしの小さな用事を頼めます",
  intro: "近くの個人サポートを探すためのマッチングです。店舗リストではありません。投稿、応募、登録データはオンラインに同期され、応募を承認すると App 内メッセージに進みます。",
  providerJoin: "サポーター登録",
  providerJoinDesc: "事業者も個人も生活サポートの提供を申請できます。",
  apply: "申請する",
  manageEyebrow: "管理",
  manageTitle: "依頼とサービスを管理",
  manageDesc: "自分の依頼、応募履歴、サービス登録状況を確認できます。",
  enter: "開く",
  requestEyebrow: "暮らしサポート",
  requestList: "依頼一覧",
  requestHint: "依頼する / 手伝う",
  providersEyebrow: "登録済みサポーター",
  providers: "事業者 / サポーター",
  providersHint: "承認済みの提供者",
  publishRequest: "依頼を投稿",
  allRequests: "すべての依頼",
  mine: "自分の投稿",
  applied: "応募済み",
  all: "すべて",
  loginFirst: "暮らしサポートを使うには先にログインしてください。",
  loginAction: "ログイン",
  requestPublished: "依頼を投稿しました。",
  requestPublishFailed: "依頼の投稿に失敗しました。",
  acceptedMessage: "この応募を承認しました。App 内メッセージを自動送信しました。",
  declinedMessage: "この応募を拒否しました。",
  applicationUpdateFailed: "応募ステータスの更新に失敗しました。",
  closedMessage: "依頼を締め切りました。",
  reopenedMessage: "依頼を再開しました。",
  requestUpdateFailed: "依頼ステータスの更新に失敗しました。",
  copiedContact: "連絡先をコピーしました。",
  contactPrefix: "連絡先",
  messageProvider: "メッセージ",
  messageProviderFailed: "メッセージを開けませんでした。",
  formTitle: "暮らしの手伝い依頼を投稿",
  titleLabel: "タイトル",
  titlePlaceholder: "例：段ボールを2箱運んでほしい",
  category: "カテゴリ",
  area: "エリア",
  areaPlaceholder: "エリア / 駅名",
  preferredTime: "希望日時",
  preferredTimePlaceholder: "今日の夕方",
  budget: "予算",
  budgetPlaceholder: "2,000円 / 相談",
  detail: "詳細",
  detailPlaceholder: "内容、所要時間、注意点など",
  contactVisibility: "連絡先の表示範囲",
  contact: "連絡先",
  contactPlaceholder: "WeChat / LINE ID / メール / 電話 / その他",
  loading: "暮らしサポートのデータを読み込んでいます...",
  ownLoginEmpty: "自分の投稿と応募を見るにはログインしてください。",
  emptyRequests: "条件に合う依頼はまだありません。カテゴリを変えるか、新しい依頼を投稿できます。",
  recruiting: "募集中",
  closed: "締切済み",
  author: "投稿者",
  time: "時間",
  createdAt: "投稿日時",
  viewDetail: "詳細を見る",
  viewApplications: "応募を見る",
  alreadyApplied: "応募済み",
  canHelp: "手伝えます",
  closeRequest: "依頼を締切",
  reopenRequest: "再開する",
  receivedApplications: (count: number) => count + "件の応募",
  noApplications: "この依頼への応募はまだありません。",
  status: "ステータス",
  accept: "承認",
  decline: "拒否",
  approvedProviders: "承認済みサポーター",
  business: "事業者",
  helper: "個人サポーター",
  allLanguages: "すべての言語",
  noProviders: "承認済みの提供者はまだありません。審査中または拒否済みの申請は公開されません。",
  approved: "承認済み",
  providerAccount: "登録アカウント",
  language: "言語",
  price: "料金",
  needsConfirm: "要確認",
  safetyTitle: "プライバシーと安全の注意",
  safetyItems: ["高額な費用を事前に支払わないでください。", "会う場合は公共の場所をおすすめします。", "ペット、鍵、室内への立ち入りなどは、事前に本人確認と詳細確認をしてください。", "プラットフォームは情報マッチングのみ提供します。リスクはご自身で判断してください。"],
} as const;

const copy = {
  "zh-CN": zhCnLifeHelperCopy,
  "zh-TW": zhTwLifeHelperCopy,
  ja: jaLifeHelperCopy,
} as const;

function requestMatchesCategory(request: LifeHelperRequest, category: CategoryFilter) {
  return category === "all" || request.category === category;
}

export default function LifeHelperPage() {
  const { language } = useLanguage();
  const router = useRouter();
  const text = copy[language];
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>("all");
  const [activeList, setActiveList] = useState<LifeHelperList>("requests");
  const [activeTab, setActiveTab] = useState<LifeHelperTab>("all");
  const [applications, setApplications] = useState<LifeHelperApplication[]>([]);
  const [expandedRequestId, setExpandedRequestId] = useState("");
  const [form, setForm] = useState(initialForm);
  const [formOpen, setFormOpen] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [message, setMessage] = useState("");
  const [requests, setRequests] = useState<LifeHelperRequest[]>([]);
  const [providers, setProviders] = useState<LifeHelperProvider[]>([]);
  const [providerFilter, setProviderFilter] = useState<ProviderFilter>("all");
  const [providerLanguageFilter, setProviderLanguageFilter] = useState<ProviderLanguageFilter>("all");
  const [providerMessage, setProviderMessage] = useState("");
  const [user, setUser] = useState<User | null>(null);

  const loadLifeHelperData = useCallback(async () => {
    if (!getCachedLifeHelperData()) setLoadingData(true);
    setMessage("");
    try {
      const nextData = await warmLifeHelperData();
      setRequests(nextData.requests);
      setApplications(nextData.applications);
      setProviders(nextData.providers);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : text.requestUpdateFailed);
    } finally {
      setLoadingData(false);
    }
  }, [text.requestUpdateFailed]);

  useEffect(() => {
    const cached = getCachedLifeHelperData();
    if (cached) {
      setRequests(cached.requests);
      setApplications(cached.applications);
      setProviders(cached.providers);
      setLoadingData(false);
    }
    void loadLifeHelperData();
    if (!supabase) return;

    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (mounted) setUser(data.session?.user ?? null);
      if (mounted && data.session?.user) void loadLifeHelperApplications();
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setUser(session?.user ?? null);
      void loadLifeHelperApplications();
    });
    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, [loadLifeHelperData]);

  async function loadLifeHelperApplications() {
    try {
      setApplications(await fetchLifeHelperApplications());
    } catch {
      setApplications([]);
    }
  }

  const allRequests = requests;
  const userId = user?.id ?? "";
  const appliedRequestIds = useMemo(() => new Set(applications.filter((application) => application.applicantId === userId).map((application) => application.requestId)), [applications, userId]);

  const visibleProviders = useMemo(() => {
    return providers.filter((item) => {
      const matchesType = providerFilter === "all" || item.kind === providerFilter;
      const matchesLanguage = providerLanguageFilter === "all" || item.serviceLanguageTag === providerLanguageFilter;
      return matchesType && matchesLanguage;
    });
  }, [providerFilter, providerLanguageFilter, providers]);

  const visibleRequests = useMemo(() => {
    let list = allRequests;
    if (activeTab === "mine") list = userId ? list.filter((request) => request.authorId === userId) : [];
    if (activeTab === "applied") list = userId ? list.filter((request) => appliedRequestIds.has(request.id)) : [];
    return list.filter((request) => requestMatchesCategory(request, activeCategory));
  }, [activeCategory, activeTab, allRequests, appliedRequestIds, userId]);

  const canSubmit =
    form.title.trim() &&
    form.area.trim() &&
    form.preferredTime.trim() &&
    (form.contactVisibility === "private" || form.contact.trim());

  function openPublishForm() {
    if (!user) {
      setMessage(text.loginFirst);
      return;
    }
    setMessage("");
    setFormOpen((value) => !value);
  }

  async function submitRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) {
      setMessage(text.loginFirst);
      return;
    }
    if (!canSubmit) return;

    try {
      const nextRequest = await createLifeHelperRequest({
        area: form.area.trim(),
        budget: form.budget.trim(),
        category: form.category,
        contact: form.contact.trim(),
        contactVisibility: form.contactVisibility,
        description: form.description.trim(),
        preferredTime: form.preferredTime.trim(),
        title: form.title.trim(),
      });
      setRequests((current) => [nextRequest, ...current.filter((request) => request.id !== nextRequest.id)]);
      clearLifeHelperPreloadCache();
      setActiveList("requests");
      setActiveTab("mine");
      setForm(initialForm);
      setFormOpen(false);
      setMessage(text.requestPublished);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : text.requestPublishFailed);
    }
  }

  async function updateApplicationStatus(applicationId: string, status: LifeHelperApplicationStatus) {
    try {
      const updated = await updateLifeHelperApplicationStatus(applicationId, status);
      setApplications((current) => current.map((application) => application.id === updated.id ? updated : application));
      clearLifeHelperPreloadCache();
      setMessage(status === "accepted" ? text.acceptedMessage : text.declinedMessage);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : text.applicationUpdateFailed);
    }
  }

  async function updateRequestStatus(requestId: string, status: LifeHelperRequestStatus) {
    try {
      const updated = await updateLifeHelperRequestStatus(requestId, status);
      setRequests((current) => current.map((request) => request.id === updated.id ? updated : request));
      clearLifeHelperPreloadCache();
      setMessage(status === "closed" ? text.closedMessage : text.reopenedMessage);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : text.requestUpdateFailed);
    }
  }

  async function copyProviderContact(contact: string) {
    try {
      await navigator.clipboard.writeText(contact);
      setProviderMessage(text.copiedContact);
    } catch {
      setProviderMessage(`${text.contactPrefix}: ${contact}`);
    }
  }

  async function messageProvider(provider: LifeHelperProvider) {
    const result = await getOrCreateConversation(provider.userId, provider.name);
    if (!result.data) {
      setProviderMessage(result.error || text.messageProviderFailed);
      return;
    }
    router.push(`/messages/${result.data.id}`);
  }

  return (
    <main className="jl-tool-theme min-h-screen text-[#061a3a]">
      <div className="jl-tool-shell mx-auto flex min-h-screen w-full max-w-[430px] flex-col gap-4 px-4 pb-28 pt-5">
        <div className="flex items-center justify-between">
          <Link className="inline-flex h-9 items-center gap-2 rounded-full bg-white/85 px-4 text-sm font-black text-[#2563EB] shadow-sm ring-1 ring-blue-100" href="/">
            <ArrowLeft className="h-4 w-4" />
            {text.back}
          </Link>
          <span className="rounded-full bg-white/85 px-4 py-2 text-xs font-black text-[#2563EB] shadow-sm ring-1 ring-blue-100">Japan Life</span>
        </div>

        <section className="rounded-[28px] border border-white/80 bg-white/85 p-5 shadow-[0_18px_40px_rgba(37,99,235,0.12)] backdrop-blur">
          <div className="flex items-start gap-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/80 text-[#2563EB] shadow-sm ring-1 ring-blue-100">
              <Handshake className="h-6 w-6" />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-black text-[#2563EB]">{text.eyebrow}</p>
              <h1 className="mt-1 text-2xl font-black leading-tight">{text.title}</h1>
              <p className="mt-2 text-sm font-bold leading-6 text-slate-600">{text.subtitle}</p>
            </div>
          </div>
          <div className="mt-4 rounded-2xl bg-blue-50/80 p-3 text-xs font-bold leading-5 text-slate-700 ring-1 ring-blue-100">
            {text.intro}
          </div>
        </section>

        <Link className="flex items-center justify-between gap-3 rounded-[26px] border border-blue-100 bg-white/90 p-4 shadow-[0_14px_32px_rgba(37,99,235,0.1)] backdrop-blur transition active:scale-[0.99]" href="/life-helper/manage">
          <span className="flex min-w-0 items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-50 text-[#2563EB] ring-1 ring-blue-100">
              <ClipboardList className="h-5 w-5" />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-black text-[#2563EB]">{text.manageEyebrow}</span>
              <span className="mt-1 block text-lg font-black text-[#061a3a]">{text.manageTitle}</span>
              <span className="mt-1 block text-xs font-bold leading-5 text-slate-600">{text.manageDesc}</span>
            </span>
          </span>
          <span className="shrink-0 rounded-full bg-blue-50 px-3 py-2 text-xs font-black text-[#2563EB] ring-1 ring-blue-200">{text.enter}</span>
        </Link>

        <section className="rounded-[26px] border border-white/80 bg-white/88 p-2 shadow-[0_14px_32px_rgba(37,99,235,0.09)] backdrop-blur">
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: "requests" as const, label: text.requestList, hint: text.requestHint },
              { id: "providers" as const, label: text.providers, hint: text.providersHint },
            ].map((item) => (
              <button
                className={`rounded-[22px] px-3 py-3 text-left transition ${activeList === item.id ? "bg-[#2563EB] text-white shadow-[0_12px_24px_rgba(37,99,235,0.22)]" : "bg-white/80 text-slate-700 ring-1 ring-blue-100"}`}
                key={item.id}
                onClick={() => setActiveList(item.id)}
                type="button"
              >
                <span className="block text-sm font-black">{item.label}</span>
                <span className={`mt-1 block text-[11px] font-bold leading-4 ${activeList === item.id ? "text-blue-50" : "text-slate-500"}`}>{item.hint}</span>
              </button>
            ))}
          </div>
        </section>

        {activeList === "requests" ? (
          <>
        <section className="rounded-[26px] border border-white/80 bg-white/85 p-4 shadow-[0_14px_32px_rgba(37,99,235,0.1)] backdrop-blur">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black text-[#2563EB]">{text.requestEyebrow}</p>
              <h2 className="text-lg font-black">{text.requestList}</h2>
            </div>
            <button className="inline-flex h-12 shrink-0 items-center gap-2 rounded-full bg-[#2563EB] px-5 text-[15px] font-black text-white shadow-[0_14px_26px_rgba(37,99,235,0.24)] transition active:scale-95" onClick={openPublishForm} type="button">
              <Plus className="h-5 w-5" />
              {text.publishRequest}
            </button>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2 rounded-2xl bg-blue-50/70 p-1">
            {[
              { id: "all" as const, label: text.allRequests },
              { id: "mine" as const, label: text.mine },
              { id: "applied" as const, label: text.applied },
            ].map((tab) => (
              <button className={`rounded-xl px-2 py-2 text-xs font-black ${activeTab === tab.id ? "bg-[#2563EB] text-white shadow-sm" : "text-slate-600"}`} key={tab.id} onClick={() => setActiveTab(tab.id)} type="button">
                {tab.label}
              </button>
            ))}
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2">
            <CategoryButton active={activeCategory === "all"} label={text.all} onClick={() => setActiveCategory("all")} />
            {lifeHelperCategories.map((category) => (
              <CategoryButton active={activeCategory === category.id} key={category.id} label={getLifeHelperCategoryLabel(category.id, language)} onClick={() => setActiveCategory(category.id)} />
            ))}
          </div>

          {message ? (
            <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50 px-3 py-2 text-xs font-black leading-5 text-[#1D4ED8]">
              {message} {!user ? <Link className="underline" href={withBackFrom("/login?next=/life-helper")}>{text.loginAction}</Link> : null}
            </div>
          ) : null}

          {formOpen ? (
            <form className="mt-4 rounded-3xl border border-blue-100 bg-blue-50/75 p-4" onSubmit={submitRequest}>
              <div className="flex items-center gap-2 text-sm font-black text-[#1D4ED8]">
                <ClipboardList className="h-4 w-4" />
                {text.formTitle}
              </div>
              <div className="mt-3 grid gap-3">
                <TextInput label={text.titleLabel} onChange={(value) => setForm((current) => ({ ...current, title: value }))} placeholder={text.titlePlaceholder} value={form.title} />
                <label className="grid gap-1.5">
                  <span className="text-xs font-black text-slate-500">{text.category}</span>
                  <select className="h-11 rounded-2xl border border-blue-100 bg-white px-4 text-sm font-bold outline-none focus:border-blue-400" onChange={(event) => setForm((current) => ({ ...current, category: event.target.value as LifeHelperCategory }))} value={form.category}>
                    {lifeHelperCategories.map((category) => <option key={category.id} value={category.id}>{getLifeHelperCategoryLabel(category.id, language)}</option>)}
                  </select>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <TextInput label={text.area} onChange={(value) => setForm((current) => ({ ...current, area: value }))} placeholder={text.areaPlaceholder} value={form.area} />
                  <TextInput label={text.preferredTime} onChange={(value) => setForm((current) => ({ ...current, preferredTime: value }))} placeholder={text.preferredTimePlaceholder} value={form.preferredTime} />
                </div>
                <TextInput label={text.budget} onChange={(value) => setForm((current) => ({ ...current, budget: value }))} placeholder={text.budgetPlaceholder} value={form.budget} />
                <label className="grid gap-1.5">
                  <span className="text-xs font-black text-slate-500">{text.detail}</span>
                  <textarea className="min-h-24 resize-none rounded-2xl border border-blue-100 bg-white px-4 py-3 text-sm font-bold outline-none focus:border-blue-400" onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} placeholder={text.detailPlaceholder} value={form.description} />
                </label>
                <label className="grid gap-1.5">
                  <span className="text-xs font-black text-slate-500">{text.contactVisibility}</span>
                  <select className="h-11 rounded-2xl border border-blue-100 bg-white px-4 text-sm font-bold outline-none focus:border-blue-400" onChange={(event) => setForm((current) => ({ ...current, contactVisibility: event.target.value as LifeHelperContactVisibility }))} value={form.contactVisibility}>
                    <option value="after_apply">{getContactVisibilityLabel("after_apply", language)}</option>
                    <option value="public">{getContactVisibilityLabel("public", language)}</option>
                    <option value="private">{getContactVisibilityLabel("private", language)}</option>
                  </select>
                </label>
                <TextInput label={text.contact} onChange={(value) => setForm((current) => ({ ...current, contact: value }))} placeholder={text.contactPlaceholder} value={form.contact} />
                <SafetyNotice compact text={text} />
                <button className="h-11 rounded-2xl bg-[#2563EB] text-sm font-black text-white disabled:cursor-not-allowed disabled:bg-slate-300" disabled={!canSubmit} type="submit">
                  {text.publishRequest}
                </button>
              </div>
            </form>
          ) : null}
        </section>

        {loadingData ? (
          <EmptyState body={text.loading} />
        ) : (activeTab === "mine" || activeTab === "applied") && !user ? (
          <EmptyState body={text.ownLoginEmpty} />
        ) : visibleRequests.length === 0 ? (
          <EmptyState body={text.emptyRequests} />
        ) : (
          <section className="grid gap-3">
            {visibleRequests.map((request) => {
              const requestApplications = applications.filter((application) => application.requestId === request.id);
              const mine = request.authorId === userId;
              const applied = appliedRequestIds.has(request.id);
              return (
                <article className="rounded-[26px] border border-white/80 bg-white/90 p-4 shadow-[0_14px_32px_rgba(37,99,235,0.09)] backdrop-blur" key={request.id}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-[#1D4ED8] ring-1 ring-blue-100">{getLifeHelperCategoryLabel(request.category, language)}</span>
                        <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-slate-600 ring-1 ring-blue-100">{request.status === "open" ? text.recruiting : text.closed}</span>
                      </div>
                      <h3 className="mt-3 break-words text-lg font-black leading-6">{request.title}</h3>
                      <p className="mt-2 flex items-center gap-1 text-sm font-black text-[#2563EB]">
                        <MapPin className="h-4 w-4" />
                        {request.area}
                      </p>
                    </div>
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/80 text-[#2563EB] shadow-sm ring-1 ring-blue-100">
                      <Sparkles className="h-5 w-5" />
                    </span>
                  </div>

                  <div className="mt-3">
                    <AccountBadge avatar={request.authorAvatar} id={request.authorProfileId || request.authorId} label={text.author} name={request.authorName} />
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs font-black text-slate-700">
                    <InfoPill label={text.time} value={request.preferredTime} />
                    <InfoPill label={text.budget} value={request.budget} />
                    <InfoPill label={text.createdAt} value={request.createdAt} />
                  </div>
                  <p className="mt-3 line-clamp-3 text-sm font-bold leading-6 text-slate-600">{request.description}</p>

                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <Link className="flex h-11 items-center justify-center gap-2 rounded-2xl bg-[#2563EB] text-sm font-black text-white" href={`/life-helper/${request.id}`}>
                      <Eye className="h-4 w-4" />
                      {text.viewDetail}
                    </Link>
                    {mine ? (
                      <button className="flex h-11 items-center justify-center gap-2 rounded-2xl border border-blue-200 bg-white text-sm font-black text-[#2563EB]" onClick={() => setExpandedRequestId((current) => (current === request.id ? "" : request.id))} type="button">
                        <MessageCircle className="h-4 w-4" />
                        {text.viewApplications}
                      </button>
                    ) : (
                      <Link className="flex h-11 items-center justify-center gap-2 rounded-2xl border border-blue-200 bg-white text-sm font-black text-[#2563EB]" href={`/life-helper/${request.id}`}>
                        <UserRoundCheck className="h-4 w-4" />
                        {applied ? text.alreadyApplied : text.canHelp}
                      </Link>
                    )}
                  </div>

                  {mine ? (
                    <button className="mt-3 h-10 w-full rounded-2xl border border-blue-200 bg-white text-xs font-black text-[#2563EB]" onClick={() => updateRequestStatus(request.id, request.status === "open" ? "closed" : "open")} type="button">
                      {request.status === "open" ? text.closeRequest : text.reopenRequest}
                    </button>
                  ) : null}
                  {mine ? <p className="mt-3 text-xs font-black text-[#2563EB]">{text.receivedApplications(requestApplications.length)}</p> : null}
                  {mine && expandedRequestId === request.id ? (
                    <div className="mt-3 grid gap-2 rounded-2xl bg-blue-50/70 p-3 ring-1 ring-blue-100">
                      {requestApplications.length === 0 ? (
                        <p className="text-xs font-bold text-slate-500">{text.noApplications}</p>
                      ) : (
                        requestApplications.map((application) => (
                          <div className="rounded-2xl bg-white p-3 text-xs font-bold leading-5 text-slate-600 ring-1 ring-blue-100" key={application.id}>
                            <AccountBadge avatar={application.applicantAvatar} id={application.applicantProfileId || application.applicantId} label={application.createdAt} name={application.applicantName} />
                            <p className="mt-1 text-[#2563EB]">{text.status}: {getLifeHelperApplicationStatusLabel(application.status, language)}</p>
                            <p className="mt-1">{application.message}</p>
                            <p className="mt-1 text-[#2563EB]">{text.contactPrefix}: {application.contact}</p>
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
                          </div>
                        ))
                      )}
                    </div>
                  ) : null}
                </article>
              );
            })}
          </section>
        )}
          </>
        ) : null}

        {activeList === "providers" ? (
        <section className="rounded-[26px] border border-white/80 bg-white/88 p-4 shadow-[0_14px_32px_rgba(37,99,235,0.09)] backdrop-blur">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black text-[#2563EB]">{text.providersEyebrow}</p>
              <h2 className="text-lg font-black">{text.approvedProviders}</h2>
            </div>
            <Link className="inline-flex h-12 shrink-0 items-center justify-center rounded-full bg-[#2563EB] px-5 text-[15px] font-black text-white shadow-[0_14px_26px_rgba(37,99,235,0.24)] transition active:scale-95" href="/life-helper/join">
              {text.providerJoin}
            </Link>
          </div>
          {providerMessage ? <p className="mt-3 rounded-2xl bg-blue-50/80 px-3 py-2 text-xs font-black text-[#2563EB] ring-1 ring-blue-100">{providerMessage}</p> : null}
          <div className="mt-3 grid grid-cols-3 gap-2 rounded-2xl bg-blue-50/70 p-1">
            {[
              { id: "all" as const, label: text.all },
              { id: "business" as const, label: text.business },
              { id: "helper" as const, label: text.helper },
            ].map((item) => (
              <button className={`rounded-xl px-2 py-2 text-xs font-black ${providerFilter === item.id ? "bg-[#2563EB] text-white shadow-sm" : "text-slate-600"}`} key={item.id} onClick={() => setProviderFilter(item.id)} type="button">
                {item.label}
              </button>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-2 rounded-2xl bg-blue-50/60 p-2">
            <button className={`rounded-full border px-3 py-2 text-xs font-black ${providerLanguageFilter === "all" ? "border-[#2563EB] bg-[#2563EB] text-white" : "border-blue-100 bg-white text-slate-600"}`} onClick={() => setProviderLanguageFilter("all")} type="button">
              {text.allLanguages}
            </button>
            {lifeHelperServiceLanguageTags.map((tag) => (
              <button className={`rounded-full border px-3 py-2 text-xs font-black ${providerLanguageFilter === tag ? "border-[#2563EB] bg-[#2563EB] text-white" : "border-blue-100 bg-white text-slate-600"}`} key={tag} onClick={() => setProviderLanguageFilter(tag)} type="button">
                {getLifeHelperServiceLanguageTagLabel(tag, language)}
              </button>
            ))}
          </div>
          <div className="mt-3 grid gap-3">
            {visibleProviders.length === 0 ? (
              <p className="rounded-2xl bg-blue-50/80 p-3 text-xs font-bold leading-5 text-slate-500 ring-1 ring-blue-100">{text.noProviders}</p>
            ) : (
              visibleProviders.map((provider) => (
                <article className="rounded-[22px] border border-blue-100 bg-white/90 p-4 shadow-sm" key={`${provider.kind}-${provider.id}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap gap-2">
                        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-[#1D4ED8] ring-1 ring-blue-100">{provider.kind === "business" ? text.business : text.helper}</span>
                        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-[#1D4ED8] ring-1 ring-blue-100">{getLifeHelperServiceLanguageTagLabel(provider.serviceLanguageTag, language)}</span>
                        <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-slate-600 ring-1 ring-blue-100">{text.approved}</span>
                      </div>
                      <h3 className="mt-3 text-lg font-black">{provider.name}</h3>
                      <p className="mt-1 text-xs font-bold text-slate-500">{provider.area}</p>
                    </div>
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/80 text-[#2563EB] shadow-sm ring-1 ring-blue-100">
                      <UserRoundCheck className="h-5 w-5" />
                    </span>
                  </div>
                  <div className="mt-3">
                    <AccountBadge avatar={provider.avatar} id={provider.userProfileId || provider.userId} label={text.providerAccount} name={provider.name} />
                  </div>
                  <p className="mt-3 line-clamp-3 text-sm font-bold leading-6 text-slate-600">{provider.description}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {provider.services.slice(0, 4).map((service) => <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-[#1D4ED8]" key={service}>{getLifeHelperPersonalServiceLabel(service, language)}</span>)}
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs font-black text-slate-700">
                    <InfoPill label={text.language} value={provider.languages.map((item) => getLifeHelperLanguageLabel(item, language)).join(" / ") || text.needsConfirm} />
                    <InfoPill label={text.price} value={provider.price} />
                  </div>
                  <div className="mt-3 grid gap-2">
                    <button className="flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl bg-[#2563EB] px-3 py-2 text-xs font-black text-white shadow-[0_10px_22px_rgba(37,99,235,0.18)]" onClick={() => messageProvider(provider)} type="button">
                      <MessageCircle className="h-4 w-4" />
                      {text.messageProvider}
                    </button>
                    <div className="grid gap-2">
                      {(provider.contactMethods?.length ? provider.contactMethods : [{ id: "contact", type: text.contactPrefix, value: provider.contact }]).map((contact) => (
                        <button className="flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl bg-blue-50/80 px-3 py-2 text-xs font-black text-[#2563EB] ring-1 ring-blue-100" key={contact.id} onClick={() => copyProviderContact(contact.value)} type="button">
                          <Copy className="h-4 w-4" />
                          {contact.type}: {contact.value}
                        </button>
                      ))}
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>
        ) : null}

        <SafetyNotice text={text} />
      </div>
    </main>
  );
}

function CategoryButton({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button aria-pressed={active} className={`min-h-9 rounded-full border px-2 text-xs font-black transition ${active ? "border-[#2563EB] bg-[#2563EB] text-white shadow-[0_8px_18px_rgba(37,99,235,0.18)]" : "border-blue-100 bg-white/80 text-slate-700"}`} onClick={onClick} type="button">
      {label}
    </button>
  );
}

function EmptyState({ body }: { body: string }) {
  return <div className="rounded-[26px] border border-blue-100 bg-white/85 p-5 text-sm font-bold leading-6 text-slate-600 shadow-sm">{body}</div>;
}

function InfoPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-2xl bg-blue-50/80 px-3 py-2 ring-1 ring-blue-100">
      <p className="text-[10px] text-slate-500">{label}</p>
      <p className="truncate">{value}</p>
    </div>
  );
}

function AccountBadge({ avatar, id, label, name }: { avatar?: string; id: string; label: string; name: string }) {
  return (
    <div className="flex min-w-0 items-center gap-3 rounded-2xl bg-blue-50/70 px-3 py-2 ring-1 ring-blue-100">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-[#2563EB] ring-1 ring-blue-100" style={{ background: getAvatarBackground(avatar) }}>
        {isImageAvatar(avatar) ? null : <UserRoundCheck className="h-5 w-5" />}
      </span>
      <span className="min-w-0">
        <span className="block text-[10px] font-black text-slate-500">{label}</span>
        <span className="block truncate text-sm font-black text-slate-900">{name}</span>
        <span className="block truncate text-[11px] font-bold text-[#2563EB]">ID：{id}</span>
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

function SafetyNotice({ compact = false, text }: { compact?: boolean; text: typeof copy[Language] }) {
  return (
    <section className={`${compact ? "rounded-2xl bg-white/85 p-3" : "rounded-[26px] border border-blue-100 bg-white/85 p-4 shadow-[0_14px_32px_rgba(37,99,235,0.08)]"} text-xs font-bold leading-5 text-slate-600`}>
      <div className="flex items-center gap-2 text-sm font-black text-[#1D4ED8]">
        <ShieldCheck className="h-5 w-5" />
        {text.safetyTitle}
      </div>
      <ul className="mt-3 space-y-2">
        {text.safetyItems.map((item, index) => (
          <li className="flex gap-2" key={item}>
            {index === text.safetyItems.length - 1 ? <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#2563EB]" /> : <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#2563EB]" />}
            {item}
          </li>
        ))}
      </ul>
    </section>
  );
}
