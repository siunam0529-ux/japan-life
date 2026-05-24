import { Info } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";

type DataNoticeProps = {
  source: string;
  updatedAt: string;
  note?: string;
  sourceZhTW?: string;
  sourceJa?: string;
  noteZhTW?: string;
  noteJa?: string;
};

const defaultNote = {
  "zh-CN": "数据会随官方发布、服务接口或店铺信息变化，仅供生活参考。办理手续、付款或签约前请以官方或商家最新信息为准。",
  "zh-TW": "資料會隨官方發布、服務介面或店鋪資訊變化，僅供生活參考。辦理手續、付款或簽約前請以官方或商家最新資訊為準。",
  ja: "データは公式発表、サービス API、店舗情報によって変わる場合があります。手続き、支払い、契約前には必ず公式または店舗の最新情報をご確認ください。",
} as const;

const labels = {
  "zh-CN": { source: "数据来源", updatedAt: "更新时间" },
  "zh-TW": { source: "資料來源", updatedAt: "更新時間" },
  ja: { source: "データ出典", updatedAt: "更新日" },
} as const;

export function DataNotice({ note, noteJa, noteZhTW, source, sourceJa, sourceZhTW, updatedAt }: DataNoticeProps) {
  const { language } = useLanguage();
  const displaySource = language === "ja" ? (sourceJa ?? source) : language === "zh-TW" ? (sourceZhTW ?? source) : source;
  const displayNote = language === "ja" ? (noteJa ?? note ?? defaultNote.ja) : language === "zh-TW" ? (noteZhTW ?? note ?? defaultNote["zh-TW"]) : (note ?? defaultNote["zh-CN"]);
  const text = labels[language];

  return (
    <section className="mt-4 rounded-3xl border border-[#BFDBFE] bg-white px-4 py-3 text-xs font-bold leading-5 text-[#64748B] shadow-[0_12px_30px_rgba(37,99,235,0.08)]">
      <div className="flex items-start gap-2">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#2563EB]" />
        <div>
          <p className="font-black text-[#0F172A]">{text.source}：{displaySource}</p>
          <p className="mt-1">{text.updatedAt}：{updatedAt}</p>
          <p className="mt-1">{displayNote}</p>
        </div>
      </div>
    </section>
  );
}
