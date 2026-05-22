import type { NotificationCategory, NotificationSettings } from "@/types/notificationSettings";

export function getNotificationDate(targetDate: Date, settings: NotificationSettings, category: NotificationCategory) {
  const timing = settings.timings[category];
  const [hour = 9, minute = 0] = timing.time.split(":").map(Number);
  const notificationDate = new Date(targetDate);
  notificationDate.setDate(notificationDate.getDate() - timing.daysBefore);
  notificationDate.setHours(hour, minute, 0, 0);
  return notificationDate;
}

export function shouldNotifyOnDate(currentDate: Date, targetDate: Date, settings: NotificationSettings, category: NotificationCategory) {
  if (!settings.enabled) return false;
  if (!settings.categories[category]) return false;
  const timing = settings.timings[category];
  if (!timing.enabled) return false;

  const notificationDate = getNotificationDate(targetDate, settings, category);
  return isSameMinute(currentDate, notificationDate);
}

function isSameMinute(left: Date, right: Date) {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate() &&
    left.getHours() === right.getHours() &&
    left.getMinutes() === right.getMinutes()
  );
}
