"use client";

import { AlertCircle, Baby, Building2, BriefcaseBusiness, Car, CheckCircle2, ChevronRight, ClipboardList, FileText, HeartPulse, Home, PawPrint, Plane, RotateCcw, Search } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useMemo, useState, useSyncExternalStore } from "react";
import { BackButton } from "@/components/BackButton";
import { useLanguage } from "@/hooks/useLanguage";

type LanguageKey = "zh-CN" | "zh-TW" | "ja";
type Localized = Record<LanguageKey, string>;
type ProcedureStep = { id: string; note: Localized; place: Localized; priority?: "high" | "normal"; timing: Localized; title: Localized };
type ProcedureScene = { description: Localized; icon: LucideIcon; id: string; steps: ProcedureStep[]; subtitle: Localized; title: Localized };
type ProcedureProgress = { completed: Record<string, string[]>; selectedSceneId?: string };
type ProcedureStepText = { note: string; place: string; timing: string; title: string };

const storageKey = "japan-life:procedure-navigator";
const changeEvent = "japan-life:procedure-navigator-change";
const emptySnapshot: ProcedureProgress = { completed: {}, selectedSceneId: "arrival" };
let cachedRaw = "";
let cachedSnapshot: ProcedureProgress = emptySnapshot;

const copy = {
  "zh-CN": {
    back: "返回",
    clear: "清空进度",
    nextAfterMove: "搬家后最容易漏的下一步",
    nextAfterMoveItems: ["确认新地址的垃圾分类日", "更新公司、学校、手机、保险和网购地址", "确认最近的医院、药局、超市、避难所", "把在留卡、保险证、驾照等证件放在同一个检查清单里"],
    place: "办理地点",
    progress: "完成进度",
    searchHint: "先选择一个生活场景，再按时间顺序处理",
    timing: "建议时间",
    title: "日本手续导航",
    subtitle: "搬家、入学、换工作、回国这些事，按时间线一步一步处理。",
    warning: "各自治体、学校、公司和入管要求可能不同。这里是生活清单，不替代官方说明。",
  },
  "zh-TW": {
    back: "返回",
    clear: "清空進度",
    nextAfterMove: "搬家後最容易漏的下一步",
    nextAfterMoveItems: ["確認新地址的垃圾分類日", "更新公司、學校、手機、保險和網購地址", "確認最近的醫院、藥局、超市、避難所", "把在留卡、保險證、駕照等證件放在同一個檢查清單裡"],
    place: "辦理地點",
    progress: "完成進度",
    searchHint: "先選擇一個生活場景，再按時間順序處理",
    timing: "建議時間",
    title: "日本手續導航",
    subtitle: "搬家、入學、換工作、回國這些事，按時間線一步一步處理。",
    warning: "各自治體、學校、公司和入管要求可能不同。這裡是生活清單，不取代官方說明。",
  },
  ja: {
    back: "戻る",
    clear: "進捗をクリア",
    nextAfterMove: "引っ越し後に忘れやすい次の手続き",
    nextAfterMoveItems: ["新住所のごみ収集日を確認", "会社、学校、携帯、保険、通販の住所を更新", "近くの病院、薬局、スーパー、避難所を確認", "在留カード、保険証、運転免許証などを同じチェックリストで確認"],
    place: "手続き先",
    progress: "進捗",
    searchHint: "生活シーンを選び、時系列で確認します",
    timing: "目安",
    title: "日本手続きナビ",
    subtitle: "引っ越し、入学、転職、帰国などを時系列で整理します。",
    warning: "自治体、学校、会社、入管により必要書類や期限が異なります。必ず公式情報も確認してください。",
  },
} as const;

