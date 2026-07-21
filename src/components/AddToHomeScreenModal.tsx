"use client";

import { useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "bubblecast-homescreen-modal-v1";

type Platform = "ios" | "android" | "desktop" | "unknown";

function detectPlatform(): Platform {
  if (typeof navigator === "undefined") return "unknown";
  const ua = navigator.userAgent || "";
  const isIos =
    /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  if (isIos) return "ios";
  if (/Android/i.test(ua)) return "android";
  if (/Macintosh|Windows|Linux/i.test(ua)) return "desktop";
  return "unknown";
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  const nav = window.navigator as Navigator & { standalone?: boolean };
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    nav.standalone === true
  );
}

export function AddToHomeScreenModal() {
  const [open, setOpen] = useState(false);
  const [platform, setPlatform] = useState<Platform>("unknown");

  useEffect(() => {
    setPlatform(detectPlatform());
    if (isStandalone()) return;
    try {
      const seen = localStorage.getItem(STORAGE_KEY);
      if (!seen) {
        // slight delay so first paint isn't blocked
        const t = window.setTimeout(() => setOpen(true), 700);
        return () => window.clearTimeout(t);
      }
    } catch {
      setOpen(true);
    }
  }, []);

  function dismiss(permanent = true) {
    setOpen(false);
    if (permanent) {
      try {
        localStorage.setItem(STORAGE_KEY, "dismissed");
      } catch {
        /* ignore */
      }
    }
  }

  const steps = useMemo(() => {
    if (platform === "ios") {
      return [
        "Open this site in Safari (not an in-app browser).",
        "Tap the Share button at the bottom (square with an arrow).",
        "Scroll and tap “Add to Home Screen”.",
        "Confirm the name Bubblecast, then tap Add.",
      ];
    }
    if (platform === "android") {
      return [
        "Open this site in Chrome.",
        "Tap the ⋮ menu in the top-right.",
        "Tap “Add to Home screen” or “Install app”.",
        "Confirm to pin Bubblecast on your home screen.",
      ];
    }
    return [
      "Open this URL on your phone’s browser.",
      "Use Share → Add to Home Screen (iPhone) or the browser menu → Add to Home screen (Android).",
      "Launch Bubblecast from the home screen icon for a full-screen, app-like feel.",
    ];
  }, [platform]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="homescreen-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-slate-950/55 backdrop-blur-[2px]"
        aria-label="Close dialog"
        onClick={() => dismiss(true)}
      />
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-orange-100 bg-white shadow-2xl shadow-orange-500/10">
        <div className="bg-gradient-to-br from-orange-500 via-orange-400 to-amber-400 px-5 py-6 text-white">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/30 backdrop-blur">
              {/* mini mark matching favicon */}
              <svg viewBox="0 0 64 64" className="h-8 w-8" aria-hidden>
                <path
                  d="M14 20c0-3 2.5-5.5 5.5-5.5h18c3 0 5.5 2.5 5.5 5.5v12c0 3-2.5 5.5-5.5 5.5H28l-7 6.5c-.8.8-2.2.2-2.2-1V37.5h-1C15.5 37.5 14 35 14 32V20z"
                  fill="white"
                />
                <circle cx="24" cy="26" r="2" fill="#F97316" />
                <circle cx="31" cy="26" r="2" fill="#F97316" />
                <circle cx="38" cy="26" r="2" fill="#F97316" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-50/90">
                Install tip
              </p>
              <h2
                id="homescreen-title"
                className="mt-1 text-xl font-semibold tracking-tight"
              >
                Add Bubblecast to your home screen
              </h2>
            </div>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-orange-50/95">
            Bubblecast feels best as a pocket app. Save this URL to your phone’s
            home screen for one-tap scenes — no app store needed.
          </p>
        </div>

        <div className="space-y-4 px-5 py-5">
          <ol className="space-y-3">
            {steps.map((step, i) => (
              <li key={step} className="flex gap-3 text-sm text-slate-700">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-orange-50 text-xs font-bold text-orange-700">
                  {i + 1}
                </span>
                <span className="pt-0.5 leading-relaxed">{step}</span>
              </li>
            ))}
          </ol>

          {platform === "ios" ? (
            <p className="rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-500">
              Tip: if you opened this from Messages or Instagram, tap{" "}
              <span className="font-medium text-slate-700">···</span> → Open in
              Safari first.
            </p>
          ) : null}

          {platform === "desktop" ? (
            <p className="rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-500">
              You’re on a computer — open this site on your phone, then follow
              the steps above. Bookmark it here in the meantime.
            </p>
          ) : null}

          <div className="flex flex-col gap-2 sm:flex-row-reverse">
            <button
              type="button"
              onClick={() => dismiss(true)}
              className="rounded-full bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-orange-600"
            >
              Got it
            </button>
            <button
              type="button"
              onClick={() => dismiss(true)}
              className="rounded-full border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Don’t show again
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Optional trigger for Settings / footer */
export function openHomeScreenModalAgain() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("bubblecast:show-homescreen-modal"));
  }
}
