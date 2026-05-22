import { Info } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";

type DataNoticeProps = {
  source: string;
  updatedAt: string;
  note?: string;
  sourceZhTW?: string;
  noteZhTW?: string;
};

const defaultNote = {
  "zh-CN": "数据会随官方发布、服务接口或店铺信息变化，仅供生活参考。办理手续、付款或签约前请以官方/商家最新信息为准。",
  "zh-TW": "資料會隨官方發布、服務介面或店鋪資訊變化，僅供生活參考。辦理手續、付款或簽約前請以官方/商家最新資訊為準。",
  ja: "データは公式発表、サービスAPI、店舗情報により変わる場合があります。手続き、支払い、契約前には必ず公式・店舗の最新情報をご確認ください。",
} as const;

export function DataNotice({ note, noteZhTW, source, sourceZhTW, updatedAt }: DataNoticeProps) {
  const { language } = useLanguage();
  const displaySource = language === "zh-TW" ? (sourceZhTW ?? source) : source;
  const displayNote = language === "zh-TW" ? (noteZhTW ?? note ?? defaultNote[language]) : (note ?? defaultNote[language]);

  return (
    <section className="rounded-[20px] border border-emerald-100 bg-emerald-50 px-4 py-3 text-xs font-bold leading-5 text-emerald-950">
      <div className="flex items-start gap-2">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
        <div>
          <p className="font-black text-emerald-800">{language === "zh-TW" ? "資料來源" : language === "ja" ? "データ出典" : "数据来源"}：{displaySource}</p>
          <p className="mt-1">{language === "zh-TW" ? "更新時間" : language === "ja" ? "更新日" : "更新时间"}：{updatedAt}</p>
          <p className="mt-1">{displayNote}</p>
        </div>
      </div>
    </section>
  );
}
