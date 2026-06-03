"use client";

import { ArrowLeft, CheckCircle2, ImagePlus, Send, ShieldCheck, X } from "lucide-react";
import Link from "next/link";
import { notFound, useRouter } from "next/navigation";
import type { ChangeEvent, FormEvent, ReactNode } from "react";
import { use, useEffect, useMemo, useRef, useState } from "react";
import { CommunityLoginRequiredCard } from "@/components/community/CommunityLoginRequiredCard";
import { useLanguage } from "@/hooks/useLanguage";
import { createCommunityProfileFromMeProfile, readMeProfile } from "@/lib/account/profile";
import { clearCommunityFeedPreloadCache } from "@/lib/appPreload";
import { communityMaxImages, validateCommunityImage } from "@/lib/community/images";
import { communityLocalUserId, createCommunityId, formatCommunityNow, getCurrentCommunityUser, readCommunityPosts, readCommunityUserProfile, writeCommunityPosts, type CommunityUser } from "@/lib/community/repository";
import { getCommunityLocaleHref } from "@/lib/community/routes";
import { getHotCommunityTopics, parseCommunityTags } from "@/lib/community/topics";
import { hasCommunityRiskKeyword, isCommunityViewLocale, type CommunityLocale, type CommunityPost, type CommunityPostImage, type CommunityPostType, type CommunityUserProfile } from "@/lib/community/types";
import { supabase } from "@/lib/supabase";

type ImagePreview = {
  file: File;
  fileName: string;
  id: string;
  url: string;
};

type FormState = {
  area: string;
  buddyType: string;
  budget: string;
  condition: string;
  content: string;
  helpCategory: string;
  helperCategory: string;
  itemStatus: string;
  people: string;
  pickupMethod: string;
  price: string;
  tags: string;
  time: string;
  title: string;
  type: CommunityPostType;
};

const targetLocale: CommunityLocale = "zh-cn";

const initialForm: FormState = {
  area: "日本",
  buddyType: "",
  budget: "",
  condition: "正常使用",
  content: "",
  helpCategory: "",
  helperCategory: "",
  itemStatus: "出品中",
  people: "",
  pickupMethod: "自取",
  price: "",
  tags: "",
  time: "",
  title: "",
  type: "share",
};

const postTypeCards: { id: CommunityPostType }[] = [
  { id: "share" },
  { id: "help" },
  { id: "secondhand" },
  { id: "buddy" },
  { id: "helper" },
];

const conditionOptions = ["全新", "较新", "正常使用", "有使用感", "需要维修"];
const pickupMethodOptions = ["自取", "可面交", "可邮寄商量"];
const itemStatusOptions = ["出品中", "已预约", "已出"];
const buddyTypeOptions = ["饭搭子", "散步搭子", "学习搭子", "语言交换", "拍照搭子", "看展搭子", "运动搭子", "周末出门"];
const helperCategoryOptions = ["清洁打扫", "搬运帮忙", "宠物照顾", "跑腿代办", "手续陪同", "翻译陪同", "家具组装", "陪去医院", "其他帮忙"];
const helpCategoryOptions = ["手续签证", "租房搬家", "打工职场", "医院药妆", "学校留学", "宠物生活", "生活账单", "其他求助"];
const placeholderColors = ["pink-blue", "sky-mint", "violet-sky", "amber-pink", "teal-blue", "rose-indigo"];
const communitySafetyDisclaimer = "Japan Life 仅提供信息发布与联系服务，不参与付款、配送、交易或服务履行。线下见面请优先选择公共场所，不要提前转账，不要透露证件、住址、银行卡等敏感信息。";

