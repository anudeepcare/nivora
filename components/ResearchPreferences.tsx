"use client";
import { useMemo, useSyncExternalStore } from "react";
import {
  DEFAULT_RESEARCH_PREFERENCES,
  sanitizeResearchPreferences,
  type ResearchPreferences,
} from "@/lib/research-preferences";
const KEY = "auryn-research-preferences-v1",
  EVENT = "auryn-research-preferences";
function subscribe(fn: () => void) {
  window.addEventListener("storage", fn);
  window.addEventListener(EVENT, fn);
  return () => {
    window.removeEventListener("storage", fn);
    window.removeEventListener(EVENT, fn);
  };
}
function snapshot() {
  try {
    return localStorage.getItem(KEY) || "";
  } catch {
    return "";
  }
}
export function useResearchPreferences() {
  const raw = useSyncExternalStore(subscribe, snapshot, () => ""),
    preferences = useMemo(() => {
      try {
        return sanitizeResearchPreferences(JSON.parse(raw));
      } catch {
        return DEFAULT_RESEARCH_PREFERENCES;
      }
    }, [raw]);
  const setPreferences = (patch: Partial<ResearchPreferences>) => {
    try {
      const current = sanitizeResearchPreferences(
        JSON.parse(snapshot() || "{}"),
      );
      localStorage.setItem(
        KEY,
        JSON.stringify(sanitizeResearchPreferences({ ...current, ...patch })),
      );
      window.dispatchEvent(new Event(EVENT));
    } catch {
      /* Storage may be disabled by the browser. */
    }
  };
  return { preferences, setPreferences };
}
export default function ResearchPreferenceControls() {
  const { preferences: p, setPreferences } = useResearchPreferences();
  return (
    <section className="research-preferences">
      <h3>Make research yours</h3>
      <p className="muted small">
        Saved on this device. These choices change the presentation and
        screening blend, not the company evidence.
      </p>
      <label>
        Research style
        <select
          value={p.style}
          onChange={(e) =>
            setPreferences({
              style: e.target.value as ResearchPreferences["style"],
            })
          }
        >
          {["Balanced", "Value", "Growth", "Income", "Quality"].map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </label>
      <label>
        Primary horizon
        <select
          value={p.horizon}
          onChange={(e) =>
            setPreferences({
              horizon: e.target.value as ResearchPreferences["horizon"],
            })
          }
        >
          <option value="long">Long-term business</option>
          <option value="swing">Swing timing</option>
        </select>
      </label>
    </section>
  );
}

export function ResearchModeSwitch() {
  const { preferences: p, setPreferences } = useResearchPreferences();
  return (
    <div
      className="segments research-mode"
      role="group"
      aria-label="Research depth"
    >
      {(["essential", "advanced"] as const).map((mode) => (
        <button
          type="button"
          key={mode}
          title={mode === "essential" ? "Full overview with concise explanations" : "Same overview with expanded evidence checks and valuation workings"}
          aria-pressed={p.detail === mode}
          className={p.detail === mode ? "active" : ""}
          onClick={() => setPreferences({ detail: mode })}
        >
          {mode === "essential" ? "Simple" : "Detailed"}
        </button>
      ))}
    </div>
  );
}
