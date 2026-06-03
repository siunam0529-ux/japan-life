"use client";

import type { User } from "@supabase/supabase-js";
import { ArrowLeft, BriefcaseBusiness, CheckCircle2, ShieldCheck } from "lucide-react";
import Link from "next/link";
import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { useLanguage } from "@/hooks/useLanguage";
import { clearLifeHelperPreloadCache } from "@/lib/appPreload";
import { createLifeHelperBusinessApplication } from "@/lib/lifeHelper/api";
import { businessServiceCategories, helperLanguageOptions, lifeHelperServiceLanguageTags, type LifeHelperBusinessCategory, type LifeHelperLanguage, type LifeHelperServiceLanguageTag } from "@/lib/lifeHelper/join";
import { withBackFrom } from "@/lib/navigation/back";
import { supabase } from "@/lib/supabase";

const initialForm = {
  area: "",
  businessHours: "",
  businessName: "",
  category: "清洁打扫" as LifeHelperBusinessCategory,
  contactName: "",
  description: "",
  email: "",
  languages: ["中文", "日语"] as LifeHelperLanguage[],
  lineId: "",
  notes: "",
  phone: "",
  priceInfo: "",
  serviceLanguageTag: "中日双语" as LifeHelperServiceLanguageTag,
  website: "",
};

const zhCnBusinessJoinCopy = {
  back: "返回",
  badge: "商家入驻",
  title: "商家 / 公司入驻",
  subtitle: "提交你的服务信息，审核通过后可以展示给附近用户。",
  loginRequired: "请先登录后再提交入驻申请。",
  login: "去登录",
  submitted: "已提交商家入驻申请，请等待审核。通过后会展示到生活帮手列表。",
  submitFail: "商家入驻申请提交失败。",
  submitting: "提交中...",
  backToLifeHelper: "回到生活帮手查看",
  businessName: "店铺 / 公司名称（必填）",
  category: "服务分类（必填）",
  area: "服务地区（必填）",
  areaPlaceholder: "例如：新宿 / 池袋 / 东京都内",
  contactName: "联系人（必填）",
  phone: "电话",
  email: "邮箱",
  contactRequired: "电话、邮箱、LINE ID 至少填写一个。",
  website: "官网 / SNS",
  description: "服务介绍（必填）",
  price: "价格说明",
  pricePlaceholder: "例如：3,000日元起 / 按内容报价",
  hours: "营业时间",
  hoursPlaceholder: "例如：平日 10:00-18:00",
  serviceLanguageTag: "服务语言标签（筛选用）",
  languages: "支持语言",
  notes: "备注",
  submit: "提交入驻申请",
  safetyTitle: "隐私和安全提示",
  safety: ["请填写真实服务信息，平台会对入驻信息进行审核。", "请勿发布违法、虚假、骚扰或高风险服务。", "线下交易请自行确认身份、费用和服务范围。"],
} as const;

const businessJoinCopy = { "zh-CN": zhCnBusinessJoinCopy, "zh-TW": zhCnBusinessJoinCopy, ja: zhCnBusinessJoinCopy } as const;

