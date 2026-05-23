"use client";

import { CheckCircle2, ImagePlus, Send, Store, Trash2, X } from "lucide-react";
import type { ReactNode } from "react";
import { type ChangeEvent, useEffect, useRef, useState } from "react";
import { BackButton } from "@/components/BackButton";
import { useLanguage } from "@/hooks/useLanguage";

type PreviewImage = {
  file: File;
  id: string;
  url: string;
};

type Language = "zh-CN" | "zh-TW" | "ja";

type LabelOption = {
  id: string;
  ja: string;
  zhCN: string;
  zhTW: string;
};

const copy = {
  "zh-CN": {
    address: "店铺地址",
    addressDetail: "详细地址",
    addressArea: "大区域",
    addressWard: "区 / 市",
    avatarHint: "用于店铺列表主图，提交时会上传到 Supabase Storage。",
    avatarTitle: "店铺主图",
    averageSpend: "人均消费",
    averageSpendFrom: "最低",
    averageSpendTo: "最高",
    contactTool: "联系工具",
    contactValue: "联系方式",
    featureHint: "选择后会用于店铺卡片展示，方便用户快速判断。",
    featureTitle: "店铺标签",
    hours: "营业时间",
    hoursClose: "结束",
    hoursOpen: "开始",
    imageButton: "选择图片",
    imageDelete: "删除图片",
    imageLimitError: "最多只能上传 5 张图片。",
    imageMenuTitle: "图片预览",
    imageSizeError: "图片不能超过 5MB。",
    imageTypeError: "只支持 JPG、PNG、WebP 图片。",
    menuHint: "最多 5 张，可放菜单、门面、环境或招牌图。",
    menuTitle: "菜单 / 环境图片",
    ownerName: "负责人姓名",
    phone: "店铺电话",
    phoneHint: "只填数字，会自动整理成 03-1234-5678 这种格式。",
    shopName: "店铺名称",
    smokingHint: "如果不确定可以选择“未确认”。",
    smokingTitle: "吸烟规则",
    submit: "提交上架申请",
    submitting: "提交中...",
    subtitle: "提交后会进入后台待审核，确认后才会上架。图片会自动上传，不需要再复制给运营。",
    success: "已提交到后台待审核。",
    title: "店铺上架申请",
    typeHint: "按标签选择店铺类型，用于之后分类和筛选。",
    typeTitle: "店铺类型",
    website: "官网（可选）",
  },
  "zh-TW": {
    address: "店鋪地址",
    addressDetail: "詳細地址",
    addressArea: "大區域",
    addressWard: "區 / 市",
    avatarHint: "用於店鋪列表主圖，送出時會上傳到 Supabase Storage。",
    avatarTitle: "店鋪主圖",
    averageSpend: "人均消費",
    averageSpendFrom: "最低",
    averageSpendTo: "最高",
    contactTool: "聯絡工具",
    contactValue: "聯絡方式",
    featureHint: "選擇後會用於店鋪卡片展示，方便使用者快速判斷。",
    featureTitle: "店鋪標籤",
    hours: "營業時間",
    hoursClose: "結束",
    hoursOpen: "開始",
    imageButton: "選擇圖片",
    imageDelete: "刪除圖片",
    imageLimitError: "最多只能上傳 5 張圖片。",
    imageMenuTitle: "圖片預覽",
    imageSizeError: "圖片不能超過 5MB。",
    imageTypeError: "只支援 JPG、PNG、WebP 圖片。",
    menuHint: "最多 5 張，可放菜單、門面、環境或招牌圖。",
    menuTitle: "菜單 / 環境圖片",
    ownerName: "負責人姓名",
    phone: "店鋪電話",
    phoneHint: "只填數字，會自動整理成 03-1234-5678 這種格式。",
    shopName: "店鋪名稱",
    smokingHint: "如果不確定可以選擇「未確認」。",
    smokingTitle: "吸菸規則",
    submit: "送出上架申請",
    submitting: "提交中...",
    subtitle: "提交後會進入後台待審核，確認後才會上架。圖片會自動上傳，不需要再另外傳給營運。",
    success: "已提交到後台待審核。",
    title: "店鋪上架申請",
    typeHint: "按標籤選擇店鋪類型，用於之後分類和篩選。",
    typeTitle: "店鋪類型",
    website: "官網（可選）",
  },
  ja: {
    address: "店舗住所",
    addressDetail: "詳しい住所",
    addressArea: "大エリア",
    addressWard: "区 / 市",
    avatarHint: "店舗一覧のメイン画像として使用します。送信時に Supabase Storage へアップロードされます。",
    avatarTitle: "店舗メイン画像",
    averageSpend: "平均予算",
    averageSpendFrom: "下限",
    averageSpendTo: "上限",
    contactTool: "連絡ツール",
    contactValue: "連絡先",
    featureHint: "店舗カードに表示され、ユーザーが特徴を判断しやすくなります。",
    featureTitle: "店舗タグ",
    hours: "営業時間",
    hoursClose: "終了",
    hoursOpen: "開始",
    imageButton: "画像を選択",
    imageDelete: "画像を削除",
    imageLimitError: "画像は最大 5 枚までです。",
    imageMenuTitle: "画像プレビュー",
    imageSizeError: "画像サイズは 5MB 以下にしてください。",
    imageTypeError: "JPG、PNG、WebP 画像のみ対応しています。",
    menuHint: "最大 5 枚。メニュー、外観、店内、看板画像を登録できます。",
    menuTitle: "メニュー / 店内画像",
    ownerName: "担当者名",
    phone: "店舗電話",
    phoneHint: "数字のみ入力してください。03-1234-5678 の形式に整えます。",
    shopName: "店舗名",
    smokingHint: "不明な場合は「未確認」を選択してください。",
    smokingTitle: "喫煙ルール",
    submit: "掲載申請を送信",
    submitting: "送信中...",
    subtitle: "送信後は管理画面の審査待ちに入り、確認後に掲載されます。画像も自動でアップロードされます。",
    success: "管理画面へ審査待ちとして送信しました。",
    title: "店舗掲載申請",
    typeHint: "店舗タイプをタグで選択します。分類や絞り込みに使います。",
    typeTitle: "店舗タイプ",
    website: "公式サイト（任意）",
  },
} as const;

