"use client";
import { useSyncExternalStore } from "react";
import { preferenceStore } from "@/lib/preference-store";
import { useProduct, useResource } from "./Session";
import { api } from "@/lib/client";
import { workspacePreferences } from "@/lib/workspace-preferences";
export function useWorkspacePreferences() {
  const { demo, owner, cache } = useProduct();
  const resource = useResource<{
    documents: { key: string; body: { preferences?: unknown } }[];
  }>("documents?kind=view", demo ? { documents: [] } : undefined);
  const store = preferenceStore(cache, owner);
  const state = useSyncExternalStore(
    store.subscribe,
    store.snapshot,
    store.snapshot,
  );
  const saved = resource.data?.documents.find(
    (d) => d.key === "workspace-preferences",
  )?.body.preferences;
  const preferences = state.value ?? workspacePreferences(saved);
  async function save(patch: Partial<ReturnType<typeof workspacePreferences>>) {
    try {
      await store.save(patch, saved, async (next) => {
        if (demo) throw Error("Sign in to save preferences across devices.");
        if (!resource.data || resource.error)
          throw Error("Load saved preferences before making changes.");
        await api("documents", {
          kind: "view",
          key: "workspace-preferences",
          body: { name: "Workspace preferences", preferences: next },
        });
        resource.refresh();
      });
    } catch {
      /* Store exposes the error to every mounted control. */
    }
  }
  return {
    preferences,
    save,
    saving: state.busy,
    error: state.error || resource.error,
    ready: !!resource.data && !resource.error,
    owner,
    localOnly: !!demo,
  };
}
export default function WorkspacePreferences() {
  const {
    preferences: p,
    save,
    saving,
    error,
    ready,
  } = useWorkspacePreferences();
  const disabled = saving || !ready;
  return (
    <section className="research-preferences">
      <h3>Across your devices</h3>
      <p className="small muted">
        Saved to your account. New research views use these defaults.
      </p>
      <label>
        Default chart period
        <select
          disabled={disabled}
          value={p.chartRange}
          onChange={(e) => void save({ chartRange: e.target.value })}
        >
          {["1D", "1W", "1M", "3M", "6M", "1Y", "5Y"].map((v) => (
            <option key={v}>{v}</option>
          ))}
        </select>
      </label>
      <label>
        Watchlist order
        <select
          disabled={disabled}
          value={p.watchSort}
          onChange={(e) => void save({ watchSort: e.target.value })}
        >
          <option value="name">Company symbol</option>
          <option value="change">Price change</option>
          <option value="review">Review date</option>
          <option value="event">Upcoming earnings</option>
        </select>
      </label>
      <fieldset>
        <legend>Overview evidence cards</legend>
        {[
          ["business", "Business"],
          ["valuation", "Valuation"],
          ["price", "Technical conditions"],
          ["ownership", "Ownership"],
        ].map(([value, label]) => (
          <label key={value}>
            <input
              type="checkbox"
              disabled={disabled}
              checked={p.visibleMetrics.includes(value)}
              onChange={(e) =>
                void save({
                  visibleMetrics: e.target.checked
                    ? [...p.visibleMetrics, value]
                    : p.visibleMetrics.filter((v) => v !== value),
                })
              }
            />
            {label}
          </label>
        ))}
      </fieldset>
      <label>
        Single-position attention threshold
        <select
          disabled={disabled}
          value={p.concentrationLimit ?? ""}
          onChange={(e) =>
            void save({
              concentrationLimit: e.target.value
                ? Number(e.target.value)
                : null,
            })
          }
        >
          <option value="">Off</option>
          {[10, 15, 20, 25, 30, 40, 50].map((v) => (
            <option key={v} value={v}>
              {v}% of priced investments
            </option>
          ))}
        </select>
      </label>
      <small>
        This is your review threshold, not an allocation recommendation.
      </small>
      {saving && <p role="status">Saving preferences…</p>}
      {error && <p role="alert">{error}</p>}
    </section>
  );
}