export default function LifeHelperBusinessJoinPage() {
  const { language } = useLanguage();
  const text = businessJoinCopy[language];
  const [form, setForm] = useState(initialForm);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    if (!supabase) return;
    let mounted = true;
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

  const hasContact = form.phone.trim() || form.email.trim() || form.lineId.trim();
  const canSubmit = form.businessName.trim() && form.area.trim() && form.contactName.trim() && form.description.trim() && hasContact;

  function toggleLanguage(language: LifeHelperLanguage) {
    setForm((current) => ({
      ...current,
      languages: current.languages.includes(language) ? current.languages.filter((item) => item !== language) : [...current.languages, language],
    }));
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
      await createLifeHelperBusinessApplication(form);
      clearLifeHelperPreloadCache();
      setForm(initialForm);
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
              <BriefcaseBusiness className="h-6 w-6" />
            </span>
            <div>
              <p className="text-xs font-black text-[#2563EB]">Business Join</p>
              <h1 className="mt-1 text-2xl font-black leading-tight">{text.title}</h1>
              <p className="mt-2 text-sm font-bold leading-6 text-slate-600">{text.subtitle}</p>
            </div>
          </div>
        </section>

        {!user ? (
          <section className="rounded-[26px] border border-blue-100 bg-white/88 p-4 text-sm font-bold leading-6 text-slate-600 shadow-sm">
            {text.loginRequired}
            <Link className="font-black text-[#2563EB] underline" href={withBackFrom("/login?next=/life-helper/join/business")}>{text.login}</Link>
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
          <TextInput label={text.businessName} onChange={(value) => setForm((current) => ({ ...current, businessName: value }))} value={form.businessName} />
          <label className="grid gap-1.5">
            <span className="text-xs font-black text-slate-500">{text.category}</span>
            <select className="h-11 rounded-[14px] border border-slate-300/80 bg-white/85 px-3 text-sm font-bold outline-none focus:border-[#2563EB]" onChange={(event) => setForm((current) => ({ ...current, category: event.target.value as LifeHelperBusinessCategory }))} value={form.category}>
              {businessServiceCategories.map((category) => <option key={category} value={category}>{category}</option>)}
            </select>
          </label>
          <TextInput label={text.area} onChange={(value) => setForm((current) => ({ ...current, area: value }))} placeholder={text.areaPlaceholder} value={form.area} />
          <TextInput label={text.contactName} onChange={(value) => setForm((current) => ({ ...current, contactName: value }))} value={form.contactName} />
          <div className="grid grid-cols-1 gap-3 min-[390px]:grid-cols-3">
            <TextInput label={text.phone} onChange={(value) => setForm((current) => ({ ...current, phone: value }))} value={form.phone} />
            <TextInput label={text.email} onChange={(value) => setForm((current) => ({ ...current, email: value }))} value={form.email} />
            <TextInput label="LINE ID" onChange={(value) => setForm((current) => ({ ...current, lineId: value }))} value={form.lineId} />
          </div>
          {!hasContact ? <p className="text-xs font-black text-rose-600">{text.contactRequired}</p> : null}
          <TextInput label={text.website} onChange={(value) => setForm((current) => ({ ...current, website: value }))} value={form.website} />
          <Textarea label={text.description} onChange={(value) => setForm((current) => ({ ...current, description: value }))} value={form.description} />
          <TextInput label={text.price} onChange={(value) => setForm((current) => ({ ...current, priceInfo: value }))} placeholder={text.pricePlaceholder} value={form.priceInfo} />
          <TextInput label={text.hours} onChange={(value) => setForm((current) => ({ ...current, businessHours: value }))} placeholder={text.hoursPlaceholder} value={form.businessHours} />
          <SingleSelect label={text.serviceLanguageTag} options={lifeHelperServiceLanguageTags} selected={form.serviceLanguageTag} onSelect={(value) => setForm((current) => ({ ...current, serviceLanguageTag: value }))} />
          <MultiSelect label={text.languages} selected={form.languages} onToggle={toggleLanguage} />
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
  const text = businessJoinCopy[language];
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

function MultiSelect({ label, onToggle, selected }: { label: string; onToggle: (value: LifeHelperLanguage) => void; selected: LifeHelperLanguage[] }) {
  return (
    <div>
      <p className="text-xs font-black text-slate-500">{label}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {helperLanguageOptions.map((language) => (
          <button className={`rounded-full border px-3 py-2 text-xs font-black ${selected.includes(language) ? "border-[#2563EB] bg-[#2563EB] text-white" : "border-blue-100 bg-white text-slate-600"}`} key={language} onClick={() => onToggle(language)} type="button">
            {language}
          </button>
        ))}
      </div>
    </div>
  );
}

function SingleSelect<T extends string>({ label, onSelect, options, selected }: { label: string; onSelect: (value: T) => void; options: readonly T[]; selected: T }) {
  return (
    <div>
      <p className="text-xs font-black text-slate-500">{label}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {options.map((option) => (
          <button className={`rounded-full border px-3 py-2 text-xs font-black ${selected === option ? "border-[#2563EB] bg-[#2563EB] text-white" : "border-blue-100 bg-white text-slate-600"}`} key={option} onClick={() => onSelect(option)} type="button">
            {option}
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
