"use client";

import { CheckCircle2, Clipboard, Send } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import { BackButton } from "@/components/BackButton";
import { useLanguage } from "@/hooks/useLanguage";
import { useLocalSubmissions } from "@/hooks/useLocalSubmissions";

const copy = {
  "zh-CN": {
    content: "内容",
    copy: "复制提交内容",
    copied: "已复制",
    email: "邮箱",
    name: "姓名",
    options: ["店铺加入", "店铺认领", "合作", "反馈", "其他"],
    saved: "已保存到本地提交箱",
    submit: "提交并保存",
    subtitle: "反馈、合作、店铺加入和认领都可以先提交到本地记录。正式接入后端前，你可以复制最后一次提交内容发给运营邮箱。",
    title: "联系我们",
    type: "类型",
    submissionId: "提交编号",
  },
  "zh-TW": {
    content: "內容",
    copy: "複製提交內容",
    copied: "已複製",
    email: "Email",
    name: "姓名",
    options: ["店鋪加入", "店鋪認領", "合作", "回饋", "其他"],
    saved: "已保存到本地提交箱",
    submit: "提交並保存",
    subtitle: "回饋、合作、店鋪加入和認領都可以先提交到本地記錄。正式接入後端前，你可以複製最後一次提交內容發給營運信箱。",
    title: "聯絡我們",
    type: "類型",
    submissionId: "提交編號",
  },
  ja: {
    content: "内容",
    copy: "送信内容をコピー",
    copied: "コピー済み",
    email: "メール",
    name: "名前",
    options: ["店舗掲載", "店舗認証", "提携", "フィードバック", "その他"],
    saved: "ローカル送信箱に保存しました",
    submit: "送信して保存",
    subtitle: "フィードバック、提携、店舗掲載、認証申請をローカル記録として保存できます。正式なバックエンド接続前は、最後の送信内容を運営メールへ共有できます。",
    title: "お問い合わせ",
    type: "種類",
    submissionId: "送信ID",
  },
} as const;

export default function ContactPage() {
  const { language, t } = useLanguage();
  const text = copy[language];
  const { addSubmission, submissions } = useLocalSubmissions();
  const [sentId, setSentId] = useState("");
  const [copied, setCopied] = useState(false);
  const lastContact = useMemo(() => submissions.find((item) => item.id === sentId), [sentId, submissions]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const saved = addSubmission("contact", {
      name: String(form.get("name") ?? ""),
      email: String(form.get("email") ?? ""),
      type: String(form.get("type") ?? ""),
      content: String(form.get("content") ?? ""),
    });
    setSentId(saved.id);
    setCopied(false);
    event.currentTarget.reset();
  };

  const copyLast = async () => {
    if (!lastContact) return;
    await navigator.clipboard.writeText(JSON.stringify(lastContact.payload, null, 2));
    setCopied(true);
  };

  return (
    <FormShell title={text.title} subtitle={text.subtitle} backLabel={t.common.back}>
      <form className="grid gap-3" onSubmit={handleSubmit}>
        <Input label={text.name} name="name" />
        <Input label={text.email} name="email" type="email" />
        <Select label={text.type} name="type" options={text.options} />
        <Textarea label={text.content} name="content" />
        <button className="flex h-10 items-center justify-center gap-2 rounded-2xl bg-emerald-800 text-sm font-black text-white" type="submit">
          <Send className="h-4 w-4" />
          {text.submit}
        </button>
        {lastContact && (
          <div className="rounded-2xl bg-emerald-50 px-3 py-3 text-sm font-bold leading-6 text-emerald-900">
            <p className="flex items-center gap-2 font-black">
              <CheckCircle2 className="h-4 w-4" />
              {text.saved}
            </p>
            <p className="mt-1 text-xs">{text.submissionId}：{lastContact.id}</p>
            <button className="mt-2 inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-xs font-black text-emerald-800" onClick={copyLast} type="button">
              <Clipboard className="h-3.5 w-3.5" />
              {copied ? text.copied : text.copy}
            </button>
          </div>
        )}
      </form>
    </FormShell>
  );
}

function FormShell({ backLabel, children, subtitle, title }: { backLabel: string; children: React.ReactNode; subtitle: string; title: string }) {
  return (
    <main className="min-h-screen bg-[#f5f0e7] px-4 py-5 text-stone-950">
      <div className="mx-auto min-h-screen max-w-[430px] bg-[#fbf8f2] px-4 py-5 shadow-2xl shadow-stone-300/40">
        <div className="mb-5">
          <BackButton label={backLabel} />
        </div>
        <section className="rounded-[28px] bg-white p-5 shadow-[0_12px_35px_rgba(32,38,34,0.08)]">
          <h1 className="text-2xl font-black">{title}</h1>
          <p className="mb-5 mt-2 text-sm font-bold leading-6 text-stone-500">{subtitle}</p>
          {children}
        </section>
      </div>
    </main>
  );
}

function Input({ label, name, type = "text" }: { label: string; name: string; type?: string }) {
  return <label className="block"><span className="mb-2 block text-sm font-black">{label}</span><input className="h-10 w-full rounded-xl border border-stone-200 bg-stone-50 px-3 text-sm outline-none focus:border-emerald-700" name={name} type={type} /></label>;
}

function Select({ label, name, options }: { label: string; name: string; options: readonly string[] }) {
  return <label className="block"><span className="mb-2 block text-sm font-black">{label}</span><select className="h-10 w-full rounded-xl border border-stone-200 bg-stone-50 px-3 text-sm outline-none focus:border-emerald-700" name={name}>{options.map((item) => <option key={item}>{item}</option>)}</select></label>;
}

function Textarea({ label, name }: { label: string; name: string }) {
  return <label className="block"><span className="mb-2 block text-sm font-black">{label}</span><textarea className="min-h-32 w-full rounded-2xl border border-stone-200 bg-stone-50 p-4 text-sm outline-none focus:border-emerald-700" name={name} /></label>;
}
