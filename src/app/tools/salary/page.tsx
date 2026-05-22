"use client";

import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { AlertTriangle, BriefcaseBusiness, CheckCircle2, ChevronDown, Copy, JapaneseYen, Save } from "lucide-react";
import { useMemo, useState } from "react";
import { BackButton } from "@/components/BackButton";
import { useLanguage } from "@/hooks/useLanguage";
import { formatCurrency } from "@/lib/formatCurrency";

type Mode = "partTime" | "employee";
type PartTimeScheduleMode = "fixed" | "weekly";
type NightWageMode = "premium" | "custom";
type AgeBand = "under40" | "40to64" | "65plus";
type SocialPlan = "company" | "none";
type EmploymentRate = "general" | "agriculture" | "construction" | "none";
type SpouseDeduction = "none" | "deduction";
type BasicDeduction = "normal" | "none";
type ResidentTaxMode = "estimate" | "manual" | "none";
type SalaryText = (typeof salaryCopy)[keyof typeof salaryCopy];

type EmployeeResult = {
  annualDeductions: number;
  annualGross: number;
  annualIncomeTax: number;
  annualSocial: number;
  basic: number;
  care: number;
  childSupport: number;
  dependentDeduction: number;
  employment: number;
  employmentDeduction: number;
  health: number;
  holidayPay: number;
  latePremium: number;
  monthlyDeductions: number;
  monthlyGross: number;
  monthlyIncomeTax: number;
  monthlyNet: number;
  monthlyResidentTax: number;
  monthlySocial: number;
  overtime: number;
  pension: number;
  salaryIncome: number;
  socialBase: number;
  taxableIncome: number;
};

type WeeklyPartTimeRow = {
  label: string;
  wage: string;
  hours: string;
  lateNightHours: string;
  lateNightWage: string;
};