const contactTools: Record<Language, string[]> = {
  "zh-CN": ["微信", "Email", "LINE", "电话", "WhatsApp", "其他"],
  "zh-TW": ["微信", "Email", "LINE", "電話", "WhatsApp", "其他"],
  ja: ["WeChat", "Email", "LINE", "電話", "WhatsApp", "その他"],
};

const addressRegions: Array<LabelOption & { children: LabelOption[]; prefix: string }> = [
  {
    id: "tokyo-23",
    ja: "東京都 23 区",
    prefix: "東京都",
    zhCN: "东京 23 区",
    zhTW: "東京 23 區",
    children: [
      { id: "chiyoda", ja: "千代田区", zhCN: "千代田区", zhTW: "千代田區" },
      { id: "chuo", ja: "中央区", zhCN: "中央区", zhTW: "中央區" },
      { id: "minato", ja: "港区", zhCN: "港区", zhTW: "港區" },
      { id: "shinjuku", ja: "新宿区", zhCN: "新宿区", zhTW: "新宿區" },
      { id: "bunkyo", ja: "文京区", zhCN: "文京区", zhTW: "文京區" },
      { id: "taito", ja: "台東区", zhCN: "台东区", zhTW: "台東區" },
      { id: "sumida", ja: "墨田区", zhCN: "墨田区", zhTW: "墨田區" },
      { id: "koto", ja: "江東区", zhCN: "江东区", zhTW: "江東區" },
      { id: "shinagawa", ja: "品川区", zhCN: "品川区", zhTW: "品川區" },
      { id: "meguro", ja: "目黒区", zhCN: "目黑区", zhTW: "目黑區" },
      { id: "ota", ja: "大田区", zhCN: "大田区", zhTW: "大田區" },
      { id: "setagaya", ja: "世田谷区", zhCN: "世田谷区", zhTW: "世田谷區" },
      { id: "shibuya", ja: "渋谷区", zhCN: "涩谷区", zhTW: "澀谷區" },
      { id: "nakano", ja: "中野区", zhCN: "中野区", zhTW: "中野區" },
      { id: "suginami", ja: "杉並区", zhCN: "杉并区", zhTW: "杉並區" },
      { id: "toshima", ja: "豊島区", zhCN: "丰岛区", zhTW: "豐島區" },
      { id: "kita", ja: "北区", zhCN: "北区", zhTW: "北區" },
      { id: "arakawa", ja: "荒川区", zhCN: "荒川区", zhTW: "荒川區" },
      { id: "itabashi", ja: "板橋区", zhCN: "板桥区", zhTW: "板橋區" },
      { id: "nerima", ja: "練馬区", zhCN: "练马区", zhTW: "練馬區" },
      { id: "adachi", ja: "足立区", zhCN: "足立区", zhTW: "足立區" },
      { id: "katsushika", ja: "葛飾区", zhCN: "葛饰区", zhTW: "葛飾區" },
      { id: "edogawa", ja: "江戸川区", zhCN: "江户川区", zhTW: "江戶川區" },
    ],
  },
  {
    id: "tokyo-west",
    ja: "東京都 市部",
    prefix: "東京都",
    zhCN: "东京周边市部",
    zhTW: "東京周邊市部",
    children: [
      { id: "musashino", ja: "武蔵野市", zhCN: "武藏野市", zhTW: "武藏野市" },
      { id: "mitaka", ja: "三鷹市", zhCN: "三鹰市", zhTW: "三鷹市" },
      { id: "chofu", ja: "調布市", zhCN: "调布市", zhTW: "調布市" },
      { id: "fuchu", ja: "府中市", zhCN: "府中市", zhTW: "府中市" },
      { id: "tachikawa", ja: "立川市", zhCN: "立川市", zhTW: "立川市" },
      { id: "hachioji", ja: "八王子市", zhCN: "八王子市", zhTW: "八王子市" },
      { id: "machida", ja: "町田市", zhCN: "町田市", zhTW: "町田市" },
    ],
  },
  {
    id: "kanagawa",
    ja: "神奈川県",
    prefix: "神奈川県",
    zhCN: "神奈川",
    zhTW: "神奈川",
    children: [
      { id: "yokohama", ja: "横浜市", zhCN: "横滨市", zhTW: "橫濱市" },
      { id: "kawasaki", ja: "川崎市", zhCN: "川崎市", zhTW: "川崎市" },
      { id: "sagamihara", ja: "相模原市", zhCN: "相模原市", zhTW: "相模原市" },
      { id: "fujisawa", ja: "藤沢市", zhCN: "藤泽市", zhTW: "藤澤市" },
      { id: "kamakura", ja: "鎌倉市", zhCN: "镰仓市", zhTW: "鎌倉市" },
    ],
  },
  {
    id: "chiba",
    ja: "千葉県",
    prefix: "千葉県",
    zhCN: "千叶",
    zhTW: "千葉",
    children: [
      { id: "chiba-city", ja: "千葉市", zhCN: "千叶市", zhTW: "千葉市" },
      { id: "funabashi", ja: "船橋市", zhCN: "船桥市", zhTW: "船橋市" },
      { id: "ichikawa", ja: "市川市", zhCN: "市川市", zhTW: "市川市" },
      { id: "matsudo", ja: "松戸市", zhCN: "松户市", zhTW: "松戶市" },
      { id: "kashiwa", ja: "柏市", zhCN: "柏市", zhTW: "柏市" },
      { id: "urayasu", ja: "浦安市", zhCN: "浦安市", zhTW: "浦安市" },
    ],
  },
  {
    id: "saitama",
    ja: "埼玉県",
    prefix: "埼玉県",
    zhCN: "埼玉",
    zhTW: "埼玉",
    children: [
      { id: "saitama-city", ja: "さいたま市", zhCN: "埼玉市", zhTW: "埼玉市" },
      { id: "kawaguchi", ja: "川口市", zhCN: "川口市", zhTW: "川口市" },
      { id: "kawagoe", ja: "川越市", zhCN: "川越市", zhTW: "川越市" },
      { id: "tokorozawa", ja: "所沢市", zhCN: "所泽市", zhTW: "所澤市" },
      { id: "koshigaya", ja: "越谷市", zhCN: "越谷市", zhTW: "越谷市" },
      { id: "warabi", ja: "蕨市", zhCN: "蕨市", zhTW: "蕨市" },
    ],
  },
];

