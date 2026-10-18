"use client";
import { useEffect } from "react";
import { createViewportUpdater } from "@/lib/mobile-viewport";
export default function Pwa() {
  useEffect(() => {
    const viewport = window.visualViewport;
    const write = createViewportUpdater((name, value) =>
      document.documentElement.style.setProperty(name, value),
    );
    let frame = 0;
    const update = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        write(viewport, window.innerHeight);
      });
    };
    update();
    viewport?.addEventListener("resize", update);
    viewport?.addEventListener("scroll", update);
    window.addEventListener("resize", update);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      viewport?.removeEventListener("resize", update);
      viewport?.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);
  useEffect(() => {
    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {
        /* The online app remains usable if installation is unavailable. */
      });
    }
  }, []);
  return null;
}
