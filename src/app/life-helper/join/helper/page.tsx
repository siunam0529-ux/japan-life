"use client";

import type { User } from "@supabase/supabase-js";
import { ArrowLeft, CheckCircle2, Plus, ShieldCheck, Trash2, UserRoundCheck } from "lucide-react";
import Link from "next/link";
import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { useLanguage } from "@/hooks/useLanguage";
import { clearLifeHelperPreloadCache } from "@/lib/appPreload";
import { readMeProfile } from "@/lib/account/profile";
import { createLifeHelperPersonalApplication } from "@/lib/lifeHelper/api";
import { createLifeHelperContactMethod, getLifeHelperContactTypeLabel, getLifeHelperLanguageLabel, getLifeHelperPersonalServiceLabel, getLifeHelperServiceLanguageTagLabel, helperLanguageOptions, lifeHelperServiceLanguageTags, personalServiceOptions, type LifeHelperContactMethod, type LifeHelperContactType, type LifeHelperLanguage, type LifeHelperPersonalService, type LifeHelperServiceLanguageTag } from "@/lib/lifeHelper/join";
import { withBackFrom } from "@/lib/navigation/back";
import { supabase } from "@/lib/supabase";

const contactTypes = ["微信", "LINE", "邮箱", "电话", "其他"] as const satisfies readonly LifeHelperContactType[];

function createInitialContactMethods(): LifeHelperContactMethod[] {
  return [createLifeHelperContactMethod("微信")];
}

const initialForm = {
  area: "",
  availableTime: "",
  contact: "",
  contactMethods: createInitialContactMethods(),
  contactType: "微信" as LifeHelperContactType,
  displayName: "",
  experience: "",
  languages: ["中文", "日语"] as LifeHelperLanguage[],
  notes: "",
  priceExpectation: "",
  serviceLanguageTag: "中日双语" as LifeHelperServiceLanguageTag,
  selfIntro: "",
  services: ["跑腿代办"] as LifeHelperPersonalService[],
};

const zhCnHelperJoinCopy = {
  back: "返回",
  badge: "个人帮手",
  eyebrow: "个人帮手入驻",
  title: "个人帮手入驻",
  subtitle: "登记你可以提供的生活帮忙服务。",
  loginRequired: "请先登录后再提交入驻申请。",
  login: "去登录",
  submitted: "已提交帮手申请，请等待审核。通过后会展示到生活帮手列表。",
  submitFail: "帮手申请提交失败。",
  submitting: "提交中...",
  backToLifeHelper: "回到生活帮手查看",
  displayName: "昵称（必填）",
  services: "可提供服务（必填）",
  serviceRequired: "请至少选择一项服务。",
  area: "服务地区（必填）",
  areaPlaceholder: "例如：池袋 / 板桥 / 线上",
  availableTime: "可服务时间",
  timePlaceholder: "例如：周末 / 平日傍晚",
  contactType: "联系方式类型",
  contact: "联系方式（必填）",
  addContact: "添加联系方式",
  removeContact: "删除",
  serviceLanguageTag: "服务语言标签（筛选用）",
  languages: "支持语言",
  experience: "相关经验",
  price: "希望报酬",
  pricePlaceholder: "例如：1,500日元起 / 可商量",
  selfIntro: "自我介绍（必填）",
  notes: "备注",
  submit: "提交帮手申请",
  safetyTitle: "隐私和安全提示",
  safety: ["请填写真实服务信息，平台会对入驻信息进行审核。", "请勿发布违法、虚假、骚扰或高风险服务。", "涉及进入他人住所、宠物照顾、钥匙保管、金钱代办等情况，请双方提前确认风险和责任。"],
} as const;

