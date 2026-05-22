"use client";

import { CheckCircle2, ImagePlus, Send, Store, Trash2, X } from "lucide-react";
import type { ReactNode } from "react";
import { ChangeEvent, useEffect, useRef, useState } from "react";
import { BackButton } from "@/components/BackButton";
import { useLanguage } from "@/hooks/useLanguage";
import { useLocalSubmissions } from "@/hooks/useLocalSubmissions";

type PreviewImage = {
  id: string;
  file: File;
  url: string;
};

type Language = "zh-CN" | "zh-TW" | "ja";

type LabelOption = {
  id: string;
  zhCN: string;
  zhTW: string;
  ja: string;
};

const copy = {
  "zh-CN": {
    title: "店铺上架申请",
    subtitle: "想让店铺进入 Japan Life，可以先提交资料。当前会保存到本地提交箱，之后可复制给运营处理。",
    shopName: "店铺名称",
    address: "店铺地址",
    ownerName: "负责人姓名",
    contactTool: "联系工具",
    contactValue: "联系方式",
    averageSpend: "人均消费",
    hours: "营业时间",
    phone: "店铺电话",
    website: "官网（可选）",
    typeTitle: "店铺类型",
    typeHint: "按标签选择店铺类型，用于之后分类和筛选。",
    featureTitle: "店铺标签",
    featureHint: "选择后会用于店铺卡片展示，方便用户快速判断。",
    smokingTitle: "吸烟规则",
    smokingHint: "如果不确定可以选择“未确认”。",
    avatarTitle: "店铺头像",
    avatarHint: "用于店铺列表左侧小圆头像",
    menuTitle: "菜单 / 环境图片",
    menuHint: "最多上传 5 张，可放菜单、门面、环境或招牌图。",
    imageButton: "选择图片",
    imageDelete: "删除图片",
    imageMenuTitle: "图片预览",
    imageTypeError: "只支持 JPG、PNG 或 WebP 图片。",
    imageSizeError: "图片不能超过 5MB。",
    imageLimitError: "最多只能上传 5 张图片。",
    submit: "提交上架申请",
    success: "已保存到本地提交箱，请复制记录给运营处理。",
  },
  "zh-TW": {
    title: "店鋪上架申請",
    subtitle: "想讓店鋪進入 Japan Life，可以先提交資料。目前會保存到本地提交箱，之後可複製給營運處理。",
    shopName: "店鋪名稱",
    address: "店鋪地址",
    ownerName: "負責人姓名",
    contactTool: "聯絡工具",
    contactValue: "聯絡方式",
    averageSpend: "人均消費",
    hours: "營業時間",
    phone: "店鋪電話",
    website: "官網（可選）",
    typeTitle: "店鋪類型",
    typeHint: "按標籤選擇店鋪類型，用於之後分類和篩選。",
    featureTitle: "店鋪標籤",
    featureHint: "選擇後會用於店鋪卡片展示，方便使用者快速判斷。",
    smokingTitle: "吸菸規則",
    smokingHint: "如果不確定可以選擇「未確認」。",
    avatarTitle: "店鋪頭像",
    avatarHint: "用於店鋪列表左側小圓頭像",
    menuTitle: "菜單 / 環境圖片",
    menuHint: "最多上傳 5 張，可放菜單、門面、環境或招牌圖。",
    imageButton: "選擇圖片",
    imageDelete: "刪除圖片",
    imageMenuTitle: "圖片預覽",
    imageTypeError: "只支援 JPG、PNG 或 WebP 圖片。",
    imageSizeError: "圖片不能超過 5MB。",
    imageLimitError: "最多只能上傳 5 張圖片。",
    submit: "送出上架申請",
    success: "已保存到本地提交箱，請複製記錄給營運處理。",
  },
  ja: {
    title: "店舗掲載申請",
    subtitle: "Japan Life に店舗を掲載したい場合は、まず情報を送信してください。現在はローカルの送信箱に保存され、運営確認用に共有できます。",
    shopName: "店舗名",
    address: "店舗住所",
    ownerName: "担当者名",
    contactTool: "連絡ツール",
    contactValue: "連絡先",
    averageSpend: "平均予算",
    hours: "営業時間",
    phone: "店舗電話",
    website: "公式サイト（任意）",
    typeTitle: "店舗タイプ",
    typeHint: "タグから店舗タイプを選択します。今後の分類や絞り込みに使います。",
    featureTitle: "店舗タグ",
    featureHint: "店舗カードに表示され、ユーザーが特徴を判断しやすくなります。",
    smokingTitle: "喫煙ルール",
    smokingHint: "不明な場合は「未確認」を選択してください。",
    avatarTitle: "店舗アイコン",
    avatarHint: "店舗一覧の左側アイコンとして使います",
    menuTitle: "メニュー / 店内画像",
    menuHint: "最大 5 枚。メニュー、外観、店内、看板画像を登録できます。",
    imageButton: "画像を選択",
    imageDelete: "画像を削除",
    imageMenuTitle: "画像プレビュー",
    imageTypeError: "JPG、PNG、WebP 画像のみ選択できます。",
    imageSizeError: "画像サイズは 5MB 以下にしてください。",
    imageLimitError: "画像は最大 5 枚までです。",
    submit: "掲載申請を送信",
    success: "ローカルの送信箱に保存しました。運営確認用に共有してください。",
  },
} as const;

