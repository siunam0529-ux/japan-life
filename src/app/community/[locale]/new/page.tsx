"use client";

import { ArrowLeft, Camera, CheckCircle2, ImagePlus, Send, ShieldCheck, X } from "lucide-react";
import Link from "next/link";
import { notFound, useRouter } from "next/navigation";
import type { ChangeEvent, FormEvent, ReactNode } from "react";
import { use, useEffect, useMemo, useState } from "react";
import { CommunityLoginRequiredCard } from "@/components/community/CommunityLoginRequiredCard";
import { communityMaxImages, validateCommunityImage } from "@/lib/community/images";
import { createCommunityPost, communityLocalUserId, createCommunityId, formatCommunityNow, getCurrentCommunityUser, readCommunityUserProfile, type CommunityUser } from "@/lib/community/repository";
import { getCommunityLocaleHref } from "@/lib/community/routes";
import { getHotCommunityTopics, parseCommunityTags } from "@/lib/community/topics";
import { communityAreas, communityLocaleConfigs, hasCommunityRiskKeyword, isCommunityViewLocale, type CommunityLocale, type CommunityPost, type CommunityPostImage, type CommunityPostType } from "@/lib/community/types";

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
  shareCategory: string;
  tags: string;
  time: string;
  title: string;
  type: CommunityPostType;
};

const initialForm: FormState = {
  area: "东京",
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
  shareCategory: "",
  tags: "",
  time: "",
  title: "",
  type: "share",
};

const postTypeCards: { id: CommunityPostType; label: string; description: string }[] = [
  { id: "share", label: "生活分享", description: "美食、散步、省钱、日常体验" },
  { id: "help", label: "求助提问", description: "手续、租房、打工、医院等问题" },
  { id: "secondhand", label: "闲置转让", description: "二手、赠送、搬家出清" },
  { id: "buddy", label: "找搭子", description: "饭搭子、散步、语言交换、看展" },
  { id: "helper", label: "找人帮忙", description: "清洁、搬运、宠物照顾、陪同翻译" },
];

const titlePlaceholders: Record<CommunityPostType, string> = {
  buddy: "你想找什么搭子？",
  help: "简单说一下你遇到的问题",
  helper: "你需要别人帮什么？",
  secondhand: "填写物品名称",
  share: "给你的分享起个标题",
};

const contentPlaceholders: Record<CommunityPostType, string> = {
  buddy: "写清楚想约的时间、地点、人数和希望一起做什么。",
  help: "把背景、已经尝试过的方法、卡住的地方写清楚。",
  helper: "说明需要帮忙的内容、时间地点、预算和注意事项。",
  secondhand: "描述物品状态、取货方式、价格和适合谁。",
  share: "分享你的体验、路线、价格、避坑点或推荐理由。",
};

const conditionOptions = ["全新", "较新", "正常使用", "有使用感", "需要维修"];
const pickupMethodOptions = ["自取", "可面交", "可邮寄商量"];
const itemStatusOptions = ["出品中", "已预约", "已出"];
const buddyTypeOptions = ["饭搭子", "散步搭子", "学习搭子", "语言交换", "拍照搭子", "看展搭子", "运动搭子", "周末出门"];
const helperCategoryOptions = ["清洁打扫", "搬运帮忙", "宠物照顾", "跑腿代办", "手续陪同", "翻译陪同", "家具组装", "陪去医院", "其他帮忙"];
const helpCategoryOptions = ["手续签证", "租房搬家", "打工职场", "医院药妆", "学校留学", "宠物生活", "生活账单", "其他求助"];
const shareCategoryOptions = ["美食", "散步", "省钱", "购物", "一人生活", "旅行", "打工日常", "留学生活", "其他"];
const placeholderColors = ["pink-blue", "sky-mint", "violet-sky", "amber-pink", "teal-blue", "rose-indigo"];
const communitySafetyDisclaimer = "Japan Life 仅提供信息发布与联系服务，不参与付款、配送、交易或服务履行。线下见面请优先选择公共场所，不要提前转账，不要透露证件、住址、银行卡等敏感信息。";

