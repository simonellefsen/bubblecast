"use client";

import { useEffect } from "react";

/**
 * Registers the Bubblecast offline app shell service worker and warms
 * key routes after install so offline cast / drill stay reachable.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;
    // Local dev: SW can make HMR confusing — only enable on production builds
    // or when explicitly forced.
    const allow =
      process.env.NODE_ENV === "production" ||
      window.localStorage.getItem("bubblecast-sw-dev") === "1";
    if (!allow) return;

    let cancelled = false;

    (async () => {
      try {
        const reg = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
        });
        if (cancelled) return;

        // Warm shell once controlling
        const warm = () => {
          const sw = navigator.serviceWorker.controller;
          if (sw) sw.postMessage({ type: "WARM_SHELL" });
        };

        if (reg.active) warm();
        reg.addEventListener("updatefound", () => {
          const installing = reg.installing;
          if (!installing) return;
          installing.addEventListener("statechange", () => {
            if (installing.state === "installed" && navigator.serviceWorker.controller) {
              // New SW waiting — optional: could toast "Refresh for update"
            }
          });
        });

        navigator.serviceWorker.ready.then(() => warm());
      } catch {
        /* registration optional */
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