const contactTools: Record<Language, string[]> = {
  "zh-CN": ["微信", "Email", "LINE", "电话", "WhatsApp", "其他"],
  "zh-TW": ["微信", "Email", "LINE", "電話", "WhatsApp", "其他"],
  ja: ["WeChat", "Email", "LINE", "電話", "WhatsApp", "その他"],
};

const typeOptions: LabelOption[] = [
  { id: "restaurant", zhCN: "餐厅", zhTW: "餐廳", ja: "飲食店" },
  { id: "cafe", zhCN: "咖啡店", zhTW: "咖啡店", ja: "カフェ" },
  { id: "supermarket", zhCN: "超市", zhTW: "超市", ja: "スーパー" },
  { id: "hospital", zhCN: "医院 / 诊所", zhTW: "醫院 / 診所", ja: "病院 / クリニック" },
  { id: "realEstate", zhCN: "不动产", zhTW: "不動產", ja: "不動産" },
  { id: "scrivener", zhCN: "行政书士", zhTW: "行政書士", ja: "行政書士" },
  { id: "mobile", zhCN: "手机卡", zhTW: "手機卡", ja: "スマホ契約" },
  { id: "beauty", zhCN: "美容 / 美发", zhTW: "美容 / 美髮", ja: "美容 / ヘアサロン" },
  { id: "education", zhCN: "语言 / 教育", zhTW: "語言 / 教育", ja: "語学 / 教育" },
  { id: "service", zhCN: "生活服务", zhTW: "生活服務", ja: "生活サービス" },
];

const featureOptions: LabelOption[] = [
  { id: "supportsChinese", zhCN: "支持中文", zhTW: "支援中文", ja: "中国語対応" },
  { id: "supportsJapanese", zhCN: "支持日文", zhTW: "支援日文", ja: "日本語対応" },
  { id: "foreignerFriendly", zhCN: "外国人友好", zhTW: "外國人友好", ja: "外国人にやさしい" },
  { id: "reservation", zhCN: "可预约", zhTW: "可預約", ja: "予約可" },
  { id: "takeout", zhCN: "可外带", zhTW: "可外帶", ja: "テイクアウト可" },
  { id: "childFriendly", zhCN: "儿童友好", zhTW: "兒童友善", ja: "子ども連れ可" },
  { id: "cardPayment", zhCN: "可刷卡", zhTW: "可刷卡", ja: "カード可" },
  { id: "cashless", zhCN: "电子支付", zhTW: "電子支付", ja: "キャッシュレス可" },
  { id: "lateNight", zhCN: "深夜营业", zhTW: "深夜營業", ja: "深夜営業" },
  { id: "vegetarian", zhCN: "素食可", zhTW: "素食可", ja: "ベジタリアン対応" },
  { id: "halalFriendly", zhCN: "清真友好", zhTW: "清真友善", ja: "ハラール相談可" },
  { id: "wifi", zhCN: "有 Wi-Fi", zhTW: "有 Wi-Fi", ja: "Wi-Fi あり" },
];

const smokingOptions: LabelOption[] = [
  { id: "unknown", zhCN: "未确认", zhTW: "未確認", ja: "未確認" },
  { id: "nonSmoking", zhCN: "禁烟", zhTW: "禁菸", ja: "禁煙" },
  { id: "smokingAllowed", zhCN: "可吸烟", zhTW: "可吸菸", ja: "喫煙可" },
  { id: "smokingArea", zhCN: "有吸烟区", zhTW: "有吸菸區", ja: "喫煙スペースあり" },
];

const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
const maxFileSize = 5 * 1024 * 1024;
const maxGalleryImages = 5;

function optionLabel(option: LabelOption, language: Language) {
  if (language === "ja") return option.ja;
  if (language === "zh-TW") return option.zhTW;
  return option.zhCN;
}

