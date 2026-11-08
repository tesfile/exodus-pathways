"use client";

import { useEffect } from "react";

export function PwaRegistration() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    // Never use the offline fallback during local development. A stale service
    // worker can hide Next.js errors and make localhost appear disconnected.
    const isLocal = ["localhost", "127.0.0.1", "[::1]"].includes(window.location.hostname);
    if (isLocal) {
      void navigator.serviceWorker.getRegistrations().then((registrations) =>
        Promise.all(registrations
          .filter((registration) => registration.scope.startsWith(window.location.origin + "/"))
          .map((registration) => registration.unregister()))
      ).catch((error) => console.warn("Could not unregister local service worker:", error));

      // Delete only this application's offline cache; do not touch other caches.
      if ("caches" in window) {
        void caches.keys().then((keys) =>
          Promise.all(keys.filter((key) => key.startsWith("exodus-")).map((key) => caches.delete(key)))
        ).catch((error) => console.warn("Could not clear local offline cache:", error));
      }
      return;
    }

    // Offline fallback is only intended for deployed HTTPS builds.
    if (window.location.protocol !== "https:") return;
    void navigator.serviceWorker.register("/sw.js", { scope: "/" })
      .catch((error) => console.warn("Service worker registration failed:", error));
  }, []);

  return null;
}
