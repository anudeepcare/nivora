"use client";
import AppearanceControls from "./AppearanceControls";
import Link from "next/link";
import ResearchPreferenceControls from "./ResearchPreferences";
import { useState, type RefObject } from "react";
import { ArrowRight, X, LogOut } from "lucide-react";
import { useProduct } from "./Session";
import { authClient } from "@/lib/client";

export default function SettingsSheet({
  dialog,
}: {
  dialog: RefObject<HTMLDialogElement | null>;
}) {
  const {
    demo,
    themePreference,
    setTheme,
    textSize,
    setTextSize,
    reduceMotion,
    setReduceMotion,
  } = useProduct();
  const [error, setError] = useState("");
  const prefix = demo ? "/preview" : "";
  return (
    <dialog
      ref={dialog}
      className="dialog settings-sheet"
      aria-labelledby="settings-title"
      onClick={(e) => {
        if (e.target !== e.currentTarget) return;
        const r = e.currentTarget.getBoundingClientRect();
        if (
          e.clientX < r.left ||
          e.clientX > r.right ||
          e.clientY < r.top ||
          e.clientY > r.bottom
        )
          e.currentTarget.close();
      }}
    >
      <header className="dialog-head">
        <h2 id="settings-title">Settings</h2>
        <button
          className="icon-button"
          aria-label="Close settings"
          onClick={() => dialog.current?.close()}
        >
          <X size={21} />
        </button>
      </header>
      <div className="dialog-body">
        <div className="setting-row">
          <span>Appearance</span>
          <div className="segments" aria-label="Appearance">
            {(["light", "dark", "system"] as const).map((t) => (
              <button
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
          <div className="segments" aria-label="Text size">
            {(["standard", "large"] as const).map((t) => (
              <button
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
            className="toggle"
            aria-label="Reduce motion"
            aria-pressed={reduceMotion}
            onClick={() => setReduceMotion(!reduceMotion)}
          >
            <i />
          </button>
        </div>
        <AppearanceControls />
        <details className="settings-research"><summary>Research preferences</summary><ResearchPreferenceControls /></details>
        {[
          ["settings", "Account & security"],
          ["alerts", "Alerts"],
          ["help", "Help"],
        ].map(([path, label]) => (
          <Link
            key={path}
            className="setting-row action"
            href={`${prefix}/${path}`}
            onNavigate={() => dialog.current?.close()}
          >
            <span>{label}</span>
            <ArrowRight size={18} />
          </Link>
        ))}
        <button
          className="setting-row action negative"
          onClick={async () => {
            if (demo) {
              setError("Account actions are disabled in the design preview.");
              return;
            }
            const { error } = await authClient().auth.signOut();
            if (error) setError(error.message);
          }}
        >
          <span>Sign out</span>
          <LogOut size={18} />
        </button>
        <nav className="settings-legal" aria-label="Legal and methodology"><Link href="/methodology" onNavigate={()=>dialog.current?.close()}>Methodology</Link><Link href="/terms" onNavigate={()=>dialog.current?.close()}>Terms</Link><Link href="/privacy" onNavigate={()=>dialog.current?.close()}>Privacy</Link></nav>
        {error && (
          <p role="alert" className="negative">
            {error}
          </p>
        )}
      </div>
    </dialog>
  );
}