export default function CommunityLocaleNewPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = use(params);
  if (!isCommunityViewLocale(rawLocale)) notFound();

  const viewLocale = rawLocale;
  const [targetLocale] = useState<CommunityLocale>("zh-cn");
  const locale = targetLocale;
  const copy = communityLocaleConfigs[locale];
  const router = useRouter();
  const [form, setForm] = useState<FormState>(initialForm);
  const [imagePreviews, setImagePreviews] = useState<ImagePreview[]>([]);
  const [message, setMessage] = useState("");
  const [profileName, setProfileName] = useState("Nam");
  const [currentUser, setCurrentUser] = useState<CommunityUser | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const selectedTags = useMemo(() => parseCommunityTags(form.tags), [form.tags]);
  const suggestedTopics = getHotCommunityTopics(viewLocale === "all" ? targetLocale : viewLocale);
  const publishLabel = copy.postButtonLabel;
  const backLabel = viewLocale === "all" ? "全部社区" : copy.localeBadge;

  useEffect(() => {
    if (viewLocale !== "all") router.replace("/community/all/new");
    const profile = readCommunityUserProfile();
    setProfileName(profile.displayName);
    void getCurrentCommunityUser().then((user) => {
      setCurrentUser(user);
      if (!user) return;
      setProfileName(user.name || profile.displayName);
    });
  }, [router, viewLocale]);

  useEffect(() => () => {
    imagePreviews.forEach((image) => URL.revokeObjectURL(image.url));
  }, [imagePreviews]);

  function updateForm<Key extends keyof FormState>(key: Key, value: FormState[Key]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function addImages(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0) return;
    const remaining = communityMaxImages - imagePreviews.length;
    if (remaining <= 0) {
      setMessage("最多只能添加 6 张图片");
      event.target.value = "";
      return;
    }

    const validFiles: File[] = [];
    for (const file of files) {
      const validationMessage = validateCommunityImage(file);
      if (validationMessage) {
        setMessage(validationMessage);
        continue;
      }
      validFiles.push(file);
    }

    if (validFiles.length > remaining) setMessage("最多只能添加 6 张图片");
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
      setMessage("请先登录");
      return;
    }

    const validationMessage = validateForm(form);
    if (validationMessage) {
      setMessage(validationMessage);
      return;
    }

    const riskText = `${form.title} ${form.content} ${selectedTags.join(" ")}`;
    const needsReview = hasCommunityRiskKeyword(riskText);
    const now = formatCommunityNow();
    const draftId = createCommunityId("community-draft");
    const fallbackImages: CommunityPostImage[] = imagePreviews.map((image, index) => ({
      alt: image.fileName || "community image",
      id: image.id,
      previewColor: placeholderColors[index % placeholderColors.length],
      type: "local-preview",
    }));

    setSubmitting(true);
    setMessage("");

    try {
      const images: CommunityPostImage[] = fallbackImages;
      const nextPost: CommunityPost = {
        id: draftId,
        communityLocale: targetLocale,
        area: form.area.trim(),
        authorId: currentUser.id || communityLocalUserId,
        authorName: currentUser.name || profileName,
        buddyType: form.type === "buddy" ? form.buddyType.trim() : undefined,
        budget: form.type === "helper" ? form.budget.trim() : undefined,
        commentCount: 0,
        comments: 0,
        condition: form.type === "secondhand" ? form.condition : undefined,
        content: form.content.trim(),
        createdAt: now,
        favoriteCount: 0,
        favorites: 0,
        featured: false,
        featuredReason: undefined,
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
        shareCategory: form.type === "share" ? form.shareCategory : undefined,
        status: needsReview ? "pending" : "published",
        tags: selectedTags,
        time: form.type === "buddy" || form.type === "helper" ? form.time.trim() : undefined,
        title: form.title.trim(),
        type: form.type,
        updatedAt: now,
      };

      const result = await createCommunityPost(nextPost);
      if (result.source === "supabase" && (result.error || !result.data)) {
        setMessage(result.error || "提交失败，请稍后再试。");
        return;
      }

      window.sessionStorage.setItem("japan-life-community-publish-message", needsReview ? "内容已提交，等待审核后显示。" : "发布成功");
      router.push(getCommunityLocaleHref(viewLocale));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="jl-tool-theme min-h-screen text-[#061a3a]">
      <div className="jl-tool-shell mx-auto min-h-screen w-full max-w-[430px] px-4 pb-[136px] pt-4">
        <div className="flex items-center justify-between gap-2">
          <Link className="inline-flex h-9 items-center gap-2 rounded-full bg-white/85 px-4 text-sm font-black text-[#2563EB] shadow-sm ring-1 ring-blue-100" href={getCommunityLocaleHref(viewLocale)}>
            <ArrowLeft className="h-4 w-4" />
            返回
          </Link>
          <span className="rounded-full bg-white/85 px-4 py-2 text-xs font-black text-[#2563EB] shadow-sm ring-1 ring-blue-100">{backLabel}</span>
        </div>

        {message ? <p className="mt-4 rounded-2xl bg-blue-50 px-4 py-3 text-xs font-black text-[#1D4ED8] ring-1 ring-blue-100">{message}</p> : null}
        {!currentUser ? <div className="mt-4"><CommunityLoginRequiredCard /></div> : null}

        <section className="mt-4 rounded-[28px] bg-white/85 p-5 shadow-[0_14px_32px_rgba(15,76,129,0.10)] ring-1 ring-white/80">
          <p className="text-xs font-black text-[#2563EB]">Community Post</p>
          <h1 className="mt-1 text-[26px] font-[850] leading-8 text-[#061a3a]">你想发布什么？</h1>
          <p className="mt-2 text-[13px] font-bold leading-5 text-[#40546f]">添加图片、类型、地区和话题，让大家更快看到你的内容。</p>
        </section>

        <form className="mt-4 grid gap-4" onSubmit={submit}>
          <GlassCard>
            <p className="text-sm font-black text-[#061a3a]">发布类型</p>
            <div className="mt-3 grid grid-cols-1 gap-2">
              {postTypeCards.map((type) => (
                <button className={`rounded-[20px] p-3 text-left transition ${form.type === type.id ? "border border-[rgba(96,165,250,0.75)] bg-[linear-gradient(135deg,rgba(219,234,254,0.95),rgba(255,228,240,0.75))] shadow-[0_10px_24px_rgba(37,99,235,0.12)]" : "border border-slate-200/90 bg-white/75"}`} key={type.id} onClick={() => updateForm("type", type.id)} type="button">
                  <span className="text-sm font-black">{type.label}</span>
                  <span className="mt-1 block text-[12px] font-bold leading-4 text-slate-500">{type.description}</span>
                </button>
              ))}
            </div>
          </GlassCard>

          <ImagePicker disabled={submitting} images={imagePreviews} onAdd={addImages} onRemove={removeImage} />

          <GlassCard>
            <TextInput label="标题" onChange={(value) => updateForm("title", value)} placeholder={titlePlaceholders[form.type]} value={form.title} />
            <label className="mt-3 grid gap-1.5">
              <span className="text-xs font-black text-slate-500">内容</span>
              <textarea className="min-h-32 rounded-[18px] border border-slate-300/85 bg-white/90 px-3.5 py-3 text-sm font-bold leading-[22px] outline-none focus:border-[#2563EB]" onChange={(event) => updateForm("content", event.target.value)} placeholder={contentPlaceholders[form.type]} value={form.content} />
            </label>
            <label className="mt-3 grid gap-1.5">
              <span className="text-xs font-black text-slate-500">地区</span>
              <select className="h-11 rounded-2xl border border-slate-300/85 bg-white/90 px-3.5 text-sm font-bold outline-none focus:border-[#2563EB]" onChange={(event) => updateForm("area", event.target.value)} value={form.area}>
                {communityAreas.map((area) => <option key={area} value={area}>{area}</option>)}
              </select>
            </label>
          </GlassCard>

          <ExtraFields form={form} updateForm={updateForm} />

          <TopicSelector
            onChange={(value) => updateForm("tags", value)}
            onToggle={(tag) => updateForm("tags", toggleTagInput(form.tags, tag))}
            selectedTags={selectedTags}
            suggestedTopics={suggestedTopics}
            value={form.tags}
          />

          <PublishRuleNotice />

          <div className="pt-3">
            <button className="flex h-[50px] w-full items-center justify-center gap-2 rounded-full bg-[linear-gradient(135deg,#2563eb,#38bdf8)] text-[15px] font-[850] text-white shadow-[0_12px_26px_rgba(37,99,235,0.22)] disabled:cursor-not-allowed disabled:opacity-70" disabled={submitting} type="submit">
              <Send className="h-4 w-4" />
              {submitting ? "发布中..." : publishLabel}
            </button>
          </div>
        </form>
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

function ImagePicker({ disabled = false, images, onAdd, onRemove }: { disabled?: boolean; images: ImagePreview[]; onAdd: (event: ChangeEvent<HTMLInputElement>) => void; onRemove: (imageId: string) => void }) {
  return (
    <section className="rounded-[24px] border border-dashed border-[rgba(96,165,250,0.65)] bg-white/80 p-3.5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-black">添加图片</h2>
          <p className="mt-1 text-xs font-bold leading-5 text-slate-500">最多 6 张，第一张会作为封面</p>
        </div>
        <Camera className="h-5 w-5 text-[#2563EB]" />
      </div>
      <div className="mt-3 flex gap-2.5 overflow-x-auto pb-1">
        <label className={`flex h-[92px] w-[92px] shrink-0 flex-col items-center justify-center rounded-[20px] bg-[linear-gradient(135deg,rgba(219,234,254,0.9),rgba(255,228,240,0.8))] text-xs font-black text-[#2563EB] ring-1 ring-blue-100 ${disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}>
          <ImagePlus className="mb-1 h-6 w-6" />
          添加图片
          <input accept="image/jpeg,image/png,image/webp" className="hidden" disabled={disabled} multiple onChange={onAdd} type="file" />
        </label>
        {images.map((image, index) => (
          <div className="relative h-[92px] w-[92px] shrink-0 overflow-hidden rounded-[20px] bg-blue-50" key={image.id}>
            <img alt={image.fileName} className="h-full w-full object-cover" src={image.url} />
            {index === 0 ? <span className="absolute left-1.5 top-1.5 inline-flex h-[22px] items-center rounded-full bg-[rgba(37,99,235,0.88)] px-2 text-[10px] font-black text-white">封面</span> : null}
            <button className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-[rgba(15,23,42,0.64)] text-white disabled:opacity-50" disabled={disabled} onClick={() => onRemove(image.id)} type="button" aria-label="删除图片">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
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

function ExtraFields({ form, updateForm }: { form: FormState; updateForm: <Key extends keyof FormState>(key: Key, value: FormState[Key]) => void }) {
  if (form.type === "secondhand") {
    return (
      <GlassCard>
        <div className="grid gap-3">
          <TextInput label="价格" onChange={(value) => updateForm("price", value)} placeholder="例如 1000円 / 免费 / 可商量" value={form.price} />
          <SelectInput label="交易状态" onChange={(value) => updateForm("itemStatus", value)} options={itemStatusOptions} value={form.itemStatus} />
          <SelectInput label="物品状态" onChange={(value) => updateForm("condition", value)} options={conditionOptions} value={form.condition} />
          <SelectInput label="取货方式" onChange={(value) => updateForm("pickupMethod", value)} options={pickupMethodOptions} value={form.pickupMethod} />
          <HintText>建议填写价格，方便对方判断是否联系你。</HintText>
        </div>
      </GlassCard>
    );
  }

  if (form.type === "buddy") {
    return (
      <GlassCard>
        <div className="grid gap-3">
          <SelectInput label="搭子类型" onChange={(value) => updateForm("buddyType", value)} options={buddyTypeOptions} placeholder="请选择搭子类型" value={form.buddyType} />
          <TextInput label="时间" onChange={(value) => updateForm("time", value)} placeholder="例如 周六下午 / 平日晚上" value={form.time} />
          <TextInput label="人数" onChange={(value) => updateForm("people", value)} placeholder="例如 1人 / 1-2人 / 不限" value={form.people} />
          <HintText>建议填写搭子类型，大家更容易看懂你的邀请。</HintText>
        </div>
      </GlassCard>
    );
  }

  if (form.type === "helper") {
    return (
      <GlassCard>
        <div className="grid gap-3">
          <SelectInput label="帮忙类型" onChange={(value) => updateForm("helperCategory", value)} options={helperCategoryOptions} placeholder="请选择帮忙类型" value={form.helperCategory} />
          <TextInput label="预算" onChange={(value) => updateForm("budget", value)} placeholder="例如 2000円 / 可商量" value={form.budget} />
          <TextInput label="时间" onChange={(value) => updateForm("time", value)} placeholder="例如 今天晚上 / 周末 / 平日白天" value={form.time} />
          <HintText>建议填写预算和时间，避免反复沟通。</HintText>
        </div>
      </GlassCard>
    );
  }

  if (form.type === "help") {
    return (
      <GlassCard>
        <SelectInput label="求助分类" onChange={(value) => updateForm("helpCategory", value)} options={helpCategoryOptions} placeholder="请选择求助分类" value={form.helpCategory} />
        <HintText>新求助默认未解决，之后可以继续补充进展。</HintText>
      </GlassCard>
    );
  }

  return (
    <GlassCard>
      <SelectInput label="分享分类" onChange={(value) => updateForm("shareCategory", value)} options={shareCategoryOptions} placeholder="请选择分享分类" value={form.shareCategory} />
    </GlassCard>
  );
}

function SelectInput({ label, onChange, options, placeholder, value }: { label: string; onChange: (value: string) => void; options: string[]; placeholder?: string; value: string }) {
  return (
    <label className="grid gap-1.5">
      <span className="text-xs font-black text-slate-500">{label}</span>
      <select className="h-11 rounded-2xl border border-slate-300/85 bg-white/90 px-3.5 text-sm font-bold outline-none focus:border-[#2563EB]" onChange={(event) => onChange(event.target.value)} value={value}>
        {placeholder ? <option value="">{placeholder}</option> : null}
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    </label>
  );
}

function TopicSelector({ onChange, onToggle, selectedTags, suggestedTopics, value }: { onChange: (value: string) => void; onToggle: (tag: string) => void; selectedTags: string[]; suggestedTopics: string[]; value: string }) {
  return (
    <GlassCard>
      <label className="grid gap-1.5">
        <span className="text-sm font-black text-[#061a3a]">话题标签</span>
        <input className="h-11 rounded-2xl border border-slate-300/85 bg-white/90 px-3.5 text-sm font-bold outline-none placeholder:text-slate-400 focus:border-[#2563EB]" onChange={(event) => onChange(event.target.value)} placeholder="输入或选择话题，例如 池袋美食、省钱生活" value={value} />
      </label>
      {selectedTags.length ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {selectedTags.map((tag) => (
            <button className="h-8 rounded-full bg-[#2563EB] px-3 text-[11px] font-black text-white" key={tag} onClick={() => onToggle(tag)} type="button">
              #{tag} ×
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
      <p className="mt-2 text-[11px] font-bold text-slate-400">最多选择 5 个话题，会自动去掉 #、空格和重复项。</p>
    </GlassCard>
  );
}

function PublishRuleNotice() {
  return (
    <section className="rounded-[22px] border border-[rgba(226,232,240,0.85)] bg-[rgba(255,255,255,0.82)] p-[14px] shadow-[0_10px_24px_rgba(15,76,129,0.07)]">
      <div className="flex items-center gap-2 text-[14px] font-[850] text-[#061a3a]">
        <ShieldCheck className="h-5 w-5 text-[#2563EB]" />
        发布前请确认
      </div>
      <ul className="mt-2 space-y-1.5 text-[12px] font-bold leading-[19px] text-[#40546f]">
        <li className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#2563EB]" />请勿发布违法、诈骗、色情、赌博、虚假招聘等内容</li>
        <li className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#2563EB]" />请勿公开他人个人信息</li>
        <li className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#2563EB]" />闲置、搭子、帮忙等线下联系请自行确认安全</li>
        <li className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#2563EB]" />{communitySafetyDisclaimer}</li>
      </ul>
    </section>
  );
}

function HintText({ children }: { children: ReactNode }) {
  return <p className="rounded-2xl bg-blue-50/80 px-3 py-2 text-xs font-bold leading-5 text-slate-500 ring-1 ring-blue-100">{children}</p>;
}

function validateForm(form: FormState) {
  if (!form.title.trim()) return "请填写标题";
  if (!form.content.trim()) return "请填写内容";
  if (!form.area.trim()) return "请选择地区";
  if (!form.type) return "请选择发布类型";
  return "";
}

function toggleTagInput(value: string, tag: string) {
  const tags = parseCommunityTags(value);
  const nextTags = tags.includes(tag) ? tags.filter((item) => item !== tag) : [...tags, tag].slice(0, 5);
  return nextTags.join(" ");
}
