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
    S("arrival-work-hours", "记录每周工时，避免超过 28 小时限制", "工时工具 / 排班表", "开始打工前", "留学生通常每周 28 小时，长假规则需要另行确认。", "high"),
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
    <main className="min-h-screen bg-[#f5f0e7] text-stone-950">
      <div className="mx-auto min-h-screen max-w-[430px] bg-[#fbf8f2] px-4 pb-24 pt-5 shadow-2xl shadow-stone-300/40">
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
  return { id, note: L(note), place: L(place), priority, timing: L(timing), title: L(title) };
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
