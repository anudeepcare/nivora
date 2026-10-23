"use client";
import { useAccess } from "./Access";
import DisplayPreferences from "./DisplayPreferences";
import Link from "next/link";
import ResearchPreferenceControls from "./ResearchPreferences";
import { useState, type RefObject } from "react";
import { ArrowRight, X, LogOut } from "lucide-react";
import { useProduct } from "./Session";
import { signOutAndRedirect } from "@/lib/client";

export default function SettingsSheet({
  dialog,
}: {
  dialog: RefObject<HTMLDialogElement | null>;
}) {
  const { demo } = useProduct();
  const { access } = useAccess();
  const [error, setError] = useState("");
  const [section, setSection] = useState("appearance"),
    [signingOut, setSigningOut] = useState(false);
  const prefix = demo && demo.routePrefix !== "" ? "/preview" : "";
  return (
    <dialog
      ref={dialog}
      className="dialog preferences-sheet"
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
        <h2 id="settings-title" tabIndex={-1}>
          Settings
        </h2>
        <button
          className="icon-button"
          aria-label="Close settings"
          onClick={() => dialog.current?.close()}
        >
          <X size={21} />
        </button>
      </header>
      <Link
        className="settings-plan-entry"
        href={`${prefix}/plans`}
        onNavigate={() => dialog.current?.close()}
      >
        <strong>Membership</strong>
        <ArrowRight size={18} />
      </Link>
      {access.owner && !prefix && (
        <Link
          className="settings-plan-entry"
          href="/owner"
          onNavigate={() => dialog.current?.close()}
        >
          <span>
            <strong>Admin controls</strong>
            <small>People, features and payments</small>
          </span>
          <ArrowRight size={18} />
        </Link>
      )}
      <nav className="settings-sheet-tabs" aria-label="Settings sections">
        {[
          ["appearance", "Appearance"],
          ["research", "Research"],
          ["account", "Account"],
        ].map(([id, label]) => (
          <button
            type="button"
            key={id}
            aria-pressed={section === id}
            aria-controls={`settings-${id}`}
            onClick={() => setSection(id)}
          >
            {label}
          </button>
        ))}
      </nav>
      <div className="dialog-body settings-clean-body">
        <section id="settings-appearance" hidden={section !== "appearance"}>
          <DisplayPreferences />
        </section>
        <section id="settings-research" hidden={section !== "research"}>
          <h3>Your research, your way.</h3>
          <ResearchPreferenceControls />
        </section>
        <section
          id="settings-account"
          hidden={section !== "account"}
          className="sheet-account"
        >
          <h3>Account & support</h3>
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
            disabled={signingOut}
            onClick={async () => {
              if (demo && demo.routePrefix !== "") {
                setError("Account actions are disabled in the design preview.");
                return;
              }
              setSigningOut(true);
              try {
                await signOutAndRedirect();
              } catch (error) {
                setError(
                  error instanceof Error
                    ? error.message
                    : "Could not sign out. Please try again.",
                );
                setSigningOut(false);
              }
            }}
          >
            <span>{signingOut ? "Signing out…" : "Sign out"}</span>
            <LogOut size={18} />
          </button>
          <nav className="settings-legal" aria-label="Legal and methodology">
            <Link
              href="/methodology"
              onNavigate={() => dialog.current?.close()}
            >
              Methodology
            </Link>
            <Link href="/terms" onNavigate={() => dialog.current?.close()}>
              Terms
            </Link>
            <Link href="/privacy" onNavigate={() => dialog.current?.close()}>
              Privacy
            </Link>
          </nav>
        </section>
        {error && (
          <p role="alert" className="negative">
            {error}
          </p>
        )}
      </div>
    </dialog>
  );
}