const salaryStorageKey = "japan-life:salary-result";
const defaultWeeklyPartTimeRows: WeeklyPartTimeRow[] = [
  { label: "第1周", wage: "1150", hours: "18", lateNightHours: "0", lateNightWage: "1438" },
  { label: "第2周", wage: "1150", hours: "18", lateNightHours: "0", lateNightWage: "1438" },
  { label: "第3周", wage: "1150", hours: "18", lateNightHours: "0", lateNightWage: "1438" },
  { label: "第4周", wage: "1150", hours: "18", lateNightHours: "0", lateNightWage: "1438" },
];
const yen = (value: number) => formatCurrency(value, "JPY");
const salaryCopy = {
  "zh-CN": {
    desc: "兼职和正社员分开计算。正社员会拆开健康保险、厚生年金、雇用保险、子育て支援金、所得税和住民税。",
    partTimeMode: "兼职工资",
    employeeMode: "正社员手取り",
    basicInfo: "基本信息",
    moreOptions: "更多选项",
    monthlyBase: "月薪（税前）",
    age: "年龄",
    under40: "40岁未满",
    age40to64: "40-64岁",
    age65plus: "65岁以上",
    socialPlan: "社保加入",
    companySocial: "公司社保/厚生年金",
    noSocial: "不加入",
    employmentInsurance: "雇用保险",
    generalBiz: "一般事业 0.55%",
    agriculture: "农林水产 0.65%",
    construction: "建设 0.65%",
    none: "无",
    dependents: "扶养亲族人数",
    spouse: "配偶者控除",
    has: "有",
    commute: "交通费/月",
    bonus: "奖金/年",
    scheduledHours: "月平均所定工时",
    overtime: "普通加班小时/月",
    employeeLate: "深夜小时/月",
    holidayHours: "休日出勤小时/月",
    basicDeduction: "本人控除",
    basicNormal: "基础 48万",
    ideco: "iDeCo/小规共等 年额",
    lifeInsurance: "生命保险控除 年额",
    earthquake: "地震保险控除 年额",
    otherDeduction: "其他所得控除 年额",
    healthRate: "健康保险员工负担率%",
    childRate: "子育て支援金员工负担率%",
    residentTax: "住民税",
    residentEstimate: "按今年收入估算",
    residentManual: "手动月额",
    residentNone: "不计算",
    residentManualMonthly: "住民税手动月额",
    monthlyResult: "计算结果（每月）",
    monthlyNet: "月手取り估算",
    monthlyDeductions: "月扣除合计",
    annualNet: "年手取り估算",
    annualGross: "年收入税前",
    monthlySocial: "社会保险合计（月）",
    childMonthly: "子育て支援金（月）",
    annualDeductions: "所得控除合计（年）",
    taxable: "课税所得估算（年）",
    why: "为什么扣了这些钱",
    saveHome: "保存到首页",
    copyDetail: "复制明细",
    saved: "已保存到首页工资卡片",
    estimateWarning: "这是工资单级别的概算，不是税务申报结果。实际会因公司健保、标准报酬等级、扶养判定、前年收入、奖金社保和住民税通知书变化。",
    partBasic: "兼职基本信息",
    fixed: "固定时间",
    weekly: "每周不同",
    weeklyHelp: "适合排班不固定、多份兼职、每周时薪不同的情况。每一周可单独填写时薪、工时和深夜小时。",
    nightSetting: "深夜时薪设置",
    autoPremium: "自动+25%",
    custom: "自定义",
    nightHelp: "如果店里深夜时薪不是普通时薪的 1.25 倍，可以切到自定义后直接填写。",
    studentCheck: "留学生 28 小时提醒",
    on: "开启",
    off: "关闭",
    hourly: "时薪",
    weeklyHours: "每周小时",
    monthlyWeeks: "每月周数",
    lateNightWeekly: "深夜小时/周",
    lateNightWage: "深夜时薪",
    workHours: "工时",
    lateNight: "深夜",
    thisWeek: "本周",
    monthlyIncome: "预计月收入",
    annualIncome: "预计年收入",
    monthlyTotalHours: "月总工时",
    maxWeek: "最高单周",
    netEstimate: "到手估算",
    healthInsurance: "健康保险",
    childSupport: "子ども・子育て支援金",
    careInsurance: "介护保险",
    pension: "厚生年金",
    incomeTax: "所得税 + 复兴特别所得税",
    deductions: {
      health: "医疗保险。按标准报酬月额近似计算，实际金额按公司健保/协会健保和等级表。",
      child: "2026年4月开始随医疗保险征收。这里按员工负担率估算。",
      care40: "40-64岁加入医疗保险的人通常需要负担。这里按员工负担 0.81% 估算。",
      careOther: "40岁未满或65岁以上时，工资单上通常不按这个方式扣介护保险。",
      pension: "公司员工养老金。按标准报酬月额 × 9.15% 员工负担估算，实际按标准报酬等级表。",
      employment: "失业、育休等雇用保险制度的员工负担。按工资总额近似计算。",
      incomeTax: "按年收入、工资所得控除、所得控除估算，再加复兴特别所得税。",
      residentManual: "使用手动输入月额。实际住民税通常按前一年收入，由市区町村决定。",
      residentNone: "已关闭住民税估算。入职第一年可能暂时没有住民税，但第二年通常会开始扣。",
      residentEstimate: "按前年收入课税的逻辑做月均估算。实际金额以市区町村通知书为准。",
    },
  },
  "zh-TW": {
    desc: "打工和正社員分開計算。正社員會拆開健康保險、厚生年金、雇用保險、子育て支援金、所得稅和住民稅。",
    partTimeMode: "打工薪資",
    employeeMode: "正社員實領",
    basicInfo: "基本資訊",
    moreOptions: "更多選項",
    monthlyBase: "月薪（稅前）",
    age: "年齡",
    under40: "未滿40歲",
    age40to64: "40-64歲",
    age65plus: "65歲以上",
    socialPlan: "社保加入",
    companySocial: "公司社保/厚生年金",
    noSocial: "不加入",
    employmentInsurance: "雇用保險",
    generalBiz: "一般事業 0.55%",
    agriculture: "農林水產 0.65%",
    construction: "建設 0.65%",
    none: "無",
    dependents: "扶養親族人數",
    spouse: "配偶者控除",
    has: "有",
    commute: "交通費/月",
    bonus: "獎金/年",
    scheduledHours: "月平均所定工時",
    overtime: "普通加班小時/月",
    employeeLate: "深夜小時/月",
    holidayHours: "休日出勤小時/月",
    basicDeduction: "本人控除",
    basicNormal: "基礎 48萬",
    ideco: "iDeCo/小規共等 年額",
    lifeInsurance: "生命保險控除 年額",
    earthquake: "地震保險控除 年額",
    otherDeduction: "其他所得控除 年額",
    healthRate: "健康保險員工負擔率%",
    childRate: "子育て支援金員工負擔率%",
    residentTax: "住民稅",
    residentEstimate: "按今年收入估算",
    residentManual: "手動月額",
    residentNone: "不計算",
    residentManualMonthly: "住民稅手動月額",
    monthlyResult: "計算結果（每月）",
    monthlyNet: "月實領估算",
    monthlyDeductions: "月扣除合計",
    annualNet: "年實領估算",
    annualGross: "年收入稅前",
    monthlySocial: "社會保險合計（月）",
    childMonthly: "子育て支援金（月）",
    annualDeductions: "所得控除合計（年）",
    taxable: "課稅所得估算（年）",
    why: "為什麼扣了這些錢",
    saveHome: "儲存到首頁",
    copyDetail: "複製明細",
    saved: "已儲存到首頁薪資卡片",
    estimateWarning: "這是薪資單級別的概算，不是稅務申報結果。實際會因公司健保、標準報酬等級、扶養判定、前年收入、獎金社保和住民稅通知書變化。",
    partBasic: "打工基本資訊",
    fixed: "固定時間",
    weekly: "每週不同",
    weeklyHelp: "適合排班不固定、多份打工、每週時薪不同的情況。每一週可單獨填寫時薪、工時和深夜小時。",
    nightSetting: "深夜時薪設定",
    autoPremium: "自動+25%",
    custom: "自訂",
    nightHelp: "如果店裡深夜時薪不是普通時薪的 1.25 倍，可以切到自訂後直接填寫。",
    studentCheck: "留學生 28 小時提醒",
    on: "開啟",
    off: "關閉",
    hourly: "時薪",
    weeklyHours: "每週小時",
    monthlyWeeks: "每月週數",
    lateNightWeekly: "深夜小時/週",
    lateNightWage: "深夜時薪",
    workHours: "工時",
    lateNight: "深夜",
    thisWeek: "本週",
    monthlyIncome: "預估月收入",
    annualIncome: "預估年收入",
    monthlyTotalHours: "月總工時",
    maxWeek: "最高單週",
    netEstimate: "實領估算",
    healthInsurance: "健康保險",
    childSupport: "子ども・子育て支援金",
    careInsurance: "介護保險",
    pension: "厚生年金",
    incomeTax: "所得稅 + 復興特別所得稅",
    deductions: {
      health: "醫療保險。按標準報酬月額近似計算，實際金額依公司健保/協會健保和等級表。",
      child: "2026年4月開始隨醫療保險徵收。這裡按員工負擔率估算。",
      care40: "40-64歲加入醫療保險的人通常需要負擔。這裡按員工負擔 0.81% 估算。",
      careOther: "未滿40歲或65歲以上時，薪資單上通常不按這個方式扣介護保險。",
      pension: "公司員工年金。按標準報酬月額 × 9.15% 員工負擔估算，實際依標準報酬等級表。",
      employment: "失業、育休等雇用保險制度的員工負擔。按薪資總額近似計算。",
      incomeTax: "按年收入、給与所得控除、所得控除估算，再加復興特別所得稅。",
      residentManual: "使用手動輸入月額。實際住民稅通常按前一年收入，由市區町村決定。",
      residentNone: "已關閉住民稅估算。入職第一年可能暫時沒有住民稅，但第二年通常會開始扣。",
      residentEstimate: "按前年收入課稅的邏輯做月均估算。實際金額以市區町村通知書為準。",
    },
  },
  ja: {
    desc: "アルバイトと正社員を分けて計算します。正社員は健康保険、厚生年金、雇用保険、子ども・子育て支援金、所得税、住民税を分解します。",
    partTimeMode: "アルバイト給与",
    employeeMode: "正社員手取り",
    basicInfo: "基本情報",
    moreOptions: "詳細オプション",
    monthlyBase: "月給（税前）",
    age: "年齢",
    under40: "40歳未満",
    age40to64: "40-64歳",
    age65plus: "65歳以上",
    socialPlan: "社会保険",
    companySocial: "会社社保/厚生年金",
    noSocial: "加入しない",
    employmentInsurance: "雇用保険",
    generalBiz: "一般事業 0.55%",
    agriculture: "農林水産 0.65%",
    construction: "建設 0.65%",
    none: "なし",
    dependents: "扶養親族数",
    spouse: "配偶者控除",
    has: "あり",
    commute: "交通費/月",
    bonus: "賞与/年",
    scheduledHours: "月平均所定労働時間",
    overtime: "普通残業時間/月",
    employeeLate: "深夜時間/月",
    holidayHours: "休日出勤時間/月",
    basicDeduction: "本人控除",
    basicNormal: "基礎 48万",
    ideco: "iDeCo/小規模共済など 年額",
    lifeInsurance: "生命保険控除 年額",
    earthquake: "地震保険控除 年額",
    otherDeduction: "その他所得控除 年額",
    healthRate: "健康保険本人負担率%",
    childRate: "子ども・子育て支援金本人負担率%",
    residentTax: "住民税",
    residentEstimate: "今年収入で概算",
    residentManual: "月額を手入力",
    residentNone: "計算しない",
    residentManualMonthly: "住民税 手入力月額",
    monthlyResult: "計算結果（月額）",
    monthlyNet: "月手取り目安",
    monthlyDeductions: "月控除合計",
    annualNet: "年手取り目安",
    annualGross: "年収税前",
    monthlySocial: "社会保険合計（月）",
    childMonthly: "子ども・子育て支援金（月）",
    annualDeductions: "所得控除合計（年）",
    taxable: "課税所得目安（年）",
    why: "控除の内訳",
    saveHome: "ホームに保存",
    copyDetail: "明細をコピー",
    saved: "ホームの給与カードに保存しました",
    estimateWarning: "給与明細レベルの概算で、税務申告結果ではありません。実際は会社健保、標準報酬等級、扶養判定、前年所得、賞与社保、住民税通知書により変わります。",
    partBasic: "アルバイト基本情報",
    fixed: "固定時間",
    weekly: "週ごと",
    weeklyHelp: "シフトが不定期、複数バイト、週ごとに時給が違う場合に使います。各週の時給、勤務時間、深夜時間を入力できます。",
    nightSetting: "深夜時給設定",
    autoPremium: "自動+25%",
    custom: "手入力",
    nightHelp: "深夜時給が通常時給の1.25倍ではない場合は、手入力に切り替えてください。",
    studentCheck: "留学生28時間チェック",
    on: "オン",
    off: "オフ",
    hourly: "時給",
    weeklyHours: "週の時間",
    monthlyWeeks: "月の週数",
    lateNightWeekly: "深夜時間/週",
    lateNightWage: "深夜時給",
    workHours: "勤務時間",
    lateNight: "深夜",
    thisWeek: "今週",
    monthlyIncome: "月収目安",
    annualIncome: "年収目安",
    monthlyTotalHours: "月合計時間",
    maxWeek: "最大週時間",
    netEstimate: "手取り目安",
    healthInsurance: "健康保険",
    childSupport: "子ども・子育て支援金",
    careInsurance: "介護保険",
    pension: "厚生年金",
    incomeTax: "所得税 + 復興特別所得税",
    deductions: {
      health: "医療保険です。標準報酬月額をもとに概算しています。実際は会社健保/協会けんぽと等級表で変わります。",
      child: "2026年4月から医療保険とあわせて徴収される制度です。ここでは本人負担率で概算しています。",
      care40: "40-64歳で医療保険に加入している人は通常負担します。ここでは本人負担 0.81% で概算しています。",
      careOther: "40歳未満または65歳以上の場合、給与明細では通常この形で介護保険料を控除しません。",
      pension: "会社員の年金です。標準報酬月額 × 9.15% の本人負担で概算しています。実際は等級表で変わります。",
      employment: "失業、育休などの雇用保険制度の本人負担です。給与総額から概算しています。",
      incomeTax: "年収、給与所得控除、所得控除から概算し、復興特別所得税を加えています。",
      residentManual: "手入力の月額を使っています。実際の住民税は通常、前年所得をもとに市区町村が決定します。",
      residentNone: "住民税の概算をオフにしています。入社1年目は一時的に住民税がない場合がありますが、翌年から控除が始まることがあります。",
      residentEstimate: "前年所得課税の考え方で月平均を概算しています。実際の金額は市区町村の通知書を確認してください。",
    },
  },
} as const;
const toNumber = (value: string) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const employmentRates: Record<EmploymentRate, number> = {
  general: 0.0055,
  agriculture: 0.0065,
  construction: 0.0065,
  none: 0,
};