const procedureStepTranslations: Record<string, { "zh-TW": ProcedureStepText; ja: ProcedureStepText }> = {
  "arrival-card": {
    "zh-TW": { title: "領取在留卡，確認姓名、在留資格和期限", place: "機場 / 入管", timing: "來日第 1 天", note: "發現錯誤要盡快確認，之後很多手續都會用到在留卡。" },
    ja: { title: "在留カードを受け取り、氏名・在留資格・期限を確認", place: "空港 / 入管", timing: "来日1日目", note: "誤りがある場合は早めに確認してください。多くの手続きで在留カードを使います。" },
  },
  "arrival-address": {
    "zh-TW": { title: "保存住處地址、房東或管理公司聯絡方式", place: "住處 / 管理公司", timing: "來日第 1 天", note: "居民登記、快遞、銀行和手機都需要正確地址。" },
    ja: { title: "住所、大家さん、管理会社の連絡先を保存", place: "住まい / 管理会社", timing: "来日1日目", note: "住民登録、郵便、銀行、携帯契約には正確な住所が必要です。" },
  },
  "arrival-sim": {
    "zh-TW": { title: "準備臨時 SIM/eSIM，確保能接電話和收驗證碼", place: "機場 / 電信業者 / App", timing: "來日第 1 天", note: "很多 App、銀行、房屋和工作聯絡都需要手機號碼或網路。" },
    ja: { title: "一時用のSIM/eSIMを用意し、電話と認証コードを受け取れるようにする", place: "空港 / 通信会社 / App", timing: "来日1日目", note: "アプリ、銀行、住まい、仕事の連絡には電話番号や通信環境が必要です。" },
  },
  "arrival-resident": {
    "zh-TW": { title: "定住地址後 14 天內辦理居民登記", place: "居住地市區町村役所", timing: "第 1 週", note: "帶護照、在留卡、地址資訊。後續國保、證明、銀行等都會用到。" },
    ja: { title: "住所が決まったら14日以内に住民登録を行う", place: "居住地の市区町村役所", timing: "1週目", note: "パスポート、在留カード、住所情報を持参します。国保、証明書、銀行手続きでも使います。" },
  },
  "arrival-insurance": {
    "zh-TW": { title: "加入國民健康保險，或確認公司社保手續", place: "市區町村役所 / 公司", timing: "第 1 週", note: "公司社保對象由公司處理，留學生和未加入公司社保的人多半需要確認國保。" },
    ja: { title: "国民健康保険に加入、または会社の社会保険手続きを確認", place: "市区町村役所 / 会社", timing: "1週目", note: "会社の社会保険対象者は会社が手続きします。留学生や未加入の人は国保を確認してください。" },
  },
  "arrival-pension": {
    "zh-TW": { title: "確認國民年金免除或學生納付特例", place: "市區町村役所 / 年金事務所", timing: "第 1 週", note: "學生、低收入、剛來日本時建議確認是否可申請。" },
    ja: { title: "国民年金の免除または学生納付特例を確認", place: "市区町村役所 / 年金事務所", timing: "1週目", note: "学生、低所得、来日直後の場合は申請できるか確認しましょう。" },
  },
  "arrival-utilities": {
    "zh-TW": { title: "申請電氣、水道，預約瓦斯開栓", place: "電力 / 水道 / 瓦斯公司", timing: "第 1 週", note: "瓦斯開栓常需要本人在家立會，盡量提前預約。" },
    ja: { title: "電気・水道を申し込み、ガス開栓を予約", place: "電力会社 / 水道 / ガス会社", timing: "1週目", note: "ガス開栓は本人立ち会いが必要なことが多いので、早めに予約しましょう。" },
  },
  "arrival-home-internet": {
    "zh-TW": { title: "確認家用網路是否需要工事預約", place: "網路公司 / 管理公司", timing: "第 1 週", note: "有些房子需要施工，旺季預約可能很慢。" },
    ja: { title: "自宅インターネットに工事予約が必要か確認", place: "通信会社 / 管理会社", timing: "1週目", note: "物件によっては工事が必要です。繁忙期は予約が取りにくいことがあります。" },
  },
  "arrival-bank-docs": {
    "zh-TW": { title: "準備在留卡、住民票、印章或簽名樣式", place: "住所 / 役所 / 文具店", timing: "第 1 個月", note: "開銀行、辦手機、簽約時可能會用到。" },
    ja: { title: "在留カード、住民票、印鑑または署名を用意", place: "住所 / 役所 / 文具店", timing: "1か月目", note: "銀行口座、携帯契約、各種契約で必要になることがあります。" },
  },
  "arrival-bank": {
    "zh-TW": { title: "開銀行帳戶，確認薪資收款是否可用", place: "銀行分行 / App", timing: "第 1 個月", note: "不同銀行對在留期間、手機號碼、學生證要求不同。" },
    ja: { title: "銀行口座を開設し、給与受取に使えるか確認", place: "銀行窓口 / App", timing: "1か月目", note: "銀行により在留期間、電話番号、学生証などの条件が異なります。" },
  },
  "arrival-phone": {
    "zh-TW": { title: "辦手機卡前確認解約金、最低利用期和支付方式", place: "電信業者 / 格安 SIM", timing: "第 1 個月", note: "外國人證件、海外信用卡、口座轉帳等條件要提前確認。" },
    ja: { title: "携帯契約前に解約金、最低利用期間、支払い方法を確認", place: "通信会社 / 格安SIM", timing: "1か月目", note: "本人確認書類、海外クレジットカード、口座振替の可否を事前に確認してください。" },
  },
  "arrival-ic-card": {
    "zh-TW": { title: "註冊交通 IC 卡或確認定期券", place: "車站 / 交通 App", timing: "第 1 個月", note: "日常通勤、通學和購物都會更方便。" },
    ja: { title: "交通ICカードの登録または定期券を確認", place: "駅 / 交通系App", timing: "1か月目", note: "通勤、通学、買い物が便利になります。" },
  },
  "arrival-nearby": {
    "zh-TW": { title: "收藏附近醫院、藥局、超市和避難所", place: "地圖 / 自治體官網", timing: "第 1 個月", note: "生病、災害或剛搬來不熟悉時會很有用。" },
    ja: { title: "近くの病院、薬局、スーパー、避難所を保存", place: "地図 / 自治体公式サイト", timing: "1か月目", note: "体調不良、災害、引っ越し直後に役立ちます。" },
  },
  "arrival-garbage": {
    "zh-TW": { title: "確認垃圾分類、收集日和大型垃圾申請方式", place: "自治體官網 / 垃圾日曆", timing: "租屋後", note: "不同區規則差異很大，尤其是資源垃圾和大型垃圾。" },
    ja: { title: "ごみ分別、収集日、粗大ごみ申込方法を確認", place: "自治体公式サイト / ごみカレンダー", timing: "賃貸契約後", note: "区によってルールが大きく異なります。資源ごみや粗大ごみは特に確認しましょう。" },
  },
  "arrival-postal": {
    "zh-TW": { title: "設定郵便轉送或確認門牌姓名", place: "日本郵便 / 住處", timing: "租屋後", note: "避免重要信件寄不到，住處門牌姓名也要確認。" },
    ja: { title: "郵便転送を設定、または表札名を確認", place: "日本郵便 / 住まい", timing: "賃貸契約後", note: "重要書類が届かないことを防ぐため、表札名も確認してください。" },
  },
  "arrival-rent-docs": {
    "zh-TW": { title: "保存租約、重要事項說明書、管理公司聯絡方式", place: "住處 / 管理公司", timing: "租屋後", note: "退租、維修、更新合約時都會用到。" },
    ja: { title: "賃貸契約書、重要事項説明書、管理会社連絡先を保存", place: "住まい / 管理会社", timing: "賃貸契約後", note: "退去、修理、更新手続きで必要になります。" },
  },
  "arrival-room-photo": {
    "zh-TW": { title: "拍照記錄入住時房間狀態，避免退租糾紛", place: "住處", timing: "入住當天", note: "牆面、地板、設備損傷最好當天拍照保存。" },
    ja: { title: "入居時の室内状態を写真で記録", place: "住まい", timing: "入居当日", note: "壁、床、設備の傷は当日に写真で残しておくと安心です。" },
  },
  "arrival-work-permit": {
    "zh-TW": { title: "留學生先確認資格外活動許可", place: "入管 / 在留卡背面", timing: "開始打工前", note: "沒有許可不要開始打工。" },
    ja: { title: "留学生は資格外活動許可を先に確認", place: "入管 / 在留カード裏面", timing: "アルバイト開始前", note: "許可がない場合はアルバイトを始めないでください。" },
  },
  "arrival-payroll": {
    "zh-TW": { title: "確認薪資支付日、交通費、所得稅和年末調整資料", place: "雇主 / 公司", timing: "開始打工前", note: "薪資明細、源泉徵收票和年末調整資料要保存。" },
    ja: { title: "給与支払日、交通費、所得税、年末調整書類を確認", place: "雇用主 / 会社", timing: "アルバイト開始前", note: "給与明細、源泉徴収票、年末調整書類は保存しておきましょう。" },
  },
  "arrival-employment-docs": {
    "zh-TW": { title: "保存雇用合約、排班記錄和薪資明細", place: "雇主 / 公司", timing: "開始打工後", note: "遇到薪資、工時或簽證問題時，這些記錄會很重要。" },
    ja: { title: "雇用契約書、シフト記録、給与明細を保存", place: "雇用主 / 会社", timing: "アルバイト開始後", note: "給与、勤務時間、ビザ関連の確認時に重要な記録になります。" },
  },
  "moving-out": {
    "zh-TW": { title: "轉出屆 / 遷出手續", place: "舊住所市區町村役所", timing: "搬家前 14 天左右", note: "跨市區町村搬家通常需要。拿到轉出證明後再去新地址辦理轉入。" },
    ja: { title: "転出届 / 転出手続き", place: "旧住所の市区町村役所", timing: "引っ越しの約14日前", note: "市区町村をまたぐ引っ越しでは通常必要です。転出証明書を受け取り、新住所で転入手続きをします。" },
  },
  "postal-forwarding": {
    "zh-TW": { title: "郵局轉送服務", place: "郵局 / 日本郵便官網", timing: "搬家前後", note: "設定後舊地址信件可在一定期間轉送到新地址。" },
    ja: { title: "郵便局の転送サービスを設定", place: "郵便局 / 日本郵便公式サイト", timing: "引っ越し前後", note: "設定すると旧住所宛の郵便物を一定期間新住所へ転送できます。" },
  },
  "moving-in": {
    "zh-TW": { title: "轉入屆 / 住民票地址更新", place: "新住所市區町村役所", timing: "搬家後 14 天內", note: "這是最核心的一步，後面的國保、年金、證明文件通常都跟它相關。" },
    ja: { title: "転入届 / 住民票住所更新", place: "新住所の市区町村役所", timing: "引っ越し後14日以内", note: "最も大事な手続きです。国保、年金、証明書の手続きにも関係します。" },
  },
  "residence-card-address": {
    "zh-TW": { title: "在留卡地址變更", place: "新住所市區町村役所", timing: "搬家後 14 天內", note: "通常在辦理住民票地址時一併處理。記得帶在留卡。" },
    ja: { title: "在留カードの住所変更", place: "新住所の市区町村役所", timing: "引っ越し後14日以内", note: "住民票の住所変更と同時に行うことが多いです。在留カードを持参してください。" },
  },
  "health-insurance": {
    "zh-TW": { title: "國民健康保險地址變更", place: "市區町村役所國保窗口", timing: "住民票更新後盡快", note: "加入公司社保的人一般由公司處理，國保用戶需要自己確認。" },
    ja: { title: "国民健康保険の住所変更", place: "市区町村役所の国保窓口", timing: "住民票更新後できるだけ早く", note: "会社の社会保険加入者は会社が対応することが多く、国保加入者は自分で確認します。" },
  },
  "driver-license-address": {
    "zh-TW": { title: "駕照地址變更", place: "警察署 / 免許中心", timing: "搬家後盡快", note: "一般需要新地址證明，例如住民票、公共費用帳單等。" },
    ja: { title: "運転免許証の住所変更", place: "警察署 / 免許センター", timing: "引っ越し後できるだけ早く", note: "住民票や公共料金の請求書など、新住所を確認できる書類が必要なことがあります。" },
  },
  "bank-phone": {
    "zh-TW": { title: "銀行、手機、信用卡地址更新", place: "各 App / 店鋪 / 官網", timing: "搬家後盡快", note: "避免重要信件、銀行卡、SIM、帳單寄到舊地址。" },
    ja: { title: "銀行、携帯、クレジットカードの住所を更新", place: "各App / 店舗 / 公式サイト", timing: "引っ越し後できるだけ早く", note: "重要書類、カード、SIM、請求書が旧住所に届くのを防ぎます。" },
  },
  "school-docs": {
    "zh-TW": { title: "確認入學許可書、學生證和學校登入資訊", place: "學校 / 郵件", timing: "入學前", note: "這些文件常用於簽證更新、銀行、手機和打工手續。" },
    ja: { title: "入学許可書、学生証、学校ログイン情報を確認", place: "学校 / メール", timing: "入学前", note: "ビザ更新、銀行、携帯、アルバイト手続きで使うことがあります。" },
  },
  "school-address": {
    "zh-TW": { title: "如果搬家，先完成住民票和在留卡地址", place: "市區町村役所", timing: "開學前後", note: "學校、銀行、獎學金和郵寄資料都需要正確地址。" },
    ja: { title: "引っ越した場合は住民票と在留カードの住所を先に更新", place: "市区町村役所", timing: "入学前後", note: "学校、銀行、奨学金、郵送書類には正しい住所が必要です。" },
  },
  "school-commute": {
    "zh-TW": { title: "確認通學路線和定期券", place: "車站 / 學校", timing: "開學前", note: "學生定期券可能需要學校證明或指定路線。" },
    ja: { title: "通学経路と定期券を確認", place: "駅 / 学校", timing: "入学前", note: "学生定期券には学校の証明や指定経路が必要なことがあります。" },
  },
  "school-work-permit": {
    "zh-TW": { title: "留學生打工前確認資格外活動許可", place: "入管 / 在留卡背面", timing: "開始打工前", note: "沒有許可不要開始打工，並確認每週 28 小時限制。" },
    ja: { title: "留学生はアルバイト前に資格外活動許可を確認", place: "入管 / 在留カード裏面", timing: "アルバイト開始前", note: "許可がない場合は始めず、週28時間制限も確認してください。" },
  },
  "permit-card-check": {
    "zh-TW": { title: "確認在留卡背面是否已有許可", place: "在留卡", timing: "打工前", note: "沒有許可不要開始打工。" },
    ja: { title: "在留カード裏面に許可があるか確認", place: "在留カード", timing: "アルバイト前", note: "許可がない場合はアルバイトを始めないでください。" },
  },
  "permit-apply": {
    "zh-TW": { title: "沒有許可時申請資格外活動許可", place: "入管", timing: "打工前", note: "可在入境時或之後向入管申請。" },
    ja: { title: "許可がない場合は資格外活動許可を申請", place: "入管", timing: "アルバイト前", note: "入国時または来日後に入管へ申請できます。" },
  },
  "permit-hours": {
    "zh-TW": { title: "確認 28 小時限制和長假規則", place: "學校 / 入管說明", timing: "排班前", note: "通常每週 28 小時，長假規則需另外確認。" },
    ja: { title: "28時間制限と長期休暇中のルールを確認", place: "学校 / 入管の案内", timing: "シフトを入れる前", note: "通常は週28時間までです。長期休暇中のルールは別途確認してください。" },
  },
  "permit-job-type": {
    "zh-TW": { title: "確認不可從事行業", place: "雇主 / 入管說明", timing: "入職前", note: "風俗相關等行業通常不可從事。" },
    ja: { title: "従事できない業種を確認", place: "雇用主 / 入管の案内", timing: "入職前", note: "風俗関連など、通常従事できない業種があります。" },
  },
  "move-out-notice": {
    "zh-TW": { title: "確認退租通知期限和方式", place: "租約 / 管理公司", timing: "搬出前 1-2 個月", note: "租約裡常寫明提前一個月或兩個月通知。" },
    ja: { title: "退去通知の期限と方法を確認", place: "賃貸契約書 / 管理会社", timing: "退去の1〜2か月前", note: "契約書に1か月前または2か月前通知と書かれていることが多いです。" },
  },
  "move-out-utilities": {
    "zh-TW": { title: "停止電氣、水道、瓦斯和網路", place: "各服務公司", timing: "搬出前 1-2 週", note: "瓦斯有時需要上門關栓，提前預約。" },
    ja: { title: "電気、水道、ガス、インターネットを停止", place: "各サービス会社", timing: "退去の1〜2週間前", note: "ガスは閉栓立ち会いが必要なことがあります。早めに予約してください。" },
  },
  "move-out-bulky": {
    "zh-TW": { title: "預約大型垃圾", place: "自治體大型垃圾中心", timing: "越早越好", note: "旺季預約可能很滿，不要拖到搬家前一天。" },
    ja: { title: "粗大ごみを予約", place: "自治体の粗大ごみ受付", timing: "できるだけ早く", note: "繁忙期は予約が埋まりやすいので、退去直前まで待たないようにしましょう。" },
  },
  "move-out-inspection": {
    "zh-TW": { title: "預約退去立會並確認押金精算", place: "管理公司", timing: "搬出日前", note: "確認清潔費、修繕費、鑰匙歸還和押金精算。" },
    ja: { title: "退去立会いを予約し、敷金精算を確認", place: "管理会社", timing: "退去日前", note: "清掃費、修繕費、鍵返却、敷金精算を確認します。" },
  },
  "job-contract": {
    "zh-TW": { title: "確認雇用合約和工作條件", place: "公司 / 人事", timing: "入社前", note: "確認薪資、工時、社保、試用期和交通費。" },
    ja: { title: "雇用契約と労働条件を確認", place: "会社 / 人事", timing: "入社前", note: "給与、勤務時間、社会保険、試用期間、交通費を確認します。" },
  },
  "job-insurance": {
    "zh-TW": { title: "社保 / 雇用保險切換", place: "公司 / 年金事務所 / 市區町村", timing: "退社入社前後", note: "空檔期可能需要國保、國民年金。" },
    ja: { title: "社会保険 / 雇用保険の切り替え", place: "会社 / 年金事務所 / 市区町村", timing: "退職・入社前後", note: "空白期間がある場合は国保や国民年金が必要になることがあります。" },
  },
  "job-tax": {
    "zh-TW": { title: "住民稅繳納方式確認", place: "公司 / 市區町村", timing: "換工作時", note: "確認是普通徵收還是特別徵收。" },
    ja: { title: "住民税の納付方法を確認", place: "会社 / 市区町村", timing: "転職時", note: "普通徴収か特別徴収かを確認してください。" },
  },
  "job-immigration": {
    "zh-TW": { title: "所屬機關變更申報", place: "入管線上系統 / 入管窗口", timing: "變更後 14 天內為宜", note: "就勞類在留資格通常需要確認。" },
    ja: { title: "所属機関の変更届出", place: "入管オンラインシステム / 入管窓口", timing: "変更後14日以内が目安", note: "就労系の在留資格では確認が必要なことが多いです。" },
  },
  "visa-date": {
    "zh-TW": { title: "確認申請期限", place: "在留卡 / 入管", timing: "到期前 3 個月起", note: "多數在留資格可在到期前 3 個月左右申請。" },
    ja: { title: "申請期限を確認", place: "在留カード / 入管", timing: "期限の約3か月前から", note: "多くの在留資格は期限の約3か月前から申請できます。" },
  },
  "visa-photo": {
    "zh-TW": { title: "準備照片和申請書", place: "照相機 / 入管官網", timing: "申請前", note: "照片規格、申請書版本要按官方要求。" },
    ja: { title: "写真と申請書を準備", place: "証明写真機 / 入管公式サイト", timing: "申請前", note: "写真規格と申請書の版は公式案内に従ってください。" },
  },
  "visa-tax": {
    "zh-TW": { title: "準備課稅 / 納稅證明", place: "市區町村役所", timing: "申請前", note: "就勞類、家族類申請常會用到。" },
    ja: { title: "課税証明書 / 納税証明書を準備", place: "市区町村役所", timing: "申請前", note: "就労系や家族系の申請で必要になることがあります。" },
  },
  "visa-submit": {
    "zh-TW": { title: "提交申請並保管受理票", place: "入管", timing: "資料齊後", note: "受理票和通知明信片要保存好。" },
    ja: { title: "申請を提出し、受付票を保管", place: "入管", timing: "書類がそろった後", note: "受付票と通知はがきは大切に保管してください。" },
  },
  "lost-police": {
    "zh-TW": { title: "去警察署提交遺失屆", place: "警察署 / 交番", timing: "發現後盡快", note: "拿到受理編號，補辦時可能需要。" },
    ja: { title: "警察署で遺失届を出す", place: "警察署 / 交番", timing: "気づいたらできるだけ早く", note: "受理番号を受け取ります。再発行時に必要になることがあります。" },
  },
  "lost-bank": {
    "zh-TW": { title: "銀行卡 / 信用卡掛失", place: "銀行 / 信用卡公司", timing: "立即", note: "先凍結再補辦，避免被盜刷。" },
    ja: { title: "銀行カード / クレジットカードを停止", place: "銀行 / カード会社", timing: "すぐに", note: "先に利用停止し、再発行します。不正利用を防ぎましょう。" },
  },
  "lost-residence": {
    "zh-TW": { title: "在留卡再交付申請", place: "入管", timing: "原則上 14 天內", note: "護照、照片、遺失屆編號等可能需要。" },
    ja: { title: "在留カードの再交付申請", place: "入管", timing: "原則14日以内", note: "パスポート、写真、遺失届の受理番号などが必要になることがあります。" },
  },
  "lost-insurance": {
    "zh-TW": { title: "保險證補辦", place: "公司 / 市區町村", timing: "需要就醫前盡快", note: "公司社保找公司，國保找役所。" },
    ja: { title: "保険証を再発行", place: "会社 / 市区町村", timing: "受診前にできるだけ早く", note: "会社の社会保険は会社へ、国保は役所へ確認します。" },
  },
  "illness-card": {
    "zh-TW": { title: "帶健康保險證 / 資格確認書", place: "醫院 / 藥局", timing: "就醫當天", note: "沒有保險確認可能會先全額自費。" },
    ja: { title: "健康保険証 / 資格確認書を持参", place: "病院 / 薬局", timing: "受診当日", note: "保険確認ができないと一時的に全額自己負担になることがあります。" },
  },
  "illness-limit": {
    "zh-TW": { title: "確認限度額適用認定", place: "保險者 / 公司 / 市區町村", timing: "住院或高額治療前", note: "可降低窗口一次性支付壓力。" },
    ja: { title: "限度額適用認定を確認", place: "保険者 / 会社 / 市区町村", timing: "入院や高額治療の前", note: "窓口での一時的な支払い負担を抑えられる場合があります。" },
  },
  "illness-high-cost": {
    "zh-TW": { title: "確認高額療養費", place: "保險者", timing: "醫療費較高時", note: "超過限度額的部分可能之後返還。" },
    ja: { title: "高額療養費を確認", place: "保険者", timing: "医療費が高くなった時", note: "限度額を超えた分が後日戻る場合があります。" },
  },
  "illness-sick-pay": {
    "zh-TW": { title: "確認傷病手當金", place: "公司 / 健康保險組合", timing: "因病請長假時", note: "公司社保加入者符合條件時可能申請。" },
    ja: { title: "傷病手当金を確認", place: "会社 / 健康保険組合", timing: "病気で長く休む時", note: "会社の健康保険加入者は条件を満たすと申請できる場合があります。" },
  },
  "driver-license": {
    "zh-TW": { title: "外國駕照換日本駕照", place: "駕照中心", timing: "開車前", note: "資料、翻譯件、考試要求按國家不同。" },
    ja: { title: "外国免許を日本の免許へ切り替え", place: "運転免許センター", timing: "運転前", note: "必要書類、翻訳、試験内容は国によって異なります。" },
  },
  "car-parking": {
    "zh-TW": { title: "車庫證明", place: "警察署", timing: "買車前後", note: "普通車通常需要確認保管場所。" },
    ja: { title: "車庫証明を確認", place: "警察署", timing: "車の購入前後", note: "普通車では保管場所の確認が必要なことが多いです。" },
  },
  "car-insurance": {
    "zh-TW": { title: "自賠責 / 任意保險", place: "保險公司 / 車行", timing: "開車前", note: "自賠責是強制，任意保險強烈建議確認。" },
    ja: { title: "自賠責保険 / 任意保険を確認", place: "保険会社 / 車販売店", timing: "運転前", note: "自賠責は必須です。任意保険も強く確認をおすすめします。" },
  },
  "car-registration": {
    "zh-TW": { title: "名義變更 / 車輛登記", place: "運輸支局 / 輕自協", timing: "買車時", note: "普通車和輕汽車窗口不同。" },
    ja: { title: "名義変更 / 車両登録", place: "運輸支局 / 軽自動車検査協会", timing: "車を買う時", note: "普通車と軽自動車で窓口が異なります。" },
  },
  "pet-rental": {
    "zh-TW": { title: "確認房屋可養寵", place: "租賃合約 / 管理公司", timing: "養之前", note: "不要只看口頭說明，以合約為準。" },
    ja: { title: "ペット可の物件か確認", place: "賃貸契約書 / 管理会社", timing: "飼う前", note: "口頭説明だけでなく、契約書を基準に確認してください。" },
  },
  "pet-dog-register": {
    "zh-TW": { title: "犬登記", place: "市區町村役所", timing: "養狗後", note: "養狗通常需要登記並領取犬牌。" },
    ja: { title: "犬の登録", place: "市区町村役所", timing: "犬を飼い始めた後", note: "犬を飼う場合は登録し、鑑札を受け取る必要があります。" },
  },
  "pet-rabies": {
    "zh-TW": { title: "狂犬病疫苗", place: "動物醫院 / 自治體", timing: "每年", note: "狗需要按規定接種狂犬病疫苗。" },
    ja: { title: "狂犬病予防注射", place: "動物病院 / 自治体", timing: "毎年", note: "犬は規定に従って狂犬病予防注射を受ける必要があります。" },
  },
  "pet-moving": {
    "zh-TW": { title: "搬家後寵物登記變更", place: "市區町村役所", timing: "搬家後", note: "跨自治體搬家時確認登記變更。" },
    ja: { title: "引っ越し後のペット登録変更", place: "市区町村役所", timing: "引っ越し後", note: "自治体をまたぐ引っ越しでは登録変更を確認してください。" },
  },
  "startup-visa": {
    "zh-TW": { title: "確認在留資格是否允許", place: "入管 / 行政書士 / 公司", timing: "開始前", note: "並非所有在留資格都適合創業或副業。" },
    ja: { title: "在留資格で許可されるか確認", place: "入管 / 行政書士 / 会社", timing: "始める前", note: "すべての在留資格が開業や副業に向いているわけではありません。" },
  },
  "startup-company": {
    "zh-TW": { title: "確認公司副業規則", place: "公司 / 就業規則", timing: "開始前", note: "正社員尤其要確認公司是否允許副業。" },
    ja: { title: "会社の副業ルールを確認", place: "会社 / 就業規則", timing: "始める前", note: "正社員は特に会社が副業を認めているか確認してください。" },
  },
  "startup-tax-office": {
    "zh-TW": { title: "開業屆", place: "稅務署", timing: "開業後 1 個月內為目安", note: "個人事業開始時確認是否需要提交。" },
    ja: { title: "開業届を提出", place: "税務署", timing: "開業後1か月以内が目安", note: "個人事業を始める場合、提出が必要か確認してください。" },
  },
  "startup-blue": {
    "zh-TW": { title: "青色申告承認申請", place: "稅務署", timing: "期限內", note: "想用青色申告優惠時要注意申請期限。" },
    ja: { title: "青色申告承認申請", place: "税務署", timing: "期限内", note: "青色申告の特典を使いたい場合は申請期限に注意してください。" },
  },
  "leave-rent": {
    "zh-TW": { title: "確認退租通知和搬出日期", place: "管理公司 / 房東", timing: "出國前 1-2 個月", note: "很多租約需要提前一個月以上通知。" },
    ja: { title: "退去通知と引っ越し日を確認", place: "管理会社 / 大家さん", timing: "出国の1〜2か月前", note: "多くの賃貸契約では1か月以上前の通知が必要です。" },
  },
  "leave-city": {
    "zh-TW": { title: "提交轉出屆 / 海外轉出", place: "市區町村役所", timing: "出國前 14 天左右", note: "同時確認國保、年金、住民稅。" },
    ja: { title: "転出届 / 海外転出を提出", place: "市区町村役所", timing: "出国の約14日前", note: "国保、年金、住民税も同時に確認してください。" },
  },
  "leave-contracts": {
    "zh-TW": { title: "停止水電瓦斯、網路、手機和訂閱", place: "各服務公司", timing: "出國前 1-2 週", note: "確認解約金、最後帳單和付款方式。" },
    ja: { title: "電気・水道・ガス・ネット・携帯・サブスクを停止", place: "各サービス会社", timing: "出国の1〜2週間前", note: "解約金、最終請求、支払い方法を確認してください。" },
  },
  "leave-bank-tax": {
    "zh-TW": { title: "確認銀行帳戶、稅金和年金手續", place: "銀行 / 役所 / 年金事務所", timing: "出國前", note: "長期離開前確認是否關閉帳戶、設定納稅管理人或申請脫退一時金。" },
    ja: { title: "銀行口座、税金、年金手続きを確認", place: "銀行 / 役所 / 年金事務所", timing: "出国前", note: "長期出国前に口座解約、納税管理人、脱退一時金の申請を確認してください。" },
  },
  "family-marriage": {
    "zh-TW": { title: "確認婚姻屆所需資料", place: "市區町村役所 / 大使館", timing: "提交前", note: "外國人通常需要婚姻要件具備證明等資料。" },
    ja: { title: "婚姻届に必要な書類を確認", place: "市区町村役所 / 大使館", timing: "提出前", note: "外国人は婚姻要件具備証明書などが必要になることがあります。" },
  },
  "family-visa": {
    "zh-TW": { title: "確認家族滯在或在留資格變更", place: "入管", timing: "申請前", note: "收入、扶養、關係證明等資料可能需要。" },
    ja: { title: "家族滞在または在留資格変更を確認", place: "入管", timing: "申請前", note: "収入、扶養、関係証明などの書類が必要になることがあります。" },
  },
  "family-birth": {
    "zh-TW": { title: "出生後辦理出生屆和相關補助", place: "市區町村役所", timing: "出生後 14 天內", note: "同時確認健康保險、兒童醫療證和兒童津貼。" },
    ja: { title: "出生後、出生届と関連助成を手続き", place: "市区町村役所", timing: "出生後14日以内", note: "健康保険、子ども医療証、児童手当も同時に確認してください。" },
  },
  "family-passport": {
    "zh-TW": { title: "確認孩子護照和在留手續", place: "大使館 / 入管", timing: "出生後盡快", note: "孩子國籍、護照和在留資格要分別確認。" },
    ja: { title: "子どものパスポートと在留手続きを確認", place: "大使館 / 入管", timing: "出生後できるだけ早く", note: "子どもの国籍、パスポート、在留資格をそれぞれ確認してください。" },
  },
};

