"use client";

import { ArrowLeft, Banknote, CheckCircle2, Compass, Home, Landmark, WalletCards } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { DataNotice } from "@/components/DataNotice";
import { useLanguage } from "@/hooks/useLanguage";

const checklistStorageKey = "japan-life:arrival-checklist";

type Language = "zh-CN" | "zh-TW" | "ja";
type Localized = Record<Language, string>;

const copy = {
  "zh-CN": {
    progress: "完成进度",
    source: "Japan Life 本地清单 + 日本行政手续常见流程整理",
    subtitle: "从抵达到第一个月，把居民登记、水电煤、手机、银行、租房和打工手续一步步打勾完成。",
    title: "初到日本落地清单",
  },
  "zh-TW": {
    progress: "完成進度",
    source: "Japan Life 本地清單 + 日本行政手續常見流程整理",
    subtitle: "從抵達到第一個月，把居民登記、水電瓦斯、手機、銀行、租屋和打工手續一步步打勾完成。",
    title: "初到日本落地清單",
  },
  ja: {
    progress: "進捗",
    source: "Japan Life ローカルチェックリスト + 日本の行政手続き整理",
    subtitle: "到着から最初の1か月まで、住民登録、ライフライン、スマホ、銀行、住まい、アルバイト手続きを順番に確認できます。",
    title: "来日チェックリスト",
  },
} as const;

