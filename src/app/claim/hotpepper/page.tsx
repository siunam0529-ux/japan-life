"use client";

import { CheckCircle2, Send, Store } from "lucide-react";
import { useState } from "react";
import { BackButton } from "@/components/BackButton";

const contactTypes = ["微信", "LINE", "Email", "电话", "WhatsApp", "其他"];

export default function HotpepperClaimPage() {
  const [contactType, setContactType] = useState(contactTypes[0]);
  const [contactValue, setContactValue] = useState("");
  const [hotpepperUrl, setHotpepperUrl] = useState("");
  const [name, setName] = useState("");
  const [descriptionZh, setDescriptionZh] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    setError("");
    setSent(false);

    if (!contactType || !contactValue.trim() || !hotpepperUrl.trim()) {
      setError("请填写负责人联系方式和 HotPepper 店铺链接。");
      return;
    }

    try {
      const parsed = new URL(hotpepperUrl.trim());
      if (!/(^|\.)hotpepper\.jp$/i.test(parsed.hostname)) {
        setError("请填写 hotpepper.jp 的店铺链接。");
        return;
      }
    } catch {
      setError("HotPepper 店铺链接格式不正确。");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/claim-submissions", {
        body: JSON.stringify({
          contactTool: contactType,
          contactValue,
          descriptionZh,
          hotpepperUrl,
          notes,
          shopName: name,
          sourceType: "hotpepper",
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const result = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) throw new Error(result?.error || `提交失败：${response.status}`);
      setSent(true);
      setContactValue("");
      setHotpepperUrl("");
      setName("");
      setDescriptionZh("");
      setNotes("");
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "提交失败，请稍后再试。");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#F6FAFF] px-4 py-5 text-[#0F172A]">
      <div className="mx-auto flex min-h-screen max-w-[430px] flex-col gap-5 bg-[radial-gradient(circle_at_top,#DFF1FF_0%,#F6FAFF_42%,#FFFFFF_100%)] px-4 py-5">
        <header className="flex items-center justify-between">
          <BackButton fallbackHref="/claim" />
          <span className="rounded-full bg-white/75 px-4 py-2 text-sm font-black text-[#2563EB] shadow-sm backdrop-blur-xl">Japan Life</span>
        </header>

        <section className="rounded-[28px] border border-white/60 bg-white/75 p-5 shadow-[0_18px_45px_rgba(37,99,235,0.10)] backdrop-blur-xl">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-rose-700">HotPepper</p>
              <h1 className="mt-2 text-3xl font-black tracking-tight">申请绑定店铺</h1>
              <p className="mt-3 text-sm font-semibold leading-6 text-[#64748B]">
                已经有 HotPepper 店铺页面时，用这个入口提交绑定申请。审核前不会公开，基础信息以后以 HotPepper 页面为准。
              </p>
            </div>
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-3xl border border-rose-100 bg-rose-50 text-rose-700 shadow-sm">
              <Store className="h-7 w-7" />
            </span>
          </div>
        </section>

        <section className="grid gap-3 rounded-[28px] border border-white/60 bg-white/80 p-4 shadow-[0_12px_35px_rgba(37,99,235,0.08)] backdrop-blur-xl">
          <label className="grid gap-1.5">
            <span className="text-xs font-black text-[#64748B]">负责人联系方式类型</span>
            <select className="h-11 rounded-2xl border border-blue-100 bg-white px-3 text-sm font-bold outline-none focus:border-[#2563EB]" onChange={(event) => setContactType(event.target.value)} value={contactType}>
              {contactTypes.map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>

          <Input label="负责人联系方式内容" onChange={setContactValue} placeholder="微信号 / LINE ID / Email / 电话" value={contactValue} />
          <Input label="HotPepper 店铺链接" onChange={setHotpepperUrl} placeholder="https://www.hotpepper.jp/strJ..." value={hotpepperUrl} />
          <Input label="店铺名称（可选）" onChange={setName} placeholder="可以不填，审核时以 HotPepper 页面为准" value={name} />

          <label className="grid gap-1.5">
            <span className="text-xs font-black text-[#64748B]">中文介绍（可选）</span>
            <textarea className="min-h-24 rounded-2xl border border-blue-100 bg-white px-3 py-2 text-sm font-bold outline-none focus:border-[#2563EB]" onChange={(event) => setDescriptionZh(event.target.value)} placeholder="可写店铺特色，空着也可以" value={descriptionZh} />
          </label>

          <label className="grid gap-1.5">
            <span className="text-xs font-black text-[#64748B]">备注（可选）</span>
            <textarea className="min-h-20 rounded-2xl border border-blue-100 bg-white px-3 py-2 text-sm font-bold outline-none focus:border-[#2563EB]" onChange={(event) => setNotes(event.target.value)} placeholder="给 Japan Life 审核看的补充说明" value={notes} />
          </label>

          <button className="flex h-11 items-center justify-center gap-2 rounded-2xl bg-[#2563EB] text-sm font-black text-white disabled:opacity-50" disabled={submitting} onClick={submit} type="button">
            <Send className="h-4 w-4" />
            {submitting ? "提交中..." : "提交 HotPepper 绑定申请"}
          </button>

          {error ? <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-black leading-6 text-red-700">{error}</p> : null}
          {sent ? <div className="flex items-center gap-2 rounded-2xl bg-green-50 px-4 py-3 text-sm font-black text-green-700"><CheckCircle2 className="h-5 w-5" />已提交到后台待审核。</div> : null}
        </section>
      </div>
    </main>
  );
}

function Input({ label, onChange, placeholder, value }: { label: string; onChange: (value: string) => void; placeholder?: string; value: string }) {
  return (
    <label className="grid gap-1.5">
      <span className="text-xs font-black text-[#64748B]">{label}</span>
      <input className="h-11 rounded-2xl border border-blue-100 bg-white px-3 text-sm font-bold outline-none placeholder:text-slate-400 focus:border-[#2563EB]" onChange={(event) => onChange(event.target.value)} placeholder={placeholder} value={value} />
    </label>
  );
}
