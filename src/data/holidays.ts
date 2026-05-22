export type HolidayItem = {
  id: string;
  date: string;
  title: string;
  titleJa: string;
  type: "national" | "vacation" | "event" | "exam";
  updatedAt: string;
};

export const holidayItems: HolidayItem[] = [
  { id: "new-year", date: "2026-01-01", title: "元日", titleJa: "元日", type: "national", updatedAt: "2026-05-21" },
  { id: "coming-age", date: "2026-01-12", title: "成人の日", titleJa: "成人の日", type: "national", updatedAt: "2026-05-21" },
  { id: "foundation", date: "2026-02-11", title: "建国記念の日", titleJa: "建国記念の日", type: "national", updatedAt: "2026-05-21" },
  { id: "emperor", date: "2026-02-23", title: "天皇誕生日", titleJa: "天皇誕生日", type: "national", updatedAt: "2026-05-21" },
  { id: "spring", date: "2026-03-20", title: "春分の日", titleJa: "春分の日", type: "national", updatedAt: "2026-05-21" },
  { id: "showa", date: "2026-04-29", title: "昭和の日", titleJa: "昭和の日", type: "national", updatedAt: "2026-05-21" },
  { id: "constitution", date: "2026-05-03", title: "憲法記念日", titleJa: "憲法記念日", type: "national", updatedAt: "2026-05-21" },
  { id: "greenery", date: "2026-05-04", title: "みどりの日", titleJa: "みどりの日", type: "national", updatedAt: "2026-05-21" },
  { id: "children", date: "2026-05-05", title: "こどもの日", titleJa: "こどもの日", type: "national", updatedAt: "2026-05-21" },
  { id: "observed-may", date: "2026-05-06", title: "振替休日", titleJa: "振替休日", type: "national", updatedAt: "2026-05-21" },
  { id: "marine", date: "2026-07-20", title: "海の日", titleJa: "海の日", type: "national", updatedAt: "2026-05-21" },
  { id: "mountain", date: "2026-08-11", title: "山の日", titleJa: "山の日", type: "national", updatedAt: "2026-05-21" },
  { id: "respect-aged", date: "2026-09-21", title: "敬老の日", titleJa: "敬老の日", type: "national", updatedAt: "2026-05-21" },
  { id: "citizen-holiday", date: "2026-09-22", title: "国民の休日", titleJa: "国民の休日", type: "national", updatedAt: "2026-05-21" },
  { id: "autumn", date: "2026-09-23", title: "秋分の日", titleJa: "秋分の日", type: "national", updatedAt: "2026-05-21" },
  { id: "sports", date: "2026-10-12", title: "スポーツの日", titleJa: "スポーツの日", type: "national", updatedAt: "2026-05-21" },
  { id: "culture", date: "2026-11-03", title: "文化の日", titleJa: "文化の日", type: "national", updatedAt: "2026-05-21" },
  { id: "labor", date: "2026-11-23", title: "勤労感謝の日", titleJa: "勤労感謝の日", type: "national", updatedAt: "2026-05-21" },
];
