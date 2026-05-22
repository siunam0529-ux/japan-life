export type JapanLifeUserData = {
  app: "Japan Life";
  schemaVersion: number;
  exportedAt?: string;
  userProfile: {
    areaId: string | null;
    language: string;
  };
  settings: {
    notificationSettings: unknown;
    calendarDisplaySettings: unknown;
  };
  calendar: {
    notes: unknown[];
    monthlyReminders: unknown[];
    garbageSchedule?: unknown;
  };
  reminders: {
    statuses: Record<string, unknown>;
  };
};