const newPostCopy = {
  "zh-CN": {
    back: "返回",
    badge: "生活社区",
    maxImages: "最多只能添加 6 张图片",
    loginFirst: "请先登录",
    submitFail: "提交失败，请稍后再试。",
    pendingMessage: "内容已提交，等待审核后显示。",
    publishSuccess: "发布成功",
    publishFail: "发布失败，请稍后再试。",
    uploadLogin: "请先登录后再上传图片。",
    uploadFail: "图片上传失败，请稍后再试。",
    title: "标题",
    content: "内容",
    publishType: "发布类型",
    cover: "封面",
    removeImage: "删除图片",
    submitting: "发布中...",
    publish: "发布",
    postTypes: { share: "生活", help: "求助", secondhand: "闲置", buddy: "搭子", helper: "帮忙" },
    titlePlaceholders: {
      buddy: "你想找什么搭子？",
      help: "简单说一下你遇到的问题",
      helper: "你需要别人帮什么？",
      secondhand: "填写物品名称",
      share: "给你的分享起个标题",
    },
    contentPlaceholders: {
      buddy: "写清楚想约的时间、地点、人数和希望一起做什么。",
      help: "把背景、已经尝试过的方法、卡住的地方写清楚。",
      helper: "说明需要帮忙的内容、时间地点、预算和注意事项。",
      secondhand: "描述物品状态、取货方式、价格和适合谁。",
      share: "分享你的体验、路线、价格、避坑点或推荐理由。",
    },
    price: "价格",
    pricePlaceholder: "例如 1000円 / 免费 / 可商量",
    itemStatus: "交易状态",
    condition: "物品状态",
    pickupMethod: "取货方式",
    secondhandHint: "建议填写价格，方便对方判断是否联系你。",
    buddyType: "搭子类型",
    buddyTypePlaceholder: "请选择搭子类型",
    time: "时间",
    buddyTimePlaceholder: "例如 周六下午 / 平日晚上",
    people: "人数",
    peoplePlaceholder: "例如 1人 / 1-2人 / 不限",
    buddyHint: "建议填写搭子类型，大家更容易看懂你的邀请。",
    helperCategory: "帮忙类型",
    helperCategoryPlaceholder: "请选择帮忙类型",
    budget: "预算",
    budgetPlaceholder: "例如 2000円 / 可商量",
    helperTimePlaceholder: "例如 今天晚上 / 周末 / 平日白天",
    helperHint: "建议填写预算和时间，避免反复沟通。",
    helpCategory: "求助分类",
    helpCategoryPlaceholder: "请选择求助分类",
    helpHint: "求助默认未解决，之后可以继续补充进展。",
    topics: "话题标签",
    topicsPlaceholder: "输入或选择话题，例如 池袋美食、省钱生活",
    topicsHint: "最多选择 5 个话题，会自动去掉 #、空格和重复项。",
    beforePublish: "发布前请确认",
    rules: ["请勿发布违法、诈骗、色情、赌博、虚假招聘等内容", "请勿公开他人个人信息", "闲置、搭子、帮忙等线下联系请自行确认安全"],
    safetyDisclaimer: communitySafetyDisclaimer,
    validateTitle: "请填写标题",
    validateContent: "请填写内容",
    validateType: "请选择发布类型",
    options: {
      condition: ["全新", "较新", "正常使用", "有使用感", "需要维修"],
      pickupMethod: ["自取", "可面交", "可邮寄商量"],
      itemStatus: ["出品中", "已预约", "已出"],
      buddyType: ["饭搭子", "散步搭子", "学习搭子", "语言交换", "拍照搭子", "看展搭子", "运动搭子", "周末出门"],
      helperCategory: ["清洁打扫", "搬运帮忙", "宠物照顾", "跑腿代办", "手续陪同", "翻译陪同", "家具组装", "陪去医院", "其他帮忙"],
      helpCategory: ["手续签证", "租房搬家", "打工职场", "医院药妆", "学校留学", "宠物生活", "生活账单", "其他求助"],
    },
  },
  "zh-TW": {
    back: "返回",
    badge: "生活社群",
    maxImages: "最多只能新增 6 張圖片",
    loginFirst: "請先登入",
    submitFail: "提交失敗，請稍後再試。",
    pendingMessage: "內容已提交，等待審核後顯示。",
    publishSuccess: "發布成功",
    publishFail: "發布失敗，請稍後再試。",
    uploadLogin: "請先登入後再上傳圖片。",
    uploadFail: "圖片上傳失敗，請稍後再試。",
    title: "標題",
    content: "內容",
    publishType: "發布類型",
    cover: "封面",
    removeImage: "刪除圖片",
    submitting: "發布中...",
    publish: "發布",
    postTypes: { share: "生活", help: "求助", secondhand: "閒置", buddy: "搭子", helper: "幫忙" },
    titlePlaceholders: { buddy: "你想找什麼搭子？", help: "簡單說一下你遇到的問題", helper: "你需要別人幫什麼？", secondhand: "填寫物品名稱", share: "給你的分享起個標題" },
    contentPlaceholders: { buddy: "寫清楚想約的時間、地點、人數和希望一起做什麼。", help: "把背景、已經嘗試過的方法、卡住的地方寫清楚。", helper: "說明需要幫忙的內容、時間地點、預算和注意事項。", secondhand: "描述物品狀態、取貨方式、價格和適合誰。", share: "分享你的體驗、路線、價格、避坑點或推薦理由。" },
    price: "價格",
    pricePlaceholder: "例如 1000円 / 免費 / 可商量",
    itemStatus: "交易狀態",
    condition: "物品狀態",
    pickupMethod: "取貨方式",
    secondhandHint: "建議填寫價格，方便對方判斷是否聯絡你。",
    buddyType: "搭子類型",
    buddyTypePlaceholder: "請選擇搭子類型",
    time: "時間",
    buddyTimePlaceholder: "例如 週六下午 / 平日晚上",
    people: "人數",
    peoplePlaceholder: "例如 1人 / 1-2人 / 不限",
    buddyHint: "建議填寫搭子類型，大家更容易看懂你的邀請。",
    helperCategory: "幫忙類型",
    helperCategoryPlaceholder: "請選擇幫忙類型",
    budget: "預算",
    budgetPlaceholder: "例如 2000円 / 可商量",
    helperTimePlaceholder: "例如 今天晚上 / 週末 / 平日白天",
    helperHint: "建議填寫預算和時間，避免反覆溝通。",
    helpCategory: "求助分類",
    helpCategoryPlaceholder: "請選擇求助分類",
    helpHint: "求助預設未解決，之後可以繼續補充進展。",
    topics: "話題標籤",
    topicsPlaceholder: "輸入或選擇話題，例如 池袋美食、省錢生活",
    topicsHint: "最多選擇 5 個話題，會自動去掉 #、空格和重複項。",
    beforePublish: "發布前請確認",
    rules: ["請勿發布違法、詐騙、色情、賭博、虛假招聘等內容", "請勿公開他人個人資訊", "閒置、搭子、幫忙等線下聯繫請自行確認安全"],
    safetyDisclaimer: "Japan Life 僅提供資訊發布與聯絡服務，不參與付款、配送、交易或服務履行。線下見面請優先選擇公共場所，不要提前轉帳，不要透露證件、住址、銀行卡等敏感資訊。",
    validateTitle: "請填寫標題",
    validateContent: "請填寫內容",
    validateType: "請選擇發布類型",
    options: {
      condition: ["全新", "較新", "正常使用", "有使用感", "需要維修"],
      pickupMethod: ["自取", "可面交", "可郵寄商量"],
      itemStatus: ["出品中", "已預約", "已出"],
      buddyType: ["飯搭子", "散步搭子", "學習搭子", "語言交換", "拍照搭子", "看展搭子", "運動搭子", "週末出門"],
      helperCategory: ["清潔打掃", "搬運幫忙", "寵物照顧", "跑腿代辦", "手續陪同", "翻譯陪同", "家具組裝", "陪去醫院", "其他幫忙"],
      helpCategory: ["手續簽證", "租屋搬家", "打工職場", "醫院藥妝", "學校留學", "寵物生活", "生活帳單", "其他求助"],
    },
  },
  ja: {
    back: "戻る",
    badge: "生活コミュニティ",
    maxImages: "画像は最大6枚まで追加できます",
    loginFirst: "ログインしてください",
    submitFail: "送信に失敗しました。しばらくしてからもう一度お試しください。",
    pendingMessage: "投稿を送信しました。審査後に表示されます。",
    publishSuccess: "投稿しました",
    publishFail: "投稿に失敗しました。しばらくしてからもう一度お試しください。",
    uploadLogin: "画像をアップロードするにはログインしてください。",
    uploadFail: "画像のアップロードに失敗しました。しばらくしてからもう一度お試しください。",
    title: "タイトル",
    content: "内容",
    publishType: "投稿タイプ",
    cover: "カバー",
    removeImage: "画像を削除",
    submitting: "投稿中...",
    publish: "投稿",
    postTypes: { share: "生活", help: "相談", secondhand: "譲ります", buddy: "仲間募集", helper: "手伝い" },
    titlePlaceholders: { buddy: "どんな仲間を探していますか？", help: "困っていることを短く書いてください", helper: "何を手伝ってほしいですか？", secondhand: "品名を入力", share: "投稿のタイトルをつけましょう" },
    contentPlaceholders: { buddy: "希望日時、場所、人数、一緒にしたいことを書いてください。", help: "背景、試したこと、困っている点を書いてください。", helper: "手伝ってほしい内容、時間、場所、予算、注意点を書いてください。", secondhand: "状態、受け渡し方法、価格、向いている人を書いてください。", share: "体験、ルート、価格、注意点、おすすめ理由を共有しましょう。" },
    price: "価格",
    pricePlaceholder: "例：1000円 / 無料 / 相談可",
    itemStatus: "取引状況",
    condition: "商品の状態",
    pickupMethod: "受け渡し方法",
    secondhandHint: "価格を書くと、相手が連絡しやすくなります。",
    buddyType: "募集タイプ",
    buddyTypePlaceholder: "募集タイプを選択",
    time: "時間",
    buddyTimePlaceholder: "例：土曜午後 / 平日夜",
    people: "人数",
    peoplePlaceholder: "例：1人 / 1-2人 / 不問",
    buddyHint: "募集タイプを書くと、内容が伝わりやすくなります。",
    helperCategory: "手伝いタイプ",
    helperCategoryPlaceholder: "手伝いタイプを選択",
    budget: "予算",
    budgetPlaceholder: "例：2000円 / 相談可",
    helperTimePlaceholder: "例：今夜 / 週末 / 平日昼",
    helperHint: "予算と時間を書くと、やり取りがスムーズになります。",
    helpCategory: "相談カテゴリ",
    helpCategoryPlaceholder: "相談カテゴリを選択",
    helpHint: "相談は未解決として投稿され、後から進捗を追加できます。",
    topics: "トピックタグ",
    topicsPlaceholder: "入力または選択：池袋グルメ、節約生活など",
    topicsHint: "最大5個まで選択できます。#、空白、重複は自動で整理されます。",
    beforePublish: "投稿前の確認",
    rules: ["違法、詐欺、性的、賭博、虚偽求人などの内容を投稿しないでください", "他人の個人情報を公開しないでください", "譲渡、仲間募集、手伝いなどのオフライン連絡は自分で安全確認してください"],
    safetyDisclaimer: "Japan Life は情報投稿と連絡の場のみ提供し、支払い、配送、取引、サービス履行には関与しません。対面時は公共の場所を優先し、事前送金や身分証、住所、銀行カードなどの機密情報共有は避けてください。",
    validateTitle: "タイトルを入力してください",
    validateContent: "内容を入力してください",
    validateType: "投稿タイプを選択してください",
    options: {
      condition: ["新品", "比較的新しい", "通常使用", "使用感あり", "修理が必要"],
      pickupMethod: ["取りに来てほしい", "手渡し可", "郵送相談可"],
      itemStatus: ["出品中", "予約済み", "譲渡済み"],
      buddyType: ["ごはん仲間", "散歩仲間", "勉強仲間", "言語交換", "写真仲間", "展示仲間", "運動仲間", "週末お出かけ"],
      helperCategory: ["掃除", "運搬", "ペット世話", "代行", "手続き同行", "通訳同行", "家具組立", "病院同行", "その他"],
      helpCategory: ["手続き・ビザ", "賃貸・引越し", "仕事・職場", "病院・薬", "学校・留学", "ペット生活", "生活費・請求", "その他"],
    },
  },
} as const;