const typeOptions: LabelOption[] = [
  { id: "restaurant", ja: "飲食店", zhCN: "餐厅", zhTW: "餐廳" },
  { id: "cafe", ja: "カフェ", zhCN: "咖啡店", zhTW: "咖啡店" },
  { id: "supermarket", ja: "スーパー", zhCN: "超市", zhTW: "超市" },
  { id: "hospital", ja: "病院 / クリニック", zhCN: "医院 / 诊所", zhTW: "醫院 / 診所" },
  { id: "realEstate", ja: "不動産", zhCN: "不动产", zhTW: "不動產" },
  { id: "scrivener", ja: "行政書士", zhCN: "行政书士", zhTW: "行政書士" },
  { id: "mobile", ja: "スマホ契約", zhCN: "手机卡", zhTW: "手機卡" },
  { id: "beauty", ja: "美容 / ヘアサロン", zhCN: "美容 / 美发", zhTW: "美容 / 美髮" },
  { id: "education", ja: "語学 / 教育", zhCN: "语言 / 教育", zhTW: "語言 / 教育" },
  { id: "service", ja: "生活サービス", zhCN: "生活服务", zhTW: "生活服務" },
];

const featureOptions: LabelOption[] = [
  { id: "supportsChinese", ja: "中国語対応", zhCN: "支持中文", zhTW: "支援中文" },
  { id: "supportsJapanese", ja: "日本語対応", zhCN: "支持日文", zhTW: "支援日文" },
  { id: "foreignerFriendly", ja: "外国人にやさしい", zhCN: "外国人友好", zhTW: "外國人友好" },
  { id: "reservation", ja: "予約可", zhCN: "可预约", zhTW: "可預約" },
  { id: "takeout", ja: "テイクアウト可", zhCN: "可外带", zhTW: "可外帶" },
  { id: "cardPayment", ja: "カード可", zhCN: "可刷卡", zhTW: "可刷卡" },
  { id: "cashless", ja: "キャッシュレス可", zhCN: "电子支付", zhTW: "電子支付" },
  { id: "wifi", ja: "Wi-Fi あり", zhCN: "有 Wi-Fi", zhTW: "有 Wi-Fi" },
];

