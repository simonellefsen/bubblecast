"use client";

import { useEffect, useState } from "react";
import { AddToHomeScreenModal } from "./AddToHomeScreenModal";

/**
 * Mounts the home-screen modal once and also listens for a re-open event
 * (e.g. from Settings).
 */
export function HomeScreenModalHost() {
  const [key, setKey] = useState(0);

  useEffect(() => {
    function onShow() {
      try {
        localStorage.removeItem("bubblecast-homescreen-modal-v1");
      } catch {
        /* ignore */
      }
      setKey((k) => k + 1);
    }
    window.addEventListener("bubblecast:show-homescreen-modal", onShow);
    return () =>
      window.removeEventListener("bubblecast:show-homescreen-modal", onShow);
  }, []);

  return <AddToHomeScreenModal key={key} />;
}
