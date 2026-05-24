"use client";

import { CheckCircle2, ChevronRight, Home, ListChecks, PackageCheck, Plane, RotateCcw, ShieldCheck, ShoppingBag, Smartphone, WalletCards } from "lucide-react";
import { useSyncExternalStore } from "react";
import { BackButton } from "@/components/BackButton";
import { useLanguage } from "@/hooks/useLanguage";

type LanguageKey = "zh-CN" | "zh-TW" | "ja";
type ChecklistItem = {
  id: string;
  title: Record<LanguageKey, string>;
  note: Record<LanguageKey, string>;
  priority?: "high" | "normal";
};
type ChecklistSection = {
  id: string;
  icon: typeof ListChecks;
  title: Record<LanguageKey, string>;
  subtitle: Record<LanguageKey, string>;
  items: ChecklistItem[];
};
type ChecklistProgress = Record<string, string[]>;

const storageKey = "japan-life:life-checklist";
const changeEvent = "japan-life:life-checklist-change";
const emptySnapshot: ChecklistProgress = {};
let cachedRaw = "";
let cachedSnapshot: ChecklistProgress = emptySnapshot;

const copy = {
  "zh-CN": {
    back: "返回",
    clear: "清空进度",
    done: "已准备",
    progress: "完成进度",
    title: "日本生活 Checklist",
    subtitle: "第一次来日本前后，把要带、要买、要开通的东西一次整理好。",
    tipTitle: "建议顺序",
    tipBody: "先处理身份和通信，再处理钱、住处、日用品。手续类可搭配“手续导航”一起看。",
  },
  "zh-TW": {
    back: "返回",
    clear: "清空進度",
    done: "已準備",
    progress: "完成進度",
    title: "日本生活 Checklist",
    subtitle: "第一次來日本前後，把要帶、要買、要開通的東西一次整理好。",
    tipTitle: "建議順序",
    tipBody: "先處理身份和通信，再處理錢、住處、日用品。手續類可搭配「手續導航」一起看。",
  },
  ja: {
    back: "戻る",
    clear: "進捗をクリア",
    done: "準備済み",
    progress: "進捗",
    title: "日本生活チェック",
    subtitle: "初めて日本に来る前後に、持ってくるもの・買うもの・契約するものを整理します。",
    tipTitle: "おすすめの順番",
    tipBody: "まず身分証と通信、次にお金、住まい、日用品を整えます。手続きは「手続きナビ」と一緒に確認できます。",
  },
} as const;