const stages = [
  {
    id: "day1",
    period: { "zh-CN": "来日第 1 天", "zh-TW": "來日第 1 天", ja: "来日1日目" },
    title: { "zh-CN": "机场与住处确认", "zh-TW": "機場與住處確認", ja: "空港と住まいの確認" },
    icon: Compass,
    items: [
      { "zh-CN": "领取在留卡，确认姓名、在留资格和期限是否正确", "zh-TW": "領取在留卡，確認姓名、在留資格和期限是否正確", ja: "在留カードを受け取り、氏名・在留資格・期限を確認する" },
      { "zh-CN": "保存住处地址、房东或管理公司联系方式", "zh-TW": "保存住處地址、房東或管理公司聯絡方式", ja: "住所、大家さん、管理会社の連絡先を保存する" },
      { "zh-CN": "准备临时 SIM/eSIM，确保能接电话和收验证码", "zh-TW": "準備臨時 SIM/eSIM，確保能接電話和收驗證碼", ja: "一時的なSIM/eSIMを準備し、電話と認証コードを受け取れるようにする" },
    ],
  },
  {
    id: "week1",
    period: { "zh-CN": "第 1 周", "zh-TW": "第 1 週", ja: "1週目" },
    title: { "zh-CN": "区役所、水电煤和网络", "zh-TW": "區役所、水電瓦斯和網路", ja: "役所、ライフライン、ネット" },
    icon: Landmark,
    items: [
      { "zh-CN": "定住地址后 14 天内办理居民登记", "zh-TW": "定住地址後 14 天內辦理居民登記", ja: "住所が決まったら14日以内に住民登録をする" },
      { "zh-CN": "加入国民健康保险，或确认公司社保手续", "zh-TW": "加入國民健康保險，或確認公司社保手續", ja: "国民健康保険に加入、または会社の社会保険手続きを確認する" },
      { "zh-CN": "申请国民年金免除或学生纳付特例（符合条件时）", "zh-TW": "申請國民年金免除或學生納付特例（符合條件時）", ja: "条件に合う場合は国民年金の免除・学生納付特例を確認する" },
      { "zh-CN": "申请电气、水道，预约燃气开栓", "zh-TW": "申請電力、水道，預約瓦斯開栓", ja: "電気・水道を申し込み、ガス開栓を予約する" },
      { "zh-CN": "确认家用网络是否需要工事预约", "zh-TW": "確認家用網路是否需要施工預約", ja: "自宅ネットの工事予約が必要か確認する" },
    ],
  },
  {
    id: "month1",
    period: { "zh-CN": "第 1 个月", "zh-TW": "第 1 個月", ja: "1か月目" },
    title: { "zh-CN": "银行、手机和日常生活", "zh-TW": "銀行、手機和日常生活", ja: "銀行、スマホ、日常生活" },
    icon: WalletCards,
    items: [
      { "zh-CN": "准备在留卡、住民票、印章或签名样式", "zh-TW": "準備在留卡、住民票、印章或簽名樣式", ja: "在留カード、住民票、印鑑または署名を準備する" },
      { "zh-CN": "开银行账户，确认工资收款是否可用", "zh-TW": "開銀行帳戶，確認薪資收款是否可用", ja: "銀行口座を開設し、給与受取に使えるか確認する" },
      { "zh-CN": "办理手机卡前确认解约金、最低利用期和支付方式", "zh-TW": "辦理手機卡前確認解約金、最低利用期和支付方式", ja: "スマホ契約前に解約金、最低利用期間、支払い方法を確認する" },
      { "zh-CN": "注册交通 IC 卡或定期券", "zh-TW": "註冊交通 IC 卡或定期券", ja: "交通系ICカードや定期券を登録する" },
      { "zh-CN": "收藏附近医院、药局、超市和避难所", "zh-TW": "收藏附近醫院、藥局、超市和避難所", ja: "近くの病院、薬局、スーパー、避難所を保存する" },
    ],
  },
  {
    id: "rent",
    period: { "zh-CN": "租房后", "zh-TW": "租屋後", ja: "賃貸契約後" },
    title: { "zh-CN": "住处稳定和退租准备", "zh-TW": "住處穩定和退租準備", ja: "住まいの確認と退去準備" },
    icon: Home,
    items: [
      { "zh-CN": "确认垃圾分类、收集日和粗大垃圾申请方式", "zh-TW": "確認垃圾分類、收集日和粗大垃圾申請方式", ja: "ごみ分別、収集日、粗大ごみ申請方法を確認する" },
      { "zh-CN": "设置邮便转送或确认门牌姓名", "zh-TW": "設定郵便轉送或確認門牌姓名", ja: "郵便転送を設定、または表札・郵便受けの名前を確認する" },
      { "zh-CN": "保存租约、重要事项说明书、管理公司联系方式", "zh-TW": "保存租約、重要事項說明書、管理公司聯絡方式", ja: "契約書、重要事項説明書、管理会社の連絡先を保存する" },
      { "zh-CN": "拍照记录入住时房间状态，避免退租纠纷", "zh-TW": "拍照記錄入住時房間狀態，避免退租糾紛", ja: "入居時の部屋状態を写真で記録し、退去時トラブルを防ぐ" },
    ],
  },
  {
    id: "work",
    period: { "zh-CN": "开始打工前", "zh-TW": "開始打工前", ja: "アルバイト開始前" },
    title: { "zh-CN": "资格外活动和工时管理", "zh-TW": "資格外活動和工時管理", ja: "資格外活動と勤務時間管理" },
    icon: Banknote,
    items: [
      { "zh-CN": "留学生先确认资格外活动许可", "zh-TW": "留學生先確認資格外活動許可", ja: "留学生は資格外活動許可を確認する" },
      { "zh-CN": "记录每周工时，避免超过 28 小时限制", "zh-TW": "記錄每週工時，避免超過 28 小時限制", ja: "週の勤務時間を記録し、28時間制限を超えないようにする" },
      { "zh-CN": "确认工资支付日、交通费、所得税和年末调整资料", "zh-TW": "確認薪資支付日、交通費、所得稅和年末調整資料", ja: "給与支払日、交通費、所得税、年末調整資料を確認する" },
      { "zh-CN": "保存雇佣契约书、排班记录和工资明细", "zh-TW": "保存雇用契約書、排班記錄和薪資明細", ja: "雇用契約書、シフト記録、給与明細を保存する" },
    ],
  },
] satisfies Array<{ id: string; period: Localized; title: Localized; icon: typeof Compass; items: Localized[] }>;