type NewPostText = typeof newPostCopy[keyof typeof newPostCopy];

export default function CommunityLocaleNewPage({ params }: { params: Promise<{ locale: string }> }) {
  const { language } = useLanguage();
  const text = newPostCopy[language];
  const { locale: rawLocale } = use(params);
  if (!isCommunityViewLocale(rawLocale)) notFound();

  const router = useRouter();
  const [form, setForm] = useState<FormState>(initialForm);
  const [imagePreviews, setImagePreviews] = useState<ImagePreview[]>([]);
  const [message, setMessage] = useState("");
  const [profileName, setProfileName] = useState("Nam");
  const [currentUser, setCurrentUser] = useState<CommunityUser | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const imagePreviewsRef = useRef<ImagePreview[]>([]);
  const selectedTags = useMemo(() => parseCommunityTags(form.tags), [form.tags]);
  const suggestedTopics = getHotCommunityTopics(targetLocale);

  useEffect(() => {
    const profile = readCommunityUserProfile();
    setProfileName(profile.displayName);
    void getCurrentCommunityUser().then((user) => {
      setCurrentUser(user);
      if (user) setProfileName(readMeProfile(user).displayName || profile.displayName);
      setAuthChecked(true);
    }).catch(() => {
      setCurrentUser(null);
      setAuthChecked(true);
    });
  }, []);

  useEffect(() => {
    imagePreviewsRef.current = imagePreviews;
  }, [imagePreviews]);

  useEffect(() => () => {
    imagePreviewsRef.current.forEach((image) => URL.revokeObjectURL(image.url));
  }, []);

  function updateForm<Key extends keyof FormState>(key: Key, value: FormState[Key]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function addImages(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0) return;

    const remaining = communityMaxImages - imagePreviews.length;
    if (remaining <= 0) {
      setMessage(text.maxImages);
      event.target.value = "";
      return;
    }

    const validFiles: File[] = [];
    files.forEach((file) => {
      const validationMessage = validateCommunityImage(file, language);
      if (validationMessage) setMessage(validationMessage);
      else validFiles.push(file);
    });

    if (validFiles.length > remaining) setMessage(text.maxImages);
    const nextImages = validFiles.slice(0, remaining).map((file) => ({
      file,
      fileName: file.name,
      id: createCommunityId("local-image"),
      url: URL.createObjectURL(file),
    }));
    setImagePreviews((current) => [...current, ...nextImages].slice(0, communityMaxImages));
    event.target.value = "";
  }

  function removeImage(imageId: string) {
    setImagePreviews((current) => {
      const image = current.find((item) => item.id === imageId);
      if (image) URL.revokeObjectURL(image.url);
      return current.filter((item) => item.id !== imageId);
    });
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    if (!currentUser) {
      setMessage(text.loginFirst);
      return;
    }

    const validationMessage = validateForm(form, text);
    if (validationMessage) {
      setMessage(validationMessage);
      return;
    }

    const now = formatCommunityNow();
    const draftId = createCommunityId("community-draft");
    const needsReview = hasCommunityRiskKeyword(`${form.title} ${form.content} ${selectedTags.join(" ")}`);
    const textCoverImage: CommunityPostImage = {
      alt: form.title.trim(),
      coverText: form.content.trim(),
      id: createCommunityId("text-cover"),
      previewColor: getTextCoverColor(form.type),
      title: form.title.trim(),
      type: "text-cover",
    };

    setSubmitting(true);
    setMessage("");

    try {
      const uploadedImages = await uploadCommunityImages(imagePreviews, text);
      const images = uploadedImages.length > 0 ? uploadedImages : [textCoverImage];
      const authorProfile = createCommunityProfileFromMeProfile(readMeProfile(currentUser), readCommunityUserProfile());
      const nextPost: CommunityPost = {
        id: draftId,
        communityLocale: targetLocale,
        area: form.area.trim(),
        authorId: authorProfile.id || currentUser.id || communityLocalUserId,
        authorName: authorProfile.displayName || profileName,
        buddyType: form.type === "buddy" ? form.buddyType.trim() : undefined,
        budget: form.type === "helper" ? form.budget.trim() : undefined,
        commentCount: 0,
        comments: 0,
        condition: form.type === "secondhand" ? form.condition : undefined,
        content: form.content.trim(),
        createdAt: now,
        favoriteCount: 0,
        favorites: 0,
        helpCategory: form.type === "help" ? form.helpCategory : undefined,
        helperCategory: form.type === "helper" ? form.helperCategory : undefined,
        images,
        isAnonymous: false,
        isFeatured: false,
        isOfficialRecommended: false,
        isPinned: false,
        isSolved: form.type === "help" ? false : undefined,
        itemStatus: form.type === "secondhand" ? form.itemStatus : undefined,
        likeCount: 0,
        likes: 0,
        people: form.type === "buddy" ? form.people.trim() : undefined,
        pickupMethod: form.type === "secondhand" ? form.pickupMethod : undefined,
        pinnedUntil: null,
        price: form.type === "secondhand" ? form.price.trim() : undefined,
        reportCount: 0,
        status: needsReview ? "pending" : "published",
        tags: selectedTags,
        time: form.type === "buddy" || form.type === "helper" ? form.time.trim() : undefined,
        title: form.title.trim(),
        type: form.type,
        updatedAt: now,
        viewCount: 0,
        views: 0,
      };

      const result = await publishCommunityPost(nextPost, authorProfile, text);
      if (result.error || !result.data) {
        setMessage(result.error || text.submitFail);
        return;
      }

      const publishedPost = result.data;
      writeCommunityPosts([publishedPost, ...readCommunityPosts(publishedPost.communityLocale).filter((post) => post.id !== publishedPost.id)].slice(0, 100));
      clearCommunityFeedPreloadCache();
      window.sessionStorage.setItem("japan-life-community-publish-message", needsReview ? text.pendingMessage : text.publishSuccess);
      router.push(getCommunityLocaleHref("all"));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : text.publishFail);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="jl-tool-theme min-h-screen text-[#061a3a]">
      <div className="jl-tool-shell mx-auto min-h-screen w-full max-w-[430px] px-4 pb-[136px] pt-4">
        <div className="flex items-center justify-between gap-2">
          <Link className="inline-flex h-9 items-center gap-2 rounded-full bg-white/85 px-4 text-sm font-black text-[#2563EB] shadow-sm ring-1 ring-blue-100" href={getCommunityLocaleHref("all")}>
            <ArrowLeft className="h-4 w-4" />
            {text.back}
          </Link>
          <span className="rounded-full bg-white/85 px-4 py-2 text-xs font-black text-[#2563EB] shadow-sm ring-1 ring-blue-100">{text.badge}</span>
        </div>

        {message ? <p className="mt-4 rounded-2xl bg-blue-50 px-4 py-3 text-xs font-black text-[#1D4ED8] ring-1 ring-blue-100">{message}</p> : null}
        {!authChecked ? <p className="mt-4 rounded-2xl bg-white/80 px-4 py-3 text-xs font-black text-[#2563EB] ring-1 ring-blue-100">正在检查登录状态...</p> : null}
        {authChecked && !currentUser ? <div className="mt-4"><CommunityLoginRequiredCard /></div> : null}

        {authChecked && currentUser ? <form className="mt-4 grid gap-4" onSubmit={submit}>
          <ImagePicker disabled={submitting} images={imagePreviews} onAdd={addImages} onRemove={removeImage} text={text} />

          <GlassCard>
            <TextInput label={text.title} onChange={(value) => updateForm("title", value)} placeholder={text.titlePlaceholders[form.type]} value={form.title} />
            <label className="mt-3 grid gap-1.5">
              <span className="text-xs font-black text-slate-500">{text.content}</span>
              <textarea className="min-h-48 rounded-[18px] border border-slate-300/85 bg-white/90 px-3.5 py-3 text-sm font-bold leading-[22px] outline-none focus:border-[#2563EB]" onChange={(event) => updateForm("content", event.target.value)} placeholder={text.contentPlaceholders[form.type]} value={form.content} />
            </label>
            <TypeTagPicker text={text} value={form.type} onChange={(value) => updateForm("type", value)} />
          </GlassCard>

          <ExtraFields form={form} text={text} updateForm={updateForm} />

          <TopicSelector
            onChange={(value) => updateForm("tags", value)}
            onToggle={(tag) => updateForm("tags", toggleTagInput(form.tags, tag))}
            selectedTags={selectedTags}
            suggestedTopics={suggestedTopics}
            text={text}
            value={form.tags}
          />

          <PublishRuleNotice text={text} />

          <div className="pt-3">
            <button className="flex h-[50px] w-full items-center justify-center gap-2 rounded-full bg-[linear-gradient(135deg,#2563eb,#38bdf8)] text-[15px] font-[850] text-white shadow-[0_12px_26px_rgba(37,99,235,0.22)] disabled:cursor-not-allowed disabled:opacity-70" disabled={submitting} type="submit">
              <Send className="h-4 w-4" />
              {submitting ? text.submitting : text.publish}
            </button>
          </div>
        </form> : null}
      </div>
    </main>
  );
}