const sections: ChecklistSection[] = [
  {
    id: "before-departure",
    icon: Plane,
    title: { "zh-CN": "出发前准备", "zh-TW": "出發前準備", ja: "出発前の準備" },
    subtitle: {
      "zh-CN": "证件、现金、通信、住宿和入境信息先整理好",
      "zh-TW": "證件、現金、通訊、住宿和入境資訊先整理好",
      ja: "書類・現金・通信・住まい・入国情報を事前に整理",
    },
    items: [
      item("pre-passport-visa", "确认护照、签证和在留资格有效期", "確認護照、簽證和在留資格有效期", "パスポート・ビザ・在留資格の期限確認", "护照有效期、签证类型、COE 或入学/入职资料建议出发前再核对一次。", "護照有效期、簽證類型、COE 或入學/入職資料建議出發前再核對一次。", "期限、ビザ種別、COEや入学・入社書類を出発前に再確認。", "high"),
      item("pre-document-backup", "把重要文件拍照并云端备份", "把重要文件拍照並雲端備份", "重要書類を撮影してクラウド保存", "护照、在留资料、住宿合同、保险、录取通知都建议纸质和电子版各一份。", "護照、在留資料、住宿合約、保險、錄取通知都建議紙本和電子版各一份。", "パスポート、在留書類、住居契約、保険、受入書類を紙とデータで保存。", "high"),
      item("pre-arrival-address", "准备入境要填写的日本地址", "準備入境要填寫的日本地址", "入国時に書く日本住所を準備", "住宿地址、邮编、学校/公司电话先存在手机和纸上，入境卡会用到。", "住宿地址、郵遞區號、學校/公司電話先存在手機和紙上，入境卡會用到。", "滞在先住所、郵便番号、学校・会社電話をスマホと紙に控えます。", "high"),
      item("pre-arrival-route", "确认机场到住处路线", "確認機場到住處路線", "空港から住まいまでの経路確認", "把电车、巴士、出租车、末班车和大件行李路线提前查好。", "把電車、巴士、計程車、末班車和大件行李路線提前查好。", "電車、バス、タクシー、終電、大きな荷物の移動ルートを確認。", "high"),
      item("pre-first-week-cash", "准备第一周现金", "準備第一週現金", "最初の1週間分の現金を用意", "刚到时银行卡、支付 App 可能不能马上用，建议准备交通、吃饭、生活用品现金。", "剛到時銀行卡、支付 App 可能不能馬上用，建議準備交通、吃飯、生活用品現金。", "到着直後はカードや決済アプリが使えない場合があるため現金を準備。", "high"),
      item("pre-card-overseas", "确认海外可用银行卡 / 信用卡", "確認海外可用銀行卡 / 信用卡", "海外利用できるカードを確認", "确认是否开通海外取现、消费、验证码接收和限额。", "確認是否開通海外提款、消費、驗證碼接收和額度。", "海外利用、引き出し、認証コード、利用限度額を確認。"),
      item("pre-esim-roaming", "准备落地 eSIM 或国际漫游", "準備落地 eSIM 或國際漫遊", "到着後のeSIM・国際ローミング準備", "至少保证落地当天能上网查路线、联系房东或学校。", "至少保證落地當天能上網查路線、聯絡房東或學校。", "到着日に経路検索や連絡ができるよう通信手段を確保。", "high"),
      item("pre-medicine", "准备常用药和药品说明", "準備常用藥和藥品說明", "常備薬と薬の説明を準備", "长期服药、过敏药、肠胃药、止痛药等要确认能否携带，最好保留包装说明。", "長期服藥、過敏藥、腸胃藥、止痛藥等要確認能否攜帶，最好保留包裝說明。", "常用薬、アレルギー薬、胃腸薬などは持ち込み可否と説明書を確認。"),
      item("pre-luggage-rule", "确认行李重量和禁止携带品", "確認行李重量和禁止攜帶品", "荷物重量と持ち込み禁止品を確認", "航空公司重量、液体、食品、药品、刀具、电池规则出发前一定要看。", "航空公司重量、液體、食品、藥品、刀具、電池規則出發前一定要看。", "航空会社の重量、液体、食品、薬、刃物、電池ルールを確認。", "high"),
      item("pre-power-bank", "确认充电宝和电子设备规则", "確認行動電源和電子設備規則", "モバイルバッテリーと電子機器ルール確認", "充电宝通常要随身携带，容量和数量限制要按航空公司规则确认。", "行動電源通常要隨身攜帶，容量和數量限制要按航空公司規則確認。", "モバイルバッテリーは機内持ち込みが基本。容量と個数制限を確認。"),
      item("pre-emergency-share", "把航班和紧急联系方式发给家人", "把航班和緊急聯絡方式發給家人", "家族へ便名と緊急連絡先を共有", "航班号、到达时间、住宿地址、日本联系人建议提前共享。", "航班號、到達時間、住宿地址、日本聯絡人建議提前共享。", "便名、到着時刻、滞在先、日本の連絡先を共有。"),
      item("pre-offline-apps", "下载离线地图、翻译和交通 App", "下載離線地圖、翻譯和交通 App", "オフライン地図・翻訳・交通アプリを準備", "网络不稳定时也能查地址、看菜单、找路线。", "網路不穩時也能查地址、看菜單、找路線。", "通信が不安定でも住所、メニュー、経路を確認できます。"),
      item("pre-movein-check", "确认入住时间和钥匙领取方式", "確認入住時間和鑰匙領取方式", "入居時間と鍵の受け取り方法を確認", "确认能不能当天入住、几点拿钥匙、晚到怎么办、是否需要提前付款。", "確認能不能當天入住、幾點拿鑰匙、晚到怎麼辦、是否需要提前付款。", "当日入居可否、鍵の受け取り、遅到時対応、事前支払いを確認。", "high"),
      item("pre-id-photo", "准备证件照电子版和纸质版", "準備證件照電子版和紙本", "証明写真のデータと紙を用意", "打工、学校、行政手续、再交付时可能会用到。", "打工、學校、行政手續、再交付時可能會用到。", "アルバイト、学校、行政手続き、再発行で使う場合があります。"),
      item("pre-home-phone-bank", "整理原国家手机号、银行和验证码方式", "整理原國家手機號、銀行和驗證碼方式", "母国の電話番号・銀行・認証方法を整理", "到日本后如果收不到验证码，登录银行、邮箱、社交账号会很麻烦。", "到日本後如果收不到驗證碼，登入銀行、信箱、社群帳號會很麻煩。", "来日後に認証コードを受け取れないと銀行やメールのログインで困ります。", "high"),
      item("pre-adapter-voltage", "准备转换插头并确认电压", "準備轉換插頭並確認電壓", "変換プラグと電圧を確認", "日本常见 A 型插头、100V 电压，吹风机等电器要特别确认。", "日本常見 A 型插頭、100V 電壓，吹風機等電器要特別確認。", "日本はAタイプ・100Vが一般的。ドライヤーなどは要確認。"),
    ],
  },
  {
    id: "first-week",
    icon: Plane,
    title: { "zh-CN": "第一次来日本必做", "zh-TW": "第一次來日本必做", ja: "来日直後にやること" },
    subtitle: { "zh-CN": "手机、银行卡、印章、国保、My Number", "zh-TW": "手機、銀行卡、印章、國保、My Number", ja: "携帯、銀行、印鑑、国保、マイナンバー" },
    items: [
      item("phone-number", "办理日本手机号", "辦理日本手機號碼", "日本の携帯番号を契約", "很多银行、App、学校和打工手续都需要日本手机号。", "很多銀行、App、學校和打工手續都需要日本手機號。", "銀行、学校、アルバイト、各種アプリで必要になりやすいです。", "high"),
      item("bank-account", "办理银行卡 / 银行账户", "辦理銀行卡 / 銀行帳戶", "銀行口座を開設", "工资、房租、缴费、奖学金都可能用到。", "薪資、房租、繳費、獎學金都可能用到。", "給与、家賃、支払い、奨学金で使います。", "high"),
      item("hanko", "买印章 / 认印", "買印章 / 認印", "印鑑・認印を用意", "部分银行、租房、学校文件仍可能需要。", "部分銀行、租屋、學校文件仍可能需要。", "銀行、賃貸、学校書類で必要になる場合があります。"),
      item("health-insurance", "确认国民健康保险", "確認國民健康保險", "国民健康保険を確認", "留学生、自由职业、未加入公司社保的人尤其要确认。", "留學生、自由職業、未加入公司社保的人尤其要確認。", "留学生や会社の社保に入らない人は確認しましょう。", "high"),
      item("my-number", "确认 My Number 通知", "確認 My Number 通知", "マイナンバー通知を確認", "打工、税、行政手续可能会用到。", "打工、稅、行政手續可能會用到。", "勤務、税金、行政手続きで必要になる場合があります。"),
      item("residence-card", "随身保管在留卡", "隨身保管在留卡", "在留カードを携帯", "在日本生活最重要的身份证件之一。", "在日本生活最重要的身份證件之一。", "日本生活で最も重要な身分証のひとつです。", "high"),
    ],
  },
  {
    id: "documents",
    icon: ShieldCheck,
    title: { "zh-CN": "出发前文件", "zh-TW": "出發前文件", ja: "出発前の書類" },
    subtitle: { "zh-CN": "护照、在留资格、照片、证明文件", "zh-TW": "護照、在留資格、照片、證明文件", ja: "パスポート、在留資格、写真、証明書" },
    items: [
      item("passport", "护照和签证 / 在留资格文件", "護照和簽證 / 在留資格文件", "パスポート・ビザ関連書類", "原件随身，复印件和照片备份到云端。", "原件隨身，影本和照片備份到雲端。", "原本を携帯し、コピーや写真をクラウドに保存。", "high"),
      item("id-photos", "证件照", "證件照", "証明写真", "学校、打工、再交付手续可能会用到。", "學校、打工、再交付手續可能會用到。", "学校、アルバイト、再発行手続きで使う場合があります。"),
      item("school-work-docs", "学校 / 公司录取材料", "學校 / 公司錄取材料", "学校・会社の受入書類", "入学、入社、住民登记时可能要确认。", "入學、入社、住民登記時可能要確認。", "入学、入社、住民登録で確認される場合があります。"),
      item("emergency-contact", "紧急联系人信息", "緊急聯絡人資訊", "緊急連絡先", "写好国内联系人、日本联系人、保险信息。", "寫好國內聯絡人、日本聯絡人、保險資訊。", "母国と日本の連絡先、保険情報をまとめます。"),
      item("cash-card", "准备少量现金和可用信用卡", "準備少量現金和可用信用卡", "現金と使えるカード", "刚到日本时银行卡和手机支付可能还没开通。", "剛到日本時銀行卡和手機支付可能還沒開通。", "来日直後は銀行やスマホ決済が未設定の場合があります。", "high"),
    ],
  },
  {
    id: "home-items",
    icon: Home,
    title: { "zh-CN": "入住后要买", "zh-TW": "入住後要買", ja: "入居後に買うもの" },
    subtitle: { "zh-CN": "被褥、插座、垃圾袋、清洁用品", "zh-TW": "棉被、插座、垃圾袋、清潔用品", ja: "寝具、電源、ゴミ袋、掃除用品" },
    items: [
      item("bedding", "被褥 / 枕头 / 床单", "棉被 / 枕頭 / 床單", "布団・枕・シーツ", "第一晚最容易忘，建议提前下单或当天购买。", "第一晚最容易忘，建議提前下單或當天購買。", "初日に忘れやすいので早めに用意。", "high"),
      item("power-adapter", "插座转换 / 延长线", "插座轉換 / 延長線", "電源タップ・変換プラグ", "确认自己带来的电器插头和电压。", "確認自己帶來的電器插頭和電壓。", "持参した家電のプラグと電圧を確認。"),
      item("garbage-bags", "指定垃圾袋 / 分类说明", "指定垃圾袋 / 分類說明", "指定ごみ袋・分別表", "不同区垃圾规则差异很大。", "不同區垃圾規則差異很大。", "自治体によりごみ出しルールが違います。", "high"),
      item("cleaning", "清洁用品", "清潔用品", "掃除用品", "海绵、洗剂、除菌湿巾、洗衣液、浴室清洁。", "海綿、清潔劑、除菌濕紙巾、洗衣精、浴室清潔。", "スポンジ、洗剤、除菌シート、洗濯洗剤、浴室掃除。"),
      item("daily-tableware", "基础餐具和锅具", "基礎餐具和鍋具", "食器・調理器具", "碗筷、杯子、小锅、菜刀、砧板。", "碗筷、杯子、小鍋、菜刀、砧板。", "食器、コップ、小鍋、包丁、まな板。"),
      item("curtain", "窗帘 / 遮光帘", "窗簾 / 遮光簾", "カーテン", "日本租房常常不带窗帘，尺寸要先量。", "日本租屋常常不附窗簾，尺寸要先量。", "賃貸にカーテンがないことが多いので採寸。"),
    ],
  },
  {
    id: "digital-money",
    icon: Smartphone,
    title: { "zh-CN": "App 和支付", "zh-TW": "App 和支付", ja: "アプリと支払い" },
    subtitle: { "zh-CN": "交通卡、支付、地图、翻译、快递", "zh-TW": "交通卡、支付、地圖、翻譯、宅配", ja: "交通系、決済、地図、翻訳、配送" },
    items: [
      item("transport-card", "交通 IC 卡 / 手机交通卡", "交通 IC 卡 / 手機交通卡", "交通系IC・スマホIC", "Suica、PASMO 等，通勤和买东西很常用。", "Suica、PASMO 等，通勤和買東西很常用。", "Suica、PASMO など。通勤や買い物で便利。", "high"),
      item("payment-app", "常用支付 App", "常用支付 App", "決済アプリ", "PayPay、信用卡、银行 App 视个人情况开通。", "PayPay、信用卡、銀行 App 視個人情況開通。", "PayPay、クレカ、銀行アプリなどを必要に応じて設定。"),
      item("map-translate", "地图和翻译 App", "地圖和翻譯 App", "地図・翻訳アプリ", "刚来日本查路线、菜单、窗口说明会很常用。", "剛來日本查路線、菜單、窗口說明會很常用。", "経路、メニュー、窓口説明の確認に便利。"),
      item("delivery-account", "快递收件设置", "宅配收件設定", "宅配の受け取り設定", "设置地址、门牌、再配达方式。", "設定地址、門牌、再配送方式。", "住所、部屋番号、再配達方法を確認。"),
      item("emergency-app", "防灾 / 紧急通知 App", "防災 / 緊急通知 App", "防災・緊急通知アプリ", "地震、台风、大雨时很有用。", "地震、颱風、大雨時很有用。", "地震、台風、大雨の時に役立ちます。"),
    ],
  },
  {
    id: "health-emergency",
    icon: PackageCheck,
    title: { "zh-CN": "药品和应急", "zh-TW": "藥品和應急", ja: "薬と緊急用品" },
    subtitle: { "zh-CN": "常备药、体温计、保险证、避难用品", "zh-TW": "常備藥、體溫計、保險證、避難用品", ja: "常備薬、体温計、保険証、防災用品" },
    items: [
      item("medicine", "常备药", "常備藥", "常備薬", "感冒、肠胃、过敏、止痛等按自己情况准备。", "感冒、腸胃、過敏、止痛等按自己情況準備。", "風邪、胃腸、アレルギー、痛み止めなど。", "high"),
      item("thermometer", "体温计", "體溫計", "体温計", "发烧、看病、学校/公司请假时会用到。", "發燒、看病、學校/公司請假時會用到。", "発熱、受診、学校・会社への連絡時に便利。"),
      item("insurance-card", "保险证 / 资格确认", "保險證 / 資格確認", "保険証・資格確認", "就医前确认自己是否已有保险资格。", "就醫前確認自己是否已有保險資格。", "受診前に保険資格を確認。", "high"),
      item("disaster-kit", "基础防灾包", "基礎防災包", "防災セット", "水、手电、充电宝、简易食品、常备药。", "水、手電筒、行動電源、簡易食品、常備藥。", "水、ライト、モバイルバッテリー、非常食、常備薬。"),
      item("hospital-list", "附近医院和药局", "附近醫院和藥局", "近くの病院・薬局", "先收藏内科、牙科、夜间急诊和药局。", "先收藏內科、牙科、夜間急診和藥局。", "内科、歯科、夜間救急、薬局を確認。"),
    ],
  },
  {
    id: "study-work",
    icon: WalletCards,
    title: { "zh-CN": "学习 / 工作准备", "zh-TW": "學習 / 工作準備", ja: "学校・仕事の準備" },
    subtitle: { "zh-CN": "电脑、交通、简历、打工、税", "zh-TW": "電腦、交通、履歷、打工、稅", ja: "PC、交通、履歴書、バイト、税金" },
    items: [
      item("commute-pass", "通学 / 通勤路线确认", "通學 / 通勤路線確認", "通学・通勤ルート確認", "确认定期券、换乘、末班车和延误替代路线。", "確認定期券、轉乘、末班車和延誤替代路線。", "定期券、乗換、終電、遅延時の迂回を確認。"),
      item("resume-photo", "简历和证件照", "履歷和證件照", "履歴書と証明写真", "找打工、实习、申请手续可能会用到。", "找打工、實習、申請手續可能會用到。", "アルバイト、実習、申請で使う場合があります。"),
      item("work-hours", "打工 28 小时提醒", "打工 28 小時提醒", "週28時間の確認", "留学生开始打工前建议设置工时记录。", "留學生開始打工前建議設定工時記錄。", "留学生は勤務時間を記録しましょう。", "high"),
      item("tax-docs", "税务和源泉票资料夹", "稅務和源泉票資料夾", "税金・源泉徴収票フォルダ", "工资单、源泉征收票、住民税通知建议集中保存。", "薪資單、源泉徵收票、住民稅通知建議集中保存。", "給与明細、源泉徴収票、住民税通知をまとめます。"),
      item("laptop-wifi", "电脑和网络环境", "電腦和網路環境", "PCとネット環境", "学校作业、线上手续、工作申请都需要。", "學校作業、線上手續、工作申請都需要。", "課題、オンライン手続き、応募で必要になります。"),
    ],
  },
  {
    id: "shopping",
    icon: ShoppingBag,
    title: { "zh-CN": "可慢慢补齐", "zh-TW": "可慢慢補齊", ja: "あとから揃えるもの" },
    subtitle: { "zh-CN": "不急但会提升生活质量", "zh-TW": "不急但會提升生活品質", ja: "急がないけど便利なもの" },
    items: [
      item("point-cards", "超市 / 药妆积分卡", "超市 / 藥妝積分卡", "スーパー・ドラッグストアのポイント", "常去店铺办一下，长期能省钱。", "常去店鋪辦一下，長期能省錢。", "よく行く店で作ると節約になります。"),
      item("bike", "自行车和防盗登记", "腳踏車和防盜登記", "自転車と防犯登録", "买自行车后记得确认防盗登记和停车规则。", "買腳踏車後記得確認防盜登記和停車規則。", "購入後は防犯登録と駐輪ルールを確認。"),
      item("laundry", "晾衣架 / 洗衣网", "曬衣架 / 洗衣網", "物干し・洗濯ネット", "日本小户型很常用。", "日本小戶型很常用。", "日本の部屋ではよく使います。"),
      item("storage", "收纳盒 / 衣架", "收納盒 / 衣架", "収納ケース・ハンガー", "让小房间更好用。", "讓小房間更好用。", "狭い部屋を使いやすくします。"),
      item("seasonal", "季节用品", "季節用品", "季節用品", "夏天防暑，冬天保暖，梅雨季除湿。", "夏天防暑，冬天保暖，梅雨季除濕。", "夏は暑さ対策、冬は防寒、梅雨は除湿。"),
    ],
  },
];