const zhTwHelperJoinCopy = {
  ...zhCnHelperJoinCopy,
  badge: "個人幫手",
  eyebrow: "個人幫手入駐",
  title: "個人幫手入駐",
  subtitle: "登記你可以提供的生活幫忙服務。",
  loginRequired: "請先登入後再提交入駐申請。",
  login: "去登入",
  submitted: "已提交幫手申請，請等待審核。通過後會展示到生活幫手列表。",
  submitFail: "幫手申請提交失敗。",
  submitting: "提交中...",
  backToLifeHelper: "回到生活幫手查看",
  displayName: "暱稱（必填）",
  services: "可提供服務（必填）",
  serviceRequired: "請至少選擇一項服務。",
  area: "服務地區（必填）",
  areaPlaceholder: "例如：池袋 / 板橋 / 線上",
  availableTime: "可服務時間",
  timePlaceholder: "例如：週末 / 平日傍晚",
  contactType: "聯絡方式類型",
  contact: "聯絡方式（必填）",
  addContact: "新增聯絡方式",
  removeContact: "刪除",
  serviceLanguageTag: "服務語言標籤（篩選用）",
  languages: "支援語言",
  experience: "相關經驗",
  price: "希望報酬",
  pricePlaceholder: "例如：1,500日圓起 / 可商量",
  selfIntro: "自我介紹（必填）",
  notes: "備註",
  submit: "提交幫手申請",
  safetyTitle: "隱私和安全提示",
  safety: ["請填寫真實服務資訊，平台會對入駐資訊進行審核。", "請勿發布違法、虛假、騷擾或高風險服務。", "涉及進入他人住所、寵物照顧、鑰匙保管、金錢代辦等情況，請雙方提前確認風險和責任。"],
} as const;

const jaHelperJoinCopy = {
  ...zhCnHelperJoinCopy,
  back: "戻る",
  badge: "個人サポーター",
  eyebrow: "サポーター登録",
  title: "個人サポーター登録",
  subtitle: "提供できる暮らしのサポートサービスを登録します。",
  loginRequired: "登録申請を送信するには先にログインしてください。",
  login: "ログイン",
  submitted: "サポーター申請を送信しました。審査をお待ちください。承認後、暮らしサポート一覧に表示されます。",
  submitFail: "サポーター申請の送信に失敗しました。",
  submitting: "送信中...",
  backToLifeHelper: "暮らしサポートへ戻る",
  displayName: "表示名（必須）",
  services: "提供できるサービス（必須）",
  serviceRequired: "サービスを1つ以上選択してください。",
  area: "対応エリア（必須）",
  areaPlaceholder: "例：池袋 / 板橋 / オンライン",
  availableTime: "対応可能時間",
  timePlaceholder: "例：週末 / 平日夕方",
  contactType: "連絡先タイプ",
  contact: "連絡先（必須）",
  addContact: "連絡先を追加",
  removeContact: "削除",
  serviceLanguageTag: "対応言語タグ（絞り込み用）",
  languages: "対応言語",
  experience: "関連経験",
  price: "希望報酬",
  pricePlaceholder: "例：1,500円から / 相談可",
  selfIntro: "自己紹介（必須）",
  notes: "備考",
  submit: "サポーター申請を送信",
  safetyTitle: "プライバシーと安全の注意",
  safety: ["正確なサービス情報を入力してください。プラットフォームが登録内容を審査します。", "違法、虚偽、迷惑行為、高リスクなサービスは投稿しないでください。", "他人の住居への立ち入り、ペットのお世話、鍵の預かり、金銭の代行などは、事前に双方でリスクと責任を確認してください。"],
} as const;

const helperJoinCopy = { "zh-CN": zhCnHelperJoinCopy, "zh-TW": zhTwHelperJoinCopy, ja: jaHelperJoinCopy } as const;

