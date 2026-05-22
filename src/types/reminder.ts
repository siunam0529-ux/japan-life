export type ReminderType = "garbage" | "monthlyPayment" | "holiday" | "residenceCard" | "custom";

export type ReminderStatus = "active" | "done" | "dismissed";

export type ReminderItem = {
  id: string;
  title: string;
  description?: string;
  date: string;
  time?: string;
  type: ReminderType;
  status: ReminderStatus;
  source: "auto" | "user";
  priority: "low" | "normal" | "high";
  targetUrl?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type ReminderStatusStore = Record<string, { status: Exclude<ReminderStatus, "active">; updatedAt: string }>;
