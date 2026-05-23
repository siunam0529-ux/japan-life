"use client";

import { AlertCircle, Building2, CheckCircle2, ChevronRight, ClipboardList, Clock3, FileText, Home, MapPin, RotateCcw, Search } from "lucide-react";
import { useSyncExternalStore } from "react";
import { BackButton } from "@/components/BackButton";
import { useLanguage } from "@/hooks/useLanguage";

type ProcedureStep = {
  id: string;
  title: Record<LanguageKey, string>;
  place: Record<LanguageKey, string>;
  timing: Record<LanguageKey, string>;
  note: Record<LanguageKey, string>;
  priority?: "high" | "normal";
};

type ProcedureScene = {
  id: string;
  icon: typeof Home;
  title: Record<LanguageKey, string>;
  subtitle: Record<LanguageKey, string>;
  description: Record<LanguageKey, string>;
  steps: ProcedureStep[];
};

type LanguageKey = "zh-CN" | "zh-TW" | "ja";
type ProcedureProgress = { completed: Record<string, string[]>; selectedSceneId?: string };

const storageKey = "japan-life:procedure-navigator";
const changeEvent = "japan-life:procedure-navigator-change";
const emptySnapshot: ProcedureProgress = { completed: {}, selectedSceneId: "moving" };
let cachedRaw = "";
let cachedSnapshot: ProcedureProgress = emptySnapshot;

const copy = {
  "zh-CN": {
    back: "返回",
    clear: "清空进度",
    done: "已完成",
    nextAfterMove: "搬家后最容易漏的下一步",
    nextAfterMoveItems: ["确认新地址的垃圾分类日", "更新公司、学校、手机、保险和网购地址", "确认最近的医院、药局、超市、避难所", "把在留卡、保险证、驾照等证件放在同一个检查清单里"],
    place: "办理地点",
    progress: "完成进度",
    searchHint: "先选择一个生活场景，再按清单处理",
    timing: "建议时间",
    title: "日本手续导航",
    subtitle: "搬家、入学、换工作、回国这些事，按场景一步一步处理。",
    warning: "各自治体、学校、公司和入管要求可能不同。这里是生活清单，不替代官方说明。",
  },
  "zh-TW": {
    back: "返回",
    clear: "清空進度",
    done: "已完成",
    nextAfterMove: "搬家後最容易漏的下一步",
    nextAfterMoveItems: ["確認新地址的垃圾分類日", "更新公司、學校、手機、保險和網購地址", "確認最近的醫院、藥局、超市、避難所", "把在留卡、保險證、駕照等證件放在同一個檢查清單裡"],
    place: "辦理地點",
    progress: "完成進度",
    searchHint: "先選擇一個生活場景，再按清單處理",
    timing: "建議時間",
    title: "日本手續導航",
    subtitle: "搬家、入學、換工作、回國這些事，按場景一步一步處理。",
    warning: "各自治體、學校、公司和入管要求可能不同。這裡是生活清單，不替代官方說明。",
  },
  ja: {
    back: "戻る",
    clear: "進捗をクリア",
    done: "完了",
    nextAfterMove: "引っ越し後に忘れやすい次のこと",
    nextAfterMoveItems: ["新住所のごみ収集日を確認", "会社、学校、携帯、保険、通販の住所を更新", "近くの病院、薬局、スーパー、避難所を確認", "在留カード、保険証、運転免許証などを同じチェックリストで確認"],
    place: "手続き先",
    progress: "進捗",
    searchHint: "生活シーンを選び、チェックリストに沿って進めます",
    timing: "目安",
    title: "日本手続きナビ",
    subtitle: "引っ越し、入学、転職、帰国などをシーン別に整理します。",
    warning: "自治体、学校、会社、入管により必要書類や期限が異なります。必ず公式情報をご確認ください。",
  },
} as const;

