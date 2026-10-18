"use client";
import { useEffect } from "react";
import { visibleViewport, keyboardInset } from "@/lib/mobile-viewport";
export default function Pwa() {
  useEffect(() => {
    const viewport = window.visualViewport;
    const update = () => {
      const visible = visibleViewport(viewport, window.innerHeight);
      document.documentElement.style.setProperty(
        "--visual-height",
        `${visible.height}px`,
      );
      document.documentElement.style.setProperty(
        "--keyboard-bottom",
        `${keyboardInset(viewport, window.innerHeight)}px`,
      );
      document.documentElement.style.setProperty(
        "--visual-top",
        `${visible.top}px`,
      );
    };
    update();
    viewport?.addEventListener("resize", update);
    viewport?.addEventListener("scroll", update);
    window.addEventListener("resize", update);
    return () => {
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
