"use client";

import { CalendarDays, CreditCard, Edit3, ExternalLink, Flag, MapPin, Plus, Recycle, Sparkles, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { BackButton } from "@/components/BackButton";
import { DataNotice } from "@/components/DataNotice";
import { useCalendarNotes, type CalendarNote, type CalendarNoteInput, type CalendarNoteType } from "@/hooks/useCalendarNotes";
import { useGarbageSchedule } from "@/hooks/useGarbageSchedule";
import { useLanguage } from "@/hooks/useLanguage";
import { useMonthlyReminders } from "@/hooks/useMonthlyReminders";
import { fetchJapaneseHolidays } from "@/lib/api/holidays";
import { garbageTypeConfig, garbageTypes, getGarbageForDate, type GarbageFrequency, type GarbageScheduleRule, type GarbageType } from "@/lib/calendar/garbageSchedule";
import { formatReminderAmount, getMonthlyRemindersForDate, monthlyReminderCategories, monthlyReminderCategoryLabels } from "@/lib/monthlyReminders";
import type { MonthlyReminder, MonthlyReminderCategory, MonthlyReminderInput } from "@/types/monthlyReminder";

type EventType = "holiday" | "vacation" | "festival" | "exam";

type CalendarEvent = {
  id?: string;
  date: string;
  endDate?: string;
  title: string;
  type: EventType;
  area?: string;
  note?: string;
  source?: string;
};

const year = 2026;
const weekdays = ["日", "一", "二", "三", "四", "五", "六"];

const nationalHolidays: CalendarEvent[] = [
  { date: "2026-01-01", title: "元日", type: "holiday", source: "https://www8.cao.go.jp/chosei/shukujitsu/gaiyou.html" },
  { date: "2026-01-12", title: "成人の日", type: "holiday", source: "https://www8.cao.go.jp/chosei/shukujitsu/gaiyou.html" },
  { date: "2026-02-11", title: "建国記念の日", type: "holiday", source: "https://www8.cao.go.jp/chosei/shukujitsu/gaiyou.html" },
  { date: "2026-02-23", title: "天皇誕生日", type: "holiday", source: "https://www8.cao.go.jp/chosei/shukujitsu/gaiyou.html" },
  { date: "2026-03-20", title: "春分の日", type: "holiday", source: "https://www8.cao.go.jp/chosei/shukujitsu/gaiyou.html" },
  { date: "2026-04-29", title: "昭和の日", type: "holiday", source: "https://www8.cao.go.jp/chosei/shukujitsu/gaiyou.html" },
  { date: "2026-05-03", title: "憲法記念日", type: "holiday", source: "https://www8.cao.go.jp/chosei/shukujitsu/gaiyou.html" },
  { date: "2026-05-04", title: "みどりの日", type: "holiday", source: "https://www8.cao.go.jp/chosei/shukujitsu/gaiyou.html" },
  { date: "2026-05-05", title: "こどもの日", type: "holiday", source: "https://www8.cao.go.jp/chosei/shukujitsu/gaiyou.html" },
  { date: "2026-05-06", title: "休日（振替休日）", type: "holiday", note: "祝日法第3条第2項による休日", source: "https://www8.cao.go.jp/chosei/shukujitsu/gaiyou.html" },
  { date: "2026-07-20", title: "海の日", type: "holiday", source: "https://www8.cao.go.jp/chosei/shukujitsu/gaiyou.html" },
  { date: "2026-08-11", title: "山の日", type: "holiday", source: "https://www8.cao.go.jp/chosei/shukujitsu/gaiyou.html" },
  { date: "2026-09-21", title: "敬老の日", type: "holiday", source: "https://www8.cao.go.jp/chosei/shukujitsu/gaiyou.html" },
  { date: "2026-09-22", title: "休日（国民の休日）", type: "holiday", note: "祝日法第3条第3項による休日", source: "https://www8.cao.go.jp/chosei/shukujitsu/gaiyou.html" },
  { date: "2026-09-23", title: "秋分の日", type: "holiday", source: "https://www8.cao.go.jp/chosei/shukujitsu/gaiyou.html" },
  { date: "2026-10-12", title: "スポーツの日", type: "holiday", source: "https://www8.cao.go.jp/chosei/shukujitsu/gaiyou.html" },
  { date: "2026-11-03", title: "文化の日", type: "holiday", source: "https://www8.cao.go.jp/chosei/shukujitsu/gaiyou.html" },
  { date: "2026-11-23", title: "勤労感謝の日", type: "holiday", source: "https://www8.cao.go.jp/chosei/shukujitsu/gaiyou.html" },
];

const vacationRanges: CalendarEvent[] = [
  { date: "2026-01-01", endDate: "2026-01-04", title: "年始休み", type: "vacation", note: "会社・学校で休みになりやすい期間。実際の休みは勤務先で確認。" },
  { date: "2026-05-02", endDate: "2026-05-06", title: "ゴールデンウィーク", type: "vacation", note: "土日＋祝日＋振替休日で連休。" },
  { date: "2026-08-13", endDate: "2026-08-16", title: "お盆休み", type: "vacation", note: "国民の祝日ではないが、帰省・休業が多い期間。" },
  { date: "2026-09-19", endDate: "2026-09-23", title: "シルバーウィーク", type: "vacation", note: "敬老の日、国民の休日、秋分の日を含む連休。" },
  { date: "2026-12-29", endDate: "2027-01-03", title: "年末年始休み", type: "vacation", note: "行政・銀行・会社で休みになりやすい期間。" },
];

const tokyoEvents: CalendarEvent[] = [
  {
    date: "2026-05-15",
    endDate: "2026-05-17",
    title: "三社祭",
    type: "festival",
    area: "浅草 / 台東区",
    note: "浅草神社例大祭。2026年は5月15日〜17日。",
    source: "https://asakusajinja.jp/wp-content/uploads/2026/04/%E5%BF%9C%E5%8B%9F%E7%A5%A8.pdf",
  },
  {
    date: "2026-05-16",
    endDate: "2026-05-17",
    title: "神楽坂まち舞台・大江戸めぐり",
    type: "festival",
    area: "神楽坂 / 新宿区",
    note: "伝統音楽、話芸、お座敷遊びなど。",
    source: "https://www.koho.metro.tokyo.lg.jp/2026/05/moyoshi02.html",
  },
  {
    date: "2026-05-30",
    title: "第48回 足立の花火",
    type: "festival",
    area: "荒川河川敷 / 足立区",
    note: "19:20〜20:20 予定。",
    source: "https://www.city.adachi.tokyo.jp/s-shinko/adachi_no_hanabi48.html",
  },
  {
    date: "2026-06-03",
    endDate: "2026-06-28",
    title: "Tokyo Pride 2026",
    type: "festival",
    area: "代々木公園・渋谷〜原宿ほか",
    note: "Pride Festival は6月6日・7日、Parade は6月7日。",
    source: "https://pride.tokyo/",
  },
  {
    date: "2026-06-07",
    endDate: "2026-06-17",
    title: "山王祭",
    type: "festival",
    area: "日枝神社・千代田区ほか",
    note: "2026年は本祭り。神幸祭は6月12日。",
    source: "https://visit-chiyoda.tokyo/sannoumatsuri/",
  },
  {
    date: "2026-07-25",
    title: "隅田川花火大会",
    type: "festival",
    area: "台東区・墨田区",
    note: "2026年7月25日開催。",
    source: "https://www.sumidagawa-hanabi.com/about/index.html",
  },
  {
    date: "2026-07-28",
    title: "第60回 葛飾納涼花火大会",
    type: "festival",
    area: "柴又 / 葛飾区",
    note: "19:20〜20:30。約20,000発、ドローンショー予定。",
    source: "https://www.city.katsushika.lg.jp/tourism/1000064/1000065/1031830.html",
  },
  {
    date: "2026-08-01",
    title: "第51回 江戸川区花火大会",
    type: "festival",
    area: "篠崎 / 江戸川区",
    note: "江戸川河川敷（都立篠崎公園先）で開催決定。",
    source: "https://www.city.edogawa.tokyo.jp/e004/kuseijoho/kohokocho/press/2026/04/0408.html",
  },
  {
    date: "2026-08-29",
    endDate: "2026-08-30",
    title: "東京高円寺阿波おどり",
    type: "festival",
    area: "高円寺 / 杉並区",
    note: "第67回。高円寺駅周辺で開催。",
    source: "https://www.koenji-awaodori.com/about/about01.html",
  },
  {
    date: "2026-10-03",
    title: "世田谷区たまがわ花火大会",
    type: "festival",
    area: "二子玉川 / 世田谷区",
    note: "18:00〜19:00、約6,000発。荒天中止。",
    source: "https://tamagawa-hanabi.com/about/",
  },
  {
    date: "2026-10-24",
    title: "東京湾大華火祭",
    type: "festival",
    area: "晴海ふ頭公園ほか / 中央区",
    note: "18:50〜20:10 予定。",
    source: "https://tokyo-hanabi.jp/",
  },
];

const tokyo23FireworkNotes = [
  { ward: "千代田区", event: "神宮外苑花火大会エリアに近い区。2026年公式日程は確認中。" },
  { ward: "中央区", event: "東京湾大華火祭（晴海ふ頭公園ほか）予定。公式発表を要確認。" },
  { ward: "港区", event: "お台場レインボー花火、東京湾大華火祭の近隣エリア。日程は公式確認。" },
  { ward: "新宿区", event: "神宮外苑花火大会エリア。2026年公式日程は確認中。" },
  { ward: "文京区", event: "区内大型花火は未確認。隅田川・神宮外苑が近隣候補。" },
  { ward: "台東区", event: "隅田川花火大会：2026年7月25日。" },
  { ward: "墨田区", event: "隅田川花火大会：2026年7月25日。" },
  { ward: "江東区", event: "東京湾・お台場方面の花火が近隣候補。公式日程を確認。" },
  { ward: "品川区", event: "区内大型花火は未確認。東京湾・お台場方面が近隣候補。" },
  { ward: "目黒区", event: "区内大型花火は未確認。世田谷たまがわ花火が近隣候補。" },
  { ward: "大田区", event: "多摩川沿いイベントは年度発表を確認。2026年大型公式花火は確認中。" },
  { ward: "世田谷区", event: "世田谷区たまがわ花火大会：2026年10月3日。" },
  { ward: "渋谷区", event: "神宮外苑花火大会エリア。2026年公式日程は確認中。" },
  { ward: "中野区", event: "区内大型花火は未確認。神宮外苑・板橋方面が近隣候補。" },
  { ward: "杉並区", event: "区内大型花火は未確認。神宮外苑・板橋方面が近隣候補。" },
  { ward: "豊島区", event: "区内大型花火は未確認。板橋・北区方面が近隣候補。" },
  { ward: "北区", event: "北区花火会は2026年情報確認中。" },
  { ward: "荒川区", event: "足立の花火・隅田川花火が近隣候補。" },
  { ward: "板橋区", event: "いたばし花火大会は2026年開催情報更新中。公式日程を要確認。" },
  { ward: "練馬区", event: "区内大型花火は未確認。板橋方面が近隣候補。" },
  { ward: "足立区", event: "足立の花火：2026年5月30日。" },
  { ward: "葛飾区", event: "葛飾納涼花火大会：2026年7月28日。" },
  { ward: "江戸川区", event: "江戸川区花火大会：2026年8月1日。" },
];

const examEvents: CalendarEvent[] = [
  { date: "2026-06-21", title: "EJU 第1回考试", type: "exam", note: "报名时间需以 JASSO 当年公告为准。" },
  { date: "2026-07-05", title: "JLPT 第1回考试", type: "exam", note: "报名时间需以 JEES/JLPT 官方公告为准。" },
  { date: "2026-11-08", title: "EJU 第2回考试", type: "exam", note: "报名时间需以 JASSO 当年公告为准。" },
  { date: "2026-12-06", title: "JLPT 第2回考试", type: "exam", note: "报名时间需以 JEES/JLPT 官方公告为准。" },
];

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function toDate(value: string) {
  return new Date(`${value}T00:00:00+09:00`);
}

function inRange(date: string, event: CalendarEvent) {
  const current = toDate(date).getTime();
  const start = toDate(event.date).getTime();
  const end = toDate(event.endDate ?? event.date).getTime();
  return current >= start && current <= end;
}

function formatDateRange(event: CalendarEvent) {
  const start = event.date.slice(5).replace("-", "/");
  const end = event.endDate?.slice(5).replace("-", "/");
  return end && end !== start ? `${start}〜${end}` : start;
}

function eventClass(type: EventType) {
  if (type === "holiday") return "bg-rose-50 text-rose-700";
  if (type === "vacation") return "bg-amber-50 text-amber-800";
  if (type === "festival") return "bg-emerald-50 text-emerald-800";
  return "bg-sky-50 text-sky-800";
}

const calendarCopy = {
  "zh-CN": {
    title: "日本日历 2026",
    subtitle: "祝日、垃圾日程、每月提醒与个人备注",
    description: "保留日本国民祝日、连续休假、EJU/JLPT、东京活动，也可以管理垃圾收集日、每月缴费提醒和自己的生活备注。",
    addNote: "添加备注",
    edit: "编辑",
    delete: "删除",
    cancel: "取消",
    save: "保存",
    titleField: "标题",
    time: "时间",
    type: "类型",
    detail: "详细备注",
    officialEvents: "官方节日 / 活动",
    userNotes: "用户备注",
    noNotes: "还没有备注",
    noPlans: "今天还没有安排",
    notePlaceholder: "例如：房租转账、区役所手续、打工排班",
    today: "今天",
    selectedDay: "当前选中",
    tapDay: "点日期查看详情",
    moreEvents: "更多",
    holidaySourceLabel: "国民祝日",
    localFallback: "本地备用数据",
    legendHoliday: "祝日/周日",
    legendVacation: "连续休假",
    legendFestival: "东京活动",
    legendExam: "考试",
    legendNote: "个人备注",
    noteBadge: "备注",
    monthlySettings: "每月提醒设置",
    monthlyReminder: "每月提醒",
    monthlyToday: "本日提醒",
    noMonthlyToday: "这天没有每月提醒",
    upcomingPayments: "即将缴费",
    noUpcomingPayments: "未来 7 天没有缴费提醒",
    reminderDay: "每月日期",
    reminderCategory: "分类",
    reminderAmount: "金额",
    reminderTitlePlaceholder: "例如：房租、手机费、信用卡",
    monthHeading: "本月生活安排",
    monthEmpty: "本月还没有个人备注、垃圾日程或每月提醒。",
    officialMonthHeading: "本月官方日程",
    officialMonthEmpty: "本月没有登记的祝日、假期或官方活动。",
    vacationHeading: "连续休假",
    nationalHeading: "日本国民祝日・休日",
    festivalHeading: "东京官方/知名祭典活动",
    fireworkHeading: "东京23区花火大会总览",
    fireworkDesc: "已确认日期的大会会出现在上方日历。未公布或区内没有大型官方花火的地方，先列出近邻候选，出门前请点官方来源再确认。",
    officialSource: "官方来源",
    garbageSettings: "垃圾日程设置",
    garbageCalendar: "垃圾日历",
    garbageToday: "今日垃圾",
    noGarbageToday: "今天没有设置垃圾日程",
    garbageTip: "请按所在地区规则，在指定时间前丢出。",
    garbageNotice: "垃圾分类和收集日因地区而异，请以当地政府公告为准。",
    addRule: "添加规则",
    saveRule: "保存规则",
    cancelRule: "取消",
    clearRules: "清空所有规则",
    enabled: "启用",
    disabled: "关闭",
    frequency: "频率",
    reminderTime: "提醒时间",
    garbageTypes: "垃圾类型",
    weekdays: "星期",
    startDate: "开始日期",
    monthDays: "每月日期",
    weekOfMonth: "第几个星期",
    noteOptional: "备注（可选）",
    noRules: "还没有垃圾日程规则",
    frequencyLabels: { weekly: "每周", biweekly: "隔周", monthlyDate: "每月固定日期", monthlyWeekday: "每月第几个星期几" },
    weekLabels: ["周日", "周一", "周二", "周三", "周四", "周五", "周六"],
    weekOfMonthLabels: { 1: "第1", 2: "第2", 3: "第3", 4: "第4", 5: "第5", last: "最后一个" },
  },
  "zh-TW": {
    title: "日本日曆 2026",
    subtitle: "假日、垃圾日程、每月提醒與個人備註",
    description: "保留日本國民假日、連續休假、EJU/JLPT、東京活動，也可以管理垃圾收集日、每月繳費提醒和自己的生活備註。",
    addNote: "新增備註",
    edit: "編輯",
    delete: "刪除",
    cancel: "取消",
    save: "保存",
    titleField: "標題",
    time: "時間",
    type: "類型",
    detail: "詳細備註",
    officialEvents: "官方假日 / 活動",
    userNotes: "使用者備註",
    noNotes: "還沒有備註",
    noPlans: "今天還沒有安排",
    notePlaceholder: "例如：房租轉帳、區役所手續、打工排班",
    today: "今天",
    selectedDay: "目前選中",
    tapDay: "點日期查看詳情",
    moreEvents: "更多",
    holidaySourceLabel: "國民假日",
    localFallback: "本地備用資料",
    legendHoliday: "假日/週日",
    legendVacation: "連續休假",
    legendFestival: "東京活動",
    legendExam: "考試",
    legendNote: "個人備註",
    noteBadge: "備註",
    monthlySettings: "每月提醒設定",
    monthlyReminder: "每月提醒",
    monthlyToday: "本日提醒",
    noMonthlyToday: "這天沒有每月提醒",
    upcomingPayments: "即將繳費",
    noUpcomingPayments: "未來 7 天沒有繳費提醒",
    reminderDay: "每月日期",
    reminderCategory: "分類",
    reminderAmount: "金額",
    reminderTitlePlaceholder: "例如：房租、手機費、信用卡",
    monthHeading: "本月生活安排",
    monthEmpty: "本月還沒有個人備註、垃圾日程或每月提醒。",
    officialMonthHeading: "本月官方日程",
    officialMonthEmpty: "本月沒有登記的假日、假期或官方活動。",
    vacationHeading: "連續休假",
    nationalHeading: "日本國民假日・休日",
    festivalHeading: "東京官方/知名祭典活動",
    fireworkHeading: "東京23區花火大會總覽",
    fireworkDesc: "已確認日期的大會會出現在上方日曆。未公布或區內沒有大型官方花火的地方，先列出近鄰候選，出門前請點官方來源再確認。",
    officialSource: "官方來源",
    garbageSettings: "垃圾日程設定",
    garbageCalendar: "垃圾日曆",
    garbageToday: "今日垃圾",
    noGarbageToday: "今天沒有設定垃圾日程",
    garbageTip: "請依照所在地區規定，在指定時間前丟出。",
    garbageNotice: "垃圾分類和收集日因地區而異，請以當地政府公告為準。",
    addRule: "新增規則",
    saveRule: "儲存規則",
    cancelRule: "取消",
    clearRules: "清空所有規則",
    enabled: "啟用",
    disabled: "關閉",
    frequency: "頻率",
    reminderTime: "提醒時間",
    garbageTypes: "垃圾類型",
    weekdays: "星期",
    startDate: "開始日期",
    monthDays: "每月日期",
    weekOfMonth: "第幾個星期",
    noteOptional: "備註（可選）",
    noRules: "還沒有垃圾日程規則",
    frequencyLabels: { weekly: "每週", biweekly: "隔週", monthlyDate: "每月固定日期", monthlyWeekday: "每月第幾個星期幾" },
    weekLabels: ["週日", "週一", "週二", "週三", "週四", "週五", "週六"],
    weekOfMonthLabels: { 1: "第1", 2: "第2", 3: "第3", 4: "第4", 5: "第5", last: "最後一個" },
  },
  ja: {
    title: "日本カレンダー 2026",
    subtitle: "祝日、ごみ収集、毎月リマインダー、メモ",
    description: "日本の祝日、連休、EJU/JLPT、東京イベントを残したまま、ごみ収集日、毎月の支払いリマインダー、生活メモを管理できます。",
    addNote: "メモを追加",
    edit: "編集",
    delete: "削除",
    cancel: "キャンセル",
    save: "保存",
    titleField: "タイトル",
    time: "時間",
    type: "種類",
    detail: "メモ詳細",
    officialEvents: "公式祝日 / イベント",
    userNotes: "ユーザーメモ",
    noNotes: "まだメモがありません",
    noPlans: "今日の予定はありません",
    notePlaceholder: "例：家賃振込、役所手続き、アルバイトシフト",
    today: "今日",
    selectedDay: "選択中",
    tapDay: "日付をタップして詳細",
    moreEvents: "もっと見る",
    holidaySourceLabel: "国民の祝日",
    localFallback: "ローカル予備データ",
    legendHoliday: "祝日/日曜",
    legendVacation: "連休",
    legendFestival: "東京イベント",
    legendExam: "試験",
    legendNote: "個人メモ",
    noteBadge: "メモ",
    monthlySettings: "月次リマインダー設定",
    monthlyReminder: "月次リマインダー",
    monthlyToday: "本日のリマインダー",
    noMonthlyToday: "この日の月次リマインダーはありません",
    upcomingPayments: "近日の支払い",
    noUpcomingPayments: "今後7日間の支払いリマインダーはありません",
    reminderDay: "毎月の日付",
    reminderCategory: "カテゴリ",
    reminderAmount: "金額",
    reminderTitlePlaceholder: "例：家賃、スマホ代、カード",
    monthHeading: "今月の生活予定",
    monthEmpty: "今月のメモ、ごみ収集、毎月リマインダーはまだありません。",
    officialMonthHeading: "今月の公式予定",
    officialMonthEmpty: "今月登録されている祝日、休暇、公式イベントはありません。",
    vacationHeading: "連休",
    nationalHeading: "日本の祝日・休日",
    festivalHeading: "東京の公式/有名イベント",
    fireworkHeading: "東京23区 花火大会一覧",
    fireworkDesc: "確定した日程の大会は上のカレンダーに表示されます。未発表または区内に大型公式花火がない場所は近隣候補として掲載しています。外出前に公式情報を確認してください。",
    officialSource: "公式情報",
    garbageSettings: "ごみ収集設定",
    garbageCalendar: "ごみカレンダー",
    garbageToday: "今日のごみ",
    noGarbageToday: "今日はごみ収集の設定がありません",
    garbageTip: "地域のルールに従って、指定時間までに出してください。",
    garbageNotice: "ごみの分別や収集日は地域によって異なります。必ず自治体の案内をご確認ください。",
    addRule: "ルールを追加",
    saveRule: "ルールを保存",
    cancelRule: "キャンセル",
    clearRules: "すべて削除",
    enabled: "有効",
    disabled: "停止",
    frequency: "頻度",
    reminderTime: "確認時間",
    garbageTypes: "ごみ種類",
    weekdays: "曜日",
    startDate: "開始日",
    monthDays: "毎月の日付",
    weekOfMonth: "第何曜日",
    noteOptional: "メモ（任意）",
    noRules: "ごみ収集ルールはまだありません",
    frequencyLabels: { weekly: "毎週", biweekly: "隔週", monthlyDate: "毎月の日付指定", monthlyWeekday: "毎月第◯曜日" },
    weekLabels: ["日", "月", "火", "水", "木", "金", "土"],
    weekOfMonthLabels: { 1: "第1", 2: "第2", 3: "第3", 4: "第4", 5: "第5", last: "最後" },
  },
} as const;

const noteTypeOptions: CalendarNoteType[] = ["work", "rent", "visa", "school", "hospital", "wardOffice", "private"];
const noteTypeLabels: Record<CalendarNoteType, { "zh-CN": string; "zh-TW": string; ja: string }> = {
  work: { "zh-CN": "打工", "zh-TW": "打工", ja: "アルバイト" },
  rent: { "zh-CN": "房租", "zh-TW": "房租", ja: "家賃" },
  visa: { "zh-CN": "签证", "zh-TW": "簽證", ja: "ビザ" },
  school: { "zh-CN": "学校", "zh-TW": "學校", ja: "学校" },
  hospital: { "zh-CN": "医院", "zh-TW": "醫院", ja: "病院" },
  wardOffice: { "zh-CN": "区役所", "zh-TW": "區役所", ja: "役所" },
  private: { "zh-CN": "私人", "zh-TW": "私人", ja: "プライベート" },
};

function noteClass(type: CalendarNoteType) {
  if (type === "work") return "bg-emerald-100 text-emerald-800";
  if (type === "rent") return "bg-orange-100 text-orange-800";
  if (type === "visa") return "bg-red-100 text-red-700";
  if (type === "school") return "bg-blue-100 text-blue-800";
  if (type === "hospital") return "bg-pink-100 text-pink-800";
  if (type === "wardOffice") return "bg-violet-100 text-violet-800";
  return "bg-stone-200 text-stone-700";
}

function emptyNoteForm(date: string): CalendarNoteInput {
  return { date, title: "", type: "private", time: "", note: "" };
}

type GarbageRuleForm = {
  id?: string;
  enabled: boolean;
  garbageTypes: GarbageType[];
  frequency: GarbageFrequency;
  weekdays: number[];
  startDate: string;
  monthDays: number[];
  weekOfMonth: 1 | 2 | 3 | 4 | 5 | "last";
  weekday: number;
  reminderTime: string;
  note: string;
  createdAt?: string;
};

type MonthlyReminderForm = {
  id?: string;
  title: string;
  day: number;
  category: MonthlyReminderCategory;
  amount: string;
  note: string;
  enabled: boolean;
  createdAt?: string;
};

function emptyMonthlyReminderForm(): MonthlyReminderForm {
  return { title: "", day: 1, category: "rent", amount: "", note: "", enabled: true };
}

function reminderToForm(reminder: MonthlyReminder): MonthlyReminderForm {
  return {
    id: reminder.id,
    title: reminder.title,
    day: reminder.day,
    category: reminder.category,
    amount: reminder.amount ? String(reminder.amount) : "",
    note: reminder.note ?? "",
    enabled: reminder.enabled,
    createdAt: reminder.createdAt,
  };
}

function emptyGarbageForm(): GarbageRuleForm {
  return { enabled: true, frequency: "weekly", garbageTypes: ["burnable"], weekdays: [1], startDate: "2026-05-01", monthDays: [1], weekOfMonth: 1, weekday: 1, reminderTime: "07:30", note: "" };
}

function ruleToForm(rule: GarbageScheduleRule): GarbageRuleForm {
  return {
    id: rule.id,
    enabled: rule.enabled,
    garbageTypes: rule.garbageTypes,
    frequency: rule.frequency,
    weekdays: rule.weekdays ?? [1],
    startDate: rule.startDate ?? "2026-05-01",
    monthDays: rule.monthDays ?? [1],
    weekOfMonth: rule.weekOfMonth ?? 1,
    weekday: rule.weekday ?? 1,
    reminderTime: rule.reminderTime,
    note: rule.note ?? "",
    createdAt: rule.createdAt,
  };
}

function dateStringToDate(value: string) {
  return new Date(`${value}T00:00:00+09:00`);
}

function toggleArrayValue<T>(values: T[], value: T) {
  return values.includes(value) ? values.filter((item) => item !== value) : [...values, value];
}

function garbageTypeName(type: GarbageType, language: "zh-CN" | "zh-TW" | "ja") {
  return garbageTypeConfig[type][language];
}

function monthlyReminderName(reminder: MonthlyReminder, language: "zh-CN" | "zh-TW" | "ja") {
  return reminder.title || monthlyReminderCategoryLabels[reminder.category][language];
}

function describeGarbageRule(rule: GarbageScheduleRule, labels: (typeof calendarCopy)[keyof typeof calendarCopy]) {
  if (rule.frequency === "weekly") return `${labels.frequencyLabels.weekly} ${(rule.weekdays ?? []).map((day) => labels.weekLabels[day]).join(" / ")}`;
  if (rule.frequency === "biweekly") return `${labels.frequencyLabels.biweekly} ${(rule.weekdays ?? []).map((day) => labels.weekLabels[day]).join(" / ")} ${rule.startDate ?? ""}`;
  if (rule.frequency === "monthlyDate") return `${labels.frequencyLabels.monthlyDate} ${(rule.monthDays ?? []).join(" / ")}`;
  const weekLabel = labels.weekOfMonthLabels[String(rule.weekOfMonth ?? 1) as keyof typeof labels.weekOfMonthLabels];
  return `${labels.frequencyLabels.monthlyWeekday} ${weekLabel} ${labels.weekLabels[rule.weekday ?? 1]}`;
}

export default function HolidaysPage() {
  const { language, t } = useLanguage();
  const labels = calendarCopy[language];
  const [month, setMonth] = useState(4);
  const [apiHolidays, setApiHolidays] = useState<CalendarEvent[]>(nationalHolidays);
  const [holidaySource, setHolidaySource] = useState<"holidays-jp" | "mock">("mock");
  const { addNote, deleteNote, notesByDate, updateNote } = useCalendarNotes();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteForm, setNoteForm] = useState<CalendarNoteInput>(() => emptyNoteForm("2026-05-01"));
  const { clearRules, deleteRule, loaded: garbageLoaded, rules: garbageRules, saveRule, toggleRule } = useGarbageSchedule();
  const [garbageOpen, setGarbageOpen] = useState(false);
  const [garbageFormOpen, setGarbageFormOpen] = useState(false);
  const [garbageForm, setGarbageForm] = useState<GarbageRuleForm>(() => emptyGarbageForm());
  const { deleteReminder, loaded: monthlyLoaded, reminders: monthlyReminders, saveReminder, toggleReminder } = useMonthlyReminders();
  const [monthlyOpen, setMonthlyOpen] = useState(false);
  const [monthlyFormOpen, setMonthlyFormOpen] = useState(false);
  const [monthlyForm, setMonthlyForm] = useState<MonthlyReminderForm>(() => emptyMonthlyReminderForm());
  const monthNumber = month + 1;
  const todayDate = "2026-05-22";
  const allEvents = useMemo(() => [...apiHolidays, ...vacationRanges, ...tokyoEvents, ...examEvents], [apiHolidays]);

  useEffect(() => {
    let alive = true;
    fetchJapaneseHolidays().then((result) => {
      if (!alive) return;
      setApiHolidays(
        result.items.map((holiday) => ({
          id: holiday.id,
          date: holiday.date,
          title: holiday.titleJa,
          type: "holiday" as const,
          source: "https://holidays-jp.github.io/api/v1/date.json",
        })),
      );
      setHolidaySource(result.source);
    });
    return () => {
      alive = false;
    };
  }, []);

  const monthEvents = useMemo(() => {
    const monthPrefix = `${year}-${pad(monthNumber)}`;
    return allEvents
      .filter((item) => item.date.startsWith(monthPrefix) || item.endDate?.startsWith(monthPrefix))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [allEvents, monthNumber]);

  const cells = useMemo(() => {
    const first = new Date(year, month, 1);
    const days = new Date(year, month + 1, 0).getDate();
    return [...Array(first.getDay()).fill(null), ...Array.from({ length: days }, (_, index) => index + 1)];
  }, [month]);

  const selectedEvents = useMemo(() => {
    if (!selectedDate) return [];
    return allEvents.filter((item) => inRange(selectedDate, item));
  }, [allEvents, selectedDate]);
  const selectedNotes = selectedDate ? (notesByDate[selectedDate] ?? []) : [];
  const selectedGarbage = selectedDate && garbageLoaded ? getGarbageForDate(dateStringToDate(selectedDate), garbageRules) : [];
  const selectedMonthlyReminders = selectedDate && monthlyLoaded ? getMonthlyRemindersForDate(dateStringToDate(selectedDate), monthlyReminders) : [];
  const todayGarbage = garbageLoaded ? getGarbageForDate(dateStringToDate(todayDate), garbageRules) : [];
  const todayGarbageTypes = Array.from(new Set(todayGarbage.flatMap((item) => item.garbageTypes)));
  const upcomingMonthlyReminders = useMemo(() => {
    if (!monthlyLoaded) return [];
    return Array.from({ length: 8 }, (_, index) => {
      const target = dateStringToDate(todayDate);
      target.setDate(target.getDate() + index);
      const date = `${target.getFullYear()}-${pad(target.getMonth() + 1)}-${pad(target.getDate())}`;
      return getMonthlyRemindersForDate(target, monthlyReminders).map((reminder) => ({ date, reminder }));
    }).flat();
  }, [monthlyLoaded, monthlyReminders, todayDate]);
  const monthAgenda = useMemo(() => {
    const days = new Date(year, month + 1, 0).getDate();
    return Array.from({ length: days }, (_, index) => {
      const day = index + 1;
      const date = `${year}-${pad(monthNumber)}-${pad(day)}`;
      const notes = notesByDate[date] ?? [];
      const garbage = garbageLoaded ? getGarbageForDate(dateStringToDate(date), garbageRules) : [];
      const monthly = monthlyLoaded ? getMonthlyRemindersForDate(dateStringToDate(date), monthlyReminders) : [];
      return { date, day, notes, garbage, monthly };
    }).filter((item) => item.notes.length > 0 || item.garbage.length > 0 || item.monthly.length > 0);
  }, [garbageLoaded, garbageRules, month, monthNumber, monthlyLoaded, monthlyReminders, notesByDate]);

  const openDay = (date: string) => {
    setSelectedDate(date);
    setFormOpen(false);
    setEditingNoteId(null);
    setNoteForm(emptyNoteForm(date));
  };

  const startAddNote = () => {
    if (!selectedDate) return;
    setEditingNoteId(null);
    setNoteForm(emptyNoteForm(selectedDate));
    setFormOpen(true);
  };

  const startEditNote = (note: CalendarNote) => {
    setEditingNoteId(note.id);
    setNoteForm({ date: note.date, title: note.title, type: note.type, time: note.time ?? "", note: note.note ?? "" });
    setFormOpen(true);
  };

  const saveNote = () => {
    if (!noteForm.title.trim()) return;
    if (editingNoteId) {
      updateNote(editingNoteId, noteForm);
    } else {
      addNote(noteForm);
    }
    setFormOpen(false);
    setEditingNoteId(null);
    setNoteForm(emptyNoteForm(noteForm.date));
  };

  const startAddGarbageRule = () => {
    setGarbageForm(emptyGarbageForm());
    setGarbageFormOpen(true);
  };

  const startEditGarbageRule = (rule: GarbageScheduleRule) => {
    setGarbageForm(ruleToForm(rule));
    setGarbageFormOpen(true);
  };

  const submitGarbageRule = () => {
    saveRule({
      id: garbageForm.id,
      createdAt: garbageForm.createdAt,
      enabled: garbageForm.enabled,
      garbageTypes: garbageForm.garbageTypes,
      frequency: garbageForm.frequency,
      weekdays: garbageForm.frequency === "weekly" || garbageForm.frequency === "biweekly" ? garbageForm.weekdays : undefined,
      startDate: garbageForm.frequency === "biweekly" ? garbageForm.startDate : undefined,
      monthDays: garbageForm.frequency === "monthlyDate" ? garbageForm.monthDays : undefined,
      weekOfMonth: garbageForm.frequency === "monthlyWeekday" ? garbageForm.weekOfMonth : undefined,
      weekday: garbageForm.frequency === "monthlyWeekday" ? garbageForm.weekday : undefined,
      reminderTime: garbageForm.reminderTime,
      note: garbageForm.note.trim() || undefined,
    });
    setGarbageFormOpen(false);
    setGarbageForm(emptyGarbageForm());
  };

  const startAddMonthlyReminder = () => {
    setMonthlyForm(emptyMonthlyReminderForm());
    setMonthlyFormOpen(true);
  };

  const startEditMonthlyReminder = (reminder: MonthlyReminder) => {
    setMonthlyForm(reminderToForm(reminder));
    setMonthlyFormOpen(true);
  };

  const submitMonthlyReminder = () => {
    if (!monthlyForm.title.trim()) return;
    const amount = Number(monthlyForm.amount);
    const input: MonthlyReminderInput = {
      id: monthlyForm.id,
      createdAt: monthlyForm.createdAt,
      title: monthlyForm.title,
      day: monthlyForm.day,
      category: monthlyForm.category,
      amount: Number.isFinite(amount) && amount > 0 ? amount : undefined,
      note: monthlyForm.note,
      enabled: monthlyForm.enabled,
    };
    saveReminder(input);
    setMonthlyFormOpen(false);
    setMonthlyForm(emptyMonthlyReminderForm());
  };

  return (
    <main className="min-h-screen bg-[#f5f0e7] text-stone-950">
      <div className="mx-auto min-h-screen max-w-[430px] bg-[#fbf8f2] px-4 py-5 shadow-2xl shadow-stone-300/40">
        <div className="mb-5 flex items-center justify-between">
          <BackButton label={t.common.back} />
          <span className="rounded-full bg-emerald-50 px-4 py-2 text-xs font-black text-emerald-800">Japan Life</span>
        </div>

        <section className="rounded-[30px] bg-white p-5 text-[#0F172A] shadow-[0_18px_45px_rgba(37,99,235,0.10)]">
          <div className="mb-2 flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-2xl bg-blue-50 text-[#2563EB]">
              <CalendarDays className="h-5 w-5" />
            </span>
            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-[#2563EB]">2026</span>
          </div>
          <h1 className="text-3xl font-black leading-tight">{labels.title}</h1>
          <p className="mt-2 text-base font-black text-[#64748B]">{labels.subtitle}</p>
          <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-[#64748B]">
            {labels.description}
          </p>
          <p className="mt-2 text-xs font-black text-[#64748B]">
            {labels.holidaySourceLabel}: {holidaySource === "holidays-jp" ? "Holidays JP API" : labels.localFallback} / {t.common.referenceOnly}
          </p>
        </section>

        <section className="mt-5 grid gap-3 rounded-[22px] bg-white p-4 shadow-[0_10px_24px_rgba(32,38,34,0.07)]">
          <button
            className="flex w-full items-center justify-between gap-3 rounded-[18px] border border-emerald-100 bg-emerald-50 p-3 text-left text-emerald-950 transition active:scale-[0.99]"
            onClick={() => setGarbageOpen((value) => !value)}
            type="button"
          >
            <span className="flex min-w-0 items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-emerald-800 shadow-sm">
                <Recycle className="h-5 w-5" />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-black">{labels.garbageCalendar}</span>
                <span className="mt-0.5 block truncate text-[11px] font-bold text-emerald-700">
                  {todayGarbageTypes.length > 0
                    ? todayGarbageTypes.map((type) => `${garbageTypeConfig[type].icon} ${garbageTypeName(type, language)}`).join(" / ")
                    : labels.noGarbageToday}
                </span>
              </span>
            </span>
            <span className="shrink-0 rounded-full bg-emerald-800 px-3 py-1.5 text-[11px] font-black text-white">
              {garbageRules.length > 0 ? `${garbageRules.length}` : labels.garbageSettings}
            </span>
          </button>
          <button
            className="flex w-full items-center justify-between gap-3 rounded-[18px] border border-sky-100 bg-sky-50 p-3 text-left text-sky-950 transition active:scale-[0.99]"
            onClick={() => setMonthlyOpen((value) => !value)}
            type="button"
          >
            <span className="flex min-w-0 items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-sky-800 shadow-sm">
                <CreditCard className="h-5 w-5" />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-black">{labels.monthlyReminder}</span>
                <span className="mt-0.5 block truncate text-[11px] font-bold text-sky-700">
                  {upcomingMonthlyReminders.length > 0
                    ? `${upcomingMonthlyReminders[0].date.slice(5).replace("-", "/")} ${monthlyReminderName(upcomingMonthlyReminders[0].reminder, language)} ${formatReminderAmount(upcomingMonthlyReminders[0].reminder.amount)}`
                    : labels.noUpcomingPayments}
                </span>
              </span>
            </span>
            <span className="shrink-0 rounded-full bg-sky-800 px-3 py-1.5 text-[11px] font-black text-white">
              {monthlyReminders.length > 0 ? `${monthlyReminders.length}` : labels.monthlySettings}
            </span>
          </button>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {Array.from({ length: 12 }, (_, index) => (
              <button
                className={`shrink-0 rounded-full px-4 py-2 text-sm font-black ${month === index ? "bg-emerald-800 text-white" : "bg-emerald-50 text-emerald-800"}`}
                key={index}
                onClick={() => setMonth(index)}
                type="button"
              >
                {index + 1}月
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2 text-xs font-black">
            <span className="rounded-full bg-rose-50 px-3 py-1 text-rose-700">{labels.legendHoliday}</span>
            <span className="rounded-full bg-amber-50 px-3 py-1 text-amber-800">{labels.legendVacation}</span>
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-800">{labels.legendFestival}</span>
            <span className="rounded-full bg-sky-50 px-3 py-1 text-sky-800">{labels.legendExam}</span>
            <span className="rounded-full bg-violet-50 px-3 py-1 text-violet-800">{labels.legendNote}</span>
          </div>
        </section>

        {garbageOpen && (
          <GarbageSettingsPanel
            form={garbageForm}
            formOpen={garbageFormOpen}
            labels={labels}
            language={language}
            onCancel={() => setGarbageFormOpen(false)}
            onChange={setGarbageForm}
            onClear={clearRules}
            onDelete={deleteRule}
            onEdit={startEditGarbageRule}
            onNew={startAddGarbageRule}
            onSave={submitGarbageRule}
            onToggle={toggleRule}
            rules={garbageRules}
          />
        )}

        {monthlyOpen && (
          <MonthlyReminderPanel
            form={monthlyForm}
            formOpen={monthlyFormOpen}
            labels={labels}
            language={language}
            onCancel={() => setMonthlyFormOpen(false)}
            onChange={setMonthlyForm}
            onDelete={deleteReminder}
            onEdit={startEditMonthlyReminder}
            onNew={startAddMonthlyReminder}
            onSave={submitMonthlyReminder}
            onToggle={toggleReminder}
            reminders={monthlyReminders}
          />
        )}

        <section className="mt-5 grid gap-5">
          <div className="rounded-[22px] bg-white p-4 shadow-[0_10px_24px_rgba(32,38,34,0.07)]">
            <div className="mb-4 flex items-end justify-between gap-3">
              <div>
                <h2 className="text-xl font-black">2026年 {monthNumber}月</h2>
                <p className="mt-1 text-[11px] font-black text-stone-400">{labels.tapDay}</p>
              </div>
              <div className="rounded-2xl bg-emerald-50 px-3 py-2 text-right">
                <p className="text-[10px] font-black text-emerald-700">{selectedDate ? labels.selectedDay : labels.today}</p>
                <p className="text-sm font-black text-emerald-950">{selectedDate ?? todayDate}</p>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-1">
              {weekdays.map((day, index) => (
                <div className={`text-center text-xs font-black ${index === 0 ? "text-rose-600" : index === 6 ? "text-sky-600" : "text-stone-400"}`} key={day}>
                  {day}
                </div>
              ))}
              {cells.map((day, index) => {
                const date = day ? `${year}-${pad(monthNumber)}-${pad(day)}` : "";
                const dayEvents = day ? allEvents.filter((item) => inRange(date, item)) : [];
                const dayNotes = day ? (notesByDate[date] ?? []) : [];
                const dayGarbage = day && garbageLoaded ? getGarbageForDate(dateStringToDate(date), garbageRules) : [];
                const dayGarbageTypes = Array.from(new Set(dayGarbage.flatMap((item) => item.garbageTypes)));
                const dayMonthly = day && monthlyLoaded ? getMonthlyRemindersForDate(dateStringToDate(date), monthlyReminders) : [];
                const dayOfWeek = day ? new Date(year, month, day).getDay() : -1;
                const isSunday = dayOfWeek === 0;
                const isSaturday = dayOfWeek === 6;
                const isHoliday = dayEvents.some((item) => item.type === "holiday");
                const isToday = date === todayDate;
                const isSelected = selectedDate === date;

                return (
                  <button
                    className={`relative flex min-h-[64px] flex-col overflow-hidden rounded-2xl border p-1.5 text-left transition active:scale-[0.98] min-[390px]:min-h-[70px] min-[390px]:p-2 ${
                      isSunday || isHoliday ? "border-rose-100 bg-rose-50/45" : isSaturday ? "border-sky-100 bg-sky-50/35" : "border-stone-100 bg-stone-50"
                    } ${isSelected ? "border-emerald-500 bg-emerald-50 ring-2 ring-emerald-500" : ""} ${isToday ? "shadow-[0_0_0_2px_rgba(4,120,87,0.32)]" : ""}`}
                    key={`${day}-${index}`}
                    onClick={() => day && openDay(date)}
                    type="button"
                  >
                    {day && (
                      <div className="flex items-center justify-between gap-1">
                        <span className={`flex h-7 w-7 items-center justify-center rounded-full text-sm font-black ${isToday ? "bg-emerald-800 text-white" : isSunday || isHoliday ? "text-rose-700" : isSaturday ? "text-sky-700" : "text-stone-950"}`}>{day}</span>
                        <span className="flex items-center gap-0.5">
                          {dayNotes.length > 0 && <span className="h-2 w-2 rounded-full bg-violet-500" />}
                        </span>
                      </div>
                    )}
                    <div className="mt-auto flex items-center gap-1">
                      {dayEvents.length > 0 && <span className={`h-1.5 w-1.5 rounded-full ${isHoliday ? "bg-rose-500" : "bg-emerald-500"}`} />}
                      {dayNotes.length > 0 && <span className="rounded-full bg-violet-100 px-1 text-[8px] font-black leading-4 text-violet-700">{labels.noteBadge}</span>}
                      {dayMonthly.length > 0 && <span className="rounded-full bg-sky-100 px-1 text-[8px] font-black leading-4 text-sky-700">{monthlyReminderCategoryLabels[dayMonthly[0].category][language]}</span>}
                      {dayGarbageTypes.slice(0, 2).map((type, typeIndex) => <span className="text-[10px] leading-none" key={`${date}-${type}-${typeIndex}`}>{garbageTypeConfig[type].icon}</span>)}
                      {dayMonthly.length + dayGarbageTypes.length + dayNotes.length + dayEvents.length > 4 && <span className="text-[8px] font-black text-stone-400">+{dayMonthly.length + dayGarbageTypes.length + dayNotes.length + dayEvents.length - 4}</span>}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-4 grid gap-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-stone-800">{labels.monthHeading}</h3>
                <span className="rounded-full bg-stone-100 px-2 py-1 text-[11px] font-black text-stone-500">{monthAgenda.length}</span>
              </div>
              {monthAgenda.length === 0 ? (
                <p className="rounded-2xl bg-stone-50 p-3 text-xs font-bold text-stone-500">{labels.monthEmpty}</p>
              ) : (
                <div className="max-h-[360px] overflow-y-auto pr-1">
                  <div className="grid gap-2">
                    {monthAgenda.map((item) => (
                      <button className="grid grid-cols-[44px_minmax(0,1fr)] gap-3 rounded-2xl bg-stone-50 p-3 text-left transition active:scale-[0.99]" key={item.date} onClick={() => openDay(item.date)} type="button">
                        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-base font-black text-stone-900">{item.day}</span>
                        <span className="min-w-0">
                          {item.notes.slice(0, 1).map((note) => (
                            <span className={`mb-1 block truncate rounded-lg px-2 py-1 text-xs font-black ${noteClass(note.type)}`} key={note.id}>
                              {labels.noteBadge} {note.time ? `${note.time} ` : ""}{note.title}
                            </span>
                          ))}
                          {item.garbage.length > 0 && (
                            <span className="block truncate rounded-lg bg-amber-50 px-2 py-1 text-xs font-black text-amber-800">
                              {item.garbage.flatMap((garbage) => garbage.garbageTypes).slice(0, 3).map((type) => `${garbageTypeConfig[type].icon} ${garbageTypeName(type, language)}`).join(" / ")}
                            </span>
                          )}
                          {item.monthly.length > 0 && (
                            <span className="block truncate rounded-lg bg-sky-50 px-2 py-1 text-xs font-black text-sky-800">
                              {item.monthly.slice(0, 2).map((reminder) => `${monthlyReminderName(reminder, language)} ${formatReminderAmount(reminder.amount)}`.trim()).join(" / ")}
                            </span>
                          )}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <aside className="grid gap-4">
            {selectedDate && (
              <section className="rounded-[22px] bg-white p-4 shadow-[0_10px_24px_rgba(32,38,34,0.07)]">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-black text-emerald-800">{selectedDate}</p>
                    <h2 className="text-xl font-black">{labels.userNotes}</h2>
                  </div>
                  <button className="flex h-9 w-9 items-center justify-center rounded-full bg-stone-100 text-stone-500" onClick={() => setSelectedDate(null)} type="button">
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="grid gap-3">
                  <div>
                    <h3 className="mb-2 text-sm font-black text-stone-700">{labels.officialEvents}</h3>
                    {selectedEvents.length === 0 ? (
                      <p className="rounded-2xl bg-stone-50 p-3 text-xs font-bold text-stone-500">{labels.noPlans}</p>
                    ) : (
                      <div className="grid gap-2">
                        {selectedEvents.map((event, index) => <EventCard event={event} compact labels={labels} key={`selected-${eventKey(event, index)}`} />)}
                      </div>
                    )}
                  </div>

                  <div>
                    <h3 className="mb-2 flex items-center gap-1 text-sm font-black text-stone-700">
                      <Recycle className="h-4 w-4 text-emerald-700" />
                      {labels.garbageToday}
                    </h3>
                    {selectedGarbage.length === 0 ? (
                      <p className="rounded-2xl bg-stone-50 p-3 text-xs font-bold text-stone-500">{labels.noGarbageToday}</p>
                    ) : (
                      <div className="grid gap-2">
                        {selectedGarbage.map((item, itemIndex) => (
                          <article className="rounded-2xl bg-emerald-50 p-3 text-emerald-900" key={`${selectedDate}-${item.ruleId}-${itemIndex}`}>
                            <div className="flex flex-wrap gap-1.5">
                              {item.garbageTypes.map((type) => (
                                <span className="rounded-full bg-white px-2 py-1 text-xs font-black" key={type}>
                                  {garbageTypeConfig[type].icon} {garbageTypeName(type, language)}
                                </span>
                              ))}
                            </div>
                            <p className="mt-2 text-xs font-black">{labels.reminderTime}: {item.reminderTime}</p>
                            {item.note && <p className="mt-1 text-xs font-bold leading-5 text-emerald-800">{item.note}</p>}
                          </article>
                        ))}
                        <p className="rounded-2xl bg-stone-50 p-3 text-xs font-bold leading-5 text-stone-500">{labels.garbageTip}</p>
                      </div>
                    )}
                  </div>

                  <div>
                    <h3 className="mb-2 flex items-center gap-1 text-sm font-black text-stone-700">
                      <CreditCard className="h-4 w-4 text-sky-700" />
                      {labels.monthlyToday}
                    </h3>
                    {selectedMonthlyReminders.length === 0 ? (
                      <p className="rounded-2xl bg-stone-50 p-3 text-xs font-bold text-stone-500">{labels.noMonthlyToday}</p>
                    ) : (
                      <div className="grid gap-2">
                        {selectedMonthlyReminders.map((reminder) => (
                          <article className="rounded-2xl bg-sky-50 p-3 text-sky-900" key={reminder.id}>
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <p className="text-[11px] font-black text-sky-700">{monthlyReminderCategoryLabels[reminder.category][language]} / {labels.reminderDay} {reminder.day}</p>
                                <h4 className="mt-1 font-black">{monthlyReminderName(reminder, language)} {formatReminderAmount(reminder.amount)}</h4>
                                {reminder.note && <p className="mt-1 text-xs font-bold leading-5 text-sky-800">{reminder.note}</p>}
                              </div>
                              <div className="flex shrink-0 gap-1">
                                <button className="rounded-full bg-white/80 p-1.5" onClick={() => {
                                  setMonthlyOpen(true);
                                  startEditMonthlyReminder(reminder);
                                }} type="button">
                                  <Edit3 className="h-3.5 w-3.5" />
                                </button>
                                <button className="rounded-full bg-white/80 p-1.5" onClick={() => deleteReminder(reminder.id)} type="button">
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </div>
                          </article>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <h3 className="text-sm font-black text-stone-700">{labels.userNotes}</h3>
                      <button className="inline-flex items-center gap-1 rounded-full bg-emerald-800 px-3 py-1.5 text-xs font-black text-white" onClick={startAddNote} type="button">
                        <Plus className="h-3.5 w-3.5" />
                        {labels.addNote}
                      </button>
                    </div>
                    {selectedNotes.length === 0 ? (
                      <p className="rounded-2xl bg-stone-50 p-3 text-xs font-bold text-stone-500">{labels.noNotes}</p>
                    ) : (
                      <div className="grid gap-2">
                        {selectedNotes.map((note) => (
                          <article className={`rounded-2xl p-3 ${noteClass(note.type)}`} key={note.id}>
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <p className="text-[11px] font-black opacity-80">{noteTypeLabels[note.type][language]}{note.time ? ` / ${note.time}` : ""}</p>
                                <h4 className="mt-1 font-black">{note.title}</h4>
                                {note.note && <p className="mt-1 text-xs font-bold leading-5 opacity-80">{note.note}</p>}
                              </div>
                              <div className="flex shrink-0 gap-1">
                                <button className="rounded-full bg-white/70 p-1.5" onClick={() => startEditNote(note)} type="button">
                                  <Edit3 className="h-3.5 w-3.5" />
                                </button>
                                <button className="rounded-full bg-white/70 p-1.5" onClick={() => deleteNote(note.id)} type="button">
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </div>
                          </article>
                        ))}
                      </div>
                    )}
                  </div>

                  {formOpen && (
                    <NoteForm
                      labels={labels}
                      language={language}
                      noteForm={noteForm}
                      onCancel={() => {
                        setFormOpen(false);
                        setEditingNoteId(null);
                      }}
                      onChange={setNoteForm}
                      onSave={saveNote}
                    />
                  )}
                </div>
              </section>
            )}

            <details className="rounded-[22px] bg-white p-4 shadow-[0_10px_24px_rgba(32,38,34,0.07)]">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-xl font-black">
                <span className="flex items-center gap-2">
                  <Flag className="h-5 w-5 text-emerald-800" />
                  {labels.officialMonthHeading}
                </span>
                <span className="rounded-full bg-stone-100 px-2 py-1 text-[11px] text-stone-500">{monthEvents.length}</span>
              </summary>
              <div className="grid gap-3">
                {monthEvents.length === 0 ? (
                  <p className="text-sm font-bold text-stone-500">{labels.officialMonthEmpty}</p>
                ) : (
                  monthEvents.map((event, index) => <EventCard event={event} labels={labels} key={eventKey(event, index)} />)
                )}
              </div>
            </details>

            <details className="rounded-[22px] bg-white p-4 shadow-[0_10px_24px_rgba(32,38,34,0.07)]">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-xl font-black">
                {labels.vacationHeading}
                <span className="rounded-full bg-stone-100 px-2 py-1 text-[11px] text-stone-500">{vacationRanges.length}</span>
              </summary>
              <div className="mt-3 grid gap-2">
                {vacationRanges.map((event, index) => (
                  <EventCard event={event} compact labels={labels} key={eventKey(event, index)} />
                ))}
              </div>
            </details>
          </aside>
        </section>

        <section className="mt-5 grid gap-5">
          <ListPanel title={labels.nationalHeading} icon="holiday" events={apiHolidays} labels={labels} />
          <ListPanel title={labels.festivalHeading} icon="festival" events={tokyoEvents} labels={labels} />
        </section>

        <details className="mt-5 rounded-[22px] bg-white p-4 shadow-[0_10px_24px_rgba(32,38,34,0.07)]">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-xl font-black">
            {labels.fireworkHeading}
            <span className="rounded-full bg-stone-100 px-2 py-1 text-[11px] text-stone-500">{tokyo23FireworkNotes.length}</span>
          </summary>
          <p className="mt-3 text-sm font-bold leading-6 text-stone-500">{labels.fireworkDesc}</p>
          <div className="mt-3 grid gap-2">
            {tokyo23FireworkNotes.map((item) => (
              <article className="rounded-2xl bg-stone-50 px-3 py-2" key={item.ward}>
                <h3 className="text-sm font-black text-emerald-800">{item.ward}</h3>
                <p className="mt-1 text-xs font-bold leading-5 text-stone-600">{item.event}</p>
              </article>
            ))}
          </div>
        </details>
        <DataNotice
          source={holidaySource === "holidays-jp" ? "Holidays JP API + Japan Life 本地考试 / 活动整理" : "Japan Life 本地假日 / 考试 / 活动备用数据"}
          sourceZhTW={holidaySource === "holidays-jp" ? "Holidays JP API + Japan Life 本地考試 / 活動整理" : "Japan Life 本地假日 / 考試 / 活動備用資料"}
          sourceJa={holidaySource === "holidays-jp" ? "Holidays JP API + Japan Life ローカル試験 / イベント整理" : "Japan Life ローカル祝日 / 試験 / イベント予備データ"}
          updatedAt="2026-05-22"
          note="日本节日、考试、活动和垃圾日程会随官方公告或用户设置变化，仅供日程参考。"
          noteZhTW="日本節日、考試、活動和垃圾日程會隨官方公告或使用者設定變化，僅供日程參考。"
          noteJa="日本の祝日、試験、イベント、ごみ日程は公式発表やユーザー設定により変わります。予定確認用としてご利用ください。"
        />
        <p className="mt-4 rounded-[18px] bg-amber-50 px-4 py-3 text-xs font-bold leading-5 text-amber-800">{labels.garbageNotice}</p>
      </div>
    </main>
  );
}

function GarbageSettingsPanel({
  form,
  formOpen,
  labels,
  language,
  onCancel,
  onChange,
  onClear,
  onDelete,
  onEdit,
  onNew,
  onSave,
  onToggle,
  rules,
}: {
  form: GarbageRuleForm;
  formOpen: boolean;
  labels: (typeof calendarCopy)[keyof typeof calendarCopy];
  language: "zh-CN" | "zh-TW" | "ja";
  onCancel: () => void;
  onChange: (value: GarbageRuleForm) => void;
  onClear: () => void;
  onDelete: (id: string) => void;
  onEdit: (rule: GarbageScheduleRule) => void;
  onNew: () => void;
  onSave: () => void;
  onToggle: (id: string) => void;
  rules: GarbageScheduleRule[];
}) {
  const canSave = form.garbageTypes.length > 0
    && form.reminderTime
    && (form.frequency === "monthlyDate" ? form.monthDays.length > 0 : true)
    && (form.frequency === "weekly" || form.frequency === "biweekly" ? form.weekdays.length > 0 : true);

  return (
    <section className="mt-5 grid gap-3 rounded-[22px] bg-white p-4 shadow-[0_10px_24px_rgba(32,38,34,0.07)]">
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-lg font-black">
          <Recycle className="h-5 w-5 text-emerald-800" />
          {labels.garbageCalendar}
        </h2>
        <button className="rounded-full bg-emerald-800 px-3 py-2 text-xs font-black text-white" onClick={onNew} type="button">{labels.addRule}</button>
      </div>

      {rules.length === 0 ? (
        <p className="rounded-2xl bg-stone-50 p-3 text-xs font-bold text-stone-500">{labels.noRules}</p>
      ) : (
        <div className="grid gap-2">
          {rules.map((rule) => (
            <article className={`rounded-2xl border p-3 ${rule.enabled ? "border-emerald-100 bg-emerald-50" : "border-stone-100 bg-stone-50"}`} key={rule.id}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex flex-wrap gap-1.5">
                    {rule.garbageTypes.map((type) => (
                      <span className="rounded-full bg-white px-2 py-1 text-xs font-black text-emerald-900" key={type}>
                        {garbageTypeConfig[type].icon} {garbageTypeName(type, language)}
                      </span>
                    ))}
                  </div>
                  <p className="mt-2 text-xs font-black text-stone-700">{describeGarbageRule(rule, labels)}</p>
                  <p className="mt-1 text-xs font-bold text-stone-500">{labels.reminderTime}: {rule.reminderTime}</p>
                  {rule.note && <p className="mt-1 text-xs font-bold leading-5 text-stone-600">{rule.note}</p>}
                </div>
                <div className="flex shrink-0 flex-col gap-1">
                  <button className="rounded-full bg-white px-2 py-1 text-[11px] font-black text-stone-600" onClick={() => onToggle(rule.id)} type="button">{rule.enabled ? labels.enabled : labels.disabled}</button>
                  <button className="rounded-full bg-white p-1.5 text-stone-600" onClick={() => onEdit(rule)} type="button"><Edit3 className="h-3.5 w-3.5" /></button>
                  <button className="rounded-full bg-white p-1.5 text-red-500" onClick={() => onDelete(rule.id)} type="button"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {formOpen && (
        <div className="grid gap-3 rounded-[20px] border border-emerald-100 bg-emerald-50 p-3">
          <div>
            <p className="mb-2 text-xs font-black text-stone-600">{labels.garbageTypes}</p>
            <div className="grid grid-cols-2 gap-2">
              {garbageTypes.map((type) => (
                <button className={`rounded-xl px-2 py-2 text-left text-xs font-black ${form.garbageTypes.includes(type) ? "bg-emerald-800 text-white" : "bg-white text-stone-700"}`} key={type} onClick={() => onChange({ ...form, garbageTypes: toggleArrayValue(form.garbageTypes, type) })} type="button">
                  {garbageTypeConfig[type].icon} {garbageTypeName(type, language)}
                </button>
              ))}
            </div>
          </div>

          <label className="grid gap-1">
            <span className="text-xs font-black text-stone-600">{labels.frequency}</span>
            <select className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm font-bold outline-none focus:border-emerald-500" value={form.frequency} onChange={(event) => onChange({ ...form, frequency: event.target.value as GarbageFrequency })}>
              {(["weekly", "biweekly", "monthlyDate", "monthlyWeekday"] as GarbageFrequency[]).map((frequency) => <option key={frequency} value={frequency}>{labels.frequencyLabels[frequency]}</option>)}
            </select>
          </label>

          {(form.frequency === "weekly" || form.frequency === "biweekly") && (
            <div>
              <p className="mb-2 text-xs font-black text-stone-600">{labels.weekdays}</p>
              <div className="grid grid-cols-4 gap-1.5">
                {labels.weekLabels.map((day, index) => (
                  <button className={`rounded-xl px-2 py-2 text-xs font-black ${form.weekdays.includes(index) ? "bg-emerald-800 text-white" : "bg-white text-stone-700"}`} key={`${day}-${index}`} onClick={() => onChange({ ...form, weekdays: toggleArrayValue(form.weekdays, index).sort((a, b) => a - b) })} type="button">{day}</button>
                ))}
              </div>
            </div>
          )}

          {form.frequency === "biweekly" && (
            <label className="grid gap-1">
              <span className="text-xs font-black text-stone-600">{labels.startDate}</span>
              <input className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm font-bold outline-none focus:border-emerald-500" type="date" value={form.startDate} onChange={(event) => onChange({ ...form, startDate: event.target.value })} />
            </label>
          )}

          {form.frequency === "monthlyDate" && (
            <div>
              <p className="mb-2 text-xs font-black text-stone-600">{labels.monthDays}</p>
              <div className="grid max-h-44 grid-cols-7 gap-1 overflow-y-auto pr-1">
                {Array.from({ length: 31 }, (_, index) => index + 1).map((day) => (
                  <button className={`rounded-lg py-1.5 text-xs font-black ${form.monthDays.includes(day) ? "bg-emerald-800 text-white" : "bg-white text-stone-700"}`} key={day} onClick={() => onChange({ ...form, monthDays: toggleArrayValue(form.monthDays, day).sort((a, b) => a - b) })} type="button">{day}</button>
                ))}
              </div>
            </div>
          )}

          {form.frequency === "monthlyWeekday" && (
            <div className="grid grid-cols-2 gap-2">
              <label className="grid gap-1">
                <span className="text-xs font-black text-stone-600">{labels.weekOfMonth}</span>
                <select className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm font-bold outline-none focus:border-emerald-500" value={String(form.weekOfMonth)} onChange={(event) => onChange({ ...form, weekOfMonth: event.target.value === "last" ? "last" : Number(event.target.value) as 1 | 2 | 3 | 4 | 5 })}>
                  {(["1", "2", "3", "4", "5", "last"] as const).map((value) => <option key={value} value={value}>{labels.weekOfMonthLabels[value]}</option>)}
                </select>
              </label>
              <label className="grid gap-1">
                <span className="text-xs font-black text-stone-600">{labels.weekdays}</span>
                <select className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm font-bold outline-none focus:border-emerald-500" value={form.weekday} onChange={(event) => onChange({ ...form, weekday: Number(event.target.value) })}>
                  {labels.weekLabels.map((day, index) => <option key={`${day}-${index}`} value={index}>{day}</option>)}
                </select>
              </label>
            </div>
          )}

          <div className="grid grid-cols-1 gap-2 min-[390px]:grid-cols-2">
            <label className="grid gap-1">
              <span className="text-xs font-black text-stone-600">{labels.reminderTime}</span>
              <input className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm font-bold outline-none focus:border-emerald-500" type="time" value={form.reminderTime} onChange={(event) => onChange({ ...form, reminderTime: event.target.value })} />
            </label>
            <label className="grid gap-1">
              <span className="text-xs font-black text-stone-600">{labels.noteOptional}</span>
              <input className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm font-bold outline-none focus:border-emerald-500" value={form.note} onChange={(event) => onChange({ ...form, note: event.target.value })} />
            </label>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <button className="rounded-xl bg-white px-3 py-2 text-xs font-black text-stone-600" onClick={onCancel} type="button">{labels.cancelRule}</button>
            <button className="rounded-xl bg-red-50 px-3 py-2 text-xs font-black text-red-600" onClick={onClear} type="button">{labels.clearRules}</button>
            <button className="rounded-xl bg-emerald-800 px-3 py-2 text-xs font-black text-white disabled:bg-stone-300" disabled={!canSave} onClick={onSave} type="button">{labels.saveRule}</button>
          </div>
        </div>
      )}
    </section>
  );
}

function MonthlyReminderPanel({
  form,
  formOpen,
  labels,
  language,
  onCancel,
  onChange,
  onDelete,
  onEdit,
  onNew,
  onSave,
  onToggle,
  reminders,
}: {
  form: MonthlyReminderForm;
  formOpen: boolean;
  labels: (typeof calendarCopy)[keyof typeof calendarCopy];
  language: "zh-CN" | "zh-TW" | "ja";
  onCancel: () => void;
  onChange: (value: MonthlyReminderForm) => void;
  onDelete: (id: string) => void;
  onEdit: (reminder: MonthlyReminder) => void;
  onNew: () => void;
  onSave: () => void;
  onToggle: (id: string) => void;
  reminders: MonthlyReminder[];
}) {
  const canSave = form.title.trim().length > 0 && form.day >= 1 && form.day <= 31;

  return (
    <section className="mt-5 grid gap-3 rounded-[22px] bg-white p-4 shadow-[0_10px_24px_rgba(32,38,34,0.07)]">
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-lg font-black">
          <CreditCard className="h-5 w-5 text-sky-800" />
          {labels.monthlyReminder}
        </h2>
        <button className="rounded-full bg-sky-800 px-3 py-2 text-xs font-black text-white" onClick={onNew} type="button">{labels.addRule}</button>
      </div>

      {reminders.length === 0 ? (
        <p className="rounded-2xl bg-stone-50 p-3 text-xs font-bold text-stone-500">{labels.noMonthlyToday}</p>
      ) : (
        <div className="grid gap-2">
          {reminders.map((reminder) => (
            <article className={`rounded-2xl border p-3 ${reminder.enabled ? "border-sky-100 bg-sky-50" : "border-stone-100 bg-stone-50"}`} key={reminder.id}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[11px] font-black text-sky-700">{monthlyReminderCategoryLabels[reminder.category][language]} / {labels.reminderDay} {reminder.day}</p>
                  <h3 className="mt-1 font-black">{monthlyReminderName(reminder, language)} {formatReminderAmount(reminder.amount)}</h3>
                  {reminder.note && <p className="mt-1 text-xs font-bold leading-5 text-stone-600">{reminder.note}</p>}
                </div>
                <div className="flex shrink-0 flex-col gap-1">
                  <button className="rounded-full bg-white px-2 py-1 text-[11px] font-black text-stone-600" onClick={() => onToggle(reminder.id)} type="button">{reminder.enabled ? labels.enabled : labels.disabled}</button>
                  <button className="rounded-full bg-white p-1.5 text-stone-600" onClick={() => onEdit(reminder)} type="button"><Edit3 className="h-3.5 w-3.5" /></button>
                  <button className="rounded-full bg-white p-1.5 text-red-500" onClick={() => onDelete(reminder.id)} type="button"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {formOpen && (
        <div className="grid gap-3 rounded-[20px] border border-sky-100 bg-sky-50 p-3">
          <label className="grid gap-1">
            <span className="text-xs font-black text-stone-600">{labels.titleField}</span>
            <input className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm font-bold outline-none focus:border-sky-500" placeholder={labels.reminderTitlePlaceholder} value={form.title} onChange={(event) => onChange({ ...form, title: event.target.value })} />
          </label>

          <div className="grid grid-cols-2 gap-2">
            <label className="grid gap-1">
              <span className="text-xs font-black text-stone-600">{labels.reminderDay}</span>
              <select className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm font-bold outline-none focus:border-sky-500" value={form.day} onChange={(event) => onChange({ ...form, day: Number(event.target.value) })}>
                {Array.from({ length: 31 }, (_, index) => index + 1).map((day) => <option key={day} value={day}>{day}</option>)}
              </select>
            </label>
            <label className="grid gap-1">
              <span className="text-xs font-black text-stone-600">{labels.reminderCategory}</span>
              <select className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm font-bold outline-none focus:border-sky-500" value={form.category} onChange={(event) => onChange({ ...form, category: event.target.value as MonthlyReminderCategory })}>
                {monthlyReminderCategories.map((category) => <option key={category} value={category}>{monthlyReminderCategoryLabels[category][language]}</option>)}
              </select>
            </label>
          </div>

          <div className="grid grid-cols-1 gap-2 min-[390px]:grid-cols-2">
            <label className="grid gap-1">
              <span className="text-xs font-black text-stone-600">{labels.reminderAmount}</span>
              <input className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm font-bold outline-none focus:border-sky-500" inputMode="numeric" value={form.amount} onChange={(event) => onChange({ ...form, amount: event.target.value.replace(/[^\d]/g, "") })} />
            </label>
            <label className="grid gap-1">
              <span className="text-xs font-black text-stone-600">{labels.noteOptional}</span>
              <input className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm font-bold outline-none focus:border-sky-500" value={form.note} onChange={(event) => onChange({ ...form, note: event.target.value })} />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button className="rounded-xl bg-white px-3 py-2 text-xs font-black text-stone-600" onClick={onCancel} type="button">{labels.cancelRule}</button>
            <button className="rounded-xl bg-sky-800 px-3 py-2 text-xs font-black text-white disabled:bg-stone-300" disabled={!canSave} onClick={onSave} type="button">{labels.saveRule}</button>
          </div>
        </div>
      )}
    </section>
  );
}

function EventCard({ event, labels, compact = false }: { event: CalendarEvent; labels: (typeof calendarCopy)[keyof typeof calendarCopy]; compact?: boolean }) {
  return (
    <article className={`rounded-2xl p-3 ${eventClass(event.type)}`}>
      <p className="text-xs font-black">{formatDateRange(event)}</p>
      <h3 className="mt-1 font-black">{event.title}</h3>
      {!compact && event.area && (
        <p className="mt-1 flex items-center gap-1 text-xs font-bold">
          <MapPin className="h-3.5 w-3.5" />
          {event.area}
        </p>
      )}
      {event.note && <p className="mt-1 text-xs font-bold leading-5 opacity-80">{event.note}</p>}
      {!compact && event.source && (
        <a className="mt-2 inline-flex items-center gap-1 text-xs font-black underline underline-offset-2" href={event.source} rel="noreferrer" target="_blank">
          {labels.officialSource}
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      )}
    </article>
  );
}

function NoteForm({
  labels,
  language,
  noteForm,
  onCancel,
  onChange,
  onSave,
}: {
  labels: (typeof calendarCopy)[keyof typeof calendarCopy];
  language: "zh-CN" | "zh-TW" | "ja";
  noteForm: CalendarNoteInput;
  onCancel: () => void;
  onChange: (value: CalendarNoteInput) => void;
  onSave: () => void;
}) {
  return (
    <div className="rounded-[20px] border border-emerald-100 bg-emerald-50 p-3">
      <div className="grid gap-2">
        <label className="grid gap-1">
          <span className="text-xs font-black text-stone-600">{labels.titleField}</span>
          <input className="w-full rounded-xl border border-stone-200 bg-white px-3 text-sm font-bold outline-none focus:border-emerald-500" placeholder={labels.notePlaceholder} value={noteForm.title} onChange={(event) => onChange({ ...noteForm, title: event.target.value })} />
        </label>
        <div className="grid grid-cols-1 gap-2 min-[390px]:grid-cols-2">
          <label className="grid gap-1">
            <span className="text-xs font-black text-stone-600">{labels.type}</span>
            <select className="w-full rounded-xl border border-stone-200 bg-white px-3 text-sm font-bold outline-none focus:border-emerald-500" value={noteForm.type} onChange={(event) => onChange({ ...noteForm, type: event.target.value as CalendarNoteType })}>
              {noteTypeOptions.map((type) => (
                <option key={type} value={type}>
                  {noteTypeLabels[type][language]}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1">
            <span className="text-xs font-black text-stone-600">{labels.time}</span>
            <input className="w-full rounded-xl border border-stone-200 bg-white px-3 text-sm font-bold outline-none focus:border-emerald-500" type="time" value={noteForm.time ?? ""} onChange={(event) => onChange({ ...noteForm, time: event.target.value })} />
          </label>
        </div>
        <label className="grid gap-1">
          <span className="text-xs font-black text-stone-600">{labels.detail}</span>
          <textarea className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm font-bold outline-none focus:border-emerald-500" value={noteForm.note ?? ""} onChange={(event) => onChange({ ...noteForm, note: event.target.value })} />
        </label>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <button className="rounded-xl bg-white px-3 py-2 text-xs font-black text-stone-600" onClick={onCancel} type="button">
          {labels.cancel}
        </button>
        <button className="rounded-xl bg-emerald-800 px-3 py-2 text-xs font-black text-white" onClick={onSave} type="button">
          {labels.save}
        </button>
      </div>
    </div>
  );
}

function ListPanel({ title, icon, events, labels }: { title: string; icon: "holiday" | "festival"; events: CalendarEvent[]; labels: (typeof calendarCopy)[keyof typeof calendarCopy] }) {
  return (
    <details className="rounded-[22px] bg-white p-4 shadow-[0_10px_24px_rgba(32,38,34,0.07)]">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-xl font-black">
        <span className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-emerald-800" />
          {title}
        </span>
        <span className="rounded-full bg-stone-100 px-2 py-1 text-[11px] text-stone-500">{events.length}</span>
      </summary>
      <div className="mt-4 grid gap-3">
        {events.map((event, index) => (
          <EventCard event={event} labels={labels} key={`${icon}-${eventKey(event, index)}`} />
        ))}
      </div>
    </details>
  );
}

function eventKey(event: CalendarEvent, index: number) {
  return event.id ?? `${event.date}-${event.endDate ?? event.date}-${event.type}-${event.title}-${index}`;
}