const smokingOptions: LabelOption[] = [
  { id: "unknown", ja: "未確認", zhCN: "未确认", zhTW: "未確認" },
  { id: "nonSmoking", ja: "禁煙", zhCN: "禁烟", zhTW: "禁菸" },
  { id: "smokingAllowed", ja: "喫煙可", zhCN: "可吸烟", zhTW: "可吸菸" },
  { id: "smokingArea", ja: "喫煙スペースあり", zhCN: "有吸烟区", zhTW: "有吸菸區" },
];

const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
const maxFileSize = 5 * 1024 * 1024;
const maxGalleryImages = 5;

function optionLabel(option: LabelOption, language: Language) {
  if (language === "ja") return option.ja;
  if (language === "zh-TW") return option.zhTW;
  return option.zhCN;
}

function onlyDigits(value: string, maxLength = 16) {
  return value.replace(/\D/g, "").slice(0, maxLength);
}

function formatPhone(value: string) {
  const digits = onlyDigits(value, 11);
  if (digits.startsWith("03") || digits.startsWith("06")) {
    return [digits.slice(0, 2), digits.slice(2, 6), digits.slice(6, 10)].filter(Boolean).join("-");
  }
  if (digits.length <= 3) return digits;
  if (digits.length <= 7) return [digits.slice(0, 3), digits.slice(3)].filter(Boolean).join("-");
  return [digits.slice(0, 3), digits.slice(3, 7), digits.slice(7, 11)].filter(Boolean).join("-");
}

function formatYen(value: string) {
  const digits = onlyDigits(value, 8);
  if (!digits) return "";
  return `¥${Number(digits).toLocaleString("ja-JP")}`;
}

async function uploadClaimImage(image: PreviewImage, slot: string) {
  const body = new FormData();
  body.append("file", image.file);
  body.append("folder", "claims");
  const response = await fetch("/api/upload-public-image", { body, method: "POST" });
  const result = (await response.json().catch(() => null)) as { error?: string; publicUrl?: string } | null;
  if (!response.ok || !result?.publicUrl) throw new Error(result?.error || `${slot} 上传失败`);
  return result.publicUrl;
}