export default function ClaimPage() {
  const { language } = useLanguage();
  const { addSubmission } = useLocalSubmissions();
  const labels = copy[language];
  const [sent, setSent] = useState(false);
  const [avatar, setAvatar] = useState<PreviewImage | undefined>();
  const [gallery, setGallery] = useState<PreviewImage[]>([]);
  const [imageError, setImageError] = useState("");
  const [previewImage, setPreviewImage] = useState<PreviewImage | undefined>();
  const [selectedTypes, setSelectedTypes] = useState<string[]>(["restaurant"]);
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>(["supportsChinese", "foreignerFriendly"]);
  const [smokingRule, setSmokingRule] = useState("unknown");
  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);

  const toggleType = (id: string) => {
    setSelectedTypes((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  };

  const toggleFeature = (id: string) => {
    setSelectedFeatures((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  };

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
    const next = { id: `avatar-${file.name}-${file.size}`, file, url: URL.createObjectURL(file) };
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
    const nextImages = files.map((file, index) => ({ id: `gallery-${Date.now()}-${index}-${file.name}`, file, url: URL.createObjectURL(file) }));
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
          onSubmit={(event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            addSubmission("claim", {
              address: String(form.get("address") ?? ""),
              avatarFile: avatar?.file.name ?? "",
              averageSpend: String(form.get("averageSpend") ?? ""),
              contactTool: String(form.get("contactTool") ?? ""),
              contactValue: String(form.get("contactValue") ?? ""),
              features: selectedFeatures,
              galleryFiles: gallery.map((image) => image.file.name),
              hours: String(form.get("hours") ?? ""),
              ownerName: String(form.get("ownerName") ?? ""),
              phone: String(form.get("phone") ?? ""),
              shopName: String(form.get("shopName") ?? ""),
              smokingRule,
              storeTypes: selectedTypes,
              website: String(form.get("website") ?? ""),
            });
            setSent(true);
          }}
        >
          <div className="grid grid-cols-1 gap-3 min-[390px]:grid-cols-2">
            <Input label={labels.shopName} name="shopName" />
            <Input label={labels.ownerName} name="ownerName" />
          </div>
          <Input label={labels.address} name="address" placeholder="東京都豊島区..." />
          <div className="grid grid-cols-1 gap-3 min-[390px]:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
            <label className="grid min-w-0 gap-1.5">
              <span className="text-xs font-black text-[#64748B]">{labels.contactTool}</span>
              <select className="h-10 w-full max-w-full rounded-2xl border border-blue-100 bg-sky-50/70 px-3 text-sm font-bold outline-none focus:border-[#2563EB]" name="contactTool">
                {contactTools[language].map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>
            <Input label={labels.contactValue} name="contactValue" placeholder="ID / Email / URL" />
          </div>
          <div className="grid grid-cols-1 gap-3 min-[390px]:grid-cols-2">
            <Input label={labels.averageSpend} name="averageSpend" placeholder="¥1,000 - ¥2,000" />
            <Input label={labels.hours} name="hours" placeholder="11:00 - 22:00" />
          </div>
          <Input label={labels.phone} name="phone" placeholder="03-1234-5678" />
          <Input label={labels.website} name="website" placeholder="https://example.com" />

          <OptionSection hint={labels.typeHint} title={labels.typeTitle}>
            {typeOptions.map((option) => {
              const active = selectedTypes.includes(option.id);
              return (
                <TagButton active={active} key={option.id} onClick={() => toggleType(option.id)}>
                  {optionLabel(option, language)}
                </TagButton>
              );
            })}
          </OptionSection>

          <OptionSection hint={labels.featureHint} title={labels.featureTitle}>
            {featureOptions.map((option) => {
              const active = selectedFeatures.includes(option.id);
              return (
                <TagButton active={active} key={option.id} onClick={() => toggleFeature(option.id)}>
                  {optionLabel(option, language)}
                </TagButton>
              );
            })}
          </OptionSection>

          <OptionSection hint={labels.smokingHint} title={labels.smokingTitle}>
            {smokingOptions.map((option) => {
              const active = smokingRule === option.id;
              return (
                <TagButton active={active} key={option.id} onClick={() => setSmokingRule(option.id)}>
                  {optionLabel(option, language)}
                </TagButton>
              );
            })}
          </OptionSection>

          <section className="max-w-full overflow-hidden rounded-[22px] border border-blue-100 bg-sky-50/70 p-3">
            <div className="flex items-start gap-3">
              <button
                aria-label={labels.avatarTitle}
                className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full border border-blue-100 bg-white/80 text-[#2563EB] shadow-sm"
                onClick={() => (avatar ? setPreviewImage(avatar) : avatarInputRef.current?.click())}
                type="button"
              >
                {avatar ? <img alt="" className="h-full w-full object-cover" src={avatar.url} /> : <ImagePlus className="h-6 w-6" />}
              </button>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-black text-[#0F172A]">{labels.avatarTitle}</p>
                <p className="mt-1 text-xs font-bold leading-5 text-[#64748B]">{labels.avatarHint}</p>
                {avatar?.file.name && <p className="mt-1 truncate text-[11px] font-bold text-[#2563EB]">{avatar.file.name}</p>}
                <div className="mt-2 flex flex-wrap gap-2">
                  <button className="rounded-2xl bg-[#2563EB] px-4 py-2 text-sm font-black text-white" data-tone="primary" onClick={() => avatarInputRef.current?.click()} type="button">
                    {labels.imageButton}
                  </button>
                  {avatar && (
                    <button className="inline-flex items-center gap-1.5 rounded-2xl border border-blue-100 bg-white/80 px-4 py-2 text-sm font-black text-[#64748B]" onClick={clearAvatar} type="button">
                      <Trash2 className="h-4 w-4" />
                      {labels.imageDelete}
                    </button>
                  )}
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
            <button className="mt-3 rounded-2xl bg-[#2563EB] px-4 py-2 text-sm font-black text-white" data-tone="primary" onClick={() => galleryInputRef.current?.click()} type="button">
              {labels.imageButton}
            </button>
            {imageError && <p className="mt-2 rounded-2xl bg-red-50 px-3 py-2 text-xs font-black text-red-700">{imageError}</p>}
            {gallery.length > 0 && (
              <div className="mt-3 grid grid-cols-3 gap-2 min-[390px]:grid-cols-5">
                {gallery.map((image) => (
                  <button className="relative overflow-hidden rounded-2xl border border-blue-100 bg-white p-1" key={image.id} onClick={() => setPreviewImage(image)} type="button">
                    <img alt="" className="h-20 w-full rounded-xl object-cover" src={image.url} />
                    <span
                      className="absolute right-1 top-1 rounded-full bg-white/90 p-1 text-red-700"
                      onClick={(event) => {
                        event.stopPropagation();
                        removeGalleryImage(image.id);
                      }}
                    >
                      <X className="h-3 w-3" />
                    </span>
                  </button>
                ))}
              </div>
            )}
          </section>

          {previewImage && (
            <section className="overflow-hidden rounded-[22px] border border-blue-100 bg-white/85 p-2 shadow-[0_18px_45px_rgba(37,99,235,0.12)] backdrop-blur-xl">
              <div className="flex items-center justify-between px-1 py-1">
                <p className="text-xs font-black text-[#0F172A]">{labels.imageMenuTitle}</p>
                <button className="text-[#64748B]" onClick={() => setPreviewImage(undefined)} type="button" aria-label="close">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <img alt="" className="mt-1 h-52 w-full rounded-[18px] object-cover" src={previewImage.url} />
              <p className="mt-2 truncate px-1 text-xs font-bold text-[#64748B]">{previewImage.file.name}</p>
            </section>
          )}

          <button className="flex h-11 items-center justify-center gap-2 rounded-2xl bg-[#2563EB] text-sm font-black text-white shadow-sm" data-tone="primary" type="submit">
            <Send className="h-4 w-4" />
            {labels.submit}
          </button>
          {sent && (
            <div className="flex items-center gap-2 rounded-2xl bg-green-50 px-4 py-3 text-sm font-black text-green-700">
              <CheckCircle2 className="h-5 w-5" />
              {labels.success}
            </div>
          )}
        </form>
      </div>
    </main>
  );
}

function Input({ label, name, placeholder }: { label: string; name: string; placeholder?: string }) {
  return (
    <label className="grid min-w-0 max-w-full gap-1.5">
      <span className="text-xs font-black text-[#64748B]">{label}</span>
      <input className="h-10 w-full max-w-full rounded-2xl border border-blue-100 bg-sky-50/70 px-3 text-sm font-bold outline-none focus:border-[#2563EB]" name={name} placeholder={placeholder} />
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
    <button
      className={`claim-tag-button rounded-full border px-3 py-1.5 text-xs font-black transition-all duration-300 active:scale-[0.98] ${
        active ? "is-active border-[#2563EB] bg-blue-50 text-[#1D4ED8] shadow-sm" : "border-white/70 bg-white/80 text-[#64748B] shadow-sm backdrop-blur-xl"
      }`}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
}
