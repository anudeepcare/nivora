"use client";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  analyticsPath,
  safeAnalyticsEvent,
  validMeasurementId,
} from "@/lib/analytics-policy";
import { SITE_URL } from "@/lib/site-metadata";
const KEY = "auryn-analytics-consent-v1";
const ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "";
type AnalyticsWindow = Window & {
  dataLayer?: unknown[];
  gtag?: (...args: unknown[]) => void;
  [key: `ga-disable-${string}`]: boolean | undefined;
};
export function PrivacyChoices() {
  return (
    <button
      type="button"
      className="text-link"
      onClick={() => window.dispatchEvent(new Event("auryn:privacy"))}
    >
      Analytics preferences
    </button>
  );
}
export default function AnalyticsConsent() {
  const pathname = usePathname(),
    path = analyticsPath(pathname);
  const [choice, setChoice] = useState<string | null>(null),
    [open, setOpen] = useState(false),
    [loaded, setLoaded] = useState(false);
  const measuredLcp = useRef(false);
  const last = useRef<string | null>(null),
    pathRef = useRef(path);
  pathRef.current = path;
  const enabled = validMeasurementId(ID);
  useEffect(() => {
    let value = null;
    try {
      value = localStorage.getItem(KEY);
    } catch {}
    setChoice(value);
    setOpen(enabled && value !== "accepted" && value !== "declined");
    const show = () => setOpen(true);
    window.addEventListener("auryn:privacy", show);
    return () => window.removeEventListener("auryn:privacy", show);
  }, [enabled]);
  function choose(value: "accepted" | "declined") {
    try {
      localStorage.setItem(KEY, value);
    } catch {}
    const w = window as unknown as AnalyticsWindow;
    w[`ga-disable-${ID}`] = value !== "accepted";
    if (value === "declined") {
      w.gtag?.("consent", "update", { analytics_storage: "denied" });
      for (const item of document.cookie.split(";")) {
        const name = item.split("=")[0].trim();
        if (/^_ga(?:_|$)/.test(name)) {
          for (const domain of ["", location.hostname, ".auryninvest.com"])
            document.cookie = `${name}=; Max-Age=0; Path=/;${domain ? ` Domain=${domain};` : ""} SameSite=Lax`;
        }
      }
      last.current = null;
    }
    setChoice(value);
    setOpen(false);
  }
  useEffect(() => {
    if (!enabled || choice !== "accepted" || path === null) return;
    const w = window as unknown as AnalyticsWindow;
    w[`ga-disable-${ID}`] = false;
    if (w.gtag) {
      w.gtag("consent", "update", { analytics_storage: "granted" });
      setLoaded(true);
      return;
    }
    w.dataLayer = w.dataLayer || [];
    w.gtag = function () {
      w.dataLayer!.push(arguments);
    };
    w.gtag("consent", "default", {
      analytics_storage: "granted",
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
    });
    w.gtag("js", new Date());
    w.gtag("config", ID, {
      send_page_view: false,
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
      page_location: SITE_URL + path,
      page_referrer: "",
      page_title: "AURYN",
    });
    const script = document.createElement("script");
    script.id = "auryn-ga";
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${ID}`;
    script.onload = () => setLoaded(true);
    document.head.appendChild(script);
  }, [choice, enabled, path]);
  useEffect(() => {
    if (choice !== "accepted" || !loaded || path === null) return;
    const w = window as unknown as AnalyticsWindow;
    const send = (name: string, params: Record<string, unknown> = {}) =>
      w.gtag?.("event", name, {
        ...params,
        page_location: SITE_URL + pathRef.current,
        page_referrer: "",
        page_title: "AURYN",
        send_to: ID,
      });
    if (last.current !== path) {
      send("page_view");
      last.current = path;
      if (path === "/pricing" || path === "/plans") send("plans_view");
      if (path === "/research") send("research_open");
    }
    const event = (e: Event) => {
      const d = (e as CustomEvent).detail;
      const safe = safeAnalyticsEvent(d?.name, d?.params);
      if (safe && pathRef.current) send(safe.name, safe.params);
    };
    // Bucketed timings only; no element text, target URLs, account IDs or raw navigation URLs.
    const observer =
      typeof PerformanceObserver === "undefined" || measuredLcp.current
        ? null
        : new PerformanceObserver((list) => {
            const e = list.getEntries().at(-1);
            if (e && !measuredLcp.current) {
              measuredLcp.current = true;
              send("page_performance", {
                metric: "LCP",
                rating:
                  e.startTime <= 2500
                    ? "good"
                    : e.startTime <= 4000
                      ? "needs-improvement"
                      : "poor",
              });
            }
          });
    try {
      observer?.observe({ type: "largest-contentful-paint", buffered: true });
    } catch {}
    window.addEventListener("auryn:analytics", event);
    const click = (e: MouseEvent) => {
      const a = (e.target as Element)?.closest?.("a");
      if (a?.getAttribute("href") === "/login?mode=signup")
        send("signup_start");
    };
    document.addEventListener("click", click);
    return () => {
      observer?.disconnect();
      window.removeEventListener("auryn:analytics", event);
      document.removeEventListener("click", click);
    };
  }, [choice, loaded, path]);
  if (!open || pathname.startsWith("/preview")) return null;
  return (
    <aside className="analytics-consent" aria-label="Analytics preferences">
      <div>
        <strong>Your analytics choice</strong>
        <p>
          {enabled
            ? "Allow optional usage measurement to help improve AURYN. Research queries, tickers, holdings and contact messages are excluded."
            : "Optional analytics are not configured. Your preference can still be saved."}{" "}
          <Link href="/privacy">Privacy details</Link>
        </p>
      </div>
      <div className="consent-actions">
        <button className="button secondary" onClick={() => choose("declined")}>
          Decline
        </button>
        <button className="button" onClick={() => choose("accepted")}>
          Allow analytics
        </button>
      </div>
    </aside>
  );
}
