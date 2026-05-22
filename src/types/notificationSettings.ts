export type NotificationCategory = "garbage" | "monthlyPayment" | "holiday" | "residenceCard";

export type ReminderTiming = {
  enabled: boolean;
  daysBefore: number;
  time: string;
};

export type NotificationSettings = {
  enabled: boolean;
  categories: {
    garbage: boolean;
    monthlyPayment: boolean;
    holiday: boolean;
    residenceCard: boolean;
  };
  timings: {
    garbage: ReminderTiming;
    monthlyPayment: ReminderTiming;
    holiday: ReminderTiming;
    residenceCard: ReminderTiming;
  };
};