const scenes: ProcedureScene[] = [
  makeScene("arrival", Plane, L("初到日本落地清单", "初到日本落地清單", "来日チェックリスト"), L("机场、区役所、水电煤、手机、银行、打工", "機場、區役所、水電瓦斯、手機、銀行、打工", "空港、役所、ライフライン、スマホ、銀行、バイト"), L("从抵达到第一个月，把居民登记、水电煤、手机、银行、租房和打工手续一步步完成。", "從抵達到第一個月，把居民登記、水電瓦斯、手機、銀行、租屋和打工手續一步步完成。", "到着から最初の1か月まで、住民登録、ライフライン、スマホ、銀行、住まい、アルバイト手続きを確認します。"), [
    S("arrival-card", "领取在留卡，确认姓名、在留资格和期限", "机场 / 入管", "来日第 1 天", "发现错误要尽快确认，之后很多手续都会用到在留卡。", "high"),
    S("arrival-address", "保存住处地址、房东或管理公司联系方式", "住处 / 管理公司", "来日第 1 天", "居民登记、快递、银行和手机都需要准确地址。"),
    S("arrival-sim", "准备临时 SIM/eSIM，确保能接电话和收验证码", "机场 / 运营商 / App", "来日第 1 天", "很多 App、银行、房屋和工作联系都需要手机号或网络。"),
    S("arrival-resident", "定住地址后 14 天内办理居民登记", "居住地市区町村役所", "第 1 周", "带护照、在留卡、地址信息。后续国保、证明、银行等都会用到。", "high"),
    S("arrival-insurance", "加入国民健康保险，或确认公司社保手续", "市区町村役所 / 公司", "第 1 周", "公司社保对象由公司处理，留学生和未加入公司社保的人多半需要确认国保。", "high"),
    S("arrival-pension", "确认国民年金免除或学生纳付特例", "市区町村役所 / 年金事务所", "第 1 周", "学生、低收入、刚来日本时建议确认是否可申请。"),
    S("arrival-utilities", "申请电气、水道，预约燃气开栓", "电力 / 水道 / 燃气公司", "第 1 周", "燃气开栓常需要本人在家立会，尽量提前预约。", "high"),
    S("arrival-home-internet", "确认家用网络是否需要工事预约", "网络公司 / 管理公司", "第 1 周", "有些房子需要施工，旺季预约可能很慢。"),
    S("arrival-bank-docs", "准备在留卡、住民票、印章或签名样式", "住所 / 役所 / 文具店", "第 1 个月", "开银行、办手机、签约时可能会用到。"),
    S("arrival-bank", "开银行账户，确认工资收款是否可用", "银行网点 / App", "第 1 个月", "不同银行对在留期间、手机号、学生证要求不同。", "high"),
    S("arrival-phone", "办理手机卡前确认解约金、最低利用期和支付方式", "运营商 / 格安 SIM", "第 1 个月", "外国人证件、海外信用卡、口座振替等条件要提前确认。"),
    S("arrival-ic-card", "注册交通 IC 卡或确认定期券", "车站 / 交通 App", "第 1 个月", "日常通勤、通学和购物都会更方便。"),
    S("arrival-nearby", "收藏附近医院、药局、超市和避难所", "地图 / 自治体官网", "第 1 个月", "生病、灾害或刚搬来不熟悉时会很有用。"),
    S("arrival-garbage", "确认垃圾分类、收集日和粗大垃圾申请方式", "自治体官网 / 垃圾日历", "租房后", "不同区规则差异很大，尤其是资源垃圾和粗大垃圾。", "high"),
    S("arrival-postal", "设置邮便转送或确认门牌姓名", "日本邮便 / 住处", "租房后", "避免重要信件寄不到，住处门牌姓名也要确认。"),
    S("arrival-rent-docs", "保存租约、重要事项说明书、管理公司联系方式", "住处 / 管理公司", "租房后", "退租、维修、更新合同时都会用到。"),
    S("arrival-room-photo", "拍照记录入住时房间状态，避免退租纠纷", "住处", "入住当天", "墙面、地板、设备损伤最好当天拍照保存。", "high"),
    S("arrival-work-permit", "留学生先确认资格外活动许可", "入管 / 在留卡背面", "开始打工前", "没有许可不要开始打工。", "high"),
    S("arrival-payroll", "确认工资支付日、交通费、所得税和年末调整资料", "雇主 / 公司", "开始打工前", "工资明细、源泉征收票和年末调整资料要保存。"),
    S("arrival-employment-docs", "保存雇佣合同、排班记录和工资明细", "雇主 / 公司", "开始打工后", "遇到工资、工时或签证问题时，这些记录会很重要。", "high"),
  ]),
  makeScene("moving", Home, L("搬家", "搬家", "引っ越し"), L("住民票、国保、在留卡、驾照、银行地址", "住民票、國保、在留卡、駕照、銀行地址", "住民票、国保、在留カード、免許、銀行住所"), L("搬家前后最需要按顺序处理，尤其是地址变更。", "搬家前後最需要按順序處理，尤其是地址變更。", "引っ越し前後は住所変更を中心に順番に進めます。"), [
    S("moving-out", "转出届 / 迁出手续", "旧住所市区町村役所", "搬家前 14 天左右", "跨市区町村搬家通常需要。拿到转出证明后再去新地址办理转入。"),
    S("postal-forwarding", "邮局转送服务", "邮局 / 日本邮便官网", "搬家前后", "设置后旧地址信件可在一定期间转送到新地址。"),
    S("moving-in", "转入届 / 住民票地址更新", "新住所市区町村役所", "搬家后 14 天内", "这是最核心的一步，后面的国保、年金、证明文件通常都跟它相关。", "high"),
    S("residence-card-address", "在留卡地址变更", "新住所市区町村役所", "搬家后 14 天内", "通常在办理住民票地址时一并处理。记得带在留卡。", "high"),
    S("health-insurance", "国民健康保险地址变更", "市区町村役所国保窗口", "住民票更新后尽快", "加入公司社保的人一般由公司处理，国保用户需要自己确认。"),
    S("driver-license-address", "驾照地址变更", "警察署 / 免许中心", "搬家后尽快", "一般需要新地址证明，例如住民票、公共料金账单等。"),
    S("bank-phone", "银行、手机、信用卡地址更新", "各 App / 店铺 / 官网", "搬家后尽快", "避免重要信件、银行卡、SIM、账单寄到旧地址。", "high"),
  ]),
  makeScene("school", FileText, L("入学 / 转学", "入學 / 轉學", "入学・転校"), L("学校手续、住民票、通学、打工许可", "學校手續、住民票、通學、打工許可", "学校手続き、住民票、通学、資格外活動"), L("入学前后要把学校材料、地址、保险和通学路线一起确认。", "入學前後要把學校資料、地址、保險和通學路線一起確認。", "入学前後に学校書類、住所、保険、通学経路を確認します。"), [
    S("school-docs", "确认入学许可书、学生证和学校登录信息", "学校 / 邮件", "入学前", "这些文件常用于签证更新、银行、手机和打工手续。", "high"),
    S("school-address", "如果搬家，先完成住民票和在留卡地址", "市区町村役所", "开学前后", "学校、银行、奖学金和邮寄资料都需要正确地址。"),
    S("school-commute", "确认通学路线和定期券", "车站 / 学校", "开学前", "学生定期券可能需要学校证明或指定路线。"),
    S("school-work-permit", "留学生打工前确认资格外活动许可", "入管 / 在留卡背面", "开始打工前", "没有许可不要开始打工，并确认每周 28 小时限制。", "high"),
  ]),
  makeScene("work-permit", FileText, L("资格外活动许可", "資格外活動許可", "資格外活動許可"), L("留学生打工、28 小时、假期工时", "留學生打工、28 小時、假期工時", "留学生バイト、28時間、長期休暇"), L("留学生开始打工前必须确认许可和工时限制。", "留學生開始打工前必須確認許可和工時限制。", "留学生がアルバイト前に確認する手続きです。"), [
    S("permit-card-check", "确认在留卡背面是否已有许可", "在留卡", "打工前", "没有许可不要开始打工。", "high"),
    S("permit-apply", "没有许可时申请资格外活动许可", "入管", "打工前", "可在入境时或之后向入管申请。", "high"),
    S("permit-hours", "确认 28 小时限制和长假规则", "学校 / 入管说明", "排班前", "通常每周 28 小时，长假规则需另行确认。", "high"),
    S("permit-job-type", "确认不可从事行业", "雇主 / 入管说明", "入职前", "风俗相关等行业通常不可从事。"),
  ]),
  makeScene("move-out", Home, L("退租 / 搬出", "退租 / 搬出", "退去・搬出"), L("退去通知、水电煤停止、粗大垃圾、押金", "退租通知、水電瓦斯停止、大型垃圾、押金", "退去連絡、ライフライン停止、粗大ごみ、敷金"), L("搬出前要提前预约，尤其是粗大垃圾和燃气闭栓。", "搬出前要提前預約，尤其是大型垃圾和瓦斯閉栓。", "退去前は予約が多く、早めの確認が必要です。"), [
    S("move-out-notice", "确认退租通知期限和方式", "租约 / 管理公司", "搬出前 1-2 个月", "租约里常写明提前一个月或两个月通知。", "high"),
    S("move-out-utilities", "停止电气、水道、燃气和网络", "各服务公司", "搬出前 1-2 周", "煤气有时需要上门关栓，提前预约。", "high"),
    S("move-out-bulky", "预约粗大垃圾", "自治体粗大垃圾中心", "越早越好", "旺季预约可能很满，不要拖到搬家前一天。", "high"),
    S("move-out-inspection", "预约退去立会并确认押金精算", "管理公司", "搬出日前", "确认清洁费、修缮费、钥匙归还和押金精算。"),
  ]),
  makeScene("job-change", BriefcaseBusiness, L("换工作", "換工作", "転職"), L("雇佣合同、社保、住民税、入管届出", "雇用合同、社保、住民稅、入管申報", "雇用契約、社保、住民税、入管届出"), L("换工作时要确认劳动条件、保险和在留相关届出。", "換工作時要確認勞動條件、保險和在留相關申報。", "転職時に労働条件、保険、在留関連届出を確認します。"), [
    S("job-contract", "确认雇佣合同和工作条件", "公司 / 人事", "入社前", "确认工资、工时、社保、试用期和交通费。", "high"),
    S("job-insurance", "社保 / 雇佣保险切换", "公司 / 年金事务所 / 市区町村", "退社入社前后", "空档期可能需要国保、国民年金。"),
    S("job-tax", "住民税缴纳方式确认", "公司 / 市区町村", "换工作时", "确认是普通征收还是特别征收。"),
    S("job-immigration", "所属机关变更届出", "入管线上系统 / 入管窗口", "变更后 14 天内为宜", "就劳类在留资格通常需要确认。", "high"),
  ]),
  makeScene("visa-renewal", FileText, L("在留卡更新", "在留卡更新", "在留カード更新"), L("照片、申请书、课税纳税、学校/公司材料", "照片、申請書、課稅納稅、學校/公司資料", "写真、申請書、課税納税、学校/会社書類"), L("到期前尽早准备，不要等到最后几天。", "到期前盡早準備，不要等到最後幾天。", "期限前に余裕を持って準備します。"), [
    S("visa-date", "确认申请期限", "在留卡 / 入管", "到期前 3 个月起", "多数在留资格可在到期前 3 个月左右申请。", "high"),
    S("visa-photo", "准备照片和申请书", "照相机 / 入管官网", "申请前", "照片规格、申请书版本要按官方要求。"),
    S("visa-tax", "准备课税 / 纳税证明", "市区町村役所", "申请前", "就劳类、家族类申请常会用到。"),
    S("visa-submit", "提交申请并保管受理票", "入管", "材料齐后", "受理票和通知明信片要保存好。", "high"),
  ]),
  makeScene("lost-documents", AlertCircle, L("证件丢失", "證件遺失", "書類紛失"), L("在留卡、钱包、银行卡、驾照、保险证", "在留卡、錢包、銀行卡、駕照、保險證", "在留カード、財布、銀行カード、免許、保険証"), L("先止损，再补办。证件丢失建议当天处理。", "先止損，再補辦。證件遺失建議當天處理。", "まず停止・届出、その後再発行します。"), [
    S("lost-police", "去警察署交遗失届", "警察署 / 交番", "发现后尽快", "拿到受理编号，补办时可能需要。", "high"),
    S("lost-bank", "银行卡 / 信用卡挂失", "银行 / 信用卡公司", "立即", "先冻结再补办，避免被盗刷。", "high"),
    S("lost-residence", "在留卡再交付申请", "入管", "原则上 14 天内", "护照、照片、遗失届编号等可能需要。", "high"),
    S("lost-insurance", "保险证补办", "公司 / 市区町村", "需要就医前尽快", "公司社保找公司，国保找役所。"),
  ]),
  makeScene("illness", HeartPulse, L("生病 / 受伤", "生病 / 受傷", "病気・けが"), L("保险证、限度额、高额疗养费、伤病手当", "保險證、限度額、高額療養費、傷病手當", "保険証、限度額、高額療養費、傷病手当"), L("医疗费用高时，提前确认保险和补助制度很重要。", "醫療費用高時，提前確認保險和補助制度很重要。", "医療費が高くなりそうな時に確認します。"), [
    S("illness-card", "带健康保险证 / 资格确认书", "医院 / 药局", "就医当天", "没有保险确认可能会先全额自费。", "high"),
    S("illness-limit", "限度额适用认定确认", "保险者 / 公司 / 市区町村", "住院或高额治疗前", "可降低窗口一次性支付压力。", "high"),
    S("illness-high-cost", "高额疗养费确认", "保险者", "医疗费较高时", "超过限度额的部分可能之后返还。"),
    S("illness-sick-pay", "伤病手当金确认", "公司 / 健康保险组合", "因病请长假时", "公司社保加入者符合条件时可能申请。"),
  ]),
  makeScene("driver-car", Car, L("驾照 / 买车", "駕照 / 買車", "免許・車"), L("驾照换证、车库证明、保险、名义变更", "駕照換證、車庫證明、保險、名義變更", "免許切替、車庫証明、保険、名義変更"), L("开车前先确认驾照、保险和车辆手续。", "開車前先確認駕照、保險和車輛手續。", "運転前に免許、保険、車両手続きを確認します。"), [
    S("driver-license", "外国驾照换日本驾照", "驾照中心", "开车前", "材料、翻译件、考试要求按国家不同。", "high"),
    S("car-parking", "车库证明", "警察署", "买车前后", "普通车通常需要确认保管场所。"),
    S("car-insurance", "自赔责 / 任意保险", "保险公司 / 车行", "开车前", "自赔责是强制，任意保险强烈建议确认。", "high"),
    S("car-registration", "名义变更 / 车辆登记", "运输支局 / 轻自协", "买车时", "普通车和轻汽车窗口不同。"),
  ]),
  makeScene("pet", PawPrint, L("养宠物", "養寵物", "ペット"), L("宠物可住、犬登记、疫苗、保险", "寵物可住、犬登記、疫苗、保險", "ペット可、犬登録、ワクチン、保険"), L("租房和养狗时尤其要确认规则和登记。", "租房和養狗時尤其要確認規則和登記。", "賃貸ルールと犬の登録を確認します。"), [
    S("pet-rental", "确认房屋可养宠", "租赁合同 / 管理公司", "养之前", "不要只看口头说明，以合同为准。", "high"),
    S("pet-dog-register", "犬登记", "市区町村役所", "养狗后", "养狗通常需要登记并领取犬牌。"),
    S("pet-rabies", "狂犬病疫苗", "动物医院 / 自治体", "每年", "狗需要按规定接种狂犬病疫苗。", "high"),
    S("pet-moving", "搬家后宠物登记变更", "市区町村役所", "搬家后", "跨自治体搬家时确认登记变更。"),
  ]),
  makeScene("startup-sidejob", Building2, L("创业 / 副业", "創業 / 副業", "開業・副業"), L("开业届、青色申告、税务、在留资格", "開業屆、青色申告、稅務、在留資格", "開業届、青色申告、税務、在留資格"), L("副业和创业前要先确认税务、公司规则和在留资格。", "副業和創業前要先確認稅務、公司規則和在留資格。", "副業・開業前に税務、会社規則、在留資格を確認します。"), [
    S("startup-visa", "确认在留资格是否允许", "入管 / 行政书士 / 公司", "开始前", "并非所有在留资格都适合创业或副业。", "high"),
    S("startup-company", "确认公司副业规则", "公司 / 就业规则", "开始前", "正社员尤其要确认公司是否允许副业。"),
    S("startup-tax-office", "开业届", "税务署", "开业后 1 个月内为目安", "个人事业开始时确认是否需要提交。"),
    S("startup-blue", "青色申告承认申请", "税务署", "期限内", "想用青色申告优惠时要注意申请期限。"),
  ]),
  makeScene("leaving-japan", Plane, L("回国 / 离开日本", "回國 / 離開日本", "帰国・出国"), L("退租、退保、年金、税金、银行、手机", "退租、退保、年金、稅金、銀行、手機", "退去、保険、年金、税金、銀行、携帯"), L("离开日本前要按时间提前停止合同和行政手续。", "離開日本前要按時間提前停止合約和行政手續。", "帰国前に契約停止と行政手続きを時系列で進めます。"), [
    S("leave-rent", "确认退租通知和搬出日期", "管理公司 / 房东", "出国前 1-2 个月", "很多租约需要提前一个月以上通知。", "high"),
    S("leave-city", "提交转出届 / 海外转出", "市区町村役所", "出国前 14 天左右", "同时确认国保、年金、住民税。", "high"),
    S("leave-contracts", "停止水电煤、网络、手机和订阅", "各服务公司", "出国前 1-2 周", "确认解约金、最后账单和付款方式。"),
    S("leave-bank-tax", "确认银行账户、税金和年金手续", "银行 / 役所 / 年金事务所", "出国前", "长期离开前确认是否关闭账户、设置纳税管理人或申请脱退一时金。", "high"),
  ]),
  makeScene("family", Baby, L("结婚 / 家族", "結婚 / 家族", "結婚・家族"), L("婚姻届、家族滞在、出生、儿童补助", "婚姻屆、家族滯在、出生、兒童補助", "婚姻届、家族滞在、出生、児童手当"), L("家庭相关手续常涉及役所、入管和本国使领馆。", "家庭相關手續常涉及役所、入管和本國使領館。", "家族関連は役所、入管、本国大使館の確認が必要です。"), [
    S("family-marriage", "确认婚姻届所需材料", "市区町村役所 / 大使馆", "提交前", "外国人通常需要婚姻要件具备证明等材料。", "high"),
    S("family-visa", "确认家族滞在或在留资格变更", "入管", "申请前", "收入、扶养、关系证明等材料可能需要。", "high"),
    S("family-birth", "出生后办理出生届和相关补助", "市区町村役所", "出生后 14 天内", "同时确认健康保险、儿童医疗证和児童手当。"),
    S("family-passport", "确认孩子护照和在留手续", "大使馆 / 入管", "出生后尽快", "孩子国籍、护照和在留资格要分别确认。", "high"),
  ]),
];

