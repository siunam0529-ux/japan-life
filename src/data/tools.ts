import { BadgePercent, Calculator, CalendarDays, Clock3, FileClock, GitCompare, Home, RefreshCw, SearchCheck, WalletCards } from "lucide-react";

export const dashboardTools = [
  { key: "salary", icon: Calculator, href: "/tools/salary" },
  { key: "rent", icon: Home, href: "/tools/rent" },
  { key: "exchange", icon: RefreshCw, href: "/tools/exchange" },
  { key: "holidays", icon: CalendarDays, href: "/tools/holidays" },
  { key: "workHours", icon: Clock3, href: "/tools/work-hours" },
  { key: "livingCost", icon: WalletCards, href: "/tools/living-cost" },
  { key: "visaReminder", icon: FileClock, href: "/tools/visa-reminder" },
  { key: "areaCompare", icon: GitCompare, href: "/tools/area-compare" },
  { key: "resources", icon: SearchCheck, href: "/resources" },
  { key: "deals", icon: BadgePercent, href: "/deals" },
] as const;
