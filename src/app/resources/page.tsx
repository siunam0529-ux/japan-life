"use client";

import { ExternalLink, Flame, Globe2, Phone, Search, ShieldAlert, Siren, Wifi, Zap } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { BackButton } from "@/components/BackButton";
import { DataNotice } from "@/components/DataNotice";
import { useLanguage } from "@/hooks/useLanguage";
import type { Language } from "@/lib/i18n/translations";

type Cat = "emergency" | "admin" | "utility" | "internet" | "disaster" | "life";
type Resource = {
  cat: Cat;
  name: Record<Language, string>;
  desc: Record<Language, string>;
  url: string;
  phone: string;
  icon: typeof Globe2;
};

const resources: Resource[] = [
  { cat: "emergency", name: { "zh-CN": "警察 110", "zh-TW": "警察 110", ja: "警察 110" }, desc: { "zh-CN": "事件、事故、盗窃、人身安全等紧急情况。需要立刻帮助时拨打。", "zh-TW": "事件、事故、竊盜、人身安全等緊急情況。需要立刻協助時撥打。", ja: "事件、事故、盗難、人身安全などの緊急時に利用します。" }, url: "https://www.keishicho.metro.tokyo.lg.jp/multilingual/english/index.html", phone: "110", icon: ShieldAlert },
  { cat: "emergency", name: { "zh-CN": "消防・救急 119", "zh-TW": "消防・救急 119", ja: "消防・救急 119" }, desc: { "zh-CN": "火灾、急病、救护车。说不清日语时先说 fire / ambulance。", "zh-TW": "火災、急病、救護車。日語說不清楚時可先說 fire / ambulance。", ja: "火災、急病、救急車。日本語が難しい時は fire / ambulance と伝えてください。" }, url: "https://www.tfd.metro.tokyo.lg.jp/eng/index.html", phone: "119", icon: Siren },
  { cat: "emergency", name: { "zh-CN": "救急安心センター #7119", "zh-TW": "救急安心センター #7119", ja: "救急安心センター #7119" }, desc: { "zh-CN": "不知道是否该叫救护车时，东京可咨询 #7119。紧急时仍然直接拨 119。", "zh-TW": "不知道是否該叫救護車時，東京可諮詢 #7119。緊急時仍然直接撥 119。", ja: "救急車を呼ぶべきか迷う時に相談できます。緊急時は119へ。" }, url: "https://www.tfd.metro.tokyo.lg.jp/lfe/kyuu-adv/soudan-center.htm", phone: "#7119", icon: Phone },
  { cat: "emergency", name: { "zh-CN": "东京都医疗机构查询 Himawari", "zh-TW": "東京都醫療機構查詢 Himawari", ja: "東京都医療機関案内 Himawari" }, desc: { "zh-CN": "查找夜间、休日、可外语对应的医院和诊所。", "zh-TW": "查找夜間、假日、可外語對應的醫院和診所。", ja: "夜間、休日、外国語対応の病院や診療所を探せます。" }, url: "https://www.himawari.metro.tokyo.jp/", phone: "03-5272-0303", icon: Phone },
  { cat: "emergency", name: { "zh-CN": "外务省 驻日外国公馆列表", "zh-TW": "外務省 駐日外國公館列表", ja: "外務省 駐日外国公館リスト" }, desc: { "zh-CN": "查找各国大使馆、领事馆联系方式。护照遗失或紧急领事协助可从这里确认。", "zh-TW": "查找各國大使館、領事館聯絡方式。護照遺失或緊急領事協助可從這裡確認。", ja: "各国大使館、領事館の連絡先を確認できます。パスポート紛失時にも利用します。" }, url: "https://www.mofa.go.jp/about/emb_cons/protocol/index.html", phone: "官网确认", icon: Globe2 },
  { cat: "admin", name: { "zh-CN": "东京都 23 区役所入口", "zh-TW": "東京都 23 區役所入口", ja: "東京都 23区役所入口" }, desc: { "zh-CN": "搬家、住民票、国民健康保险、年金、儿童补助等手续通常在区役所办理。", "zh-TW": "搬家、住民票、國民健康保險、年金、兒童補助等手續通常在區役所辦理。", ja: "転居、住民票、国民健康保険、年金、児童手当などは区役所で手続きします。" }, url: "https://www.metro.tokyo.lg.jp/tosei/tokyoto/profile/gaiyo/kushichoson.html", phone: "各区确认", icon: Globe2 },
  { cat: "utility", name: { "zh-CN": "东京都水道局 开始/停止用水", "zh-TW": "東京都水道局 開始/停止用水", ja: "東京都水道局 使用開始/停止" }, desc: { "zh-CN": "东京用水开通、停止、搬家手续入口。", "zh-TW": "東京用水開通、停止、搬家手續入口。", ja: "東京の水道開始、停止、引越し手続き入口です。" }, url: "https://suidonet.waterworks.metro.tokyo.lg.jp/inet-service/uketsuke/main_english", phone: "03-5326-1101", icon: Globe2 },
  { cat: "utility", name: { "zh-CN": "东京燃气 搬家开通/停止", "zh-TW": "東京瓦斯 搬家開通/停止", ja: "東京ガス 引越し手続き" }, desc: { "zh-CN": "燃气开栓通常需要立会，官网可申请燃气和电力手续。", "zh-TW": "瓦斯開栓通常需要立會，官網可申請瓦斯和電力手續。", ja: "ガス開栓は立会いが必要な場合があります。ガスと電気の手続き入口です。" }, url: "https://home.tokyo-gas.co.jp/gas_power/procedure/moving/index.html", phone: "0570-002211", icon: Flame },
  { cat: "utility", name: { "zh-CN": "TEPCO 电气契约手续", "zh-TW": "TEPCO 電氣契約手續", ja: "TEPCO 電気契約手続き" }, desc: { "zh-CN": "东京电力 Energy Partner 电气开通、契约和客服入口。", "zh-TW": "東京電力 Energy Partner 電氣開通、契約和客服入口。", ja: "東京電力 Energy Partner の電気開始、契約、サポート入口です。" }, url: "https://www.tepco.co.jp/ep/support/index-j.html", phone: "0120-995-001", icon: Zap },
  { cat: "internet", name: { "zh-CN": "NTT East FLET'S 光", "zh-TW": "NTT East FLET'S 光", ja: "NTT East FLET'S 光" }, desc: { "zh-CN": "东日本主要光纤入口，先确认住所可用线路后再申请。", "zh-TW": "東日本主要光纖入口，先確認住所可用線路後再申請。", ja: "東日本の主要光回線入口です。住所で利用可否を確認してから申し込みます。" }, url: "https://flets.com/english/", phone: "0120-116116", icon: Wifi },
  { cat: "internet", name: { "zh-CN": "SoftBank 光 / 手机", "zh-TW": "SoftBank 光 / 手機", ja: "SoftBank 光 / 携帯" }, desc: { "zh-CN": "手机与家用网络主流运营商之一，注意合约期和解约条件。", "zh-TW": "手機與家用網路主流業者之一，注意合約期和解約條件。", ja: "携帯と自宅ネットの主要事業者です。契約期間と解約条件を確認してください。" }, url: "https://www.softbank.jp/en/", phone: "0800-919-0157", icon: Wifi },
  { cat: "disaster", name: { "zh-CN": "NTT 灾害留言 171", "zh-TW": "NTT 災害留言 171", ja: "NTT 災害用伝言 171" }, desc: { "zh-CN": "大灾害时用于留言确认安否。", "zh-TW": "大災害時用於留言確認安否。", ja: "大災害時に安否確認の伝言を残せます。" }, url: "https://www.ntt-east.co.jp/saigai/voice171/", phone: "171", icon: Phone },
  { cat: "admin", name: { "zh-CN": "出入国在留管理厅", "zh-TW": "出入國在留管理廳", ja: "出入国在留管理庁" }, desc: { "zh-CN": "在留资格、资格外活动、住址变更等官方信息入口。", "zh-TW": "在留資格、資格外活動、住址變更等官方資訊入口。", ja: "在留資格、資格外活動、住所変更などの公式情報入口です。" }, url: "https://www.moj.go.jp/isa/", phone: "0570-013904", icon: Globe2 },
  { cat: "admin", name: { "zh-CN": "My Number Card", "zh-TW": "My Number Card", ja: "マイナンバーカード" }, desc: { "zh-CN": "完成住民登记后可申请，用于身份确认和线上行政手续。", "zh-TW": "完成住民登記後可申請，用於身份確認和線上行政手續。", ja: "住民登録後に申請できます。本人確認やオンライン行政手続きに使います。" }, url: "https://www.kojinbango-card.go.jp/en/", phone: "0120-0178-27", icon: Globe2 },
  { cat: "life", name: { "zh-CN": "日本邮便 转居/转送", "zh-TW": "日本郵便 轉居/轉送", ja: "日本郵便 転居・転送" }, desc: { "zh-CN": "旧地址邮件免费转送 1 年，需要本人确认。", "zh-TW": "舊地址郵件免費轉送 1 年，需要本人確認。", ja: "旧住所宛の郵便物を1年間無料で転送できます。本人確認が必要です。" }, url: "https://www.post.japanpost.jp/service/tenkyo/index_en.html", phone: "0570-046-111", icon: Globe2 },
];

