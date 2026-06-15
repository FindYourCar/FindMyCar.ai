/* eslint-disable no-restricted-globals */

// Service worker for My Dashboard.
// Enables the app to be installed as a PWA and lets notifications
// (including ones triggered while the app is in the background or
// the browser is closed on mobile, via push) be displayed.

const CACHE_NAME = "my-dashboard-v1";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// Show a notification when a push message is received from a push service.
self.addEventListener("push", (event) => {
  let title = "My Dashboard";
  let body = "You have a new update.";

  if (event.data) {
    try {
      const data = event.data.json();
      title = data.title || title;
      body = data.body || body;
    } catch {
      body = event.data.text() || body;
    }
  }

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: "/icon.svg",
      badge: "/icon.svg",
    })
  );
});

// Allow the page to ask the service worker to display a notification
// directly (used by the in-app scheduler so alerts can still show up
// even when the dashboard tab isn't focused).
self.addEventListener("message", (event) => {
  const data = event.data;
  if (data && data.type === "SHOW_NOTIFICATION") {
    const title = data.title || "My Dashboard";
    const options = {
      body: data.body || "",
      icon: "/icon.svg",
      badge: "/icon.svg",
    };
    event.waitUntil(self.registration.showNotification(title, options));
  }
});

// Focus or open the dashboard when a notification is tapped.
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ("focus" in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow("/");
    })
  );
});
