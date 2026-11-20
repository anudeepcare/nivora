"use client";
import { useEffect } from "react";
import { DAYLIGHT_EVENT, resolvedTheme } from "@/lib/theme-preference";

export default function ThemeDaylightSync() {
  useEffect(() => {
    const update = () => {
      if (document.visibilityState === "hidden") return;
      let saved: string | null = null;
      try {
        saved = localStorage.getItem("auryn-product-theme");
      } catch {}
      if (saved === "daylight") {
        const root = document.documentElement;
        const value = resolvedTheme("daylight", false);
        if (root.dataset.theme !== value) root.dataset.theme = value;
      }
      window.dispatchEvent(new Event(DAYLIGHT_EVENT));
    };
    const timer = window.setInterval(update, 30000);
    window.addEventListener("focus", update);
    window.addEventListener("pageshow", update);
    document.addEventListener("visibilitychange", update);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", update);
      window.removeEventListener("pageshow", update);
      document.removeEventListener("visibilitychange", update);
    };
  }, []);
  return null;
}