export default function LifeChecklistPage() {
  const { language } = useLanguage();
  const text = copy[language];
  const progress = useChecklistProgress();
  const allItems = sections.flatMap((section) => section.items.map((item) => ({ item, sectionId: section.id })));
  const doneCount = allItems.filter(({ item, sectionId }) => progress[sectionId]?.includes(item.id)).length;
  const totalCount = allItems.length;
  const percent = Math.round((doneCount / totalCount) * 100);

  const resetAll = () => setChecklistProgress({});

  return (
    <main className="min-h-screen bg-[#F6FAFF] text-[#0F172A]">
      <div className="mx-auto min-h-screen max-w-[430px] bg-[radial-gradient(circle_at_top,#DFF1FF_0%,#F6FAFF_42%,#FFFFFF_100%)] px-4 pb-24 pt-5">
        <header className="flex items-center justify-between gap-3">
          <BackButton label={text.back} />
          <span className="inline-flex items-center gap-1 rounded-full bg-white/75 px-3 py-2 text-xs font-black text-[#2563EB] shadow-sm ring-1 ring-white/60 backdrop-blur-xl">
            <ListChecks className="h-3.5 w-3.5" />
            Checklist
          </span>
        </header>

        <section className="jl-info-card mt-4 rounded-[30px] p-5">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/85 text-[#2563EB] shadow-sm">
              <ListChecks className="h-5 w-5" />
            </span>
            <h1 className="text-3xl font-black tracking-tight">{text.title}</h1>
          </div>
          <p className="mt-2 text-sm font-bold leading-6 text-[#64748B]">{text.subtitle}</p>
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

        <section className="mt-4 rounded-[26px] border border-orange-100 bg-orange-50/90 p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-base font-black text-[#C2410C]">{text.tipTitle}</h2>
              <p className="mt-1 text-xs font-bold leading-5 text-[#7C2D12]">{text.tipBody}</p>
            </div>
            <button className="shrink-0 rounded-full bg-white px-3 py-2 text-xs font-black text-[#C2410C] shadow-sm" onClick={resetAll} type="button">
              <span className="inline-flex items-center gap-1">
                <RotateCcw className="h-3.5 w-3.5" />
                {text.clear}
              </span>
            </button>
          </div>
        </section>

        <section className="mt-4 grid gap-4">
          {sections.map((section) => {
            const Icon = section.icon;
            const sectionDone = progress[section.id] ?? [];
            return (
              <article className="rounded-[28px] border border-white/60 bg-white/75 p-4 shadow-[0_12px_36px_rgba(37,99,235,0.08)] backdrop-blur-xl" key={section.id}>
                <div className="flex items-start gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-100 to-blue-100 text-[#2563EB] shadow-sm">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h2 className="text-lg font-black">{section.title[language]}</h2>
                        <p className="mt-1 text-xs font-bold leading-5 text-[#64748B]">{section.subtitle[language]}</p>
                      </div>
                      <span className="shrink-0 rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-black text-[#2563EB]">
                        {sectionDone.length}/{section.items.length}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="mt-3 grid gap-2">
                  {section.items.map((item) => {
                    const done = sectionDone.includes(item.id);
                    return (
                      <button
                        className={`choice-card rounded-2xl border px-3 py-3 text-left transition-all duration-300 ${
                          done ? "is-done" : item.priority === "high" ? "is-important" : ""
                        }`}
                        key={item.id}
                        onClick={() => toggleItem(section.id, item.id, progress)}
                        type="button"
                      >
                        <div className="flex items-start gap-3">
                          <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-xl ${done ? "bg-emerald-600 text-white" : "bg-white text-[#2563EB] shadow-sm"}`}>
                            {done ? <CheckCircle2 className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-2">
                              <h3 className="text-sm font-black leading-5">{item.title[language]}</h3>
                              {item.priority === "high" && !done ? <span className="shrink-0 rounded-full bg-orange-50 px-2 py-1 text-[10px] font-black text-[#F97316]">重要</span> : null}
                            </div>
                            <p className="mt-1 text-xs font-bold leading-5 text-[#64748B]">{item.note[language]}</p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </article>
            );
          })}
        </section>
      </div>
    </main>
  );
}

function item(id: string, zhCNTitle: string, zhTWTitle: string, jaTitle: string, zhCNNote: string, zhTWNote: string, jaNote: string, priority: ChecklistItem["priority"] = "normal"): ChecklistItem {
  return {
    id,
    note: { "zh-CN": zhCNNote, "zh-TW": zhTWNote, ja: jaNote },
    priority,
    title: { "zh-CN": zhCNTitle, "zh-TW": zhTWTitle, ja: jaTitle },
  };
}

function readChecklistProgress(): ChecklistProgress {
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

function normalizeProgress(value: unknown): ChecklistProgress {
  if (!value || typeof value !== "object" || Array.isArray(value)) return emptySnapshot;
  const output: ChecklistProgress = {};
  Object.entries(value).forEach(([sectionId, ids]) => {
    if (Array.isArray(ids)) output[sectionId] = Array.from(new Set(ids.filter((id): id is string => typeof id === "string")));
  });
  return output;
}

function setChecklistProgress(value: ChecklistProgress) {
  if (typeof window === "undefined") return;
  const raw = JSON.stringify(value);
  cachedRaw = raw;
  cachedSnapshot = value;
  window.localStorage.setItem(storageKey, raw);
  window.dispatchEvent(new Event(changeEvent));
}

function toggleItem(sectionId: string, itemId: string, progress: ChecklistProgress) {
  const current = progress[sectionId] ?? [];
  const next = current.includes(itemId) ? current.filter((id) => id !== itemId) : [...current, itemId];
  setChecklistProgress({ ...progress, [sectionId]: next });
}

function useChecklistProgress() {
  return useSyncExternalStore(
    (onStoreChange) => {
      window.addEventListener("storage", onStoreChange);
      window.addEventListener(changeEvent, onStoreChange);
      return () => {
        window.removeEventListener("storage", onStoreChange);
        window.removeEventListener(changeEvent, onStoreChange);
      };
    },
    readChecklistProgress,
    () => emptySnapshot,
  );
}
