"use client";
import { useState } from "react";

/** Opt-in geometry only: no account, position, token or page-content collection. */
export default function PwaDiagnostics() {
  const [report, setReport] = useState("");
  function inspect() {
    const viewport = window.visualViewport;
    const bounds: Record<string, unknown> = {};
    for (const selector of [
      ".product",
      ".topbar",
      ".brand",
      ".top-search",
      ".content",
      ".mobile-dock",
    ]) {
      const element = document.querySelector(selector);
      if (!element) continue;
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      bounds[selector] = {
        top: Math.round(rect.top),
        bottom: Math.round(rect.bottom),
        left: Math.round(rect.left),
        right: Math.round(rect.right),
        position: style.position,
        display: style.display,
        paddingTop: style.paddingTop,
        overflow: style.overflow,
      };
    }
    setReport(
      JSON.stringify(
        {
          version: "viewport-audit-20261018-keyboard",
          screen: {
            width: screen.width,
            height: screen.height,
            pixelRatio: devicePixelRatio,
          },
          keyboardOpen:
            document.documentElement.classList.contains("keyboard-open"),
          standalone:
            matchMedia("(display-mode: standalone)").matches ||
            (navigator as Navigator & { standalone?: boolean }).standalone ===
              true,
          layout: {
            width: innerWidth,
            height: innerHeight,
            documentScroll: document.scrollingElement?.scrollTop,
          },
          visual: viewport
            ? {
                width: viewport.width,
                height: viewport.height,
                top: viewport.offsetTop,
                left: viewport.offsetLeft,
                scale: viewport.scale,
              }
            : null,
          bounds,
        },
        null,
        2,
      ),
    );
  }
  return (
    <details className="device-diagnostics">
      <summary>Device layout diagnostics</summary>
      <p>
        Run inside the installed app while the layout issue is present. This
        records viewport and control geometry only.
      </p>
      <button className="button" onClick={inspect}>
        Check app layout
      </button>
      {report && (
        <pre
          tabIndex={0}
          style={{
            whiteSpace: "pre-wrap",
            overflowWrap: "anywhere",
            fontSize: 12,
            marginTop: 16,
          }}
        >
          {report}
        </pre>
      )}
    </details>
  );
}
