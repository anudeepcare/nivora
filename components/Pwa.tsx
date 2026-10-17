"use client";
import { useEffect } from "react";
export default function Pwa() {
  useEffect(() => {
    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {
        /* The online app remains usable if installation is unavailable. */
      });
    }
  }, []);
  return null;
}