export default function ClaimPage() {
  const { language } = useLanguage();
  const labels = copy[language];
  const [avatar, setAvatar] = useState<PreviewImage | undefined>();
  const [gallery, setGallery] = useState<PreviewImage[]>([]);
  const [imageError, setImageError] = useState("");
  const [previewImage, setPreviewImage] = useState<PreviewImage | undefined>();
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>(["supportsChinese", "foreignerFriendly"]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>(["restaurant"]);
  const [selectedRegion, setSelectedRegion] = useState("tokyo-23");
  const [selectedArea, setSelectedArea] = useState("toshima");
  const [sent, setSent] = useState(false);
  const [smokingRule, setSmokingRule] = useState("unknown");
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [averageSpendFromDigits, setAverageSpendFromDigits] = useState("");
  const [averageSpendToDigits, setAverageSpendToDigits] = useState("");
  const [openTime, setOpenTime] = useState("11:00");
  const [closeTime, setCloseTime] = useState("22:00");
  const [phoneDigits, setPhoneDigits] = useState("");
  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);
  const currentRegion = addressRegions.find((region) => region.id === selectedRegion) ?? addressRegions[0];
  const currentArea = currentRegion.children.find((area) => area.id === selectedArea) ?? currentRegion.children[0];
  const averageSpendText = [averageSpendFromDigits ? formatYen(averageSpendFromDigits) : "", averageSpendToDigits ? formatYen(averageSpendToDigits) : ""].filter(Boolean).join(" - ");

  const toggleType = (id: string) => setSelectedTypes((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  const toggleFeature = (id: string) => setSelectedFeatures((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));

  useEffect(() => {
    return () => {
      if (avatar) URL.revokeObjectURL(avatar.url);
      gallery.forEach((image) => URL.revokeObjectURL(image.url));
    };
  }, [avatar, gallery]);

  const validateFile = (file: File) => {
    if (!allowedTypes.includes(file.type)) return labels.imageTypeError;
    if (file.size > maxFileSize) return labels.imageSizeError;
    return "";
  };

  const handleAvatarChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setImageError("");
    if (!file) return;
    const error = validateFile(file);
    if (error) {
      setImageError(error);
      if (avatarInputRef.current) avatarInputRef.current.value = "";
      return;
    }
    if (avatar) URL.revokeObjectURL(avatar.url);
    const next = { file, id: `avatar-${file.name}-${file.size}`, url: URL.createObjectURL(file) };
    setAvatar(next);
    setPreviewImage(next);
  };

  const handleGalleryChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    setImageError("");
    if (files.length === 0) return;
    if (gallery.length + files.length > maxGalleryImages) {
      setImageError(labels.imageLimitError);
      if (galleryInputRef.current) galleryInputRef.current.value = "";
      return;
    }
    const invalid = files.map(validateFile).find(Boolean);
    if (invalid) {
      setImageError(invalid);
      if (galleryInputRef.current) galleryInputRef.current.value = "";
      return;
    }
    const nextImages = files.map((file, index) => ({ file, id: `gallery-${Date.now()}-${index}-${file.name}`, url: URL.createObjectURL(file) }));
    setGallery((current) => [...current, ...nextImages]);
    setPreviewImage(nextImages[0]);
    if (galleryInputRef.current) galleryInputRef.current.value = "";
  };

  const clearAvatar = () => {
    if (avatar) URL.revokeObjectURL(avatar.url);
    setAvatar(undefined);
    if (previewImage?.id === avatar?.id) setPreviewImage(undefined);
    if (avatarInputRef.current) avatarInputRef.current.value = "";
  };

  const removeGalleryImage = (id: string) => {
    setGallery((current) => {
      const removed = current.find((image) => image.id === id);
      if (removed) URL.revokeObjectURL(removed.url);
      return current.filter((image) => image.id !== id);
    });
    if (previewImage?.id === id) setPreviewImage(undefined);
  };

  return (
    <main className="min-h-screen bg-[#F6FAFF] px-4 py-5 text-[#0F172A]">
      <div className="mx-auto flex min-h-screen max-w-[430px] flex-col gap-5 bg-[radial-gradient(circle_at_top,#DFF1FF_0%,#F6FAFF_42%,#FFFFFF_100%)] px-4 py-5">
        <header className="flex items-center justify-between">
          <BackButton fallbackHref="/places" />
          <span className="rounded-full bg-white/75 px-4 py-2 text-sm font-black text-[#2563EB] shadow-sm backdrop-blur-xl">Japan Life</span>
        </header>

        <section className="rounded-[28px] border border-white/60 bg-white/75 p-5 shadow-[0_18px_45px_rgba(37,99,235,0.10)] backdrop-blur-xl">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-[#2563EB]">Japan Life</p>
              <h1 className="mt-2 text-3xl font-black tracking-tight">{labels.title}</h1>
              <p className="mt-3 text-sm font-semibold leading-6 text-[#64748B]">{labels.subtitle}</p>
            </div>
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-3xl border border-blue-100 bg-blue-50/85 text-[#2563EB] shadow-sm">
              <Store className="h-7 w-7" />
            </span>
          </div>
        </section>

        <form
          className="grid w-full max-w-full gap-3 overflow-hidden rounded-[28px] border border-white/60 bg-white/75 p-4 shadow-[0_12px_35px_rgba(37,99,235,0.08)] backdrop-blur-xl min-[390px]:p-5"
          onSubmit={async (event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            setSubmitting(true);
            setSubmitError("");
            setSent(false);
            try {
              const areaLabel = optionLabel(currentArea, language);
              const detailAddress = String(form.get("addressDetail") ?? "").trim();
              const avatarUrl = avatar ? await uploadClaimImage(avatar, labels.avatarTitle) : "";
              const galleryUrls = await Promise.all(gallery.map((image, index) => uploadClaimImage(image, `${labels.menuTitle} ${index + 1}`)));
              const response = await fetch("/api/claim-submissions", {
                body: JSON.stringify({
                  address: `${currentRegion.prefix}${areaLabel}${detailAddress}`,
                  area: areaLabel,
                  averageSpend: averageSpendText,
                  contactTool: String(form.get("contactTool") ?? ""),
                  contactValue: String(form.get("contactValue") ?? ""),
                  features: selectedFeatures,
                  galleryUrls,
                  hours: `${openTime} - ${closeTime}`,
                  imageUrl: avatarUrl,
                  ownerName: String(form.get("ownerName") ?? ""),
                  phone: formatPhone(phoneDigits),
                  shopName: String(form.get("shopName") ?? ""),
                  smokingRule,
                  storeTypes: selectedTypes,
                  website: String(form.get("website") ?? ""),
                }),
                headers: { "Content-Type": "application/json" },
                method: "POST",
              });
              const result = (await response.json().catch(() => null)) as { error?: string } | null;
              if (!response.ok) throw new Error(result?.error || `提交失败：${response.status}`);
              setSent(true);
            } catch (error) {
              setSubmitError(error instanceof Error ? error.message : "提交失败，请稍后再试。");
            } finally {
              setSubmitting(false);
            }
          }}
        >
          <div className="grid grid-cols-1 gap-3 min-[390px]:grid-cols-2">
            <Input label={labels.shopName} name="shopName" />
            <Input label={labels.ownerName} name="ownerName" />
          </div>

          <section className="grid gap-3 rounded-[22px] border border-blue-100 bg-sky-50/70 p-3">
            <p className="text-xs font-black text-[#64748B]">{labels.address}</p>
            <div className="grid grid-cols-1 gap-3">
              <label className="grid min-w-0 gap-1.5">
                <span className="text-xs font-black text-[#64748B]">{labels.addressArea}</span>
                <select
                  className="h-10 w-full max-w-full rounded-2xl border border-blue-100 bg-white/90 px-3 text-sm font-bold text-[#0F172A] outline-none focus:border-[#2563EB]"
                  onChange={(event) => {
                    const nextRegion = addressRegions.find((region) => region.id === event.target.value) ?? addressRegions[0];
                    setSelectedRegion(nextRegion.id);
                    setSelectedArea(nextRegion.children[0]?.id ?? "");
                  }}
                  value={selectedRegion}
                >
                  {addressRegions.map((region) => <option key={region.id} value={region.id}>{optionLabel(region, language)}</option>)}
                </select>
              </label>
              <label className="grid min-w-0 gap-1.5">
                <span className="text-xs font-black text-[#64748B]">{labels.addressWard}</span>
                <select className="h-10 w-full max-w-full rounded-2xl border border-blue-100 bg-white/90 px-3 text-sm font-bold text-[#0F172A] outline-none focus:border-[#2563EB]" onChange={(event) => setSelectedArea(event.target.value)} value={selectedArea}>
                  {currentRegion.children.map((area) => <option key={area.id} value={area.id}>{optionLabel(area, language)}</option>)}
                </select>
              </label>
              <Input label={labels.addressDetail} name="addressDetail" placeholder="1-2-3 Japan Life ビル 2F" />
            </div>
          </section>

          <div className="grid grid-cols-1 gap-3 min-[390px]:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
            <label className="grid min-w-0 gap-1.5">
              <span className="text-xs font-black text-[#64748B]">{labels.contactTool}</span>
              <select className="h-10 w-full max-w-full rounded-2xl border border-blue-100 bg-white/90 px-3 text-sm font-bold text-[#0F172A] outline-none focus:border-[#2563EB]" name="contactTool">
                {contactTools[language].map((item) => <option key={item}>{item}</option>)}
              </select>
            </label>
            <Input label={labels.contactValue} name="contactValue" placeholder="ID / Email / URL" />
          </div>

          <div className="grid grid-cols-1 gap-3">
            <section className="grid min-w-0 gap-1.5">
              <span className="text-xs font-black text-[#64748B]">{labels.averageSpend}</span>
              <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2">
                <Input
                  inputMode="numeric"
                  label={labels.averageSpendFrom}
                  name="averageSpendFrom"
                  onChange={(value) => setAverageSpendFromDigits(onlyDigits(value, 8))}
                  placeholder="¥1,000"
                  value={formatYen(averageSpendFromDigits)}
                />
                <span className="pt-6 text-xs font-black text-[#64748B]">-</span>
                <Input
                  inputMode="numeric"
                  label={labels.averageSpendTo}
                  name="averageSpendTo"
                  onChange={(value) => setAverageSpendToDigits(onlyDigits(value, 8))}
                  placeholder="¥2,000"
                  value={formatYen(averageSpendToDigits)}
                />
              </div>
            </section>
            <section className="grid min-w-0 gap-1.5">
              <span className="text-xs font-black text-[#64748B]">{labels.hours}</span>
              <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2">
                <label className="grid gap-1">
                  <span className="text-[10px] font-black text-[#64748B]">{labels.hoursOpen}</span>
                  <input className="h-10 w-full rounded-2xl border border-blue-100 bg-white/90 px-3 text-sm font-bold text-[#0F172A] outline-none focus:border-[#2563EB]" onChange={(event) => setOpenTime(event.target.value)} type="time" value={openTime} />
                </label>
                <span className="pt-5 text-xs font-black text-[#64748B]">-</span>
                <label className="grid gap-1">
                  <span className="text-[10px] font-black text-[#64748B]">{labels.hoursClose}</span>
                  <input className="h-10 w-full rounded-2xl border border-blue-100 bg-white/90 px-3 text-sm font-bold text-[#0F172A] outline-none focus:border-[#2563EB]" onChange={(event) => setCloseTime(event.target.value)} type="time" value={closeTime} />
                </label>
              </div>
            </section>
          </div>

          <Input
            hint={labels.phoneHint}
            inputMode="numeric"
            label={labels.phone}
            name="phone"
            onChange={(value) => setPhoneDigits(onlyDigits(value, 11))}
            placeholder="0312345678"
            value={formatPhone(phoneDigits)}
          />
          <Input label={labels.website} name="website" placeholder="https://example.com" />

          <OptionSection hint={labels.typeHint} title={labels.typeTitle}>
            {typeOptions.map((option) => <TagButton active={selectedTypes.includes(option.id)} key={option.id} onClick={() => toggleType(option.id)}>{optionLabel(option, language)}</TagButton>)}
          </OptionSection>
          <OptionSection hint={labels.featureHint} title={labels.featureTitle}>
            {featureOptions.map((option) => <TagButton active={selectedFeatures.includes(option.id)} key={option.id} onClick={() => toggleFeature(option.id)}>{optionLabel(option, language)}</TagButton>)}
          </OptionSection>
          <OptionSection hint={labels.smokingHint} title={labels.smokingTitle}>
            {smokingOptions.map((option) => <TagButton active={smokingRule === option.id} key={option.id} onClick={() => setSmokingRule(option.id)}>{optionLabel(option, language)}</TagButton>)}
          </OptionSection>

          <section className="max-w-full overflow-hidden rounded-[22px] border border-blue-100 bg-sky-50/70 p-3">
            <div className="flex items-start gap-3">
              <button aria-label={labels.avatarTitle} className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full border border-blue-100 bg-white/80 text-[#2563EB] shadow-sm" onClick={() => (avatar ? setPreviewImage(avatar) : avatarInputRef.current?.click())} type="button">
                {avatar ? <img alt="" className="h-full w-full object-cover" src={avatar.url} /> : <ImagePlus className="h-6 w-6" />}
              </button>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-black text-[#0F172A]">{labels.avatarTitle}</p>
                <p className="mt-1 text-xs font-bold leading-5 text-[#64748B]">{labels.avatarHint}</p>
                {avatar?.file.name && <p className="mt-1 truncate text-[11px] font-bold text-[#2563EB]">{avatar.file.name}</p>}
                <div className="mt-2 flex flex-wrap gap-2">
                  <button className="rounded-2xl bg-[#2563EB] px-4 py-2 text-sm font-black text-white" data-tone="primary" onClick={() => avatarInputRef.current?.click()} type="button">{labels.imageButton}</button>
                  {avatar && <button className="inline-flex items-center gap-1.5 rounded-2xl border border-blue-100 bg-white/80 px-4 py-2 text-sm font-black text-[#64748B]" onClick={clearAvatar} type="button"><Trash2 className="h-4 w-4" />{labels.imageDelete}</button>}
                </div>
              </div>
            </div>
            <input ref={avatarInputRef} accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleAvatarChange} type="file" />
          </section>

          <section className="max-w-full overflow-hidden rounded-[22px] border border-blue-100 bg-sky-50/70 p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-black text-[#0F172A]">{labels.menuTitle}</p>
                <p className="mt-1 text-xs font-bold leading-5 text-[#64748B]">{labels.menuHint}</p>
              </div>
              <span className="rounded-full bg-white/80 px-2 py-1 text-xs font-black text-[#2563EB]">{gallery.length}/5</span>
            </div>
            <input ref={galleryInputRef} accept="image/jpeg,image/png,image/webp" className="hidden" multiple onChange={handleGalleryChange} type="file" />
            <button className="mt-3 rounded-2xl bg-[#2563EB] px-4 py-2 text-sm font-black text-white" data-tone="primary" onClick={() => galleryInputRef.current?.click()} type="button">{labels.imageButton}</button>
            {imageError && <p className="mt-2 rounded-2xl bg-red-50 px-3 py-2 text-xs font-black text-red-700">{imageError}</p>}
            {gallery.length > 0 && (
              <div className="mt-3 grid grid-cols-3 gap-2 min-[390px]:grid-cols-5">
                {gallery.map((image) => (
                  <button className="relative overflow-hidden rounded-2xl border border-blue-100 bg-white p-1" key={image.id} onClick={() => setPreviewImage(image)} type="button">
                    <img alt="" className="h-20 w-full rounded-xl object-cover" src={image.url} />
                    <span className="absolute right-1 top-1 rounded-full bg-white/90 p-1 text-red-700" onClick={(event) => { event.stopPropagation(); removeGalleryImage(image.id); }}><X className="h-3 w-3" /></span>
                  </button>
                ))}
              </div>
            )}
          </section>

          {previewImage && (
            <section className="overflow-hidden rounded-[22px] border border-blue-100 bg-white/85 p-2 shadow-[0_18px_45px_rgba(37,99,235,0.12)] backdrop-blur-xl">
              <div className="flex items-center justify-between px-1 py-1">
                <p className="text-xs font-black text-[#0F172A]">{labels.imageMenuTitle}</p>
                <button aria-label="close" className="text-[#64748B]" onClick={() => setPreviewImage(undefined)} type="button"><X className="h-4 w-4" /></button>
              </div>
              <img alt="" className="mt-1 h-52 w-full rounded-[18px] object-cover" src={previewImage.url} />
              <p className="mt-2 truncate px-1 text-xs font-bold text-[#64748B]">{previewImage.file.name}</p>
            </section>
          )}

          <button className="flex h-11 items-center justify-center gap-2 rounded-2xl bg-[#2563EB] text-sm font-black text-white shadow-sm disabled:opacity-60" data-tone="primary" disabled={submitting} type="submit">
            <Send className="h-4 w-4" />
            {submitting ? labels.submitting : labels.submit}
          </button>
          {submitError && <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-black leading-6 text-red-700">{submitError}</p>}
          {sent && <div className="flex items-center gap-2 rounded-2xl bg-green-50 px-4 py-3 text-sm font-black text-green-700"><CheckCircle2 className="h-5 w-5" />{labels.success}</div>}
        </form>
      </div>
    </main>
  );
}

function Input({
  hint,
  inputMode,
  label,
  name,
  onChange,
  placeholder,
  value,
}: {
  hint?: string;
  inputMode?: "decimal" | "email" | "numeric" | "search" | "tel" | "text" | "url";
  label: string;
  name: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  value?: string;
}) {
  return (
    <label className="grid min-w-0 max-w-full gap-1.5">
      <span className="text-xs font-black text-[#64748B]">{label}</span>
      <input
        className="h-10 w-full max-w-full rounded-2xl border border-blue-100 bg-white/90 px-3 text-sm font-bold text-[#0F172A] outline-none placeholder:text-slate-400 focus:border-[#2563EB]"
        inputMode={inputMode}
        name={name}
        onChange={onChange ? (event) => onChange(event.target.value) : undefined}
        placeholder={placeholder}
        value={value}
      />
      {hint && <span className="text-[11px] font-bold leading-4 text-[#64748B]">{hint}</span>}
    </label>
  );
}

function OptionSection({ children, hint, title }: { children: ReactNode; hint: string; title: string }) {
  return (
    <section className="max-w-full overflow-hidden rounded-[22px] border border-blue-100 bg-sky-50/70 p-3">
      <p className="text-xs font-black text-[#0F172A]">{title}</p>
      <p className="mt-1 text-xs font-bold leading-5 text-[#64748B]">{hint}</p>
      <div className="mt-3 flex flex-wrap gap-2">{children}</div>
    </section>
  );
}

function TagButton({ active, children, onClick }: { active: boolean; children: ReactNode; onClick: () => void }) {
  return (
    <button className={`claim-tag-button rounded-full border px-3 py-1.5 text-xs font-black transition-all duration-300 active:scale-[0.98] ${active ? "is-active border-[#2563EB] bg-blue-50 text-[#1D4ED8] shadow-sm" : "border-white/70 bg-white/80 text-[#64748B] shadow-sm backdrop-blur-xl"}`} onClick={onClick} type="button">
      {children}
    </button>
  );
}
