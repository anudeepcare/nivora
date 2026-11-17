"use client";
import { useRef, useState } from "react";
import { api } from "@/lib/client";
import {
  cleanSavedScenario,
  matchingSavedScenario,
  type SavedScenario,
} from "@/lib/saved-scenarios";
import { useProduct, useResource } from "./Session";
import { dateLabel } from "@/lib/format";
import styles from "./SavedScenarioControls.module.css";
export default function SavedScenarioControls({
  value,
  onRestore,
}: {
  value: SavedScenario;
  onRestore: (saved: SavedScenario) => void;
}) {
  const { owner, demo } = useProduct();
  const currentOwner = useRef(owner);
  currentOwner.current = owner;
  const [result, setResult] = useState<{
    owner: string;
    message: string;
    error?: boolean;
    value?: SavedScenario;
  } | null>(null);
  const [savingOwner, setSavingOwner] = useState<string | null>(null);
  const resource = useResource<{
    documents: { key: string; body: { scenarioCase?: unknown } }[];
  }>("documents?kind=view", demo ? { documents: [] } : undefined);
  const key = `scenario:${value.symbol}`;
  const stored = resource.data?.documents.find((d) => d.key === key)?.body
    .scenarioCase;
  const saved = matchingSavedScenario(
    result?.owner === owner && result.value ? result.value : stored,
    value.symbol,
    value.currency,
  );
  const saving = savingOwner === owner;
  const ready = !demo && !!owner && !!resource.data && !resource.error;
  async function save() {
    if (!ready || saving) return;
    const initiatingOwner = owner;
    setSavingOwner(owner);
    setResult(null);
    try {
      const clean = cleanSavedScenario({
        ...value,
        savedAt: new Date().toISOString(),
      });
      await api("documents", {
        kind: "view",
        key,
        body: {
          name: `${clean.symbol} custom earnings case`,
          symbols: [clean.symbol],
          scenarioCase: clean,
        },
      });
      if (currentOwner.current !== initiatingOwner) return;
      setResult({
        owner: initiatingOwner,
        message: "Custom case saved to your account.",
        value: clean,
      });
      resource.refresh();
    } catch {
      if (currentOwner.current === initiatingOwner)
        setResult({
          owner: initiatingOwner,
          error: true,
          message:
            "Could not save this case. Check the assumptions and your connection, then try again.",
        });
    } finally {
      if (currentOwner.current === initiatingOwner) setSavingOwner(null);
    }
  }
  return (
    <section className={styles.root} aria-label="Saved custom scenario">
      <div>
        <strong>Your custom case</strong>
        <p>
          Save the horizon and assumptions, not a price promise. Restoring
          applies them to this report’s current revenue and share baseline.
        </p>
      </div>
      <div className={styles.actions}>
        <button
          type="button"
          className="button"
          disabled={!ready || saving}
          onClick={() => void save()}
        >
          {saving
            ? "Saving…"
            : saved
              ? "Replace saved custom case"
              : "Save custom case"}
        </button>
        {saved && (
          <button
            type="button"
            className="button secondary"
            disabled={saving || !ready}
            onClick={() => {
              onRestore(saved);
              setResult({
                owner,
                message:
                  "Saved assumptions applied to the current reporting baseline.",
                value: saved,
              });
            }}
          >
            Restore saved assumptions
          </button>
        )}
      </div>
      {saved && (
        <p>
          Saved {dateLabel(saved.savedAt)} · {saved.years}-year{" "}
          {saved.selected.toLowerCase()} case · {saved.currency} · source
          baseline {dateLabel(saved.baselineDate)}.
        </p>
      )}
      {demo ? (
        <p>Sign in to save custom cases. Preview changes are not saved.</p>
      ) : resource.error ? (
        <p role="alert">
          Saved cases could not be loaded.{" "}
          <button type="button" onClick={resource.refresh}>
            Try again
          </button>
        </p>
      ) : !resource.data ? (
        <p role="status">Loading saved case…</p>
      ) : null}
      {result?.owner === owner && (
        <p role={result.error ? "alert" : "status"}>{result.message}</p>
      )}
    </section>
  );
}
