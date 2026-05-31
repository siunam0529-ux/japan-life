"use client";

import type { User } from "@supabase/supabase-js";
import { ArrowLeft, CheckCircle2, ShieldCheck, UserRoundCheck } from "lucide-react";
import Link from "next/link";
import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { createLifeHelperId } from "@/lib/lifeHelper/storage";
import { helperLanguageOptions, lifeHelperServiceLanguageTags, personalServiceOptions, readLifeHelperPersonalApplications, writeLifeHelperPersonalApplications, type LifeHelperContactType, type LifeHelperLanguage, type LifeHelperPersonalApplication, type LifeHelperPersonalService, type LifeHelperServiceLanguageTag } from "@/lib/lifeHelper/join";
import { useLanguage } from "@/hooks/useLanguage";
import { supabase } from "@/lib/supabase";

const initialForm = {
  area: "",
  availableTime: "",
  contact: "",
  contactType: "LINE" as LifeHelperContactType,
  displayName: "",
  experience: "",
  languages: ["中文", "日语"] as LifeHelperLanguage[],
  notes: "",
  priceExpectation: "",
  serviceLanguageTag: "中日双语" as LifeHelperServiceLanguageTag,
  selfIntro: "",
  services: ["跑腿代办"] as LifeHelperPersonalService[],
};

const helperJoinCopy = {
  "zh-CN": {
    back: "返回",
    badge: "个人帮手",
    title: "个人帮手入驻",
    subtitle: "登记你可以提供的生活帮忙服务。",
    loginRequired: "请先登录后再提交入驻申请。",
    login: "去登录",
    submitted: "已提交帮手申请，请等待审核。",
    displayName: "昵称（必填）",
    services: "可提供服务（必填）",
    serviceRequired: "请至少选择一项服务。",
    area: "服务地区（必填）",
    areaPlaceholder: "例如：池袋 / 板桥 / 线上",
    availableTime: "可服务时间",
    timePlaceholder: "例如：周末 / 平日傍晚",
    contactType: "联系方式类型",
    contact: "联系方式（必填）",
    serviceLanguageTag: "服务语言标签（筛选用）",
    languages: "支持语言",
    experience: "相关经验",
    price: "希望报酬",
    pricePlaceholder: "例如：1,500円起 / 可商量",
    selfIntro: "自我介绍（必填）",
    notes: "备注",
    submit: "提交帮手申请",
    safetyTitle: "隐私和安全提示",
    safety: ["请填写真实服务信息，平台会对入驻信息进行审核。", "请勿发布违法、虚假、骚扰或高风险服务。", "涉及进入他人住所、宠物照顾、钥匙保管、金钱代办等情况，请双方提前确认风险和责任。"],
  },
  "zh-TW": {
    back: "返回",
    badge: "個人幫手",
    title: "個人幫手入駐",
    subtitle: "登記你可以提供的生活幫忙服務。",
    loginRequired: "請先登入後再提交入駐申請。",
    login: "去登入",
    submitted: "已提交幫手申請，請等待審核。",
    displayName: "暱稱（必填）",
    services: "可提供服務（必填）",
    serviceRequired: "請至少選擇一項服務。",
    area: "服務地區（必填）",
    areaPlaceholder: "例如：池袋 / 板橋 / 線上",
    availableTime: "可服務時間",
    timePlaceholder: "例如：週末 / 平日傍晚",
    contactType: "聯絡方式類型",
    contact: "聯絡方式（必填）",
    serviceLanguageTag: "服務語言標籤（篩選用）",
    languages: "支援語言",
    experience: "相關經驗",
    price: "希望報酬",
    pricePlaceholder: "例如：1,500円起 / 可商量",
    selfIntro: "自我介紹（必填）",
    notes: "備註",
    submit: "提交幫手申請",
    safetyTitle: "隱私和安全提示",
    safety: ["請填寫真實服務資訊，平台會對入駐資訊進行審核。", "請勿發布違法、虛假、騷擾或高風險服務。", "涉及進入他人住所、寵物照顧、鑰匙保管、金錢代辦等情況，請雙方提前確認風險和責任。"],
  },
  ja: {
    back: "戻る",
    badge: "個人サポーター",
    title: "個人サポーター登録",
    subtitle: "提供できる暮らしのサポート内容を登録します。",
    loginRequired: "申請するには先にログインしてください。",
    login: "ログインへ",
    submitted: "サポーター申請を送信しました。審査をお待ちください。",
    displayName: "ニックネーム（必須）",
    services: "提供できるサービス（必須）",
    serviceRequired: "サービスを1つ以上選択してください。",
    area: "対応エリア（必須）",
    areaPlaceholder: "例：池袋 / 板橋 / オンライン",
    availableTime: "対応可能時間",
    timePlaceholder: "例：週末 / 平日夕方",
    contactType: "連絡手段",
    contact: "連絡先（必須）",
    serviceLanguageTag: "サービス言語タグ（絞り込み用）",
    languages: "対応言語",
    experience: "関連経験",
    price: "希望報酬",
    pricePlaceholder: "例：1,500円から / 相談可",
    selfIntro: "自己紹介（必須）",
    notes: "備考",
    submit: "サポーター申請を送信",
    safetyTitle: "プライバシーと安全の注意",
    safety: ["実際のサービス情報を入力してください。登録情報は審査されます。", "違法、虚偽、迷惑行為、高リスクなサービスは投稿しないでください。", "他人の住居への立ち入り、ペット世話、鍵の保管、金銭代行などは、双方で事前にリスクと責任を確認してください。"],
  },
} as const;

