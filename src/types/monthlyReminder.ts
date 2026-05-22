export type MonthlyReminderCategory = "rent" | "phone" | "card" | "insurance" | "utility" | "other";

export type MonthlyReminder = {
  id: string;
  title: string;
  day: number;
  category: MonthlyReminderCategory;
  amount?: number;
  note?: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
};

export type MonthlyReminderInput = Omit<MonthlyReminder, "id" | "createdAt" | "updatedAt"> & {
  id?: string;
  createdAt?: string;
};