export default function ProcedureNavigatorPage() {
  const { language } = useLanguage();
  const text = copy[language];
  const progress = useProcedureProgress();
  const [scenePickerOpen, setScenePickerOpen] = useState(false);
  const selectedSceneId = progress.selectedSceneId ?? "arrival";
  const selectedScene = scenes.find((scene) => scene.id === selectedSceneId) ?? scenes[0];
  const doneIds = progress.completed[selectedScene.id] ?? [];
  const doneCount = doneIds.length;
  const totalCount = selectedScene.steps.length;
  const percent = totalCount ? Math.round((doneCount / totalCount) * 100) : 0;
  const groupedSteps = useMemo(() => groupProcedureSteps(selectedScene.steps, language), [language, selectedScene.steps]);

  const resetScene = () => setProcedureProgress({ ...progress, completed: { ...progress.completed, [selectedScene.id]: [] } });

  return (
    <main className="jl-tool-theme min-h-screen text-stone-950">
      <div className="jl-tool-shell mx-auto min-h-screen max-w-[430px] px-4 pb-24 pt-5">
        <header className="flex items-center justify-between gap-3">
          <BackButton label={text.back} />
          <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-2 text-xs font-black text-[#2563EB] shadow-sm ring-1 ring-blue-100">
            <ClipboardList className="h-3.5 w-3.5" />
            Procedure
          </span>
        </header>

        <section className="jl-info-card mt-4 rounded-[30px] p-5">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/85 text-[#2563EB] shadow-sm">
              <ClipboardList className="h-5 w-5" />
            </span>
            <h1 className="text-3xl font-black tracking-tight">{text.title}</h1>
          </div>
          <p className="mt-2 text-sm font-bold leading-6 text-[#64748B]">{text.subtitle}</p>
          <p className="mt-4 rounded-2xl border border-orange-100 bg-orange-50 px-4 py-3 text-xs font-bold leading-5 text-[#C2410C]">{text.warning}</p>
        </section>

        <section className="mt-4">
          <div className="mb-2 flex items-center gap-2 text-sm font-black text-[#64748B]">
            <Search className="h-4 w-4" />
            {text.searchHint}
          </div>
          <button className="choice-card is-selected flex w-full items-center gap-3 rounded-[22px] border p-3 text-left shadow-sm transition-all duration-300" onClick={() => setScenePickerOpen((open) => !open)} type="button">
            <span className="choice-card-icon flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl shadow-sm">
              <selectedScene.icon className="h-5 w-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-base font-black">{selectedScene.title[language]}</span>
              <span className="mt-1 block truncate text-xs font-bold text-[#64748B]">{selectedScene.subtitle[language]}</span>
            </span>
            <ChevronRight className={`h-5 w-5 shrink-0 text-[#2563EB] transition ${scenePickerOpen ? "rotate-90" : ""}`} />
          </button>

          {scenePickerOpen ? (
            <div className="mt-3 grid grid-cols-2 gap-2.5 rounded-[26px] border border-white/60 bg-white/75 p-3 shadow-[0_12px_36px_rgba(37,99,235,0.08)] backdrop-blur-xl">
              {scenes.map((scene) => {
                const Icon = scene.icon;
                const active = scene.id === selectedScene.id;
                return (
                  <button className={`choice-card min-h-[92px] rounded-[20px] border p-3 text-left shadow-sm transition-all duration-300 ${active ? "is-selected" : "hover:bg-white"}`} key={scene.id} onClick={() => { setProcedureProgress({ ...progress, selectedSceneId: scene.id }); setScenePickerOpen(false); }} type="button">
                    <span className="choice-card-icon flex h-9 w-9 items-center justify-center rounded-2xl shadow-sm">
                      <Icon className="h-4.5 w-4.5" />
                    </span>
                    <h2 className="mt-2 truncate text-sm font-black">{scene.title[language]}</h2>
                    <p className="mt-1 line-clamp-2 text-[11px] font-bold leading-4 text-[#64748B]">{scene.subtitle[language]}</p>
                  </button>
                );
              })}
            </div>
          ) : null}
        </section>

        <section className="mt-5 rounded-[30px] bg-white p-5 shadow-[0_18px_45px_rgba(37,99,235,0.10)]">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-black text-[#2563EB]">{selectedScene.subtitle[language]}</p>
              <h2 className="mt-1 text-2xl font-black tracking-tight">{selectedScene.title[language]}</h2>
              <p className="mt-2 text-sm font-bold leading-6 text-[#64748B]">{selectedScene.description[language]}</p>
            </div>
            <button className="shrink-0 rounded-full bg-white px-3 py-2 text-xs font-black text-[#2563EB] shadow-sm ring-1 ring-blue-100" onClick={resetScene} type="button">
              <span className="inline-flex items-center gap-1">
                <RotateCcw className="h-3.5 w-3.5" />
                {text.clear}
              </span>
            </button>
          </div>
          <div className="mt-4 rounded-2xl border border-blue-100/80 bg-blue-50/80 p-3 shadow-sm">
            <div className="flex items-center justify-between text-xs font-black text-[#2563EB]">
              <span>{text.progress}</span>
              <span>{doneCount}/{totalCount} / {percent}%</span>
            </div>
            <div className="mt-2 h-2 rounded-full bg-white">
              <div className="h-full rounded-full bg-[#2563EB] transition-all duration-300" style={{ width: `${percent}%` }} />
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-4">
          {groupedSteps.map((group) => {
            const StageIcon = selectedScene.icon;
            const groupDoneCount = group.steps.filter((item) => doneIds.includes(item.id)).length;
            return (
              <article className="rounded-[24px] border border-stone-200/80 bg-white p-5 shadow-[0_10px_24px_rgba(32,38,34,0.07)]" key={group.timing}>
                <div className="flex items-center gap-3">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-800">
                    <StageIcon className="h-6 w-6" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-black text-emerald-700">{text.timing}</p>
                    <h2 className="text-xl font-black leading-tight">{group.timing}</h2>
                  </div>
                  <span className="shrink-0 rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-[#2563EB]">{groupDoneCount}/{group.steps.length}</span>
                </div>
                <div className="mt-4 grid gap-2">
                  {group.steps.map((item) => {
                    const done = doneIds.includes(item.id);
                    return (
                      <button className={`flex items-start gap-2 rounded-2xl px-3 py-2 text-left text-sm font-bold leading-6 transition active:scale-[0.99] ${done ? "bg-emerald-50 text-emerald-800" : "bg-stone-50 text-stone-700"}`} key={item.id} onClick={() => toggleStep(selectedScene.id, item.id, progress)} type="button">
                        <CheckCircle2 className={`mt-1 h-4 w-4 shrink-0 ${done ? "fill-emerald-100 text-emerald-700" : "text-stone-400"}`} />
                        <span className="min-w-0 flex-1">
                          <span className="block text-[15px] font-black leading-6 text-inherit">{item.title[language]}</span>
                          <span className="mt-1 block text-xs font-bold leading-5 text-[#64748B]"><span className="font-black text-[#0F172A]">{text.place}: </span>{item.place[language]}</span>
                          <span className="mt-1 block text-xs font-bold leading-5 text-[#64748B]">{item.note[language]}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </article>
            );
          })}
        </section>

        {selectedScene.id === "moving" ? (
          <section className="mt-5 rounded-[28px] border border-pink-100 bg-pink-50/80 p-4 shadow-sm">
            <h2 className="flex items-center gap-2 text-lg font-black text-[#BE185D]"><ClipboardList className="h-5 w-5" />{text.nextAfterMove}</h2>
            <ul className="mt-3 grid gap-2 text-sm font-bold leading-6 text-[#831843]">{text.nextAfterMoveItems.map((item) => <li className="rounded-2xl bg-white/80 px-3 py-2" key={item}>{item}</li>)}</ul>
          </section>
        ) : null}
      </div>
    </main>
  );
}

function L(zhCN: string, zhTW = zhCN, ja = zhCN): Localized {
  return { "zh-CN": zhCN, "zh-TW": zhTW, ja };
}

function S(id: string, title: string, place: string, timing: string, note: string, priority: ProcedureStep["priority"] = "normal"): ProcedureStep {
  const translated = procedureStepTranslations[id];
  return {
    id,
    note: { "zh-CN": note, "zh-TW": translated?.["zh-TW"].note ?? note, ja: translated?.ja.note ?? note },
    place: { "zh-CN": place, "zh-TW": translated?.["zh-TW"].place ?? place, ja: translated?.ja.place ?? place },
    priority,
    timing: { "zh-CN": timing, "zh-TW": translated?.["zh-TW"].timing ?? timing, ja: translated?.ja.timing ?? timing },
    title: { "zh-CN": title, "zh-TW": translated?.["zh-TW"].title ?? title, ja: translated?.ja.title ?? title },
  };
}

function makeScene(id: string, icon: LucideIcon, title: Localized, subtitle: Localized, description: Localized, steps: ProcedureStep[]): ProcedureScene {
  return { description, icon, id, steps, subtitle, title };
}

function groupProcedureSteps(steps: ProcedureStep[], language: LanguageKey) {
  const groups: Array<{ order: number; steps: ProcedureStep[]; timing: string }> = [];
  steps.forEach((item, index) => {
    const timing = item.timing[language];
    const existing = groups.find((group) => group.timing === timing);
    if (existing) existing.steps.push(item);
    else groups.push({ order: index, steps: [item], timing });
  });
  return groups.sort((a, b) => a.order - b.order);
}

function readProcedureProgress() {
  if (typeof window === "undefined") return emptySnapshot;
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return emptySnapshot;
    if (raw === cachedRaw) return cachedSnapshot;
    const parsed = JSON.parse(raw);
    const snapshot = normalizeProgress(parsed);
    cachedRaw = raw;
    cachedSnapshot = snapshot;
    return snapshot;
  } catch {
    return emptySnapshot;
  }
}

function normalizeProgress(value: unknown): ProcedureProgress {
  if (!value || typeof value !== "object" || Array.isArray(value)) return emptySnapshot;
  const input = value as { completed?: unknown; selectedSceneId?: unknown };
  const completed: Record<string, string[]> = {};
  if (input.completed && typeof input.completed === "object" && !Array.isArray(input.completed)) {
    Object.entries(input.completed).forEach(([sceneId, ids]) => {
      if (Array.isArray(ids)) completed[sceneId] = Array.from(new Set(ids.filter((id): id is string => typeof id === "string")));
    });
  }
  return { completed, selectedSceneId: typeof input.selectedSceneId === "string" ? input.selectedSceneId : "arrival" };
}

function setProcedureProgress(value: ProcedureProgress) {
  if (typeof window === "undefined") return;
  const raw = JSON.stringify(value);
  cachedRaw = raw;
  cachedSnapshot = value;
  window.localStorage.setItem(storageKey, raw);
  window.dispatchEvent(new Event(changeEvent));
}

function toggleStep(sceneId: string, stepId: string, progress: ProcedureProgress) {
  const current = progress.completed[sceneId] ?? [];
  const next = current.includes(stepId) ? current.filter((id) => id !== stepId) : [...current, stepId];
  setProcedureProgress({ ...progress, completed: { ...progress.completed, [sceneId]: next } });
}

function useProcedureProgress() {
  return useSyncExternalStore(
    (onStoreChange) => {
      window.addEventListener("storage", onStoreChange);
      window.addEventListener(changeEvent, onStoreChange);
      return () => {
        window.removeEventListener("storage", onStoreChange);
        window.removeEventListener(changeEvent, onStoreChange);
      };
    },
    readProcedureProgress,
    () => emptySnapshot,
  );
}