const copy = {
  "zh-CN": {
    back: "返回",
    title: "日本生活指南",
    desc: "水电煤、网络、防灾、行政、邮便等常用官网和电话。紧急联络包含 110、119、#7119、入管、区役所、大使馆和夜间医院查询入口。",
    arrivalKicker: "初到日本",
    arrivalTitle: "落地行程表",
    arrivalDesc: "从机场、住民登记、水电煤、网络、银行手机到第一个月生活安排，按时间线一步步做。",
    search: "搜索：水道、网络、防灾、电话...",
    all: "全部",
    categories: { emergency: "紧急", admin: "行政", utility: "水电煤", internet: "网络", disaster: "防灾", life: "生活" },
    phone: "电话",
    website: "官网",
    open: "打开官网",
    source: "Japan Life 常用官方入口整理",
  },
  "zh-TW": {
    back: "返回",
    title: "日本生活指南",
    desc: "水電瓦斯、網路、防災、行政、郵便等常用官網和電話。緊急聯絡包含 110、119、#7119、入管、區役所、大使館和夜間醫院查詢入口。",
    arrivalKicker: "初到日本",
    arrivalTitle: "落地行程表",
    arrivalDesc: "從機場、住民登記、水電瓦斯、網路、銀行手機到第一個月生活安排，按時間線一步步做。",
    search: "搜尋：水道、網路、防災、電話...",
    all: "全部",
    categories: { emergency: "緊急", admin: "行政", utility: "水電瓦斯", internet: "網路", disaster: "防災", life: "生活" },
    phone: "電話",
    website: "官網",
    open: "打開官網",
    source: "Japan Life 常用官方入口整理",
  },
  ja: {
    back: "戻る",
    title: "日本生活ガイド",
    desc: "ライフライン、ネット、防災、行政、郵便などの公式サイトと電話をまとめました。110、119、#7119、入管、区役所、大使館、夜間病院検索も確認できます。",
    arrivalKicker: "来日したら",
    arrivalTitle: "到着後チェックリスト",
    arrivalDesc: "空港、住民登録、ライフライン、ネット、銀行、携帯、最初の1か月を時系列で確認できます。",
    search: "検索：水道、ネット、防災、電話...",
    all: "すべて",
    categories: { emergency: "緊急", admin: "行政", utility: "ライフライン", internet: "ネット", disaster: "防災", life: "生活" },
    phone: "電話",
    website: "公式",
    open: "公式サイトを開く",
    source: "Japan Life 公式入口まとめ",
  },
} as const;

