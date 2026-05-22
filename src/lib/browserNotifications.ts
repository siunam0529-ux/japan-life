type BrowserNotificationOptions = {
  body?: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: {
    url?: string;
    [key: string]: unknown;
  };
  requireInteraction?: boolean;
};

export function isNotificationSupported() {
  return typeof window !== "undefined" && "Notification" in window;
}

export function getNotificationPermission(): NotificationPermission | "unsupported" {
  if (!isNotificationSupported()) return "unsupported";
  return Notification.permission;
}

export async function requestNotificationPermission(): Promise<NotificationPermission | "unsupported"> {
  if (!isNotificationSupported()) return "unsupported";
  return Notification.requestPermission();
}

export async function registerServiceWorker() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return null;
  try {
    return await navigator.serviceWorker.register("/sw.js");
  } catch {
    return null;
  }
}

export async function showBrowserNotification(title: string, options: BrowserNotificationOptions = {}) {
  if (!isNotificationSupported() || Notification.permission !== "granted") return false;

  const payload: NotificationOptions = {
    body: options.body,
    icon: options.icon ?? "/icon-192.png",
    badge: options.badge ?? "/icon-192.png",
    tag: options.tag,
    data: options.data,
    requireInteraction: options.requireInteraction,
  };

  const registration = await registerServiceWorker();
  if (registration?.showNotification) {
    await registration.showNotification(title, payload);
    return true;
  }

  const notification = new Notification(title, payload);
  notification.onclick = () => {
    const url = options.data?.url;
    if (url) window.location.href = url;
  };
  return true;
}
