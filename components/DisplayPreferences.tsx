"use client";
import { ResearchModeSwitch } from "./ResearchPreferences";
import { useProduct } from "./Session";
import AppearanceControls from "./AppearanceControls";
export default function DisplayPreferences() {
  const {
    themePreference,
    setTheme,
    textSize,
    setTextSize,
    reduceMotion,
    setReduceMotion,
  } = useProduct();
  return (
    <section
      className="display-preferences"
      aria-label="Appearance and accessibility"
    >
      <header>
        <h3>Make it yours</h3>
        <p>A comfortable view, on every visit.</p>
      </header>
      <div className="setting-row">
        <span>Theme</span>
        <div className="segments" role="group" aria-label="Appearance">
          {(["light", "dark", "system"] as const).map((t) => (
            <button
              type="button"
              key={t}
              aria-pressed={themePreference === t}
              className={themePreference === t ? "active" : ""}
              onClick={() => setTheme(t)}
            >
              {t[0].toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </div>
      <div className="setting-row">
        <span>Text size</span>
        <div className="segments" role="group" aria-label="Text size">
          {(["standard", "large"] as const).map((t) => (
            <button
              type="button"
              key={t}
              aria-pressed={textSize === t}
              className={textSize === t ? "active" : ""}
              onClick={() => setTextSize(t)}
            >
              {t === "large" ? "Larger" : "Standard"}
            </button>
          ))}
        </div>
      </div>
      <div className="setting-row">
        <span>Reduce motion</span>
        <button
          type="button"
          className="motion-switch"
          role="switch"
          aria-label="Reduce motion"
          aria-checked={reduceMotion}
          onClick={() => setReduceMotion(!reduceMotion)}
        >
          <span aria-hidden="true" />
        </button>
      </div>
      <div className="setting-row">
        <span>Research depth</span>
        <ResearchModeSwitch />
      </div>
      <AppearanceControls />
    </section>
  );
}
