"use client";
import { useEffect } from "react";
import {
  createViewportUpdater,
  softwareKeyboardOpen,
} from "@/lib/mobile-viewport";
export default function Pwa() {
  useEffect(() => {
    const viewport = window.visualViewport;
    const write = createViewportUpdater((name, value) =>
      document.documentElement.style.setProperty(name, value),
    );
    let frame = 0;
    let fullHeight = Math.max(viewport?.height ?? 0, window.innerHeight);
    let fullWidth = window.innerWidth;
    const update = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        write(viewport, window.innerHeight);
        const active = document.activeElement;
        const editable =
          active instanceof HTMLElement &&
          (active.isContentEditable ||
            active.matches(
              'textarea, input:not([type="button"]):not([type="submit"]):not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([type="file"]):not([type="color"])',
            ));
        const height = viewport?.height ?? window.innerHeight;
        if (window.innerWidth !== fullWidth) {
          fullWidth = window.innerWidth;
          fullHeight = Math.max(window.innerHeight, height);
        } else if (!editable || height > fullHeight) {
          fullHeight = Math.max(fullHeight, height);
        }
        document.documentElement.classList.toggle(
          "keyboard-open",
          softwareKeyboardOpen(editable, fullHeight, height),
        );
      });
    };
    update();
    viewport?.addEventListener("resize", update);
    viewport?.addEventListener("scroll", update);
    window.addEventListener("resize", update);
    document.addEventListener("focusin", update);
    document.addEventListener("focusout", update);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      viewport?.removeEventListener("resize", update);
      viewport?.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      document.removeEventListener("focusin", update);
      document.removeEventListener("focusout", update);
      document.documentElement.classList.remove("keyboard-open");
    };
  }, []);
  useEffect(() => {
    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {
        /* The online app remains usable if installation is unavailable. */
      });
    }
  }, []);
  useEffect(() => {
    const syncThemeColor = () => {
      const dark = document.documentElement?.dataset?.theme === "dark";
      const color = dark ? "#171b24" : "#f2f4f7";
      document.querySelectorAll?.('meta[name="theme-color"]').forEach((meta) => meta.setAttribute("content", color));
    };
    syncThemeColor();
    if (typeof MutationObserver === "undefined" || !document.documentElement) return;
    const observer = new MutationObserver(syncThemeColor);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme", "data-accent"] });
    return () => observer.disconnect();
  }, []);
  return null;
}