function salaryIncomeDeduction(annualGross: number) {
  if (annualGross <= 1_625_000) return 550_000;
  if (annualGross <= 1_800_000) return annualGross * 0.4 - 100_000;
  if (annualGross <= 3_600_000) return annualGross * 0.3 + 80_000;
  if (annualGross <= 6_600_000) return annualGross * 0.2 + 440_000;
  if (annualGross <= 8_500_000) return annualGross * 0.1 + 1_100_000;
  return 1_950_000;
}

function nationalIncomeTax(taxableIncome: number) {
  if (taxableIncome <= 0) return 0;
  if (taxableIncome <= 1_950_000) return taxableIncome * 0.05;
  if (taxableIncome <= 3_300_000) return taxableIncome * 0.1 - 97_500;
  if (taxableIncome <= 6_950_000) return taxableIncome * 0.2 - 427_500;
  if (taxableIncome <= 9_000_000) return taxableIncome * 0.23 - 636_000;
  if (taxableIncome <= 18_000_000) return taxableIncome * 0.33 - 1_536_000;
  if (taxableIncome <= 40_000_000) return taxableIncome * 0.4 - 2_796_000;
  return taxableIncome * 0.45 - 4_796_000;
}

function residentTaxEstimate(taxableIncome: number) {
  if (taxableIncome <= 0) return 0;
  return taxableIncome * 0.1 + 5_000;
}