export default function LifeHelperPersonalJoinPage() {
  const { language } = useLanguage();
  const text = helperJoinCopy[language];
  const [form, setForm] = useState(initialForm);
  const [message, setMessage] = useState("");
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

  const canSubmit = form.displayName.trim() && form.area.trim() && form.contact.trim() && form.selfIntro.trim() && form.services.length > 0;

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

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) {
      setMessage(text.loginRequired);
      return;
    }
    if (!canSubmit) return;
    const nextApplication: LifeHelperPersonalApplication = {
      id: createLifeHelperId("helper"),
      area: form.area.trim(),
      availableTime: form.availableTime.trim(),
      contact: form.contact.trim(),
      contactType: form.contactType,
      createdAt: new Intl.DateTimeFormat("zh-CN", { day: "2-digit", hour: "2-digit", minute: "2-digit", month: "2-digit" }).format(new Date()),
      displayName: form.displayName.trim(),
      experience: form.experience.trim(),
      languages: form.languages,
      notes: form.notes.trim(),
      priceExpectation: form.priceExpectation.trim(),
      serviceLanguageTag: form.serviceLanguageTag,
      selfIntro: form.selfIntro.trim(),
      services: form.services,
      status: "pending",
      type: "helper",
      userId: user.id,
    };
    const nextItems = [nextApplication, ...readLifeHelperPersonalApplications()].slice(0, 80);
    writeLifeHelperPersonalApplications(nextItems);
    setForm(initialForm);
    setMessage(text.submitted);
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
              <p className="text-xs font-black text-[#2563EB]">Helper Join</p>
              <h1 className="mt-1 text-2xl font-black leading-tight">{text.title}</h1>
              <p className="mt-2 text-sm font-bold leading-6 text-slate-600">{text.subtitle}</p>
            </div>
          </div>
        </section>

        {!user ? (
          <section className="rounded-[26px] border border-blue-100 bg-white/88 p-4 text-sm font-bold leading-6 text-slate-600 shadow-sm">
            {text.loginRequired}<Link className="font-black text-[#2563EB] underline" href="/login?next=/life-helper/join/helper">{text.login}</Link>
          </section>
        ) : null}

        {message ? <p className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-xs font-black leading-5 text-[#1D4ED8]">{message}</p> : null}

        <form className="grid gap-3 rounded-[28px] border border-white/80 bg-white/88 p-4 shadow-[0_14px_32px_rgba(37,99,235,0.09)]" onSubmit={submit}>
          <TextInput label={text.displayName} onChange={(value) => setForm((current) => ({ ...current, displayName: value }))} value={form.displayName} />
          <MultiSelect label={text.services} options={personalServiceOptions} selected={form.services} onToggle={toggleService} />
          {form.services.length === 0 ? <p className="text-xs font-black text-rose-600">{text.serviceRequired}</p> : null}
          <TextInput label={text.area} onChange={(value) => setForm((current) => ({ ...current, area: value }))} placeholder={text.areaPlaceholder} value={form.area} />
          <TextInput label={text.availableTime} onChange={(value) => setForm((current) => ({ ...current, availableTime: value }))} placeholder={text.timePlaceholder} value={form.availableTime} />
          <div className="grid grid-cols-[112px_1fr] gap-2">
            <label className="grid gap-1.5">
              <span className="text-xs font-black text-slate-500">{text.contactType}</span>
              <select className="h-11 rounded-[14px] border border-slate-300/80 bg-white/85 px-3 text-sm font-bold outline-none focus:border-[#2563EB]" onChange={(event) => setForm((current) => ({ ...current, contactType: event.target.value as LifeHelperContactType }))} value={form.contactType}>
                {(["LINE", "邮箱", "电话", "其他"] as LifeHelperContactType[]).map((type) => <option key={type} value={type}>{type}</option>)}
              </select>
            </label>
            <TextInput label={text.contact} onChange={(value) => setForm((current) => ({ ...current, contact: value }))} value={form.contact} />
          </div>
          <SingleSelect label={text.serviceLanguageTag} options={lifeHelperServiceLanguageTags} selected={form.serviceLanguageTag} onSelect={(value) => setForm((current) => ({ ...current, serviceLanguageTag: value }))} />
          <MultiSelect label={text.languages} options={helperLanguageOptions} selected={form.languages} onToggle={toggleLanguage} />
          <Textarea label={text.experience} onChange={(value) => setForm((current) => ({ ...current, experience: value }))} value={form.experience} />
          <TextInput label={text.price} onChange={(value) => setForm((current) => ({ ...current, priceExpectation: value }))} placeholder={text.pricePlaceholder} value={form.priceExpectation} />
          <Textarea label={text.selfIntro} onChange={(value) => setForm((current) => ({ ...current, selfIntro: value }))} value={form.selfIntro} />
          <Textarea label={text.notes} onChange={(value) => setForm((current) => ({ ...current, notes: value }))} value={form.notes} />
          <SafetyNotice safety={text.safety} title={text.safetyTitle} />
          <button className="h-12 rounded-full bg-[linear-gradient(135deg,#2563eb,#38bdf8)] text-sm font-black text-white disabled:cursor-not-allowed disabled:bg-slate-300 disabled:bg-none" disabled={!canSubmit || !user} type="submit">
            {text.submit}
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

function MultiSelect<T extends string>({ label, onToggle, options, selected }: { label: string; onToggle: (value: T) => void; options: readonly T[]; selected: T[] }) {
  return (
    <div>
      <p className="text-xs font-black text-slate-500">{label}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {options.map((option) => (
          <button className={`rounded-full border px-3 py-2 text-xs font-black ${selected.includes(option) ? "border-[#2563EB] bg-[#2563EB] text-white" : "border-blue-100 bg-white text-slate-600"}`} key={option} onClick={() => onToggle(option)} type="button">
            {option}
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