export default function LifeHelperPersonalJoinPage() {
  const { language } = useLanguage();
  const text = helperJoinCopy[language];
  const [form, setForm] = useState(initialForm);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    if (!supabase) return;
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (mounted) {
        setUser(data.session?.user ?? null);
        applyMeProfile(data.session?.user ?? null);
      }
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) {
        setUser(session?.user ?? null);
        applyMeProfile(session?.user ?? null);
      }
    });
    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const canSubmit = form.displayName.trim() && form.area.trim() && hasContactMethod(form.contactMethods) && form.selfIntro.trim() && form.services.length > 0;

  function applyMeProfile(nextUser: User | null) {
    if (!nextUser) return;
    const profile = readMeProfile(nextUser);
    setForm((current) => ({
      ...current,
      displayName: current.displayName.trim() ? current.displayName : profile.displayName,
      selfIntro: current.selfIntro.trim() ? current.selfIntro : profile.bio,
    }));
  }

  function toggleLanguage(language: LifeHelperLanguage) {
    setForm((current) => ({
      ...current,
      languages: current.languages.includes(language) ? current.languages.filter((item) => item !== language) : [...current.languages, language],
    }));
  }

  function toggleService(service: LifeHelperPersonalService) {
    setForm((current) => ({
      ...current,
      services: current.services.includes(service) ? current.services.filter((item) => item !== service) : [...current.services, service],
    }));
  }

  function updateContactMethod(id: string, patch: Partial<Pick<LifeHelperContactMethod, "type" | "value">>) {
    setForm((current) => ({
      ...current,
      contactMethods: current.contactMethods.map((method) => method.id === id ? { ...method, ...patch } : method),
      contactType: patch.type ?? current.contactType,
    }));
  }

  function addContactMethod() {
    setForm((current) => ({
      ...current,
      contactMethods: [...current.contactMethods, createLifeHelperContactMethod("微信")],
    }));
  }

  function removeContactMethod(id: string) {
    setForm((current) => {
      const nextMethods = current.contactMethods.filter((method) => method.id !== id);
      return {
        ...current,
        contactMethods: nextMethods.length ? nextMethods : createInitialContactMethods(),
      };
    });
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) {
      setMessage(text.loginRequired);
      return;
    }
    if (!canSubmit) return;
    setSubmitting(true);
    setMessage("");
    try {
      await createLifeHelperPersonalApplication({
        ...form,
        contact: form.contactMethods.find((method) => method.value.trim())?.value || "",
        contactMethods: form.contactMethods,
        contactType: form.contactMethods.find((method) => method.value.trim())?.type || form.contactType,
      });
      clearLifeHelperPreloadCache();
      setForm({ ...initialForm, contactMethods: createInitialContactMethods() });
      setMessage(text.submitted);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : text.submitFail);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="jl-tool-theme min-h-screen text-[#061a3a]">
      <div className="jl-tool-shell mx-auto flex min-h-screen w-full max-w-[430px] flex-col gap-4 px-4 pb-28 pt-5">
        <Header />

        <section className="rounded-[28px] border border-white/80 bg-white/88 p-5 shadow-[0_18px_40px_rgba(37,99,235,0.12)] backdrop-blur">
          <div className="flex items-start gap-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/80 text-[#2563EB] shadow-sm ring-1 ring-blue-100">
              <UserRoundCheck className="h-6 w-6" />
            </span>
            <div>
              <p className="text-xs font-black text-[#2563EB]">{text.eyebrow}</p>
              <h1 className="mt-1 text-2xl font-black leading-tight">{text.title}</h1>
              <p className="mt-2 text-sm font-bold leading-6 text-slate-600">{text.subtitle}</p>
            </div>
          </div>
        </section>

        {!user ? (
          <section className="rounded-[26px] border border-blue-100 bg-white/88 p-4 text-sm font-bold leading-6 text-slate-600 shadow-sm">
            {text.loginRequired}
            <Link className="font-black text-[#2563EB] underline" href={withBackFrom("/login?next=/life-helper/join/helper")}>{text.login}</Link>
          </section>
        ) : null}

        {message ? (
          <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-xs font-black leading-5 text-[#1D4ED8]">
            <p>{message}</p>
            <Link className="mt-2 inline-flex h-9 items-center justify-center rounded-full bg-[#2563EB] px-4 text-xs font-black text-white" href="/life-helper">
              {text.backToLifeHelper}
            </Link>
          </div>
        ) : null}

        <form className="grid gap-3 rounded-[28px] border border-white/80 bg-white/88 p-4 shadow-[0_14px_32px_rgba(37,99,235,0.09)]" onSubmit={submit}>
          <TextInput label={text.displayName} onChange={(value) => setForm((current) => ({ ...current, displayName: value }))} value={form.displayName} />
          <MultiSelect displayLanguage={language} label={text.services} options={personalServiceOptions} selected={form.services} labelForOption={getLifeHelperPersonalServiceLabel} onToggle={toggleService} />
          {form.services.length === 0 ? <p className="text-xs font-black text-rose-600">{text.serviceRequired}</p> : null}
          <TextInput label={text.area} onChange={(value) => setForm((current) => ({ ...current, area: value }))} placeholder={text.areaPlaceholder} value={form.area} />
          <TextInput label={text.availableTime} onChange={(value) => setForm((current) => ({ ...current, availableTime: value }))} placeholder={text.timePlaceholder} value={form.availableTime} />
          <ContactMethodsEditor addLabel={text.addContact} contactLabel={text.contact} contactTypeLabel={text.contactType} displayLanguage={language} methods={form.contactMethods} onAdd={addContactMethod} onRemove={removeContactMethod} onUpdate={updateContactMethod} removeLabel={text.removeContact} />
          <SingleSelect displayLanguage={language} label={text.serviceLanguageTag} options={lifeHelperServiceLanguageTags} selected={form.serviceLanguageTag} labelForOption={getLifeHelperServiceLanguageTagLabel} onSelect={(value) => setForm((current) => ({ ...current, serviceLanguageTag: value }))} />
          <MultiSelect displayLanguage={language} label={text.languages} options={helperLanguageOptions} selected={form.languages} labelForOption={getLifeHelperLanguageLabel} onToggle={toggleLanguage} />
          <Textarea label={text.experience} onChange={(value) => setForm((current) => ({ ...current, experience: value }))} value={form.experience} />
          <TextInput label={text.price} onChange={(value) => setForm((current) => ({ ...current, priceExpectation: value }))} placeholder={text.pricePlaceholder} value={form.priceExpectation} />
          <Textarea label={text.selfIntro} onChange={(value) => setForm((current) => ({ ...current, selfIntro: value }))} value={form.selfIntro} />
          <Textarea label={text.notes} onChange={(value) => setForm((current) => ({ ...current, notes: value }))} value={form.notes} />
          <SafetyNotice safety={text.safety} title={text.safetyTitle} />
          <button className="h-12 rounded-full bg-[linear-gradient(135deg,#2563eb,#38bdf8)] text-sm font-black text-white disabled:cursor-not-allowed disabled:bg-slate-300 disabled:bg-none" disabled={!canSubmit || !user || submitting} type="submit">
            {submitting ? text.submitting : text.submit}
          </button>
        </form>
      </div>
    </main>
  );
}