export default function ResourcesPage() {
  const { language } = useLanguage();
  const text = copy[language];
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<"all" | Cat>("all");
  const filtered = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return resources.filter((item) => {
      const matchesCategory = category === "all" || item.cat === category;
      const matchesKeyword = !keyword || `${item.name[language]} ${item.desc[language]} ${text.categories[item.cat]}`.toLowerCase().includes(keyword);
      return matchesCategory && matchesKeyword;
    });
  }, [category, language, query, text.categories]);

  return (
    <main className="min-h-screen bg-[#f5f0e7] text-stone-950">
      <div className="mx-auto min-h-screen max-w-[430px] bg-[#fbf8f2] px-4 py-5 shadow-2xl shadow-stone-300/40">
        <div className="mb-5 flex items-center justify-between">
          <BackButton label={text.back} />
          <span className="rounded-full bg-emerald-50 px-4 py-2 text-xs font-black text-emerald-800">Japan Life</span>
        </div>
        <section className="rounded-[30px] bg-emerald-800 p-6 text-white shadow-[0_18px_45px_rgba(20,108,92,0.25)]">
          <h1 className="text-3xl font-black">{text.title}</h1>
          <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-emerald-50">{text.desc}</p>
        </section>

        <section className="mt-4 rounded-[18px] bg-white p-3 shadow-[0_8px_18px_rgba(32,38,34,0.06)]">
          <label className="flex h-10 items-center gap-2 rounded-xl bg-stone-50 px-3">
            <Search className="h-4 w-4 shrink-0 text-emerald-800" />
            <input className="w-full bg-transparent text-[13px] font-bold outline-none placeholder:text-stone-400" onChange={(event) => setQuery(event.target.value)} placeholder={text.search} value={query} />
          </label>
          <div className="mt-2 flex gap-2 overflow-x-auto">
            {(["all", "emergency", "utility", "internet", "disaster", "admin", "life"] as const).map((item) => (
              <button className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-black ${category === item ? "bg-emerald-800 text-white" : "bg-emerald-50 text-emerald-800"}`} key={item} onClick={() => setCategory(item)} type="button">
                {item === "all" ? text.all : text.categories[item]}
              </button>
            ))}
          </div>
        </section>

        <section className="mt-5 grid gap-4">
          {filtered.map((item) => {
            const Icon = item.icon;
            return (
              <article className="rounded-[22px] border border-stone-200 bg-white p-5 shadow-[0_10px_24px_rgba(32,38,34,0.07)]" key={`${item.cat}-${item.name["zh-CN"]}`}>
                <div className="flex items-start gap-3">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-800">
                    <Icon className="h-6 w-6" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-black text-emerald-700">{text.categories[item.cat]}</p>
                    <h2 className="mt-1 text-lg font-black">{item.name[language]}</h2>
                    <p className="mt-2 text-sm font-semibold leading-6 text-stone-600">{item.desc[language]}</p>
                    <p className="mt-3 text-sm font-black text-stone-800">{text.phone}: {item.phone}</p>
                    <p className="mt-1 break-all text-xs font-bold text-stone-500">{text.website}: {item.url}</p>
                  </div>
                </div>
                <a className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-emerald-800 px-4 py-2 text-sm font-black text-white" href={item.url} rel="noreferrer" target="_blank">
                  {text.open} <ExternalLink className="h-4 w-4" />
                </a>
              </article>
            );
          })}
        </section>
        <DataNotice
          source="Japan Life 常用官方入口整理"
          sourceZhTW="Japan Life 常用官方入口整理"
          sourceJa="Japan Life 公式入口まとめ"
          updatedAt="2026-05-22"
          note="官方入口、电话号码和手续说明可能更新，办理前请以各机构官方网站为准。"
          noteZhTW="官方入口、電話號碼和手續說明可能更新，辦理前請以各機構官方網站為準。"
          noteJa="公式入口、電話番号、手続き説明は更新される場合があります。手続き前に各機関の公式サイトをご確認ください。"
        />
      </div>
    </main>
  );
}