function GlassCard({ children }: { children: ReactNode }) {
  return (
    <section className="rounded-[26px] border border-white/80 bg-white/85 p-4 shadow-[0_14px_32px_rgba(15,76,129,0.10)]">
      {children}
    </section>
  );
}

async function publishCommunityPost(post: CommunityPost, profile: CommunityUserProfile, text: NewPostText): Promise<{ data: CommunityPost | null; error: string }> {
  const { data } = supabase ? await supabase.auth.getSession() : { data: { session: null } };
  const token = data.session?.access_token ?? "";
  if (!token) return { data: null, error: text.loginFirst };

  const response = await fetch("/api/community/posts/", {
    body: JSON.stringify({ post, profile }),
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
    },
    method: "POST",
  });
  const body = (await response.json().catch(() => null)) as { error?: string; item?: CommunityPost } | null;
  if (!response.ok) return { data: null, error: body?.error || text.submitFail };
  return { data: body?.item ?? null, error: "" };
}

function TypeTagPicker({ onChange, text, value }: { onChange: (value: CommunityPostType) => void; text: NewPostText; value: CommunityPostType }) {
  return (
    <div className="mt-4">
      <p className="text-xs font-black text-slate-500">{text.publishType}</p>
      <div className="mt-2 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {postTypeCards.map((type) => {
          const active = value === type.id;
          return (
            <button
              className={`h-8 shrink-0 rounded-full px-4 text-[12px] font-black transition active:scale-[0.97] ${active ? "bg-[#2563eb] text-white shadow-[0_10px_20px_rgba(37,99,235,0.20)]" : "bg-[#eff6ff] text-[#263b59]"}`}
              key={type.id}
              onClick={() => onChange(type.id)}
              type="button"
            >
              {text.postTypes[type.id]}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ImagePicker({ disabled = false, images, onAdd, onRemove, text }: { disabled?: boolean; images: ImagePreview[]; onAdd: (event: ChangeEvent<HTMLInputElement>) => void; onRemove: (imageId: string) => void; text: NewPostText }) {
  return (
    <section className="rounded-[26px] border border-white/80 bg-white/85 p-4 shadow-[0_14px_32px_rgba(15,76,129,0.10)]">
      <div className="flex gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {images.map((image, index) => (
          <div className="relative h-[112px] w-[112px] shrink-0 overflow-hidden rounded-[20px] bg-blue-50 ring-1 ring-blue-100" key={image.id}>
            <img alt={image.fileName} className="h-full w-full object-cover" src={image.url} />
            {index === 0 ? <span className="absolute left-1.5 top-1.5 inline-flex h-5 items-center rounded-full bg-[rgba(37,99,235,0.88)] px-2 text-[10px] font-black text-white">{text.cover}</span> : null}
            <button className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-[rgba(15,23,42,0.64)] text-white disabled:opacity-50" disabled={disabled} onClick={() => onRemove(image.id)} type="button" aria-label={text.removeImage}>
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
        {images.length < communityMaxImages ? (
          <label className={`flex h-[112px] w-[112px] shrink-0 items-center justify-center rounded-[20px] bg-white text-[#94a3b8] ring-1 ring-slate-200 transition active:scale-[0.97] ${disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}>
            <ImagePlus className="h-9 w-9 stroke-[1.7]" />
            <input accept="image/jpeg,image/png,image/webp" className="hidden" disabled={disabled} multiple onChange={onAdd} type="file" />
          </label>
        ) : null}
      </div>
    </section>
  );
}

function TextInput({ label, onChange, placeholder, value }: { label: string; onChange: (value: string) => void; placeholder: string; value: string }) {
  return (
    <label className="grid gap-1.5">
      <span className="text-xs font-black text-slate-500">{label}</span>
      <input className="h-11 rounded-2xl border border-slate-300/85 bg-white/90 px-3.5 text-sm font-bold outline-none placeholder:text-slate-400 focus:border-[#2563EB]" onChange={(event) => onChange(event.target.value)} placeholder={placeholder} value={value} />
    </label>
  );
}

function ExtraFields({ form, text, updateForm }: { form: FormState; text: NewPostText; updateForm: <Key extends keyof FormState>(key: Key, value: FormState[Key]) => void }) {
  if (form.type === "secondhand") {
    return (
      <GlassCard>
        <div className="grid gap-3">
          <TextInput label={text.price} onChange={(value) => updateForm("price", value)} placeholder={text.pricePlaceholder} value={form.price} />
          <SelectInput label={text.itemStatus} onChange={(value) => updateForm("itemStatus", value)} options={text.options.itemStatus} optionValues={itemStatusOptions} value={form.itemStatus} />
          <SelectInput label={text.condition} onChange={(value) => updateForm("condition", value)} options={text.options.condition} optionValues={conditionOptions} value={form.condition} />
          <SelectInput label={text.pickupMethod} onChange={(value) => updateForm("pickupMethod", value)} options={text.options.pickupMethod} optionValues={pickupMethodOptions} value={form.pickupMethod} />
          <HintText>{text.secondhandHint}</HintText>
        </div>
      </GlassCard>
    );
  }

  if (form.type === "buddy") {
    return (
      <GlassCard>
        <div className="grid gap-3">
          <SelectInput label={text.buddyType} onChange={(value) => updateForm("buddyType", value)} options={text.options.buddyType} optionValues={buddyTypeOptions} placeholder={text.buddyTypePlaceholder} value={form.buddyType} />
          <TextInput label={text.time} onChange={(value) => updateForm("time", value)} placeholder={text.buddyTimePlaceholder} value={form.time} />
          <TextInput label={text.people} onChange={(value) => updateForm("people", value)} placeholder={text.peoplePlaceholder} value={form.people} />
          <HintText>{text.buddyHint}</HintText>
        </div>
      </GlassCard>
    );
  }

  if (form.type === "helper") {
    return (
      <GlassCard>
        <div className="grid gap-3">
          <SelectInput label={text.helperCategory} onChange={(value) => updateForm("helperCategory", value)} options={text.options.helperCategory} optionValues={helperCategoryOptions} placeholder={text.helperCategoryPlaceholder} value={form.helperCategory} />
          <TextInput label={text.budget} onChange={(value) => updateForm("budget", value)} placeholder={text.budgetPlaceholder} value={form.budget} />
          <TextInput label={text.time} onChange={(value) => updateForm("time", value)} placeholder={text.helperTimePlaceholder} value={form.time} />
          <HintText>{text.helperHint}</HintText>
        </div>
      </GlassCard>
    );
  }

  if (form.type === "help") {
    return (
      <GlassCard>
        <SelectInput label={text.helpCategory} onChange={(value) => updateForm("helpCategory", value)} options={text.options.helpCategory} optionValues={helpCategoryOptions} placeholder={text.helpCategoryPlaceholder} value={form.helpCategory} />
        <HintText>{text.helpHint}</HintText>
      </GlassCard>
    );
  }

  return null;
}

function SelectInput({ label, onChange, options, optionValues, placeholder, value }: { label: string; onChange: (value: string) => void; options: readonly string[]; optionValues?: readonly string[]; placeholder?: string; value: string }) {
  return (
    <label className="grid gap-1.5">
      <span className="text-xs font-black text-slate-500">{label}</span>
      <select className="h-11 rounded-2xl border border-slate-300/85 bg-white/90 px-3.5 text-sm font-bold outline-none focus:border-[#2563EB]" onChange={(event) => onChange(event.target.value)} value={value}>
        {placeholder ? <option value="">{placeholder}</option> : null}
        {options.map((option, index) => <option key={optionValues?.[index] ?? option} value={optionValues?.[index] ?? option}>{option}</option>)}
      </select>
    </label>
  );
}

function TopicSelector({ onChange, onToggle, selectedTags, suggestedTopics, text, value }: { onChange: (value: string) => void; onToggle: (tag: string) => void; selectedTags: string[]; suggestedTopics: string[]; text: NewPostText; value: string }) {
  return (
    <GlassCard>
      <label className="grid gap-1.5">
        <span className="text-sm font-black text-[#061a3a]">{text.topics}</span>
        <input className="h-11 rounded-2xl border border-slate-300/85 bg-white/90 px-3.5 text-sm font-bold outline-none placeholder:text-slate-400 focus:border-[#2563EB]" onChange={(event) => onChange(event.target.value)} placeholder={text.topicsPlaceholder} value={value} />
      </label>
      {selectedTags.length ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {selectedTags.map((tag) => (
            <button className="h-8 rounded-full bg-[#2563EB] px-3 text-[11px] font-black text-white" key={tag} onClick={() => onToggle(tag)} type="button">
              #{tag} x
            </button>
          ))}
        </div>
      ) : null}
      <div className="mt-3 flex flex-wrap gap-2">
        {suggestedTopics.map((topic) => {
          const active = selectedTags.includes(topic);
          return (
            <button className={`h-8 rounded-full px-3 text-[11px] font-black ring-1 ${active ? "bg-[#2563EB] text-white ring-[#2563EB]" : "bg-[rgba(219,234,254,0.72)] text-[#2563eb] ring-blue-100"}`} key={topic} onClick={() => onToggle(topic)} type="button">
              #{topic}
            </button>
          );
        })}
      </div>
      <p className="mt-2 text-[11px] font-bold text-slate-400">{text.topicsHint}</p>
    </GlassCard>
  );
}

function PublishRuleNotice({ text }: { text: NewPostText }) {
  return (
    <section className="rounded-[22px] border border-[rgba(226,232,240,0.85)] bg-[rgba(255,255,255,0.82)] p-[14px] shadow-[0_10px_24px_rgba(15,76,129,0.07)]">
      <div className="flex items-center gap-2 text-[14px] font-[850] text-[#061a3a]">
        <ShieldCheck className="h-5 w-5 text-[#2563EB]" />
        {text.beforePublish}
      </div>
      <ul className="mt-2 space-y-1.5 text-[12px] font-bold leading-[19px] text-[#40546f]">
        {text.rules.map((rule) => <li className="flex gap-2" key={rule}><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#2563EB]" />{rule}</li>)}
        <li className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#2563EB]" />{text.safetyDisclaimer}</li>
      </ul>
    </section>
  );
}

function HintText({ children }: { children: ReactNode }) {
  return <p className="rounded-2xl bg-blue-50/80 px-3 py-2 text-xs font-bold leading-5 text-slate-500 ring-1 ring-blue-100">{children}</p>;
}

function validateForm(form: FormState, text: NewPostText) {
  if (!form.title.trim()) return text.validateTitle;
  if (!form.content.trim()) return text.validateContent;
  if (!form.type) return text.validateType;
  return "";
}

function toggleTagInput(value: string, tag: string) {
  const tags = parseCommunityTags(value);
  const nextTags = tags.includes(tag) ? tags.filter((item) => item !== tag) : [...tags, tag].slice(0, 5);
  return nextTags.join(" ");
}

async function uploadCommunityImages(images: ImagePreview[], text: NewPostText): Promise<CommunityPostImage[]> {
  if (images.length === 0) return [];
  const { data } = supabase ? await supabase.auth.getSession() : { data: { session: null } };
  const token = data.session?.access_token ?? "";
  if (!token) throw new Error(text.uploadLogin);

  const uploadedImages: CommunityPostImage[] = [];
  for (const image of images) {
    uploadedImages.push(await uploadCommunityImage(image, token, text));
  }
  return uploadedImages;
}

async function uploadCommunityImage(image: ImagePreview, token: string, text: NewPostText): Promise<CommunityPostImage> {
  const formData = new FormData();
  formData.append("file", image.file);
  formData.append("folder", "community");

  const response = await fetch("/api/upload-public-image", {
    body: formData,
    headers: { authorization: `Bearer ${token}` },
    method: "POST",
  });
  const body = (await response.json().catch(() => null)) as { error?: string; path?: string; publicUrl?: string } | null;
  if (!response.ok || !body?.publicUrl) throw new Error(body?.error || text.uploadFail);

  return {
    alt: image.fileName || "community image",
    id: image.id,
    path: body.path || "",
    previewColor: getTextCoverColor("share"),
    title: image.fileName,
    type: "local-preview",
    url: body.publicUrl,
  };
}

function getTextCoverColor(type: CommunityPostType) {
  const index = postTypeCards.findIndex((item) => item.id === type);
  return placeholderColors[Math.max(0, index) % placeholderColors.length];
}
