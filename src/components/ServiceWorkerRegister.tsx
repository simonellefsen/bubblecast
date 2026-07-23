"use client";

import { useEffect, useState } from "react";

/**
 * Registers the Bubblecast offline app shell service worker and warms
 * key routes after install so offline cast / drill stay reachable.
 * Shows a small toast when a new worker is waiting.
 */
export function ServiceWorkerRegister() {
  const [updateReady, setUpdateReady] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;
    const allow =
      process.env.NODE_ENV === "production" ||
      window.localStorage.getItem("bubblecast-sw-dev") === "1";
    if (!allow) return;

    let cancelled = false;
    let waitingWorker: ServiceWorker | null = null;

    (async () => {
      try {
        const reg = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
        });
        if (cancelled) return;

        const warm = () => {
          const sw = navigator.serviceWorker.controller;
          if (sw) sw.postMessage({ type: "WARM_SHELL" });
        };

        if (reg.active) warm();
        navigator.serviceWorker.ready.then(() => warm());

        const onUpdateFound = () => {
          const installing = reg.installing;
          if (!installing) return;
          installing.addEventListener("statechange", () => {
            if (
              installing.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              waitingWorker = reg.waiting ?? installing;
              setUpdateReady(true);
            }
          });
        };
        reg.addEventListener("updatefound", onUpdateFound);

        if (reg.waiting && navigator.serviceWorker.controller) {
          waitingWorker = reg.waiting;
          setUpdateReady(true);
        }

        // Poll for updates occasionally
        const interval = window.setInterval(() => {
          void reg.update().catch(() => undefined);
        }, 60 * 60 * 1000);

        return () => {
          reg.removeEventListener("updatefound", onUpdateFound);
          window.clearInterval(interval);
        };
      } catch {
        /* registration optional */
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  if (!updateReady) return null;

  return (
    <div
      role="status"
      className="fixed bottom-4 left-1/2 z-50 w-[min(100%-1.5rem,24rem)] -translate-x-1/2 rounded-2xl border border-orange-200 bg-white px-4 py-3 text-sm shadow-lg"
    >
      <p className="font-medium text-slate-900">App update ready</p>
      <p className="mt-0.5 text-xs text-slate-500">
        Refresh to load the latest Bubblecast shell.
      </p>
      <div className="mt-2 flex gap-2">
        <button
          type="button"
          className="rounded-full bg-orange-500 px-3 py-1.5 text-xs font-semibold text-white"
          onClick={() => {
            navigator.serviceWorker.controller?.postMessage({
              type: "SKIP_WAITING",
            });
            // If waiting worker exists, tell it to activate
            navigator.serviceWorker.getRegistration().then((reg) => {
              reg?.waiting?.postMessage({ type: "SKIP_WAITING" });
              window.location.reload();
            });
          }}
        >
          Refresh now
        </button>
        <button
          type="button"
          className="rounded-full border px-3 py-1.5 text-xs font-medium text-slate-600"
          onClick={() => setUpdateReady(false)}
        >
          Later
        </button>
      </div>
    </div>
  );
}