export default function SalaryPage() {
  const { language, t } = useLanguage();
  const labels = salaryCopy[language];
  const [mode, setMode] = useState<Mode>("employee");
  const [saved, setSaved] = useState("");
  const [copied, setCopied] = useState(false);

  const [partTimeScheduleMode, setPartTimeScheduleMode] = useState<PartTimeScheduleMode>("fixed");
  const [nightWageMode, setNightWageMode] = useState<NightWageMode>("premium");
  const [hourlyWage, setHourlyWage] = useState("1150");
  const [weeklyHours, setWeeklyHours] = useState("18");
  const [monthlyWeeks, setMonthlyWeeks] = useState("4");
  const [isStudent, setIsStudent] = useState(true);
  const [lateNightHours, setLateNightHours] = useState("0");
  const [lateNightWage, setLateNightWage] = useState("1438");
  const [weeklyRows, setWeeklyRows] = useState<WeeklyPartTimeRow[]>(defaultWeeklyPartTimeRows);

  const [baseSalary, setBaseSalary] = useState("300000");
  const [commute, setCommute] = useState("10000");
  const [bonusAnnual, setBonusAnnual] = useState("0");
  const [scheduledHours, setScheduledHours] = useState("160");
  const [overtimeHours, setOvertimeHours] = useState("0");
  const [employeeLateHours, setEmployeeLateHours] = useState("0");
  const [holidayHours, setHolidayHours] = useState("0");
  const [ageBand, setAgeBand] = useState<AgeBand>("under40");
  const [socialPlan, setSocialPlan] = useState<SocialPlan>("company");
  const [employmentRate, setEmploymentRate] = useState<EmploymentRate>("general");
  const [dependents, setDependents] = useState("0");
  const [spouseDeduction, setSpouseDeduction] = useState<SpouseDeduction>("none");
  const [basicDeduction, setBasicDeduction] = useState<BasicDeduction>("normal");
  const [idecoAnnual, setIdecoAnnual] = useState("0");
  const [lifeInsuranceAnnual, setLifeInsuranceAnnual] = useState("0");
  const [earthquakeAnnual, setEarthquakeAnnual] = useState("0");
  const [otherDeductionAnnual, setOtherDeductionAnnual] = useState("0");
  const [residentTaxMode, setResidentTaxMode] = useState<ResidentTaxMode>("estimate");
  const [residentTaxManual, setResidentTaxManual] = useState("0");
  const [healthRate, setHealthRate] = useState("4.925");
  const [childSupportRate, setChildSupportRate] = useState("0.115");

  const partTime = useMemo(() => {
    if (partTimeScheduleMode === "weekly") {
      const rows = weeklyRows.map((row) => {
        const wage = toNumber(row.wage);
        const hours = toNumber(row.hours);
        const night = toNumber(row.lateNightHours);
        const nightWage = nightWageMode === "custom" ? toNumber(row.lateNightWage) : wage * 1.25;
        const gross = wage * Math.max(0, hours - night) + nightWage * night;
        return { ...row, gross, hours, night, nightWage, wage };
      });
      const monthlyGross = rows.reduce((sum, row) => sum + row.gross, 0);
      const totalHours = rows.reduce((sum, row) => sum + row.hours, 0);
      const maxWeeklyHours = Math.max(0, ...rows.map((row) => row.hours));
      return { monthlyGross, monthlyNet: monthlyGross, annualIncome: monthlyGross * 12, weeklyHours: maxWeeklyHours, totalHours, maxWeeklyHours, rows };
    }

    const wage = toNumber(hourlyWage);
    const hours = toNumber(weeklyHours);
    const weeks = toNumber(monthlyWeeks);
    const night = toNumber(lateNightHours);
    const nightWage = nightWageMode === "custom" ? toNumber(lateNightWage) : wage * 1.25;
    const weeklyGross = wage * Math.max(0, hours - night) + nightWage * night;
    const monthlyGross = weeklyGross * weeks;
    return {
      monthlyGross,
      monthlyNet: monthlyGross,
      annualIncome: monthlyGross * 12,
      weeklyHours: hours,
      totalHours: hours * weeks,
      maxWeeklyHours: hours,
      rows: [{ label: "固定排班", wage, hours, lateNightHours, lateNightWage, night, nightWage, gross: weeklyGross }],
    };
  }, [hourlyWage, lateNightHours, lateNightWage, monthlyWeeks, nightWageMode, partTimeScheduleMode, weeklyHours, weeklyRows]);

  const employee = useMemo<EmployeeResult>(() => {
    const base = toNumber(baseSalary);
    const commuteMonthly = toNumber(commute);
    const bonus = toNumber(bonusAnnual);
    const hours = Math.max(toNumber(scheduledHours), 1);
    const hourly = base / hours;
    const overtime = hourly * 1.25 * toNumber(overtimeHours);
    const latePremium = hourly * 0.25 * toNumber(employeeLateHours);
    const holidayPay = hourly * 1.35 * toNumber(holidayHours);
    const monthlyGross = base + commuteMonthly + overtime + latePremium + holidayPay;
    const annualGross = monthlyGross * 12 + bonus;
    const socialBase = monthlyGross;
    const health = socialPlan === "company" ? socialBase * (toNumber(healthRate) / 100) : 0;
    const childSupport = socialPlan === "company" ? socialBase * (toNumber(childSupportRate) / 100) : 0;
    const care = socialPlan === "company" && ageBand === "40to64" ? socialBase * 0.0081 : 0;
    const pension = socialPlan === "company" ? Math.min(socialBase, 650_000) * 0.0915 : 0;
    const employment = monthlyGross * employmentRates[employmentRate];
    const monthlySocial = health + childSupport + care + pension + employment;
    const annualSocial = monthlySocial * 12;
    const employmentDeduction = salaryIncomeDeduction(annualGross);
    const salaryIncome = Math.max(0, annualGross - employmentDeduction);
    const basic = basicDeduction === "normal" ? 480_000 : 0;
    const spouse = spouseDeduction === "deduction" ? 380_000 : 0;
    const dependentDeduction = Math.max(0, toNumber(dependents)) * 380_000;
    const annualDeductions =
      annualSocial +
      basic +
      spouse +
      dependentDeduction +
      toNumber(idecoAnnual) +
      toNumber(lifeInsuranceAnnual) +
      toNumber(earthquakeAnnual) +
      toNumber(otherDeductionAnnual);
    const taxableIncome = Math.max(0, salaryIncome - annualDeductions);
    const annualIncomeTax = nationalIncomeTax(taxableIncome) * 1.021;
    const monthlyIncomeTax = annualIncomeTax / 12;
    const residentTaxDeductions =
      annualSocial +
      430_000 +
      spouse +
      dependentDeduction +
      toNumber(idecoAnnual) +
      toNumber(lifeInsuranceAnnual) +
      toNumber(earthquakeAnnual) +
      toNumber(otherDeductionAnnual);
    const residentAnnual =
      residentTaxMode === "manual"
        ? toNumber(residentTaxManual) * 12
        : residentTaxMode === "none"
          ? 0
          : residentTaxEstimate(Math.max(0, salaryIncome - residentTaxDeductions));
    const monthlyResidentTax = residentAnnual / 12;
    const monthlyDeductions = monthlySocial + monthlyIncomeTax + monthlyResidentTax;
    const monthlyNet = monthlyGross - monthlyDeductions;

    return {
      annualDeductions,
      annualGross,
      annualIncomeTax,
      annualSocial,
      basic,
      care,
      childSupport,
      dependentDeduction,
      employment,
      employmentDeduction,
      health,
      holidayPay,
      latePremium,
      monthlyDeductions,
      monthlyGross,
      monthlyIncomeTax,
      monthlyNet,
      monthlyResidentTax,
      monthlySocial,
      overtime,
      pension,
      salaryIncome,
      socialBase,
      taxableIncome,
    };
  }, [ageBand, baseSalary, basicDeduction, bonusAnnual, childSupportRate, commute, dependents, earthquakeAnnual, employeeLateHours, employmentRate, healthRate, holidayHours, idecoAnnual, lifeInsuranceAnnual, otherDeductionAnnual, overtimeHours, residentTaxManual, residentTaxMode, scheduledHours, socialPlan, spouseDeduction]);

  const source = mode === "partTime" ? partTime : employee;
  const isOverLimit = isStudent && mode === "partTime" && partTime.weeklyHours > 28;

  const saveResult = () => {
    window.localStorage.setItem(
      salaryStorageKey,
      JSON.stringify({
        mode,
        monthlyGross: source.monthlyGross,
        monthlyNet: source.monthlyNet,
        savedAt: new Date().toISOString(),
      }),
    );
    setSaved(labels.saved);
  };

  const copyResult = async () => {
    const text =
      mode === "employee"
        ? `${labels.employeeMode}\n${labels.monthlyNet}: ${yen(employee.monthlyNet)}\n${labels.monthlyDeductions}: ${yen(employee.monthlyDeductions)}\n健康保险: ${yen(employee.health)}\n子ども・子育て支援金: ${yen(employee.childSupport)}\n介護保険: ${yen(employee.care)}\n厚生年金: ${yen(employee.pension)}\n雇用保険: ${yen(employee.employment)}\n所得税: ${yen(employee.monthlyIncomeTax)}\n住民税: ${yen(employee.monthlyResidentTax)}`
        : `${labels.partTimeMode}\n${partTimeScheduleMode === "weekly" ? labels.weekly : labels.fixed}\n${labels.monthlyIncome}: ${yen(partTime.monthlyGross)}\n${labels.monthlyTotalHours}: ${partTime.totalHours}h\n${labels.maxWeek}: ${partTime.maxWeeklyHours}h`;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <main className="min-h-screen bg-[#f5f0e7] text-stone-950">
      <div className="mx-auto min-h-screen max-w-[430px] bg-[#fbf8f2] px-4 pb-8 pt-4 shadow-2xl shadow-stone-300/40">
        <div className="mb-4 flex items-center justify-between">
          <BackButton />
          <span className="rounded-full bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-800">Japan Life</span>
        </div>

        <section className="rounded-[24px] bg-emerald-800 p-5 text-white shadow-[0_16px_35px_rgba(20,108,92,0.22)]">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/85 text-[#2563EB] shadow-sm">
              <BriefcaseBusiness className="h-5 w-5" />
            </span>
            <h1 className="text-2xl font-black">{t.salary.title}</h1>
          </div>
          <p className="mt-2 text-xs font-bold leading-5 text-emerald-50">
            {labels.desc}
          </p>
        </section>

        <div className="my-4 grid grid-cols-2 rounded-2xl bg-stone-100 p-1">
          <button className={`rounded-xl px-3 py-2 text-xs font-black ${mode === "partTime" ? "bg-white text-emerald-800 shadow-sm" : "text-stone-500"}`} onClick={() => setMode("partTime")} type="button">
            {labels.partTimeMode}
          </button>
          <button className={`rounded-xl px-3 py-2 text-xs font-black ${mode === "employee" ? "bg-white text-emerald-800 shadow-sm" : "text-stone-500"}`} onClick={() => setMode("employee")} type="button">
            {labels.employeeMode}
          </button>
        </div>

        {saved && <p className="mb-3 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-800">{saved}</p>}

        {mode === "partTime" ? (
          <PartTimePanel
            hourlyWage={hourlyWage}
            isOverLimit={isOverLimit}
            isStudent={isStudent}
            lateNightHours={lateNightHours}
            lateNightWage={lateNightWage}
            monthlyWeeks={monthlyWeeks}
            nightWageMode={nightWageMode}
            partTime={partTime}
            partTimeScheduleMode={partTimeScheduleMode}
            saveResult={saveResult}
            setHourlyWage={setHourlyWage}
            setIsStudent={setIsStudent}
            setLateNightHours={setLateNightHours}
            setLateNightWage={setLateNightWage}
            setMonthlyWeeks={setMonthlyWeeks}
            setNightWageMode={setNightWageMode}
            setPartTimeScheduleMode={setPartTimeScheduleMode}
            setWeeklyHours={setWeeklyHours}
            setWeeklyRows={setWeeklyRows}
            weeklyHours={weeklyHours}
            weeklyRows={weeklyRows}
            labels={labels}
          />
        ) : (
          <EmployeePanel
            ageBand={ageBand}
            baseSalary={baseSalary}
            basicDeduction={basicDeduction}
            bonusAnnual={bonusAnnual}
            childSupportRate={childSupportRate}
            commute={commute}
            copied={copied}
            copyResult={copyResult}
            dependents={dependents}
            employee={employee}
            employeeLateHours={employeeLateHours}
            employmentRate={employmentRate}
            healthRate={healthRate}
            holidayHours={holidayHours}
            idecoAnnual={idecoAnnual}
            lifeInsuranceAnnual={lifeInsuranceAnnual}
            earthquakeAnnual={earthquakeAnnual}
            otherDeductionAnnual={otherDeductionAnnual}
            overtimeHours={overtimeHours}
            residentTaxManual={residentTaxManual}
            residentTaxMode={residentTaxMode}
            saveResult={saveResult}
            scheduledHours={scheduledHours}
            setAgeBand={setAgeBand}
            setBaseSalary={setBaseSalary}
            setBasicDeduction={setBasicDeduction}
            setBonusAnnual={setBonusAnnual}
            setChildSupportRate={setChildSupportRate}
            setCommute={setCommute}
            setDependents={setDependents}
            setEmployeeLateHours={setEmployeeLateHours}
            setEmploymentRate={setEmploymentRate}
            setHealthRate={setHealthRate}
            setHolidayHours={setHolidayHours}
            setIdecoAnnual={setIdecoAnnual}
            setLifeInsuranceAnnual={setLifeInsuranceAnnual}
            setEarthquakeAnnual={setEarthquakeAnnual}
            setOtherDeductionAnnual={setOtherDeductionAnnual}
            setOvertimeHours={setOvertimeHours}
            setResidentTaxManual={setResidentTaxManual}
            setResidentTaxMode={setResidentTaxMode}
            setScheduledHours={setScheduledHours}
            setSocialPlan={setSocialPlan}
            setSpouseDeduction={setSpouseDeduction}
            socialPlan={socialPlan}
            spouseDeduction={spouseDeduction}
            labels={labels}
          />
        )}
      </div>
    </main>
  );
}

function PartTimePanel(props: {
  hourlyWage: string;
  isOverLimit: boolean;
  isStudent: boolean;
  lateNightHours: string;
  lateNightWage: string;
  monthlyWeeks: string;
  nightWageMode: NightWageMode;
  partTime: {
    annualIncome: number;
    maxWeeklyHours: number;
    monthlyGross: number;
    monthlyNet: number;
    rows: Array<{ gross: number; hours: number; label: string; lateNightHours: string; lateNightWage: string; night: number; nightWage: number; wage: number }>;
    totalHours: number;
    weeklyHours: number;
  };
  partTimeScheduleMode: PartTimeScheduleMode;
  saveResult: () => void;
  setHourlyWage: (value: string) => void;
  setIsStudent: (value: boolean) => void;
  setLateNightHours: (value: string) => void;
  setLateNightWage: (value: string) => void;
  setMonthlyWeeks: (value: string) => void;
  setNightWageMode: (value: NightWageMode) => void;
  setPartTimeScheduleMode: (value: PartTimeScheduleMode) => void;
  setWeeklyHours: (value: string) => void;
  setWeeklyRows: (value: WeeklyPartTimeRow[]) => void;
  weeklyHours: string;
  weeklyRows: WeeklyPartTimeRow[];
  labels: SalaryText;
}) {
  const updateWeeklyRow = (index: number, key: keyof Omit<WeeklyPartTimeRow, "label">, value: string) => {
    props.setWeeklyRows(props.weeklyRows.map((row, rowIndex) => (rowIndex === index ? { ...row, [key]: value } : row)));
  };

  return (
    <section className="grid gap-4">
      <Card title={props.labels.partBasic}>
        <div className="mb-3 grid grid-cols-2 rounded-xl bg-stone-100 p-1">
          <button className={`rounded-lg px-2 py-1.5 text-xs font-black ${props.partTimeScheduleMode === "fixed" ? "bg-white text-emerald-800 shadow-sm" : "text-stone-500"}`} onClick={() => props.setPartTimeScheduleMode("fixed")} type="button">
            {props.labels.fixed}
          </button>
          <button className={`rounded-lg px-2 py-1.5 text-xs font-black ${props.partTimeScheduleMode === "weekly" ? "bg-white text-emerald-800 shadow-sm" : "text-stone-500"}`} onClick={() => props.setPartTimeScheduleMode("weekly")} type="button">
            {props.labels.weekly}
          </button>
        </div>

        {props.partTimeScheduleMode === "fixed" ? (
          <div className="grid gap-2">
            <Field label={props.labels.hourly} value={props.hourlyWage} onChange={props.setHourlyWage} suffix="JPY" />
            <Field label={props.labels.weeklyHours} value={props.weeklyHours} onChange={props.setWeeklyHours} suffix="h" />
            <Field label={props.labels.monthlyWeeks} value={props.monthlyWeeks} onChange={props.setMonthlyWeeks} />
            <Field label={props.labels.lateNightWeekly} value={props.lateNightHours} onChange={props.setLateNightHours} suffix="h" />
            {props.nightWageMode === "custom" && <Field label={props.labels.lateNightWage} value={props.lateNightWage} onChange={props.setLateNightWage} suffix="JPY" />}
          </div>
        ) : (
          <div className="grid gap-2">
            <p className="text-xs font-bold leading-5 text-stone-500">{props.labels.weeklyHelp}</p>
            {props.weeklyRows.map((row, index) => (
              <div className="rounded-2xl bg-stone-50 p-3" key={row.label}>
                <p className="mb-2 text-xs font-black text-emerald-800">{row.label}</p>
                <div className="grid grid-cols-1 gap-2 min-[390px]:grid-cols-3">
                  <Field label={props.labels.hourly} value={row.wage} onChange={(value) => updateWeeklyRow(index, "wage", value)} suffix="JPY" />
                  <Field label={props.labels.workHours} value={row.hours} onChange={(value) => updateWeeklyRow(index, "hours", value)} suffix="h" />
                  <Field label={props.labels.lateNight} value={row.lateNightHours} onChange={(value) => updateWeeklyRow(index, "lateNightHours", value)} suffix="h" />
                  {props.nightWageMode === "custom" && <Field label={props.labels.lateNightWage} value={row.lateNightWage} onChange={(value) => updateWeeklyRow(index, "lateNightWage", value)} suffix="JPY" />}
                </div>
                <p className="mt-2 text-right text-xs font-black text-stone-500">{props.labels.lateNightWage}: {yen(props.partTime.rows[index]?.nightWage ?? 0)} / {props.labels.thisWeek}: {yen(props.partTime.rows[index]?.gross ?? 0)}</p>
              </div>
            ))}
          </div>
        )}

        <div className="mt-3 rounded-2xl bg-emerald-50 p-3">
          <p className="mb-2 text-xs font-black text-emerald-900">{props.labels.nightSetting}</p>
          <div className="grid grid-cols-2 rounded-xl bg-white p-1">
            <button className={`rounded-lg px-2 py-1.5 text-xs font-black ${props.nightWageMode === "premium" ? "bg-emerald-800 text-white shadow-sm" : "text-stone-500"}`} onClick={() => props.setNightWageMode("premium")} type="button">
              {props.labels.autoPremium}
            </button>
            <button className={`rounded-lg px-2 py-1.5 text-xs font-black ${props.nightWageMode === "custom" ? "bg-emerald-800 text-white shadow-sm" : "text-stone-500"}`} onClick={() => props.setNightWageMode("custom")} type="button">
              {props.labels.custom}
            </button>
          </div>
          <p className="mt-2 text-[11px] font-bold leading-5 text-emerald-900/75">{props.labels.nightHelp}</p>
        </div>

        <div className="mt-3">
          <p className="mb-1 text-xs font-black text-stone-600">{props.labels.studentCheck}</p>
          <div className="grid grid-cols-2 rounded-xl bg-stone-100 p-1">
            <button className={`rounded-lg px-2 py-1.5 text-xs font-black ${props.isStudent ? "bg-white text-emerald-800 shadow-sm" : "text-stone-500"}`} onClick={() => props.setIsStudent(true)} type="button">
              {props.labels.on}
            </button>
            <button className={`rounded-lg px-2 py-1.5 text-xs font-black ${!props.isStudent ? "bg-white text-emerald-800 shadow-sm" : "text-stone-500"}`} onClick={() => props.setIsStudent(false)} type="button">
              {props.labels.off}
            </button>
          </div>
        </div>
      </Card>

      <div className="grid gap-3">
        <div className="grid grid-cols-1 gap-2 min-[360px]:grid-cols-2">
          <Stat title={props.labels.monthlyIncome} value={yen(props.partTime.monthlyGross)} />
          <Stat title={props.labels.annualIncome} value={yen(props.partTime.annualIncome)} />
          <Stat title={props.partTimeScheduleMode === "weekly" ? props.labels.monthlyTotalHours : props.labels.thisWeek} value={`${props.partTimeScheduleMode === "weekly" ? props.partTime.totalHours : props.partTime.weeklyHours}h`} />
          <Stat title={props.labels.maxWeek} value={`${props.partTime.maxWeeklyHours}h`} />
          <Stat title={props.labels.netEstimate} value={yen(props.partTime.monthlyNet)} />
        </div>
        {props.isOverLimit ? <Message danger text="最高单周已超过留学生 28 小时限制，请调整排班。" /> : <Message text={props.isStudent ? "未超过 28 小时限制。" : "未开启留学生 28 小时检查。"} />}
        <ActionButton onClick={props.saveResult} icon={Save} label={props.labels.saveHome} />
      </div>
    </section>
  );
}

function EmployeePanel(props: {
  ageBand: AgeBand;
  baseSalary: string;
  basicDeduction: BasicDeduction;
  bonusAnnual: string;
  childSupportRate: string;
  commute: string;
  copied: boolean;
  copyResult: () => void;
  dependents: string;
  employee: EmployeeResult;
  employeeLateHours: string;
  employmentRate: EmploymentRate;
  earthquakeAnnual: string;
  healthRate: string;
  holidayHours: string;
  idecoAnnual: string;
  lifeInsuranceAnnual: string;
  otherDeductionAnnual: string;
  overtimeHours: string;
  residentTaxManual: string;
  residentTaxMode: ResidentTaxMode;
  saveResult: () => void;
  scheduledHours: string;
  setAgeBand: (value: AgeBand) => void;
  setBaseSalary: (value: string) => void;
  setBasicDeduction: (value: BasicDeduction) => void;
  setBonusAnnual: (value: string) => void;
  setChildSupportRate: (value: string) => void;
  setCommute: (value: string) => void;
  setDependents: (value: string) => void;
  setEmployeeLateHours: (value: string) => void;
  setEmploymentRate: (value: EmploymentRate) => void;
  setEarthquakeAnnual: (value: string) => void;
  setHealthRate: (value: string) => void;
  setHolidayHours: (value: string) => void;
  setIdecoAnnual: (value: string) => void;
  setLifeInsuranceAnnual: (value: string) => void;
  setOtherDeductionAnnual: (value: string) => void;
  setOvertimeHours: (value: string) => void;
  setResidentTaxManual: (value: string) => void;
  setResidentTaxMode: (value: ResidentTaxMode) => void;
  setScheduledHours: (value: string) => void;
  setSocialPlan: (value: SocialPlan) => void;
  setSpouseDeduction: (value: SpouseDeduction) => void;
  socialPlan: SocialPlan;
  spouseDeduction: SpouseDeduction;
  labels: SalaryText;
}) {
  const deductionRows = [
    {
      label: props.labels.healthInsurance,
      value: props.employee.health,
      note: `${props.labels.deductions.health} (${yen(props.employee.socialBase)} × ${props.healthRate}%)`,
    },
    {
      label: "子ども・子育て支援金",
      value: props.employee.childSupport,
      note: `${props.labels.deductions.child} (${props.childSupportRate}%)`,
    },
    {
      label: props.labels.careInsurance,
      value: props.employee.care,
      note: props.ageBand === "40to64" ? props.labels.deductions.care40 : props.labels.deductions.careOther,
    },
    {
      label: props.labels.pension,
      value: props.employee.pension,
      note: props.labels.deductions.pension,
    },
    {
      label: props.labels.employmentInsurance,
      value: props.employee.employment,
      note: `${props.labels.deductions.employment} (${(employmentRates[props.employmentRate] * 100).toFixed(2)}%)`,
    },
    {
      label: props.labels.incomeTax,
      value: props.employee.monthlyIncomeTax,
      note: `${props.labels.deductions.incomeTax} (${yen(props.employee.annualGross)} - ${yen(props.employee.employmentDeduction)} - ${yen(props.employee.annualDeductions)})`,
    },
    {
      label: props.labels.residentTax,
      value: props.employee.monthlyResidentTax,
      note: props.residentTaxMode === "manual" ? props.labels.deductions.residentManual : props.residentTaxMode === "none" ? props.labels.deductions.residentNone : props.labels.deductions.residentEstimate,
    },
  ];

  return (
    <section className="grid gap-4">
      <div className="grid gap-3">
        <Card title={props.labels.basicInfo}>
          <div className="grid grid-cols-1 gap-2 min-[360px]:grid-cols-2">
            <IconField icon={JapaneseYen} label={props.labels.monthlyBase} value={props.baseSalary} onChange={props.setBaseSalary} />
            <SelectField label={props.labels.age} value={props.ageBand} onChange={(value) => props.setAgeBand(value as AgeBand)} options={[["under40", props.labels.under40], ["40to64", props.labels.age40to64], ["65plus", props.labels.age65plus]]} />
            <SelectField label={props.labels.socialPlan} value={props.socialPlan} onChange={(value) => props.setSocialPlan(value as SocialPlan)} options={[["company", props.labels.companySocial], ["none", props.labels.noSocial]]} />
            <SelectField label={props.labels.employmentInsurance} value={props.employmentRate} onChange={(value) => props.setEmploymentRate(value as EmploymentRate)} options={[["general", props.labels.generalBiz], ["agriculture", props.labels.agriculture], ["construction", props.labels.construction], ["none", props.labels.none]]} />
            <Field label={props.labels.dependents} value={props.dependents} onChange={props.setDependents} />
            <SelectField label={props.labels.spouse} value={props.spouseDeduction} onChange={(value) => props.setSpouseDeduction(value as SpouseDeduction)} options={[["none", props.labels.none], ["deduction", props.labels.has]]} />
          </div>
        </Card>

        <details className="rounded-[20px] border border-stone-200 bg-white p-3 shadow-sm">
          <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-black">
            {props.labels.moreOptions}
            <ChevronDown className="h-4 w-4" />
          </summary>
          <div className="mt-3 grid grid-cols-1 gap-2 min-[360px]:grid-cols-2">
            <Field label={props.labels.commute} value={props.commute} onChange={props.setCommute} />
            <Field label={props.labels.bonus} value={props.bonusAnnual} onChange={props.setBonusAnnual} />
            <Field label={props.labels.scheduledHours} value={props.scheduledHours} onChange={props.setScheduledHours} suffix="h" />
            <Field label={props.labels.overtime} value={props.overtimeHours} onChange={props.setOvertimeHours} suffix="h" />
            <Field label={props.labels.employeeLate} value={props.employeeLateHours} onChange={props.setEmployeeLateHours} suffix="h" />
            <Field label={props.labels.holidayHours} value={props.holidayHours} onChange={props.setHolidayHours} suffix="h" />
            <SelectField label={props.labels.basicDeduction} value={props.basicDeduction} onChange={(value) => props.setBasicDeduction(value as BasicDeduction)} options={[["normal", props.labels.basicNormal], ["none", props.labels.none]]} />
            <Field label={props.labels.ideco} value={props.idecoAnnual} onChange={props.setIdecoAnnual} />
            <Field label={props.labels.lifeInsurance} value={props.lifeInsuranceAnnual} onChange={props.setLifeInsuranceAnnual} />
            <Field label={props.labels.earthquake} value={props.earthquakeAnnual} onChange={props.setEarthquakeAnnual} />
            <Field label={props.labels.otherDeduction} value={props.otherDeductionAnnual} onChange={props.setOtherDeductionAnnual} />
            <Field label={props.labels.healthRate} value={props.healthRate} onChange={props.setHealthRate} />
            <Field label={props.labels.childRate} value={props.childSupportRate} onChange={props.setChildSupportRate} />
            <SelectField label={props.labels.residentTax} value={props.residentTaxMode} onChange={(value) => props.setResidentTaxMode(value as ResidentTaxMode)} options={[["estimate", props.labels.residentEstimate], ["manual", props.labels.residentManual], ["none", props.labels.residentNone]]} />
            <Field label={props.labels.residentManualMonthly} value={props.residentTaxManual} onChange={props.setResidentTaxManual} />
          </div>
        </details>
      </div>

      <div className="grid gap-3">
        <Card title={props.labels.monthlyResult}>
          <div className="grid grid-cols-1 gap-2 min-[360px]:grid-cols-2">
            <Stat title={props.labels.monthlyNet} value={yen(props.employee.monthlyNet)} highlight />
            <Stat title={props.labels.monthlyDeductions} value={yen(props.employee.monthlyDeductions)} />
            <Stat title={props.labels.annualNet} value={yen(props.employee.monthlyNet * 12)} />
            <Stat title={props.labels.annualGross} value={yen(props.employee.annualGross)} />
          </div>
          <div className="mt-3 grid grid-cols-1 gap-2 min-[360px]:grid-cols-2">
            <MiniStat title={props.labels.monthlySocial} value={yen(props.employee.monthlySocial)} />
            <MiniStat title={props.labels.childMonthly} value={yen(props.employee.childSupport)} />
            <MiniStat title={props.labels.annualDeductions} value={yen(props.employee.annualDeductions)} />
            <MiniStat title={props.labels.taxable} value={yen(props.employee.taxableIncome)} />
          </div>
        </Card>

        <Card title={props.labels.why}>
          <div className="divide-y divide-stone-100">
            {deductionRows.map((row) => (
              <div className="py-2.5" key={row.label}>
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-black">{row.label}</p>
                  <p className="shrink-0 text-sm font-black">{yen(row.value)}</p>
                </div>
                <p className="mt-1 text-xs font-bold leading-5 text-stone-500">{row.note}</p>
              </div>
            ))}
          </div>
        </Card>

        <Message text={props.labels.estimateWarning} />

        <div className="grid grid-cols-1 gap-2 min-[360px]:grid-cols-2">
          <ActionButton onClick={props.saveResult} icon={Save} label={props.labels.saveHome} />
          <ActionButton onClick={props.copyResult} icon={Copy} label={props.copied ? "已复制" : props.labels.copyDetail} variant="light" />
        </div>
      </div>
    </section>
  );
}

function Card({ children, title }: { children: ReactNode; title: string }) {
  return (
    <section className="rounded-[20px] border border-stone-200 bg-white p-3 shadow-sm">
      <h2 className="mb-3 text-sm font-black text-stone-900">{title}</h2>
      {children}
    </section>
  );
}

function Field({ label, onChange, suffix, value }: { label: string; onChange: (value: string) => void; suffix?: string; value: string }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-black text-stone-600">{label}</span>
      <span className="flex h-9 items-center rounded-xl border border-stone-200 bg-stone-50 px-2.5">
        <input className="min-w-0 flex-1 bg-transparent text-sm font-black outline-none" inputMode="decimal" onChange={(event) => onChange(event.target.value)} type="number" value={value} />
        {suffix ? <span className="ml-1.5 text-[11px] font-black text-stone-500">{suffix}</span> : null}
      </span>
    </label>
  );
}

