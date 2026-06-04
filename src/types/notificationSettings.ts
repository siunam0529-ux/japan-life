export type NotificationCategory =
  | "garbage"
  | "monthlyPayment"
  | "holiday"
  | "residenceCard"
  | "weather"
  | "rail"
  | "salaryTax"
  | "rent"
  | "calendarNote"
  | "shopClaim";

export type ReminderTiming = {
  enabled: boolean;
  daysBefore: number;
  endTime?: string;
  startTime?: string;
  time: string;
};

export type NotificationSettings = {
  enabled: boolean;
  categories: Record<NotificationCategory, boolean>;
  timings: Record<NotificationCategory, ReminderTiming>;
};