const scenes: ProcedureScene[] = [
  {
    id: "moving",
    icon: Home,
    title: { "zh-CN": "搬家", "zh-TW": "搬家", ja: "引っ越し" },
    subtitle: { "zh-CN": "住民票、国保、在留卡、驾照、银行地址", "zh-TW": "住民票、國保、在留卡、駕照、銀行地址", ja: "住民票、国保、在留カード、免許、銀行住所" },
    description: { "zh-CN": "搬家前后最需要按顺序处理，尤其是地址变更。", "zh-TW": "搬家前後最需要按順序處理，尤其是地址變更。", ja: "引っ越し前後は住所変更を中心に順番に進めます。" },
    steps: [
      step("moving-out", "转出届 / 迁出手续", "轉出屆 / 遷出手續", "転出届", "旧住所市区町村役所", "舊住所市區町村役所", "旧住所の市区町村役所", "搬家前 14 天左右", "搬家前 14 天左右", "引っ越し前後14日以内", "跨市区町村搬家通常需要。拿到转出证明后再去新地址办理转入。", "跨市區町村搬家通常需要。拿到轉出證明後再去新地址辦理轉入。", "別の市区町村へ移る場合に必要です。"),
      step("moving-in", "转入届 / 住民票地址更新", "轉入屆 / 住民票地址更新", "転入届・住民票住所変更", "新住所市区町村役所", "新住所市區町村役所", "新住所の市区町村役所", "搬家后 14 天内", "搬家後 14 天內", "引っ越し後14日以内", "这是最核心的一步，后面的国保、年金、证明文件通常都跟它相关。", "這是最核心的一步，後面的國保、年金、證明文件通常都跟它相關。", "最優先の手続きです。"),
      step("residence-card-address", "在留卡地址变更", "在留卡地址變更", "在留カード住所変更", "新住所市区町村役所", "新住所市區町村役所", "新住所の市区町村役所", "搬家后 14 天内", "搬家後 14 天內", "引っ越し後14日以内", "通常在办理住民票地址时一并处理。记得带在留卡。", "通常在辦理住民票地址時一併處理。記得帶在留卡。", "在留カードを持参してください。", "high"),
      step("health-insurance", "国民健康保险地址变更", "國民健康保險地址變更", "国民健康保険の住所変更", "市区町村役所国保窗口", "市區町村役所國保窗口", "市区町村役所の国保窓口", "住民票更新后尽快", "住民票更新後盡快", "住民票変更後なるべく早く", "加入公司社保的人一般由公司处理，国保用户需要自己确认。", "加入公司社保的人一般由公司處理，國保用戶需要自己確認。", "国保加入者は確認してください。"),
      step("pension", "国民年金地址确认", "國民年金地址確認", "国民年金の住所確認", "市区町村役所 / 年金事务所", "市區町村役所 / 年金事務所", "市区町村役所 / 年金事務所", "住民票更新后", "住民票更新後", "住民票変更後", "学生、自由职业、未加入厚生年金的人建议确认。", "學生、自由職業、未加入厚生年金的人建議確認。", "必要に応じて確認します。"),
      step("driver-license", "驾照地址变更", "駕照地址變更", "運転免許証の住所変更", "警察署 / 免许中心", "警察署 / 免許中心", "警察署 / 運転免許センター", "搬家后尽快", "搬家後盡快", "引っ越し後なるべく早く", "一般需要新地址证明，例如住民票、公共料金账单等。", "一般需要新地址證明，例如住民票、公共料金帳單等。", "新住所を確認できる書類が必要です。"),
      step("bank-phone", "银行、手机、信用卡地址更新", "銀行、手機、信用卡地址更新", "銀行・携帯・クレカ住所更新", "各 App / 店铺 / 官网", "各 App / 店鋪 / 官網", "各アプリ / 店舗 / 公式サイト", "搬家后尽快", "搬家後盡快", "引っ越し後なるべく早く", "避免重要信件、银行卡、SIM、账单寄到旧地址。", "避免重要信件、銀行卡、SIM、帳單寄到舊地址。", "重要書類が旧住所に届かないようにします。", "high"),
      step("postal-forwarding", "邮局转送服务", "郵局轉送服務", "郵便局の転送届", "邮局 / 日本邮便官网", "郵局 / 日本郵便官網", "郵便局 / 日本郵便Web", "搬家前后", "搬家前後", "引っ越し前後", "设置后旧地址信件可在一定期间转送到新地址。", "設定後舊地址信件可在一定期間轉送到新地址。", "一定期間、旧住所宛の郵便物を新住所へ転送できます。"),
    ],
  },
  {
    id: "arrival",
    icon: MapPin,
    title: { "zh-CN": "初到日本", "zh-TW": "初到日本", ja: "来日直後" },
    subtitle: { "zh-CN": "住民登记、保险、手机、银行、My Number", "zh-TW": "住民登記、保險、手機、銀行、My Number", ja: "住民登録、保険、携帯、銀行、マイナンバー" },
    description: { "zh-CN": "刚到日本先把身份、住址、通信和钱处理好。", "zh-TW": "剛到日本先把身份、住址、通信和錢處理好。", ja: "まず住所、保険、通信、お金まわりを整えます。" },
    steps: [
      step("arrival-resident", "住民登记", "住民登記", "住民登録", "居住地市区町村役所", "居住地市區町村役所", "市区町村役所", "入境并确定住址后 14 天内", "入境並確定住址後 14 天內", "住所を定めてから14日以内", "带护照、在留卡、地址信息。", "帶護照、在留卡、地址資訊。", "パスポート、在留カード、住所情報を持参。", "high"),
      step("arrival-insurance", "加入国民健康保险", "加入國民健康保險", "国民健康保険加入", "市区町村役所", "市區町村役所", "市区町村役所", "住民登记时一起确认", "住民登記時一起確認", "住民登録時に確認", "公司社保对象除外。留学生多半需要确认国保。", "公司社保對象除外。留學生多半需要確認國保。", "会社の社保対象でない場合は確認。"),
      step("arrival-bank", "开银行账户", "開銀行帳戶", "銀行口座開設", "银行网点 / App", "銀行網點 / App", "銀行店舗 / アプリ", "拿到地址和手机后", "拿到地址和手機後", "住所・電話番号の準備後", "不同银行对在留期间、手机号、学生证要求不同。", "不同銀行對在留期間、手機號、學生證要求不同。", "銀行により条件が異なります。"),
      step("arrival-phone", "办理手机号码", "辦理手機號碼", "携帯番号契約", "运营商 / 格安 SIM", "電信商 / 格安 SIM", "通信会社 / 格安SIM", "尽快", "盡快", "なるべく早く", "很多手续需要日本手机号。", "很多手續需要日本手機號。", "多くの手続きで日本の電話番号が必要です。"),
      step("arrival-my-number", "领取 My Number 通知", "領取 My Number 通知", "マイナンバー通知確認", "住址信箱 / 市区町村", "住址信箱 / 市區町村", "住所地 / 市区町村", "住民登记后", "住民登記後", "住民登録後", "之后打工、税、行政手续可能会用到。", "之後打工、稅、行政手續可能會用到。", "税・勤務・行政手続きで必要になる場合があります。"),
      step("arrival-work-permit", "资格外活动许可确认", "資格外活動許可確認", "資格外活動許可の確認", "入管 / 在留卡背面", "入管 / 在留卡背面", "入管 / 在留カード裏面", "开始打工前", "開始打工前", "アルバイト開始前", "留学生打工前必须确认。", "留學生打工前必須確認。", "留学生はアルバイト前に必ず確認。", "high"),
    ],
  },
  {
    id: "job-change",
    icon: Building2,
    title: { "zh-CN": "换工作 / 入社退社", "zh-TW": "換工作 / 入社退社", ja: "転職・入退社" },
    subtitle: { "zh-CN": "社保、雇佣保险、住民税、入管届出", "zh-TW": "社保、雇用保險、住民稅、入管申報", ja: "社保、雇用保険、住民税、入管届出" },
    description: { "zh-CN": "换工作不只是签合同，还要确认保险、税和在留相关手续。", "zh-TW": "換工作不只是簽合同，還要確認保險、稅和在留相關手續。", ja: "契約だけでなく、保険・税金・在留関連を確認します。" },
    steps: [
      step("job-contract", "确认雇佣合同和工作条件", "確認雇用合同和工作條件", "雇用契約・労働条件確認", "公司 / 人事", "公司 / 人事", "会社 / 人事", "入社前", "入社前", "入社前", "确认工资、工时、社保、试用期和交通费。", "確認薪資、工時、社保、試用期和交通費。", "給与、勤務時間、社保、試用期間、交通費を確認。", "high"),
      step("job-insurance", "社保 / 雇佣保险切换", "社保 / 雇用保險切換", "社会保険・雇用保険の切替", "公司 / 年金事务所 / 市区町村", "公司 / 年金事務所 / 市區町村", "会社 / 年金事務所 / 市区町村", "退社入社前后", "退社入社前後", "退職・入社前後", "空档期可能需要国保、国民年金。", "空檔期可能需要國保、國民年金。", "空白期間は国保・国民年金が必要な場合があります。"),
      step("job-resident-tax", "住民税缴纳方式确认", "住民稅繳納方式確認", "住民税の納付方法確認", "公司 / 市区町村", "公司 / 市區町村", "会社 / 市区町村", "换工作时", "換工作時", "転職時", "确认是普通征收还是特别征收。", "確認是普通徵收還是特別徵收。", "普通徴収か特別徴収かを確認。"),
      step("job-immigration", "所属机关变更届出", "所屬機關變更申報", "所属機関変更の届出", "入管线上系统 / 入管窗口", "入管線上系統 / 入管窗口", "入管オンライン / 窓口", "变更后 14 天内为宜", "變更後 14 天內為宜", "変更後14日以内が目安", "就劳类在留资格通常需要确认。", "就勞類在留資格通常需要確認。", "就労系在留資格は確認が必要です。", "high"),
    ],
  },
  {
    id: "school",
    icon: FileText,
    title: { "zh-CN": "入学 / 毕业", "zh-TW": "入學 / 畢業", ja: "入学・卒業" },
    subtitle: { "zh-CN": "学生证、国保减免、打工资格、在留更新", "zh-TW": "學生證、國保減免、打工資格、在留更新", ja: "学生証、国保減免、資格外活動、在留更新" },
    description: { "zh-CN": "留学生尤其要注意国保减免、打工许可和毕业后的在留状态。", "zh-TW": "留學生尤其要注意國保減免、打工許可和畢業後的在留狀態。", ja: "留学生は国保減免、資格外活動、卒業後の在留に注意します。" },
    steps: [
      step("school-id", "领取学生证 / 在学证明", "領取學生證 / 在學證明", "学生証・在学証明", "学校", "學校", "学校", "入学后", "入學後", "入学後", "很多手续会用到学生身份文件。", "很多手續會用到學生身份文件。", "各種手続きで必要になる場合があります。"),
      step("school-insurance-reduction", "国保学生减免确认", "國保學生減免確認", "国保の学生減免確認", "市区町村役所", "市區町村役所", "市区町村役所", "入学后尽快", "入學後盡快", "入学後なるべく早く", "部分地区可按收入/学生身份申请减免。", "部分地區可按收入/學生身份申請減免。", "自治体により減免制度があります。"),
      step("school-work-permit", "资格外活动许可", "資格外活動許可", "資格外活動許可", "入管", "入管", "入管", "打工前", "打工前", "アルバイト前", "没有许可不要开始打工。", "沒有許可不要開始打工。", "許可前にアルバイトを始めないでください。", "high"),
      step("school-graduation", "毕业后在留状态确认", "畢業後在留狀態確認", "卒業後の在留確認", "学校 / 入管", "學校 / 入管", "学校 / 入管", "毕业前", "畢業前", "卒業前", "毕业、退学、升学、就职都会影响在留安排。", "畢業、退學、升學、就職都會影響在留安排。", "卒業・退学・進学・就職で在留手続きが変わります。", "high"),
    ],
  },
  {
    id: "lost-documents",
    icon: AlertCircle,
    title: { "zh-CN": "证件丢失", "zh-TW": "證件遺失", ja: "書類紛失" },
    subtitle: { "zh-CN": "在留卡、钱包、银行卡、驾照、保险证", "zh-TW": "在留卡、錢包、銀行卡、駕照、保險證", ja: "在留カード、財布、銀行カード、免許、保険証" },
    description: { "zh-CN": "先止损，再补办。证件丢失建议当天处理。", "zh-TW": "先止損，再補辦。證件遺失建議當天處理。", ja: "まず停止・届出、その後再発行します。" },
    steps: [
      step("lost-police", "去警察署交遗失届", "去警察署交遺失屆", "警察署で遺失届", "警察署 / 交番", "警察署 / 交番", "警察署 / 交番", "发现后尽快", "發現後盡快", "気づいたらすぐ", "拿到受理编号，补办时可能需要。", "拿到受理編號，補辦時可能需要。", "受理番号を控えます。", "high"),
      step("lost-residence-card", "在留卡再交付申请", "在留卡再交付申請", "在留カード再交付", "入管", "入管", "入管", "原则上 14 天内", "原則上 14 天內", "原則14日以内", "护照、照片、遗失届编号等可能需要。", "護照、照片、遺失屆編號等可能需要。", "パスポート、写真、遺失届番号などを準備。", "high"),
      step("lost-bank-card", "银行卡 / 信用卡挂失", "銀行卡 / 信用卡掛失", "銀行カード・クレカ停止", "银行 / 信用卡公司", "銀行 / 信用卡公司", "銀行 / カード会社", "立即", "立即", "すぐ", "先冻结再补办，避免被盗刷。", "先凍結再補辦，避免被盜刷。", "不正利用を防ぐため停止します。", "high"),
      step("lost-insurance", "保险证补办", "保險證補辦", "保険証再発行", "公司 / 市区町村", "公司 / 市區町村", "会社 / 市区町村", "需要就医前尽快", "需要就醫前盡快", "必要に応じて早めに", "公司社保找公司，国保找役所。", "公司社保找公司，國保找役所。", "社保は会社、国保は役所へ。"),
    ],
  },
  {
    id: "leaving-japan",
    icon: ClipboardList,
    title: { "zh-CN": "回国 / 离日", "zh-TW": "回國 / 離日", ja: "帰国・離日" },
    subtitle: { "zh-CN": "退租、转出、保险、年金、银行、手机", "zh-TW": "退租、轉出、保險、年金、銀行、手機", ja: "退去、転出、保険、年金、銀行、携帯" },
    description: { "zh-CN": "离日前要把合约、税、保险和住民手续收尾。", "zh-TW": "離日前要把合約、稅、保險和住民手續收尾。", ja: "契約、税金、保険、住民手続きを整理します。" },
    steps: [
      step("leave-rent", "退租和水电煤解约", "退租和水電煤解約", "退去・ライフライン解約", "房东 / 管理公司 / 各公司", "房東 / 管理公司 / 各公司", "管理会社 / 各会社", "离日前 1 个月左右", "離日前 1 個月左右", "約1か月前", "确认退房日、清洁费、押金精算。", "確認退房日、清潔費、押金結算。", "退去日、清掃費、敷金精算を確認。"),
      step("leave-moving-out", "海外转出届", "海外轉出屆", "海外転出届", "市区町村役所", "市區町村役所", "市区町村役所", "离日前后", "離日前後", "出国前後", "离开日本较长时间通常需要确认。", "離開日本較長時間通常需要確認。", "長期離日・帰国時に確認。", "high"),
      step("leave-insurance", "国保 / 年金退出或结算", "國保 / 年金退出或結算", "国保・年金の精算", "市区町村 / 年金事务所", "市區町村 / 年金事務所", "市区町村 / 年金事務所", "转出时", "轉出時", "転出時", "确认未缴费用和退还/脱退手续。", "確認未繳費用和退還/退出手續。", "未納・還付・脱退を確認。"),
      step("leave-phone-bank", "手机、银行、信用卡处理", "手機、銀行、信用卡處理", "携帯・銀行・クレカ整理", "各公司", "各公司", "各会社", "离日前", "離日前", "出国前", "不要留下自动扣款和无法收取的账单。", "不要留下自動扣款和無法收取的帳單。", "自動引落や請求を残さないようにします。"),
      step("leave-tax", "住民税和收入税确认", "住民稅和所得稅確認", "住民税・所得税確認", "公司 / 市区町村 / 税务署", "公司 / 市區町村 / 稅務署", "会社 / 市区町村 / 税務署", "离日前", "離日前", "出国前", "确认剩余住民税、源泉征收票、纳税管理人等。", "確認剩餘住民稅、源泉徵收票、納稅管理人等。", "残りの住民税、源泉徴収票、納税管理人などを確認。"),
    ],
  },
  {
    id: "family",
    icon: CheckCircle2,
    title: { "zh-CN": "结婚 / 生子", "zh-TW": "結婚 / 生子", ja: "結婚・出産" },
    subtitle: { "zh-CN": "婚姻届、出生届、保险、补助、在留", "zh-TW": "婚姻屆、出生屆、保險、補助、在留", ja: "婚姻届、出生届、保険、手当、在留" },
    description: { "zh-CN": "家庭状态变化会影响住民票、保险、税和在留。", "zh-TW": "家庭狀態變化會影響住民票、保險、稅和在留。", ja: "家族状況の変更は住民票、保険、税、在留に関わります。" },
    steps: [
      step("family-marriage", "婚姻届 / 关系证明", "婚姻屆 / 關係證明", "婚姻届・関係証明", "市区町村 / 大使馆", "市區町村 / 大使館", "市区町村 / 大使館", "办理前先确认材料", "辦理前先確認材料", "事前に書類確認", "跨国婚姻材料差异很大，先问窗口。", "跨國婚姻材料差異很大，先問窗口。", "国際結婚は必要書類が異なります。"),
      step("family-birth", "出生届", "出生屆", "出生届", "市区町村役所", "市區町村役所", "市区町村役所", "出生后 14 天内", "出生後 14 天內", "出生後14日以内", "之后还会涉及保险、儿童补助和在留。", "之後還會涉及保險、兒童補助和在留。", "保険、児童手当、在留にも関係します。", "high"),
      step("family-child-support", "儿童补助 / 医疗助成", "兒童補助 / 醫療補助", "児童手当・医療助成", "市区町村役所", "市區町村役所", "市区町村役所", "出生届后尽快", "出生屆後盡快", "出生届後なるべく早く", "各自治体制度不同。", "各自治體制度不同。", "自治体により制度が異なります。"),
      step("family-immigration", "家属在留手续确认", "家屬在留手續確認", "家族の在留手続き確認", "入管", "入管", "入管", "状态变化后", "狀態變化後", "状況変更後", "婚姻、出生、扶养关系可能影响在留资格。", "婚姻、出生、扶養關係可能影響在留資格。", "在留資格に影響する場合があります。"),
    ],
  },
];