function Header() {
  const { language } = useLanguage();
  const text = helperJoinCopy[language];
  return (
    <div className="flex items-center justify-between">
      <Link className="inline-flex h-9 items-center gap-2 rounded-full bg-white/85 px-4 text-sm font-black text-[#2563EB] shadow-sm ring-1 ring-blue-100" href="/life-helper/join">
        <ArrowLeft className="h-4 w-4" />
        {text.back}
      </Link>
      <span className="rounded-full bg-white/85 px-4 py-2 text-xs font-black text-[#2563EB] shadow-sm ring-1 ring-blue-100">{text.badge}</span>
    </div>
  );
}

function hasContactMethod(methods: LifeHelperContactMethod[]) {
  return methods.some((method) => method.value.trim());
}

function ContactMethodsEditor({
  addLabel,
  contactLabel,
  contactTypeLabel,
  displayLanguage,
  methods,
  onAdd,
  onRemove,
  onUpdate,
  removeLabel,
}: {
  addLabel: string;
  contactLabel: string;
  contactTypeLabel: string;
  displayLanguage: ReturnType<typeof useLanguage>["language"];
  methods: LifeHelperContactMethod[];
  onAdd: () => void;
  onRemove: (id: string) => void;
  onUpdate: (id: string, patch: Partial<Pick<LifeHelperContactMethod, "type" | "value">>) => void;
  removeLabel: string;
}) {
  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-black text-slate-500">{contactLabel}</p>
        <button className="inline-flex h-8 items-center gap-1 rounded-full bg-blue-50 px-3 text-xs font-black text-[#2563EB] ring-1 ring-blue-100" onClick={onAdd} type="button">
          <Plus className="h-4 w-4" />
          {addLabel}
        </button>
      </div>
      {methods.map((method, index) => (
        <div className="grid grid-cols-[112px_1fr_auto] gap-2" key={method.id}>
          <label className="grid gap-1.5">
            <span className="text-[10px] font-black text-slate-500">{contactTypeLabel}</span>
            <select className="h-11 rounded-[14px] border border-slate-300/80 bg-white/85 px-3 text-sm font-bold outline-none focus:border-[#2563EB]" onChange={(event) => onUpdate(method.id, { type: event.target.value as LifeHelperContactType })} value={method.type}>
              {contactTypes.map((type) => <option key={type} value={type}>{getLifeHelperContactTypeLabel(type, displayLanguage)}</option>)}
            </select>
          </label>
          <label className="grid gap-1.5">
            <span className="text-[10px] font-black text-slate-500">{contactLabel}</span>
            <input className="h-11 rounded-[14px] border border-slate-300/80 bg-white/85 px-3 text-sm font-bold outline-none focus:border-[#2563EB]" onChange={(event) => onUpdate(method.id, { value: event.target.value })} value={method.value} />
          </label>
          <button aria-label={removeLabel} className="mt-[18px] flex h-11 w-11 items-center justify-center rounded-[14px] border border-rose-100 bg-white text-rose-600 disabled:text-slate-300" disabled={methods.length === 1 && index === 0} onClick={() => onRemove(method.id)} title={removeLabel} type="button">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}

function TextInput({ label, onChange, placeholder = "", value }: { label: string; onChange: (value: string) => void; placeholder?: string; value: string }) {
  return (
    <label className="grid gap-1.5">
      <span className="text-xs font-black text-slate-500">{label}</span>
      <input className="h-11 rounded-[14px] border border-slate-300/80 bg-white/85 px-3 text-sm font-bold outline-none focus:border-[#2563EB]" onChange={(event) => onChange(event.target.value)} placeholder={placeholder} value={value} />
    </label>
  );
}

function Textarea({ label, onChange, value }: { label: string; onChange: (value: string) => void; value: string }) {
  return (
    <label className="grid gap-1.5">
      <span className="text-xs font-black text-slate-500">{label}</span>
      <textarea className="min-h-24 resize-none rounded-2xl border border-slate-300/80 bg-white/85 px-3 py-3 text-sm font-bold outline-none focus:border-[#2563EB]" onChange={(event) => onChange(event.target.value)} value={value} />
    </label>
  );
}

function MultiSelect<T extends string>({ displayLanguage, label, labelForOption, onToggle, options, selected }: { displayLanguage: ReturnType<typeof useLanguage>["language"]; label: string; labelForOption: (value: string, language: ReturnType<typeof useLanguage>["language"]) => string; onToggle: (value: T) => void; options: readonly T[]; selected: T[] }) {
  return (
    <div>
      <p className="text-xs font-black text-slate-500">{label}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {options.map((option) => (
          <button className={`rounded-full border px-3 py-2 text-xs font-black ${selected.includes(option) ? "border-[#2563EB] bg-[#2563EB] text-white" : "border-blue-100 bg-white text-slate-600"}`} key={option} onClick={() => onToggle(option)} type="button">
            {labelForOption(option, displayLanguage)}
          </button>
        ))}
      </div>
    </div>
  );
}

function SingleSelect<T extends string>({ displayLanguage, label, labelForOption, onSelect, options, selected }: { displayLanguage: ReturnType<typeof useLanguage>["language"]; label: string; labelForOption: (value: string, language: ReturnType<typeof useLanguage>["language"]) => string; onSelect: (value: T) => void; options: readonly T[]; selected: T }) {
  return (
    <div>
      <p className="text-xs font-black text-slate-500">{label}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {options.map((option) => (
          <button className={`rounded-full border px-3 py-2 text-xs font-black ${selected === option ? "border-[#2563EB] bg-[#2563EB] text-white" : "border-blue-100 bg-white text-slate-600"}`} key={option} onClick={() => onSelect(option)} type="button">
            {labelForOption(option, displayLanguage)}
          </button>
        ))}
      </div>
    </div>
  );
}

function SafetyNotice({ safety, title }: { safety: readonly string[]; title: string }) {
  return (
    <section className="rounded-2xl bg-blue-50/80 p-3 text-xs font-bold leading-5 text-slate-600 ring-1 ring-blue-100">
      <div className="flex items-center gap-2 text-sm font-black text-[#1D4ED8]">
        <ShieldCheck className="h-5 w-5" />
        {title}
      </div>
      <ul className="mt-2 space-y-1.5">
        {safety.map((item) => <li className="flex gap-2" key={item}><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#2563EB]" />{item}</li>)}
      </ul>
    </section>
  );
}
