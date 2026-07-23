"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export function NetworkBanner() {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    setOnline(navigator.onLine);
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  if (online) return null;

  return (
    <div
      role="status"
      className="border-b border-amber-300 bg-amber-100 px-4 py-2 text-center text-sm text-amber-950"
    >
      You’re offline.{" "}
      <Link href="/offline" className="font-semibold underline">
        Offline tips
      </Link>
      {" · "}
      Offline cast, free drill, and journal still work on cached pages.
    </div>
  );
}