export default function ProcedureNavigatorPage() {
  const { language } = useLanguage();
  const text = copy[language];
  const progress = useProcedureProgress();
  const selectedSceneId = progress.selectedSceneId ?? "moving";
  const selectedScene = scenes.find((scene) => scene.id === selectedSceneId) ?? scenes[0];
  const doneIds = progress.completed[selectedScene.id] ?? [];
  const doneCount = doneIds.length;
  const totalCount = selectedScene.steps.length;
  const percent = Math.round((doneCount / totalCount) * 100);

  const resetScene = () => {
    setProcedureProgress({
      ...progress,
      completed: { ...progress.completed, [selectedScene.id]: [] },
    });
  };

  return (
    <main className="min-h-screen bg-[#F6FAFF] text-[#0F172A]">
      <div className="mx-auto min-h-screen max-w-[430px] bg-[radial-gradient(circle_at_top,#DFF1FF_0%,#F6FAFF_42%,#FFFFFF_100%)] px-4 pb-24 pt-5">
        <header className="flex items-center justify-between gap-3">
          <BackButton label={text.back} />
          <span className="inline-flex items-center gap-1 rounded-full bg-white/75 px-3 py-2 text-xs font-black text-[#2563EB] shadow-sm ring-1 ring-white/60 backdrop-blur-xl">
            <ClipboardList className="h-3.5 w-3.5" />
            Procedure
          </span>
        </header>

        <section className="mt-4 rounded-[30px] border border-white/60 bg-white/75 p-5 shadow-[0_18px_45px_rgba(37,99,235,0.10)] backdrop-blur-xl">
          <span className="flex h-14 w-14 items-center justify-center rounded-3xl bg-gradient-to-br from-sky-100 to-blue-100 text-[#2563EB] shadow-sm">
            <ClipboardList className="h-7 w-7" />
          </span>
          <h1 className="mt-4 text-3xl font-black tracking-tight">{text.title}</h1>
          <p className="mt-2 text-sm font-bold leading-6 text-[#64748B]">{text.subtitle}</p>
          <p className="mt-4 rounded-3xl bg-orange-50/90 px-4 py-3 text-xs font-bold leading-5 text-[#C2410C] ring-1 ring-orange-100">{text.warning}</p>
        </section>

        <section className="mt-4">
          <div className="mb-2 flex items-center gap-2 text-sm font-black text-[#64748B]">
            <Search className="h-4 w-4" />
            {text.searchHint}
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            {scenes.map((scene) => {
              const Icon = scene.icon;
              const active = scene.id === selectedScene.id;
              return (
                <button
                  className={`choice-card min-h-[116px] rounded-[24px] border p-3 text-left shadow-sm transition-all duration-300 ${
                    active ? "is-selected" : "hover:bg-white"
                  }`}
                  key={scene.id}
                  onClick={() => setProcedureProgress({ ...progress, selectedSceneId: scene.id })}
                  type="button"
                >
                  <span className="choice-card-icon flex h-10 w-10 items-center justify-center rounded-2xl shadow-sm">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h2 className="mt-2 text-base font-black">{scene.title[language]}</h2>
                  <p className="mt-1 line-clamp-2 text-xs font-bold leading-5 text-[#64748B]">{scene.subtitle[language]}</p>
                </button>
              );
            })}
          </div>
        </section>

        <section className="mt-5 rounded-[28px] border border-white/60 bg-white/75 p-4 shadow-[0_12px_36px_rgba(37,99,235,0.08)] backdrop-blur-xl">
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
          <div className="mt-4 rounded-3xl bg-blue-50/90 p-3">
            <div className="flex items-center justify-between text-xs font-black text-[#2563EB]">
              <span>{text.progress}</span>
              <span>{doneCount}/{totalCount} · {percent}%</span>
            </div>
            <div className="mt-2 h-2 rounded-full bg-white">
              <div className="h-full rounded-full bg-[#2563EB] transition-all duration-300" style={{ width: `${percent}%` }} />
            </div>
          </div>
        </section>

        <section className="mt-4 grid gap-3">
          {selectedScene.steps.map((item) => {
            const done = doneIds.includes(item.id);
            return (
              <button
                className={`rounded-[26px] border p-4 text-left shadow-[0_10px_32px_rgba(37,99,235,0.08)] backdrop-blur-xl transition-all duration-300 ${
                  done ? "border-emerald-100 bg-emerald-50/90" : item.priority === "high" ? "border-blue-100 bg-white/85" : "border-white/60 bg-white/75"
                }`}
                key={item.id}
                onClick={() => toggleStep(selectedScene.id, item.id, progress)}
                type="button"
              >
                <div className="flex items-start gap-3">
                  <span className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl ${done ? "bg-emerald-600 text-white" : "bg-blue-50 text-[#2563EB]"}`}>
                    {done ? <CheckCircle2 className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-base font-black">{item.title[language]}</h3>
                      {item.priority === "high" && !done ? <span className="shrink-0 rounded-full bg-orange-50 px-2 py-1 text-[10px] font-black text-[#F97316]">重要</span> : null}
                    </div>
                    <div className="mt-3 grid gap-2 text-xs font-bold leading-5 text-[#64748B]">
                      <p className="rounded-2xl bg-white/80 px-3 py-2">
                        <span className="font-black text-[#0F172A]">{text.place}: </span>{item.place[language]}
                      </p>
                      <p className="rounded-2xl bg-white/80 px-3 py-2">
                        <span className="font-black text-[#0F172A]">{text.timing}: </span>{item.timing[language]}
                      </p>
                      <p className="px-1">{item.note[language]}</p>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </section>

        {selectedScene.id === "moving" ? (
          <section className="mt-5 rounded-[28px] border border-pink-100 bg-pink-50/80 p-4 shadow-sm">
            <h2 className="flex items-center gap-2 text-lg font-black text-[#BE185D]">
              <Clock3 className="h-5 w-5" />
              {text.nextAfterMove}
            </h2>
            <ul className="mt-3 grid gap-2 text-sm font-bold leading-6 text-[#831843]">
              {text.nextAfterMoveItems.map((item) => <li className="rounded-2xl bg-white/80 px-3 py-2" key={item}>{item}</li>)}
            </ul>
          </section>
        ) : null}
      </div>
    </main>
  );
}

function step(
  id: string,
  zhCNTitle: string,
  zhTWTitle: string,
  jaTitle: string,
  zhCNPlace: string,
  zhTWPlace: string,
  jaPlace: string,
  zhCNTiming: string,
  zhTWTiming: string,
  jaTiming: string,
  zhCNNote: string,
  zhTWNote: string,
  jaNote: string,
  priority: ProcedureStep["priority"] = "normal",
): ProcedureStep {
  return {
    id,
    note: { "zh-CN": zhCNNote, "zh-TW": zhTWNote, ja: jaNote },
    place: { "zh-CN": zhCNPlace, "zh-TW": zhTWPlace, ja: jaPlace },
    priority,
    timing: { "zh-CN": zhCNTiming, "zh-TW": zhTWTiming, ja: jaTiming },
    title: { "zh-CN": zhCNTitle, "zh-TW": zhTWTitle, ja: jaTitle },
  };
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

function normalizeProgress(value: unknown): { completed: Record<string, string[]>; selectedSceneId?: string } {
  if (!value || typeof value !== "object" || Array.isArray(value)) return emptySnapshot;
  const input = value as { completed?: unknown; selectedSceneId?: unknown };
  const completed: Record<string, string[]> = {};
  if (input.completed && typeof input.completed === "object" && !Array.isArray(input.completed)) {
    Object.entries(input.completed).forEach(([sceneId, ids]) => {
      if (Array.isArray(ids)) completed[sceneId] = Array.from(new Set(ids.filter((id): id is string => typeof id === "string")));
    });
  }
  return {
    completed,
    selectedSceneId: typeof input.selectedSceneId === "string" ? input.selectedSceneId : "moving",
  };
}

function setProcedureProgress(value: { completed: Record<string, string[]>; selectedSceneId?: string }) {
  if (typeof window === "undefined") return;
  const raw = JSON.stringify(value);
  cachedRaw = raw;
  cachedSnapshot = value;
  window.localStorage.setItem(storageKey, raw);
  window.dispatchEvent(new Event(changeEvent));
}

function toggleStep(sceneId: string, stepId: string, progress: { completed: Record<string, string[]>; selectedSceneId?: string }) {
  const current = progress.completed[sceneId] ?? [];
  const next = current.includes(stepId) ? current.filter((id) => id !== stepId) : [...current, stepId];
  setProcedureProgress({
    ...progress,
    completed: { ...progress.completed, [sceneId]: next },
  });
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
