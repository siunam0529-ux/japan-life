self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const categoryUrls = {
    garbage: "/tools/holidays",
    monthlyPayment: "/reminders",
    holiday: "/tools/holidays",
    residenceCard: "/reminders",
  };

  const dataUrl = event.notification.data && event.notification.data.url;
  const categoryUrl = event.notification.data && categoryUrls[event.notification.data.category];
  const targetUrl = dataUrl || categoryUrl || "/";
  const absoluteUrl = new URL(targetUrl, self.location.origin).href;

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === absoluteUrl && "focus" in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(absoluteUrl);
      }
      return undefined;
    }),
  );
});