function IconField({ icon: Icon, label, onChange, value }: { icon: LucideIcon; label: string; onChange: (value: string) => void; value: string }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-black text-stone-600">{label}</span>
      <span className="flex h-9 items-center gap-2 rounded-xl border border-stone-200 bg-stone-50 px-2.5">
        <Icon className="h-4 w-4 shrink-0 text-emerald-700" />
        <input className="min-w-0 flex-1 bg-transparent text-sm font-black outline-none" inputMode="decimal" onChange={(event) => onChange(event.target.value)} type="number" value={value} />
      </span>
    </label>
  );
}

function SelectField({ label, onChange, options, value }: { label: string; onChange: (value: string) => void; options: [string, string][]; value: string }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-black text-stone-600">{label}</span>
      <select className="h-9 w-full rounded-xl border border-stone-200 bg-stone-50 px-2.5 text-xs font-black outline-none" onChange={(event) => onChange(event.target.value)} value={value}>
        {options.map(([optionValue, labelText]) => (
          <option key={optionValue} value={optionValue}>
            {labelText}
          </option>
        ))}
      </select>
    </label>
  );
}

function Stat({ highlight, title, value }: { highlight?: boolean; title: string; value: string }) {
  return (
    <div className="rounded-[16px] border border-stone-200 bg-white p-3 shadow-sm">
      <p className="text-[11px] font-black text-stone-500">{title}</p>
      <p className={`mt-1 text-lg font-black ${highlight ? "text-emerald-800" : "text-stone-950"}`}>{value}</p>
    </div>
  );
}

function MiniStat({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl bg-stone-50 p-3">
      <p className="text-[11px] font-black text-stone-500">{title}</p>
      <p className="mt-1 text-sm font-black">{value}</p>
    </div>
  );
}

function Message({ danger, text }: { danger?: boolean; text: string }) {
  const Icon = danger ? AlertTriangle : CheckCircle2;
  return (
    <div className={`rounded-[18px] border p-3 text-sm font-bold ${danger ? "border-red-100 bg-red-50 text-red-700" : "border-emerald-100 bg-emerald-50 text-emerald-800"}`}>
      <div className="flex items-start gap-2">
        <Icon className="mt-0.5 h-4 w-4 shrink-0" />
        {text}
      </div>
    </div>
  );
}

function ActionButton({ icon: Icon, label, onClick, variant = "solid" }: { icon: LucideIcon; label: string; onClick: () => void; variant?: "solid" | "light" }) {
  return (
    <button
      className={`inline-flex h-11 items-center justify-center gap-2 rounded-2xl px-3 text-xs font-black ${
        variant === "solid" ? "bg-emerald-800 text-white shadow-sm" : "border border-emerald-200 bg-white text-emerald-800"
      }`}
      onClick={onClick}
      type="button"
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}
