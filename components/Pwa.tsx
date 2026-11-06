"use client";
import { recordExperience } from "@/lib/experience-metrics";
import { useEffect, useState } from "react";
import {
  createViewportUpdater,
  softwareKeyboardOpen,
} from "@/lib/mobile-viewport";
export default function Pwa() {
  const [waiting, setWaiting] = useState<ServiceWorker | null>(null);
  const [updating, setUpdating] = useState(false);
  useEffect(() => {
    if (typeof PerformanceObserver === "undefined") return;
    const observers:PerformanceObserver[] = [];
    for (const type of ["longtask", "event", "layout-shift"]) {
      if (!PerformanceObserver.supportedEntryTypes.includes(type)) continue;
      const observer = new PerformanceObserver(list => {
        for(const entry of list.getEntries()) {
          const e = entry as PerformanceEntry & {hadRecentInput?:boolean;value?:number};
          if(!e.hadRecentInput) recordExperience(type,e.duration,e.value);
        }
      });
      observer.observe({type, buffered:true}); observers.push(observer);
    }
    return () => observers.forEach(o => o.disconnect());
  }, []);
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
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    let active=true;
    let cleanup=()=>{};
    navigator.serviceWorker.register("/sw.js", {scope:"/"}).then(registration => {
      if(!active) return;
      const check=()=>{if(active && registration.waiting && navigator.serviceWorker.controller) setWaiting(registration.waiting);};
      const found=()=>{registration.installing?.addEventListener("statechange",check);};
      check(); registration.addEventListener("updatefound",found);
      cleanup=()=>registration.removeEventListener("updatefound",found);
      void registration.update().catch(()=>{});
    }).catch(()=>{});
    return ()=>{active=false;cleanup();};
  }, []);
  useEffect(() => {
    const syncThemeColor = () => {
      const dark = document.documentElement?.dataset?.theme === "dark";
      document.documentElement.style.colorScheme = dark ? "dark" : "light";
      const color = dark ? "#24272b" : "#f7f8f5";
      document.querySelectorAll?.('meta[name="theme-color"]').forEach((meta) => meta.setAttribute("content", color));
    };
    syncThemeColor();
    if (typeof MutationObserver === "undefined" || !document.documentElement) return;
    const observer = new MutationObserver(syncThemeColor);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme", "data-accent"] });
    return () => observer.disconnect();
  }, []);
  if (!waiting) return null;
  return <aside className="app-update-notice" role="status">
    <span>An AURYN update is ready. Save your work before reloading.</span>
    <button type="button" disabled={updating} onClick={() => {
      setUpdating(true);
      navigator.serviceWorker.addEventListener("controllerchange", () => window.location.reload(), {once:true});
      waiting.postMessage({type:"ACTIVATE_UPDATE"});
    }}>{updating ? "Updating…" : "Update & reload"}</button>
    <button type="button" disabled={updating} onClick={()=>setWaiting(null)}>Later</button>
  </aside>;

}