export default function ArrivalPage() {
  const { language, t } = useLanguage();
  const text = copy[language];
  const [checked, setChecked] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      return JSON.parse(window.localStorage.getItem(checklistStorageKey) ?? "[]") as string[];
    } catch {
      return [];
    }
  });
  const total = useMemo(() => stages.reduce((sum, stage) => sum + stage.items.length, 0), []);
  const progress = total ? Math.round((checked.length / total) * 100) : 0;

  const toggle = (key: string) => {
    setChecked((current) => {
      const next = current.includes(key) ? current.filter((item) => item !== key) : [...current, key];
      window.localStorage.setItem(checklistStorageKey, JSON.stringify(next));
      return next;
    });
  };

  return (
    <main className="min-h-screen bg-[#f5f0e7] text-stone-950">
      <div className="mx-auto min-h-screen max-w-[430px] bg-[#fbf8f2] px-4 py-5 shadow-2xl shadow-stone-300/40">
        <div className="mb-5 flex items-center justify-between">
          <Link className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-black text-stone-600 shadow-sm" href="/">
            <ArrowLeft className="h-4 w-4" />
            {t.common.back}
          </Link>
          <span className="rounded-full bg-emerald-50 px-4 py-2 text-xs font-black text-emerald-800">Japan Life</span>
        </div>

        <section className="rounded-[30px] bg-white p-5 text-[#0F172A] shadow-[0_18px_45px_rgba(37,99,235,0.10)]">
          <div className="mb-3 flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-blue-50 text-[#2563EB]">
              <Compass className="h-5 w-5" />
            </span>
            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-[#2563EB]">Japan Life</span>
          </div>
          <h1 className="text-3xl font-black leading-tight">{text.title}</h1>
          <p className="mt-3 text-sm font-semibold leading-6 text-[#64748B]">{text.subtitle}</p>
          <div className="mt-4 rounded-2xl bg-white/12 p-3">
            <div className="flex items-center justify-between text-sm font-black">
              <span>{text.progress}</span>
              <span>{checked.length}/{total}</span>
            </div>
            <div className="mt-2 h-2 rounded-full bg-white/20">
              <div className="h-full rounded-full bg-white" style={{ width: `${progress}%` }} />
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-4">
          {stages.map((stage) => {
            const Icon = stage.icon;
            return (
              <article className="rounded-[24px] border border-stone-200/80 bg-white p-5 shadow-[0_10px_24px_rgba(32,38,34,0.07)]" key={stage.id}>
                <div className="flex items-center gap-3">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-800">
                    <Icon className="h-6 w-6" />
                  </span>
                  <div>
                    <p className="text-xs font-black text-emerald-700">{stage.period[language]}</p>
                    <h2 className="text-xl font-black">{stage.title[language]}</h2>
                  </div>
                </div>

                <div className="mt-4 grid gap-2">
                  {stage.items.map((item, index) => {
                    const key = `${stage.id}:${index}`;
                    const done = checked.includes(key);
                    return (
                      <button className={`flex items-start gap-2 rounded-2xl px-3 py-2 text-left text-sm font-bold leading-6 ${done ? "bg-emerald-50 text-emerald-800" : "bg-stone-50 text-stone-600"}`} key={key} onClick={() => toggle(key)} type="button">
                        <CheckCircle2 className={`mt-1 h-4 w-4 shrink-0 ${done ? "fill-emerald-100" : ""}`} />
                        {item[language]}
                      </button>
                    );
                  })}
                </div>
              </article>
            );
          })}
        </section>

        <div className="mt-5">
          <DataNotice source={text.source} updatedAt="2026-05-22" />
        </div>
      </div>
    </main>
  );
}
